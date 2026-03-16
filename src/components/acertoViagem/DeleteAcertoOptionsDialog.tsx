import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteAcertoOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteKeep: () => void;
  onDeleteZero: () => void;
  isLoading: boolean;
}

export function DeleteAcertoOptionsDialog({
  open,
  onOpenChange,
  onDeleteKeep,
  onDeleteZero,
  isLoading,
}: DeleteAcertoOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Excluir acerto de viagem</DialogTitle>
          <DialogDescription>
            Escolha como tratar os custos das entregas vinculadas antes de concluir a exclusão.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={onDeleteKeep} disabled={isLoading}>
            Excluir e manter custos
          </Button>
          <Button onClick={onDeleteZero} disabled={isLoading}>
            Excluir e zerar custos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

