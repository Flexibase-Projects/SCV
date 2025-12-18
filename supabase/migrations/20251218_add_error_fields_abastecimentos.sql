-- Adicionar campos de erro na tabela abastecimentos para permitir importação de registros inválidos
-- e posterior correção manual no sistema, similar ao funcionamento de entregas.

-- Tornar veiculo_id e condutor_id opcionais (nullable)
ALTER TABLE abastecimentos ALTER COLUMN veiculo_id DROP NOT NULL;
ALTER TABLE abastecimentos ALTER COLUMN condutor_id DROP NOT NULL;

-- Adicionar colunas de erro
ALTER TABLE abastecimentos ADD COLUMN IF NOT EXISTS erros TEXT;
ALTER TABLE abastecimentos ADD COLUMN IF NOT EXISTS descricao_erros TEXT;

-- Comentários para documentação
COMMENT ON COLUMN abastecimentos.erros IS 'Lista simplificada de erros encontrados na importação';
COMMENT ON COLUMN abastecimentos.descricao_erros IS 'Detalhamento dos erros encontrados para orientação do usuário';
