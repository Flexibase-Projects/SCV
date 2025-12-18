-- Adicionar campos de erro na tabela manutencoes para permitir importação de registros inválidos
-- e posterior correção manual no sistema.

-- Tornar veiculo_id opcional (nullable)
ALTER TABLE manutencoes ALTER COLUMN veiculo_id DROP NOT NULL;

-- Adicionar colunas de erro
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS erros TEXT;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS descricao_erros TEXT;

-- Comentários para documentação
COMMENT ON COLUMN manutencoes.erros IS 'Lista simplificada de erros encontrados na importação';
COMMENT ON COLUMN manutencoes.descricao_erros IS 'Detalhamento dos erros encontrados para orientação do usuário';
