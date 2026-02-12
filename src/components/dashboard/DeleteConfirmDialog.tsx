import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  clienteName?: string;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  loadingLabel?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  clienteName,
  title,
  description,
  confirmLabel = 'Confirmar Exclusão',
  loadingLabel = 'Excluindo...'
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-100 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-0 gap-0 max-w-md overflow-hidden">
        <AlertDialogHeader className="p-6 border-b-2 border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50">
          <AlertDialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">
            {title || 'Confirmar Exclusão'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400 font-medium mt-2">
            {description || (
              <>
                Tem certeza que deseja excluir a entrega do cliente{' '}
                <span className="font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wide bg-zinc-200 dark:bg-zinc-800 px-1">{clienteName}</span>?
                <br /><br />
                <span className="block text-xs uppercase tracking-wider font-bold text-red-600 dark:text-red-400">
                  Esta ação é irreversível.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="p-6 bg-white dark:bg-zinc-950 gap-3">
          <AlertDialogCancel className="rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold uppercase tracking-wider h-12 px-6 mt-0">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 font-bold uppercase tracking-wider h-12 px-6 shadow-none hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.4)] transition-all duration-200"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
