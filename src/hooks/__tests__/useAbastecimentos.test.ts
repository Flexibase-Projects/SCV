import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularKmPorLitro } from '../useAbastecimentos';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('calcularKmPorLitro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('quando kmAnterior é null', () => {
    it('retorna null (primeiro abastecimento)', () => {
      expect(calcularKmPorLitro(5000, null, 50)).toBeNull();
      expect(calcularKmPorLitro(1000, null, 30, true)).toBeNull();
      expect(calcularKmPorLitro(1000, null, 30, false)).toBeNull();
    });
  });

  describe('quando kmAtual > kmAnterior e litros > 0', () => {
    it('retorna (kmAtual - kmAnterior) / litros com 2 casas decimais', () => {
      expect(calcularKmPorLitro(1500, 1000, 50)).toBe(10);
      expect(calcularKmPorLitro(2000, 1500, 50)).toBe(10);
      expect(calcularKmPorLitro(1050, 1000, 25)).toBe(2);
      expect(calcularKmPorLitro(1100, 1000, 33.33)).toBe(3);
    });

    it('arredonda para 2 casas decimais', () => {
      const result = calcularKmPorLitro(1500, 1000, 33);
      expect(result).toBe(15.15); // 500/33 ≈ 15.151515...
    });
  });

  describe('quando kmAtual < kmAnterior', () => {
    it('retorna null', () => {
      expect(calcularKmPorLitro(800, 1000, 50, false)).toBeNull();
      expect(calcularKmPorLitro(500, 1000, 30, false)).toBeNull();
    });
  });

  describe('quando kmAtual === kmAnterior', () => {
    it('retorna null', () => {
      expect(calcularKmPorLitro(1000, 1000, 50, false)).toBeNull();
      expect(calcularKmPorLitro(1500, 1500, 30, false)).toBeNull();
    });
  });

  describe('cenário RETROATIVO: anterior cronológico', () => {
    it('dado anterior cronológico com km_inicial 1000 e abastecimento retroativo com km_inicial 1500 e 50 litros, retorna (1500-1000)/50 = 10', () => {
      const kmAnteriorCronologico = 1000;
      const kmAtualRetroativo = 1500;
      const litros = 50;

      const kmPorLitro = calcularKmPorLitro(
        kmAtualRetroativo,
        kmAnteriorCronologico,
        litros,
        false
      );

      expect(kmPorLitro).toBe(10);
      expect(kmPorLitro).toBe((kmAtualRetroativo - kmAnteriorCronologico) / litros);
    });
  });
});
