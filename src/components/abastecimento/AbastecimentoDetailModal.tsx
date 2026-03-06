import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { EditOutlined as Pencil, DirectionsCarOutlined as Car, AttachMoneyOutlined as Dollar, WaterDropOutlined as Droplet, NotesOutlined as Notes } from '@mui/icons-material';
import type { Abastecimento } from '@/types/abastecimento';
import { cn } from '@/lib/utils';

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '—';
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  try {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dateString;
  }
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value ?? '—'}</p>
    </div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-xl border border-border dark:border-white/10 shadow-sm overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

interface AbastecimentoDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abastecimento: Abastecimento | null;
  onEdit: (abastecimento: Abastecimento) => void;
}

export function AbastecimentoDetailModal({ open, onOpenChange, abastecimento, onEdit }: AbastecimentoDetailModalProps) {
  if (!abastecimento) return null;

  const handleEdit = () => {
    onEdit(abastecimento);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border dark:border-white/10">
        <DialogHeader className="shrink-0 px-6 py-5 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
          <div className="min-w-0 pr-8">
            <DialogTitle className="text-xl font-bold text-foreground truncate">
              {abastecimento.posto || 'Abastecimento'}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {abastecimento.veiculo_placa && (
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  {abastecimento.veiculo_placa}
                </span>
              )}
              <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {formatDate(abastecimento.data)}
              </span>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {abastecimento.produto || '—'}
              </span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 pb-24 space-y-4">
            <DetailCard title="Identificação e local" icon={Car}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Field label="Posto" value={abastecimento.posto} />
                <Field label="Data" value={formatDate(abastecimento.data)} />
                <Field label="Veículo" value={abastecimento.veiculo_placa} />
                <Field label="Condutor" value={abastecimento.condutor_nome} />
                <Field label="Cidade" value={abastecimento.cidade} />
                <Field label="Estado" value={abastecimento.estado} />
              </div>
            </DetailCard>

            <Separator className="bg-border dark:bg-white/10" />

            <DetailCard title="Abastecimento" icon={Droplet}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field
                  label="Litros"
                  value={abastecimento.litros != null ? `${abastecimento.litros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} L` : '—'}
                />
                <Field label="Produto" value={abastecimento.produto} />
                <Field label="Km inicial" value={abastecimento.km_inicial != null ? `${abastecimento.km_inicial.toLocaleString('pt-BR')} km` : '—'} />
                <Field
                  label="Km/l"
                  value={
                    abastecimento.km_por_litro != null
                      ? `${abastecimento.km_por_litro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} km/l`
                      : '—'
                  }
                />
              </div>
            </DetailCard>

            <Separator className="bg-border dark:bg-white/10" />

            <DetailCard title="Valores" icon={Dollar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Valor unitário" value={formatCurrency(abastecimento.valor_unitario)} />
                <Field label="Valor total" value={formatCurrency(abastecimento.valor_total)} />
              </div>
            </DetailCard>

            {(abastecimento.erros || abastecimento.descricao_erros) && (
              <>
                <Separator className="bg-border dark:bg-white/10" />
                <DetailCard title="Observações" icon={Notes}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {abastecimento.erros && <Field label="Erros" value={abastecimento.erros} />}
                    {abastecimento.descricao_erros && <Field label="Descrição dos erros" value={abastecimento.descricao_erros} />}
                  </div>
                </DetailCard>
              </>
            )}

            <Separator className="bg-border dark:bg-white/10" />

            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span><strong className="text-foreground/80">Criado em:</strong> {formatDateTime(abastecimento.created_at)}</span>
              <span><strong className="text-foreground/80">Atualizado em:</strong> {formatDateTime(abastecimento.updated_at)}</span>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-end p-4">
          <Button
            onClick={handleEdit}
            className="pointer-events-auto gap-2 rounded-xl shadow-lg border-emerald-200 dark:border-emerald-500/30 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
