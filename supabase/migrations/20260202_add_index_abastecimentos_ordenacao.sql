-- =====================================================
-- OTIMIZAÇÃO: Índices Compostos para Performance
-- Cria índices otimizados para queries de abastecimentos
-- =====================================================

-- Índice composto para otimizar busca do último abastecimento por veículo
-- Query pattern: WHERE veiculo_id = X ORDER BY data DESC, km_inicial DESC, created_at DESC
-- Ordem: equality first (veiculo_id), then range (data, km_inicial, created_at)
CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo_data_km_created 
ON abastecimentos(veiculo_id, data DESC, km_inicial DESC, created_at DESC);

-- Índice composto para filtros por condutor + data (usado na aba "Por Motorista")
-- Query pattern: WHERE condutor_id = X AND data = Y ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_abastecimentos_condutor_data 
ON abastecimentos(condutor_id, data DESC);

-- Comentários explicativos
COMMENT ON INDEX idx_abastecimentos_veiculo_data_km_created IS 'Otimiza busca do último abastecimento por veículo, usado em getUltimoAbastecimento(). Evita full table scan em tabelas grandes.';
COMMENT ON INDEX idx_abastecimentos_condutor_data IS 'Otimiza filtro por motorista na aba "Por Motorista". Suporta queries com filtro de condutor e ordenação por data.';
