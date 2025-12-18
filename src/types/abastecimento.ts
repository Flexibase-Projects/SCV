export interface Abastecimento {
  id: string;
  data: string;
  veiculo_id: string;
  veiculo_placa?: string;
  condutor_id: string;
  condutor_nome?: string;
  posto: string;
  cidade: string;
  estado: string;
  km_inicial: number;
  litros: number;
  produto: string;
  valor_unitario: number;
  valor_total: number;
  km_por_litro?: number | null;
  erros?: string | null;
  descricao_erros?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AbastecimentoFormData {
  data: string;
  veiculo_id: string;
  condutor_id: string;
  posto: string;
  cidade: string;
  estado: string;
  km_inicial: number;
  litros: number;
  produto: string;
  valor_unitario: number;
  valor_total: number;
}

export const PRODUTOS_ABASTECIMENTO = [
  'Arla-32',
  'Diesel S-10'
];

export const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
