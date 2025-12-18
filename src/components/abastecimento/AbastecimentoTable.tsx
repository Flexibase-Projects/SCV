import { Pencil, Trash2, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Abastecimento } from '@/types/abastecimento';

interface AbastecimentoTableProps {
  abastecimentos: Abastecimento[];
  onEdit: (abastecimento: Abastecimento) => void;
  onDelete: (abastecimento: Abastecimento) => void;
  isLoading: boolean;
}

export function AbastecimentoTable({
  abastecimentos,
  onEdit,
  onDelete,
  isLoading
}: AbastecimentoTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (abastecimentos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum abastecimento encontrado.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12 text-muted-foreground font-semibold text-center">Status</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Data</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Veículo</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Condutor</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Posto/Manutenção</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Cidade</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Km Inicial</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Litros</TableHead>
            <TableHead className="text-muted-foreground font-semibold">KM/L</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Produto</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Valor Un.</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Valor Total</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {abastecimentos.map((abastecimento) => {
            const hasErrors = abastecimento.erros === 'IMPORT_ERROR' || !!abastecimento.descricao_erros;

            return (
              <TableRow
                key={abastecimento.id}
                className={cn(
                  "border-border hover:bg-muted/50",
                  hasErrors && "bg-red-50/30 hover:bg-red-50/50"
                )}
              >
                <TableCell className="text-center">
                  {hasErrors ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center cursor-help">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-destructive text-destructive-foreground max-w-xs p-2">
                          <p className="font-bold underline mb-1 italic">Erros de Importação:</p>
                          <p className="text-xs">{abastecimento.descricao_erros || 'Dados incompletos ou inválidos'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="flex justify-center text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-foreground">
                  {abastecimento.data ? format(new Date(abastecimento.data), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {abastecimento.veiculo_placa || <span className="text-muted-foreground italic">Não identificado</span>}
                </TableCell>
                <TableCell className="text-foreground">
                  {abastecimento.condutor_nome || <span className="text-muted-foreground italic">Não identificado</span>}
                </TableCell>
                <TableCell className="text-foreground">
                  {abastecimento.posto || '-'}
                </TableCell>
                <TableCell className="text-foreground">
                  {abastecimento.cidade && abastecimento.estado
                    ? `${abastecimento.cidade} - ${abastecimento.estado}`
                    : '-'}
                </TableCell>
                <TableCell className="text-foreground whitespace-nowrap">
                  {abastecimento.km_inicial?.toLocaleString('pt-BR') || '0'}
                </TableCell>
                <TableCell className="text-foreground whitespace-nowrap">
                  {abastecimento.litros?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}
                </TableCell>
                <TableCell className="text-foreground">
                  {abastecimento.km_por_litro != null ? (
                    <Badge variant="outline" className="gap-1 font-medium whitespace-nowrap">
                      <Gauge className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {abastecimento.km_por_litro.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} km/l
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-foreground">
                  {abastecimento.produto || '-'}
                </TableCell>
                <TableCell className="text-foreground whitespace-nowrap">
                  R$ {abastecimento.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </TableCell>
                <TableCell className="text-foreground font-semibold whitespace-nowrap">
                  R$ {abastecimento.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(abastecimento)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(abastecimento)}
                      title="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
