import { useState, useCallback } from 'react';
import { DownloadOutlined as Download } from '@mui/icons-material';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/importacao/FileUpload';
import { DataPreview } from '@/components/importacao/DataPreview';
import { ImportResults } from '@/components/importacao/ImportResults';
import { ImportProgress } from '@/components/importacao/ImportProgress';
import { ExcelImporter } from '@/components/ExcelImporter';
import { AbastecimentoUnifiedImporter } from '@/components/AbastecimentoUnifiedImporter';
import { MaintenanceUnifiedImporter } from '@/components/MaintenanceUnifiedImporter';
import {
  parseFile,
  normalizeRow,
  validateAll,
  loadCache,
  downloadTemplate,
  getImportTypes,
  importVeiculos,
  importEntregas,
  importAbastecimentos,
  importManutencoes,
  importMotoristas,
  importMontadores,
  type ImportType,
  type ParsedData,
  type ValidationResult,
  type ImportProgress as ImportProgressType,
  type ImportResult,
  type ValidationCache,
} from '@/utils/importacao';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type PageState = 'upload' | 'processing' | 'preview' | 'importing' | 'complete';

export default function Importacao() {
  const { toast } = useToast();

  // Estado da página
  const [pageState, setPageState] = useState<PageState>('upload');
  const [selectedType, setSelectedType] = useState<ImportType>('veiculos');
  const [useAdvancedParser, setUseAdvancedParser] = useState(false);

  // Dados
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [normalizedData, setNormalizedData] = useState<Record<string, any>[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  // Progresso e resultado
  const [importProgress, setImportProgress] = useState<ImportProgressType | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Processa arquivo selecionado
  const handleFileSelect = useCallback(async (file: File) => {
    setPageState('processing');

    try {
      // 1. Parse do arquivo
      const parsed = await parseFile(file);
      setParsedData(parsed);

      // 2. Normalizar dados
      const normalized = parsed.rows.map((row) => normalizeRow(row, selectedType));
      setNormalizedData(normalized);

      // 3. Carregar cache para validação
      const cache = await loadCache();

      // 4. Carregar placas existentes para veículos
      let existingPlacas = new Set<string>();
      if (selectedType === 'veiculos') {
        const { data } = await supabase.from('veiculos').select('placa');
        existingPlacas = new Set(data?.map((v) => v.placa?.toUpperCase().replace(/[\s\-]/g, '') || '') || []);
      }

      // 5. Validar dados
      const results = validateAll(normalized, selectedType, cache, existingPlacas);
      setValidationResults(results);

      // 6. Ir para preview
      setPageState('preview');

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setPageState('upload');
    }
  }, [selectedType, toast]);

  // Confirma importação
  const handleConfirmImport = useCallback(async () => {
    if (!normalizedData.length) return;

    setPageState('importing');

    try {
      let result: ImportResult;

      const onProgress = (progress: ImportProgressType) => {
        setImportProgress(progress);
      };

      // Executar importação baseado no tipo
      switch (selectedType) {
        case 'veiculos':
          result = await importVeiculos(normalizedData, onProgress);
          break;
        case 'entregas':
          result = await importEntregas(normalizedData, onProgress);
          break;
        case 'abastecimentos':
          result = await importAbastecimentos(normalizedData, onProgress);
          break;
        case 'manutencoes':
          result = await importManutencoes(normalizedData, onProgress);
          break;
        case 'motoristas':
          result = await importMotoristas(normalizedData, onProgress);
          break;
        case 'montadores':
          result = await importMontadores(normalizedData, onProgress);
          break;
        default:
          throw new Error('Tipo de importação não suportado');
      }

      setImportResult(result);
      setPageState('complete');

      toast({
        title: 'Importação concluída!',
        description: `${result.success} registro(s) importado(s) com sucesso.`,
      });

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setPageState('preview');
    }
  }, [normalizedData, selectedType, toast]);

  // Cancela e volta ao upload
  const handleCancel = useCallback(() => {
    setParsedData(null);
    setNormalizedData([]);
    setValidationResults([]);
    setImportProgress(null);
    setImportResult(null);
    setPageState('upload');
  }, []);

  // Nova importação
  const handleNewImport = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  // Download de template
  const handleDownloadTemplate = useCallback(() => {
    downloadTemplate(selectedType);
  }, [selectedType]);

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Importação de Dados</h2>
          <p className="text-muted-foreground">
            Importe seus dados do Excel ou CSV para o sistema
          </p>
        </div>

        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>
              {pageState === 'upload' && 'Selecione o tipo e faça upload do arquivo'}
              {pageState === 'processing' && 'Processando arquivo...'}
              {pageState === 'preview' && 'Preview da Importação'}
              {pageState === 'importing' && 'Importando Dados'}
              {pageState === 'complete' && 'Resultado da Importação'}
            </CardTitle>
            <CardDescription>
              {pageState === 'upload' && 'Escolha o tipo de dado e envie seu arquivo CSV ou Excel'}
              {pageState === 'processing' && 'Aguarde enquanto analisamos seu arquivo...'}
              {pageState === 'preview' && 'Revise os dados antes de confirmar a importação'}
              {pageState === 'importing' && 'Aguarde enquanto importamos seus dados...'}
              {pageState === 'complete' && 'Veja o resumo da importação'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Estado: Upload */}
            {pageState === 'upload' && (
              <>
                {/* Seletor de Tipo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Dados</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value as ImportType);
                      setUseAdvancedParser(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {getImportTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Modo Avançado para Entregas */}
                {selectedType === 'entregas' && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">Modo Avançado de Importação</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Use este modo se seu Excel tem coluna aglutinada (PV FOCO + NF) ou múltiplas colunas de montadores (MONTADOR 1-7)
                        </p>
                      </div>
                      <Button
                        variant={useAdvancedParser ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUseAdvancedParser(!useAdvancedParser)}
                      >
                        {useAdvancedParser ? 'Desativar' : 'Ativar'} Modo Avançado
                      </Button>
                    </div>
                  </div>
                )}


                {/* Botão Download Template */}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Template CSV
                  </Button>
                </div>

                {/* Upload de Arquivo ou Importers Especializados */}
                {selectedType === 'entregas' && useAdvancedParser ? (
                  <ExcelImporter
                    onImportComplete={() => {
                      setPageState('upload');
                      setUseAdvancedParser(false);
                    }}
                  />
                ) : selectedType === 'abastecimentos' ? (
                  <AbastecimentoUnifiedImporter
                    onImportComplete={() => {
                      setPageState('upload');
                    }}
                  />
                ) : selectedType === 'manutencoes' ? (
                  <MaintenanceUnifiedImporter
                    onImportComplete={() => {
                      setPageState('upload');
                    }}
                  />
                ) : (
                  <FileUpload onFileSelect={handleFileSelect} />
                )}

                {/* Instruções */}
                <div className="rounded-lg bg-brand-blue/5 p-4 text-sm text-gray-600">
                  <p className="font-medium">💡 Dicas:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Baixe o template para ver o formato esperado</li>
                    <li>O sistema aceita arquivos CSV e Excel (.xlsx, .xls)</li>
                    <li>Campos vazios não bloqueiam a importação - você será avisado</li>
                    <li>Veículos e condutores não cadastrados serão criados automaticamente</li>
                  </ul>
                </div>
              </>
            )}

            {/* Estado: Processando */}
            {pageState === 'processing' && (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-gray-500">Analisando arquivo...</p>
              </div>
            )}

            {/* Estado: Preview */}
            {pageState === 'preview' && parsedData && (
              <DataPreview
                data={normalizedData}
                headers={parsedData.headers}
                validationResults={validationResults}
                onConfirm={handleConfirmImport}
                onCancel={handleCancel}
              />
            )}

            {/* Estado: Importando */}
            {pageState === 'importing' && importProgress && (
              <ImportProgress progress={importProgress} />
            )}

            {/* Estado: Completo */}
            {pageState === 'complete' && importResult && (
              <ImportResults result={importResult} onNewImport={handleNewImport} />
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}

