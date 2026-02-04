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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {entrega ? 'Editar Entrega' : 'Nova Entrega'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dados do Pedido */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Dados do Pedido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pv_foco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PV Foco</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background border-border" />
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
                      <FormLabel>Nota Fiscal</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-background border-border" 
                          placeholder="Número da NF ou DECLARAÇÃO"
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
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          className="bg-background border-border"
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
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background border-border" />
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
                      <FormLabel>UF</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {ESTADOS_BRASILEIROS.map((uf) => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
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
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Dados do Transporte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="data_saida"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Saída</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal bg-background border-border",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="pointer-events-auto"
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
                      <FormLabel>Motorista</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {motoristas.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.nome}>
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
                      <FormLabel>Veículo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {veiculos.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={`${veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - ${veiculo.placa}`}>
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
                      <FormLabel>Tipo de Transporte</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {TIPO_TRANSPORTE_OPTIONS.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
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
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Montagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="precisa_montagem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Precisa Montagem?</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
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
                      <FormLabel>Data de Montagem</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal bg-background border-border",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="pointer-events-auto"
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Status da Montagem</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || 'PENDENTE'}
                          disabled={!!dataMontagem}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dataMontagem 
                            ? 'Status automaticamente definido como Concluído quando há data de montagem'
                            : 'Defina como Concluído quando a montagem for finalizada'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="md:col-span-2">
                  <FormItem>
                    <FormLabel>Montadores</FormLabel>
                    <div className="space-y-3">
                      {/* Montadores selecionados */}
                      {selectedMontadores.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedMontadores.map((nome) => (
                            <Badge
                              key={nome}
                              variant="secondary"
                              className="flex items-center gap-1 py-1 px-2"
                            >
                              {nome}
                              <button
                                type="button"
                                onClick={() => removeMontador(nome)}
                                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Seletor para adicionar mais montadores */}
                      {availableMontadores.length > 0 && (
                        <Select onValueChange={(value) => addMontador(value)} value="">
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Adicionar montador..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {availableMontadores.map((montador) => (
                              <SelectItem key={montador.id} value={montador.nome}>
                                <div className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  {montador.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {availableMontadores.length === 0 && selectedMontadores.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum montador cadastrado</p>
                      )}
                      
                      {availableMontadores.length === 0 && selectedMontadores.length > 0 && (
                        <p className="text-sm text-muted-foreground">Todos os montadores já foram selecionados</p>
                      )}
                    </div>
                  </FormItem>
                </div>
              </div>
            </div>

            {/* Custos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Custos e Produtividade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gastos_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gastos Entrega (R$)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          className="bg-background border-border"
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
                      <FormLabel>Gastos Montagem (R$)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                          className="bg-background border-border"
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
                      <FormLabel>Produtividade</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Erros */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Observações
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="erros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Erros</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao_erros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição dos Erros</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : entrega ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
