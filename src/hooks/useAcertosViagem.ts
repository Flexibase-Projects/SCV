import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AcertoViagem, AcertoViagemFormData, AcertoViagemEntrega, AbastecimentoVinculado } from '@/types/acertoViagem';

// Tipos auxiliares para os relacionamentos nas queries
type AcertoComRelacionamentos = {
  id: string;
  veiculo_id: string | null;
  motorista_id: string | null;
  montador_id: string | null;
  destino: string;
  data_saida: string;
  data_chegada: string | null;
  km_saida: number | null;
  km_chegada: number | null;
  valor_adiantamento: number;
  despesa_combustivel: number;
  despesa_material_montagem: number;
  despesa_passagem_onibus: number;
  despesa_hotel: number;
  despesa_lavanderia: number;
  despesa_taxi_transporte: number;
  despesa_veiculo: number;
  despesa_ajudante: number;
  despesa_cartao_telefonico: number;
  despesa_alimentacao: number;
  despesa_diaria_motorista: number;
  despesa_diaria_montador: number;
  despesa_outros: number;
  despesa_outros_descricao: string | null;
  observacoes: string | null;
  status: 'PENDENTE' | 'ACERTADO';
  created_at: string;
  updated_at: string;
  veiculos: { placa: string; modelo: string | null } | null;
  motoristas: { nome: string } | null;
  montadores: { nome: string } | null;
};

type EntregaComRelacionamento = {
  id: string;
  acerto_id: string;
  entrega_id: string;
  created_at: string;
  controle_entregas: {
    id: string;
    pv_foco: string | null;
    nf: string | null;
    cliente: string | null;
    uf: string | null;
    valor: number | null;
  } | null;
};

// ==================== QUERIES ====================

export function useAcertosViagem() {
  return useQuery({
    queryKey: ['acertos_viagem'],
    queryFn: async () => {
      // Buscar acertos sem join com montadores (causa erro no Supabase)
      const { data, error } = await supabase
        .from('acertos_viagem')
        .select(`
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome)
        `)
        .order('data_saida', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos montadores separadamente se houver montador_id
      const typedData = data as unknown as AcertoComRelacionamentos[];
      const montadorIds = [...new Set(typedData.filter(item => item.montador_id).map(item => item.montador_id))] as string[];
      
      let montadoresMap: Record<string, string> = {};
      if (montadorIds.length > 0) {
        const { data: montadores, error: montadoresError } = await supabase
          .from('montadores')
          .select('id, nome')
          .in('id', montadorIds);
        
        if (!montadoresError && montadores) {
          montadoresMap = montadores.reduce((acc, m) => {
            acc[m.id] = m.nome;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const result = (typedData || []).map((item) => ({
        ...item,
        veiculo_placa: item.veiculos?.placa,
        veiculo_modelo: item.veiculos?.modelo,
        motorista_nome: item.motoristas?.nome,
        montador_nome: item.montador_id ? montadoresMap[item.montador_id] : undefined,
      })) as AcertoViagem[];

      return result;
    },
  });
}

export function useAcertoViagem(id: string | null) {
  return useQuery({
    queryKey: ['acertos_viagem', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: acerto, error: acertoError } = await supabase
        .from('acertos_viagem')
        .select(`
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome, eh_montador)
        `)
        .eq('id', id)
        .single();

      if (acertoError) throw acertoError;

      // Buscar Entregas
      const { data: entregas, error: entregasError } = await supabase
        .from('acerto_viagem_entregas')
        .select(`
          *,
          controle_entregas:entrega_id (
            id, pv_foco, nf, cliente, uf, valor
          )
        `)
        .eq('acerto_id', id);

      if (entregasError) throw entregasError;

      // Buscar Abastecimentos Vinculados
      const { data: abastecimentosVinculados, error: absError } = await supabase
        .from('acerto_viagem_abastecimentos')
        .select(`
          abastecimento_id,
          abastecimentos (
            id, data, valor_total, posto, litros
          )
        `)
        .eq('acerto_id', id);

      if (absError) throw absError;

      const typedAcerto = acerto as unknown as AcertoComRelacionamentos;
      const typedEntregas = entregas as unknown as EntregaComRelacionamento[];
      
      // Mapeamento seguro para abastecimentos
      const abastecimentos = (abastecimentosVinculados || [])
        .map(item => item.abastecimentos)
        .filter(item => item !== null) as unknown as AbastecimentoVinculado[];

      return {
        ...typedAcerto,
        veiculo_placa: typedAcerto.veiculos?.placa,
        veiculo_modelo: typedAcerto.veiculos?.modelo,
        motorista_nome: typedAcerto.motoristas?.nome,
        entregas: typedEntregas?.map((e): AcertoViagemEntrega => ({
          id: e.id,
          acerto_id: e.acerto_id,
          entrega_id: e.entrega_id,
          created_at: e.created_at,
          entrega: e.controle_entregas ? {
            id: e.controle_entregas.id,
            pv_foco: e.controle_entregas.pv_foco,
            nota_fiscal: e.controle_entregas.nf || null,
            cliente: e.controle_entregas.cliente,
            uf: e.controle_entregas.uf,
            valor: e.controle_entregas.valor,
          } : undefined,
        })),
        abastecimentos: abastecimentos,
      } as AcertoViagem;
    },
    enabled: !!id,
  });
}

export function useEntregasDisponiveis() {
  return useQuery({
    queryKey: ['entregas_disponiveis_acerto'],
    queryFn: async () => {
      const { data: vinculadas, error: vinculadasError } = await supabase
        .from('acerto_viagem_entregas')
        .select('entrega_id');

      if (vinculadasError) throw vinculadasError;

      const idsVinculados = (vinculadas || []).map((v) => v.entrega_id) || [];
      const idsVinculadosSet = new Set(idsVinculados);

      // Buscar todas as entregas e filtrar no JavaScript (mais seguro que usar .not com múltiplos IDs)
      // Adicionado filtro para evitar entregas vazias/fantasmas
      const { data: todasEntregas, error } = await supabase
        .from('controle_entregas')
        .select('id, pv_foco, nf, cliente, uf, valor, data_saida, motorista, carro')
        .not('pv_foco', 'is', null)
        .neq('pv_foco', '')
        .order('data_saida', { ascending: false });

      if (error) throw error;

      // Filtrar entregas não vinculadas e mapear nf para nota_fiscal
      const data = (todasEntregas || []).filter(entrega => !idsVinculadosSet.has(entrega.id)).map(entrega => ({
        ...entrega,
        nota_fiscal: entrega.nf || null,
      }));

      return data || [];
    },
  });
}

export function useAbastecimentosDisponiveis(veiculoId?: string | null, motoristaId?: string | null) {
  return useQuery({
    queryKey: ['abastecimentos_disponiveis_acerto', veiculoId, motoristaId],
    queryFn: async () => {
       // Buscar IDs já vinculados a QUALQUER acerto para excluí-los da lista de disponíveis
       const { data: vinculados, error: vinculadosError } = await supabase
        .from('acerto_viagem_abastecimentos')
        .select('abastecimento_id');

       if (vinculadosError) throw vinculadosError;
       const idsVinculadosSet = new Set((vinculados || []).map(v => v.abastecimento_id));

       let query = supabase
        .from('abastecimentos')
        .select('id, data, valor_total, posto, litros, veiculo_id, condutor_id')
        .order('data', { ascending: false });

       // Filtros opcionais de contexto
       if (veiculoId) query = query.eq('veiculo_id', veiculoId);
       if (motoristaId) query = query.eq('condutor_id', motoristaId);

       const { data: abastecimentos, error } = await query;
       if (error) throw error;

       // Filtrar os que já estão vinculados
       return (abastecimentos || []).filter(a => !idsVinculadosSet.has(a.id));
    },
    // Habilitar apenas se houver pelo menos um dos filtros, ou se a intenção for listar tudo (cuidado com performance)
    // Para UX, pode ser útil mostrar, mas idealmente filtramos pelo veículo da viagem
    enabled: true 
  });
}

// ==================== MUTATIONS ====================

export function useCreateAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: AcertoViagemFormData) => {
      const { entregas_ids, abastecimentos_ids, ...acertoData } = formData;

      // Sanitização de dados - converter strings vazias para null
      const payload = {
        ...acertoData,
        motorista_id: acertoData.motorista_id || null,
        data_chegada: acertoData.data_chegada || null,
      };

      const { data: acerto, error: acertoError } = await supabase
        .from('acertos_viagem')
        .insert(payload)
        .select()
        .single();

      if (acertoError) throw acertoError;

      // Vincular Entregas
      if (entregas_ids && entregas_ids.length > 0) {
        const entregasVinculos = entregas_ids.map(entrega_id => ({
          acerto_id: acerto.id,
          entrega_id,
        }));

        const { error: entregasError } = await supabase
          .from('acerto_viagem_entregas')
          .insert(entregasVinculos);

        if (entregasError) throw entregasError;
      }

      // Vincular Abastecimentos
      if (abastecimentos_ids && abastecimentos_ids.length > 0) {
        const abastecimentosVinculos = abastecimentos_ids.map(abastecimento_id => ({
          acerto_id: acerto.id,
          abastecimento_id,
        }));

        const { error: absError } = await supabase
          .from('acerto_viagem_abastecimentos')
          .insert(abastecimentosVinculos);

        if (absError) throw absError;
      }

      return acerto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimentos_disponiveis_acerto'] });
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem criado com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar acerto:', error);
      toast({
        title: 'Erro ao criar',
        description: error.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: AcertoViagemFormData }) => {
      const { entregas_ids, abastecimentos_ids, ...acertoData } = formData;

      // Sanitização de dados - converter strings vazias para null
      const payload = {
        ...acertoData,
        motorista_id: acertoData.motorista_id || null,
        data_chegada: acertoData.data_chegada || null,
      };

      const { error: acertoError } = await supabase
        .from('acertos_viagem')
        .update(payload)
        .eq('id', id);

      if (acertoError) throw acertoError;

      // Atualizar Entregas (Remove tudo e insere novos)
      const { error: deleteEntregasError } = await supabase
        .from('acerto_viagem_entregas')
        .delete()
        .eq('acerto_id', id);

      if (deleteEntregasError) throw deleteEntregasError;

      if (entregas_ids && entregas_ids.length > 0) {
        const entregasVinculos = entregas_ids.map(entrega_id => ({
          acerto_id: id,
          entrega_id,
        }));

        const { error: entregasError } = await supabase
          .from('acerto_viagem_entregas')
          .insert(entregasVinculos);

        if (entregasError) throw entregasError;
      }

      // Atualizar Abastecimentos (Remove tudo e insere novos)
      const { error: deleteAbsError } = await supabase
        .from('acerto_viagem_abastecimentos')
        .delete()
        .eq('acerto_id', id);

      if (deleteAbsError) throw deleteAbsError;

      if (abastecimentos_ids && abastecimentos_ids.length > 0) {
        const abastecimentosVinculos = abastecimentos_ids.map(abastecimento_id => ({
          acerto_id: id,
          abastecimento_id,
        }));

        const { error: absError } = await supabase
          .from('acerto_viagem_abastecimentos')
          .insert(abastecimentosVinculos);

        if (absError) throw absError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimentos_disponiveis_acerto'] });
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar acerto:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('acertos_viagem')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimentos_disponiveis_acerto'] });
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem excluido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o acerto de viagem.',
        variant: 'destructive',
      });
    },
  });
}
