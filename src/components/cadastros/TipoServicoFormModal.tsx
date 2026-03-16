import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { useCreateTipoServicoMontagem, useUpdateTipoServicoMontagem } from '@/hooks/useTiposServicoMontagem';
import { TipoServicoMontagem } from '@/types/tipoServicoMontagem';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  percentual: z.coerce
    .number({ invalid_type_error: 'Percentual deve ser um número' })
    .min(0, 'Percentual deve ser maior ou igual a 0')
    .max(100, 'Percentual deve ser menor ou igual a 100'),
});

type FormData = z.infer<typeof formSchema>;

interface TipoServicoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoServico: TipoServicoMontagem | null;
}

export function TipoServicoFormModal({ open, onOpenChange, tipoServico }: TipoServicoFormModalProps) {
  const createTipo = useCreateTipoServicoMontagem();
  const updateTipo = useUpdateTipoServicoMontagem();

  const isLoading = createTipo.isPending || updateTipo.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', percentual: 0 },
  });

  useEffect(() => {
    if (tipoServico) {
      form.reset({ nome: tipoServico.nome, percentual: tipoServico.percentual });
    } else {
      form.reset({ nome: '', percentual: 0 });
    }
  }, [tipoServico, form]);

  const handleSubmit = (data: FormData) => {
    if (tipoServico) {
      updateTipo.mutate(
        { id: tipoServico.id, data: { nome: data.nome, percentual: data.percentual } },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTipo.mutate(
        { nome: data.nome, percentual: data.percentual },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {tipoServico ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Móveis, Auditório, Divisória"
                      className="bg-background border-border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="percentual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual (%) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        {...field}
                        placeholder="Ex: 0.20"
                        className="bg-background border-border pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Este percentual será aplicado sobre o valor do pedido para calcular a produtividade.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : tipoServico ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
