import { format } from 'date-fns';
import { EditOutlined as Pencil, DeleteOutlined as Trash2 } from '@mui/icons-material';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { VirtualDataTableColumnMeta } from '@/components/shared/virtualDataTableTypes';
import type { Manutencao } from '@/types/manutencao';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function getTipoBadge(tipo: string) {
  if (tipo === 'preventiva') return <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">Preventiva</Badge>;
  return <Badge variant="secondary" className="text-xs">Corretiva</Badge>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">Pendente</Badge>;
    case 'em_andamento':
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">Em Andamento</Badge>;
    case 'resolvida':
      return <Badge className="bg-green-500 hover:bg-green-600 text-xs">Resolvida</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

export function getManutencaoColumns(
  onEdit: (m: Manutencao) => void,
  onDelete: (m: Manutencao) => void
): ColumnDef<Manutencao, unknown>[] {
  return [
    {
      id: 'status',
      accessorFn: (row) => (row.erros || row.descricao_erros ? 'erro' : 'ok'),
      header: 'Status',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '72px', align: 'center', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const m = row.original;
        const hasErrors = !!(m.erros || m.descricao_erros);
        return (
          <div className="flex items-center justify-center w-full">
            {hasErrors ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="cursor-help text-xs">
                      Erro
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{m.descricao_erros || m.erros}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs">
                OK
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'data',
      accessorKey: 'data',
      header: 'Data',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '90px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground block">
          {(getValue() as string) ? format(new Date((getValue() as string) + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
        </span>
      ),
    },
    {
      id: 'veiculo_placa',
      accessorKey: 'veiculo_placa',
      header: 'Veículo',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '96px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm font-mono text-foreground overflow-hidden text-ellipsis whitespace-nowrap block">
          {(getValue() as string) ?? <span className="text-muted-foreground italic">Não identificado</span>}
        </span>
      ),
    },
    {
      id: 'tipo_manutencao',
      accessorKey: 'tipo_manutencao',
      header: 'Tipo',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '110px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="min-w-0 overflow-hidden block">
          {getTipoBadge((getValue() as string) ?? '')}
        </span>
      ),
    },
    {
      id: 'status_servico',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '130px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="min-w-0 overflow-hidden block">
          {getStatusBadge((getValue() as string) ?? '')}
        </span>
      ),
    },
    {
      id: 'tipo_servico',
      accessorKey: 'tipo_servico',
      header: 'Serviço',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: 'minmax(160px, 1fr)', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={String(getValue() || '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'estabelecimento',
      accessorKey: 'estabelecimento',
      header: 'Estabelecimento',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '160px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={String(getValue() || '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'custo_total',
      accessorKey: 'custo_total',
      header: 'Custo',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '100px', align: 'right', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap block">
          {formatCurrency((getValue() as number) ?? 0)}
        </span>
      ),
    },
    {
      id: 'km_manutencao',
      accessorKey: 'km_manutencao',
      header: 'KM',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '90px', align: 'right', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-foreground text-sm text-right whitespace-nowrap block">
          {formatNumber((getValue() as number) ?? 0)} km
        </span>
      ),
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
