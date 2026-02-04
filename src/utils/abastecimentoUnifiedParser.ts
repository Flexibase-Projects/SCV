/**
 * Parser UNIFICADO de Excel para importação de abastecimentos
 * Aplica regras de sanitização específicas linha a linha
 * 
 * Regras de Sanitização:
 * - VALOR UN. / VALOR TOTAL: Remove "R$", espaços, pontos de milhar, converte vírgula→ponto
 * - LITROS: Converte vírgula→ponto (quantidade, sem símbolo R$)
 * - CIDADE: Extrai string ANTES do hífen (ex: "São Paulo - SP" → "São Paulo")
 * - POSTO: Extrai string DEPOIS do hífen, se existir (ex: "36687900 - POSTO FORMOSA" → "POSTO FORMOSA")
 * - DATA: Converte DD/MM/AAAA para ISO (YYYY-MM-DD)
 * - KM RODADO e KM PERCORRIDO/L: Ignorados (não salva no banco)
 */

import * as XLSX from 'xlsx';
import { ESTADOS_BRASILEIROS } from '@/types/abastecimento';
import { loadCache, findVeiculoId } from '@/utils/importacao/importer';

/**
 * Erro de parsing específico de uma linha
 */
export interface UnifiedParsingError {
    lineNumber: number;
    field?: string;
    message: string;
}

/**
 * Linha parseada com possíveis erros
 */
export interface UnifiedParsedRow {
    data: string | null;
    veiculo: string | null;
    condutor: string | null;
    posto: string | null;
    cidade: string | null;
    uf: string | null;
    km_inicial: number | null;
    litros: number | null;
    produto: string | null;
    valor_unitario: number | null;
    valor_total: number | null;
    parsingErrors: string[];
    lineNumber: number;
}

/**
 * Resultado do parsing unificado
 */
export interface UnifiedParseResult {
    rows: UnifiedParsedRow[];
    errors: UnifiedParsingError[];
    totalRows: number;
    validRows: number;
    errorRows: number;
}

// ============================================================================
// FUNÇÕES DE SANITIZAÇÃO ESPECÍFICAS
// ============================================================================

/**
 * Sanitiza valores monetários (VALOR UN., VALOR TOTAL)
 * Entrada: "R$ 1.644,30"
 * Processo:
 *   1. Remove "R$" e espaços → "1.644,30"
 *   2. Remove pontos de milhar → "1644,30"
 *   3. Substitui vírgula por ponto → "1644.30"
 *   4. Converte para float → 1644.30
 */
function sanitizeMonetaryValue(value: any): number | null {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:sanitizeMonetaryValue:ENTRY',message:'sanitizeMonetaryValue entrada',data:{value,valueType:typeof value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    if (value === null || value === undefined || value === '') return null;

    // Se já for número, retornar
    if (typeof value === 'number') {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:sanitizeMonetaryValue:NUMBER_RETURN',message:'sanitizeMonetaryValue retornou número',data:{value,returnValue:isNaN(value)?null:value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        return isNaN(value) ? null : value;
    }

    let strValue = String(value).trim();
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:sanitizeMonetaryValue:STRING_VALUE',message:'sanitizeMonetaryValue strValue inicial',data:{value,strValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    // 1. Remove "R$" e espaços extras
    strValue = strValue.replace(/R\$\s*/gi, '').trim();

    // 2. Detectar formato (brasileiro vs americano)
    // Formato brasileiro: "1.644,30" (ponto = milhar, vírgula = decimal)
    // Formato americano: "1,644.30" (vírgula = milhar, ponto = decimal)

    const hasComma = strValue.includes(',');
    const hasDot = strValue.includes('.');

    if (hasComma && hasDot) {
        // Tem ambos: verificar qual está mais à direita (é o decimal)
        const lastCommaIndex = strValue.lastIndexOf(',');
        const lastDotIndex = strValue.lastIndexOf('.');
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:sanitizeMonetaryValue:FORMAT_DETECTION',message:'Detecção de formato com vírgula e ponto',data:{strValue,lastCommaIndex,lastDotIndex,commaIsDecimal:lastCommaIndex>lastDotIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        
        if (lastCommaIndex > lastDotIndex) {
            // Vírgula está mais à direita = formato brasileiro (1.644,30)
            // Remove todos os pontos (separadores de milhar)
            strValue = strValue.replace(/\./g, '');
            // Substitui vírgula por ponto (decimal)
            strValue = strValue.replace(',', '.');
            // #region agent log
            fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:sanitizeMonetaryValue:BR_FORMAT',message:'Aplicado formato brasileiro',data:{strValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
            // #endregion
        } else {
            // Ponto está mais à direita = formato americano (1,644.30)
            // Remove todas as vírgulas (separadores de milhar)
            strValue = strValue.replace(/,/g, '');
            // #region agent log
            fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:sanitizeMonetaryValue:US_FORMAT',message:'Aplicado formato americano',data:{strValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
            // #endregion
            // Ponto já é decimal, manter
        }
    } else if (hasComma) {
        // Só tem vírgula: assumir formato brasileiro (decimal)
        strValue = strValue.replace(',', '.');
    } else if (hasDot) {
        // Se tem ponto mas não tem vírgula, verificar se é milhar ou decimal
        // Se tem mais de um ponto, são separadores de milhar
        const dotCount = (strValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            // Múltiplos pontos = separadores de milhar, remover todos
            strValue = strValue.replace(/\./g, '');
        } else {
            // Um único ponto - verificar contexto
            // Se tem 3 dígitos após o ponto, provavelmente é milhar (ex: 1.900)
            // Se tem 1-2 dígitos após o ponto, provavelmente é decimal (ex: 1.5 ou 1.50)
            const parts = strValue.split('.');
            if (parts.length === 2) {
                const afterDot = parts[1];
                if (afterDot.length === 3 && parts[0].length <= 3) {
                    // Formato "1.900" - é milhar, remover o ponto
                    strValue = strValue.replace(/\./g, '');
                }
                // Caso contrário, manter o ponto como decimal
            }
        }
    }

    // Remover caracteres não numéricos exceto ponto e sinal negativo
    strValue = strValue.replace(/[^0-9.\-]/g, '');

    const num = parseFloat(strValue);
    return isNaN(num) ? null : num;
}

/**
 * Sanitiza quantidade (LITROS)
 * Trata vírgula como decimal (sem símbolo R$)
 * Entrada: "150,50" → 150.50
 */
function sanitizeQuantity(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;

    // Se já for número, retornar
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }

    let strValue = String(value).trim();

    // Detectar formato brasileiro
    if (/,\d{1,2}$/.test(strValue)) {
        // Remove pontos de milhar (se existirem)
        strValue = strValue.replace(/\./g, '');
        // Substitui vírgula por ponto
        strValue = strValue.replace(',', '.');
    }

    // Remover caracteres não numéricos exceto ponto e sinal negativo
    strValue = strValue.replace(/[^0-9.\-]/g, '');

    const num = parseFloat(strValue);
    return isNaN(num) ? null : num;
}

/**
 * Sanitiza CIDADE
 * Extrai string ANTES do hífen
 * Entrada: "São Paulo - SP" → "São Paulo"
 */
function sanitizeCidade(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    let strValue = String(value).trim();

    // Se tiver hífen, pegar apenas a parte antes
    if (strValue.includes('-')) {
        strValue = strValue.split('-')[0].trim();
    }

    // Title case
    strValue = strValue
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());

    return strValue || null;
}

/**
 * Sanitiza POSTO
 * Se tiver hífen, extrai string DEPOIS do hífen
 * Caso 1: "36687900 - POSTO FORMOSA" → "POSTO FORMOSA"
 * Caso 2: "POSTO FORMOSA" → "POSTO FORMOSA" (sem hífen, mantém original)
 */
function sanitizePosto(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    let strValue = String(value).trim();

    // Se tiver hífen, pegar apenas a parte depois
    if (strValue.includes('-')) {
        const parts = strValue.split('-');
        if (parts.length > 1) {
            strValue = parts.slice(1).join('-').trim(); // Pega tudo depois do primeiro hífen
        }
    }

    return strValue || null;
}

/**
 * Converte DATA de DD/MM/AAAA para ISO (YYYY-MM-DD)
 */
function sanitizeDate(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    // Se já for uma string ISO válida (YYYY-MM-DD)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.split('T')[0];
    }

    // Se for Date object
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return formatDateLocal(value);
    }

    const strValue = String(value).trim();

    // Formato DD/MM/YYYY ou DD-MM-YYYY
    const brFormat = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = strValue.match(brFormat);

    if (match) {
        const [, day, month, year] = match;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);

        // Validar ranges
        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Formato DD.MM.YY (com ponto e ano de 2 dígitos)
    const brFormatShortYear = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/;
    const matchShortYear = strValue.match(brFormatShortYear);

    if (matchShortYear) {
        const [, day, month, yearShort] = matchShortYear;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const yShort = parseInt(yearShort, 10);
        const year = yShort < 50 ? 2000 + yShort : 1900 + yShort;

        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && year >= 1900 && year <= 2100) {
            return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    // Tentar parse genérico
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
        return formatDateLocal(date);
    }

    return null;
}

/**
 * Formata data para YYYY-MM-DD usando métodos locais (sem conversão de timezone)
 */
function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Normaliza UF (sigla de estado)
 */
function sanitizeUF(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    const uf = String(value).trim().toUpperCase();

    // Verificar se é uma sigla válida (2 caracteres)
    if (uf.length === 2 && ESTADOS_BRASILEIROS.includes(uf as any)) {
        return uf;
    }

    // Se for maior que 2 caracteres, pode ser que veio junto com cidade
    // Tentar extrair os últimos 2 caracteres se parecerem uma UF
    if (uf.length > 2) {
        const lastTwo = uf.slice(-2);
        if (ESTADOS_BRASILEIROS.includes(lastTwo as any)) {
            return lastTwo;
        }
    }

    return uf.length === 2 ? uf : null;
}

/**
 * Normaliza texto genérico
 */
function sanitizeText(value: any, options?: { uppercase?: boolean; titleCase?: boolean }): string | null {
    if (value === null || value === undefined || value === '') return null;

    let strValue = String(value).trim();

    if (options?.uppercase) {
        strValue = strValue.toUpperCase();
    } else if (options?.titleCase) {
        strValue = strValue
            .toLowerCase()
            .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
    }

    return strValue || null;
}

/**
 * Normaliza produto de abastecimento
 */
function sanitizeProduto(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    const produto = String(value).trim().toLowerCase();

    if (produto.includes('arla') || produto.includes('32')) {
        return 'Arla-32';
    }

    if (produto.includes('diesel') || produto.includes('s-10') || produto.includes('s10')) {
        return 'Diesel S-10';
    }

    return String(value).trim();
}

/**
 * Normaliza header removendo acentos e espaços
 */
function normalizeHeader(header: string): string {
    if (!header) return '';
    return header
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

/**
 * Busca valor em row usando múltiplas variações de chaves possíveis
 */
function findValueByVariations(row: Record<string, any>, variations: string[]): any {
    const normalizedVariations = variations.map((v) => normalizeHeader(v));

    for (const normalizedVariation of normalizedVariations) {
        if (
            row[normalizedVariation] !== undefined &&
            row[normalizedVariation] !== null &&
            row[normalizedVariation] !== ''
        ) {
            return row[normalizedVariation];
        }
    }

    // Tentar busca case-insensitive nas chaves existentes
    const rowKeys = Object.keys(row);
    for (const normalizedVariation of normalizedVariations) {
        const found = rowKeys.find((k) => k.toLowerCase() === normalizedVariation.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') {
            return row[found];
        }
    }

    return null;
}

// ============================================================================
// PROCESSAMENTO DE LINHA
// ============================================================================

/**
 * Processa uma linha do Excel aplicando todas as regras de sanitização
 */
function processRow(
    row: Record<string, any>,
    lineNumber: number,
    veiculoCache: Awaited<ReturnType<typeof loadCache>> | null
): { parsedRow: UnifiedParsedRow; errors: UnifiedParsingError[] } {
    const errors: UnifiedParsingError[] = [];
    const parsingErrors: string[] = [];

    const parsedRow: UnifiedParsedRow = {
        data: null,
        veiculo: null,
        condutor: null,
        posto: null,
        cidade: null,
        uf: null,
        km_inicial: null,
        litros: null,
        produto: null,
        valor_unitario: null,
        valor_total: null,
        parsingErrors: [],
        lineNumber,
    };

    // DATA
    const dataValue = findValueByVariations(row, ['data']);
    parsedRow.data = sanitizeDate(dataValue);
    if (!parsedRow.data) {
        errors.push({ lineNumber, field: 'data', message: 'Data não encontrada ou inválida' });
        parsingErrors.push('Data inválida');
    }

    // VEÍCULO
    const veiculoValue = findValueByVariations(row, ['veiculo', 'veículo', 'carro', 'placa']);
    parsedRow.veiculo = sanitizeText(veiculoValue);
    if (!parsedRow.veiculo) {
        errors.push({ lineNumber, field: 'veiculo', message: 'Veículo é obrigatório' });
        parsingErrors.push('Veículo é obrigatório');
    } else if (veiculoCache) {
        // Validar se veículo existe no banco
        const veiculoId = findVeiculoId(parsedRow.veiculo, veiculoCache);
        if (!veiculoId) {
            errors.push({
                lineNumber,
                field: 'veiculo',
                message: `Veículo não cadastrado: ${parsedRow.veiculo}`,
            });
            parsingErrors.push(`Veículo não cadastrado: ${parsedRow.veiculo}`);
        }
    }

    // CONDUTOR
    const condutorValue = findValueByVariations(row, ['condutor', 'motorista']);
    parsedRow.condutor = sanitizeText(condutorValue, { titleCase: true });
    if (!parsedRow.condutor) {
        errors.push({ lineNumber, field: 'condutor', message: 'Condutor é obrigatório' });
        parsingErrors.push('Condutor é obrigatório');
    }

    // POSTO (regra especial: depois do hífen)
    const postoValue = findValueByVariations(row, ['posto', 'posto_manutencao', 'posto/manutencao']);
    parsedRow.posto = sanitizePosto(postoValue);
    if (!parsedRow.posto) {
        errors.push({ lineNumber, field: 'posto', message: 'Posto é obrigatório' });
        parsingErrors.push('Posto é obrigatório');
    }

    // CIDADE (regra especial: antes do hífen)
    const cidadeValue = findValueByVariations(row, ['cidade']);
    parsedRow.cidade = sanitizeCidade(cidadeValue);
    if (!parsedRow.cidade) {
        errors.push({ lineNumber, field: 'cidade', message: 'Cidade é obrigatória' });
        parsingErrors.push('Cidade é obrigatória');
    }

    // UF
    const ufValue = findValueByVariations(row, ['uf', 'estado']);
    parsedRow.uf = sanitizeUF(ufValue);
    if (!parsedRow.uf || parsedRow.uf.length !== 2) {
        errors.push({ lineNumber, field: 'uf', message: 'UF inválida' });
        parsingErrors.push('UF inválida');
    }

    // KM INICIAL
    const kmInicialValue = findValueByVariations(row, ['km_inicial', 'kminicial', 'km']);
    parsedRow.km_inicial = sanitizeQuantity(kmInicialValue);
    if (parsedRow.km_inicial === null) {
        errors.push({ lineNumber, field: 'km_inicial', message: 'KM inicial é obrigatório' });
        parsingErrors.push('KM inicial é obrigatório');
    }

    // LITROS (quantidade, não monetário)
    const litrosValue = findValueByVariations(row, ['litros', 'quantidade']);
    parsedRow.litros = sanitizeQuantity(litrosValue);
    if (parsedRow.litros === null || parsedRow.litros <= 0) {
        errors.push({ lineNumber, field: 'litros', message: 'Litros deve ser maior que 0' });
        parsingErrors.push('Litros deve ser maior que 0');
    }

    // PRODUTO
    const produtoValue = findValueByVariations(row, ['produto', 'combustivel', 'combustível']);
    parsedRow.produto = sanitizeProduto(produtoValue);
    if (!parsedRow.produto) {
        errors.push({ lineNumber, field: 'produto', message: 'Produto é obrigatório' });
        parsingErrors.push('Produto é obrigatório');
    }

    // VALOR UNITÁRIO (monetário)
    const valorUnitarioValue = findValueByVariations(row, [
        'valor_unitario',
        'valorun',
        'valor_un',
        'preco_unitario',
    ]);
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:processRow:valorUnitarioValue',message:'Valor unitário bruto antes de sanitizar',data:{lineNumber,valorUnitarioValue,valorUnitarioType:typeof valorUnitarioValue,valorUnitarioString:String(valorUnitarioValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    parsedRow.valor_unitario = sanitizeMonetaryValue(valorUnitarioValue);
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:processRow:valorUnitarioSanitized',message:'Valor unitário após sanitizar',data:{lineNumber,valorUnitarioSanitized:parsedRow.valor_unitario,valorUnitarioType:typeof parsedRow.valor_unitario},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    if (parsedRow.valor_unitario === null) {
        errors.push({ lineNumber, field: 'valor_unitario', message: 'Valor unitário é obrigatório' });
        parsingErrors.push('Valor unitário é obrigatório');
    }

    // VALOR TOTAL (monetário) - NÃO RECALCULAR, usar valor do Excel
    const valorTotalValue = findValueByVariations(row, ['valor_total', 'valortotal', 'total']);
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:processRow:valorTotalValue',message:'Valor total bruto antes de sanitizar',data:{lineNumber,valorTotalValue,valorTotalType:typeof valorTotalValue,valorTotalString:String(valorTotalValue)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    parsedRow.valor_total = sanitizeMonetaryValue(valorTotalValue);
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:processRow:valorTotalSanitized',message:'Valor total após sanitizar',data:{lineNumber,valorTotalSanitized:parsedRow.valor_total,valorTotalType:typeof parsedRow.valor_total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    if (parsedRow.valor_total === null) {
        errors.push({ lineNumber, field: 'valor_total', message: 'Valor total é obrigatório' });
        parsingErrors.push('Valor total é obrigatório');
    }

    // NOTA: KM RODADO e KM PERCORRIDO/L são IGNORADOS (sistema calcula automaticamente)

    parsedRow.parsingErrors = parsingErrors;

    return { parsedRow, errors };
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE PARSING
// ============================================================================

/**
 * Parse arquivo Excel de abastecimentos com regras de sanitização unificadas
 */
export async function parseUnifiedExcel(file: File): Promise<UnifiedParseResult> {
    return new Promise(async (resolve, reject) => {
        try {
            // Carregar cache de veículos para validação
            const cache = await loadCache();

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    // Desabilitar cellDates para evitar conversão automática de valores monetários em datas
                    const workbook = XLSX.read(data, { type: 'binary', cellDates: false });

                    // Pegar primeira planilha
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Obter range da planilha
                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                    
                    // Processar headers (primeira linha)
                    const rawHeaders: string[] = [];
                    const normalizedHeaders: string[] = [];
                    
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                        const cell = worksheet[cellAddress];
                        const headerValue = cell?.w || cell?.v || '';
                        rawHeaders.push(String(headerValue));
                        normalizedHeaders.push(normalizeHeader(String(headerValue)));
                    }

                    // Processar linhas
                    const rows: UnifiedParsedRow[] = [];
                    const allErrors: UnifiedParsingError[] = [];

                    for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex++) {
                        // Criar objeto row com valores mapeados
                        const row: Record<string, any> = {};
                        let hasAnyValue = false;

                        normalizedHeaders.forEach((header, colIndex) => {
                            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                            const cell = worksheet[cellAddress];
                            
                            // Priorizar valor formatado (w) se existir, senão usar valor bruto (v)
                            let value: any = null;
                            if (cell) {
                                // w = valor formatado como string (ex: "R$ 1.900,00")
                                // v = valor bruto (número, data, etc)
                                // #region agent log
                                if (header.includes('valor') && rowIndex <= 5) {
                                    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:parseUnifiedExcel:CELL_READ',message:'Lendo célula do Excel',data:{rowIndex,colIndex,header,cellAddress,cellW:cell.w,cellV:cell.v,cellT:cell.t,cellZ:cell.z,cellF:cell.f},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
                                }
                                // #endregion
                                value = cell.w || cell.v || null;
                                // #region agent log
                                if (header.includes('valor') && rowIndex <= 5) {
                                    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'abastecimentoUnifiedParser.ts:parseUnifiedExcel:CELL_VALUE',message:'Valor escolhido da célula',data:{rowIndex,header,value,valueType:typeof value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
                                }
                                // #endregion
                                
                                if (value !== null && value !== undefined && value !== '') {
                                    hasAnyValue = true;
                                }
                            }

                            row[header] = value;
                        });

                        // Pular linhas completamente vazias
                        if (!hasAnyValue) {
                            continue;
                        }

                        // Processar linha com sanitização
                        const { parsedRow, errors } = processRow(row, rowIndex + 1, cache);

                        rows.push(parsedRow);
                        allErrors.push(...errors);
                    }

                    // Calcular estatísticas
                    const errorRows = rows.filter((r) => r.parsingErrors.length > 0).length;

                    resolve({
                        rows,
                        errors: allErrors,
                        totalRows: rows.length,
                        validRows: rows.length - errorRows,
                        errorRows,
                    });
                } catch (error) {
                    reject(new Error(`Erro ao processar Excel: ${(error as Error).message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            reject(new Error(`Erro ao carregar cache: ${(error as Error).message}`));
        }
    });
}
