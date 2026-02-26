import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Abastecimento, AbastecimentoFormData } from '@/types/abastecimento';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

// Tipo auxiliar para dados com relacionamentos
type AbastecimentoComRelacionamentos = {
  id: string;
  data: string;
  veiculo_id: string;
  condutor_id: string;
  posto: string;
  cidade: string;
  estado: string;
  km_inicial: number;
  litros: number;
  produto: string;
  valor_unitario: number;
  valor_total: number;
  km_por_litro: number | null;
  created_at: string;
  updated_at: string;
  veiculos: { placa: string; modelo: string | null } | null;
  motoristas: { nome: string } | null;
};

// Função auxiliar para buscar o último abastecimento do veículo (maior data/km)
export async function getUltimoAbastecimento(veiculoId: string, excludeId?: string): Promise<{ km_inicial: number } | null> {
  let query = supabase
    .from('abastecimentos')
    .select('km_inicial')
    .eq('veiculo_id', veiculoId)
    .order('data', { ascending: false })
    .order('km_inicial', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

/**
 * Retorna o abastecimento cronologicamente anterior ao par (data, km_inicial).
 * Usado para validar KM em abastecimento retroativo: o anterior na linha do tempo
 * é o que tem data menor, ou mesma data e km_inicial menor.
 */
export async function getAbastecimentoAnteriorCronologico(
  veiculoId: string,
  data: string,
  kmInicial: number,
  excludeId?: string
): Promise<{ km_inicial: number } | null> {
  // (data < dataNova) OR (data = dataNova AND km_inicial < kmInicial)
  const orFilter = `data.lt.${data},and(data.eq.${data},km_inicial.lt.${kmInicial})`;
  let query = supabase
    .from('abastecimentos')
    .select('km_inicial')
    .eq('veiculo_id', veiculoId)
    .or(orFilter)
    .order('data', { ascending: false })
    .order('km_inicial', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data: rows, error } = await query;

  if (error || !rows || rows.length === 0) {
    return null;
  }

  return rows[0];
}

// Função para calcular KM/L
// Parâmetro showToast: se false, não exibe toast de aviso (útil para importações em lote)
export function calcularKmPorLitro(
  kmAtual: number,
  kmAnterior: number | null,
  litros: number,
  showToast: boolean = true
): number | null {
  if (kmAnterior === null) {
    return null; // Primeiro abastecimento do veículo
  }

  if (kmAtual < kmAnterior) {
    if (showToast) {
      sonnerToast.warning('Atenção: KM Inválido', {
        description: `O KM informado (${kmAtual.toLocaleString('pt-BR')}) é menor que o último registro (${kmAnterior.toLocaleString('pt-BR')}). Verifique se está correto.`,
        duration: 6000,
      });
    }
    return null;
  }

  // NOVO: Detectar KM igual
  if (kmAtual === kmAnterior) {
    if (showToast) {
      sonnerToast.warning('Atenção: KM Inválido', {
        description: `O KM informado (${kmAtual.toLocaleString('pt-BR')}) é igual ao último registro. Verifique se está correto ou se há múltiplos abastecimentos no mesmo dia.`,
        duration: 6000,
      });
    }
    return null; // Não calcular quando KM é igual
  }

  if (litros <= 0) {
    return null;
  }

  const kmRodado = kmAtual - kmAnterior;
  const kmPorLitro = kmRodado / litros;

  return Math.round(kmPorLitro * 100) / 100; // 2 casas decimais
}

// Função para atualizar KM atual do veículo
export async function atualizarKmAtualVeiculo(veiculoId: string, kmInicial: number) {
  // Buscar o KM atual do veículo
  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('km_atual')
    .eq('id', veiculoId)
    .single();

  // Só atualiza se o novo KM for maior que o atual
  if (!veiculo || kmInicial > (veiculo.km_atual || 0)) {
    await supabase
      .from('veiculos')
      .update({ km_atual: kmInicial })
      .eq('id', veiculoId);
  }
}

export function useAbastecimentos() {
  return useQuery({
    queryKey: ['abastecimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abastecimentos')
        .select(`
          *,
          veiculos:veiculo_id(placa, modelo),
          motoristas:condutor_id(nome)
        `)
        .order('data', { ascending: false })
        .range(0, 9999);

      if (!error && data) {
        const typedData = data as unknown as AbastecimentoComRelacionamentos[];
        return typedData.map((item) => ({
          ...item,
          veiculo_placa: item.veiculos?.placa || '',
          veiculo_modelo: item.veiculos?.modelo || '',
          condutor_nome: item.motoristas?.nome || '',
        })) as Abastecimento[];
      }

      // Fallback sem joins (evita 500 quando o join falha no servidor)
      const { data: rows, error: err2 } = await supabase
        .from('abastecimentos')
        .select('*')
        .order('data', { ascending: false })
        .range(0, 9999);

      if (err2) throw err2;

      const { data: veiculosList } = await supabase.from('veiculos').select('id, placa, modelo');
      const { data: motoristasList } = await supabase.from('motoristas').select('id, nome');
      const veiculoMap = new Map((veiculosList ?? []).map((v) => [v.id, v]));
      const motoristaMap = new Map((motoristasList ?? []).map((m) => [m.id, m]));

      return (rows ?? []).map((item) => ({
        ...item,
        veiculo_placa: veiculoMap.get(item.veiculo_id)?.placa ?? '',
        veiculo_modelo: veiculoMap.get(item.veiculo_id)?.modelo ?? '',
        condutor_nome: motoristaMap.get(item.condutor_id)?.nome ?? '',
      })) as Abastecimento[];
    },
  });
}

export function useCreateAbastecimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (abastecimento: AbastecimentoFormData) => {
      // Validação UX: anterior cronológico (permite abastecimento retroativo; cálculo no banco pelo trigger)
      const anteriorCronologico = await getAbastecimentoAnteriorCronologico(
        abastecimento.veiculo_id,
        abastecimento.data,
        abastecimento.km_inicial
      );
      const kmAnterior = anteriorCronologico?.km_inicial ?? null;
      calcularKmPorLitro(abastecimento.km_inicial, kmAnterior, abastecimento.litros);

      const { data, error } = await supabase
        .from('abastecimentos')
        .insert([{ ...abastecimento, km_por_litro: null }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar KM atual do veículo automaticamente
      await atualizarKmAtualVeiculo(abastecimento.veiculo_id, abastecimento.km_inicial);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso',
        description: 'Abastecimento registrado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar abastecimento: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAbastecimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AbastecimentoFormData }) => {
      // Validação UX: anterior cronológico (permite abastecimento retroativo; cálculo no banco pelo trigger)
      const anteriorCronologico = await getAbastecimentoAnteriorCronologico(
        data.veiculo_id,
        data.data,
        data.km_inicial,
        id
      );
      const kmAnterior = anteriorCronologico?.km_inicial ?? null;
      calcularKmPorLitro(data.km_inicial, kmAnterior, data.litros);

      const { data: result, error } = await supabase
        .from('abastecimentos')
        .update({ ...data, km_por_litro: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar KM atual do veículo automaticamente
      await atualizarKmAtualVeiculo(data.veiculo_id, data.km_inicial);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso',
        description: 'Abastecimento atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar abastecimento: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAbastecimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('abastecimentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      toast({
        title: 'Sucesso',
        description: 'Abastecimento excluído com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir abastecimento: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
