import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Entrega, EntregaFormData, StatusMontagem } from '@/types/entrega';
import { toast } from '@/hooks/use-toast';

export function useEntregas() {
  return useQuery({
    queryKey: ['entregas'],
    queryFn: async () => {
      // Use count: 'exact' to get the real total, but we still need to fetch data
      // For large datasets, consider using pagination or the stats RPC for totals
      const { data, error, count } = await supabase
        .from('controle_entregas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10000); // Increase limit to handle more records

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
      let query = supabase
        .from('controle_entregas')
        .select('*', { count: 'exact' });

      // Apply filters
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

      // NOVOS FILTROS
      if (motorista) {
        query = query.eq('motorista', motorista);
      }

      if (veiculo) {
        query = query.eq('carro', veiculo);
      }

      // Filtro de data específica (para as abas Por Motorista/Por Veículo/Por Montagem)
      if (dataEspecifica) {
        const dataStr = dataEspecifica.toISOString().split('T')[0];
        query = query.eq('data_saida', dataStr);
      }

      // NOVO FILTRO: Status de Montagem
      if (statusMontagem) {
        query = query.eq('status_montagem', statusMontagem);
      }

      // ORDENAÇÃO PADRÃO: Sempre por data_saida DESC (mais recente primeiro)
      // Aplicado para todas as abas: Todos, Por Motorista, Por Veículo e Por Montagem
      query = query.order('data_saida', { ascending: false });

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      return {
        data: data as Entrega[],
        count: count || 0
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
      const { data, error } = await supabase
        .from('controle_entregas')
        .insert([entrega])
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
      const { data: updatedData, error } = await supabase
        .from('controle_entregas')
        .update(data)
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
