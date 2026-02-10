-- Permitir novos valores em status_montagem: EM_MONTAGEM, MONTAGEM_PARCIAL
-- Requer que a coluna status_montagem já exista (migração 20260203154121_add_status_montagem.sql)

-- Remover o CHECK antigo (apenas PENDENTE, CONCLUIDO) e criar novo com os 4 valores
ALTER TABLE controle_entregas DROP CONSTRAINT IF EXISTS controle_entregas_status_montagem_check;

ALTER TABLE controle_entregas
ADD CONSTRAINT controle_entregas_status_montagem_check
CHECK (status_montagem IS NULL OR status_montagem IN ('PENDENTE', 'EM_MONTAGEM', 'MONTAGEM_PARCIAL', 'CONCLUIDO'));

-- Atualizar o trigger para não sobrescrever quando o usuário definir EM_MONTAGEM ou MONTAGEM_PARCIAL
CREATE OR REPLACE FUNCTION update_status_montagem_on_data_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário já definiu um status manual (Em montagem / Montagem parcial), não alterar
  IF NEW.status_montagem IN ('EM_MONTAGEM', 'MONTAGEM_PARCIAL') THEN
    RETURN NEW;
  END IF;
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
