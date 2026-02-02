import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { formatDateLocal, parseDateLocal } from '@/utils/dateUtils';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Manutencao, ManutencaoFormData, TipoManutencao, StatusManutencao, STATUS_MANUTENCAO_LABELS, TIPO_MANUTENCAO_LABELS } from '@/types/manutencao';
import { useVeiculos } from '@/hooks/useVeiculos';

const formSchema = z.object({
  data: z.date({ required_error: 'Data é obrigatória' }),
  veiculo_id: z.string().min(1, 'Veículo é obrigatório'),
  tipo_manutencao: z.enum(['preventiva', 'corretiva']),
  status: z.enum(['pendente', 'em_andamento', 'resolvida']),
  estabelecimento: z.string().min(1, 'Estabelecimento é obrigatório'),
  tipo_servico: z.string().min(1, 'Tipo de serviço é obrigatório'),
  descricao_servico: z.string().optional(),
  problema_detectado: z.string().optional(),
  custo_total: z.coerce.number().min(0, 'Custo deve ser maior ou igual a 0'),
  km_manutencao: z.coerce.number().min(0, 'KM deve ser maior ou igual a 0'),
  nota_fiscal: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ManutencaoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencao: Manutencao | null;
  onSubmit: (data: ManutencaoFormData) => void;
  isLoading: boolean;
  defaultTipo?: TipoManutencao;
  defaultVeiculoId?: string;
  defaultTipoServico?: string;
}

export function ManutencaoFormModal({
  open,
  onOpenChange,
  manutencao,
  onSubmit,
  isLoading,
  defaultTipo,
  defaultVeiculoId,
  defaultTipoServico,
}: ManutencaoFormModalProps) {
  const { data: veiculos = [] } = useVeiculos();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: new Date(),
      veiculo_id: '',
      tipo_manutencao: 'corretiva',
      status: 'pendente',
      estabelecimento: '',
      tipo_servico: '',
      descricao_servico: '',
      problema_detectado: '',
      custo_total: 0,
      km_manutencao: 0,
      nota_fiscal: '',
    },
  });

  const tipoManutencao = form.watch('tipo_manutencao');
  const veiculoId = form.watch('veiculo_id');

  useEffect(() => {
    if (manutencao) {
      form.reset({
        data: manutencao.data ? (parseDateLocal(manutencao.data) || new Date()) : new Date(),
        veiculo_id: manutencao.veiculo_id || '',
        tipo_manutencao: manutencao.tipo_manutencao || 'corretiva',
        status: manutencao.status || 'pendente',
        estabelecimento: manutencao.estabelecimento || '',
        tipo_servico: manutencao.tipo_servico || '',
        descricao_servico: manutencao.descricao_servico || '',
        problema_detectado: manutencao.problema_detectado || '',
        custo_total: manutencao.custo_total || 0,
        km_manutencao: manutencao.km_manutencao || 0,
        nota_fiscal: manutencao.nota_fiscal || '',
      });
    } else {
      // Usar valores padrão passados via props
      const veiculo = veiculos.find((v) => v.id === defaultVeiculoId);
      form.reset({
        data: new Date(),
        veiculo_id: defaultVeiculoId || '',
        tipo_manutencao: defaultTipo || 'corretiva',
        status: 'pendente',
        estabelecimento: '',
        tipo_servico: defaultTipoServico || '',
        descricao_servico: '',
        problema_detectado: '',
        custo_total: 0,
        km_manutencao: veiculo?.km_atual || 0,
        nota_fiscal: '',
      });
    }
  }, [manutencao, form, defaultTipo, defaultVeiculoId, defaultTipoServico, veiculos]);

  // Atualizar KM quando veículo mudar
  useEffect(() => {
    if (!manutencao && veiculoId) {
      const veiculo = veiculos.find((v) => v.id === veiculoId);
      if (veiculo?.km_atual) {
        form.setValue('km_manutencao', veiculo.km_atual);
      }
    }
  }, [veiculoId, veiculos, manutencao, form]);

  const handleSubmit = (data: FormData) => {
    const formattedData = {
      data: formatDateLocal(data.data),
      veiculo_id: data.veiculo_id,
      tipo_manutencao: data.tipo_manutencao,
      status: data.status,
      estabelecimento: data.estabelecimento,
      tipo_servico: data.tipo_servico,
      descricao_servico: data.descricao_servico || null,
      problema_detectado: data.tipo_manutencao === 'corretiva' ? data.problema_detectado || null : null,
      custo_total: data.custo_total,
      km_manutencao: data.km_manutencao,
      nota_fiscal: data.nota_fiscal || null,
    };
    onSubmit(formattedData);
  };

  const veiculosAtivos = veiculos.filter((v) => v.ativo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {manutencao ? 'Editar' : 'Nova'} Manutenção
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Tipo de Manutenção e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Tipo de Manutenção</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="preventiva">{TIPO_MANUTENCAO_LABELS.preventiva}</SelectItem>
                        <SelectItem value="corretiva">{TIPO_MANUTENCAO_LABELS.corretiva}</SelectItem>
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
                    <FormLabel className="text-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">{STATUS_MANUTENCAO_LABELS.pendente}</SelectItem>
                        <SelectItem value="em_andamento">{STATUS_MANUTENCAO_LABELS.em_andamento}</SelectItem>
                        <SelectItem value="resolvida">{STATUS_MANUTENCAO_LABELS.resolvida}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data */}
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-foreground">Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal bg-background border-input',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Veículo */}
              <FormField
                control={form.control}
                name="veiculo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Veículo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veiculosAtivos.map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id}>
                            {veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - {veiculo.placa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo condicional para Manutenção Corretiva */}
            {tipoManutencao === 'corretiva' && (
              <FormField
                control={form.control}
                name="problema_detectado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Problema Detectado</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o problema que originou esta manutenção..."
                        className="bg-background border-input min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estabelecimento */}
              <FormField
                control={form.control}
                name="estabelecimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Estabelecimento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do estabelecimento"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Serviço */}
              <FormField
                control={form.control}
                name="tipo_servico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Tipo de Serviço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Troca de óleo, Alinhamento..."
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custo Total */}
              <FormField
                control={form.control}
                name="custo_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Custo Total (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={field.onChange}
                        className="bg-background border-input"
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* KM Manutenção */}
              <FormField
                control={form.control}
                name="km_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">KM Manutenção</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nota Fiscal */}
              <FormField
                control={form.control}
                name="nota_fiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Nota Fiscal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número da nota fiscal"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição do Serviço - Campo maior */}
            <FormField
              control={form.control}
              name="descricao_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Descrição do Serviço</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os serviços realizados..."
                      className="bg-background border-input min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
