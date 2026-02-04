// Tipos literais para status
export type StatusEntrega = 'PENDENTE' | 'EM ROTA' | 'CONCLUIDO' | 'CANCELADO';
export type StatusMontagem = 'PENDENTE' | 'CONCLUIDO';

export interface Entrega {
  id: string;
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
  status_montagem: StatusMontagem | null;
  data_montagem: string | null;
  montador_1: string | null;
  montador_2: string | null;
  gastos_entrega: number | null;
  gastos_montagem: number | null;
  produtividade: number | null;
  erros: string | null;
  percentual_gastos: number | null;
  descricao_erros: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntregaFormData {
  pv_foco: string;
  nf: string;
  valor: number;
  cliente: string;
  uf: string;
  data_saida: string;
  motorista: string;
  carro: string;
  tipo_transporte: string;
  status: StatusEntrega;
  precisa_montagem: boolean;
  status_montagem?: StatusMontagem;
  data_montagem: string;
  montador_1: string;
  montador_2: string;
  gastos_entrega: number;
  gastos_montagem: number;
  produtividade: number;
  erros: string;
  percentual_gastos: number;
  descricao_erros: string;
}

export const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const STATUS_OPTIONS: StatusEntrega[] = [
  'PENDENTE',
  'EM ROTA',
  'CONCLUIDO',
  'CANCELADO'
];

export const TIPO_TRANSPORTE_OPTIONS = [
  'FROTA PROPRIA',
  'TERCEIRO',
  'CORREIOS',
  'TRANSPORTADORA'
];

export const STATUS_MONTAGEM_OPTIONS: StatusMontagem[] = [
  'PENDENTE',
  'CONCLUIDO'
];
