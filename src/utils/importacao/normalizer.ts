/**
 * Normaliza dados antes da validação e importação
 */

import { ESTADOS_BRASILEIROS } from '@/types/abastecimento';

/**
 * Normaliza valor booleano a partir de várias representações
 */
export function normalizeBoolean(value: any): boolean | null {
  if (value === null || value === undefined || value === '') return null;

  const strValue = String(value).trim().toLowerCase();

  // Valores true
  if (['sim', 's', 'true', '1', 'x', 'yes', 'y', 'verdadeiro', 'v'].includes(strValue)) {
    return true;
  }

  // Valores false
  if (['nao', 'não', 'n', 'false', '0', 'no', 'falso', 'f', ''].includes(strValue)) {
    return false;
  }

  return null;
}

/**
 * Normaliza valor numérico removendo símbolos e convertendo vírgula em ponto
 */
export function normalizeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  // Se já for número, retornar
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  let strValue = String(value).trim();

  // Remover símbolos de moeda e espaços
  strValue = strValue.replace(/R\$\s*/gi, '').replace(/\$/g, '').replace(/\s/g, '');

  if (!strValue) return null;

  // Detectar qual separador está mais à direita (provável decimal)
  const lastCommaIndex = strValue.lastIndexOf(',');
  const lastDotIndex = strValue.lastIndexOf('.');

  if (lastCommaIndex > lastDotIndex) {
    // Formato brasileiro (1.234,56): vírgula é decimal
    strValue = strValue.replace(/\./g, '').replace(',', '.');
  } else if (lastDotIndex > lastCommaIndex) {
    // Formato americano (1,234.56): ponto é decimal
    strValue = strValue.replace(/,/g, '');
  } else if (lastCommaIndex !== -1) {
    // Só tem vírgula: assumir decimal
    strValue = strValue.replace(',', '.');
  }
  // Se só tem ponto ou nenhum, parseFloat resolve

  // Remover caracteres não numéricos remanescentes exceto ponto e sinal negativo
  strValue = strValue.replace(/[^0-9.\-]/g, '');

  const num = parseFloat(strValue);
  return isNaN(num) ? null : num;
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
 * Normaliza data para formato ISO (YYYY-MM-DD)
 */
export function normalizeDate(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;

  // Se já for uma string ISO válida
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

  // Formato DD.MM.YY (com ponto e ano de 2 dígitos) - comum em Excel brasileiro
  const brFormatShortYear = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/;
  const matchShortYear = strValue.match(brFormatShortYear);

  if (matchShortYear) {
    const [, day, month, yearShort] = matchShortYear;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const yShort = parseInt(yearShort, 10);

    // Converter ano de 2 dígitos para 4 dígitos (assumir 2000-2099)
    const year = yShort < 50 ? 2000 + yShort : 1900 + yShort;

    // Validar ranges
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
 * Normaliza texto (trim e title case opcional)
 */
export function normalizeText(value: any, options?: { uppercase?: boolean; titleCase?: boolean }): string | null {
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
 * Normaliza placa de veículo
 */
export function normalizePlaca(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;

  // Remover espaços e traços, converter para uppercase
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s\-]/g, '');
}

/**
 * Normaliza UF (sigla de estado)
 */
export function normalizeUF(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;

  const uf = String(value).trim().toUpperCase();

  // Verificar se é uma sigla válida
  if (ESTADOS_BRASILEIROS.includes(uf as any)) {
    return uf;
  }

  return uf; // Retorna mesmo se inválido, validador irá reportar
}

/**
 * Normaliza status de entrega
 */
export function normalizeStatus(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;

  const status = String(value).trim().toUpperCase();

  // Mapeamentos comuns
  const mappings: Record<string, string> = {
    'PENDENTE': 'PENDENTE',
    'EM ROTA': 'EM ROTA',
    'EMROTA': 'EM ROTA',
    'EM_ROTA': 'EM ROTA',
    'CONCLUIDO': 'CONCLUIDO',
    'CONCLUÍDO': 'CONCLUIDO',
    'FINALIZADO': 'CONCLUIDO',
    'ENTREGUE': 'CONCLUIDO',
    'CANCELADO': 'CANCELADO',
    'CANCELADA': 'CANCELADO',
  };

  return mappings[status] || status;
}

const STATUS_MONTAGEM_VALIDOS = ['PENDENTE', 'EM_MONTAGEM', 'MONTAGEM_PARCIAL', 'CONCLUIDO'] as const;
export type StatusMontagemNormalized = (typeof STATUS_MONTAGEM_VALIDOS)[number] | null;

/**
 * Normaliza status de montagem (PENDENTE, EM_MONTAGEM, MONTAGEM_PARCIAL, CONCLUIDO)
 */
export function normalizeStatusMontagem(value: any): StatusMontagemNormalized {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '_');
  return STATUS_MONTAGEM_VALIDOS.includes(normalized as (typeof STATUS_MONTAGEM_VALIDOS)[number])
    ? (normalized as (typeof STATUS_MONTAGEM_VALIDOS)[number])
    : null;
}

/**
 * Normaliza produto de abastecimento
 */
export function normalizeProduto(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;

  const produto = String(value).trim().toLowerCase();

  // Mapeamentos comuns
  if (produto.includes('arla') || produto.includes('32')) {
    return 'Arla-32';
  }

  if (produto.includes('diesel') || produto.includes('s-10') || produto.includes('s10')) {
    return 'Diesel S-10';
  }

  return String(value).trim(); // Retorna original se não reconhecer
}

/**
 * Normaliza uma linha completa de dados baseado no tipo
 */
export type ImportType = 'veiculos' | 'entregas' | 'abastecimentos' | 'manutencoes' | 'motoristas' | 'montadores';

/**
 * Detecta se uma linha de entrega tem estrutura com coluna aglutinada (PV FOCO + NF)
 * e múltiplas colunas de montadores (MONTADOR 1-7)
 */
export function detectAdvancedEntregaStructure(headers: string[]): boolean {
  const normalizedHeaders = headers.map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
  );

  // Verificar se tem coluna aglutinada (PV FOCO sem NF separado)
  const hasPVFoco = normalizedHeaders.some((h) => h.includes('pv') || h.includes('foco'));
  const hasSeparateNF = normalizedHeaders.some((h) => h.includes('nf') || h.includes('nota_fiscal'));

  // Verificar se tem múltiplas colunas de montadores (MONTADOR 1-7)
  const montadorColumns = normalizedHeaders.filter((h) => h.includes('montador'));
  const hasMultipleMontadores = montadorColumns.length >= 3; // MONTADOR 1, 2, 3...

  // Se tem PV FOCO sem NF separado OU tem múltiplos montadores, usar parser avançado
  return (hasPVFoco && !hasSeparateNF) || hasMultipleMontadores;
}

export function normalizeRow(row: Record<string, any>, type: ImportType): Record<string, any> {
  const normalized: Record<string, any> = {};

  switch (type) {
    case 'veiculos':
      normalized.placa = normalizePlaca(row.placa);
      normalized.fabricante = normalizeText(row.fabricante, { titleCase: true });
      normalized.modelo = normalizeText(row.modelo);
      normalized.tipo = normalizeText(row.tipo, { titleCase: true });
      normalized.ano = normalizeNumber(row.ano);
      break;

    case 'entregas':
      // Campos obrigatórios do template simplificado
      normalized.nf = normalizeText(row.nf);
      normalized.cliente = normalizeText(row.cliente);
      normalized.uf = normalizeUF(row.uf);
      normalized.data_saida = normalizeDate(row.data_saida || row['data_saida']);
      normalized.motorista = normalizeText(row.motorista, { titleCase: true });
      normalized.tipo_transporte = normalizeText(row.tipo_transporte || row.tipo);
      normalized.valor = normalizeNumber(row.valor);
      normalized.status = normalizeStatus(row.status);
      // Campos opcionais (mantidos para compatibilidade com dados antigos)
      normalized.pv_foco = normalizeText(row.pv_foco);
      normalized.carro = normalizePlaca(row.carro);
      normalized.precisa_montagem = normalizeBoolean(row.precisa_montagem);
      normalized.data_montagem = normalizeDate(row.data_montagem);
      normalized.status_montagem = normalizeStatusMontagem(row.status_montagem);
      normalized.montador_1 = normalizeText(row.montador_1, { titleCase: true });
      normalized.montador_2 = normalizeText(row.montador_2, { titleCase: true });
      normalized.gastos_entrega = normalizeNumber(row.gastos_entrega);
      normalized.gastos_montagem = normalizeNumber(row.gastos_montagem);
      normalized.produtividade = normalizeNumber(row.produtividade);
      normalized.erros = normalizeText(row.erros);
      normalized.percentual_gastos = normalizeNumber(row.percentual_gastos);
      normalized.descricao_erros = normalizeText(row.descricao_erros);
      break;

    case 'abastecimentos':
      normalized.data = normalizeDate(row.data);
      normalized.veiculo = normalizePlaca(row.veiculo || row.carro);
      normalized.condutor = normalizeText(row.condutor, { titleCase: true });
      normalized.posto = normalizeText(row.posto || row.posto_manutencao || row['posto/manutencao']);
      let cidadeRaw = normalizeText(row.cidade, { titleCase: true });
      if (cidadeRaw && cidadeRaw.includes('-')) {
        cidadeRaw = cidadeRaw.split('-')[0].trim();
      }
      normalized.cidade = cidadeRaw;
      normalized.estado = normalizeUF(row.estado || row.uf);
      normalized.km_inicial = normalizeNumber(row.km_inicial || row['km_inicial']);
      normalized.litros = normalizeNumber(row.litros);
      normalized.produto = normalizeProduto(row.produto);
      normalized.valor_unitario = normalizeNumber(row.valor_unitario || row.valor_un || row['valor_un']);
      // IMPORTANTE: Usar valor_total do Excel diretamente, NÃO recalcular (litros * valor_unitario)
      // A planilha é a fonte da verdade financeira para importações em lote
      normalized.valor_total = normalizeNumber(row.valor_total || row['valor_total']);
      normalized.km_por_litro = normalizeNumber(row.km_por_litro);
      break;

    case 'manutencoes':
      normalized.data = normalizeDate(row.data);
      normalized.placa = normalizePlaca(row.placa);
      normalized.estabelecimento = normalizeText(row.estabelecimento);
      normalized.tipo_servico = normalizeText(row.tipo_servico);
      normalized.descricao_servico = normalizeText(row.descricao_servico);
      normalized.custo_total = normalizeNumber(row.custo_total);
      normalized.km_manutencao = normalizeNumber(row.km_manutencao);
      normalized.nota_fiscal = normalizeText(row.nota_fiscal);
      break;

    case 'motoristas':
      normalized.nome = normalizeText(row.nome, { titleCase: true });
      // Função será convertida para eh_motorista no importer
      normalized.funcao = normalizeText(row.funcao, { titleCase: true });
      normalized.numero_cnh = normalizeText(row.numero_cnh);
      normalized.categoria_cnh = normalizeText(row.categoria_cnh, { uppercase: true });
      normalized.data_vencimento_cnh = normalizeDate(row.data_vencimento_cnh);
      break;

    case 'montadores':
      normalized.nome = normalizeText(row.nome, { titleCase: true });
      break;
  }

  return normalized;
}

