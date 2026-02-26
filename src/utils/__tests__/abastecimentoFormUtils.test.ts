import { describe, it, expect } from 'vitest';
import { parseNumeroLocale, computeSafeValorTotal } from '../abastecimentoFormUtils';

describe('parseNumeroLocale', () => {
  it('retorna o número quando valor é number finito', () => {
    expect(parseNumeroLocale(222.4444)).toBe(222.4444);
    expect(parseNumeroLocale(264.4444)).toBe(264.4444);
    expect(parseNumeroLocale(0)).toBe(0);
    expect(parseNumeroLocale(100)).toBe(100);
  });

  it('converte string com vírgula para número', () => {
    expect(parseNumeroLocale('222,4444')).toBe(222.4444);
    expect(parseNumeroLocale('264,4444')).toBe(264.4444);
    expect(parseNumeroLocale('0,5')).toBe(0.5);
  });

  it('converte string com ponto para número', () => {
    expect(parseNumeroLocale('222.4444')).toBe(222.4444);
    expect(parseNumeroLocale('264.4444')).toBe(264.4444);
  });

  it('retorna 0 para string inválida', () => {
    expect(parseNumeroLocale('')).toBe(0);
    expect(parseNumeroLocale('abc')).toBe(0);
  });

  it('retorna 0 para undefined, null ou NaN', () => {
    expect(parseNumeroLocale(undefined)).toBe(0);
    expect(parseNumeroLocale(null)).toBe(0);
    expect(parseNumeroLocale(NaN)).toBe(0);
  });
});

describe('computeSafeValorTotal', () => {
  it('calcula valor total corretamente com litros quebrados', () => {
    expect(computeSafeValorTotal(6.19, 222.4444)).toBe(1376.93);
    expect(computeSafeValorTotal(6.19, 264.4444)).toBe(1636.91);
    expect(computeSafeValorTotal(5, 100.5)).toBe(502.5);
  });

  it('aceita string com vírgula para litros', () => {
    expect(computeSafeValorTotal(6.19, '222,4444')).toBe(1376.93);
    expect(computeSafeValorTotal(10, '100,25')).toBe(1002.5);
  });

  it('nunca retorna NaN', () => {
    expect(Number.isNaN(computeSafeValorTotal(undefined, 100))).toBe(false);
    expect(Number.isNaN(computeSafeValorTotal(10, undefined))).toBe(false);
    expect(Number.isNaN(computeSafeValorTotal('x', 'y'))).toBe(false);
    expect(computeSafeValorTotal(undefined, undefined)).toBe(0);
    expect(computeSafeValorTotal(10, 'invalid')).toBe(0);
  });

  it('retorna 0 quando valores são inválidos', () => {
    expect(computeSafeValorTotal(0, 100)).toBe(0);
    expect(computeSafeValorTotal(10, 0)).toBe(0);
    expect(computeSafeValorTotal(undefined, 222.4444)).toBe(0);
    expect(computeSafeValorTotal(6.19, null)).toBe(0);
  });

  it('arredonda para 2 casas decimais', () => {
    const result = computeSafeValorTotal(3.33, 33.33);
    expect(result).toBe(110.99);
    expect(Number.isInteger(result * 100)).toBe(true);
  });
});
