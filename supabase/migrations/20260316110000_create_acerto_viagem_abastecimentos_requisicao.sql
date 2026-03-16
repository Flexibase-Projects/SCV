CREATE TABLE IF NOT EXISTS acerto_viagem_abastecimentos_requisicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acerto_id UUID NOT NULL REFERENCES acertos_viagem(id) ON DELETE CASCADE,
  abastecimento_id UUID NOT NULL REFERENCES abastecimentos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT acerto_viagem_abastecimentos_requisicao_abastecimento_id_key UNIQUE (abastecimento_id)
);

CREATE INDEX IF NOT EXISTS idx_acerto_viagem_abastecimentos_req_acerto_id
  ON acerto_viagem_abastecimentos_requisicao(acerto_id);

CREATE INDEX IF NOT EXISTS idx_acerto_viagem_abastecimentos_req_abastecimento_id
  ON acerto_viagem_abastecimentos_requisicao(abastecimento_id);
