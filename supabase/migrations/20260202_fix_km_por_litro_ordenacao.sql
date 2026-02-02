-- =====================================================
-- CORREÇÃO: Cálculo de KM/L com Ordenação Correta
-- Problema: Múltiplos abastecimentos no mesmo dia não eram
-- ordenados corretamente, resultando em KM/L=0
-- Solução: Ordenar por data ASC, km_inicial ASC, created_at ASC
-- =====================================================

-- Recalcular km_por_litro para todos os abastecimentos usando ordenação correta
WITH ordered_abastecimentos AS (
  SELECT 
    id,
    veiculo_id,
    data,
    km_inicial,
    litros,
    LAG(km_inicial) OVER (
      PARTITION BY veiculo_id 
      ORDER BY data ASC, km_inicial ASC, created_at ASC
    ) as km_anterior
  FROM abastecimentos
),
calculated AS (
  SELECT 
    id,
    CASE 
      WHEN km_anterior IS NULL THEN NULL  -- Primeiro abastecimento do veículo
      WHEN km_inicial < km_anterior THEN NULL  -- KM inválido (menor que anterior)
      WHEN km_inicial = km_anterior THEN NULL  -- KM igual = não calcular (múltiplos abastecimentos mesmo KM)
      WHEN litros > 0 THEN ROUND(((km_inicial - km_anterior)::NUMERIC / litros::NUMERIC), 2)
      ELSE NULL
    END as km_por_litro_calc
  FROM ordered_abastecimentos
)
UPDATE abastecimentos a
SET km_por_litro = c.km_por_litro_calc
FROM calculated c
WHERE a.id = c.id;

-- Comentário explicativo
COMMENT ON COLUMN abastecimentos.km_por_litro IS 'KM por litro calculado com base na diferença de KM desde o último abastecimento dividido pelos litros. Ordenado por data ASC, km_inicial ASC para múltiplos abastecimentos no mesmo dia. NULL quando: primeiro abastecimento, KM inválido, ou KM igual ao anterior.';
