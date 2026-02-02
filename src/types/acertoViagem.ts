// Tipos para o módulo de Acerto de Viagem

export interface AbastecimentoVinculado {
  id: string;
  data: string;
  valor_total: number;
  posto: string;
  litros: number;
}

export interface AcertoViagem {
  id: string;
  
  // Relacionamentos
  veiculo_id: string | null;
  motorista_id: string | null;
  
  // Dados da viagem
  destino: string;
  data_saida: string;
  data_chegada: string | null;
  
  // Quilometragem
  km_saida: number | null;
  km_chegada: number | null;
  
  // Adiantamento
  valor_adiantamento: number;
  
  // 14 Categorias de Despesas
  despesa_combustivel: number;
  despesa_material_montagem: number;
  despesa_passagem_onibus: number;
  despesa_hotel: number;
  despesa_lavanderia: number;
  despesa_taxi_transporte: number;
  despesa_veiculo: number;
  despesa_ajudante: number;
  despesa_cartao_telefonico: number;
  despesa_alimentacao: number;
  despesa_diaria_motorista: number;
  despesa_diaria_montador: number;
  despesa_outros: number;
  despesa_outros_descricao: string | null;
  
  // Observações e status
  observacoes: string | null;
  status: 'PENDENTE' | 'ACERTADO';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Dados expandidos (joins)
  veiculo_placa?: string;
  veiculo_modelo?: string;
  motorista_nome?: string;
  montador_nome?: string;
  entregas?: AcertoViagemEntrega[];
  abastecimentos?: AbastecimentoVinculado[];
}

export interface AcertoViagemEntrega {
  id: string;
  acerto_id: string;
  entrega_id: string;
  created_at: string;
  
  // Dados da entrega (join)
  entrega?: {
    id: string;
    pv_foco: string | null;
    nota_fiscal: string | null;
    cliente: string | null;
    uf: string | null;
    valor: number | null;
  };
}

export interface AcertoViagemFormData {
  veiculo_id: string;
  motorista_id: string | null;
  destino: string;
  data_saida: string;
  data_chegada: string;
  km_saida: number | null;
  km_chegada: number | null;
  valor_adiantamento: number;
  
  // Despesas
  despesa_combustivel: number;
  despesa_material_montagem: number;
  despesa_passagem_onibus: number;
  despesa_hotel: number;
  despesa_lavanderia: number;
  despesa_taxi_transporte: number;
  despesa_veiculo: number;
  despesa_ajudante: number;
  despesa_cartao_telefonico: number;
  despesa_alimentacao: number;
  despesa_diaria_motorista: number;
  despesa_diaria_montador: number;
  despesa_outros: number;
  despesa_outros_descricao: string;
  
  observacoes: string;
  status: 'PENDENTE' | 'ACERTADO';
  
  // IDs das entregas vinculadas
  entregas_ids: string[];
  // IDs dos abastecimentos vinculados
  abastecimentos_ids: string[];
}

// Categorias de despesas para o formulário
export const CATEGORIAS_DESPESAS = [
  // Coluna 1
  { key: 'despesa_combustivel', label: 'Combustível' },
  { key: 'despesa_material_montagem', label: 'Mat. Montagem' },
  { key: 'despesa_passagem_onibus', label: 'Passagem Ônibus' },
  { key: 'despesa_hotel', label: 'Hotel' },
  { key: 'despesa_lavanderia', label: 'Lavanderia' },
  { key: 'despesa_taxi_transporte', label: 'Taxi/Transporte' },
  // Coluna 2
  { key: 'despesa_veiculo', label: 'Despesa Veículo' },
  { key: 'despesa_ajudante', label: 'Ajudante' },
  { key: 'despesa_cartao_telefonico', label: 'Cartão Telefônico' },
  { key: 'despesa_alimentacao', label: 'Alimentação' },
  { key: 'despesa_diaria_motorista', label: 'Diária Motorista' },
  { key: 'despesa_diaria_montador', label: 'Diária Montador' },
] as const;

export const STATUS_ACERTO_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'ACERTADO', label: 'Acertado' },
] as const;

// Helper para calcular total de despesas
export function calcularTotalDespesas(acerto: Partial<AcertoViagemFormData>): number {
  return (
    (acerto.despesa_combustivel || 0) +
    (acerto.despesa_material_montagem || 0) +
    (acerto.despesa_passagem_onibus || 0) +
    (acerto.despesa_hotel || 0) +
    (acerto.despesa_lavanderia || 0) +
    (acerto.despesa_taxi_transporte || 0) +
    (acerto.despesa_veiculo || 0) +
    (acerto.despesa_ajudante || 0) +
    (acerto.despesa_cartao_telefonico || 0) +
    (acerto.despesa_alimentacao || 0) +
    (acerto.despesa_diaria_motorista || 0) +
    (acerto.despesa_diaria_montador || 0) +
    (acerto.despesa_outros || 0)
  );
}

// Helper para calcular saldo (a devolver ou a receber da empresa)
export function calcularSaldo(acerto: Partial<AcertoViagemFormData>): { valor: number; tipo: 'devolver' | 'receber' } {
  const totalDespesas = calcularTotalDespesas(acerto);
  const adiantamento = acerto.valor_adiantamento || 0;
  const diferenca = adiantamento - totalDespesas;
  
  return {
    valor: Math.abs(diferenca),
    tipo: diferenca >= 0 ? 'devolver' : 'receber'
  };
}

// Helper para calcular dias de viagem
export function calcularDiasViagem(dataSaida: string, dataChegada: string | null): number {
  if (!dataSaida || !dataChegada) return 0;
  const inicio = new Date(dataSaida);
  const fim = new Date(dataChegada);
  const diffTime = Math.abs(fim.getTime() - inicio.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Inclui o dia de saída
}

// Helper para calcular KM rodado
export function calcularKmRodado(kmSaida: number | null, kmChegada: number | null): number | null {
  if (kmSaida === null || kmChegada === null) return null;
  return kmChegada - kmSaida;
}
