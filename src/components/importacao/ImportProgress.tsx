import { LoopOutlined as Loader2 } from '@mui/icons-material';
import { Progress } from '@/components/ui/progress';
import { ImportProgress as ImportProgressType } from '@/utils/importacao/importer';

interface ImportProgressProps {
  progress: ImportProgressType;
}

export function ImportProgress({ progress }: ImportProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  const phaseLabels: Record<ImportProgressType['phase'], string> = {
    preparing: 'Preparando...',
    creating_dependencies: 'Criando registros auxiliares...',
    importing: 'Importando dados...',
    complete: 'Concluído!',
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {phaseLabels[progress.phase]}
        </h2>
        <p className="mt-1 text-gray-500">{progress.message}</p>
      </div>

      <div className="mx-auto max-w-md">
        <Progress value={percentage} className="h-3" />
        <p className="mt-2 text-sm text-gray-500">
          {progress.current} de {progress.total} ({percentage}%)
        </p>
      </div>

      {progress.autoCreated > 0 && (
        <p className="text-sm text-blue-600">
          ℹ️ {progress.autoCreated} registro(s) criado(s) automaticamente
        </p>
      )}
    </div>
  );
}

