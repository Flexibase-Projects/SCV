import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'CONCLUIDO':
      case 'ENTREGUE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'EM ROTA':
      case 'EM_TRANSITO':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'PENDENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'CANCELADO':
      case 'CANCELADA':
        return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getDisplayStatus = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'EM_TRANSITO':
        return 'Em Trânsito';
      case 'CONCLUIDO':
      case 'ENTREGUE':
        return 'Concluído';
      case 'PENDENTE':
        return 'Pendente';
      case 'CANCELADA':
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status || 'N/A';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium rounded-full border px-2.5 py-0.5 text-xs',
        getStatusStyles(status)
      )}
    >
      {getDisplayStatus(status)}
    </Badge>
  );
}
