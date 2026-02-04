import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Manutencao, STATUS_MANUTENCAO_LABELS, TIPO_MANUTENCAO_LABELS } from '@/types/manutencao';
import { cn } from '@/lib/utils';
import { WarningAmber as AlertTriangle, CheckCircle as CheckCircle2, Edit as Pencil, Delete as Trash2 } from '@mui/icons-material';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ManutencaoTableProps {
  manutencoes: Manutencao[];
  onEdit: (manutencao: Manutencao) => void;
  onDelete: (manutencao: Manutencao) => void;
  isLoading: boolean;
}

export function ManutencaoTable({ manutencoes, onEdit, onDelete, isLoading }: ManutencaoTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'preventiva') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Preventiva</Badge>;
    }
    return <Badge variant="secondary">Corretiva</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pendente</Badge>;
      case 'em_andamento':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Em Andamento</Badge>;
      case 'resolvida':
        return <Badge className="bg-green-500 hover:bg-green-600">Resolvida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando manutenções...
      </div>
    );
  }

  if (manutencoes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma manutenção encontrada.
      </div>
    );
  }

  return (
    <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="text-muted-foreground font-semibold">Data</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Veículo</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Tipo</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Serviço</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Estabelecimento</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">Custo</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">KM</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {manutencoes.map((manutencao) => (
            <TableRow
              key={manutencao.id}
              className={cn(
                "border-border hover:bg-muted/50",
                (manutencao.erros || manutencao.descricao_erros) && "bg-red-50 hover:bg-red-100"
              )}
            >
              <TableCell>
                <div className="flex justify-center">
                  {manutencao.erros || manutencao.descricao_erros ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{manutencao.descricao_erros || manutencao.erros}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Registro válido</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-foreground">
                {manutencao.data ? format(new Date(manutencao.data + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {manutencao.veiculo_placa ? (
                  manutencao.veiculo_placa
                ) : (
                  <span className="text-muted-foreground italic">Não identificado</span>
                )}
              </TableCell>
              <TableCell>
                {getTipoBadge(manutencao.tipo_manutencao)}
              </TableCell>
              <TableCell>
                {getStatusBadge(manutencao.status)}
              </TableCell>
              <TableCell className="text-foreground">
                {manutencao.tipo_servico}
              </TableCell>
              <TableCell className="text-foreground">
                {manutencao.estabelecimento}
              </TableCell>
              <TableCell className="text-foreground text-right font-medium text-green-600">
                {formatCurrency(manutencao.custo_total || 0)}
              </TableCell>
              <TableCell className="text-foreground text-right">
                {formatNumber(manutencao.km_manutencao || 0)} km
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(manutencao)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(manutencao)}
                    className="text-destructive hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
