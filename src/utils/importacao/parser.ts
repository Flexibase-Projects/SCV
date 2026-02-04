import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

/**
 * Normaliza headers removendo acentos, espaços extras e convertendo para lowercase
 */
function normalizeHeader(header: string): string {
  if (!header) return '';
  
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/[^a-z0-9_]/g, ''); // Remove caracteres especiais
}

/**
 * Mapeia headers do Excel para campos do sistema
 */
const HEADER_MAPPINGS: Record<string, string> = {
  // Veículos
  'placa': 'placa',
  'fabricante': 'fabricante',
  'modelo': 'modelo',
  'tipo': 'tipo',
  'ano': 'ano',
  
  // Entregas
  'pv_foco': 'pv_foco',
  'pvfoco': 'pv_foco',
  'pv': 'pv_foco',
  'nf': 'nf',
  'nota_fiscal': 'nf',
  'valor': 'valor',
  'cliente': 'cliente',
  'uf': 'uf',
  'estado': 'uf',
  'data_de_saida': 'data_saida',
  'data_saida': 'data_saida',
  'datasaida': 'data_saida',
  'motorista': 'motorista',
  'carro': 'carro',
  'veiculo': 'carro',
  // 'tipo': 'tipo_transporte',
  'tipo_transporte': 'tipo_transporte',
  'tipotransporte': 'tipo_transporte',
  'status': 'status',
  'precisa_de_montagem': 'precisa_montagem',
  'precisa_montagem': 'precisa_montagem',
  'precisamontagem': 'precisa_montagem',
  'data_da_montagem': 'data_montagem',
  'data_montagem': 'data_montagem',
  'datamontagem': 'data_montagem',
  'montador_1': 'montador_1',
  'montador1': 'montador_1',
  'montador_2': 'montador_2',
  'montador2': 'montador_2',
  'gastos_com_entrega': 'gastos_entrega',
  'gastos_entrega': 'gastos_entrega',
  'gastosentrega': 'gastos_entrega',
  'gastos_com_montagem': 'gastos_montagem',
  'gastos_montagem': 'gastos_montagem',
  'gastosmontagem': 'gastos_montagem',
  'produtividade': 'produtividade',
  'erros': 'erros',
  'gastos': 'percentual_gastos',
  'percentual_gastos': 'percentual_gastos',
  'descricao_dos_erros': 'descricao_erros',
  'descricao_erros': 'descricao_erros',
  'descricaoerros': 'descricao_erros',
  
  // Abastecimento
  'data': 'data',
  // 'veiculo': 'veiculo',
  'condutor': 'condutor',
  'posto': 'posto',
  'posto_manutencao': 'posto',
  'posto/manutencao': 'posto',
  'cidade': 'cidade',
  // 'uf': 'estado',
  'km_inicial': 'km_inicial',
  'kminicial': 'km_inicial',
  'km_rodado': 'km_rodado',
  'kmrodado': 'km_rodado',
  'km_percorridol': 'km_por_litro',
  'km_percorrido_l': 'km_por_litro',
  'km_por_litro': 'km_por_litro',
  'kmperlitro': 'km_por_litro',
  'litros': 'litros',
  'produto': 'produto',
  'valor_un': 'valor_unitario',
  'valorun': 'valor_unitario',
  'valor_unitario': 'valor_unitario',
  'valor_total': 'valor_total',
  'valortotal': 'valor_total',
  
  // Manutenção
  'estabelecimento': 'estabelecimento',
  'tipo_de_servico': 'tipo_servico',
  'tiposervico': 'tipo_servico',
  'tipo_servico': 'tipo_servico',
  'descricao_do_servico': 'descricao_servico',
  'descricaoservico': 'descricao_servico',
  'descricao_servico': 'descricao_servico',
  'custo_total_r': 'custo_total',
  'custo_total': 'custo_total',
  'custototal': 'custo_total',
  'km_manutencao': 'km_manutencao',
  'kmmanutencao': 'km_manutencao',
  // 'nota_fiscal': 'nota_fiscal',
  'notafiscal': 'nota_fiscal',
  
  // Motoristas
  'nome': 'nome',
  'funcao': 'funcao',
  'numero_cnh': 'numero_cnh',
  'numerocnh': 'numero_cnh',
  'categoria_cnh': 'categoria_cnh',
  'categoriacnh': 'categoria_cnh',
  'data_vencimento_cnh': 'data_vencimento_cnh',
  'datavencimentocnh': 'data_vencimento_cnh',
  'ativo': 'ativo',
};

/**
 * Converte header normalizado para campo do sistema
 */
function mapHeader(normalizedHeader: string): string {
  return HEADER_MAPPINGS[normalizedHeader] || normalizedHeader;
}

/**
 * Processa headers mapeando para campos do sistema
 */
function processHeaders(rawHeaders: string[]): { original: string[]; mapped: string[] } {
  const normalized = rawHeaders.map(normalizeHeader);
  const mapped = normalized.map(mapHeader);
  return { original: rawHeaders, mapped };
}

/**
 * Parse arquivo CSV
 */
export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('Arquivo CSV vazio ou inválido'));
            return;
          }

          const rawHeaders = results.data[0] as string[];
          const { mapped: headers } = processHeaders(rawHeaders);
          
          const rows: Record<string, any>[] = [];
          
          for (let i = 1; i < results.data.length; i++) {
            const rowData = results.data[i] as string[];
            
            // Pular linhas completamente vazias
            if (rowData.every(cell => !cell || cell.trim() === '')) continue;
            
            const row: Record<string, any> = {};
            headers.forEach((header, idx) => {
              row[header] = rowData[idx] || null;
            });
            rows.push(row);
          }

          resolve({
            headers,
            rows,
            totalRows: rows.length,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao processar CSV: ${error.message}`));
      },
      encoding: 'UTF-8',
      skipEmptyLines: false,
    });
  });
}

/**
 * Parse arquivo Excel (.xlsx, .xls)
 */
export function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // Pegar primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON (array de arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Arquivo Excel vazio ou inválido'));
          return;
        }

        const rawHeaders = jsonData[0].map(String);
        const { mapped: headers } = processHeaders(rawHeaders);
        
        const rows: Record<string, any>[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const rowData = jsonData[i];
          
          // Pular linhas completamente vazias
          if (rowData.every(cell => cell === '' || cell === null || cell === undefined)) continue;
          
          const row: Record<string, any> = {};
          headers.forEach((header, idx) => {
            let value = rowData[idx];
            
            // Se for uma data do Excel, converter para string
            if (value instanceof Date) {
              value = value.toISOString().split('T')[0];
            }
            
            row[header] = value ?? null;
          });
          rows.push(row);
        }

        resolve({
          headers,
          rows,
          totalRows: rows.length,
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

/**
 * Detecta tipo de arquivo e faz o parse apropriado
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    default:
      throw new Error(`Formato de arquivo não suportado: ${extension}. Use CSV ou Excel (.xlsx, .xls)`);
  }
}

