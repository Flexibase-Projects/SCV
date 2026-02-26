import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Entrega, EntregaFormData, StatusMontagem } from '@/types/entrega';
import { toast } from '@/hooks/use-toast';

// Select inclui status_montagem quando a migration 20260203 (e a de novos status) estiver aplicada.
const ENTREGA_SELECT =
  'id, pv_foco, nf, valor, cliente, uf, data_saida, motorista, carro, tipo_transporte, status, precisa_montagem, status_montagem, data_montagem, gastos_entrega, gastos_montagem, produtividade, erros, descricao_erros, montador_1, montador_2, percentual_gastos, created_at';

// Envia payload; status_montagem é persistido quando a migration estiver aplicada.
function sanitizeEntregaPayload(data: Partial<EntregaFormData>) {
  return { ...data };
}

export function useEntregas() {
  return useQuery({
    queryKey: ['entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controle_entregas')
        .select(ENTREGA_SELECT)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;
      return data as Entrega[];
    }
  });
}

export type DateFieldFilter = 'data_saida' | 'created_at';

interface UseEntregasPaginatedProps {
  page: number;
  pageSize: number;
  searchTerm?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  dateField?: DateFieldFilter | null;
  motorista?: string | null;
  veiculo?: string | null;
  dataEspecifica?: Date | null;
  statusMontagem?: StatusMontagem | null;
}

function toDateOnlyStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function toStartOfDayISO(d: Date): string {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function toEndOfDayISO(d: Date): string {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy.toISOString();
}

export function useEntregasPaginated({
  page,
  pageSize,
  searchTerm,
  dateFrom,
  dateTo,
  dateField = 'data_saida',
  motorista,
  veiculo,
  dataEspecifica,
  statusMontagem
}: UseEntregasPaginatedProps) {
  return useQuery({
    queryKey: ['entregas-paginated', page, pageSize, searchTerm, dateFrom, dateTo, dateField, motorista, veiculo, dataEspecifica, statusMontagem],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const field = dateField ?? 'data_saida';

      let query = supabase
        .from('controle_entregas')
        .select(ENTREGA_SELECT);

      if (searchTerm) {
        query = query.or(`cliente.ilike.%${searchTerm}%,pv_foco.ilike.%${searchTerm}%,nf.ilike.%${searchTerm}%,motorista.ilike.%${searchTerm}%`);
      }
      if (field === 'created_at' && dateFrom) {
        query = query.gte('created_at', toStartOfDayISO(dateFrom));
      }
      if (field === 'created_at' && dateTo) {
        query = query.lte('created_at', toEndOfDayISO(dateTo));
      }
      if (field === 'data_saida' && dateFrom) {
        query = query.gte('data_saida', toDateOnlyStr(dateFrom));
      }
      if (field === 'data_saida' && dateTo) {
        query = query.lte('data_saida', toDateOnlyStr(dateTo));
      }
      if (motorista) query = query.eq('motorista', motorista);
      if (veiculo) query = query.eq('carro', veiculo);
      if (dataEspecifica) {
        const dataStr = dataEspecifica.toISOString().split('T')[0];
        query = query.eq('data_saida', dataStr);
      }
      if (statusMontagem) query = query.eq('status_montagem', statusMontagem);

      query = query.order(field, { ascending: false });

      const { data: pageData, error: pageError } = await query.range(from, to);

      if (pageError) throw pageError;

      let totalCount = (pageData?.length ?? 0);
      let countQuery = supabase.from('controle_entregas').select('id', { count: 'exact', head: true });
      if (searchTerm) countQuery = countQuery.or(`cliente.ilike.%${searchTerm}%,pv_foco.ilike.%${searchTerm}%,nf.ilike.%${searchTerm}%,motorista.ilike.%${searchTerm}%`);
      if (field === 'created_at' && dateFrom) countQuery = countQuery.gte('created_at', toStartOfDayISO(dateFrom));
      if (field === 'created_at' && dateTo) countQuery = countQuery.lte('created_at', toEndOfDayISO(dateTo));
      if (field === 'data_saida' && dateFrom) countQuery = countQuery.gte('data_saida', toDateOnlyStr(dateFrom));
      if (field === 'data_saida' && dateTo) countQuery = countQuery.lte('data_saida', toDateOnlyStr(dateTo));
      if (motorista) countQuery = countQuery.eq('motorista', motorista);
      if (veiculo) countQuery = countQuery.eq('carro', veiculo);
      if (dataEspecifica) countQuery = countQuery.eq('data_saida', dataEspecifica.toISOString().split('T')[0]);
      if (statusMontagem) countQuery = countQuery.eq('status_montagem', statusMontagem);
      const { count: exactCount, error: countError } = await countQuery;

      if (!countError && exactCount != null) totalCount = exactCount;

      return {
        data: (pageData ?? []) as Entrega[],
        count: totalCount
      };
    },
    placeholderData: (previousData) => previousData
  });
}

const PAGE_SIZE_YEAR = 1000;

/** Busca todas as entregas de um ano por data_saida (paginação em loop para evitar limite do Supabase) */
export function useEntregasByYear(year: number | null) {
  return useQuery({
    queryKey: ['entregas-by-year', year],
    queryFn: async (): Promise<Entrega[]> => {
      if (year == null) return [];
      const dateFrom = `${year}-01-01`;
      const dateTo = `${year}-12-31`;
      const all: Entrega[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const to = from + PAGE_SIZE_YEAR - 1;
        const { data, error } = await supabase
          .from('controle_entregas')
          .select(ENTREGA_SELECT)
          .gte('data_saida', dateFrom)
          .lte('data_saida', dateTo)
          .order('data_saida', { ascending: true })
          .range(from, to);
        if (error) throw error;
        const chunk = (data ?? []) as Entrega[];
        all.push(...chunk);
        hasMore = chunk.length === PAGE_SIZE_YEAR;
        from += PAGE_SIZE_YEAR;
      }
      return all;
    },
    enabled: year != null && year >= 2000 && year <= 2100,
  });
}

export function useEntregasStats({
  searchTerm,
  dateFrom,
  dateTo,
  statusMontagem
}: Omit<UseEntregasPaginatedProps, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['entregas-stats', searchTerm, dateFrom, dateTo, statusMontagem],
    queryFn: async () => {
      // Use RPC function to get accurate stats without fetching all records
      // This bypasses the 1000 row limit and is much more efficient
      const rpcParams = {
        search_term: searchTerm && searchTerm.trim() !== '' ? searchTerm.trim() : null,
        date_from: dateFrom ? dateFrom.toISOString() : null,
        date_to: dateTo ? dateTo.toISOString() : null
      };
      const { data, error } = await supabase.rpc('get_delivery_stats', rpcParams);

      if (error) {
        console.error('Error fetching delivery stats:', error);
        throw error;
      }

      // The RPC returns a JSON object with the stats
      return {
        totalEntregas: data?.totalEntregas || 0,
        custoTotalEntregas: Number(data?.custoTotalEntregas || 0),
        custoTotalMontagem: Number(data?.custoTotalMontagem || 0),
        percentualMedioGastos: Number(data?.percentualMedioGastos || 0)
      };
    }
  });
}

export function useCreateEntrega() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entrega: Partial<EntregaFormData>) => {
      // Sanitizar payload removendo colunas inexistentes no banco
      const payload = sanitizeEntregaPayload(entrega);
      
      const { data, error } = await supabase
        .from('controle_entregas')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-stats'] });
      toast({
        title: 'Sucesso!',
        description: 'Entrega cadastrada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar entrega.',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateEntrega() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EntregaFormData> }) => {
      // Sanitizar payload
      const payload = sanitizeEntregaPayload(data);

      const { data: updatedData, error } = await supabase
        .from('controle_entregas')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-stats'] });
      toast({
        title: 'Sucesso!',
        description: 'Entrega atualizada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar entrega.',
        variant: 'destructive',
      });
    }
  });
}

// Hook para buscar motoristas únicos
export function useMotoristasEntregas() {
  return useQuery({
    queryKey: ['motoristas-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controle_entregas')
        .select('motorista')
        .not('motorista', 'is', null)
        .neq('motorista', '');

      if (error) throw error;

      const uniqueMotoristas = new Set(
        (data || [])
          .map((e: { motorista: string }) => e.motorista)
          .filter((m): m is string => m !== null && m !== '')
      );

      return Array.from(uniqueMotoristas).sort();
    }
  });
}

// Hook para buscar veículos únicos
export function useVeiculosEntregas() {
  return useQuery({
    queryKey: ['veiculos-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controle_entregas')
        .select('carro')
        .not('carro', 'is', null)
        .neq('carro', '');

      if (error) throw error;

      const uniqueVeiculos = new Set(
        (data || [])
          .map((e: { carro: string }) => e.carro)
          .filter((v): v is string => v !== null && v !== '')
      );

      return Array.from(uniqueVeiculos).sort();
    }
  });
}

export function useDeleteEntrega() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('controle_entregas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-stats'] });
      toast({
        title: 'Sucesso!',
        description: 'Entrega excluída com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir entrega.',
        variant: 'destructive',
      });
    }
  });
}

export function useDeleteEntregasBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return { count: 0 };
      const { error } = await supabase
        .from('controle_entregas')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return { count: ids.length };
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-stats'] });
      toast({
        title: 'Sucesso!',
        description: ids.length === 1 ? 'Entrega excluída.' : `${ids.length} entregas excluídas.`,
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir entregas.',
        variant: 'destructive',
      });
    }
  });
}

export function useClearDataMontagemBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return { count: 0 };
      const { error } = await supabase
        .from('controle_entregas')
        .update({ data_montagem: null })
        .in('id', ids);

      if (error) throw error;
      return { count: ids.length };
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-stats'] });
      toast({
        title: 'Sucesso!',
        description: ids.length === 1 ? 'Data de montagem limpa.' : `Data de montagem limpa em ${ids.length} entregas.`,
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao limpar data de montagem.',
        variant: 'destructive',
      });
    }
  });
}
