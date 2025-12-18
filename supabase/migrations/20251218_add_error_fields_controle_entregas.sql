-- Adiciona colunas de erro na tabela controle_entregas
ALTER TABLE controle_entregas 
ADD COLUMN IF NOT EXISTS erros TEXT, 
ADD COLUMN IF NOT EXISTS descricao_erros TEXT;
