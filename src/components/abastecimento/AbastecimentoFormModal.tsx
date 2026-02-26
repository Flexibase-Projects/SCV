import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { formatDateLocal, parseDateLocal } from '@/utils/dateUtils';
import { CalendarMonthOutlined as CalendarIcon } from '@mui/icons-material';
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
import { QuantityInput } from '@/components/ui/quantity-input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Abastecimento, PRODUTOS_ABASTECIMENTO, ESTADOS_BRASILEIROS, AbastecimentoFormData } from '@/types/abastecimento';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useCondutores } from '@/hooks/useCondutores';
import { computeSafeValorTotal } from '@/utils/abastecimentoFormUtils';

const formSchema = z.object({
  data: z.date({ required_error: 'Data é obrigatória' }),
  veiculo_id: z.string().min(1, 'Veículo é obrigatório'),
  condutor_id: z.string().min(1, 'Condutor é obrigatório'),
  posto: z.string().min(1, 'Posto é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  uf: z.string().optional(),
  km_inicial: z.coerce.number().min(0, 'Km deve ser maior ou igual a 0'),
  litros: z.coerce.number().positive('Litros deve ser maior que 0'),
  produto: z.string().min(1, 'Produto é obrigatório'),
  valor_unitario: z.coerce.number().min(0, 'Valor unitário deve ser maior ou igual a 0'),
  valor_total: z.coerce.number().min(0, 'Valor total deve ser maior ou igual a 0'),
});

type FormData = z.infer<typeof formSchema>;

interface AbastecimentoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abastecimento: Abastecimento | null;
  onSubmit: (data: AbastecimentoFormData) => void;
  isLoading: boolean;
}

export function AbastecimentoFormModal({
  open,
  onOpenChange,
  abastecimento,
  onSubmit,
  isLoading
}: AbastecimentoFormModalProps) {
  const { data: veiculos = [] } = useVeiculos();
  const { data: condutores = [] } = useCondutores();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo_id: '',
      condutor_id: '',
      posto: '',
      cidade: '',
      uf: '',
      km_inicial: 0,
      litros: 0,
      produto: '',
      valor_unitario: 0,
      valor_total: 0,
    },
  });

  useEffect(() => {
    if (abastecimento) {
      form.reset({
        data: abastecimento.data ? (parseDateLocal(abastecimento.data) || undefined) : undefined,
        veiculo_id: abastecimento.veiculo_id || '',
        condutor_id: abastecimento.condutor_id || '',
        posto: abastecimento.posto || '',
        cidade: abastecimento.cidade || '',
        uf: abastecimento.estado || '',
        km_inicial: abastecimento.km_inicial || 0,
        litros: abastecimento.litros || 0,
        produto: abastecimento.produto || '',
        valor_unitario: abastecimento.valor_unitario || 0,
        valor_total: abastecimento.valor_total || 0,
      });
    } else {
      form.reset({
        data: undefined,
        veiculo_id: '',
        condutor_id: '',
        posto: '',
        cidade: '',
        uf: '',
        km_inicial: 0,
        litros: 0,
        produto: '',
        valor_unitario: 0,
        valor_total: 0,
      });
    }
  }, [abastecimento, form]);

  const valorUnitario = form.watch('valor_unitario');
  const litros = form.watch('litros');

  useEffect(() => {
    const safeTotal = computeSafeValorTotal(valorUnitario, litros);
    form.setValue('valor_total', safeTotal, { shouldValidate: false });
  }, [valorUnitario, litros, form]);

  const handleSubmit = (data: FormData) => {
    const formattedData = {
      data: formatDateLocal(data.data),
      veiculo_id: data.veiculo_id,
      condutor_id: data.condutor_id,
      posto: data.posto,
      cidade: data.cidade,
      estado: data.uf || '',
      km_inicial: data.km_inicial,
      litros: data.litros,
      produto: data.produto,
      valor_unitario: data.valor_unitario,
      valor_total: (Number.isFinite(Number(data.valor_total)) ? Number(data.valor_total) : 0),
    };
    
    onSubmit(formattedData);
  };

  // Filtrar apenas veículos e condutores ativos
  const veiculosAtivos = veiculos.filter(v => v.ativo);
  const condutoresAtivos = condutores.filter(c => c.ativo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {abastecimento ? 'Editar Abastecimento' : 'Novo Abastecimento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data */}
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data *</FormLabel>
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

              {/* Veículo */}
              <FormField
                control={form.control}
                name="veiculo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
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

              {/* Condutor */}
              <FormField
                control={form.control}
                name="condutor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condutor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {condutoresAtivos.map((condutor) => (
                          <SelectItem key={condutor.id} value={condutor.id}>
                            {condutor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Posto */}
              <FormField
                control={form.control}
                name="posto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posto/Manutenção *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-background border-border" 
                        placeholder="Ex: 36687900 - POSTO FORMOSA"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cidade */}
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-background border-border" 
                        placeholder="Ex: São Paulo - SP"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* UF */}
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Selecione (opcional)" />
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

              {/* Km Inicial */}
              <FormField
                control={form.control}
                name="km_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Km Inicial *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={field.onChange}
                        className="bg-background border-border"
                        placeholder="0"
                        decimalsLimit={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Litros */}
              <FormField
                control={form.control}
                name="litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros *</FormLabel>
                    <FormControl>
                      <QuantityInput
                        value={field.value}
                        onValueChange={field.onChange}
                        className="bg-background border-border"
                        placeholder="0,0000"
                        decimalsLimit={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Produto */}
              <FormField
                control={form.control}
                name="produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {PRODUTOS_ABASTECIMENTO.map((produto) => (
                          <SelectItem key={produto} value={produto}>
                            {produto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor Unitário */}
              <FormField
                control={form.control}
                name="valor_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Un. (R$) *</FormLabel>
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

              {/* Valor Total */}
              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$) *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={() => {}}
                        className="bg-background border-border"
                        placeholder="0,00"
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isLoading ? 'Salvando...' : abastecimento ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
