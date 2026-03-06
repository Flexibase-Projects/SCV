import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  EditOutlined as Pencil,
  CalendarTodayOutlined as Route,
  PersonOutlined as Person,
  DirectionsCarOutlined as Car,
  AttachMoneyOutlined as Dollar,
  ReceiptOutlined as Receipt,
  LocalGasStationOutlined as Gas,
  LocalShippingOutlined as Truck,
  NotesOutlined as Notes,
} from '@mui/icons-material';
import type { AcertoViagem } from '@/types/acertoViagem';
import {
  calcularTotalDespesas,
  calcularSaldo,
  calcularDiasViagem,
  calcularKmRodado,
  CATEGORIAS_DESPESAS,
} from '@/types/acertoViagem';
import { cn } from '@/lib/utils';

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '—';
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  try {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
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

interface AcertoViagemDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acerto: AcertoViagem | null;
  onEdit: (acerto: AcertoViagem) => void;
}

export function AcertoViagemDetailModal({
  open,
  onOpenChange,
  acerto,
  onEdit,
}: AcertoViagemDetailModalProps) {
  if (!acerto) return null;

  const handleEdit = () => {
    onEdit(acerto);
    onOpenChange(false);
  };

  const totalDespesas = calcularTotalDespesas(acerto);
  const saldo = calcularSaldo(acerto);
  const dias = calcularDiasViagem(acerto.data_saida, acerto.data_chegada);
  const kmRodado = calcularKmRodado(acerto.km_saida, acerto.km_chegada);

  const responsavel =
    acerto.motorista_nome && acerto.montador_nome
      ? `${acerto.motorista_nome} / ${acerto.montador_nome}`
      : acerto.motorista_nome || acerto.montador_nome || '—';

  const veiculoDisplay =
    acerto.veiculo_placa && acerto.veiculo_modelo
      ? `${acerto.veiculo_placa} - ${acerto.veiculo_modelo}`
      : acerto.veiculo_placa || '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border dark:border-white/10">
        <DialogHeader className="shrink-0 px-4 py-3 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
          <div className="min-w-0 pr-8 flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-lg font-bold text-foreground truncate">
              {acerto.destino || 'Acerto de viagem'}
            </DialogTitle>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-md',
                acerto.status === 'ACERTADO'
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
              )}
            >
              {acerto.status === 'ACERTADO' ? 'Acertado' : 'Pendente'}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 shrink-0">
            {/* Coluna 1: Viagem */}
            <DetailCard title="Viagem" icon={Route}>
              <div className="space-y-2">
                <Field label="Destino" value={acerto.destino} />
                <Separator className="bg-border dark:bg-white/10" />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Data saída" value={formatDate(acerto.data_saida)} />
                  <Field label="Data chegada" value={formatDate(acerto.data_chegada)} />
                </div>
                <Separator className="bg-border dark:bg-white/10" />
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Dias"
                    value={dias > 0 ? `${dias} dias` : '—'}
                  />
                  <Field
                    label="Km rodado"
                    value={kmRodado != null ? `${kmRodado.toLocaleString('pt-BR')} km` : '—'}
                  />
                </div>
                <Separator className="bg-border dark:bg-white/10" />
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Km saída"
                    value={acerto.km_saida != null ? acerto.km_saida.toLocaleString('pt-BR') : '—'}
                  />
                  <Field
                    label="Km chegada"
                    value={acerto.km_chegada != null ? acerto.km_chegada.toLocaleString('pt-BR') : '—'}
                  />
                </div>
              </div>
            </DetailCard>

            {/* Coluna 2: Responsáveis e veículo */}
            <div className="space-y-3">
              <DetailCard title="Responsáveis" icon={Person}>
                <div className="space-y-2">
                  <Field label="Motorista" value={acerto.motorista_nome} />
                  <Separator className="bg-border dark:bg-white/10" />
                  <Field label="Montador" value={acerto.montador_nome} />
                  {!acerto.motorista_nome && !acerto.montador_nome && (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </div>
              </DetailCard>
              <DetailCard title="Veículo" icon={Car}>
                <Field label="Placa / Modelo" value={veiculoDisplay} />
              </DetailCard>
            </div>

            {/* Coluna 3: Valores resumo */}
            <DetailCard title="Valores" icon={Dollar}>
              <div className="space-y-2">
                <Field label="Adiantamento" value={formatCurrency(acerto.valor_adiantamento)} />
                <Separator className="bg-border dark:bg-white/10" />
                <Field label="Total despesas" value={formatCurrency(totalDespesas)} />
                <Separator className="bg-border dark:bg-white/10" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Saldo
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      saldo.tipo === 'devolver' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {saldo.tipo === 'devolver' ? '+' : '-'} {formatCurrency(saldo.valor)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({saldo.tipo === 'devolver' ? 'a devolver' : 'a receber'})
                    </span>
                  </p>
                </div>
              </div>
            </DetailCard>
          </div>

          <Separator className="my-3 bg-border dark:bg-white/10" />

          {/* Despesas em grid compacto */}
          <DetailCard title="Despesas por categoria" icon={Receipt} className="mb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-x-4 gap-y-1.5">
              {CATEGORIAS_DESPESAS.map(({ key, label }) => (
                <Field
                  key={key}
                  label={label}
                  value={formatCurrency((acerto as Record<string, number>)[key])}
                />
              ))}
              <Field label="Outros" value={formatCurrency(acerto.despesa_outros)} />
              {acerto.despesa_outros_descricao && (
                <div className="col-span-2 sm:col-span-3 md:col-span-5 lg:col-span-7">
                  <Field label="Descrição outros" value={acerto.despesa_outros_descricao} />
                </div>
              )}
            </div>
          </DetailCard>

          <Separator className="my-3 bg-border dark:bg-white/10" />

          {/* Entregas, Abastecimentos, Observações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {acerto.entregas && acerto.entregas.length > 0 ? (
              <DetailCard title="Entregas vinculadas" icon={Truck}>
                <ul className="text-xs space-y-1">
                  {acerto.entregas.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {e.entrega?.pv_foco ? `PV ${e.entrega.pv_foco}` : e.entrega_id}
                      </span>
                      {e.entrega?.cliente && (
                        <span className="truncate text-foreground">{e.entrega.cliente}</span>
                      )}
                    </li>
                  ))}
                  {acerto.entregas.length > 5 && (
                    <li className="text-muted-foreground pt-1">
                      + {acerto.entregas.length - 5} mais
                    </li>
                  )}
                </ul>
              </DetailCard>
            ) : (
              <DetailCard title="Entregas vinculadas" icon={Truck}>
                <p className="text-xs text-muted-foreground">Nenhuma entrega vinculada</p>
              </DetailCard>
            )}
            {acerto.abastecimentos && acerto.abastecimentos.length > 0 ? (
              <DetailCard title="Abastecimentos vinculados" icon={Gas}>
                <ul className="text-xs space-y-1">
                  {acerto.abastecimentos.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{formatDate(a.data)}</span>
                      <span className="text-foreground">{formatCurrency(a.valor_total)}</span>
                    </li>
                  ))}
                  {acerto.abastecimentos.length > 5 && (
                    <li className="text-muted-foreground pt-1">
                      + {acerto.abastecimentos.length - 5} mais
                    </li>
                  )}
                </ul>
              </DetailCard>
            ) : (
              <DetailCard title="Abastecimentos vinculados" icon={Gas}>
                <p className="text-xs text-muted-foreground">Nenhum abastecimento vinculado</p>
              </DetailCard>
            )}
            <DetailCard title="Observações" icon={Notes}>
              <p className="text-xs text-foreground break-words whitespace-pre-wrap min-h-[2rem]">
                {acerto.observacoes || '—'}
              </p>
            </DetailCard>
          </div>
        </div>

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
