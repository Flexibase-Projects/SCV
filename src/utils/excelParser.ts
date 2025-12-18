/**
 * Parser robusto de Excel para importação de entregas
 * Trata coluna aglutinada (PV FOCO + NF), mapeia montadores dinamicamente e valida com Zod
 */

import * as XLSX from 'xlsx';
import { z } from 'zod';
import { EntregaFormData, StatusEntrega, ESTADOS_BRASILEIROS } from '@/types/entrega';
import { normalizeNumber, normalizeDate, normalizeText, normalizeBoolean, normalizeStatus } from '@/utils/importacao/normalizer';

/**
 * Erro de parsing específico de uma linha
 */
export interface ParsingError {
  lineNumber: number;
  field?: string;
  message: string;
}

/**
 * Linha parseada com possíveis erros
 */
export interface ParsedEntregaRow {
  pv_foco: string | null;
  nf: string | null;
  valor: number | null;
  cliente: string | null;
  uf: string | null;
  data_saida: string | null;
  motorista: string | null;
  carro: string | null;
  tipo_transporte: string | null;
  status: StatusEntrega | null;
  precisa_montagem: boolean | null;
  data_montagem: string | null;
  montador_1: string | null;
  montador_2: string | null;
  gastos_entrega: number | null;
  gastos_montagem: number | null;
  produtividade: number | null;
  erros: string | null;
  percentual_gastos: number | null;
  descricao_erros: string | null;
  parsingErrors?: string[];
}

/**
 * Resultado do parsing
 */
export interface ParseResult {
  rows: ParsedEntregaRow[];
  errors: ParsingError[];
}

/**
 * Schema Zod para validação de EntregaFormData
 */
const entregaFormSchema = z.object({
  pv_foco: z.string().optional(),
  nf: z.string().min(1, 'NF é obrigatória'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').refine(
    (val) => ESTADOS_BRASILEIROS.includes(val as any),
    'UF inválida'
  ),
  data_saida: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  motorista: z.string().min(1, 'Motorista é obrigatório'),
  carro: z.string().optional(),
  tipo_transporte: z.string().optional(),
  status: z.enum(['PENDENTE', 'EM ROTA', 'CONCLUIDO', 'CANCELADO']),
  precisa_montagem: z.boolean(),
  data_montagem: z.string().optional(),
  montador_1: z.string().optional(),
  montador_2: z.string().optional(),
  gastos_entrega: z.number().min(0).optional(),
  gastos_montagem: z.number().min(0).optional(),
  produtividade: z.number().optional(),
  erros: z.string().optional(),
  percentual_gastos: z.number().min(0).max(100).optional(),
  descricao_erros: z.string().optional(),
});

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
 * Separa primeira coluna aglutinada (PV FOCO + NF)
 * Exemplo: "5134 DECLARAÇÃO" -> { pv_foco: "5134", nf: "DECLARAÇÃO" }
 */
function parseAglutinatedColumn(value: any): { pv_foco: string | null; nf: string | null; error?: string } {
  if (!value || value === '') {
    return { pv_foco: null, nf: null };
  }

  const strValue = String(value).trim();
  const regex = /^(\d+)\s+(.*)$/;
  const match = strValue.match(regex);

  if (!match) {
    return {
      pv_foco: null,
      nf: null,
      error: `Não foi possível separar PV FOCO e NF da coluna aglutinada: "${strValue}"`,
    };
  }

  return {
    pv_foco: match[1],
    nf: match[2].trim(),
  };
}

/**
 * Processa montadores das colunas MONTADOR 1-7
 * Retorna montador_1, montador_2 e montadores excedentes para descricao_erros
 */
function processMontadores(row: Record<string, any>): {
  montador_1: string | null;
  montador_2: string | null;
  excessMontadores: string[];
} {
  const montadores: string[] = [];

  // Ler colunas MONTADOR 1 até MONTADOR 7
  for (let i = 1; i <= 7; i++) {
    const key = `montador_${i}`;
    const value = row[key];
    if (value && String(value).trim() !== '') {
      montadores.push(String(value).trim());
    }
  }

  return {
    montador_1: montadores[0] || null,
    montador_2: montadores[1] || null,
    excessMontadores: montadores.slice(2), // Montadores 3, 4, 5, 6, 7
  };
}

/**
 * Calcula percentual de gastos se não estiver preenchido
 */
function calculatePercentualGastos(
  percentualGastos: number | null,
  gastosEntrega: number | null,
  gastosMontagem: number | null,
  valor: number | null
): number | null {
  // Se já tem valor, retornar
  if (percentualGastos !== null && percentualGastos !== undefined) {
    return percentualGastos;
  }

  // Se não tem valor ou valor é zero, não calcular
  if (!valor || valor === 0) {
    return null;
  }

  const totalGastos = (gastosEntrega || 0) + (gastosMontagem || 0);
  if (totalGastos === 0) {
    return null;
  }

  return (totalGastos / valor) * 100;
}

/**
 * Busca valor em row usando múltiplas variações de chaves possíveis
 */
function findValueByVariations(
  row: Record<string, any>,
  variations: string[]
): any {
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
      return row[variation];
    }
  }
  // Tentar busca case-insensitive
  const rowKeys = Object.keys(row);
  for (const variation of variations) {
    const found = rowKeys.find(k => k.toLowerCase() === variation.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') {
      return row[found];
    }
  }
  return null;
}

/**
 * Processa uma linha do Excel e retorna dados parseados
 */
function processRow(
  row: Record<string, any>,
  rawHeaders: string[],
  normalizedHeaders: string[],
  lineNumber: number,
  firstColumnIsAglutinated: boolean
): { row: ParsedEntregaRow; errors: ParsingError[] } {
  const errors: ParsingError[] = [];
  const parsedRow: ParsedEntregaRow = {
    pv_foco: null,
    nf: null,
    valor: null,
    cliente: null,
    uf: null,
    data_saida: null,
    motorista: null,
    carro: null,
    tipo_transporte: null,
    status: null,
    precisa_montagem: null,
    data_montagem: null,
    montador_1: null,
    montador_2: null,
    gastos_entrega: null,
    gastos_montagem: null,
    produtividade: null,
    erros: null,
    percentual_gastos: null,
    descricao_erros: null,
    parsingErrors: [],
  };

  // 1. Processar primeira coluna aglutinada (se detectada)
  if (firstColumnIsAglutinated && normalizedHeaders[0]) {
    const firstColumnValue = row[normalizedHeaders[0]];
    const parsed = parseAglutinatedColumn(firstColumnValue);
    parsedRow.pv_foco = parsed.pv_foco;
    parsedRow.nf = parsed.nf;
    if (parsed.error) {
      errors.push({
        lineNumber,
        field: rawHeaders[0] || 'Primeira coluna',
        message: parsed.error,
      });
      parsedRow.parsingErrors?.push(parsed.error);
    }
  } else {
    // Se não for aglutinada, ler campos separados com variações
    parsedRow.pv_foco = normalizeText(findValueByVariations(row, ['pv_foco', 'pv', 'pvfoco']));
    parsedRow.nf = normalizeText(findValueByVariations(row, ['nf', 'nota_fiscal', 'nota', 'notafiscal']));
  }

  // 2. Processar campos básicos com variações robustas
  parsedRow.valor = normalizeNumber(findValueByVariations(row, ['valor', 'valor_final', 'valor_total', 'total', 'vf', 'valorfinal']));
  parsedRow.cliente = normalizeText(findValueByVariations(row, ['cliente', 'nome_cliente', 'nome']));

  // UF: tentar múltiplas variações
  const ufValue = findValueByVariations(row, ['uf', 'estado', 'est', 'uf_destino']);
  parsedRow.uf = normalizeText(ufValue, { uppercase: true });

  // DATA SAÍDA: tentar múltiplas variações
  const dataSaidaValue = findValueByVariations(row, [
    'data_saida',
    'data_de_saida',
    'datasaida',
    'data_embarque',
    'dt_saida'
  ]);

  if (!dataSaidaValue) {
    const dataSaidaKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('data') &&
      (k.toLowerCase().includes('saida') || k.toLowerCase().includes('saída'))
    );
    parsedRow.data_saida = normalizeDate(dataSaidaKey ? row[dataSaidaKey] : null);
  } else {
    parsedRow.data_saida = normalizeDate(dataSaidaValue);
  }

  parsedRow.motorista = normalizeText(findValueByVariations(row, ['motorista', 'condutor', 'nome_motorista']), { titleCase: true });

  // CARRO: tentar múltiplas variações
  const carroValue = findValueByVariations(row, ['carro', 'veiculo', 'placa', 'veiculo_placa']);
  parsedRow.carro = normalizeText(carroValue);

  // TIPO TRANSPORTE: tentar múltiplas variações
  const tipoTransporteValue = findValueByVariations(row, [
    'tipo_transporte',
    'tipo_de_transporte',
    'tipo',
    'meio_transporte'
  ]);

  if (!tipoTransporteValue) {
    const tipoTransporteKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('tipo') &&
      k.toLowerCase().includes('transporte')
    );
    parsedRow.tipo_transporte = normalizeText(tipoTransporteKey ? row[tipoTransporteKey] : null);
  } else {
    parsedRow.tipo_transporte = normalizeText(tipoTransporteValue);
  }

  const statusValue = findValueByVariations(row, ['status', 'situacao', 'estado_entrega']);
  parsedRow.status = normalizeStatus(statusValue) as StatusEntrega | null;

  const precisaMontagemValue = findValueByVariations(row, ['precisa_montagem', 'precisa_de_montagem', 'montagem', 'requer_montagem']);
  parsedRow.precisa_montagem = normalizeBoolean(precisaMontagemValue);

  // DATA MONTAGEM: tentar múltiplas variações
  const dataMontagemValue = findValueByVariations(row, [
    'data_montagem',
    'data_da_montagem',
    'datamontagem',
    'dt_montagem'
  ]);

  if (!dataMontagemValue) {
    const dataMontagemKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('data') &&
      k.toLowerCase().includes('montagem')
    );
    parsedRow.data_montagem = normalizeDate(dataMontagemKey ? row[dataMontagemKey] : null);
  } else {
    parsedRow.data_montagem = normalizeDate(dataMontagemValue);
  }

  // 3. Processar montadores (MONTADOR 1-7)
  const montadoresData = processMontadores(row);
  parsedRow.montador_1 = normalizeText(montadoresData.montador_1, { titleCase: true });
  parsedRow.montador_2 = normalizeText(montadoresData.montador_2, { titleCase: true });

  // Adicionar montadores excedentes ao descricao_erros
  if (montadoresData.excessMontadores.length > 0) {
    const excessText = `Montadores adicionais: ${montadoresData.excessMontadores.join(', ')}`;
    const existingDescricao = parsedRow.descricao_erros || '';
    parsedRow.descricao_erros = existingDescricao
      ? `${existingDescricao}. ${excessText}`
      : excessText;
  }

  // 4. Processar gastos e produtividade com variações
  parsedRow.gastos_entrega = normalizeNumber(findValueByVariations(row, [
    'gastos_entrega',
    'gasto_entrega',
    'gastos_com_entrega',
    'valor_entrega'
  ]));
  parsedRow.gastos_montagem = normalizeNumber(findValueByVariations(row, [
    'gastos_montagem',
    'gasto_montagem',
    'gastos_com_montagem',
    'valor_montagem'
  ]));
  parsedRow.produtividade = normalizeNumber(findValueByVariations(row, ['produtividade', 'prod']));

  // ERROS: tentar múltiplas variações
  parsedRow.erros = normalizeText(findValueByVariations(row, ['erros', 'erro', 'problema']));

  // 5. Calcular % GASTOS se não estiver preenchido
  // Usar variações específicas de porcentagem, ignorando "gastos" genérico que pode ser monetário
  const percentualGastosValue = findValueByVariations(row, [
    'percentual_gastos',
    'porcentagem_gastos',
    '%_gastos',
    'perc_gastos'
  ]);

  parsedRow.percentual_gastos = calculatePercentualGastos(
    normalizeNumber(percentualGastosValue),
    parsedRow.gastos_entrega,
    parsedRow.gastos_montagem,
    parsedRow.valor
  );

  // 6. Processar descrição de erros (se não foi preenchida pelos montadores excedentes)
  if (!parsedRow.descricao_erros) {
    parsedRow.descricao_erros = normalizeText(
      row.descricao_dos_erros || row.descricao_erros || row.descricaoerros
    );
  }

  return { row: parsedRow, errors };
}

/**
 * Detecta se a primeira coluna é aglutinada (PV FOCO + NF)
 */
function detectAglutinatedColumn(headers: string[]): boolean {
  if (headers.length === 0) return false;

  const firstHeader = headers[0].toLowerCase();
  // Verificar se o header contém "pv" ou "foco" mas não tem coluna separada "nf"
  const hasPVFoco = firstHeader.includes('pv') || firstHeader.includes('foco');
  const hasSeparateNF = headers.some((h) => h.toLowerCase().includes('nf') || h.toLowerCase().includes('nota'));

  // Se tem PV FOCO mas não tem NF separado, provavelmente é aglutinado
  return hasPVFoco && !hasSeparateNF;
}

/**
 * Parse arquivo Excel de entregas
 */
export async function parseExcelEntregas(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Desabilitar cellDates para evitar problemas de timezone automáticos do XLSX
        const workbook = XLSX.read(data, { type: 'binary', cellDates: false });

        // Pegar primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Obter range para processamento linha a linha (mais controle sobre cell.w)
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        if (range.e.r === 0) {
          reject(new Error('Arquivo Excel vazio ou sem dados'));
          return;
        }

        // 1. Extrair Headers
        const rawHeaders: string[] = [];
        const normalizedHeaders: string[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
          const val = cell?.w || cell?.v || '';
          rawHeaders.push(String(val));
          normalizedHeaders.push(normalizeHeader(String(val)));
        }

        // 2. Processar Linhas
        const rowsCount = range.e.r;
        const rows: ParsedEntregaRow[] = [];
        const allErrors: ParsingError[] = [];
        const firstColumnIsAglutinated = detectAglutinatedColumn(rawHeaders);

        for (let r = 1; r <= rowsCount; r++) {
          const row: Record<string, any> = {};
          let hasAnyValue = false;

          normalizedHeaders.forEach((header, c) => {
            const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
            // Priorizar 'w' (valor formatado) para strings/números formatados
            // Usar 'v' se 'w' não existir
            let value = cell?.w || cell?.v || null;

            if (value !== null && value !== '') {
              hasAnyValue = true;
            }

            // Normalização de Datas Seriais do Excel se não vieram como 'w'
            if (typeof value === 'number' && value > 10000 && value < 100000) {
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
              if (!isNaN(date.getTime())) {
                value = formatDateLocal(date);
              }
            }

            // Aliases para Montadores
            if (header.includes('montador')) {
              const match = header.match(/montador[_\s]*(\d+)/);
              if (match) {
                row[`montador_${match[1]}`] = value;
              }
            }

            row[header] = value;
          });

          if (!hasAnyValue) continue;

          // Processar linha com as novas regras flexíveis
          const { row: parsedRow, errors } = processRow(
            row,
            rawHeaders,
            normalizedHeaders,
            r + 1,
            firstColumnIsAglutinated
          );

          rows.push(parsedRow);
          allErrors.push(...errors);
        }

        resolve({
          rows,
          errors: allErrors,
        });
      } catch (error) {
        reject(new Error(`Erro ao processar Excel: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
}

