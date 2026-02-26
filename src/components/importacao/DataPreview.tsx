import { useMemo, useState } from 'react';
import { WarningAmberOutlined as AlertTriangle, ErrorOutline as AlertCircle, InfoOutlined as Info, CheckCircleOutlined as CheckCircle2, FilterListOutlined as Filter, DownloadOutlined as Download } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ValidationResult, ValidationWarning, WarningType } from '@/utils/importacao/validators';
import { cn } from '@/lib/utils';

interface DataPreviewProps {
  data: Record<string, any>[];
  headers: string[];
  validationResults: ValidationResult[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export function DataPreview({
  data,
  headers,
  validationResults,
  onConfirm,
  onCancel,
  isImporting = false,
}: DataPreviewProps) {
  const [showOnlyWithWarnings, setShowOnlyWithWarnings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Estatísticas
  const stats = useMemo(() => {
    const critical = validationResults.filter((r) =>
      r.warnings.some((w) => w.type === 'critical')
    ).length;
    const moderate = validationResults.filter((r) =>
      r.warnings.some((w) => w.type === 'moderate')
    ).length;
    const info = validationResults.filter((r) =>
      r.warnings.some((w) => w.type === 'info')
    ).length;
    const ok = validationResults.filter((r) => r.warnings.length === 0).length;

    return { critical, moderate, info, ok, total: data.length };
  }, [validationResults, data.length]);

  // Avisos agrupados
  const groupedWarnings = useMemo(() => {
    const groups: Record<string, { type: WarningType; message: string; lines: number[] }> = {};

    validationResults.forEach((result) => {
      result.warnings.forEach((warning) => {
        const key = `${warning.type}:${warning.message}`;
        if (!groups[key]) {
          groups[key] = {
            type: warning.type,
            message: warning.message,
            lines: [],
          };
        }
        groups[key].lines.push(warning.lineNumber);
      });
    });

    return Object.values(groups).sort((a, b) => {
      const typeOrder = { critical: 0, moderate: 1, info: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  }, [validationResults]);

  // Dados filtrados e paginados
  const filteredData = useMemo(() => {
    if (!showOnlyWithWarnings) return data;
    return data.filter((_, idx) => validationResults[idx]?.warnings.length > 0);
  }, [data, validationResults, showOnlyWithWarnings]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Função para obter status da linha
  const getRowStatus = (idx: number): { type: WarningType | 'ok'; icon: React.ReactNode } => {
    const originalIdx = showOnlyWithWarnings
      ? data.indexOf(filteredData[idx])
      : idx + (currentPage - 1) * ITEMS_PER_PAGE;
    
    const warnings = validationResults[originalIdx]?.warnings || [];
    
    if (warnings.length === 0) {
      return { type: 'ok', icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> };
    }
    if (warnings.some((w) => w.type === 'critical')) {
      return { type: 'critical', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> };
    }
    if (warnings.some((w) => w.type === 'moderate')) {
      return { type: 'moderate', icon: <AlertCircle className="h-4 w-4 text-amber-500" /> };
    }
    return { type: 'info', icon: <Info className="h-4 w-4 text-blue-500" /> };
  };

  // Download relatório de avisos
  const downloadWarningsReport = () => {
    const BOM = '\uFEFF';
    const lines = ['Tipo,Mensagem,Linhas Afetadas'];
    
    groupedWarnings.forEach((w) => {
      const typeLabel = w.type === 'critical' ? 'CRÍTICO' : w.type === 'moderate' ? 'MODERADO' : 'INFO';
      lines.push(`"${typeLabel}","${w.message}","${w.lines.join(', ')}"`);
    });
    
    const csv = BOM + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_avisos.csv';
    link.click();
  };

  // Headers formatados para exibição
  const displayHeaders = useMemo(() => {
    const headerMap: Record<string, string> = {
      placa: 'Placa',
      fabricante: 'Fabricante',
      modelo: 'Modelo',
      tipo: 'Tipo',
      ano: 'Ano',
      pv_foco: 'PV Foco',
      nf: 'NF',
      valor: 'Valor',
      cliente: 'Cliente',
      uf: 'UF',
      data_saida: 'Data Saída',
      motorista: 'Motorista',
      carro: 'Carro',
      status: 'Status',
      data: 'Data',
      veiculo: 'Veículo',
      condutor: 'Condutor',
      posto: 'Posto',
      cidade: 'Cidade',
      estado: 'Estado',
      km_inicial: 'KM Inicial',
      litros: 'Litros',
      produto: 'Produto',
      valor_unitario: 'Valor Un.',
      valor_total: 'Valor Total',
      estabelecimento: 'Estabelecimento',
      tipo_servico: 'Tipo Serviço',
      custo_total: 'Custo Total',
      km_manutencao: 'KM Manutenção',
      nome: 'Nome',
      funcao: 'Função',
    };
    
    return headers.slice(0, 8).map((h) => headerMap[h] || h);
  }, [headers]);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.ok}</p>
          <p className="text-sm text-emerald-600">OK</p>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          <p className="text-sm text-red-600">Críticos</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.moderate}</p>
          <p className="text-sm text-amber-600">Moderados</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
          <p className="text-sm text-blue-600">Info</p>
        </div>
      </div>

      {/* Avisos Agrupados */}
      {groupedWarnings.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-700">⚠️ Avisos Encontrados</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {groupedWarnings.map((warning, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 text-sm',
                  warning.type === 'critical' && 'bg-red-50',
                  warning.type === 'moderate' && 'bg-amber-50',
                  warning.type === 'info' && 'bg-blue-50'
                )}
              >
                {warning.type === 'critical' && (
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                )}
                {warning.type === 'moderate' && (
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                )}
                {warning.type === 'info' && (
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                )}
                <div className="flex-1">
                  <p className="text-gray-700">{warning.message}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Linhas: {warning.lines.slice(0, 5).join(', ')}
                    {warning.lines.length > 5 && ` e mais ${warning.lines.length - 5}...`}
                  </p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {warning.lines.length}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtro e Tabela */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-warnings"
              checked={showOnlyWithWarnings}
              onCheckedChange={(checked) => {
                setShowOnlyWithWarnings(!!checked);
                setCurrentPage(1);
              }}
            />
            <label htmlFor="filter-warnings" className="flex cursor-pointer items-center gap-2 text-sm">
              <Filter className="h-4 w-4" />
              Mostrar apenas com avisos
            </label>
          </div>
          <span className="text-sm text-gray-500">
            {filteredData.length} linha(s)
          </span>
        </div>

        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 w-12 bg-white">Status</TableHead>
                <TableHead className="sticky top-0 w-12 bg-white">Linha</TableHead>
                {displayHeaders.map((header, idx) => (
                  <TableHead key={idx} className="sticky top-0 bg-white">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, idx) => {
                const { type, icon } = getRowStatus(idx);
                const originalIdx = showOnlyWithWarnings
                  ? data.indexOf(row)
                  : idx + (currentPage - 1) * ITEMS_PER_PAGE;
                
                return (
                  <TableRow
                    key={idx}
                    className={cn(
                      type === 'critical' && 'bg-red-50/50',
                      type === 'moderate' && 'bg-amber-50/50',
                      type === 'info' && 'bg-blue-50/50'
                    )}
                  >
                    <TableCell>{icon}</TableCell>
                    <TableCell className="text-gray-400">{originalIdx + 2}</TableCell>
                    {headers.slice(0, 8).map((header, hidx) => (
                      <TableCell key={hidx} className="max-w-[150px] truncate">
                        {row[header] ?? <span className="text-gray-300">—</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Mensagem de confirmação */}
      <div className="rounded-lg bg-slate-100 p-4">
        <p className="text-center text-gray-700">
          {stats.critical > 0 || stats.moderate > 0 ? (
            <>
              <span className="font-semibold">⚠️ Atenção:</span>{' '}
              {stats.critical + stats.moderate} linha(s) possuem avisos.
              <br />
              <span className="text-sm text-gray-500">
                Deseja continuar com a importação mesmo assim?
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-emerald-600">✅ Tudo certo!</span>{' '}
              Nenhum problema encontrado.
              <br />
              <span className="text-sm text-gray-500">
                Clique em confirmar para iniciar a importação.
              </span>
            </>
          )}
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          ❌ Cancelar
        </Button>
        
        {groupedWarnings.length > 0 && (
          <Button variant="outline" onClick={downloadWarningsReport} disabled={isImporting}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
        )}
        
        <Button onClick={onConfirm} disabled={isImporting}>
          {isImporting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
              Importando...
            </>
          ) : (
            '✅ Confirmar Importação'
          )}
        </Button>
      </div>
    </div>
  );
}

