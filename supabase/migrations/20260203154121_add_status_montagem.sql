-- Adicionar coluna status_montagem na tabela controle_entregas
ALTER TABLE controle_entregas 
ADD COLUMN IF NOT EXISTS status_montagem TEXT 
CHECK (status_montagem IS NULL OR status_montagem IN ('PENDENTE', 'CONCLUIDO'));

-- Atualizar registros existentes com lógica robusta:
-- 1. Se tem data_montagem preenchida E precisa_montagem = true → CONCLUIDO
-- 2. Se precisa_montagem = true mas não tem data_montagem → PENDENTE
-- 3. Se precisa_montagem = false → NULL (não precisa montagem, sem status)
UPDATE controle_entregas
SET status_montagem = CASE
  WHEN precisa_montagem = true AND data_montagem IS NOT NULL THEN 'CONCLUIDO'
  WHEN precisa_montagem = true AND data_montagem IS NULL THEN 'PENDENTE'
  ELSE NULL
END
WHERE status_montagem IS NULL;

-- Criar índice para otimizar filtros por status_montagem
CREATE INDEX IF NOT EXISTS idx_controle_entregas_status_montagem 
ON controle_entregas(status_montagem) 
WHERE status_montagem IS NOT NULL;

-- Criar trigger para atualizar status automaticamente quando data_montagem muda
CREATE OR REPLACE FUNCTION update_status_montagem_on_data_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se precisa_montagem = true e data_montagem foi preenchida → CONCLUIDO
  IF NEW.precisa_montagem = true AND NEW.data_montagem IS NOT NULL THEN
    NEW.status_montagem = 'CONCLUIDO';
  -- Se precisa_montagem = true mas data_montagem foi removida → PENDENTE
  ELSIF NEW.precisa_montagem = true AND NEW.data_montagem IS NULL THEN
    NEW.status_montagem = 'PENDENTE';
  -- Se precisa_montagem = false → NULL
  ELSIF NEW.precisa_montagem = false THEN
    NEW.status_montagem = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_update_status_montagem ON controle_entregas;
CREATE TRIGGER trigger_update_status_montagem
BEFORE INSERT OR UPDATE OF precisa_montagem, data_montagem, status_montagem
ON controle_entregas
FOR EACH ROW
EXECUTE FUNCTION update_status_montagem_on_data_change();
