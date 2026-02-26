/**
 * Componente UNIFICADO para importação de Excel de abastecimentos
 * Processa automaticamente ao selecionar arquivo, com preview e erros destacados
 */

import { useState, useCallback, useMemo } from 'react';
import { WarningAmberOutlined as AlertTriangle, CheckCircleOutlined as CheckCircle2, CloudUploadOutlined as Upload, TableChartOutlined as FileSpreadsheet, CloseOutlined as X, LoopOutlined as Loader2 } from '@mui/icons-material';
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
    parseUnifiedExcel,
    UnifiedParsedRow,
    UnifiedParseResult,
} from '@/utils/abastecimentoUnifiedParser';
import { importAbastecimentos, ImportProgress } from '@/utils/importacao/importer';
import { useToast } from '@/hooks/use-toast';

interface AbastecimentoUnifiedImporterProps {
    onImportComplete?: () => void;
}

export function AbastecimentoUnifiedImporter({ onImportComplete }: AbastecimentoUnifiedImporterProps) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDragging, setIsDragging] = useState(false);

    const ITEMS_PER_PAGE = 20;

    // Estatísticas
    const stats = useMemo(() => {
        if (!parseResult) return { total: 0, valid: 0, withErrors: 0 };
        return {
            total: parseResult.totalRows,
            valid: parseResult.validRows,
            withErrors: parseResult.errorRows,
        };
    }, [parseResult]);

    // Dados paginados
    const paginatedRows = useMemo(() => {
        if (!parseResult) return [];
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return parseResult.rows.slice(start, end);
    }, [parseResult, currentPage]);

    const totalPages = parseResult ? Math.ceil(parseResult.rows.length / ITEMS_PER_PAGE) : 0;

    // Handlers de drag and drop
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

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    // Handler de seleção de arquivo
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, []);

    // Processa arquivo automaticamente
    const processFile = useCallback(async (file: File) => {
        // Validar extensão
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'xlsx' && extension !== 'xls') {
            toast({
                title: 'Formato inválido',
                description: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)',
                variant: 'destructive',
            });
            return;
        }

        setSelectedFile(file);
        setIsProcessing(true);
        setParseResult(null);
        setCurrentPage(1);

        try {
            const result = await parseUnifiedExcel(file);
            setParseResult(result);

            if (result.validRows === 0 && result.totalRows > 0) {
                toast({
                    title: 'Atenção',
                    description: 'Todas as linhas contêm erros. Verifique os dados antes de importar.',
                    variant: 'destructive',
                });
            } else if (result.errorRows > 0) {
                toast({
                    title: 'Arquivo processado',
                    description: `${result.validRows} registro(s) válido(s), ${result.errorRows} com erros.`,
                });
            } else {
                toast({
                    title: 'Arquivo processado',
                    description: `${result.validRows} registro(s) prontos para importação.`,
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

    // Limpar arquivo selecionado
    const clearFile = useCallback(() => {
        setSelectedFile(null);
        setParseResult(null);
        setCurrentPage(1);
        setIsImporting(false);
        setImportProgress(null);
    }, []);

    // Confirmar importação
    const handleConfirmImport = useCallback(async () => {
        setIsImporting(true);

        try {
            // Converter para formato esperado pelo importer (todas as linhas)
            const rowsToImport = parseResult.rows.map((row) => ({
                data: row.data || null,
                veiculo: row.veiculo || null,
                condutor: row.condutor || null,
                posto: row.posto || null,
                cidade: row.cidade || null,
                estado: row.uf || null,
                km_inicial: row.km_inicial || null,
                litros: row.litros || null,
                produto: row.produto || null,
                valor_unitario: row.valor_unitario || null,
                valor_total: row.valor_total || null,
                parsingErrors: row.parsingErrors, // Passar erros originais para salvar no banco
            }));

            const onProgress = (progress: ImportProgress) => {
                setImportProgress(progress);
            };

            const result = await importAbastecimentos(rowsToImport, onProgress);

            if (result.errors.length > 0) {
                toast({
                    title: result.errors.length > 0 ? 'Importação concluída com erros' : 'Importação concluída com sucesso',
                    description: result.errors.length > 0
                        ? `Falha ao importar: ${result.errors.join('\n')}`
                        : `${result.success} abastecimento(s) importado(s).`,
                    variant: result.errors.length > 0 ? 'destructive' : 'default',
                });
            } else {
                toast({
                    title: 'Importação concluída!',
                    description: `${result.success} abastecimento(s) importado(s) com sucesso.`,
                });
            }

            if (onImportComplete) {
                onImportComplete();
            }

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
    }, [parseResult, toast, onImportComplete, clearFile]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatCurrency = (value: number | null): string => {
        if (value === null || value === undefined) return '—';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatNumber = (value: number | null, decimals: number = 2): string => {
        if (value === null || value === undefined) return '—';
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    // ============================================================================
    // RENDER: Área de Upload
    // ============================================================================
    if (!selectedFile && !isProcessing) {
        return (
            <div
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    'rounded-xl border-2 border-dashed p-8 text-center transition-all',
                    isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                )}
            >
                <input
                    type="file"
                    id="abastecimento-unified-upload"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                />
                <label
                    htmlFor="abastecimento-unified-upload"
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
                            ou <span className="font-medium text-primary">clique para selecionar</span>
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">Formatos aceitos: Excel (.xlsx, .xls)</p>
                </label>
            </div>
        );
    }

    // ============================================================================
    // RENDER: Processando
    // ============================================================================
    if (isProcessing) {
        return (
            <div className="py-12 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-gray-500">Processando linhas...</p>
                <p className="mt-1 text-sm text-gray-400">Validando veículos e aplicando sanitização</p>
            </div>
        );
    }

    // ============================================================================
    // RENDER: Progresso de Importação
    // ============================================================================
    if (isImporting && importProgress) {
        const progressPercent = importProgress.total > 0
            ? Math.round((importProgress.current / importProgress.total) * 100)
            : 0;

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
                        <Progress value={progressPercent} className="h-2" />
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

    // ============================================================================
    // RENDER: Preview
    // ============================================================================
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
                    <p className="text-sm text-emerald-600">Válidos</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.withErrors}</p>
                    <p className="text-sm text-red-600">Com Erros</p>
                </div>
            </div>

            {/* Tabela de preview */}
            {parseResult && parseResult.rows.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Preview dos Dados</CardTitle>
                        <CardDescription>
                            Revise os dados antes de confirmar a importação. Linhas com erros estão destacadas em
                            vermelho.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[500px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky top-0 w-12 bg-white">Status</TableHead>
                                        <TableHead className="sticky top-0 w-12 bg-white">Linha</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Data</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Veículo</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Condutor</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Posto</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Cidade</TableHead>
                                        <TableHead className="sticky top-0 bg-white">UF</TableHead>
                                        <TableHead className="sticky top-0 bg-white">KM Inicial</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Litros</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Produto</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Valor Unit.</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Valor Total</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Erros</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRows.map((row, idx) => {
                                        const hasErrors = row.parsingErrors.length > 0;

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
                                                <TableCell className="text-gray-400">{row.lineNumber}</TableCell>
                                                <TableCell className="min-w-[110px] whitespace-nowrap">
                                                    {row.data || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[100px] truncate">
                                                    {row.veiculo || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[120px] truncate">
                                                    {row.condutor || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[150px] truncate">
                                                    {row.posto || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[120px] truncate">
                                                    {row.cidade || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[50px] truncate">
                                                    {row.uf || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell>{formatNumber(row.km_inicial, 0)}</TableCell>
                                                <TableCell>{formatNumber(row.litros, 4)}</TableCell>
                                                <TableCell className="max-w-[120px] truncate">
                                                    {row.produto || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(row.valor_unitario)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(row.valor_total)}
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    {row.parsingErrors.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {row.parsingErrors.map((error, errIdx) => (
                                                                <Badge key={errIdx} variant="destructive" className="text-xs">
                                                                    {error}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
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
                <Button
                    onClick={handleConfirmImport}
                    disabled={isImporting || stats.total === 0}
                >
                    {isImporting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                        </>
                    ) : (
                        `Importar ${stats.total} Registro(s)`
                    )}
                </Button>
            </div>
        </div>
    );
}
