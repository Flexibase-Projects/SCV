-- =====================================================
-- Corrige recursão: o trigger recalc fazia UPDATE na mesma
-- tabela, disparando o trigger de novo → stack depth exceeded.
-- 1) recalc_km_por_litro_veiculo marca sessão (app.inside_recalc_km)
-- 2) trigger ignora quando essa marca está ativa
-- 3) guarda adicional: UPDATE que só muda km_por_litro não reentra
--
-- Se a aplicação usar Supabase LOCAL (ex.: 192.168.1.220:54321),
-- execute este arquivo no SQL Editor do Studio local:
--   http://192.168.1.220:54323 → SQL Editor → colar e executar
-- =====================================================

-- Marcar sessão durante o recalc para o trigger não reentrar
CREATE OR REPLACE FUNCTION public.recalc_km_por_litro_veiculo(p_veiculo_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_veiculo_id IS NULL THEN
    RETURN;
  END IF;
  PERFORM set_config('app.inside_recalc_km', '1', true);
  BEGIN
    UPDATE abastecimentos a
    SET km_por_litro = c.km_por_litro_calc
    FROM (
      SELECT
        id,
        CASE
          WHEN km_anterior IS NULL THEN NULL
          WHEN km_inicial < km_anterior THEN NULL
          WHEN km_inicial = km_anterior THEN NULL
          WHEN litros > 0 THEN ROUND(((km_inicial - km_anterior)::NUMERIC / litros::NUMERIC), 2)
          ELSE NULL
        END AS km_por_litro_calc
      FROM (
        SELECT
          id,
          km_inicial,
          litros,
          LAG(km_inicial) OVER (
            ORDER BY data ASC, km_inicial ASC, created_at ASC
          ) AS km_anterior
        FROM abastecimentos
        WHERE veiculo_id = p_veiculo_id
      ) ordered
    ) c
    WHERE a.id = c.id;
  EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('app.inside_recalc_km', '', true);
    RAISE;
  END;
  PERFORM set_config('app.inside_recalc_km', '', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalc_km_por_litro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Não reentrar quando o recalc está atualizando a tabela
  IF current_setting('app.inside_recalc_km', true) = '1' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'INSERT' THEN
    PERFORM recalc_km_por_litro_veiculo(NEW.veiculo_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.veiculo_id IS NOT DISTINCT FROM NEW.veiculo_id
       AND OLD.data IS NOT DISTINCT FROM NEW.data
       AND OLD.km_inicial IS NOT DISTINCT FROM NEW.km_inicial
       AND OLD.litros IS NOT DISTINCT FROM NEW.litros
       AND (OLD.km_por_litro IS DISTINCT FROM NEW.km_por_litro) THEN
      RETURN NEW;
    END IF;
    PERFORM recalc_km_por_litro_veiculo(NEW.veiculo_id);
    IF OLD.veiculo_id IS DISTINCT FROM NEW.veiculo_id THEN
      PERFORM recalc_km_por_litro_veiculo(OLD.veiculo_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalc_km_por_litro_veiculo(OLD.veiculo_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.trigger_recalc_km_por_litro() IS
  'Recalcula km_por_litro por veículo. Não reentra quando app.inside_recalc_km=1 ou quando só km_por_litro mudou.';
