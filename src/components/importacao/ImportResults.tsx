import { CheckCircleOutlined as CheckCircle2, WarningAmberOutlined as AlertTriangle, InfoOutlined as Info, RotateLeftOutlined as RotateCcw } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { ImportResult } from '@/utils/importacao/importer';

interface ImportResultsProps {
  result: ImportResult;
  onNewImport: () => void;
}

export function ImportResults({ result, onNewImport }: ImportResultsProps) {
  const hasAutoCreated = result.autoCreated.veiculos.length > 0 || result.autoCreated.motoristas.length > 0;
  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-6">
      {/* Resultado Principal */}
      <div className="text-center">
        {hasErrors ? (
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
        ) : (
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-gray-900">
          {hasErrors ? 'Importação Concluída com Avisos' : 'Importação Concluída!'}
        </h2>
        
        <p className="mt-2 text-gray-500">
          {result.success} registro(s) importado(s) com sucesso
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{result.success}</p>
          <p className="text-sm text-emerald-600">Importados</p>
        </div>
        
        {hasAutoCreated && (
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {result.autoCreated.veiculos.length + result.autoCreated.motoristas.length}
            </p>
            <p className="text-sm text-blue-600">Criados Auto.</p>
          </div>
        )}
        
        {hasErrors && (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{result.errors.length}</p>
            <p className="text-sm text-red-600">Erros</p>
          </div>
        )}
      </div>

      {/* Registros Criados Automaticamente */}
      {hasAutoCreated && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-blue-700">Registros Criados Automaticamente</h3>
          </div>
          
          <div className="space-y-3">
            {result.autoCreated.veiculos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Veículos ({result.autoCreated.veiculos.length}):
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.autoCreated.veiculos.map((placa, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {placa}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {result.autoCreated.motoristas.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Condutores ({result.autoCreated.motoristas.length}):
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.autoCreated.motoristas.map((nome, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {nome}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Erros */}
      {hasErrors && (
        <div className="rounded-lg border bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-700">Erros Durante Importação</h3>
          </div>
          
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {result.errors.map((error, idx) => (
              <p key={idx} className="text-sm text-red-600">
                • {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Botão Nova Importação */}
      <div className="flex justify-center">
        <Button onClick={onNewImport} size="lg">
          <RotateCcw className="mr-2 h-4 w-4" />
          Nova Importação
        </Button>
      </div>
    </div>
  );
}

