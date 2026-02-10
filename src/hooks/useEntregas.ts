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

interface UseEntregasPaginatedProps {
  page: number;
  pageSize: number;
  searchTerm?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  motorista?: string | null;
  veiculo?: string | null;
  dataEspecifica?: Date | null;
  statusMontagem?: StatusMontagem | null;
}

export function useEntregasPaginated({
  page,
  pageSize,
  searchTerm,
  dateFrom,
  dateTo,
  motorista,
  veiculo,
  dataEspecifica,
  statusMontagem
}: UseEntregasPaginatedProps) {
  return useQuery({
    queryKey: ['entregas-paginated', page, pageSize, searchTerm, dateFrom, dateTo, motorista, veiculo, dataEspecifica, statusMontagem],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from('controle_entregas')
        .select(ENTREGA_SELECT);

      if (searchTerm) {
        query = query.or(`cliente.ilike.%${searchTerm}%,pv_foco.ilike.%${searchTerm}%,nf.ilike.%${searchTerm}%,motorista.ilike.%${searchTerm}%`);
      }
      if (dateFrom) {
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        query = query.gte('data_saida', dateFromStr);
      }
      if (dateTo) {
        const dateToStr = dateTo.toISOString().split('T')[0];
        query = query.lte('data_saida', dateToStr);
      }
      if (motorista) query = query.eq('motorista', motorista);
      if (veiculo) query = query.eq('carro', veiculo);
      if (dataEspecifica) {
        const dataStr = dataEspecifica.toISOString().split('T')[0];
        query = query.eq('data_saida', dataStr);
      }
      if (statusMontagem) query = query.eq('status_montagem', statusMontagem);

      query = query.order('data_saida', { ascending: false });

      const { data: pageData, error: pageError } = await query.range(from, to);

      if (pageError) throw pageError;

      let totalCount = (pageData?.length ?? 0);
      let countQuery = supabase.from('controle_entregas').select('id', { count: 'exact', head: true });
      if (searchTerm) countQuery = countQuery.or(`cliente.ilike.%${searchTerm}%,pv_foco.ilike.%${searchTerm}%,nf.ilike.%${searchTerm}%,motorista.ilike.%${searchTerm}%`);
      if (dateFrom) countQuery = countQuery.gte('data_saida', dateFrom.toISOString().split('T')[0]);
      if (dateTo) countQuery = countQuery.lte('data_saida', dateTo.toISOString().split('T')[0]);
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
    placeholderData: (previousData) => previousData // Keep prev data while fetching
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
