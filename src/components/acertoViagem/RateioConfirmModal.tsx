import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoOutlined as Info } from '@mui/icons-material';
import type { RateioResumo } from '@/types/acertoViagem';
import type { EntregaDisponivel } from './EntregaSelectionModal';
import { isEntregaImpactada } from '@/utils/acertoRateio';

interface RateioConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  rateio: RateioResumo | null;
  entregasMap: Map<string, EntregaDisponivel>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function getEntregaLabel(entrega?: EntregaDisponivel) {
  if (!entrega) return 'Entrega não encontrada';
  return entrega.pv_foco || entrega.nota_fiscal || entrega.cliente || entrega.id;
}

export function RateioConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  rateio,
  entregasMap,
}: RateioConfirmModalProps) {
  const entregasImpactadas = (rateio?.entregas || []).filter((item) => isEntregaImpactada(item));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Confirmar atualização de gastos por entrega</DialogTitle>
          <DialogDescription>
            Revise as mudanças antes de salvar o acerto. Apenas entregas com alteração aparecem abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">Total despesas: {formatCurrency(rateio?.totalDespesas || 0)}</Badge>
            <Badge variant="outline">Base de valor: {formatCurrency(rateio?.baseValor || 0)}</Badge>
            <Badge variant="outline">Distribuído: {formatCurrency(rateio?.totalDistribuido || 0)}</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-muted-foreground cursor-help gap-1">
                    <Info className="h-4 w-4" />
                    Ajuste de centavos
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Se houver diferença por arredondamento para 2 casas, o ajuste final é aplicado na última entrega com valor.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {rateio?.temEntregaValorZero && (
            <Alert>
              <AlertDescription>
                Existem entregas com valor zero. Elas ficam com 0% no rateio e gasto proporcional zero.
              </AlertDescription>
            </Alert>
          )}

          {rateio?.temBaseZero && (
            <Alert>
              <AlertDescription>
                A base total de valores está zerada. O sistema vai salvar com gasto de entrega zerado para todas.
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-[45vh] overflow-auto rounded-md border">
            {entregasImpactadas.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Nenhuma alteração detectada nos gastos de entrega.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Entrega</th>
                    <th className="text-right p-2">%</th>
                    <th className="text-right p-2">Atual</th>
                    <th className="text-right p-2">Novo</th>
                  </tr>
                </thead>
                <tbody>
                  {entregasImpactadas.map((item) => {
                    const entrega = entregasMap.get(item.id);
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{getEntregaLabel(entrega)}</td>
                        <td className="p-2 text-right">{item.percentual.toFixed(2)}%</td>
                        <td className="p-2 text-right">{formatCurrency(item.gastoAnterior)}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(item.gastoNovo)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Confirmar e salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

