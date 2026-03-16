export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      controle_entregas: {
        Row: {
          carro: string | null
          cliente: string | null
          created_at: string
          data_montagem: string | null
          data_saida: string | null
          descricao_erros: string | null
          erros: string | null
          gastos_entrega: number | null
          gastos_montagem: number | null
          id: string
          montador_1: string | null
          montador_2: string | null
          motorista: string | null
          nf: string | null
          percentual_gastos: number | null
          precisa_montagem: boolean | null
          produtividade: number | null
          produtividade_por_montador: number | null
          pv_foco: string | null
          status: string | null
          status_montagem: string | null
          tipo_servico_id: string | null
          tipo_transporte: string | null
          uf: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          carro?: string | null
          cliente?: string | null
          created_at?: string
          data_montagem?: string | null
          data_saida?: string | null
          descricao_erros?: string | null
          erros?: string | null
          gastos_entrega?: number | null
          gastos_montagem?: number | null
          id?: string
          montador_1?: string | null
          montador_2?: string | null
          motorista?: string | null
          nf?: string | null
          percentual_gastos?: number | null
          precisa_montagem?: boolean | null
          produtividade?: number | null
          produtividade_por_montador?: number | null
          pv_foco?: string | null
          status?: string | null
          status_montagem?: string | null
          tipo_servico_id?: string | null
          tipo_transporte?: string | null
          uf?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          carro?: string | null
          cliente?: string | null
          created_at?: string
          data_montagem?: string | null
          data_saida?: string | null
          descricao_erros?: string | null
          erros?: string | null
          gastos_entrega?: number | null
          gastos_montagem?: number | null
          id?: string
          montador_1?: string | null
          montador_2?: string | null
          motorista?: string | null
          nf?: string | null
          percentual_gastos?: number | null
          precisa_montagem?: boolean | null
          produtividade?: number | null
          produtividade_por_montador?: number | null
          pv_foco?: string | null
          status?: string | null
          status_montagem?: string | null
          tipo_servico_id?: string | null
          tipo_transporte?: string | null
          uf?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "controle_entregas_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servico_montagem"
            referencedColumns: ["id"]
          }
        ]
      }
      tipos_servico_montagem: {
        Row: {
          id: string
          nome: string
          percentual: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          percentual: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          percentual?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      acertos_viagem: {
        Row: {
          id: string
          veiculo_id: string | null
          motorista_id: string | null
          montador_id: string | null
          destino: string
          data_saida: string
          data_chegada: string | null
          km_saida: number | null
          km_chegada: number | null
          valor_adiantamento: number
          despesa_combustivel: number
          despesa_material_montagem: number
          despesa_passagem_onibus: number
          despesa_hotel: number
          despesa_lavanderia: number
          despesa_taxi_transporte: number
          despesa_veiculo: number
          despesa_ajudante: number
          despesa_cartao_telefonico: number
          despesa_alimentacao: number
          despesa_diaria_motorista: number
          despesa_diaria_montador: number
          despesa_outros: number
          despesa_outros_descricao: string | null
          observacoes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          veiculo_id?: string | null
          motorista_id?: string | null
          montador_id?: string | null
          destino: string
          data_saida: string
          data_chegada?: string | null
          km_saida?: number | null
          km_chegada?: number | null
          valor_adiantamento?: number
          despesa_combustivel?: number
          despesa_material_montagem?: number
          despesa_passagem_onibus?: number
          despesa_hotel?: number
          despesa_lavanderia?: number
          despesa_taxi_transporte?: number
          despesa_veiculo?: number
          despesa_ajudante?: number
          despesa_cartao_telefonico?: number
          despesa_alimentacao?: number
          despesa_diaria_motorista?: number
          despesa_diaria_montador?: number
          despesa_outros?: number
          despesa_outros_descricao?: string | null
          observacoes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          veiculo_id?: string | null
          motorista_id?: string | null
          montador_id?: string | null
          destino?: string
          data_saida?: string
          data_chegada?: string | null
          km_saida?: number | null
          km_chegada?: number | null
          valor_adiantamento?: number
          despesa_combustivel?: number
          despesa_material_montagem?: number
          despesa_passagem_onibus?: number
          despesa_hotel?: number
          despesa_lavanderia?: number
          despesa_taxi_transporte?: number
          despesa_veiculo?: number
          despesa_ajudante?: number
          despesa_cartao_telefonico?: number
          despesa_alimentacao?: number
          despesa_diaria_motorista?: number
          despesa_diaria_montador?: number
          despesa_outros?: number
          despesa_outros_descricao?: string | null
          observacoes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      acerto_viagem_entregas: {
        Row: {
          id: string
          acerto_id: string
          entrega_id: string
          created_at: string
        }
        Insert: {
          id?: string
          acerto_id: string
          entrega_id: string
          created_at?: string
        }
        Update: {
          id?: string
          acerto_id?: string
          entrega_id?: string
          created_at?: string
        }
        Relationships: []
      }
      acerto_viagem_abastecimentos: {
        Row: {
          id: string
          acerto_id: string
          abastecimento_id: string
          created_at: string
        }
        Insert: {
          id?: string
          acerto_id: string
          abastecimento_id: string
          created_at?: string
        }
        Update: {
          id?: string
          acerto_id?: string
          abastecimento_id?: string
          created_at?: string
        }
        Relationships: []
      }
      acerto_viagem_abastecimentos_requisicao: {
        Row: {
          id: string
          acerto_id: string
          abastecimento_id: string
          created_at: string
        }
        Insert: {
          id?: string
          acerto_id: string
          abastecimento_id: string
          created_at?: string
        }
        Update: {
          id?: string
          acerto_id?: string
          abastecimento_id?: string
          created_at?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          id: string
          placa: string
          fabricante: string | null
          modelo: string | null
          tipo: string | null
          ano: number | null
          km_atual: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          placa: string
          fabricante?: string | null
          modelo?: string | null
          tipo?: string | null
          ano?: number | null
          km_atual?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          placa?: string
          fabricante?: string | null
          modelo?: string | null
          tipo?: string | null
          ano?: number | null
          km_atual?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      motoristas: {
        Row: {
          id: string
          nome: string
          funcao: string
          numero_cnh: string | null
          categoria_cnh: string | null
          data_vencimento_cnh: string | null
          data_exame_toxicologico: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          funcao?: string
          numero_cnh?: string | null
          categoria_cnh?: string | null
          data_vencimento_cnh?: string | null
          data_exame_toxicologico?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          funcao?: string
          numero_cnh?: string | null
          categoria_cnh?: string | null
          data_vencimento_cnh?: string | null
          data_exame_toxicologico?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      montadores: {
        Row: {
          id: string
          nome: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      abastecimentos: {
        Row: {
          id: string
          data: string
          veiculo_id: string
          condutor_id: string
          posto: string
          cidade: string
          estado: string
          km_inicial: number
          litros: number
          produto: string
          valor_unitario: number
          valor_total: number
          km_por_litro: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          veiculo_id: string
          condutor_id: string
          posto: string
          cidade: string
          estado: string
          km_inicial: number
          litros: number
          produto: string
          valor_unitario: number
          valor_total: number
          km_por_litro?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          veiculo_id?: string
          condutor_id?: string
          posto?: string
          cidade?: string
          estado?: string
          km_inicial?: number
          litros?: number
          produto?: string
          valor_unitario?: number
          valor_total?: number
          km_por_litro?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      manutencoes: {
        Row: {
          id: string
          data: string
          veiculo_id: string
          estabelecimento: string
          tipo_servico: string
          descricao_servico: string | null
          custo_total: number
          km_manutencao: number
          nota_fiscal: string | null
          tipo_manutencao: string
          status: string
          problema_detectado: string | null
          config_preventiva_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          veiculo_id: string
          estabelecimento: string
          tipo_servico: string
          descricao_servico?: string | null
          custo_total: number
          km_manutencao: number
          nota_fiscal?: string | null
          tipo_manutencao?: string
          status?: string
          problema_detectado?: string | null
          config_preventiva_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          veiculo_id?: string
          estabelecimento?: string
          tipo_servico?: string
          descricao_servico?: string | null
          custo_total?: number
          km_manutencao?: number
          nota_fiscal?: string | null
          tipo_manutencao?: string
          status?: string
          problema_detectado?: string | null
          config_preventiva_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      manutencoes_preventivas_config: {
        Row: {
          id: string
          veiculo_id: string
          nome_servico: string
          intervalo_km: number
          margem_alerta_km: number
          km_ultima_manutencao: number | null
          km_proxima_manutencao: number | null
          aguardando_primeira_manutencao: boolean
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          veiculo_id: string
          nome_servico: string
          intervalo_km: number
          margem_alerta_km: number
          km_ultima_manutencao?: number | null
          km_proxima_manutencao?: number | null
          aguardando_primeira_manutencao?: boolean
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          veiculo_id?: string
          nome_servico?: string
          intervalo_km?: number
          margem_alerta_km?: number
          km_ultima_manutencao?: number | null
          km_proxima_manutencao?: number | null
          aguardando_primeira_manutencao?: boolean
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
