-- Respeitar status_montagem enviado pelo cliente: não sobrescrever quando já preenchido
CREATE OR REPLACE FUNCTION update_status_montagem_on_data_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o cliente já enviou um status, manter o valor (Pendente, Em montagem, Montagem parcial ou Concluído)
  IF NEW.status_montagem IS NOT NULL THEN
    RETURN NEW;
  END IF;
  -- Preencher automaticamente apenas quando status_montagem não foi enviado
  IF NEW.precisa_montagem = true AND NEW.data_montagem IS NOT NULL THEN
    NEW.status_montagem = 'CONCLUIDO';
  ELSIF NEW.precisa_montagem = true AND NEW.data_montagem IS NULL THEN
    NEW.status_montagem = 'PENDENTE';
  ELSIF NEW.precisa_montagem = false THEN
    NEW.status_montagem = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
