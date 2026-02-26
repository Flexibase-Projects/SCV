/**
 * Lógica de importação em lote com auto-criação de registros faltantes
 */

import { supabase } from '@/integrations/supabase/client';
import { atualizarKmAtualVeiculo } from '@/hooks/useAbastecimentos';
import { ValidationWarning } from './validators';
import { Veiculo } from '@/types/veiculo';

export interface ImportProgress {
  total: number;
  current: number;
  created: number;
  updated: number;
  autoCreated: number;
  phase: 'preparing' | 'creating_dependencies' | 'importing' | 'complete';
  message: string;
}

export interface ImportResult {
  success: number;
  warnings: ValidationWarning[];
  created: number;
  updated: number;
  autoCreated: {
    veiculos: string[];
    motoristas: string[];
  };
  errors: string[];
}

const BATCH_SIZE = 100;

/**
 * Tenta fazer match do valor da planilha com veículos cadastrados
 * Retorna formato "Modelo - Placa" se encontrar match, senão retorna valor original
 */
function matchVeiculoFromPlanilha(
  valorPlanilha: string | null,
  veiculos: Veiculo[]
): string | null {
  if (!valorPlanilha) return null;

  const valorNormalizado = valorPlanilha.trim().toUpperCase();

  // Buscar por fabricante (case-insensitive)
  const matches = veiculos.filter(v =>
    v.ativo &&
    v.fabricante?.toUpperCase() === valorNormalizado
  );

  if (matches.length === 1) {
    const veiculo = matches[0];
    return `${veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - ${veiculo.placa}`;
  }

  // Se múltiplos matches, retornar o primeiro
  if (matches.length > 1) {
    const veiculo = matches[0];
    return `${veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - ${veiculo.placa}`;
  }

  // Se não encontrou, retornar valor original para não perder informação
  return valorPlanilha;
}

/**
 * Normaliza string para busca (remove acentos, espaços extras, converte para uppercase)
 */
function normalizeForSearch(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Normaliza espaços múltiplos
}

// ============================================================================
// NEW: VEHICLE EXTRACTION AND DEDUPLICATION UTILITIES
// ============================================================================

/**
 * Interface para dados de veículo extraído da planilha
 */
interface VehicleData {
  originalValue: string;      // Valor original da planilha
  normalizedKey: string;      // Chave normalizada para deduplicação
  placa: string | null;       // Placa extraída (se encontrada)
  modelo: string | null;      // Modelo extraído
  fabricante: string | null;  // Fabricante (sempre NULL nesta implementação)
}

/**
 * Detecta se uma string contém placa de veículo usando Regex
 * Suporta formatos:
 * - Antigo: AAA-0000 ou AAA0000
 * - Mercosul: AAA0A00 ou AAA-0A00
 * 
 * @param value String para análise
 * @returns Placa encontrada (normalizada) ou null
 */
function extractPlacaFromValue(value: string): string | null {
  if (!value) return null;

  // Regex para placa brasileira (antigo e Mercosul)
  // Formato antigo: 3 letras + 4 números (AAA-0000 ou AAA0000)
  // Formato Mercosul: 3 letras + 1 número + 1 letra + 2 números (AAA0A00 ou AAA-0A00)
  const placaRegex = /\b([A-Z]{3})-?([0-9]{4}|[0-9][A-Z][0-9]{2})\b/i;

  const match = value.match(placaRegex);
  if (match) {
    // Normalizar placa: remover hífen, uppercase
    const placa = (match[1] + match[2]).toUpperCase().replace(/[\s\-]/g, '');
    return placa;
  }

  return null;
}

/**
 * Parse veículo a partir do valor da planilha
 * Estratégia híbrida com Regex (conforme especificação do usuário):
 * 
 * 1. Tenta encontrar padrão de placa (AAA-0000 ou AAA0A00)
 * 2. Se encontrar placa:
 *    - campo placa: valor da placa
 *    - campo modelo: restante do texto (limpo)
 * 3. Se NÃO encontrar placa:
 *    - campo placa: NULL
 *    - campo modelo: texto original completo
 * 4. fabricante: sempre NULL
 * 
 * @param value Valor da coluna veículo na planilha
 * @returns VehicleData estruturado
 */
function parseVehicleFromValue(value: string): VehicleData {
  const normalizedKey = normalizeForSearch(value);
  const placa = extractPlacaFromValue(value);

  let modelo: string | null = null;

  if (placa) {
    // Se encontrou placa, extrair o resto como modelo
    // Remover a placa do texto original e limpar
    const textoSemPlaca = value.replace(/\b([A-Z]{3})-?([0-9]{4}|[0-9][A-Z][0-9]{2})\b/i, '').trim();
    modelo = textoSemPlaca || null;
  } else {
    // Se não encontrou placa, usar texto completo como modelo
    modelo = value.trim() || null;
  }

  return {
    originalValue: value,
    normalizedKey,
    placa,
    modelo,
    fabricante: null, // Sempre NULL conforme especificação
  };
}

/**
 * Extrai veículos únicos da planilha usando normalização
 * Deduplicação em memória: múltiplas linhas com mesmo veículo = 1 entrada
 * 
 * @param rows Linhas da planilha
 * @returns Map de chave normalizada para dados do veículo
 */
function extractUniqueVehicles(
  rows: Record<string, any>[]
): Map<string, VehicleData> {
  const uniqueVehicles = new Map<string, VehicleData>();

  rows.forEach(row => {
    const veiculoValue = row.veiculo;

    // Skip se vazio/inválido (será tratado como erro posteriormente)
    if (!veiculoValue || !veiculoValue.trim()) {
      return;
    }

    const vehicleData = parseVehicleFromValue(veiculoValue);

    // Usar chave normalizada para deduplicação
    if (!uniqueVehicles.has(vehicleData.normalizedKey)) {
      uniqueVehicles.set(vehicleData.normalizedKey, vehicleData);
    }
  });

  return uniqueVehicles;
}

/**
 * Cria veículos em lote (batch INSERT) no banco de dados
 * 
 * @param vehiclesToCreate Lista de veículos para criar
 * @returns Map de chave normalizada para veiculo_id criado
 */
async function createBatchVehicles(
  vehiclesToCreate: VehicleData[]
): Promise<Map<string, string>> {
  const createdMap = new Map<string, string>();

  if (vehiclesToCreate.length === 0) {
    return createdMap;
  }

  // Preparar dados para inserção
  const vehicleInsertData = vehiclesToCreate.map(v => ({
    placa: v.placa,
    modelo: v.modelo,
    fabricante: v.fabricante,
    km_atual: 0,
    ativo: true,
  }));

  // Batch INSERT
  const { data, error } = await supabase
    .from('veiculos')
    .insert(vehicleInsertData)
    .select('id, placa, modelo, fabricante');

  if (error) {
    console.error('Erro ao criar veículos em lote:', error);
    throw new Error(`Falha ao criar veículos: ${error.message}`);
  }

  // Mapear IDs criados de volta para chaves normalizadas
  data?.forEach((vehicle, index) => {
    const originalVehicleData = vehiclesToCreate[index];
    createdMap.set(originalVehicleData.normalizedKey, vehicle.id);
  });

  return createdMap;
}

/**
 * Carrega cache de veículos e motoristas existentes
 * Indexa veículos por placa, fabricante, modelo e combinações
 */
export async function loadCache(): Promise<{
  veiculos: Map<string, string>; // placa normalizada -> veiculo_id
  veiculosPorFabricante: Map<string, string[]>; // fabricante normalizado -> veiculo_id[]
  veiculosPorModelo: Map<string, string[]>; // modelo normalizado -> veiculo_id[]
  veiculosPorFabricanteModelo: Map<string, string[]>; // "fabricante modelo" -> veiculo_id[]
  veiculosCompletos: Array<{ id: string; placa: string; fabricante: string | null; modelo: string | null }>; // lista completa
  motoristas: Map<string, string>;
}> {
  const [veiculosRes, motoristasRes] = await Promise.all([
    supabase.from('veiculos').select('id, placa, fabricante, modelo').eq('ativo', true),
    supabase.from('motoristas').select('id, nome'),
  ]);

  const veiculos = new Map<string, string>(); // placa -> veiculo_id
  const veiculosPorFabricante = new Map<string, string[]>(); // fabricante -> veiculo_id[]
  const veiculosPorModelo = new Map<string, string[]>(); // modelo -> veiculo_id[]
  const veiculosPorFabricanteModelo = new Map<string, string[]>(); // "fabricante modelo" -> veiculo_id[]
  const veiculosCompletos: Array<{ id: string; placa: string; fabricante: string | null; modelo: string | null }> = [];
  const motoristas = new Map<string, string>();

  veiculosRes.data?.forEach((v) => {
    // Indexar por placa (normalizada)
    if (v.placa) {
      const placaNormalizada = v.placa.toUpperCase().replace(/[\s\-]/g, '');
      veiculos.set(placaNormalizada, v.id);
    }

    // Indexar por fabricante
    if (v.fabricante) {
      const fabricanteNormalizado = normalizeForSearch(v.fabricante);
      if (fabricanteNormalizado) {
        if (!veiculosPorFabricante.has(fabricanteNormalizado)) {
          veiculosPorFabricante.set(fabricanteNormalizado, []);
        }
        veiculosPorFabricante.get(fabricanteNormalizado)!.push(v.id);
      }
    }

    // Indexar por modelo
    if (v.modelo) {
      const modeloNormalizado = normalizeForSearch(v.modelo);
      if (modeloNormalizado) {
        if (!veiculosPorModelo.has(modeloNormalizado)) {
          veiculosPorModelo.set(modeloNormalizado, []);
        }
        veiculosPorModelo.get(modeloNormalizado)!.push(v.id);
      }
    }

    // Indexar por "fabricante modelo" combinado
    if (v.fabricante && v.modelo) {
      const fabricanteModelo = normalizeForSearch(`${v.fabricante} ${v.modelo}`);
      if (fabricanteModelo) {
        if (!veiculosPorFabricanteModelo.has(fabricanteModelo)) {
          veiculosPorFabricanteModelo.set(fabricanteModelo, []);
        }
        veiculosPorFabricanteModelo.get(fabricanteModelo)!.push(v.id);
      }
    }

    // Também indexar apenas fabricante (sem modelo) para casos como "VOLVO 350"
    if (v.fabricante) {
      const fabricanteNormalizado = normalizeForSearch(v.fabricante);
      // Se o fabricante contém números (ex: "VOLVO 350"), também indexar
      if (fabricanteNormalizado && /\d/.test(fabricanteNormalizado)) {
        if (!veiculosPorFabricante.has(fabricanteNormalizado)) {
          veiculosPorFabricante.set(fabricanteNormalizado, []);
        }
        if (!veiculosPorFabricante.get(fabricanteNormalizado)!.includes(v.id)) {
          veiculosPorFabricante.get(fabricanteNormalizado)!.push(v.id);
        }
      }
    }

    // Armazenar dados completos para busca flexível
    veiculosCompletos.push({
      id: v.id,
      placa: v.placa || '',
      fabricante: v.fabricante,
      modelo: v.modelo,
    });
  });

  motoristasRes.data?.forEach((m) => {
    if (m.nome) motoristas.set(m.nome.toLowerCase(), m.id);
  });

  return {
    veiculos,
    veiculosPorFabricante,
    veiculosPorModelo,
    veiculosPorFabricanteModelo,
    veiculosCompletos,
    motoristas
  };
}

/**
 * Função de matching inteligente de veículos
 * Tenta múltiplas estratégias para encontrar o veiculo_id correspondente
 */
export function findVeiculoId(
  valorExcel: string | null | undefined,
  cache: Awaited<ReturnType<typeof loadCache>>
): string | null {
  if (!valorExcel || !valorExcel.trim()) return null;

  const valorNormalizado = normalizeForSearch(valorExcel);
  if (!valorNormalizado) return null;

  // 1. Tentar match exato por placa normalizada
  const placaNormalizada = valorExcel.toUpperCase().replace(/[\s\-]/g, '');
  const veiculoPorPlaca = cache.veiculos.get(placaNormalizada);
  if (veiculoPorPlaca) {
    return veiculoPorPlaca;
  }

  // 2. Tentar match exato por "fabricante modelo" combinado
  const veiculosPorFabricanteModelo = cache.veiculosPorFabricanteModelo.get(valorNormalizado);
  if (veiculosPorFabricanteModelo && veiculosPorFabricanteModelo.length === 1) {
    return veiculosPorFabricanteModelo[0];
  }

  // 3. Tentar match exato por fabricante
  const veiculosPorFabricante = cache.veiculosPorFabricante.get(valorNormalizado);
  if (veiculosPorFabricante && veiculosPorFabricante.length === 1) {
    return veiculosPorFabricante[0];
  }

  // 4. Tentar match exato por modelo
  const veiculosPorModelo = cache.veiculosPorModelo.get(valorNormalizado);
  if (veiculosPorModelo && veiculosPorModelo.length === 1) {
    return veiculosPorModelo[0];
  }

  // 5. Tentar match parcial (contém) - buscar em fabricante
  for (const [fabricante, veiculoIds] of cache.veiculosPorFabricante.entries()) {
    if (fabricante.includes(valorNormalizado) || valorNormalizado.includes(fabricante)) {
      if (veiculoIds.length === 1) {
        return veiculoIds[0];
      }
      // Se múltiplos, retornar o primeiro
      if (veiculoIds.length > 0) {
        return veiculoIds[0];
      }
    }
  }

  // 6. Tentar match parcial em "fabricante modelo"
  for (const [fabricanteModelo, veiculoIds] of cache.veiculosPorFabricanteModelo.entries()) {
    if (fabricanteModelo.includes(valorNormalizado) || valorNormalizado.includes(fabricanteModelo)) {
      if (veiculoIds.length === 1) {
        return veiculoIds[0];
      }
      // Se múltiplos, retornar o primeiro
      if (veiculoIds.length > 0) {
        return veiculoIds[0];
      }
    }
  }

  // 7. Busca flexível na lista completa (caso o valor do Excel seja uma combinação)
  // Ex: "VOLVO 350" pode estar no fabricante ou no modelo
  for (const veiculo of cache.veiculosCompletos) {
    const fabricanteNorm = normalizeForSearch(veiculo.fabricante);
    const modeloNorm = normalizeForSearch(veiculo.modelo);
    const fabricanteModeloNorm = fabricanteNorm && modeloNorm
      ? normalizeForSearch(`${veiculo.fabricante} ${veiculo.modelo}`)
      : '';

    // Match exato ou parcial
    if (
      fabricanteNorm === valorNormalizado ||
      modeloNorm === valorNormalizado ||
      fabricanteModeloNorm === valorNormalizado ||
      (fabricanteNorm && fabricanteNorm.includes(valorNormalizado)) ||
      (modeloNorm && modeloNorm.includes(valorNormalizado)) ||
      (fabricanteModeloNorm && fabricanteModeloNorm.includes(valorNormalizado)) ||
      (valorNormalizado.includes(fabricanteNorm) && fabricanteNorm) ||
      (valorNormalizado.includes(modeloNorm) && modeloNorm)
    ) {
      return veiculo.id;
    }
  }

  return null;
}

/**
 * Cria veículos faltantes
 */
async function createMissingVeiculos(
  placas: string[],
  cache: Map<string, string>
): Promise<string[]> {
  const created: string[] = [];
  const toCreate = placas.filter((p) => !cache.has(p));

  if (toCreate.length === 0) return created;

  const { data, error } = await supabase
    .from('veiculos')
    .insert(toCreate.map((placa) => ({ placa, km_atual: 0, ativo: true })))
    .select('id, placa');

  if (error) {
    console.error('Erro ao criar veículos:', error);
    return created;
  }

  data?.forEach((v) => {
    if (v.placa) {
      cache.set(v.placa.toUpperCase().replace(/[\s\-]/g, ''), v.id);
      created.push(v.placa);
    }
  });

  return created;
}

/**
 * Cria motoristas faltantes
 */
async function createMissingMotoristas(
  nomes: string[],
  cache: Map<string, string>
): Promise<string[]> {
  const created: string[] = [];
  const toCreate = nomes.filter((n) => !cache.has(n.toLowerCase()));

  if (toCreate.length === 0) return created;

  const { data, error } = await supabase
    .from('motoristas')
    .insert(toCreate.map((nome) => ({ nome, eh_motorista: true, eh_montador: false, ativo: true })))
    .select('id, nome');

  if (error) {
    console.error('Erro ao criar motoristas:', error);
    return created;
  }

  data?.forEach((m) => {
    if (m.nome) {
      cache.set(m.nome.toLowerCase(), m.id);
      created.push(m.nome);
    }
  });

  return created;
}

/**
 * Importa veículos
 */
export async function importVeiculos(
  rows: Record<string, any>[],
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    warnings: [],
    created: 0,
    updated: 0,
    autoCreated: { veiculos: [], motoristas: [] },
    errors: [],
  };

  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'importing',
    message: 'Importando veículos...',
  });

  // Processar em lotes
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const veiculosToUpsert = batch
      .filter((row) => row.placa) // Só importar se tiver placa
      .map((row) => ({
        placa: row.placa,
        fabricante: row.fabricante || null,
        modelo: row.modelo || null,
        tipo: row.tipo || null,
        ano: row.ano || null,
        km_atual: row.km_atual || 0,
        ativo: true,
      }));

    if (veiculosToUpsert.length === 0) continue;

    const { data, error } = await supabase
      .from('veiculos')
      .upsert(veiculosToUpsert, { onConflict: 'placa' })
      .select();

    if (error) {
      result.errors.push(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      result.success += data?.length || 0;
    }

    onProgress({
      total: rows.length,
      current: Math.min(i + BATCH_SIZE, rows.length),
      created: result.success,
      updated: result.updated,
      autoCreated: 0,
      phase: 'importing',
      message: `Importando veículos... (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length})`,
    });
  }

  onProgress({
    total: rows.length,
    current: rows.length,
    created: result.success,
    updated: 0,
    autoCreated: 0,
    phase: 'complete',
    message: `Importação concluída: ${result.success} veículos`,
  });

  return result;
}

/**
 * Importa entregas
 */
export async function importEntregas(
  rows: Record<string, any>[],
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    warnings: [],
    created: 0,
    updated: 0,
    autoCreated: { veiculos: [], motoristas: [] },
    errors: [],
  };

  // Buscar veículos cadastrados para fazer match
  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'preparing',
    message: 'Carregando veículos cadastrados...',
  });

  const { data: veiculos, error: veiculosError } = await supabase
    .from('veiculos')
    .select('*')
    .eq('ativo', true);

  if (veiculosError) {
    result.errors.push(`Erro ao carregar veículos: ${veiculosError.message}`);
  }

  const veiculosList = (veiculos || []) as Veiculo[];

  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'importing',
    message: 'Importando entregas...',
  });

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    try {
      const entregasToInsert = batch.map((row) => {
        // Aplicar match de veículo no campo carro
        const carroMatched = matchVeiculoFromPlanilha(row.carro, veiculosList);

        return {
          pv_foco: row.pv_foco || null,
          nf: row.nf || null,
          valor: row.valor || null,
          cliente: row.cliente || null,
          uf: row.uf || null,
          data_saida: (() => {
            const value = row.data_saida || null;
            return value;
          })(),
          motorista: row.motorista || null,
          carro: carroMatched,
          tipo_transporte: row.tipo_transporte || null,
          status: row.status || 'PENDENTE',
          precisa_montagem: row.precisa_montagem ?? false,
          status_montagem: row.status_montagem || 
                          (row.precisa_montagem && row.data_montagem ? 'CONCLUIDO' : 
                           row.precisa_montagem ? 'PENDENTE' : null),
          data_montagem: row.data_montagem || null,
          montador_1: row.montador_1 || null,
          montador_2: row.montador_2 || null,
          gastos_entrega: row.gastos_entrega || null,
          gastos_montagem: row.gastos_montagem || null,
          produtividade: row.produtividade || null,
          erros: row.erros || null,
          percentual_gastos: row.percentual_gastos || null,
          descricao_erros: row.descricao_erros || null,
        };
      });

      const { data, error } = await supabase
        .from('controle_entregas')
        .insert(entregasToInsert)
        .select();

      if (error) {
        result.errors.push(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.details || error.message}`);
      } else {
        result.success += data?.length || 0;
      }
    } catch (err) {
      result.errors.push(`Falha crítica no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${(err as Error).message}`);
    }

    onProgress({
      total: rows.length,
      current: Math.min(i + BATCH_SIZE, rows.length),
      created: result.success,
      updated: 0,
      autoCreated: 0,
      phase: 'importing',
      message: `Importando entregas... (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}) | Sucesso: ${result.success}`,
    });
  }

  onProgress({
    total: rows.length,
    current: rows.length,
    created: result.success,
    updated: 0,
    autoCreated: 0,
    phase: 'complete',
    message: `Importação concluída: ${result.success} entregas`,
  });

  return result;
}

/**
 * Importa abastecimentos com criação inteligente de veículos
 * NOVA LÓGICA: Deduplicação em memória + criação em lote
 */
export async function importAbastecimentos(
  rows: Record<string, any>[],
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    warnings: [],
    created: 0,
    updated: 0,
    autoCreated: { veiculos: [], motoristas: [] },
    errors: [],
  };

  // Carregar cache
  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'preparing',
    message: 'Carregando dados existentes...',
  });

  const cache = await loadCache();

  // ============================================================================
  // STEP 1: EXTRAIR VEÍCULOS ÚNICOS DA PLANILHA (DEDUPLICAÇÃO EM MEMÓRIA)
  // ============================================================================

  const uniqueVehiclesInSpreadsheet = extractUniqueVehicles(rows);

  // ============================================================================
  // STEP 2: SEPARAR VEÍCULOS EXISTENTES VS NOVOS
  // ============================================================================

  const existingVehicleMap = new Map<string, string>(); // normalizedKey -> veiculo_id
  const newVehiclesToCreate: VehicleData[] = [];

  uniqueVehiclesInSpreadsheet.forEach((vehicleData, normalizedKey) => {
    // Tentar encontrar veículo existente usando função de matching inteligente
    const existingId = findVeiculoId(vehicleData.originalValue, cache);

    if (existingId) {
      // Veículo já existe no banco
      existingVehicleMap.set(normalizedKey, existingId);
    } else {
      // Veículo novo, adicionar à lista de criação
      newVehiclesToCreate.push(vehicleData);
    }
  });

  // ============================================================================
  // STEP 3: CRIAR VEÍCULOS NOVOS EM LOTE (BATCH INSERT - APENAS 1 VEZ)
  // ============================================================================

  const createdVehicleIds = new Map<string, string>();

  if (newVehiclesToCreate.length > 0) {
    onProgress({
      total: rows.length,
      current: 0,
      created: 0,
      updated: 0,
      autoCreated: 0,
      phase: 'creating_dependencies',
      message: `Criando ${newVehiclesToCreate.length} veículos novos...`,
    });

    try {
      const createdMap = await createBatchVehicles(newVehiclesToCreate);

      // Armazenar IDs criados e atualizar cache
      createdMap.forEach((veiculoId, normalizedKey) => {
        createdVehicleIds.set(normalizedKey, veiculoId);

        // Encontrar o veículo criado para adicionar ao resultado
        const vehicleData = newVehiclesToCreate.find(v => v.normalizedKey === normalizedKey);
        if (vehicleData) {
          const displayName = vehicleData.placa || vehicleData.modelo || vehicleData.originalValue;
          result.autoCreated.veiculos.push(displayName);

          // Atualizar cache para lookups subsequentes
          if (vehicleData.placa) {
            cache.veiculos.set(vehicleData.placa, veiculoId);
          }
        }
      });

    } catch (error) {
      result.errors.push(`Erro ao criar veículos: ${(error as Error).message}`);
      // Continuar com os veículos que existem
    }
  }

  // ============================================================================
  // STEP 4: IDENTIFICAR E COLETAR CONDUTORES FALTANTES
  // ============================================================================

  const condutoresUnicos = new Set<string>();

  rows.forEach((row) => {
    if (row.condutor && !cache.motoristas.has(row.condutor.toLowerCase())) {
      condutoresUnicos.add(row.condutor);
    }
  });

  // Criar condutores faltantes
  if (condutoresUnicos.size > 0) {
    onProgress({
      total: rows.length,
      current: 0,
      created: 0,
      updated: 0,
      autoCreated: result.autoCreated.veiculos.length,
      phase: 'creating_dependencies',
      message: `Criando ${condutoresUnicos.size} condutores...`,
    });

    result.autoCreated.motoristas = await createMissingMotoristas(
      Array.from(condutoresUnicos),
      cache.motoristas
    );
  }

  // ============================================================================
  const abastecimentosParaImportar = rows.map((row) => {
    const normalizedKey = normalizeForSearch(row.veiculo || '');
    const veiculoId = existingVehicleMap.get(normalizedKey) || createdVehicleIds.get(normalizedKey);
    const condutorId = cache.motoristas.get(row.condutor?.toLowerCase());

    const parsingErrors = row.parsingErrors || [];
    const hasCriticalErrors = parsingErrors.length > 0;

    return {
      data: row.data || new Date().toISOString().split('T')[0],
      veiculo_id: veiculoId || null,
      condutor_id: condutorId || null,
      posto: row.posto || '',
      cidade: row.cidade || '',
      estado: row.estado || '',
      km_inicial: row.km_inicial || 0,
      litros: row.litros || 0,
      produto: row.produto || 'Diesel S-10',
      valor_unitario: row.valor_unitario || 0,
      valor_total: row.valor_total || 0,
      erros: hasCriticalErrors ? 'IMPORT_ERROR' : null,
      descricao_erros: parsingErrors.join('; ') || null,
    };
  });

  // ============================================================================
  // STEP 6: ORDENAR POR VEÍCULO E DATA (PARA CÁLCULO CORRETO DE KM/L)
  // ============================================================================

  abastecimentosParaImportar.sort((a, b) => {
    if (a.veiculo_id && b.veiculo_id && a.veiculo_id !== b.veiculo_id) {
      return a.veiculo_id.localeCompare(b.veiculo_id);
    }
    return a.data.localeCompare(b.data);
  });

  // ============================================================================
  // STEP 7: IMPORTAR ABASTECIMENTOS (KM/L calculado no banco pelo trigger)
  // ============================================================================

  onProgress({
    total: abastecimentosParaImportar.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: result.autoCreated.veiculos.length + result.autoCreated.motoristas.length,
    phase: 'importing',
    message: 'Importando abastecimentos...',
  });

  for (let i = 0; i < abastecimentosParaImportar.length; i += BATCH_SIZE) {
    const batch = abastecimentosParaImportar.slice(i, i + BATCH_SIZE);
    const abastecimentosToInsert = batch.map((abastecimento) => ({
      ...abastecimento,
      km_por_litro: null,
    }));

    if (abastecimentosToInsert.length === 0) continue;

    const { data, error } = await supabase
      .from('abastecimentos')
      .insert(abastecimentosToInsert)
      .select();

    if (error) {
      result.errors.push(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      result.success += data?.length || 0;

      for (const abastecimento of abastecimentosToInsert) {
        if (abastecimento.veiculo_id) {
          await atualizarKmAtualVeiculo(abastecimento.veiculo_id, abastecimento.km_inicial);
        }
      }
    }

    onProgress({
      total: abastecimentosParaImportar.length,
      current: Math.min(i + BATCH_SIZE, abastecimentosParaImportar.length),
      created: result.success,
      updated: 0,
      autoCreated: result.autoCreated.veiculos.length + result.autoCreated.motoristas.length,
      phase: 'importing',
      message: `Importando abastecimentos... (${Math.min(i + BATCH_SIZE, abastecimentosParaImportar.length)}/${abastecimentosParaImportar.length})`,
    });
  }

  onProgress({
    total: abastecimentosParaImportar.length,
    current: abastecimentosParaImportar.length,
    created: result.success,
    updated: 0,
    autoCreated: result.autoCreated.veiculos.length + result.autoCreated.motoristas.length,
    phase: 'complete',
    message: `Importação concluída: ${result.success} abastecimentos, ${result.autoCreated.veiculos.length} veículos criados`,
  });

  return result;
}

/**
 * Importa manutenções
 */
export async function importManutencoes(
  rows: Record<string, any>[],
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    warnings: [],
    created: 0,
    updated: 0,
    autoCreated: { veiculos: [], motoristas: [] },
    errors: [],
  };

  // Carregar cache
  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'preparing',
    message: 'Carregando dados existentes...',
  });

  const cache = await loadCache();

  // Coletar veículos únicos que precisam ser criados
  const veiculosUnicos = new Set<string>();

  rows.forEach((row) => {
    if (row.placa && !cache.veiculos.has(row.placa)) {
      veiculosUnicos.add(row.placa);
    }
  });

  // Criar veículos faltantes
  if (veiculosUnicos.size > 0) {
    onProgress({
      total: rows.length,
      current: 0,
      created: 0,
      updated: 0,
      autoCreated: 0,
      phase: 'creating_dependencies',
      message: `Criando ${veiculosUnicos.size} veículos...`,
    });

    result.autoCreated.veiculos = await createMissingVeiculos(
      Array.from(veiculosUnicos),
      cache.veiculos
    );
  }

  // Importar manutenções
  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: result.autoCreated.veiculos.length,
    phase: 'importing',
    message: 'Importando manutenções...',
  });

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const manutencoesToInsert = batch
      .map((row) => {
        // Obter ID do veículo se existir
        const veiculoId = cache.veiculos.get(row.placa);

        const parsingErrors = row.parsingErrors || [];
        const hasCriticalErrors = parsingErrors.length > 0;

        return {
          data: row.data || new Date().toISOString().split('T')[0],
          veiculo_id: veiculoId || null,
          estabelecimento: row.estabelecimento || '',
          tipo_servico: row.tipo_servico || '',
          descricao_servico: row.descricao_servico || null,
          custo_total: row.custo_total || 0,
          km_manutencao: row.km_manutencao !== null && row.km_manutencao !== undefined ? row.km_manutencao : (null as any),
          nota_fiscal: row.nota_fiscal || null,
          tipo_manutencao: (row.tipo_manutencao || 'corretiva') as 'preventiva' | 'corretiva',
          status: 'resolvida' as const,
          erros: hasCriticalErrors ? 'IMPORT_ERROR' : null,
          descricao_erros: parsingErrors.join('; ') || null,
        };
      });

    if (manutencoesToInsert.length === 0) continue;

    const { data, error } = await supabase
      .from('manutencoes')
      .insert(manutencoesToInsert)
      .select();

    if (error) {
      result.errors.push(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      result.success += data?.length || 0;
    }

    onProgress({
      total: rows.length,
      current: Math.min(i + BATCH_SIZE, rows.length),
      created: result.success,
      updated: 0,
      autoCreated: result.autoCreated.veiculos.length,
      phase: 'importing',
      message: `Importando manutenções... (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length})`,
    });
  }

  onProgress({
    total: rows.length,
    current: rows.length,
    created: result.success,
    updated: 0,
    autoCreated: result.autoCreated.veiculos.length,
    phase: 'complete',
    message: `Importação concluída: ${result.success} manutenções`,
  });

  return result;
}

/**
 * Importa motoristas
 */
export async function importMotoristas(
  rows: Record<string, any>[],
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    warnings: [],
    created: 0,
    updated: 0,
    autoCreated: { veiculos: [], motoristas: [] },
    errors: [],
  };

  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'importing',
    message: 'Importando motoristas...',
  });

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const motoristasToInsert = batch
      .filter((row) => row.nome)
      .map((row) => ({
        nome: row.nome,
        eh_motorista: row.funcao === 'Motorista' || row.funcao === 'Condutor' || !row.funcao,
        eh_montador: false, // Será atualizado se houver campo específico na importação
        numero_cnh: row.numero_cnh || null,
        categoria_cnh: row.categoria_cnh || null,
        data_vencimento_cnh: row.data_vencimento_cnh || null,
        data_exame_toxicologico: row.data_exame_toxicologico || null,
        ativo: true,
      }));

    if (motoristasToInsert.length === 0) continue;

    const { data, error } = await supabase
      .from('motoristas')
      .insert(motoristasToInsert)
      .select();

    if (error) {
      result.errors.push(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      result.success += data?.length || 0;
    }

    onProgress({
      total: rows.length,
      current: Math.min(i + BATCH_SIZE, rows.length),
      created: result.success,
      updated: 0,
      autoCreated: 0,
      phase: 'importing',
      message: `Importando motoristas... (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length})`,
    });
  }

  onProgress({
    total: rows.length,
    current: rows.length,
    created: result.success,
    updated: 0,
    autoCreated: 0,
    phase: 'complete',
    message: `Importação concluída: ${result.success} motoristas`,
  });

  return result;
}

/**
 * Importa montadores
 */
export async function importMontadores(
  rows: Record<string, any>[],
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    warnings: [],
    created: 0,
    updated: 0,
    autoCreated: { veiculos: [], motoristas: [] },
    errors: [],
  };

  onProgress({
    total: rows.length,
    current: 0,
    created: 0,
    updated: 0,
    autoCreated: 0,
    phase: 'importing',
    message: 'Importando montadores...',
  });

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const montadoresToInsert = batch
      .filter((row) => row.nome)
      .map((row) => ({
        nome: row.nome,
        ativo: true,
      }));

    if (montadoresToInsert.length === 0) continue;

    const { data, error } = await supabase
      .from('montadores')
      .insert(montadoresToInsert)
      .select();

    if (error) {
      result.errors.push(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      result.success += data?.length || 0;
    }

    onProgress({
      total: rows.length,
      current: Math.min(i + BATCH_SIZE, rows.length),
      created: result.success,
      updated: 0,
      autoCreated: 0,
      phase: 'importing',
      message: `Importando montadores... (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length})`,
    });
  }

  onProgress({
    total: rows.length,
    current: rows.length,
    created: result.success,
    updated: 0,
    autoCreated: 0,
    phase: 'complete',
    message: `Importação concluída: ${result.success} montadores`,
  });

  return result;
}

