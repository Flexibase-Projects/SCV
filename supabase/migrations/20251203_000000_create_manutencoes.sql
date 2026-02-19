-- =====================================================
-- MÓDULO: MANUTENÇÃO
-- Cria a tabela base manutencoes (exigida por 20251204_add_manutencao_preventiva)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  veiculo_id UUID NOT NULL REFERENCES veiculos(id),
  estabelecimento TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  descricao_servico TEXT,
  custo_total NUMERIC NOT NULL DEFAULT 0,
  km_manutencao NUMERIC NOT NULL DEFAULT 0,
  nota_fiscal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_manutencoes_updated_at
  BEFORE UPDATE ON public.manutencoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON public.manutencoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_data ON public.manutencoes(data);

-- RLS (mesmo padrão do app: acesso permitido para uso interno)
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on manutencoes" ON public.manutencoes
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.manutencoes IS 'Registro de manutenções preventivas e corretivas dos veículos';
