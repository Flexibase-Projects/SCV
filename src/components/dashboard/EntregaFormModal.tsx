import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { parseDateLocal } from '@/utils/dateUtils';
import { CalendarMonth as CalendarIcon, Close as X, Add as Plus } from '@mui/icons-material';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Entrega, ESTADOS_BRASILEIROS, STATUS_OPTIONS, TIPO_TRANSPORTE_OPTIONS } from '@/types/entrega';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMontadores } from '@/hooks/useMontadores';

const formSchema = z.object({
  pv_foco: z.string().optional(),
  nf: z.string().optional(),
  valor: z.coerce.number().min(0).optional(),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  uf: z.string().optional(),
  data_saida: z.date().optional(),
  motorista: z.string().optional(),
  carro: z.string().optional(),
  tipo_transporte: z.string().optional(),
  status: z.string().optional(),
  precisa_montagem: z.boolean().optional(),
  status_montagem: z.enum(['PENDENTE', 'CONCLUIDO']).optional(),
  data_montagem: z.date().optional(),
  montadores: z.string().optional(),
  gastos_entrega: z.coerce.number().min(0).optional(),
  gastos_montagem: z.coerce.number().min(0).optional(),
  produtividade: z.coerce.number().min(0).optional(),
  erros: z.string().optional(),
  descricao_erros: z.string().optional(),
}).refine((data) => {
  if (data.status_montagem === 'CONCLUIDO' && !data.data_montagem) {
    return false;
  }
  return true;
}, {
  message: 'Data de montagem é obrigatória quando status é Concluído',
  path: ['data_montagem']
});

type FormData = z.infer<typeof formSchema>;

interface EntregaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega: Entrega | null;
  onSubmit: (data: FormData & { montador_1?: string; montador_2?: string }) => void;
  isLoading: boolean;
}

export function EntregaFormModal({
  open,
  onOpenChange,
  entrega,
  onSubmit,
  isLoading
}: EntregaFormModalProps) {
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: montadoresData = [] } = useMontadores();
  
  const [selectedMontadores, setSelectedMontadores] = useState<string[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pv_foco: '',
      nf: '',
      valor: 0,
      cliente: '',
      uf: '',
      motorista: '',
      carro: '',
      tipo_transporte: '',
      status: 'PENDENTE',
      precisa_montagem: false,
      status_montagem: undefined,
      montadores: '',
      gastos_entrega: 0,
      gastos_montagem: 0,
      produtividade: 0,
      erros: '',
      descricao_erros: '',
    },
  });

  useEffect(() => {
    if (entrega) {
      // Combinar montador_1 e montador_2 existentes em um array
      const existingMontadores: string[] = [];
      if (entrega.montador_1) existingMontadores.push(entrega.montador_1);
      if (entrega.montador_2) existingMontadores.push(entrega.montador_2);
      setSelectedMontadores(existingMontadores);
      
      form.reset({
        pv_foco: entrega.pv_foco || '',
        nf: entrega.nf || '',
        valor: entrega.valor || 0,
        cliente: entrega.cliente || '',
        uf: entrega.uf || '',
        data_saida: entrega.data_saida ? parseDateLocal(entrega.data_saida) || undefined : undefined,
        motorista: entrega.motorista || '',
        carro: entrega.carro || '',
        tipo_transporte: entrega.tipo_transporte || '',
        status: entrega.status || 'PENDENTE',
        precisa_montagem: entrega.precisa_montagem || false,
        status_montagem: entrega.status_montagem || undefined,
        data_montagem: entrega.data_montagem ? parseDateLocal(entrega.data_montagem) || undefined : undefined,
        montadores: existingMontadores.join(', '),
        gastos_entrega: entrega.gastos_entrega || 0,
        gastos_montagem: entrega.gastos_montagem || 0,
        produtividade: entrega.produtividade || 0,
        erros: entrega.erros || '',
        descricao_erros: entrega.descricao_erros || '',
      });
    } else {
      setSelectedMontadores([]);
      form.reset({
        pv_foco: '',
        nf: '',
        valor: 0,
        cliente: '',
        uf: '',
        motorista: '',
        carro: '',
        tipo_transporte: '',
        status: 'PENDENTE',
        precisa_montagem: false,
        montadores: '',
        gastos_entrega: 0,
        gastos_montagem: 0,
        produtividade: 0,
        erros: '',
        descricao_erros: '',
      });
    }
  }, [entrega, form]);

  // Lógica de atualização automática de status_montagem
  const precisaMontagem = form.watch('precisa_montagem');
  const dataMontagem = form.watch('data_montagem');
  const statusMontagem = form.watch('status_montagem');

  useEffect(() => {
    if (!precisaMontagem) {
      // Se não precisa montagem, limpar status
      form.setValue('status_montagem', undefined);
      return;
    }

    // Se precisa montagem e tem data → CONCLUIDO
    if (dataMontagem) {
      form.setValue('status_montagem', 'CONCLUIDO');
    } 
    // Se precisa montagem mas não tem data → PENDENTE
    else if (precisaMontagem && !dataMontagem) {
      form.setValue('status_montagem', 'PENDENTE');
    }
  }, [precisaMontagem, dataMontagem, form]);

  const addMontador = (nome: string) => {
    if (nome && !selectedMontadores.includes(nome)) {
      const newMontadores = [...selectedMontadores, nome];
      setSelectedMontadores(newMontadores);
      form.setValue('montadores', newMontadores.join(', '));
    }
  };

  const removeMontador = (nome: string) => {
    const newMontadores = selectedMontadores.filter(m => m !== nome);
    setSelectedMontadores(newMontadores);
    form.setValue('montadores', newMontadores.join(', '));
  };

  // Montadores disponíveis (que ainda não foram selecionados)
  const availableMontadores = montadoresData.filter(
    m => m.ativo && !selectedMontadores.includes(m.nome)
  );

  const handleSubmit = (data: FormData) => {
    // Converter montadores de volta para montador_1 e montador_2 para compatibilidade
    const submitData = {
      ...data,
      montador_1: selectedMontadores[0] || '',
      montador_2: selectedMontadores[1] || '',
    };
    onSubmit(submitData);
  };

  const inputClasses = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-0 focus-visible:border-emerald-500 font-medium h-10 text-slate-900 dark:text-slate-100";
  const labelClasses = "text-xs font-medium text-slate-500 uppercase tracking-wide";
  const sectionHeaderClasses = "text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-2 mb-4";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-0 gap-0">
        <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {entrega ? 'Editar Entrega' : 'Nova Entrega'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-8">
            {/* Dados do Pedido */}
            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>
                Dados do Pedido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="pv_foco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>PV Foco</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClasses} placeholder="000000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Nota Fiscal</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className={inputClasses} 
                          placeholder="NÚMERO DA NF"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Valor (R$)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          className={inputClasses}
                          placeholder="0,00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className={labelClasses}>Cliente *</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClasses} placeholder="NOME DO CLIENTE" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>UF</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="SELECIONE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          {ESTADOS_BRASILEIROS.map((uf) => (
                            <SelectItem key={uf} value={uf} className="focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-50 rounded-lg cursor-pointer">{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="SELECIONE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status} className="focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-50 rounded-lg cursor-pointer">{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados do Transporte */}
            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>
                Dados do Transporte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="data_saida"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={labelClasses}>Data de Saída</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                inputClasses,
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : "SELECIONE"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="pointer-events-auto rounded-lg"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motorista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Motorista</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="SELECIONE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          {motoristas.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.nome} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">
                              {motorista.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Veículo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="SELECIONE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          {veiculos.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={`${veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - ${veiculo.placa}`} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">
                              {veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - {veiculo.placa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_transporte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Tipo de Transporte</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="SELECIONE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          {TIPO_TRANSPORTE_OPTIONS.map((tipo) => (
                            <SelectItem key={tipo} value={tipo} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Montagem */}
            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>
                Montagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="precisa_montagem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className={labelClasses}>Precisa Montagem?</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_montagem"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={labelClasses}>Data de Montagem</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                inputClasses,
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : "SELECIONE"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="pointer-events-auto rounded-lg"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {precisaMontagem && (
                  <FormField
                    control={form.control}
                    name="status_montagem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClasses}>Status Montagem</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputClasses}>
                              <SelectValue placeholder="SELECIONE" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <SelectItem value="PENDENTE" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">PENDENTE</SelectItem>
                            <SelectItem value="CONCLUIDO" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">CONCLUÍDO</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {precisaMontagem && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col gap-2">
                    <FormLabel className={labelClasses}>Montadores</FormLabel>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg">
                      {selectedMontadores.length === 0 && (
                        <span className="text-slate-400 text-sm p-1">Nenhum montador selecionado</span>
                      )}
                      {selectedMontadores.map((montador) => (
                        <Badge key={montador} variant="secondary" className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20">
                          {montador}
                          <button
                            type="button"
                            onClick={() => removeMontador(montador)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 items-end">
                    <Select onValueChange={addMontador}>
                      <SelectTrigger className={cn(inputClasses, "w-full")}>
                        <SelectValue placeholder="ADICIONAR MONTADOR" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        {availableMontadores.length === 0 ? (
                          <div className="p-2 text-sm text-slate-500">Todos os montadores selecionados</div>
                        ) : (
                          availableMontadores.map((montador) => (
                            <SelectItem key={montador.id} value={montador.nome} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">
                              {montador.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Custos e Métricas */}
            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>
                Custos e Métricas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="gastos_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Gastos Entrega (R$)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          className={inputClasses}
                          placeholder="0,00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gastos_montagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Gastos Montagem (R$)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          className={inputClasses}
                          placeholder="0,00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="produtividade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Produtividade (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          className={inputClasses}
                          min={0}
                          max={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ocorrências */}
            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>
                Ocorrências
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="erros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Tipo de Erro</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="SELECIONE" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                          <SelectItem value="NENHUM" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">Nenhum</SelectItem>
                          <SelectItem value="AVARIA" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">Avaria</SelectItem>
                          <SelectItem value="EXTRAVIO" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">Extravio</SelectItem>
                          <SelectItem value="ATRASO" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">Atraso</SelectItem>
                          <SelectItem value="DIVERGENCIA" className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">Divergência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao_erros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Descrição do Erro</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className={cn(inputClasses, "min-h-[80px] py-2 resize-none")} 
                          placeholder="Descreva o erro ocorrido..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium h-10 px-6"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-10 px-6 shadow-sm shadow-emerald-500/20 transition-all duration-200"
              >
                {isLoading ? 'Salvando...' : 'Salvar Entrega'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
