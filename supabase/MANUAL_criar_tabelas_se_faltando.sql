-- =====================================================
-- Execute no SQL Editor do Supabase se Abastecimento/Manutenção
-- não aparecem (tabelas ausentes). Rode uma vez.
-- Pré-requisito: tabelas veiculos e motoristas devem existir.
-- =====================================================

-- 1) Tabela manutencoes (base) — só cria se não existir
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

-- Colunas adicionadas pela migration 20251204 (ignore se já existirem)
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS tipo_manutencao TEXT DEFAULT 'corretiva';
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS problema_detectado TEXT;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS erros TEXT;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS descricao_erros TEXT;
ALTER TABLE public.manutencoes ALTER COLUMN veiculo_id DROP NOT NULL;

-- Trigger updated_at (depende da função update_updated_at_column já existir)
DROP TRIGGER IF EXISTS update_manutencoes_updated_at ON public.manutencoes;
CREATE TRIGGER update_manutencoes_updated_at
  BEFORE UPDATE ON public.manutencoes FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on manutencoes" ON public.manutencoes;
CREATE POLICY "Allow all operations on manutencoes" ON public.manutencoes
  FOR ALL USING (true) WITH CHECK (true);

-- 2) Tabela abastecimentos — só cria se não existir (depende de veiculos e motoristas)
CREATE TABLE IF NOT EXISTS public.abastecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  veiculo_id UUID NOT NULL REFERENCES veiculos(id),
  condutor_id UUID NOT NULL REFERENCES motoristas(id),
  posto TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  km_inicial NUMERIC NOT NULL,
  litros NUMERIC NOT NULL,
  produto TEXT NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  km_por_litro NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_abastecimentos_updated_at ON public.abastecimentos;
CREATE TRIGGER update_abastecimentos_updated_at
  BEFORE UPDATE ON public.abastecimentos FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on abastecimentos" ON public.abastecimentos;
CREATE POLICY "Allow all operations on abastecimentos" ON public.abastecimentos
  FOR ALL USING (true) WITH CHECK (true);
