import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Entrega, EntregaFormData } from '@/types/entrega';
import { toast } from '@/hooks/use-toast';

export function useEntregas() {
  return useQuery({
    queryKey: ['entregas'],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:10',message:'Iniciando query de entregas',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Use count: 'exact' to get the real total, but we still need to fetch data
      // For large datasets, consider using pagination or the stats RPC for totals
      const { data, error, count } = await supabase
        .from('controle_entregas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10000); // Increase limit to handle more records

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:17',message:'Query executada com range',data:{dataLength:data?.length||0,count:count||0,hasError:!!error,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (error) throw error;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:22',message:'Retornando dados',data:{finalLength:data?.length||0,count:count||0,firstId:data?.[0]?.id,lastId:data?.[data.length-1]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
}

export function useEntregasPaginated({
  page,
  pageSize,
  searchTerm,
  dateFrom,
  dateTo
}: UseEntregasPaginatedProps) {
  return useQuery({
    queryKey: ['entregas-paginated', page, pageSize, searchTerm, dateFrom, dateTo],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:52',message:'Iniciando query paginada',data:{page,pageSize,searchTerm,dateFrom:dateFrom?.toISOString(),dateTo:dateTo?.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      let query = supabase
        .from('controle_entregas')
        .select('*', { count: 'exact' });

      // Apply filters
      if (searchTerm) {
        query = query.or(`cliente.ilike.%${searchTerm}%,pv_foco.ilike.%${searchTerm}%,nf.ilike.%${searchTerm}%,motorista.ilike.%${searchTerm}%`);
      }

      if (dateFrom) {
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:63',message:'Aplicando filtro dateFrom',data:{dateFrom:dateFrom.toISOString(),dateFromStr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        query = query.gte('data_saida', dateFromStr);
      }

      if (dateTo) {
        const dateToStr = dateTo.toISOString().split('T')[0];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:68',message:'Aplicando filtro dateTo',data:{dateTo:dateTo.toISOString(),dateToStr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        query = query.lte('data_saida', dateToStr);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:75',message:'Executando query com paginação',data:{from,to},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const { data, count, error } = await query
        .order('data_saida', { ascending: false }) // Order by date usually better for pagination
        .range(from, to);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:78',message:'Resultado da query paginada',data:{dataLength:data?.length||0,count,hasError:!!error,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

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
  dateTo
}: Omit<UseEntregasPaginatedProps, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['entregas-stats', searchTerm, dateFrom, dateTo],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:96',message:'Chamando RPC get_delivery_stats',data:{searchTerm,dateFrom:dateFrom?.toISOString(),dateTo:dateTo?.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Use RPC function to get accurate stats without fetching all records
      // This bypasses the 1000 row limit and is much more efficient
      const rpcParams = {
        search_term: searchTerm && searchTerm.trim() !== '' ? searchTerm.trim() : null,
        date_from: dateFrom ? dateFrom.toISOString() : null,
        date_to: dateTo ? dateTo.toISOString() : null
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:102',message:'Parâmetros da RPC',data:{rpcParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const { data, error } = await supabase.rpc('get_delivery_stats', rpcParams);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:106',message:'Resultado da RPC get_delivery_stats',data:{hasError:!!error,errorMessage:error?.message,rpcData:data,totalEntregas:data?.totalEntregas},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (error) {
        console.error('Error fetching delivery stats:', error);
        throw error;
      }

      // The RPC returns a JSON object with the stats
      const result = {
        totalEntregas: data?.totalEntregas || 0,
        custoTotalEntregas: Number(data?.custoTotalEntregas || 0),
        custoTotalMontagem: Number(data?.custoTotalMontagem || 0),
        percentualMedioGastos: Number(data?.percentualMedioGastos || 0)
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:118',message:'Retornando estatísticas processadas',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return result;
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
