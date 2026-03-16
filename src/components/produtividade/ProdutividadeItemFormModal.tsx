import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AddOutlined as Plus,
  CalendarMonthOutlined as CalendarIcon,
  CloseOutlined as X,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMontadores } from '@/hooks/useMontadores';
import { useTiposServicoMontagem } from '@/hooks/useTiposServicoMontagem';
import { cn } from '@/lib/utils';
import { Entrega, STATUS_MONTAGEM_LABELS, STATUS_MONTAGEM_OPTIONS } from '@/types/entrega';
import { parseDateLocal } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  status_montagem: z.enum(['PENDENTE', 'EM_MONTAGEM', 'MONTAGEM_PARCIAL', 'CONCLUIDO']).optional(),
  data_montagem: z.date().optional(),
  tipo_servico_id: z.string().optional(),
  produtividade: z.coerce.number().min(0).optional(),
  produtividade_por_montador: z.coerce.number().min(0).optional(),
}).refine((data) => {
  if (data.status_montagem === 'CONCLUIDO' && !data.data_montagem) {
    return false;
  }
  return true;
}, {
  message: 'Data de montagem é obrigatória quando status é Concluído',
  path: ['data_montagem'],
});

type FormData = z.infer<typeof formSchema>;

interface ProdutividadeItemFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega: Entrega | null;
  onSubmit: (data: FormData & { montador_1?: string; montador_2?: string }) => void;
  isLoading: boolean;
}

const inputClasses = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-0 focus-visible:border-emerald-500 font-medium h-10 text-slate-900 dark:text-slate-100';
const labelClasses = 'text-xs font-medium text-slate-500 uppercase tracking-wide';
const sectionHeaderClasses = 'text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-2 mb-4';

export function ProdutividadeItemFormModal({
  open,
  onOpenChange,
  entrega,
  onSubmit,
  isLoading,
}: ProdutividadeItemFormModalProps) {
  const { data: montadoresData = [] } = useMontadores();
  const { data: tiposServico = [] } = useTiposServicoMontagem();

  const [selectedMontadores, setSelectedMontadores] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status_montagem: undefined,
      data_montagem: undefined,
      tipo_servico_id: '',
      produtividade: 0,
      produtividade_por_montador: 0,
    },
  });

  const valorPedido = entrega?.valor ?? 0;
  const statusMontagem = form.watch('status_montagem');
  const tipoServicoId = form.watch('tipo_servico_id');

  useEffect(() => {
    if (!entrega) {
      setSelectedMontadores([]);
      form.reset({
        status_montagem: undefined,
        data_montagem: undefined,
        tipo_servico_id: '',
        produtividade: 0,
        produtividade_por_montador: 0,
      });
      return;
    }

    const existingMontadores = [entrega.montador_1, entrega.montador_2].filter(
      (nome): nome is string => Boolean(nome)
    );

    setSelectedMontadores(existingMontadores);
    form.reset({
      status_montagem: entrega.status_montagem ?? undefined,
      data_montagem: entrega.data_montagem ? parseDateLocal(entrega.data_montagem) ?? undefined : undefined,
      tipo_servico_id: entrega.tipo_servico_id ?? '',
      produtividade: entrega.produtividade ?? 0,
      produtividade_por_montador: entrega.produtividade_por_montador ?? 0,
    });
  }, [entrega, form]);

  useEffect(() => {
    if (statusMontagem !== 'CONCLUIDO') return;
    if (!tipoServicoId || !valorPedido) return;

    const tipo = tiposServico.find((t) => t.id === tipoServicoId);
    if (!tipo) return;

    const total = valorPedido * (tipo.percentual / 100);
    const montadoresCount = Math.max(selectedMontadores.length, 1);
    const porMontador = total / montadoresCount;

    form.setValue('produtividade', parseFloat(total.toFixed(2)));
    form.setValue('produtividade_por_montador', parseFloat(porMontador.toFixed(2)));
  }, [form, selectedMontadores.length, statusMontagem, tipoServicoId, tiposServico, valorPedido]);

  const addMontador = (nome: string) => {
    if (!nome || selectedMontadores.includes(nome) || selectedMontadores.length >= 2) return;
    setSelectedMontadores((prev) => [...prev, nome]);
  };

  const removeMontador = (nome: string) => {
    setSelectedMontadores((prev) => prev.filter((m) => m !== nome));
  };

  const availableMontadores = useMemo(
    () => montadoresData.filter((m) => m.ativo && !selectedMontadores.includes(m.nome)),
    [montadoresData, selectedMontadores]
  );

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      montador_1: selectedMontadores[0] ?? '',
      montador_2: selectedMontadores[1] ?? '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-0 gap-0">
        <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Editar Produtividade da Montagem
          </DialogTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Alterações salvas aqui atualizam o mesmo registro da entrega.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>Resumo do Pedido</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className={labelClasses}>Cliente</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {entrega?.cliente || '—'}
                  </p>
                </div>
                <div>
                  <p className={labelClasses}>NF / PV</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entrega?.nf || '—'} {entrega?.pv_foco ? `/ ${entrega.pv_foco}` : ''}
                  </p>
                </div>
                <div>
                  <p className={labelClasses}>Valor do Pedido</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPedido)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={sectionHeaderClasses}>Dados de Produtividade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          {STATUS_MONTAGEM_OPTIONS.map((value) => (
                            <SelectItem key={value} value={value} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">
                              {STATUS_MONTAGEM_LABELS[value]}
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
                  name="data_montagem"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={labelClasses}>Data de Montagem</FormLabel>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  inputClasses,
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'dd/MM/yyyy') : 'SELECIONE'}
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

                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange(undefined)}
                            className="text-muted-foreground hover:text-destructive shrink-0 h-10"
                            title="Limpar data"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-2">
                  <FormLabel className={labelClasses}>Montadores (máx. 2)</FormLabel>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg">
                    {selectedMontadores.length === 0 && (
                      <span className="text-slate-400 text-sm p-1">Nenhum montador selecionado</span>
                    )}
                    {selectedMontadores.map((montador) => (
                      <Badge key={montador} variant="secondary" className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        {montador}
                        <button
                          type="button"
                          onClick={() => removeMontador(montador)}
                          className="ml-2 hover:text-red-500"
                          aria-label={`Remover ${montador}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Select onValueChange={addMontador} disabled={selectedMontadores.length >= 2}>
                  <SelectTrigger className={cn(inputClasses, 'w-full')}>
                    <SelectValue placeholder={selectedMontadores.length >= 2 ? 'Limite de 2 montadores atingido' : 'ADICIONAR MONTADOR'} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                    {availableMontadores.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Nenhum montador disponível</div>
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

              <FormField
                control={form.control}
                name="tipo_servico_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Tipo de Serviço</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={inputClasses}>
                          <SelectValue placeholder="SELECIONE O TIPO" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        {tiposServico.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">
                            {tipo.nome} ({tipo.percentual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      A produtividade é recalculada automaticamente quando o status for Concluído.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="produtividade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Produtividade Total (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          readOnly
                          className={cn(inputClasses, 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed text-slate-500')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="produtividade_por_montador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Produtividade por Montador (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          readOnly
                          className={cn(inputClasses, 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed text-slate-500')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-10 px-6 shadow-sm shadow-emerald-500/20 transition-all duration-200 gap-2"
              >
                <Plus className="h-4 w-4" />
                {isLoading ? 'Salvando...' : 'Salvar Produtividade'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
