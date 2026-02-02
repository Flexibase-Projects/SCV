import { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, LocalGasStation as Fuel, Link, Warning as AlertTriangle } from '@mui/icons-material';
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
  CATEGORIAS_DESPESAS,
  STATUS_ACERTO_OPTIONS,
  calcularTotalDespesas,
  calcularSaldo,
  calcularDiasViagem,
  calcularKmRodado,
  AbastecimentoVinculado
} from '@/types/acertoViagem';
import { AbastecimentoSelectionModal } from './AbastecimentoSelectionModal';
import { formatDateLocal } from '@/utils/dateUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Tipo para entrega disponível (retorno simplificado do hook)
type EntregaDisponivel = {
  id: string;
  pv_foco: string | null;
  nota_fiscal?: string | null;
  cliente: string | null;
  uf: string | null;
  valor: number | null;
  data_saida?: string | null;
  motorista?: string | null;
  carro?: string | null;
};

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
});

interface AcertoViagemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  acerto: AcertoViagem | null;
}

export function AcertoViagemFormModal({ isOpen, onClose, acerto }: AcertoViagemFormModalProps) {
  const { data: veiculos = [] } = useVeiculos();
  const { data: motoristas = [] } = useMotoristas(true);
  const { data: entregasDisponiveis = [] } = useEntregasDisponiveis();
  const { data: acertoCompleto } = useAcertoViagem(acerto?.id || null);
  const [buscaEntrega, setBuscaEntrega] = useState('');
  const [isAbastecimentoModalOpen, setIsAbastecimentoModalOpen] = useState(false);
  
  const createAcerto = useCreateAcertoViagem();
  const updateAcerto = useUpdateAcertoViagem();

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
    },
  });

  const selectedVeiculoId = form.watch('veiculo_id');
  const selectedMotoristaId = form.watch('motorista_id');

  // Buscar abastecimentos disponíveis com base nos filtros
  const { data: abastecimentosDisponiveis = [] } = useAbastecimentosDisponiveis(
    selectedVeiculoId || null, 
    selectedMotoristaId || null
  );

  // Resetar busca quando modal abrir/fechar
  useEffect(() => {
    if (!isOpen) {
      setBuscaEntrega('');
      setIsAbastecimentoModalOpen(false);
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
  const entregasParaExibir = useMemo((): EntregaDisponivel[] => {
    const entregasJaVinculadas = acertoCompleto?.entregas?.map(e => e.entrega) || [];
    const idsJaVinculados = entregasJaVinculadas.map(e => e?.id);
    
    // Combinar disponíveis + já vinculadas (sem duplicatas)
    const todas: EntregaDisponivel[] = [
      ...entregasDisponiveis.filter((e) => !idsJaVinculados.includes(e.id)),
      ...(entregasJaVinculadas.filter(Boolean) as EntregaDisponivel[]),
    ];
    
    return todas;
  }, [entregasDisponiveis, acertoCompleto]);

  // Filtrar entregas por busca (PV FOCO, cliente, etc)
  const entregasFiltradas = useMemo(() => {
    if (!buscaEntrega.trim()) return entregasParaExibir;
    
    const buscaLower = buscaEntrega.toLowerCase();
    return entregasParaExibir.filter(entrega => {
      const pvFoco = entrega.pv_foco?.toLowerCase() || '';
      const cliente = entrega.cliente?.toLowerCase() || '';
      const notaFiscal = entrega.nota_fiscal?.toLowerCase() || '';
      return pvFoco.includes(buscaLower) || cliente.includes(buscaLower) || notaFiscal.includes(buscaLower);
    });
  }, [entregasParaExibir, buscaEntrega]);

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

  const handleAbastecimentosConfirm = (ids: string[]) => {
    form.setValue('abastecimentos_ids', ids);
    
    const selecionados = abastecimentosParaSelecao.filter(a => ids.includes(a.id));
    const total = selecionados.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    
    if (ids.length > 0) {
        form.setValue('despesa_combustivel', total);
    }
  };

  const abastecimentosIds = form.watch('abastecimentos_ids');
  const temAbastecimentoVinculado = abastecimentosIds && abastecimentosIds.length > 0;
  
  // Nomes dos postos vinculados para tooltip
  const nomesPostosVinculados = useMemo(() => {
      return abastecimentosParaSelecao
        .filter(a => abastecimentosIds.includes(a.id))
        .map(a => `${a.posto} (${a.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`)
        .join('\n');
  }, [abastecimentosParaSelecao, abastecimentosIds]);

  const onSubmit = (data: AcertoViagemFormData) => {
    if (acerto) {
      updateAcerto.mutate({ id: acerto.id, formData: data }, {
        onSuccess: () => {
          setBuscaEntrega('');
          onClose();
        },
      });
    } else {
      createAcerto.mutate(data, {
        onSuccess: () => {
          setBuscaEntrega('');
          onClose();
        },
      });
    }
  };

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
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                                    onClick={() => setIsAbastecimentoModalOpen(true)}
                                >
                                    <Link className="h-3 w-3 mr-1" />
                                    Vincular
                                </Button>
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
                        <div className="mb-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar por PV FOCO, cliente ou nota fiscal..."
                              value={buscaEntrega}
                              onChange={(e) => setBuscaEntrega(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                          {entregasFiltradas.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {buscaEntrega.trim() 
                                ? 'Nenhuma entrega encontrada com o termo buscado'
                                : 'Nenhuma entrega disponível para vincular'}
                            </p>
                          ) : (
                            entregasFiltradas.map((entrega) => (
                              <div 
                                key={entrega.id} 
                                className="flex items-center space-x-3 p-2 rounded hover:bg-muted"
                              >
                                <Checkbox
                                  checked={field.value.includes(entrega.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, entrega.id]);
                                    } else {
                                      field.onChange(field.value.filter(id => id !== entrega.id));
                                    }
                                  }}
                                />
                                <div className="flex-1 text-sm">
                                  <span className="font-medium">
                                    {entrega.pv_foco || entrega.nota_fiscal || 'Sem PV'}
                                  </span>
                                  <span className="text-muted-foreground"> - </span>
                                  <span>{entrega.cliente || 'Cliente não informado'}</span>
                                  <span className="text-muted-foreground"> ({entrega.uf || 'N/A'})</span>
                                </div>
                                <Badge variant="outline">
                                  R$ {(entrega.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {field.value.length} entrega(s) selecionada(s)
                        </p>
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
                  disabled={createAcerto.isPending || updateAcerto.isPending}
                >
                  {createAcerto.isPending || updateAcerto.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>

      <AbastecimentoSelectionModal 
        isOpen={isAbastecimentoModalOpen}
        onClose={() => setIsAbastecimentoModalOpen(false)}
        abastecimentos={abastecimentosParaSelecao}
        selectedIds={abastecimentosIds}
        onConfirm={handleAbastecimentosConfirm}
      />
    </Dialog>
  );
}
