-- =====================================================
-- KM/L: única fonte da verdade no banco + recálculo em cascata
-- - Função recalc_km_por_litro_veiculo(veiculo_id)
-- - Trigger AFTER INSERT/UPDATE/DELETE chama a função
-- =====================================================

CREATE OR REPLACE FUNCTION public.recalc_km_por_litro_veiculo(p_veiculo_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_veiculo_id IS NULL THEN
    RETURN;
  END IF;
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
END;
$$;

COMMENT ON FUNCTION public.recalc_km_por_litro_veiculo(UUID) IS
  'Recalcula km_por_litro de todos os abastecimentos do veículo. Ordenação: data ASC, km_inicial ASC, created_at ASC.';

-- Trigger: após insert/update/delete, recalcula o(s) veículo(s) afetado(s)
CREATE OR REPLACE FUNCTION public.trigger_recalc_km_por_litro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalc_km_por_litro_veiculo(NEW.veiculo_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
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

DROP TRIGGER IF EXISTS trigger_abastecimentos_recalc_km_por_litro ON abastecimentos;
CREATE TRIGGER trigger_abastecimentos_recalc_km_por_litro
  AFTER INSERT OR UPDATE OR DELETE
  ON abastecimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalc_km_por_litro();
