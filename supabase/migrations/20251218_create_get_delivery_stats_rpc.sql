-- Function to calculate delivery statistics serverside
-- Bypasses the API row limit and improves performance
CREATE OR REPLACE FUNCTION get_delivery_stats(
  search_term TEXT DEFAULT NULL,
  date_from TIMESTAMP DEFAULT NULL,
  date_to TIMESTAMP DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  total_count INTEGER;
  total_cost_delivery NUMERIC;
  total_cost_assembly NUMERIC;
  avg_cost_percent NUMERIC;
  base_query TEXT;
BEGIN
  -- Base query construction
  base_query := 'FROM controle_entregas WHERE 1=1';

  -- Add filters dynamically (simulated logic for simple aggregates)
  -- Note: Dynamic SQL is complex for this, let's use a simpler filtered approach with IFs or CASEs isn't ideal for performance on large sets if not careful, 
  -- but better than client side.
  
  -- Actually, let's use a single efficient query with filter conditions
  SELECT 
    COUNT(*),
    COALESCE(SUM(gastos_entrega), 0),
    COALESCE(SUM(gastos_montagem), 0),
    COALESCE(AVG(percentual_gastos), 0)
  INTO 
    total_count,
    total_cost_delivery,
    total_cost_assembly,
    avg_cost_percent
  FROM controle_entregas
  WHERE 
    -- Search Term Filter
    (search_term IS NULL OR 
     cliente ILIKE '%' || search_term || '%' OR 
     pv_foco ILIKE '%' || search_term || '%' OR 
     nf ILIKE '%' || search_term || '%' OR 
     motorista ILIKE '%' || search_term || '%')
    AND
    -- Date Range Filter
    (date_from IS NULL OR data_saida >= date_from::DATE)
    AND
    (date_to IS NULL OR data_saida <= date_to::DATE);

  -- Return as JSON
  RETURN json_build_object(
    'totalEntregas', total_count,
    'custoTotalEntregas', total_cost_delivery,
    'custoTotalMontagem', total_cost_assembly,
    'percentualMedioGastos', avg_cost_percent
  );
END;
$$;
