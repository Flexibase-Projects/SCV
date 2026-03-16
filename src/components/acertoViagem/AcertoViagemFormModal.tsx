import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AddOutlined as Plus,
  LocalGasStationOutlined as Fuel,
  LinkOutlined as Link,
  CloseOutlined as X,
  InfoOutlined as Info,
} from '@mui/icons-material';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { 
  useCreateAcertoViagem, 
  useUpdateAcertoViagem,
  useEntregasDisponiveis,
  useAcertoViagem,
  useAbastecimentosDisponiveis
} from '@/hooks/useAcertosViagem';
import { 
  AcertoViagem, 
  AcertoViagemFormData,
  AcertoRemovedEntregasAction,
  CATEGORIAS_DESPESAS,
  STATUS_ACERTO_OPTIONS,
  RateioResumo,
  calcularTotalDespesas,
  calcularSaldo,
  calcularDiasViagem,
  calcularKmRodado,
  AbastecimentoVinculado
} from '@/types/acertoViagem';
import { AbastecimentoSelectionModal } from './AbastecimentoSelectionModal';
import { EntregaSelectionModal, type EntregaDisponivel } from './EntregaSelectionModal';
import { RemovedEntregasDecisionModal } from './RemovedEntregasDecisionModal';
import { RateioConfirmModal } from './RateioConfirmModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { calcularRateioEntregas } from '@/utils/acertoRateio';

// Tipo para entrega disponível (retorno simplificado do hook)
const formSchema = z.object({
  veiculo_id: z.string().min(1, 'Selecione um veículo'),
  motorista_id: z.string().min(1, 'Selecione um motorista'),
  destino: z.string().min(1, 'Informe o destino'),
  data_saida: z.string().min(1, 'Informe a data de saída'),
  data_chegada: z.string(),
  km_saida: z.coerce.number().nullable(),
  km_chegada: z.coerce.number().nullable(),
  valor_adiantamento: z.coerce.number().min(0),
  
  // Despesas
  despesa_combustivel: z.coerce.number().min(0),
  despesa_material_montagem: z.coerce.number().min(0),
  despesa_passagem_onibus: z.coerce.number().min(0),
  despesa_hotel: z.coerce.number().min(0),
  despesa_lavanderia: z.coerce.number().min(0),
  despesa_taxi_transporte: z.coerce.number().min(0),
  despesa_veiculo: z.coerce.number().min(0),
  despesa_ajudante: z.coerce.number().min(0),
  despesa_cartao_telefonico: z.coerce.number().min(0),
  despesa_alimentacao: z.coerce.number().min(0),
  despesa_diaria_motorista: z.coerce.number().min(0),
  despesa_diaria_montador: z.coerce.number().min(0),
  despesa_outros: z.coerce.number().min(0),
  despesa_outros_descricao: z.string(),
  
  observacoes: z.string(),
  status: z.enum(['PENDENTE', 'ACERTADO']),
  entregas_ids: z.array(z.string()),
  abastecimentos_ids: z.array(z.string()),
  abastecimentos_requisicao_ids: z.array(z.string()),
});

interface AcertoViagemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  acerto: AcertoViagem | null;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function AcertoViagemFormModal({ isOpen, onClose, acerto }: AcertoViagemFormModalProps) {
  const { data: veiculos = [] } = useVeiculos();
  const { data: motoristas = [] } = useMotoristas(true);
  const { data: acertoCompleto } = useAcertoViagem(acerto?.id || null);
  const [buscaEntrega, setBuscaEntrega] = useState('');
  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [isAbastecimentoModalOpen, setIsAbastecimentoModalOpen] = useState(false);
  const [isRequisicaoModalOpen, setIsRequisicaoModalOpen] = useState(false);
  const [isRateioConfirmOpen, setIsRateioConfirmOpen] = useState(false);
  const [isRemovedDecisionOpen, setIsRemovedDecisionOpen] = useState(false);
  const [submitDraft, setSubmitDraft] = useState<AcertoViagemFormData | null>(null);
  const [submitRemovedAction, setSubmitRemovedAction] = useState<AcertoRemovedEntregasAction>('keep');
  const [pendingRateio, setPendingRateio] = useState<RateioResumo | null>(null);
  const [pendingRemovedIds, setPendingRemovedIds] = useState<string[]>([]);
  const { toast } = useToast();
  
  const createAcerto = useCreateAcertoViagem();
  const updateAcerto = useUpdateAcertoViagem();

  const isSubmitting = createAcerto.isPending || updateAcerto.isPending;

  const form = useForm<AcertoViagemFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo_id: '',
      motorista_id: '',
      destino: '',
      data_saida: new Date().toISOString().split('T')[0],
      data_chegada: '',
      km_saida: null,
      km_chegada: null,
      valor_adiantamento: 0,
      despesa_combustivel: 0,
      despesa_material_montagem: 0,
      despesa_passagem_onibus: 0,
      despesa_hotel: 0,
      despesa_lavanderia: 0,
      despesa_taxi_transporte: 0,
      despesa_veiculo: 0,
      despesa_ajudante: 0,
      despesa_cartao_telefonico: 0,
      despesa_alimentacao: 0,
      despesa_diaria_motorista: 0,
      despesa_diaria_montador: 0,
      despesa_outros: 0,
      despesa_outros_descricao: '',
      observacoes: '',
      status: 'PENDENTE',
      entregas_ids: [],
      abastecimentos_ids: [],
      abastecimentos_requisicao_ids: [],
    },
  });

  const selectedVeiculoId = form.watch('veiculo_id');
  const selectedMotoristaId = form.watch('motorista_id');
  const entregasIds = form.watch('entregas_ids');
  const abastecimentosIds = form.watch('abastecimentos_ids');
  const abastecimentosRequisicaoIds = form.watch('abastecimentos_requisicao_ids');
  const debouncedBuscaEntrega = useDebounce(buscaEntrega, 300);

  const { data: entregasDisponiveis = [], isLoading: isLoadingEntregas } = useEntregasDisponiveis({
    searchTerm: debouncedBuscaEntrega,
    includeIds: entregasIds,
    enabled: isOpen && isEntregaModalOpen,
    limit: 60,
  });

  const { data: abastecimentosDisponiveis = [] } = useAbastecimentosDisponiveis({
    veiculoId: selectedVeiculoId || null,
    motoristaId: selectedMotoristaId || null,
    includeIds: abastecimentosIds,
    mode: 'combustivel',
    enabled: isOpen && isAbastecimentoModalOpen,
  });

  const { data: abastecimentosRequisicaoDisponiveis = [] } = useAbastecimentosDisponiveis({
    veiculoId: selectedVeiculoId || null,
    motoristaId: selectedMotoristaId || null,
    includeIds: abastecimentosRequisicaoIds,
    mode: 'requisicao',
    enabled: isOpen && isRequisicaoModalOpen,
  });

  // Resetar busca quando modal abrir/fechar
  useEffect(() => {
    if (!isOpen) {
      setBuscaEntrega('');
      setIsEntregaModalOpen(false);
      setIsAbastecimentoModalOpen(false);
      setIsRequisicaoModalOpen(false);
      setIsRateioConfirmOpen(false);
      setIsRemovedDecisionOpen(false);
      setSubmitDraft(null);
      setPendingRateio(null);
      setPendingRemovedIds([]);
      setSubmitRemovedAction('keep');
    }
  }, [isOpen]);

  // Carregar dados do acerto para edição
  useEffect(() => {
    if (acertoCompleto) {
      form.reset({
        veiculo_id: acertoCompleto.veiculo_id || '',
        motorista_id: acertoCompleto.motorista_id || '',
        destino: acertoCompleto.destino,
        data_saida: acertoCompleto.data_saida,
        data_chegada: acertoCompleto.data_chegada || '',
        km_saida: acertoCompleto.km_saida,
        km_chegada: acertoCompleto.km_chegada,
        valor_adiantamento: acertoCompleto.valor_adiantamento || 0,
        despesa_combustivel: acertoCompleto.despesa_combustivel || 0,
        despesa_material_montagem: acertoCompleto.despesa_material_montagem || 0,
        despesa_passagem_onibus: acertoCompleto.despesa_passagem_onibus || 0,
        despesa_hotel: acertoCompleto.despesa_hotel || 0,
        despesa_lavanderia: acertoCompleto.despesa_lavanderia || 0,
        despesa_taxi_transporte: acertoCompleto.despesa_taxi_transporte || 0,
        despesa_veiculo: acertoCompleto.despesa_veiculo || 0,
        despesa_ajudante: acertoCompleto.despesa_ajudante || 0,
        despesa_cartao_telefonico: acertoCompleto.despesa_cartao_telefonico || 0,
        despesa_alimentacao: acertoCompleto.despesa_alimentacao || 0,
        despesa_diaria_motorista: acertoCompleto.despesa_diaria_motorista || 0,
        despesa_diaria_montador: acertoCompleto.despesa_diaria_montador || 0,
        despesa_outros: acertoCompleto.despesa_outros || 0,
        despesa_outros_descricao: acertoCompleto.despesa_outros_descricao || '',
        observacoes: acertoCompleto.observacoes || '',
        status: acertoCompleto.status,
        entregas_ids: acertoCompleto.entregas?.map(e => e.entrega_id) || [],
        abastecimentos_ids: acertoCompleto.abastecimentos?.map(a => a.id) || [],
        abastecimentos_requisicao_ids: acertoCompleto.abastecimentos_requisicao?.map(a => a.id) || [],
      });
    } else if (!acerto) {
      form.reset();
    }
  }, [acertoCompleto, acerto, form]);

  // Calcular totais em tempo real
  const formValues = form.watch();
  const totalDespesas = calcularTotalDespesas(formValues);
  const saldo = calcularSaldo(formValues);
  const dias = calcularDiasViagem(formValues.data_saida, formValues.data_chegada);
  const kmRodado = calcularKmRodado(formValues.km_saida, formValues.km_chegada);

  // Veículo selecionado (objeto)
  const veiculoSelecionado = useMemo(() => {
    return veiculos.find(v => v.id === formValues.veiculo_id);
  }, [veiculos, formValues.veiculo_id]);

  // Entregas para exibição (disponíveis + já vinculadas ao acerto)
  const entregasMap = useMemo(() => {
    const map = new Map<string, EntregaDisponivel>();
    
    // Combinar disponíveis + já vinculadas (sem duplicatas)
    (acertoCompleto?.entregas || []).forEach((item) => {
      if (!item.entrega?.id) return;
      map.set(item.entrega.id, {
        id: item.entrega.id,
        pv_foco: item.entrega.pv_foco,
        nota_fiscal: item.entrega.nota_fiscal,
        cliente: item.entrega.cliente,
        uf: item.entrega.uf,
        valor: item.entrega.valor,
        gastos_entrega: item.entrega.gastos_entrega ?? 0,
        percentual_gastos: item.entrega.percentual_gastos ?? 0,
      });
    });

    entregasDisponiveis.forEach((entrega) => {
      map.set(entrega.id, entrega);
    });

    return map;
  }, [acertoCompleto, entregasDisponiveis]);

  const entregasSelecionadas = useMemo(() => {
    return entregasIds.map((id) => {
      const entrega = entregasMap.get(id);
      return (
        entrega || {
          id,
          pv_foco: null,
          nota_fiscal: null,
          cliente: 'Entrega não carregada',
          uf: null,
          valor: 0,
          gastos_entrega: 0,
          percentual_gastos: 0,
        }
      );
    });
  }, [entregasIds, entregasMap]);

  const entregasOriginaisIds = useMemo(
    () => acertoCompleto?.entregas?.map((item) => item.entrega_id) || [],
    [acertoCompleto]
  );

  const buildRateioPreview = useCallback(
    (data: AcertoViagemFormData): RateioResumo => {
      const total = calcularTotalDespesas(data);
      const inputs = data.entregas_ids.map((id) => {
        const entrega = entregasMap.get(id);
        return {
          id,
          valor: entrega?.valor ?? 0,
          gastoAtual: entrega?.gastos_entrega ?? 0,
        };
      });
      return calcularRateioEntregas(total, inputs);
    },
    [entregasMap]
  );

  const rateioPreviewRealtime = useMemo(() => {
    return buildRateioPreview(formValues as AcertoViagemFormData);
  }, [formValues, buildRateioPreview]);

  // Abastecimentos para seleção (disponíveis + já vinculados)
  const abastecimentosParaSelecao = useMemo(() => {
    const vinculadosAtual = acertoCompleto?.abastecimentos || [];
    const idsVinculadosAtual = vinculadosAtual.map(a => a.id);
    
    // Mapear disponíveis para o formato correto se necessário, 
    // mas aqui assumimos que useAbastecimentosDisponiveis retorna o formato compatível (parcialmente)
    // Precisamos garantir tipagem correta.
    // O hook retorna dados da tabela 'abastecimentos'.
    const disponiveis = abastecimentosDisponiveis.filter(a => !idsVinculadosAtual.includes(a.id));
    
    // Converter para AbastecimentoVinculado
    const disponiveisFormatados: AbastecimentoVinculado[] = disponiveis.map(a => ({
        id: a.id,
        data: a.data,
        valor_total: a.valor_total,
        posto: a.posto || 'Não informado',
        litros: a.litros
    }));

    return [...vinculadosAtual, ...disponiveisFormatados];
  }, [abastecimentosDisponiveis, acertoCompleto]);

  const abastecimentosRequisicaoParaSelecao = useMemo(() => {
    const vinculadosAtual = acertoCompleto?.abastecimentos_requisicao || [];
    const idsVinculadosAtual = vinculadosAtual.map((abastecimento) => abastecimento.id);
    const disponiveis = abastecimentosRequisicaoDisponiveis.filter(
      (abastecimento) => !idsVinculadosAtual.includes(abastecimento.id)
    );
    const disponiveisFormatados: AbastecimentoVinculado[] = disponiveis.map((abastecimento) => ({
      id: abastecimento.id,
      data: abastecimento.data,
      valor_total: abastecimento.valor_total,
      posto: abastecimento.posto || 'NÃ£o informado',
      litros: abastecimento.litros,
    }));
    return [...vinculadosAtual, ...disponiveisFormatados];
  }, [abastecimentosRequisicaoDisponiveis, acertoCompleto]);

  const handleEntregasConfirm = (ids: string[]) => {
    form.setValue('entregas_ids', ids, { shouldDirty: true, shouldTouch: true });
  };

  const handleRemoveEntrega = (entregaId: string) => {
    form.setValue(
      'entregas_ids',
      entregasIds.filter((id) => id !== entregaId),
      { shouldDirty: true, shouldTouch: true }
    );
  };

  const handleAbastecimentosConfirm = (ids: string[]) => {
    form.setValue('abastecimentos_ids', ids);
    
    const selecionados = abastecimentosParaSelecao.filter(a => ids.includes(a.id));
    const total = selecionados.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    
    if (ids.length > 0) {
        form.setValue('despesa_combustivel', total);
    } else {
        form.setValue('despesa_combustivel', 0);
    }
  };

  const handleRequisicaoConfirm = (ids: string[]) => {
    form.setValue('abastecimentos_requisicao_ids', ids, { shouldDirty: true, shouldTouch: true });
  };

  const temAbastecimentoVinculado = abastecimentosIds && abastecimentosIds.length > 0;
  const temRequisicaoVinculada = abastecimentosRequisicaoIds.length > 0;
  const requisicoesSelecionadas = useMemo(
    () =>
      abastecimentosRequisicaoParaSelecao.filter((abastecimento) =>
        abastecimentosRequisicaoIds.includes(abastecimento.id)
      ),
    [abastecimentosRequisicaoParaSelecao, abastecimentosRequisicaoIds]
  );
  const totalRequisicaoSelecionado = useMemo(
    () => requisicoesSelecionadas.reduce((acc, item) => acc + (item.valor_total || 0), 0),
    [requisicoesSelecionadas]
  );

  // Nomes dos postos vinculados para tooltip
  const nomesPostosVinculados = useMemo(() => {
      return abastecimentosParaSelecao
        .filter(a => abastecimentosIds.includes(a.id))
        .map(a => `${a.posto} (${a.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`)
        .join('\n');
  }, [abastecimentosParaSelecao, abastecimentosIds]);

  const nomesPostosRequisicaoVinculados = useMemo(() => {
    return requisicoesSelecionadas
      .map((abastecimento) =>
        `${abastecimento.posto} (${abastecimento.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
      )
      .join('\n');
  }, [requisicoesSelecionadas]);

  // Nome do motorista selecionado para exibir no modal
  const nomeMotoristaSelecionado = useMemo(() => {
    if (!selectedMotoristaId) return null;
    return motoristas.find(m => m.id === selectedMotoristaId)?.nome || null;
  }, [motoristas, selectedMotoristaId]);

  // Handler para abrir modal de abastecimentos com validação
  const handleOpenAbastecimentoModal = () => {
    if (!selectedMotoristaId) {
      toast({
        title: 'Motorista não selecionado',
        description: 'Por favor, selecione um motorista antes de vincular abastecimentos.',
        variant: 'destructive',
      });
      return;
    }
    setIsAbastecimentoModalOpen(true);
  };

  const handleOpenRequisicaoModal = () => {
    if (!selectedMotoristaId) {
      toast({
        title: 'Motorista nÃ£o selecionado',
        description: 'Por favor, selecione um motorista antes de vincular abastecimentos por requisiÃ§Ã£o.',
        variant: 'destructive',
      });
      return;
    }
    setIsRequisicaoModalOpen(true);
  };

  // Limpar abastecimentos vinculados quando motorista mudar (para evitar incompatibilidade)
  const previousMotoristaId = useRef<string | null>(null);
  useEffect(() => {
    // Se motorista mudou E havia abastecimentos vinculados, limpar
    if (
      previousMotoristaId.current !== null && 
      previousMotoristaId.current !== selectedMotoristaId &&
      (abastecimentosIds.length > 0 || abastecimentosRequisicaoIds.length > 0)
    ) {
      toast({
        title: 'Atenção: Motorista alterado',
        description: 'Os abastecimentos vinculados (combustível e requisição) foram removidos. Por favor, vincule novamente para o novo motorista.',
        variant: 'destructive',
      });
      form.setValue('abastecimentos_ids', []);
      form.setValue('abastecimentos_requisicao_ids', []);
      form.setValue('despesa_combustivel', 0);
    }
    previousMotoristaId.current = selectedMotoristaId || null;
  }, [selectedMotoristaId, abastecimentosIds.length, abastecimentosRequisicaoIds.length, form, toast]);

  const handleSubmitSuccess = () => {
    setBuscaEntrega('');
    setIsRateioConfirmOpen(false);
    setIsRemovedDecisionOpen(false);
    setSubmitDraft(null);
    setPendingRemovedIds([]);
    setPendingRateio(null);
    setSubmitRemovedAction('keep');
    onClose();
  };

  const executePersist = (data: AcertoViagemFormData, removedAction: AcertoRemovedEntregasAction) => {
    if (acerto) {
      updateAcerto.mutate(
        { id: acerto.id, formData: data, removedEntregasAction: removedAction },
        { onSuccess: handleSubmitSuccess }
      );
      return;
    }

    createAcerto.mutate(
      { formData: data },
      { onSuccess: handleSubmitSuccess }
    );
  };

  const openRateioConfirmation = (
    data: AcertoViagemFormData,
    removedIds: string[],
    removedAction: AcertoRemovedEntregasAction
  ) => {
    setSubmitDraft(data);
    setPendingRemovedIds(removedIds);
    setSubmitRemovedAction(removedAction);

    if (data.entregas_ids.length === 0) {
      executePersist(data, removedAction);
      return;
    }

    setPendingRateio(buildRateioPreview(data));
    setIsRateioConfirmOpen(true);
  };

  const onSubmit = (data: AcertoViagemFormData) => {
    const removedIds =
      acerto != null ? entregasOriginaisIds.filter((id) => !data.entregas_ids.includes(id)) : [];

    if (acerto && removedIds.length > 0) {
      setSubmitDraft(data);
      setPendingRemovedIds(removedIds);
      setIsRemovedDecisionOpen(true);
      return;
    }

    openRateioConfirmation(data, removedIds, 'keep');
  };

  const handleChooseKeepRemoved = () => {
    if (!submitDraft) return;
    setIsRemovedDecisionOpen(false);
    openRateioConfirmation(submitDraft, pendingRemovedIds, 'keep');
  };

  const handleChooseZeroRemoved = () => {
    if (!submitDraft) return;
    setIsRemovedDecisionOpen(false);
    openRateioConfirmation(submitDraft, pendingRemovedIds, 'zero');
  };

  const removedEntregasPreview = useMemo(() => {
    return pendingRemovedIds.map((id) => {
      const entrega = entregasMap.get(id);
      return (
        entrega || {
          id,
          pv_foco: null,
          nota_fiscal: null,
          cliente: 'Entrega não carregada',
          uf: null,
          valor: 0,
          gastos_entrega: 0,
          percentual_gastos: 0,
        }
      );
    });
  }, [pendingRemovedIds, entregasMap]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>
            {acerto ? 'Editar Acerto de Viagem' : 'Novo Acerto de Viagem'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados do Veículo e Responsável */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados da Viagem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="veiculo_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veículo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {veiculos.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.modelo || v.fabricante || 'Sem modelo'} - {v.placa}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {veiculoSelecionado && (
                      <div className="flex items-end pb-2">
                        <Badge variant="outline">
                          {veiculoSelecionado.modelo || veiculoSelecionado.placa}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="motorista_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorista/Montador *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motorista ou montador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {motoristas.filter(m => m.ativo).map((m) => {
                              const funcoes = [];
                              if (m.eh_motorista) {
                                funcoes.push('Motorista/Condutor');
                              }
                              if (m.eh_montador) {
                                funcoes.push('Montador');
                              }
                              const funcoesStr = funcoes.length > 0 ? ` (${funcoes.join(', ')})` : '';
                              return (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.nome}{funcoesStr}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="destino"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destino *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Goiânia" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_saida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Saída *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_chegada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Chegada</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end pb-2">
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        {dias > 0 ? `${dias} dia(s)` : 'Aguardando datas'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="km_saida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KM Saída</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value ?? ''} 
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              placeholder="Ex: 50000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="km_chegada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KM Chegada</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value ?? ''} 
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              placeholder="Ex: 50500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end pb-2 col-span-2">
                      <Badge variant="outline" className="w-full justify-center py-2">
                        KM Rodado: {kmRodado !== null ? `${kmRodado.toLocaleString('pt-BR')} km` : 'Aguardando KM'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valor Adiantado */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Valor Especificado (Adiantamento)</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="valor_adiantamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Adiantado (R$) *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Ex: 500,00"
                            className="max-w-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Despesas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Renderiza Combustível separadamente com botão de vínculo */}
                     <FormField
                        key="despesa_combustivel"
                        control={form.control}
                        name="despesa_combustivel"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-xs">Combustível</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleOpenAbastecimentoModal}
                                            disabled={!selectedMotoristaId}
                                        >
                                            <Link className="h-3 w-3 mr-1" />
                                            Vincular
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!selectedMotoristaId && (
                                      <TooltipContent>
                                        <p>Selecione um motorista primeiro para vincular abastecimentos</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                            </div>
                            <FormControl>
                              <div className="relative">
                                  <CurrencyInput
                                    value={field.value as number}
                                    onValueChange={(value) => field.onChange(value || 0)}
                                    placeholder="0,00"
                                    disabled={temAbastecimentoVinculado}
                                    className={temAbastecimentoVinculado ? 'bg-muted pr-8' : ''}
                                  />
                                  {temAbastecimentoVinculado && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 cursor-help">
                                                    <Fuel className="h-4 w-4" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold mb-1">Valor calculado automaticamente</p>
                                                <pre className="text-xs whitespace-pre-wrap">{nomesPostosVinculados}</pre>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                  )}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                    {CATEGORIAS_DESPESAS.filter(c => c.key !== 'despesa_combustivel').map((categoria) => (
                      <FormField
                        key={categoria.key}
                        control={form.control}
                        name={categoria.key as keyof AcertoViagemFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">{categoria.label}</FormLabel>
                            <FormControl>
                              <CurrencyInput
                                value={field.value as number}
                                onValueChange={(value) => field.onChange(value || 0)}
                                placeholder="0,00"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-dashed bg-muted/20 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Abastecimento por Requisicao</p>
                        <p className="text-xs text-muted-foreground">
                          Valor ja pago pela empresa antes da viagem. Apenas vinculacao e exibicao.
                        </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={handleOpenRequisicaoModal}
                                disabled={!selectedMotoristaId}
                              >
                                <Link className="h-4 w-4" />
                                Vincular Requisicao
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!selectedMotoristaId && (
                            <TooltipContent>
                              <p>Selecione um motorista primeiro para vincular requisicoes.</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant={temRequisicaoVinculada ? 'default' : 'outline'}>
                        {abastecimentosRequisicaoIds.length} requisicao(oes) vinculada(s)
                      </Badge>
                      <Badge variant="outline">
                        Total requisicao: {formatCurrency(totalRequisicaoSelecionado)}
                      </Badge>
                      {temRequisicaoVinculada && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-help items-center gap-1 text-muted-foreground">
                                <Fuel className="h-4 w-4" />
                                Ver itens
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <pre className="max-h-40 whitespace-pre-wrap text-xs">{nomesPostosRequisicaoVinculados}</pre>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {requisicoesSelecionadas.length > 0 && (
                      <div className="mt-3 max-h-32 overflow-auto rounded-md border bg-background p-2">
                        <ul className="space-y-1 text-xs">
                          {requisicoesSelecionadas.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-2">
                              <span className="truncate text-muted-foreground">
                                {item.posto || 'Posto nao informado'}
                              </span>
                              <span className="font-medium">{formatCurrency(item.valor_total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="despesa_outros"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outros (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onValueChange={(value) => field.onChange(value || 0)}
                              placeholder="0,00"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="despesa_outros_descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Outros</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descreva a despesa" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resumo Financeiro */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground">Adiantamento</p>
                      <p className="text-xl font-bold text-blue-500">
                        R$ {(formValues.valor_adiantamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Despesas</p>
                      <p className="text-xl font-bold text-orange-500">
                        R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {saldo.tipo === 'devolver' ? 'Devolver p/ Empresa' : 'Receber da Empresa'}
                      </p>
                      <p className={`text-xl font-bold ${saldo.tipo === 'devolver' ? 'text-green-500' : 'text-red-500'}`}>
                        R$ {saldo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Entregas Vinculadas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Entregas Vinculadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="entregas_ids"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {field.value.length} entrega(s) vinculada(s)
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setBuscaEntrega('');
                              setIsEntregaModalOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Incluir entrega
                          </Button>
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                          {field.value.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma entrega vinculada. Use "Incluir entrega" para buscar por PV, NF ou cliente.
                            </p>
                          ) : (
                            entregasSelecionadas.map((entrega) => (
                              <div 
                                key={entrega.id} 
                                className="flex items-center gap-3 p-2 rounded border bg-muted/20"
                              >
                                <div className="flex-1 text-sm">
                                  <span className="font-medium">
                                    {entrega.pv_foco || entrega.nota_fiscal || 'Sem PV'}
                                  </span>
                                  <span className="text-muted-foreground"> - </span>
                                  <span>{entrega.cliente || 'Cliente não informado'}</span>
                                  <span className="text-muted-foreground"> ({entrega.uf || 'N/A'})</span>
                                </div>
                                <Badge variant="outline">
                                  {(entrega.valor || 0).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveEntrega(entrega.id)}
                                  aria-label="Remover entrega"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 border rounded-lg p-3 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-medium">Prévia de rateio</span>
                            <Badge variant="outline">Base: {formatCurrency(rateioPreviewRealtime.baseValor)}</Badge>
                            <Badge variant="outline">Despesas: {formatCurrency(rateioPreviewRealtime.totalDespesas)}</Badge>
                            <Badge variant="outline">Distribuído: {formatCurrency(rateioPreviewRealtime.totalDistribuido)}</Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 text-muted-foreground cursor-help">
                                    <Info className="h-4 w-4" />
                                    Ajuste de centavos
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  O sistema arredonda para 2 casas decimais e aplica eventual diferença final na última entrega com valor.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          {rateioPreviewRealtime.temBaseZero && field.value.length > 0 && (
                            <p className="text-xs text-amber-600">
                              Base de valores zerada: os gastos de entrega serão gravados como R$ 0,00 até existir valor de pedido.
                            </p>
                          )}
                          {rateioPreviewRealtime.temEntregaValorZero && (
                            <p className="text-xs text-amber-600">
                              Há entrega(s) com valor zero. Elas recebem 0% do rateio.
                            </p>
                          )}

                          <div className="max-h-48 overflow-auto rounded-md border">
                            {field.value.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Vincule entregas para visualizar o rateio proporcional.
                              </p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead className="bg-muted/40 sticky top-0">
                                  <tr>
                                    <th className="text-left p-2">Entrega</th>
                                    <th className="text-right p-2">Valor</th>
                                    <th className="text-right p-2">%</th>
                                    <th className="text-right p-2">Atual</th>
                                    <th className="text-right p-2">Novo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rateioPreviewRealtime.entregas.map((item) => {
                                    const entrega = entregasMap.get(item.id);
                                    const label =
                                      entrega?.pv_foco || entrega?.nota_fiscal || entrega?.cliente || item.id;
                                    return (
                                      <tr key={item.id} className="border-t">
                                        <td className="p-2">{label}</td>
                                        <td className="p-2 text-right">{formatCurrency(item.valor)}</td>
                                        <td className="p-2 text-right">{item.percentual.toFixed(2)}%</td>
                                        <td className="p-2 text-right">{formatCurrency(item.gastoAnterior)}</td>
                                        <td className="p-2 text-right font-medium">{formatCurrency(item.gastoNovo)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Observações e Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Observações e Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Observações sobre a viagem..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_ACERTO_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 pb-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>

      <EntregaSelectionModal
        isOpen={isEntregaModalOpen}
        onClose={() => {
          setIsEntregaModalOpen(false);
          setBuscaEntrega('');
        }}
        entregas={entregasDisponiveis}
        selectedIds={entregasIds}
        onConfirm={handleEntregasConfirm}
        searchTerm={buscaEntrega}
        onSearchTermChange={setBuscaEntrega}
        isLoading={isLoadingEntregas}
      />

      <AbastecimentoSelectionModal 
        isOpen={isAbastecimentoModalOpen}
        onClose={() => setIsAbastecimentoModalOpen(false)}
        abastecimentos={abastecimentosParaSelecao}
        selectedIds={abastecimentosIds}
        onConfirm={handleAbastecimentosConfirm}
        motoristaNome={nomeMotoristaSelecionado}
      />

      <AbastecimentoSelectionModal
        isOpen={isRequisicaoModalOpen}
        onClose={() => setIsRequisicaoModalOpen(false)}
        abastecimentos={abastecimentosRequisicaoParaSelecao}
        selectedIds={abastecimentosRequisicaoIds}
        onConfirm={handleRequisicaoConfirm}
        motoristaNome={nomeMotoristaSelecionado}
        title="Selecionar Abastecimentos por Requisicao"
        helperText="Esses abastecimentos sao exibidos no acerto, mas nao entram no total de despesas."
      />

      <RemovedEntregasDecisionModal
        isOpen={isRemovedDecisionOpen}
        onClose={() => {
          setIsRemovedDecisionOpen(false);
          setSubmitDraft(null);
          setPendingRemovedIds([]);
        }}
        onChooseKeep={handleChooseKeepRemoved}
        onChooseZero={handleChooseZeroRemoved}
        removedEntregas={removedEntregasPreview}
      />

      <RateioConfirmModal
        isOpen={isRateioConfirmOpen}
        onClose={() => {
          setIsRateioConfirmOpen(false);
          setPendingRateio(null);
          setSubmitDraft(null);
          setPendingRemovedIds([]);
        }}
        onConfirm={() => {
          if (!submitDraft) return;
          executePersist(submitDraft, submitRemovedAction);
        }}
        isSubmitting={isSubmitting}
        rateio={pendingRateio}
        entregasMap={entregasMap}
      />
    </Dialog>
  );
}
