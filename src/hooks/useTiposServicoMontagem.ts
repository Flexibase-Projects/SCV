import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TipoServicoMontagem, TipoServicoMontagemFormData } from '@/types/tipoServicoMontagem';
import { toast } from '@/hooks/use-toast';

export function useTiposServicoMontagem() {
  return useQuery({
    queryKey: ['tipos_servico_montagem'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_servico_montagem')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data || []) as TipoServicoMontagem[];
    },
  });
}

export function useCreateTipoServicoMontagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: TipoServicoMontagemFormData) => {
      const { data, error } = await supabase
        .from('tipos_servico_montagem')
        .insert([{ nome: formData.nome, percentual: formData.percentual }])
        .select()
        .single();

      if (error) throw error;
      return data as TipoServicoMontagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_servico_montagem'] });
      toast({ title: 'Sucesso!', description: 'Tipo de serviço cadastrado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao cadastrar tipo de serviço.', variant: 'destructive' });
    },
  });
}

export function useUpdateTipoServicoMontagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TipoServicoMontagemFormData }) => {
      const { data: updated, error } = await supabase
        .from('tipos_servico_montagem')
        .update({ nome: data.nome, percentual: data.percentual })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as TipoServicoMontagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_servico_montagem'] });
      toast({ title: 'Sucesso!', description: 'Tipo de serviço atualizado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao atualizar tipo de serviço.', variant: 'destructive' });
    },
  });
}

export function useDeleteTipoServicoMontagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tipos_servico_montagem')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_servico_montagem'] });
      toast({ title: 'Sucesso!', description: 'Tipo de serviço removido.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao remover tipo de serviço.', variant: 'destructive' });
    },
  });
}
