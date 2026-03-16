import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Entrega } from '@/types/entrega';

const MONTAGEM_SELECT =
  'id, pv_foco, nf, valor, cliente, uf, data_saida, data_montagem, status_montagem, precisa_montagem, montador_1, montador_2, tipo_servico_id, produtividade, produtividade_por_montador, gastos_montagem, created_at, status, motorista, carro, tipo_transporte, gastos_entrega, erros, descricao_erros, percentual_gastos';

const PRODUTIVIDADE_QUERY_CONFIG = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
} as const;

export interface MontadorProdutividadeItem {
  nome: string;
  totalMontagens: number;
  totalProdutividade: number;
  montagens: Entrega[];
}

export interface ProdutividadeStats {
  totalMontagensConcluidas: number;
  produtividadeTotal: number;
  produtividadeMediaPorMontador: number;
  pendentesSemConfiguracao: number;
}

interface ProdutividadeQueryOptions {
  enabled?: boolean;
}

/** Busca todas as entregas que possuem precisa_montagem = true (para aba retroativa). */
export function useEntregasComMontagem(options?: ProdutividadeQueryOptions) {
  return useQuery({
    queryKey: ['entregas-com-montagem'],
    enabled: options?.enabled ?? true,
    ...PRODUTIVIDADE_QUERY_CONFIG,
    queryFn: async () => {
      const list = await fetchAllMontagem<Entrega>(() =>
        supabase.from('controle_entregas').select(MONTAGEM_SELECT).eq('precisa_montagem', true)
      );
      list.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
      return list;
    },
  });
}

/** Conta total de pendentes sem tipo_servico_id (para KPI global). */
export function usePendentesSemProdutividade() {
  return useQuery({
    queryKey: ['pendentes-sem-produtividade'],
    ...PRODUTIVIDADE_QUERY_CONFIG,
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('controle_entregas')
          .select('id', { count: 'exact' })
          .eq('precisa_montagem', true)
          .is('tipo_servico_id', null)
          .limit(0);

        // #region agent log
        if (error) {
          const errPayload = { code: (error as { code?: string }).code, message: error.message, details: (error as { details?: string }).details, hint: (error as { hint?: string }).hint };
          console.error('[useProdutividade] usePendentesSemProdutividade Supabase error:', errPayload);
          fetch('http://127.0.0.1:7467/ingest/4fecd63a-cbfb-46cf-b1be-5d11747bb5ea',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'89f5c4'},body:JSON.stringify({sessionId:'89f5c4',location:'useProdutividade.ts:usePendentesSemProdutividade',message:'Supabase error',data:errPayload,timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        }
        // #endregion
        if (error) throw error;
        return count ?? 0;
      } catch {
        return 0;
      }
    },
  });
}

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

const PAGE_SIZE = 1000;

async function fetchAllMontagem<T>(
  getQuery: () => ReturnType<ReturnType<typeof supabase.from>['select']>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await getQuery().range(from, to);
    if (error) throw error;
    const chunk = (data ?? []) as T[];
    all.push(...chunk);
    hasMore = chunk.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }
  return all;
}

/**
 * Busca todas as entregas com montagem no período (qualquer status).
 * Se dateFrom/dateTo forem null, traz todas com precisa_montagem = true.
 */
export function useTodasEntregasMontagemNoPeriodo(
  dateFrom: Date | null,
  dateTo: Date | null,
  options?: ProdutividadeQueryOptions
) {
  return useQuery({
    queryKey: ['todas-montagens-periodo', dateFrom?.toISOString(), dateTo?.toISOString()],
    enabled: options?.enabled ?? true,
    ...PRODUTIVIDADE_QUERY_CONFIG,
    queryFn: async () => {
      const list = await fetchAllMontagem<Entrega>(() => {
        let q = supabase.from('controle_entregas').select(MONTAGEM_SELECT).eq('precisa_montagem', true);
        if (dateFrom) q = q.gte('data_montagem', toDateOnly(dateFrom));
        if (dateTo) q = q.lte('data_montagem', toDateOnly(dateTo));
        return q;
      });
      list.sort((a, b) => (b.data_montagem ?? '').localeCompare(a.data_montagem ?? ''));
      return list;
    },
  });
}

/**
 * Busca entregas com montagem concluída no período e agrupa por montador.
 */
export function useProdutividadePorMontador(
  dateFrom: Date | null,
  dateTo: Date | null,
  options?: ProdutividadeQueryOptions
) {
  return useQuery({
    queryKey: ['produtividade-por-montador', dateFrom?.toISOString(), dateTo?.toISOString()],
    enabled: options?.enabled ?? true,
    ...PRODUTIVIDADE_QUERY_CONFIG,
    queryFn: async () => {
      const raw = await fetchAllMontagem<Entrega>(() => {
        let q = supabase
          .from('controle_entregas')
          .select(MONTAGEM_SELECT)
          .eq('precisa_montagem', true)
          .eq('status_montagem', 'CONCLUIDO');
        if (dateFrom) q = q.gte('data_montagem', toDateOnly(dateFrom));
        if (dateTo) q = q.lte('data_montagem', toDateOnly(dateTo));
        return q;
      });
      const entregas = raw.sort((a, b) =>
        (b.data_montagem ?? '').localeCompare(a.data_montagem ?? '')
      );

      const byMontador = new Map<string, Entrega[]>();
      for (const entrega of entregas) {
        if (entrega.montador_1) {
          const nome = entrega.montador_1;
          if (!byMontador.has(nome)) byMontador.set(nome, []);
          byMontador.get(nome)!.push(entrega);
        }
        if (entrega.montador_2) {
          const nome = entrega.montador_2;
          if (!byMontador.has(nome)) byMontador.set(nome, []);
          byMontador.get(nome)!.push(entrega);
        }
      }

      const result: MontadorProdutividadeItem[] = Array.from(byMontador.entries())
        .map(([nome, montagens]) => ({
          nome,
          totalMontagens: montagens.length,
          totalProdutividade: montagens.reduce(
            (acc, e) => acc + (e.produtividade_por_montador ?? 0),
            0
          ),
          montagens,
        }))
        .sort((a, b) => b.totalProdutividade - a.totalProdutividade);

      const stats: ProdutividadeStats = {
        totalMontagensConcluidas: entregas.length,
        produtividadeTotal: entregas.reduce((acc, e) => acc + (e.produtividade ?? 0), 0),
        produtividadeMediaPorMontador:
          result.length > 0
            ? result.reduce((acc, m) => acc + m.totalProdutividade, 0) / result.length
            : 0,
        pendentesSemConfiguracao: 0,
      };

      return { montadores: result, stats, entregas };
    },
  });
}

