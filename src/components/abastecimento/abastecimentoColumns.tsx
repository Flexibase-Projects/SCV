import { format } from 'date-fns';
import { Edit as Pencil, Delete as Trash2 } from '@mui/icons-material';
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
import type { Abastecimento } from '@/types/abastecimento';

export function getAbastecimentoColumns(
  onEdit: (a: Abastecimento) => void,
  onDelete: (a: Abastecimento) => void
): ColumnDef<Abastecimento, unknown>[] {
  return [
    {
      id: 'status',
      accessorFn: (row) => (row.erros === 'IMPORT_ERROR' || row.descricao_erros ? 'erro' : 'ok'),
      header: 'Status',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '80px', align: 'center', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const a = row.original;
        const hasErrors = a.erros === 'IMPORT_ERROR' || !!a.descricao_erros;
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
                  <TooltipContent className="bg-destructive text-destructive-foreground max-w-xs p-2">
                    <p className="font-bold underline mb-1 italic">Erros de Importação:</p>
                    <p className="text-xs">{a.descricao_erros || 'Dados incompletos ou inválidos'}</p>
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
      meta: { width: '102px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => {
        const data = getValue() as string | undefined;
        return (
          <span className="text-sm text-foreground block whitespace-nowrap">
            {data ? format(new Date(data + 'T12:00:00'), 'dd/MM/yyyy') : '-'}
          </span>
        );
      },
    },
    {
      id: 'veiculo_placa',
      accessorKey: 'veiculo_placa',
      header: 'Veículo',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '90px', align: 'left', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => {
        const placa = getValue() as string | undefined;
        return (
          <span className="text-sm font-mono text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={placa || undefined}>
            {placa || <span className="text-muted-foreground italic">Não identificado</span>}
          </span>
        );
      },
    },
    {
      id: 'condutor_nome',
      accessorKey: 'condutor_nome',
      header: 'Condutor',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '200px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => {
        const nome = getValue() as string | undefined;
        return (
          <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={nome || undefined}>
            {nome || <span className="text-muted-foreground italic">Não identificado</span>}
          </span>
        );
      },
    },
    {
      id: 'posto',
      accessorKey: 'posto',
      header: 'Posto/Manutenção',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: 'minmax(200px, 1fr)', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={String(getValue() || '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'cidade',
      accessorFn: (row) => (row.cidade && row.estado ? `${row.cidade} - ${row.estado}` : '-'),
      header: 'Cidade',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '200px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const cidade = row.original.cidade && row.original.estado
          ? `${row.original.cidade} - ${row.original.estado}`
          : '-';
        return (
          <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={cidade}>
            {cidade}
          </span>
        );
      },
    },
    {
      id: 'km_inicial',
      accessorKey: 'km_inicial',
      header: 'Km Inicial',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '120px', align: 'right', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground whitespace-nowrap block">
          {(getValue() as number)?.toLocaleString('pt-BR') ?? '0'}
        </span>
      ),
    },
    {
      id: 'litros',
      accessorKey: 'litros',
      header: 'Litros',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '88px', align: 'right', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground whitespace-nowrap block">
          {(getValue() as number)?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0'}
        </span>
      ),
    },
    {
      id: 'km_por_litro',
      accessorKey: 'km_por_litro',
      header: 'KM/L',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '100px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ row }) => {
        const kmPorLitro = row.original.km_por_litro;
        return (
          <div className="overflow-hidden">
            {kmPorLitro != null ? (
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {kmPorLitro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/l
              </Badge>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="border-amber-500 text-amber-600 cursor-help text-xs">
                      N/A
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">KM/L não pode ser calculado</p>
                    <p className="text-xs">Possíveis motivos: primeiro abastecimento; KM igual ou menor que o anterior; múltiplos abastecimentos no mesmo dia.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      id: 'produto',
      accessorKey: 'produto',
      header: 'Produto',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      meta: { width: '100px', align: 'left', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap block" title={String(getValue() || '')}>
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      id: 'valor_unitario',
      accessorKey: 'valor_unitario',
      header: 'Valor Un.',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '108px', align: 'right', hideOnMobile: true } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground whitespace-nowrap block">
          R$ {(getValue() as number)?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0,00'}
        </span>
      ),
    },
    {
      id: 'valor_total',
      accessorKey: 'valor_total',
      header: 'Valor Total',
      enableSorting: true,
      enableColumnFilter: false,
      meta: { width: '108px', align: 'right', hideOnMobile: false } as VirtualDataTableColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground whitespace-nowrap block">
          R$ {(getValue() as number)?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0,00'}
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
