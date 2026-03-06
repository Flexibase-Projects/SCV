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
import { EditOutlined as Pencil, BuildOutlined as Wrench, DirectionsCarOutlined as Car, NotesOutlined as Notes } from '@mui/icons-material';
import type { Manutencao } from '@/types/manutencao';
import { STATUS_MANUTENCAO_LABELS, TIPO_MANUTENCAO_LABELS, type StatusManutencao, type TipoManutencao } from '@/types/manutencao';
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
    <div className={cn('space-y-0.5', className)}>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-medium text-foreground break-words">{value ?? '—'}</p>
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
    <Card className={cn('rounded-lg border border-border dark:border-white/10 shadow-sm overflow-hidden', className)}>
      <CardHeader className="py-2 px-3 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}

interface ManutencaoDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencao: Manutencao | null;
  onEdit: (manutencao: Manutencao) => void;
}

export function ManutencaoDetailModal({ open, onOpenChange, manutencao, onEdit }: ManutencaoDetailModalProps) {
  if (!manutencao) return null;

  const handleEdit = () => {
    onEdit(manutencao);
    onOpenChange(false);
  };

  const tipoLabel = TIPO_MANUTENCAO_LABELS[manutencao.tipo_manutencao as TipoManutencao] ?? manutencao.tipo_manutencao;
  const statusLabel = STATUS_MANUTENCAO_LABELS[manutencao.status as StatusManutencao] ?? manutencao.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border dark:border-white/10">
        <DialogHeader className="shrink-0 px-4 py-3 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
          <div className="min-w-0 pr-8">
            <DialogTitle className="text-lg font-bold text-foreground truncate">
              {manutencao.tipo_servico || 'Manutenção'}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {manutencao.veiculo_placa && (
                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {manutencao.veiculo_placa}
                </span>
              )}
              <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {formatDate(manutencao.data)}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {tipoLabel}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {statusLabel}
              </span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-auto">
          <div className="p-4 pb-16 space-y-3">
            <DetailCard title="Identificação" icon={Car}>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-border dark:divide-white/10 gap-y-2 [&>*]:pr-4 [&>*:first-child]:pl-0 [&>*]:pl-4">
                <Field label="Data" value={formatDate(manutencao.data)} />
                <Field label="Veículo" value={manutencao.veiculo_placa} />
                <Field label="Tipo" value={tipoLabel} />
                <Field label="Status" value={statusLabel} />
                <Field label="Estabelecimento" value={manutencao.estabelecimento} />
              </div>
            </DetailCard>

            <Separator className="bg-border dark:bg-white/10" />

            <DetailCard title="Serviço e valores" icon={Wrench}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border dark:divide-white/10 gap-y-2 items-start [&>*]:pr-4 [&>*:first-child]:pl-0 [&>*]:pl-4">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Custo total</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(manutencao.custo_total)}</p>
                  </div>
                  <Field label="Tipo de serviço" value={manutencao.tipo_servico} />
                  <Field label="Km" value={manutencao.km_manutencao != null ? `${manutencao.km_manutencao.toLocaleString('pt-BR')} km` : '—'} />
                </div>
                <Separator className="bg-border dark:bg-white/10" />
                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border dark:divide-white/10 gap-y-2 items-start [&>*]:pr-4 [&>*:first-child]:pl-0 [&>*]:pl-4">
                  <Field label="Nota fiscal" value={manutencao.nota_fiscal} />
                  <Field label="Descrição" value={manutencao.descricao_servico} />
                  <Field label="Problema detectado" value={manutencao.problema_detectado} />
                </div>
              </div>
            </DetailCard>

            {(manutencao.erros || manutencao.descricao_erros) && (
              <>
                <Separator className="bg-border dark:bg-white/10" />
                <DetailCard title="Observações" icon={Notes}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-border dark:divide-white/10 gap-3 [&>*]:pr-4 [&>*:first-child]:pl-0 [&>*]:pl-4">
                    {manutencao.erros && <Field label="Erros" value={manutencao.erros} />}
                    {manutencao.descricao_erros && <Field label="Descrição dos erros" value={manutencao.descricao_erros} />}
                  </div>
                </DetailCard>
              </>
            )}

            <Separator className="bg-border dark:bg-white/10" />

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
              <span><strong className="text-foreground/80">Criado em:</strong> {formatDateTime(manutencao.created_at)}</span>
              <span><strong className="text-foreground/80">Atualizado em:</strong> {formatDateTime(manutencao.updated_at)}</span>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-4 right-4 pointer-events-none flex justify-end">
          <Button
            onClick={handleEdit}
            className="pointer-events-auto gap-2 rounded-xl shadow-lg border-emerald-200 dark:border-emerald-500/30 bg-emerald-500 hover:bg-emerald-600 text-white text-sm h-9"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
