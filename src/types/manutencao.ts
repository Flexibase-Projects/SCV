export type TipoManutencao = 'preventiva' | 'corretiva';
export type StatusManutencao = 'pendente' | 'em_andamento' | 'resolvida';

export interface Manutencao {
  id: string;
  data: string;
  veiculo_id: string;
  veiculo_placa?: string;
  estabelecimento: string;
  tipo_servico: string;
  descricao_servico: string | null;
  custo_total: number;
  km_manutencao: number;
  nota_fiscal: string | null;
  tipo_manutencao: TipoManutencao;
  status: StatusManutencao;
  problema_detectado: string | null;
  erros?: string | null;
  descricao_erros?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManutencaoFormData {
  data: string;
  veiculo_id: string;
  estabelecimento: string;
  tipo_servico: string;
  descricao_servico?: string;
  custo_total: number;
  km_manutencao: number;
  nota_fiscal?: string;
  tipo_manutencao: TipoManutencao;
  status: StatusManutencao;
  problema_detectado?: string;
}

// Constantes
export const STATUS_MANUTENCAO_LABELS: Record<StatusManutencao, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  resolvida: 'Resolvida',
};

export const TIPO_MANUTENCAO_LABELS: Record<TipoManutencao, string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
};

// Sugestões de serviços preventivos comuns
export const SERVICOS_PREVENTIVOS_SUGESTOES = [
  'Troca de Óleo',
  'Troca de Filtro de Óleo',
  'Troca de Filtro de Ar',
  'Troca de Filtro de Combustível',
  'Troca de Correia Dentada',
  'Alinhamento e Balanceamento',
  'Rodízio de Pneus',
  'Troca de Pastilhas de Freio',
  'Troca de Fluido de Freio',
  'Revisão Geral',
] as const;

