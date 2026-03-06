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
import { EditOutlined as Pencil, LocalShippingOutlined as Truck, DirectionsCarOutlined as Car, AttachMoneyOutlined as Dollar, BuildOutlined as Build, NotesOutlined as Notes } from '@mui/icons-material';
import { StatusBadge } from './StatusBadge';
import type { Entrega } from '@/types/entrega';
import {
  STATUS_MONTAGEM_LABELS,
  TIPO_TRANSPORTE_LABELS,
  type StatusMontagem,
} from '@/types/entrega';
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

interface EntregaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega: Entrega | null;
  onEdit: (entrega: Entrega) => void;
}

export function EntregaDetailModal({ open, onOpenChange, entrega, onEdit }: EntregaDetailModalProps) {
  if (!entrega) return null;

  const handleEdit = () => {
    onEdit(entrega);
    onOpenChange(false);
  };

  const montagemLabel = entrega.status_montagem
    ? (STATUS_MONTAGEM_LABELS[entrega.status_montagem as StatusMontagem] ?? entrega.status_montagem)
    : '—';
  const tipoTransporteLabel = entrega.tipo_transporte
    ? (TIPO_TRANSPORTE_LABELS[entrega.tipo_transporte] ?? entrega.tipo_transporte)
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border dark:border-white/10">
        {/* Header fixo */}
        <DialogHeader className="shrink-0 px-6 py-5 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
          <div className="min-w-0 pr-8">
            <DialogTitle className="text-xl font-bold text-foreground truncate">
              {entrega.cliente || 'Entrega sem cliente'}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {entrega.pv_foco && (
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  PV {entrega.pv_foco}
                </span>
              )}
              {entrega.nf && (
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  NF {entrega.nf}
                </span>
              )}
              <StatusBadge status={entrega.status} />
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo com scroll */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 pb-24 space-y-4">
            <DetailCard title="Identificação e datas" icon={Truck}>
              <div className="space-y-4">
                <Field label="Cliente" value={entrega.cliente} />
                <Separator className="my-4 bg-border dark:bg-white/10" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Field label="UF" value={entrega.uf} />
                  <Field label="PV Foco" value={entrega.pv_foco} />
                  <Field label="Nota fiscal" value={entrega.nf} />
                  <Field label="Data de saída" value={formatDate(entrega.data_saida)} />
                  <Field label="Data de montagem" value={formatDate(entrega.data_montagem)} />
                </div>
              </div>
            </DetailCard>

            <Separator className="bg-border dark:bg-white/10" />

            <DetailCard title="Transporte" icon={Car}>
              <div className="space-y-4">
                <Field label="Motorista" value={entrega.motorista} />
                <Separator className="bg-border dark:bg-white/10" />
                <Field label="Veículo" value={entrega.carro} />
                <Separator className="bg-border dark:bg-white/10" />
                <Field label="Tipo de transporte" value={tipoTransporteLabel} />
              </div>
            </DetailCard>

            <Separator className="bg-border dark:bg-white/10" />

            <DetailCard title="Valores" icon={Dollar}>
              <div className="space-y-4">
                <Field label="Valor" value={formatCurrency(entrega.valor)} />
                <Separator className="bg-border dark:bg-white/10" />
                <Field label="Gastos com entrega" value={formatCurrency(entrega.gastos_entrega)} />
                <Separator className="bg-border dark:bg-white/10" />
                <Field label="Gastos com montagem" value={formatCurrency(entrega.gastos_montagem)} />
                <Separator className="bg-border dark:bg-white/10" />
                <Field
                  label="% Gastos"
                  value={
                    entrega.percentual_gastos != null
                      ? `${entrega.percentual_gastos.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                      : '—'
                  }
                />
                <Separator className="bg-border dark:bg-white/10" />
                <Field
                  label="Produtividade"
                  value={
                    entrega.produtividade != null
                      ? entrega.produtividade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                      : '—'
                  }
                />
              </div>
            </DetailCard>

            <Separator className="bg-border dark:bg-white/10" />

            {(entrega.precisa_montagem || entrega.status_montagem || entrega.montador_1 || entrega.montador_2) && (
              <>
                <DetailCard title="Montagem" icon={Build}>
                  <div className="space-y-4">
                    <Field
                      label="Precisa montagem"
                      value={entrega.precisa_montagem === true ? 'Sim' : entrega.precisa_montagem === false ? 'Não' : '—'}
                    />
                    <Separator className="bg-border dark:bg-white/10" />
                    <Field label="Status montagem" value={montagemLabel} />
                    <Separator className="bg-border dark:bg-white/10" />
                    <Field label="Montador 1" value={entrega.montador_1} />
                    <Separator className="bg-border dark:bg-white/10" />
                    <Field label="Montador 2" value={entrega.montador_2} />
                  </div>
                </DetailCard>
                <Separator className="bg-border dark:bg-white/10" />
              </>
            )}

            {(entrega.erros || entrega.descricao_erros) && (
              <>
                <DetailCard title="Observações" icon={Notes}>
                  <div className="space-y-4">
                    {entrega.erros && (
                      <>
                        <Field label="Erros" value={entrega.erros} />
                        {entrega.descricao_erros && <Separator className="bg-border dark:bg-white/10" />}
                      </>
                    )}
                    {entrega.descricao_erros && <Field label="Descrição dos erros" value={entrega.descricao_erros} />}
                  </div>
                </DetailCard>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Botão Editar flutuante no canto inferior direito */}
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
