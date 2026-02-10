import { Edit as Pencil, Delete as Trash2 } from '@mui/icons-material';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import type { VirtualDataTableColumnMeta } from '@/components/shared/virtualDataTableTypes';
import type { Entrega } from '@/types/entrega';
import { STATUS_MONTAGEM_LABELS, TIPO_TRANSPORTE_LABELS } from '@/types/entrega';

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
}

export function getEntregaColumns(
  onEdit: (e: Entrega) => void,
  onDelete: (e: Entrega) => void
): ColumnDef<Entrega, unknown>[] {
  return [
    {
      id: 'pv_foco',
      accessorKey: 'pv_foco',
      header: 'PV Foco',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '100px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block">
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'nf',
      accessorKey: 'nf',
      header: 'NF',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '110px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => {
        const nf = (getValue() as string) || '-';
        const isDeclaracao = nf?.toUpperCase() === 'DECLARAÇÃO';
        return (
          <span className={cn(
            'font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap block',
            isDeclaracao ? 'text-rose-600 font-semibold' : 'text-foreground'
          )}>
            {nf}
          </span>
        );
      },
    },
    {
      id: 'cliente',
      accessorKey: 'cliente',
      header: 'Cliente',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: 'minmax(150px, 1fr)', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground font-medium overflow-hidden text-ellipsis whitespace-nowrap block" title={String((getValue() as string) || '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'uf',
      accessorKey: 'uf',
      header: 'UF',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '56px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block">
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'data_saida',
      accessorKey: 'data_saida',
      header: 'Data Saída',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '120px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-foreground">
          {formatDate(getValue() as string | null)}
        </span>
      ),
    },
    {
      id: 'motorista',
      accessorKey: 'motorista',
      header: 'Motorista',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '160px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={String((getValue() as string) || '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'tipo_transporte',
      accessorKey: 'tipo_transporte',
      header: 'Tipo',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '150px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        const label = v ? (TIPO_TRANSPORTE_LABELS[v] ?? v) : '-';
        return (
          <span className="text-sm text-foreground whitespace-nowrap" title={v ?? undefined}>
            {label}
          </span>
        );
      },
    },
    {
      id: 'valor',
      accessorKey: 'valor',
      header: 'Valor',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '120px', align: 'right', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {formatCurrency(getValue() as number | null)}
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '100px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => <StatusBadge status={getValue() as string | null} />,
    },
    {
      id: 'montagem',
      accessorFn: (row) => row.precisa_montagem && row.status_montagem
        ? (STATUS_MONTAGEM_LABELS[row.status_montagem as keyof typeof STATUS_MONTAGEM_LABELS] ?? row.status_montagem)
        : '-',
      header: 'Montagem',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '130px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const e = row.original;
        if (!e.precisa_montagem) return <span className="text-muted-foreground">-</span>;
        const status = e.status_montagem;
        const label = status ? (STATUS_MONTAGEM_LABELS[status as keyof typeof STATUS_MONTAGEM_LABELS] ?? status) : '-';
        const isConcluido = status === 'CONCLUIDO';
        const isEmAndamento = status === 'EM_MONTAGEM' || status === 'MONTAGEM_PARCIAL';
        const variantClass = isConcluido
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
          : isEmAndamento
            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        return (
          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap', variantClass)}>
            {label}
          </span>
        );
      },
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      enableColumnFilter: false,
      meta: { width: '80px', align: 'right', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 w-full">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)} title="Editar" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)} title="Excluir" className="h-8 w-8 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
