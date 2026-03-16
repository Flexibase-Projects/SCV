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
import type { EntregaDisponivel } from './EntregaSelectionModal';

interface RemovedEntregasDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseKeep: () => void;
  onChooseZero: () => void;
  removedEntregas: EntregaDisponivel[];
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function getEntregaLabel(entrega: EntregaDisponivel) {
  return entrega.pv_foco || entrega.nota_fiscal || entrega.cliente || entrega.id;
}

export function RemovedEntregasDecisionModal({
  isOpen,
  onClose,
  onChooseKeep,
  onChooseZero,
  removedEntregas,
}: RemovedEntregasDecisionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Entregas removidas do acerto</DialogTitle>
          <DialogDescription>
            Você removeu entrega(s) que já estavam vinculadas. Escolha como tratar o custo dessas entregas.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[40vh] overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 sticky top-0">
              <tr>
                <th className="text-left p-2">Entrega</th>
                <th className="text-right p-2">Gasto atual</th>
                <th className="text-right p-2">Se zerar</th>
              </tr>
            </thead>
            <tbody>
              {removedEntregas.map((entrega) => (
                <tr key={entrega.id} className="border-t">
                  <td className="p-2">{getEntregaLabel(entrega)}</td>
                  <td className="p-2 text-right">{formatCurrency(entrega.gastos_entrega)}</td>
                  <td className="p-2 text-right">
                    <Badge variant="outline">{formatCurrency(0)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={onChooseKeep}>
            Manter custos removidas
          </Button>
          <Button onClick={onChooseZero}>
            Zerar custos removidas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

