import type { ColumnDef } from '@tanstack/react-table';
import { EditOutlined as Edit, DeleteOutlined as Trash2, PrintOutlined as Printer, MoreHorizOutlined as MoreHorizontal } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { VirtualDataTableColumnMeta } from '@/components/shared/virtualDataTableTypes';
import type { AcertoViagem } from '@/types/acertoViagem';
import { calcularTotalDespesas, calcularSaldo, calcularDiasViagem } from '@/types/acertoViagem';
import { cn } from '@/lib/utils';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function getResponsavel(acerto: AcertoViagem) {
  if (acerto.motorista_nome && acerto.montador_nome) {
    return `${acerto.motorista_nome} / ${acerto.montador_nome}`;
  }
  return acerto.motorista_nome || acerto.montador_nome || '-';
}

function getVeiculoLine(acerto: AcertoViagem) {
  if (acerto.veiculo_placa && acerto.veiculo_modelo) {
    return `${acerto.veiculo_placa} - ${acerto.veiculo_modelo}`;
  }
  return acerto.veiculo_placa || '-';
}

export function getAcertoColumns(
  onEdit: (a: AcertoViagem) => void,
  onPrint: (a: AcertoViagem) => void,
  onDeleteRequest: (id: string) => void
): ColumnDef<AcertoViagem, unknown>[] {
  return [
    {
      id: 'destino',
      accessorKey: 'destino',
      header: 'Destino',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '130px', align: 'left' } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-xs font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap block min-w-0" title={String(getValue() ?? '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'responsavel',
      accessorFn: (row) => getResponsavel(row),
      header: 'Responsável',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '150px', align: 'left' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const v = getResponsavel(row.original);
        return (
          <span className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap block min-w-0" title={v}>
            {v}
          </span>
        );
      },
    },
    {
      id: 'veiculo',
      accessorFn: (row) => getVeiculoLine(row),
      header: 'Veículo',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '130px', align: 'left' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const v = getVeiculoLine(row.original);
        return (
          <span className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap block min-w-0" title={v}>
            {v}
          </span>
        );
      },
    },
    {
      id: 'data_saida',
      accessorKey: 'data_saida',
      header: 'Período',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '130px', align: 'left' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const saida = formatDate(row.original.data_saida);
        const chegada = formatDate(row.original.data_chegada);
        const v = saida !== '-' && chegada !== '-' ? `${saida} a ${chegada}` : saida;
        return (
          <span className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap block min-w-0" title={v}>
            {v}
          </span>
        );
      },
    },
    {
      id: 'dias',
      accessorFn: (row) => calcularDiasViagem(row.data_saida, row.data_chegada),
      header: 'Dias',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '72px', align: 'center' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const dias = calcularDiasViagem(row.original.data_saida, row.original.data_chegada);
        return (
          <span className="text-xs text-foreground whitespace-nowrap">
            <Badge variant="outline" className="text-[10px] font-normal">{dias > 0 ? `${dias} dias` : '-'}</Badge>
          </span>
        );
      },
    },
    {
      id: 'valor_adiantamento',
      accessorKey: 'valor_adiantamento',
      header: 'Adiantamento',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '100px', align: 'right' } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums text-foreground overflow-hidden text-ellipsis whitespace-nowrap block min-w-0">
          R$ {((getValue() as number) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: 'despesas',
      accessorFn: (row) => calcularTotalDespesas(row),
      header: 'Despesas',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '100px', align: 'right' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const total = calcularTotalDespesas(row.original);
        return (
          <span className="text-xs tabular-nums font-medium text-orange-600 dark:text-orange-400 overflow-hidden text-ellipsis whitespace-nowrap block min-w-0">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      id: 'saldo',
      accessorFn: (row) => {
        const s = calcularSaldo(row);
        return s.tipo === 'devolver' ? s.valor : -s.valor;
      },
      header: 'Saldo',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '110px', align: 'right' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const saldo = calcularSaldo(row.original);
        const line = `${saldo.tipo === 'devolver' ? '+' : '-'} R$ ${saldo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        return (
          <span
            className={cn(
              'text-xs tabular-nums overflow-hidden text-ellipsis whitespace-nowrap block min-w-0',
              saldo.tipo === 'devolver' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
            title={line}
          >
            {line}
          </span>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '90px', align: 'center' } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const isPendente = status === 'PENDENTE';
        return (
          <span className="inline-flex">
            <Badge className={cn('text-[10px]', isPendente ? 'bg-yellow-500' : 'bg-green-500')}>
              {isPendente ? 'Pendente' : 'Acertado'}
            </Badge>
          </span>
        );
      },
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      enableColumnFilter: false,
      meta: { width: '72px', align: 'right' } as VirtualDataTableColumnMeta,
      cell: ({ row }) => (
        <div className="flex justify-end min-w-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPrint(row.original)}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteRequest(row.original.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
