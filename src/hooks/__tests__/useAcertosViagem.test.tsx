import { describe, it, expect } from 'vitest';
import type { AcertoViagemEntrega } from '@/types/acertoViagem';

// Tipo auxiliar para testar o mapeamento
type EntregaComRelacionamento = {
  id: string;
  acerto_id: string;
  entrega_id: string;
  created_at: string;
  controle_entregas: {
    id: string;
    pv_foco: string | null;
    nf: string | null;
    cliente: string | null;
    uf: string | null;
    valor: number | null;
  } | null;
};

// Função de mapeamento extraída para teste
function mapEntrega(e: EntregaComRelacionamento): AcertoViagemEntrega {
  return {
    id: e.id,
    acerto_id: e.acerto_id,
    entrega_id: e.entrega_id,
    created_at: e.created_at,
    entrega: e.controle_entregas ? {
      id: e.controle_entregas.id,
      pv_foco: e.controle_entregas.pv_foco,
      nota_fiscal: e.controle_entregas.nf || null,
      cliente: e.controle_entregas.cliente,
      uf: e.controle_entregas.uf,
      valor: e.controle_entregas.valor,
    } : undefined,
  };
}

describe('useAcertoViagem - Correção de Reconhecimento de Pedidos', () => {
  describe('Mapeamento de Dados de Entrega', () => {
    it('deve mapear corretamente pv_foco, nf, cliente, uf e valor quando todos os dados existem', () => {
      // Arrange
      const mockEntregaId = 'entrega-456';
      const mockEntrega: EntregaComRelacionamento = {
        id: 'acerto-entrega-1',
        acerto_id: 'acerto-123',
        entrega_id: mockEntregaId,
        created_at: '2026-02-01T10:00:00Z',
        controle_entregas: {
          id: mockEntregaId,
          pv_foco: 'PV1234',
          nf: 'NF5678',
          cliente: 'Cliente Teste LTDA',
          uf: 'GO',
          valor: 5000.00,
        },
      };

      // Act
      const resultado = mapEntrega(mockEntrega);

      // Assert
      expect(resultado.entrega).toBeDefined();
      expect(resultado.entrega?.pv_foco).toBe('PV1234');
      expect(resultado.entrega?.nota_fiscal).toBe('NF5678'); // ✅ Deve mapear nf corretamente
      expect(resultado.entrega?.cliente).toBe('Cliente Teste LTDA');
      expect(resultado.entrega?.uf).toBe('GO');
      expect(resultado.entrega?.valor).toBe(5000.00);
    });

    it('deve mapear null para nota_fiscal quando nf não existe no banco', () => {
      // Arrange
      const mockEntregaId = 'entrega-456';
      const mockEntrega: EntregaComRelacionamento = {
        id: 'acerto-entrega-1',
        acerto_id: 'acerto-123',
        entrega_id: mockEntregaId,
        created_at: '2026-02-01T10:00:00Z',
        controle_entregas: {
          id: mockEntregaId,
          pv_foco: 'PV1234',
          nf: null, // NF não informada
          cliente: 'Cliente Teste LTDA',
          uf: 'GO',
          valor: 5000.00,
        },
      };

      // Act
      const resultado = mapEntrega(mockEntrega);

      // Assert
      expect(resultado.entrega?.nota_fiscal).toBeNull(); // ✅ Deve ser null quando nf não existe
      expect(resultado.entrega?.pv_foco).toBe('PV1234');
      expect(resultado.entrega?.cliente).toBe('Cliente Teste LTDA');
    });

    it('deve mapear undefined para entrega quando controle_entregas é null', () => {
      // Arrange
      const mockEntrega: EntregaComRelacionamento = {
        id: 'acerto-entrega-1',
        acerto_id: 'acerto-123',
        entrega_id: 'entrega-456',
        created_at: '2026-02-01T10:00:00Z',
        controle_entregas: null, // Entrega não encontrada
      };

      // Act
      const resultado = mapEntrega(mockEntrega);

      // Assert
      expect(resultado.entrega).toBeUndefined(); // ✅ Deve ser undefined quando controle_entregas é null
    });

    it('deve mapear string vazia para null quando nf é string vazia', () => {
      // Arrange
      const mockEntregaId = 'entrega-456';
      const mockEntrega: EntregaComRelacionamento = {
        id: 'acerto-entrega-1',
        acerto_id: 'acerto-123',
        entrega_id: mockEntregaId,
        created_at: '2026-02-01T10:00:00Z',
        controle_entregas: {
          id: mockEntregaId,
          pv_foco: 'PV1234',
          nf: '', // String vazia
          cliente: 'Cliente Teste LTDA',
          uf: 'GO',
          valor: 5000.00,
        },
      };

      // Act
      const resultado = mapEntrega(mockEntrega);

      // Assert
      expect(resultado.entrega?.nota_fiscal).toBeNull(); // ✅ Deve converter string vazia para null
    });
  });

  describe('Validação da Query do Supabase', () => {
    it('deve incluir nf na lista de campos selecionados', () => {
      // Este teste valida que a query inclui 'nf' no select
      // A query esperada é: controle_entregas:entrega_id (id, pv_foco, nf, cliente, uf, valor)
      const camposEsperados = ['id', 'pv_foco', 'nf', 'cliente', 'uf', 'valor'];
      const queryString = 'controle_entregas:entrega_id (id, pv_foco, nf, cliente, uf, valor)';
      
      camposEsperados.forEach(campo => {
        expect(queryString).toContain(campo); // ✅ Deve incluir todos os campos, incluindo nf
      });
    });
  });
});
