import { describe, expect, it } from 'vitest';
import { calcularRateioEntregas, gerarAtualizacoesEntrega } from '@/utils/acertoRateio';

describe('acertoRateio', () => {
  it('rateia proporcionalmente por valor', () => {
    const resultado = calcularRateioEntregas(10000, [
      { id: 'a', valor: 2000, gastoAtual: 0 },
      { id: 'b', valor: 8000, gastoAtual: 0 },
    ]);

    const entregaA = resultado.entregas.find((item) => item.id === 'a');
    const entregaB = resultado.entregas.find((item) => item.id === 'b');

    expect(entregaA?.gastoNovo).toBe(2000);
    expect(entregaB?.gastoNovo).toBe(8000);
    expect(resultado.totalDistribuido).toBe(10000);
  });

  it('ajusta resíduo de arredondamento na última entrega com valor', () => {
    const resultado = calcularRateioEntregas(100, [
      { id: 'a', valor: 1, gastoAtual: 0 },
      { id: 'b', valor: 1, gastoAtual: 0 },
      { id: 'c', valor: 1, gastoAtual: 0 },
    ]);

    const total = resultado.entregas.reduce((acc, item) => acc + item.gastoNovo, 0);

    expect(total).toBe(100);
    expect(resultado.diferencaArredondamento).not.toBe(0);
    expect(resultado.entregas[2].gastoNovo).toBe(33.34);
  });

  it('mantém entrega com valor zero como 0% e custo zero quando base tem valores positivos', () => {
    const resultado = calcularRateioEntregas(1000, [
      { id: 'a', valor: 1000, gastoAtual: 0 },
      { id: 'b', valor: 0, gastoAtual: 10 },
    ]);

    const entregaZero = resultado.entregas.find((item) => item.id === 'b');
    expect(entregaZero?.percentual).toBe(0);
    expect(entregaZero?.gastoNovo).toBe(0);
    expect(resultado.temEntregaValorZero).toBe(true);
  });

  it('quando base total é zero, define gastos novos como zero para todas as entregas', () => {
    const resultado = calcularRateioEntregas(500, [
      { id: 'a', valor: 0, gastoAtual: 25 },
      { id: 'b', valor: 0, gastoAtual: 75 },
    ]);

    expect(resultado.temBaseZero).toBe(true);
    expect(resultado.entregas.every((item) => item.gastoNovo === 0)).toBe(true);
    expect(resultado.diferencaArredondamento).toBe(500);
  });

  it('gera payload de atualização com percentual de gastos recalculado', () => {
    const resultado = calcularRateioEntregas(200, [
      { id: 'a', valor: 1000, gastoAtual: 0 },
      { id: 'b', valor: 1000, gastoAtual: 0 },
    ]);
    const atualizacoes = gerarAtualizacoesEntrega(resultado);

    expect(atualizacoes).toEqual([
      { id: 'a', gastos_entrega: 100, percentual_gastos: 10 },
      { id: 'b', gastos_entrega: 100, percentual_gastos: 10 },
    ]);
  });
});

