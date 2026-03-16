import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  AbastecimentoVinculado,
  AcertoDeleteCleanupMode,
  AcertoRemovedEntregasAction,
  AcertoViagem,
  AcertoViagemEntrega,
  AcertoViagemFormData,
  RateioResumo,
} from '@/types/acertoViagem';
import { calcularTotalDespesas } from '@/types/acertoViagem';
import { calcularRateioEntregas, gerarAtualizacoesEntrega } from '@/utils/acertoRateio';

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
    gastos_entrega: number | null;
    percentual_gastos: number | null;
  } | null;
};

type CreateAcertoPayload = {
  formData: AcertoViagemFormData;
};

type UpdateAcertoPayload = {
  id: string;
  formData: AcertoViagemFormData;
  removedEntregasAction?: AcertoRemovedEntregasAction;
};

type DeleteAcertoPayload = {
  id: string;
  cleanupMode: AcertoDeleteCleanupMode;
};

type ResumoRateioAplicado = {
  quantidadeAtualizada: number;
  totalDistribuido: number;
  diferencaArredondamento: number;
  baseValor: number;
  temBaseZero: boolean;
  temEntregaValorZero: boolean;
};

type AcertoMutationResult = {
  acertoId: string;
  rateio: ResumoRateioAplicado;
  removidasZeradas: number;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Verifique os dados e tente novamente.';
}

function mapRateioResumo(rateio: RateioResumo): ResumoRateioAplicado {
  return {
    quantidadeAtualizada: rateio.entregas.length,
    totalDistribuido: rateio.totalDistribuido,
    diferencaArredondamento: rateio.diferencaArredondamento,
    baseValor: rateio.baseValor,
    temBaseZero: rateio.temBaseZero,
    temEntregaValorZero: rateio.temEntregaValorZero,
  };
}

async function fetchEntregasByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('controle_entregas')
    .select('id, valor, gastos_entrega')
    .in('id', ids);

  if (error) throw error;
  return data || [];
}

async function applyRateioToEntregas(entregaIds: string[], totalDespesas: number): Promise<ResumoRateioAplicado> {
  const entregasDb = await fetchEntregasByIds(entregaIds);

  const rateio = calcularRateioEntregas(
    totalDespesas,
    entregaIds.map((id) => {
      const entrega = entregasDb.find((item) => item.id === id);
      return {
        id,
        valor: entrega?.valor ?? 0,
        gastoAtual: entrega?.gastos_entrega ?? 0,
      };
    })
  );

  const updates = gerarAtualizacoesEntrega(rateio);
  if (updates.length > 0) {
    await Promise.all(
      updates.map(async (update) => {
        const { error } = await supabase
          .from('controle_entregas')
          .update({
            gastos_entrega: update.gastos_entrega,
            percentual_gastos: update.percentual_gastos,
          })
          .eq('id', update.id);

        if (error) throw error;
      })
    );
  }

  return mapRateioResumo(rateio);
}

async function filterEntregasSemOutrosAcertos(entregaIds: string[], acertoIdAtual: string): Promise<string[]> {
  if (entregaIds.length === 0) return [];

  const { data, error } = await supabase
    .from('acerto_viagem_entregas')
    .select('entrega_id')
    .in('entrega_id', entregaIds)
    .neq('acerto_id', acertoIdAtual);

  if (error) throw error;

  const idsComOutrosAcertos = new Set((data || []).map((item) => item.entrega_id));
  return entregaIds.filter((id) => !idsComOutrosAcertos.has(id));
}

async function zeroEntregas(entregaIds: string[]): Promise<number> {
  if (entregaIds.length === 0) return 0;

  const { error } = await supabase
    .from('controle_entregas')
    .update({ gastos_entrega: 0, percentual_gastos: 0 })
    .in('id', entregaIds);

  if (error) throw error;
  return entregaIds.length;
}

async function invalidateAcertoQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] }),
    queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] }),
    queryClient.invalidateQueries({ queryKey: ['abastecimentos_disponiveis_acerto'] }),
    queryClient.invalidateQueries({ queryKey: ['entregas'] }),
    queryClient.invalidateQueries({ queryKey: ['entregas-paginated'] }),
    queryClient.invalidateQueries({ queryKey: ['entregas-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['entregas-by-year'] }),
  ]);
}

export function useAcertosViagem() {
  return useQuery({
    queryKey: ['acertos_viagem'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acertos_viagem')
        .select(
          `
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome)
        `
        )
        .order('data_saida', { ascending: false });

      if (error) throw error;

      const typedData = data as unknown as AcertoComRelacionamentos[];
      const montadorIds = [...new Set(typedData.filter((item) => item.montador_id).map((item) => item.montador_id))] as string[];

      let montadoresMap: Record<string, string> = {};
      if (montadorIds.length > 0) {
        const { data: montadores, error: montadoresError } = await supabase
          .from('montadores')
          .select('id, nome')
          .in('id', montadorIds);

        if (!montadoresError && montadores) {
          montadoresMap = montadores.reduce(
            (acc, montador) => {
              acc[montador.id] = montador.nome;
              return acc;
            },
            {} as Record<string, string>
          );
        }
      }

      return (typedData || []).map((item) => ({
        ...item,
        veiculo_placa: item.veiculos?.placa,
        veiculo_modelo: item.veiculos?.modelo,
        motorista_nome: item.motoristas?.nome,
        montador_nome: item.montador_id ? montadoresMap[item.montador_id] : undefined,
      })) as AcertoViagem[];
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
        .select(
          `
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome, eh_montador)
        `
        )
        .eq('id', id)
        .single();

      if (acertoError) throw acertoError;

      const { data: entregas, error: entregasError } = await supabase
        .from('acerto_viagem_entregas')
        .select(
          `
          *,
          controle_entregas:entrega_id (
            id, pv_foco, nf, cliente, uf, valor, gastos_entrega, percentual_gastos
          )
        `
        )
        .eq('acerto_id', id);

      if (entregasError) throw entregasError;

      const { data: abastecimentosVinculados, error: absError } = await supabase
        .from('acerto_viagem_abastecimentos')
        .select(
          `
          abastecimento_id,
          abastecimentos (
            id, data, valor_total, posto, litros
          )
        `
        )
        .eq('acerto_id', id);

      if (absError) throw absError;

      const { data: abastecimentosRequisicaoVinculados, error: requisicaoError } = await supabase
        .from('acerto_viagem_abastecimentos_requisicao')
        .select(
          `
          abastecimento_id,
          abastecimentos (
            id, data, valor_total, posto, litros
          )
        `
        )
        .eq('acerto_id', id);

      if (requisicaoError) throw requisicaoError;

      const typedAcerto = acerto as unknown as AcertoComRelacionamentos;
      const typedEntregas = entregas as unknown as EntregaComRelacionamento[];
      const abastecimentos = (abastecimentosVinculados || [])
        .map((item) => item.abastecimentos)
        .filter((item) => item !== null) as unknown as AbastecimentoVinculado[];
      const abastecimentosRequisicao = (abastecimentosRequisicaoVinculados || [])
        .map((item) => item.abastecimentos)
        .filter((item) => item !== null) as unknown as AbastecimentoVinculado[];

      return {
        ...typedAcerto,
        veiculo_placa: typedAcerto.veiculos?.placa,
        veiculo_modelo: typedAcerto.veiculos?.modelo,
        motorista_nome: typedAcerto.motoristas?.nome,
        entregas: typedEntregas?.map((entrega): AcertoViagemEntrega => ({
          id: entrega.id,
          acerto_id: entrega.acerto_id,
          entrega_id: entrega.entrega_id,
          created_at: entrega.created_at,
          entrega: entrega.controle_entregas
            ? {
                id: entrega.controle_entregas.id,
                pv_foco: entrega.controle_entregas.pv_foco,
                nota_fiscal: entrega.controle_entregas.nf || null,
                cliente: entrega.controle_entregas.cliente,
                uf: entrega.controle_entregas.uf,
                valor: entrega.controle_entregas.valor,
                gastos_entrega: entrega.controle_entregas.gastos_entrega,
                percentual_gastos: entrega.controle_entregas.percentual_gastos,
              }
            : undefined,
        })),
        abastecimentos,
        abastecimentos_requisicao: abastecimentosRequisicao,
      } as AcertoViagem;
    },
    enabled: !!id,
  });
}

export function useEntregasDisponiveis(options?: {
  searchTerm?: string;
  includeIds?: string[];
  enabled?: boolean;
  limit?: number;
}) {
  const searchTerm = options?.searchTerm?.trim() || '';
  const includeIds = options?.includeIds || [];
  const enabled = options?.enabled ?? true;
  const limit = options?.limit ?? 50;
  const includeKey = [...includeIds].sort().join(',');

  return useQuery({
    queryKey: ['entregas_disponiveis_acerto', searchTerm, includeKey, limit],
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data: vinculadas, error: vinculadasError } = await supabase
        .from('acerto_viagem_entregas')
        .select('entrega_id');

      if (vinculadasError) throw vinculadasError;

      const idsVinculadosSet = new Set((vinculadas || []).map((item) => item.entrega_id));
      const includeIdsSet = new Set(includeIds);
      const sanitizedTerm = searchTerm.replace(/[(),]/g, ' ');

      let query = supabase
        .from('controle_entregas')
        .select('id, pv_foco, nf, cliente, uf, valor, gastos_entrega, percentual_gastos, data_saida, motorista, carro')
        .order('data_saida', { ascending: false })
        .limit(limit);

      if (sanitizedTerm) {
        query = query.or(`pv_foco.ilike.%${sanitizedTerm}%,cliente.ilike.%${sanitizedTerm}%,nf.ilike.%${sanitizedTerm}%`);
      }

      const { data: entregasBuscadas, error } = await query;
      if (error) throw error;

      const fetchedIdsSet = new Set((entregasBuscadas || []).map((entrega) => entrega.id));
      const missingIncludeIds = includeIds.filter((id) => !fetchedIdsSet.has(id));

      let entregasIncluidas: typeof entregasBuscadas = [];
      if (missingIncludeIds.length > 0) {
        const { data: includedData, error: includedError } = await supabase
          .from('controle_entregas')
          .select('id, pv_foco, nf, cliente, uf, valor, gastos_entrega, percentual_gastos, data_saida, motorista, carro')
          .in('id', missingIncludeIds);

        if (includedError) throw includedError;
        entregasIncluidas = includedData || [];
      }

      const allEntregas = [...(entregasBuscadas || []), ...(entregasIncluidas || [])];
      const uniqueEntregas = allEntregas.filter(
        (entrega, index, self) => self.findIndex((item) => item.id === entrega.id) === index
      );

      return uniqueEntregas
        .filter((entrega) => !idsVinculadosSet.has(entrega.id) || includeIdsSet.has(entrega.id))
        .map((entrega) => ({
          ...entrega,
          nota_fiscal: entrega.nf || null,
        }));
    },
  });
}

export function useAbastecimentosDisponiveis(options?: {
  veiculoId?: string | null;
  motoristaId?: string | null;
  includeIds?: string[];
  mode?: 'combustivel' | 'requisicao';
  enabled?: boolean;
}) {
  const veiculoId = options?.veiculoId ?? null;
  const motoristaId = options?.motoristaId ?? null;
  const includeIds = options?.includeIds || [];
  const includeKey = [...includeIds].sort().join(',');
  const mode = options?.mode || 'combustivel';
  const enabled = options?.enabled ?? !!motoristaId;

  return useQuery({
    queryKey: ['abastecimentos_disponiveis_acerto', veiculoId, motoristaId, mode, includeKey],
    queryFn: async () => {
      const { data: vinculadosCombustivel, error: vinculadosCombustivelError } = await supabase
        .from('acerto_viagem_abastecimentos')
        .select('abastecimento_id');

      if (vinculadosCombustivelError) throw vinculadosCombustivelError;

      const { data: vinculadosRequisicao, error: vinculadosRequisicaoError } = await supabase
        .from('acerto_viagem_abastecimentos_requisicao')
        .select('abastecimento_id');

      if (vinculadosRequisicaoError) throw vinculadosRequisicaoError;

      const idsVinculadosSet = new Set([
        ...(vinculadosCombustivel || []).map((item) => item.abastecimento_id),
        ...(vinculadosRequisicao || []).map((item) => item.abastecimento_id),
      ]);
      const includeIdsSet = new Set(includeIds);

      let query = supabase
        .from('abastecimentos')
        .select('id, data, valor_total, posto, litros, veiculo_id, condutor_id')
        .order('data', { ascending: false });

      if (veiculoId) query = query.eq('veiculo_id', veiculoId);
      if (motoristaId) query = query.eq('condutor_id', motoristaId);

      const { data: abastecimentos, error } = await query;
      if (error) throw error;

      return (abastecimentos || []).filter((item) => !idsVinculadosSet.has(item.id) || includeIdsSet.has(item.id));
    },
    enabled,
  });
}

export function useCreateAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateAcertoPayload | AcertoViagemFormData): Promise<AcertoMutationResult> => {
      const formData = 'formData' in input ? input.formData : input;
      const { entregas_ids, abastecimentos_ids, abastecimentos_requisicao_ids, ...acertoData } = formData;
      const totalDespesas = calcularTotalDespesas(formData);

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

      if (entregas_ids.length > 0) {
        const vinculos = entregas_ids.map((entrega_id) => ({ acerto_id: acerto.id, entrega_id }));
        const { error: entregasError } = await supabase
          .from('acerto_viagem_entregas')
          .insert(vinculos);
        if (entregasError) throw entregasError;
      }

      if (abastecimentos_ids.length > 0) {
        const vinculos = abastecimentos_ids.map((abastecimento_id) => ({ acerto_id: acerto.id, abastecimento_id }));
        const { error: absError } = await supabase
          .from('acerto_viagem_abastecimentos')
          .insert(vinculos);
        if (absError) throw absError;
      }

      if (abastecimentos_requisicao_ids.length > 0) {
        const vinculos = abastecimentos_requisicao_ids.map((abastecimento_id) => ({ acerto_id: acerto.id, abastecimento_id }));
        const { error: reqError } = await supabase
          .from('acerto_viagem_abastecimentos_requisicao')
          .insert(vinculos);
        if (reqError) throw reqError;
      }

      const rateio = await applyRateioToEntregas(entregas_ids, totalDespesas);
      return {
        acertoId: acerto.id,
        rateio,
        removidasZeradas: 0,
      };
    },
    onSuccess: async (result) => {
      await invalidateAcertoQueries(queryClient);
      toast({
        title: 'Sucesso!',
        description: `Acerto criado. Rateio aplicado em ${result.rateio.quantidadeAtualizada} entrega(s).`,
      });
    },
    onError: (error: unknown) => {
      console.error('Erro ao criar acerto:', error);
      toast({
        title: 'Erro ao criar',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formData, removedEntregasAction = 'keep' }: UpdateAcertoPayload): Promise<AcertoMutationResult> => {
      const { entregas_ids, abastecimentos_ids, abastecimentos_requisicao_ids, ...acertoData } = formData;
      const totalDespesas = calcularTotalDespesas(formData);

      const { data: oldLinks, error: oldLinksError } = await supabase
        .from('acerto_viagem_entregas')
        .select('entrega_id')
        .eq('acerto_id', id);

      if (oldLinksError) throw oldLinksError;

      const oldIds = (oldLinks || []).map((item) => item.entrega_id);
      const removedIds = oldIds.filter((oldId) => !entregas_ids.includes(oldId));

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

      const { error: deleteEntregasError } = await supabase
        .from('acerto_viagem_entregas')
        .delete()
        .eq('acerto_id', id);

      if (deleteEntregasError) throw deleteEntregasError;

      if (entregas_ids.length > 0) {
        const vinculos = entregas_ids.map((entrega_id) => ({ acerto_id: id, entrega_id }));
        const { error: entregasError } = await supabase
          .from('acerto_viagem_entregas')
          .insert(vinculos);
        if (entregasError) throw entregasError;
      }

      const { error: deleteAbsError } = await supabase
        .from('acerto_viagem_abastecimentos')
        .delete()
        .eq('acerto_id', id);

      if (deleteAbsError) throw deleteAbsError;

      if (abastecimentos_ids.length > 0) {
        const vinculos = abastecimentos_ids.map((abastecimento_id) => ({ acerto_id: id, abastecimento_id }));
        const { error: absError } = await supabase
          .from('acerto_viagem_abastecimentos')
          .insert(vinculos);
        if (absError) throw absError;
      }

      const { error: deleteReqError } = await supabase
        .from('acerto_viagem_abastecimentos_requisicao')
        .delete()
        .eq('acerto_id', id);

      if (deleteReqError) throw deleteReqError;

      if (abastecimentos_requisicao_ids.length > 0) {
        const vinculos = abastecimentos_requisicao_ids.map((abastecimento_id) => ({ acerto_id: id, abastecimento_id }));
        const { error: reqError } = await supabase
          .from('acerto_viagem_abastecimentos_requisicao')
          .insert(vinculos);
        if (reqError) throw reqError;
      }

      const rateio = await applyRateioToEntregas(entregas_ids, totalDespesas);

      let removidasZeradas = 0;
      if (removedEntregasAction === 'zero' && removedIds.length > 0) {
        const elegiveisParaZerar = await filterEntregasSemOutrosAcertos(removedIds, id);
        removidasZeradas = await zeroEntregas(elegiveisParaZerar);
      }

      return {
        acertoId: id,
        rateio,
        removidasZeradas,
      };
    },
    onSuccess: async (result) => {
      await invalidateAcertoQueries(queryClient);
      const complemento =
        result.removidasZeradas > 0 ? ` ${result.removidasZeradas} removida(s) zerada(s).` : '';
      toast({
        title: 'Sucesso!',
        description: `Acerto atualizado. Rateio aplicado em ${result.rateio.quantidadeAtualizada} entrega(s).${complemento}`,
      });
    },
    onError: (error: unknown) => {
      console.error('Erro ao atualizar acerto:', error);
      toast({
        title: 'Erro ao atualizar',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: DeleteAcertoPayload | string) => {
      const payload = typeof input === 'string' ? { id: input, cleanupMode: 'keep' as const } : input;

      const { data: links, error: linksError } = await supabase
        .from('acerto_viagem_entregas')
        .select('entrega_id')
        .eq('acerto_id', payload.id);

      if (linksError) throw linksError;

      const entregaIds = (links || []).map((item) => item.entrega_id);

      let elegiveisParaZerar: string[] = [];
      if (payload.cleanupMode === 'zero' && entregaIds.length > 0) {
        elegiveisParaZerar = await filterEntregasSemOutrosAcertos(entregaIds, payload.id);
      }

      const { error } = await supabase
        .from('acertos_viagem')
        .delete()
        .eq('id', payload.id);

      if (error) throw error;

      if (payload.cleanupMode === 'zero' && elegiveisParaZerar.length > 0) {
        await zeroEntregas(elegiveisParaZerar);
      }

      return {
        cleanupMode: payload.cleanupMode,
        entregasZeradas: elegiveisParaZerar.length,
      };
    },
    onSuccess: async (result) => {
      await invalidateAcertoQueries(queryClient);
      toast({
        title: 'Sucesso!',
        description:
          result.cleanupMode === 'zero'
            ? `Acerto excluido e ${result.entregasZeradas} entrega(s) zerada(s).`
            : 'Acerto excluido com sucesso.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erro',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
