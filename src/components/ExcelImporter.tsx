/**
 * Componente visual para importação de Excel de entregas
 * Mostra preview dos dados parseados e destaca erros em vermelho
 */

import { useState, useCallback, useMemo } from 'react';
import { WarningAmber as AlertTriangle, CheckCircle as CheckCircle2, CloudUpload as Upload, TableChart as FileSpreadsheet, Close as X } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseExcelEntregas, ParsedEntregaRow, ParsingError } from '@/utils/excelParser';
import { importEntregas, ImportProgress } from '@/utils/importacao/importer';
import { useToast } from '@/hooks/use-toast';

interface ExcelImporterProps {
  onImportComplete?: () => void;
}

export function ExcelImporter({ onImportComplete }: ExcelImporterProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedEntregaRow[]>([]);
  const [parsingErrors, setParsingErrors] = useState<ParsingError[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Estatísticas
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const withErrors = parsedRows.filter((r) => r.parsingErrors && r.parsingErrors.length > 0).length;
    const valid = total - withErrors;
    return { total, withErrors, valid };
  }, [parsedRows]);

  // Dados paginados
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return parsedRows.slice(start, start + ITEMS_PER_PAGE);
  }, [parsedRows, currentPage]);

  const totalPages = Math.ceil(parsedRows.length / ITEMS_PER_PAGE);

  // Handlers de drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls'].includes(extension || '')) {
        handleFileSelect(file);
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    e.target.value = '';
  }, []);

  // Processar arquivo selecionado
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setParsedRows([]);
    setParsingErrors([]);
    setCurrentPage(1);

    try {
      const result = await parseExcelEntregas(file);
      setParsedRows(result.rows);
      setParsingErrors(result.errors);

      if (result.errors.length > 0) {
        toast({
          title: 'Arquivo processado com avisos',
          description: `${result.errors.length} erro(s) encontrado(s) durante o parsing.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Arquivo processado com sucesso',
          description: `${result.rows.length} linha(s) parseada(s).`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao processar arquivo',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Limpar arquivo
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setParsedRows([]);
    setParsingErrors([]);
    setImportProgress(null);
    setCurrentPage(1);
  }, []);

  // Confirmar importação
  const handleConfirmImport = useCallback(async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(null);

    try {
      // Converter ParsedEntregaRow para formato esperado pelo importEntregas
      const rowsToImport = parsedRows.map((row) => ({
        pv_foco: row.pv_foco || '',
        nf: row.nf || '',
        valor: row.valor || 0,
        cliente: row.cliente || '',
        uf: row.uf || '',
        data_saida: row.data_saida || '',
        motorista: row.motorista || '',
        carro: row.carro || '',
        tipo_transporte: row.tipo_transporte || '',
        status: row.status || 'PENDENTE',
        precisa_montagem: row.precisa_montagem ?? false,
        data_montagem: row.data_montagem || '',
        montador_1: row.montador_1 || '',
        montador_2: row.montador_2 || '',
        gastos_entrega: row.gastos_entrega || 0,
        gastos_montagem: row.gastos_montagem || 0,
        produtividade: row.produtividade || 0,
        erros: row.erros || '',
        percentual_gastos: row.percentual_gastos || 0,
        descricao_erros: row.descricao_erros || '',
      }));

      const result = await importEntregas(rowsToImport, (progress) => {
        setImportProgress(progress);
      });

      toast({
        title: 'Importação concluída!',
        description: `${result.success} registro(s) importado(s) com sucesso.`,
      });

      if (onImportComplete) {
        onImportComplete();
      }

      // Limpar após sucesso
      clearFile();
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  }, [parsedRows, toast, onImportComplete, clearFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Renderizar área de upload
  if (!selectedFile && !isProcessing) {
    return (
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'rounded-xl border-2 border-dashed p-8 text-center transition-all',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <input
          type="file"
          id="excel-upload"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
        <label
          htmlFor="excel-upload"
          className="flex cursor-pointer flex-col items-center gap-4"
        >
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              isDragging ? 'bg-primary/10' : 'bg-gray-100'
            )}
          >
            <Upload className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-gray-400')} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Solte o arquivo aqui' : 'Arraste e solte seu arquivo Excel'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
          </div>
          <p className="text-xs text-gray-400">Formatos aceitos: Excel (.xlsx, .xls)</p>
        </label>
      </div>
    );
  }

  // Renderizar processamento
  if (isProcessing) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-gray-500">Processando arquivo Excel...</p>
      </div>
    );
  }

  // Renderizar progresso de importação
  if (isImporting && importProgress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importando Dados</CardTitle>
          <CardDescription>{importProgress.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span>
                {importProgress.current} / {importProgress.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{importProgress.created}</p>
                <p className="text-xs text-gray-500">Criados</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{importProgress.updated}</p>
                <p className="text-xs text-gray-500">Atualizados</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{importProgress.autoCreated}</p>
                <p className="text-xs text-gray-500">Auto-criados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar preview
  return (
    <div className="space-y-6">
      {/* Header com arquivo selecionado */}
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile?.name}</p>
              <p className="text-sm text-gray-500">
                {selectedFile && formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={isImporting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.valid}</p>
          <p className="text-sm text-emerald-600">Válidas</p>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.withErrors}</p>
          <p className="text-sm text-red-600">Com Erros</p>
        </div>
      </div>

      {/* Erros de parsing */}
      {parsingErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Erros de Parsing Encontrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {parsingErrors.map((error, idx) => (
                <div key={idx} className="rounded-lg bg-white p-3 text-sm">
                  <p className="font-medium text-red-700">
                    Linha {error.lineNumber}: {error.field || 'Erro'}
                  </p>
                  <p className="text-red-600">{error.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de preview */}
      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados</CardTitle>
            <CardDescription>
              Revise os dados antes de confirmar a importação. Linhas com erros estão destacadas
              em vermelho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 w-12 bg-white">Status</TableHead>
                    <TableHead className="sticky top-0 w-12 bg-white">Linha</TableHead>
                    <TableHead className="sticky top-0 bg-white">PV FOCO</TableHead>
                    <TableHead className="sticky top-0 bg-white">NF</TableHead>
                    <TableHead className="sticky top-0 bg-white">Cliente</TableHead>
                    <TableHead className="sticky top-0 bg-white">UF</TableHead>
                    <TableHead className="sticky top-0 bg-white">Valor</TableHead>
                    <TableHead className="sticky top-0 bg-white">Data Saída</TableHead>
                    <TableHead className="sticky top-0 bg-white">Motorista</TableHead>
                    <TableHead className="sticky top-0 bg-white">Carro</TableHead>
                    <TableHead className="sticky top-0 bg-white">Tipo Transporte</TableHead>
                    <TableHead className="sticky top-0 bg-white">Status</TableHead>
                    <TableHead className="sticky top-0 bg-white">Precisa Montagem</TableHead>
                    <TableHead className="sticky top-0 bg-white">Data Montagem</TableHead>
                    <TableHead className="sticky top-0 bg-white">Montador 1</TableHead>
                    <TableHead className="sticky top-0 bg-white">Montador 2</TableHead>
                    <TableHead className="sticky top-0 bg-white">Gastos Entrega</TableHead>
                    <TableHead className="sticky top-0 bg-white">Gastos Montagem</TableHead>
                    <TableHead className="sticky top-0 bg-white">Produtividade</TableHead>
                    <TableHead className="sticky top-0 bg-white">% Gastos</TableHead>
                    <TableHead className="sticky top-0 bg-white">Erros</TableHead>
                    <TableHead className="sticky top-0 bg-white">Descrição Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row, idx) => {
                    const hasErrors = row.parsingErrors && row.parsingErrors.length > 0;
                    const lineNumber = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

                    return (
                      <TableRow
                        key={idx}
                        className={cn(
                          hasErrors && 'bg-red-50/50 hover:bg-red-50',
                          !hasErrors && 'hover:bg-gray-50'
                        )}
                      >
                        <TableCell>
                          {hasErrors ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400">{lineNumber}</TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {row.pv_foco || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {row.nf || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {row.cliente || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[50px] truncate">
                          {row.uf || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.valor
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(row.valor)
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="min-w-[110px] whitespace-nowrap">
                          {row.data_saida || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {row.motorista || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {row.carro || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {row.tipo_transporte || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {row.status || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {row.precisa_montagem !== null && row.precisa_montagem !== undefined
                            ? row.precisa_montagem
                              ? 'Sim'
                              : 'Não'
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="min-w-[110px] whitespace-nowrap">
                          {row.data_montagem || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {row.montador_1 || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {row.montador_2 || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.gastos_entrega !== null && row.gastos_entrega !== undefined
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(row.gastos_entrega)
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.gastos_montagem !== null && row.gastos_montagem !== undefined
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(row.gastos_montagem)
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.produtividade !== null && row.produtividade !== undefined
                            ? row.produtividade.toFixed(2)
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.percentual_gastos !== null && row.percentual_gastos !== undefined
                            ? `${row.percentual_gastos.toFixed(2)}%`
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {row.erros || <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.descricao_erros || ''}>
                          {row.descricao_erros || <span className="text-gray-300">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
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
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={clearFile} disabled={isImporting}>
          Cancelar
        </Button>
        <Button onClick={handleConfirmImport} disabled={isImporting || parsedRows.length === 0}>
          {isImporting ? 'Importando...' : `Importar ${stats.valid} Registro(s)`}
        </Button>
      </div>
    </div>
  );
}

