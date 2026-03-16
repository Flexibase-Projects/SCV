export interface TipoServicoMontagem {
  id: string;
  nome: string;
  percentual: number;
  created_at: string;
  updated_at: string;
}

export interface TipoServicoMontagemFormData {
  nome: string;
  percentual: number;
}
