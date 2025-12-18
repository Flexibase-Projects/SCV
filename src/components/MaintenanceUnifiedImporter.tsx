/**
 * Componente UNIFICADO para importação de Excel de manutenções
 * Processa automaticamente ao selecionar arquivo linha a linha (sem agrupamento)
 * e mostra preview com todos os registros
 */

import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
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
} from '@/utils/maintenanceUnifiedParser';
import { importManutencoes, ImportProgress } from '@/utils/importacao/importer';
import { normalizePlaca } from '@/utils/importacao/normalizer';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MaintenanceUnifiedImporterProps {
    onImportComplete?: () => void;
}

export function MaintenanceUnifiedImporter({ onImportComplete }: MaintenanceUnifiedImporterProps) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedTipoManutencao, setSelectedTipoManutencao] = useState<'preventiva' | 'corretiva' | null>(null);

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

    // Verificar se o Excel tem tipo_manutencao
    const hasTipoManutencaoInExcel = useMemo(() => {
        if (!parseResult) return false;
        return parseResult.rows.some((row) => row.tipo_manutencao !== null);
    }, [parseResult]);

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
                    description: `${result.totalRows} registro(s) processado(s). ${result.validRows} válido(s), ${result.errorRows} com erros.`,
                });
            } else {
                toast({
                    title: 'Arquivo processado',
                    description: `${result.totalRows} registro(s) pronto(s) para importação.`,
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
        setSelectedTipoManutencao(null);
    }, []);

    // Confirmar importação
    const handleConfirmImport = useCallback(async () => {
        if (!parseResult || parseResult.validRows === 0) return;


        setIsImporting(true);

        // Verificar se precisa de tipo de manutenção
        if (!hasTipoManutencaoInExcel && !selectedTipoManutencao) {
            toast({
                title: 'Tipo de manutenção necessário',
                description: 'Selecione o tipo de manutenção antes de importar',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Converter para formato esperado pelo importer
            // O importer espera 'placa' normalizada (sem espaços, hífens, uppercase)
            const rowsToImport = parseResult.rows.map((row) => ({
                data: row.data || '',
                placa: normalizePlaca(row.veiculo) || '',
                estabelecimento: row.estabelecimento || '',
                tipo_servico: row.tipo_servico || '',
                descricao_servico: row.descricao_servico || null,
                custo_total: row.custo_total || 0,
                km_manutencao: row.km_manutencao !== null ? row.km_manutencao : (null as any),
                nota_fiscal: row.nota_fiscal || null,
                tipo_manutencao: row.tipo_manutencao || selectedTipoManutencao || 'corretiva',
                parsingErrors: row.parsingErrors,
            }));

            const onProgress = (progress: ImportProgress) => {
                setImportProgress(progress);
            };

            const result = await importManutencoes(rowsToImport, onProgress);

            if (result.errors.length > 0) {
                toast({
                    title: result.errors.length > 0 ? 'Importação concluída com erros' : 'Importação concluída com sucesso',
                    description: result.errors.length > 0
                        ? `Falha ao importar: ${result.errors.join('\n')}`
                        : `${result.success} manutenção(ões) importada(s).`,
                    variant: result.errors.length > 0 ? 'destructive' : 'default',
                });
            } else {
                toast({
                    title: 'Importação concluída!',
                    description: `${result.success} manutenção(ões) importada(s) com sucesso.`,
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
    }, [parseResult, toast, onImportComplete, clearFile, hasTipoManutencaoInExcel, selectedTipoManutencao]);

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

    const formatNumber = (value: number | null, decimals: number = 0): string => {
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
                    id="maintenance-unified-upload"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                />
                <label
                    htmlFor="maintenance-unified-upload"
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
                <p className="mt-1 text-sm text-gray-400">Validando veículos e limpando dados</p>
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
                    <p className="text-sm text-slate-500">Total de Registros</p>
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

            {/* Seleção de Tipo de Manutenção (se não houver no Excel) */}
            {parseResult && !hasTipoManutencaoInExcel && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tipo de Manutenção</CardTitle>
                        <CardDescription>
                            O arquivo não contém a coluna "Tipo de Manutenção". Selecione o tipo que será aplicado a todos os registros.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="tipo-manutencao">Tipo de Manutenção</Label>
                            <Select
                                value={selectedTipoManutencao || ''}
                                onValueChange={(value) => setSelectedTipoManutencao(value as 'preventiva' | 'corretiva')}
                            >
                                <SelectTrigger id="tipo-manutencao" className="w-full">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="preventiva">Preventiva</SelectItem>
                                    <SelectItem value="corretiva">Corretiva</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                        <TableHead className="sticky top-0 bg-white">Linha</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Data</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Placa</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Tipo</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Tipo Serviço</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Descrição</TableHead>
                                        <TableHead className="sticky top-0 bg-white">Valor</TableHead>
                                        <TableHead className="sticky top-0 bg-white">KM</TableHead>
                                        <TableHead className="sticky top-0 bg-white">NF (Limpa)</TableHead>
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
                                                <TableCell className="text-xs text-gray-500">
                                                    {row.lineNumber}
                                                </TableCell>
                                                <TableCell className="min-w-[110px] whitespace-nowrap">
                                                    {row.data || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[100px] truncate">
                                                    {row.veiculo || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {row.tipo_manutencao ? (
                                                        <Badge variant={row.tipo_manutencao === 'preventiva' ? 'default' : 'secondary'}>
                                                            {row.tipo_manutencao === 'preventiva' ? 'Preventiva' : 'Corretiva'}
                                                        </Badge>
                                                    ) : hasTipoManutencaoInExcel ? (
                                                        <span className="text-gray-300">—</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">
                                                            {selectedTipoManutencao ? (selectedTipoManutencao === 'preventiva' ? 'Preventiva' : 'Corretiva') : 'Não definido'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[120px] truncate">
                                                    {row.tipo_servico || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {row.descricao_servico || <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatCurrency(row.custo_total)}
                                                </TableCell>
                                                <TableCell>
                                                    {row.km_manutencao !== null ? formatNumber(row.km_manutencao, 0) : 'S/KM'}
                                                </TableCell>
                                                <TableCell className="max-w-[100px] truncate">
                                                    {row.nota_fiscal || <span className="text-gray-300">—</span>}
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
                        `Importar ${stats.total} Manutenção(ões)`
                    )}
                </Button>
            </div>
        </div>
    );
}

