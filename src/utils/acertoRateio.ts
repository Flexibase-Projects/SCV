import type { RateioEntregaPreview, RateioResumo } from '@/types/acertoViagem';

export interface RateioEntregaInput {
  id: string;
  valor?: number | null;
  gastoAtual?: number | null;
}

export interface AtualizacaoCustoEntrega {
  id: string;
  gastos_entrega: number;
  percentual_gastos: number;
}

function toCents(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

function normalizeMoney(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return value;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calcularRateioEntregas(
  totalDespesas: number,
  entregas: RateioEntregaInput[]
): RateioResumo {
  const totalDespesasCents = toCents(normalizeMoney(totalDespesas));
  const valoresNormalizados = entregas.map((entrega) => Math.max(0, normalizeMoney(entrega.valor)));
  const baseValor = valoresNormalizados.reduce((acc, valor) => acc + valor, 0);

  if (entregas.length === 0) {
    return {
      totalDespesas: fromCents(totalDespesasCents),
      baseValor: 0,
      totalDistribuido: 0,
      diferencaArredondamento: 0,
      temBaseZero: true,
      temEntregaValorZero: false,
      entregas: [],
    };
  }

  if (baseValor <= 0) {
    const previews: RateioEntregaPreview[] = entregas.map((entrega) => {
      const gastoAnterior = normalizeMoney(entrega.gastoAtual);
      return {
        id: entrega.id,
        valor: 0,
        percentual: 0,
        gastoAnterior,
        gastoNovo: 0,
        delta: -gastoAnterior,
        temValorZero: true,
      };
    });

    return {
      totalDespesas: fromCents(totalDespesasCents),
      baseValor: 0,
      totalDistribuido: 0,
      diferencaArredondamento: fromCents(totalDespesasCents),
      temBaseZero: true,
      temEntregaValorZero: true,
      entregas: previews,
    };
  }

  const previews = entregas.map((entrega, index): RateioEntregaPreview => {
    const valor = valoresNormalizados[index];
    const percentual = valor > 0 ? (valor / baseValor) * 100 : 0;
    const gastoAnterior = normalizeMoney(entrega.gastoAtual);
    const gastoNovoCents = Math.round((valor / baseValor) * totalDespesasCents);

    return {
      id: entrega.id,
      valor,
      percentual,
      gastoAnterior,
      gastoNovo: fromCents(gastoNovoCents),
      delta: 0, // preenchido após ajuste de centavos
      temValorZero: valor <= 0,
    };
  });

  const totalDistribuidoParcialCents = previews.reduce((acc, item) => acc + toCents(item.gastoNovo), 0);
  const residuoCents = totalDespesasCents - totalDistribuidoParcialCents;
  const ultimoIndiceComValor = previews.map((p) => p.valor > 0).lastIndexOf(true);

  if (residuoCents !== 0 && ultimoIndiceComValor >= 0) {
    const atual = previews[ultimoIndiceComValor];
    previews[ultimoIndiceComValor] = {
      ...atual,
      gastoNovo: fromCents(toCents(atual.gastoNovo) + residuoCents),
    };
  }

  const totalDistribuidoCents = previews.reduce((acc, item) => acc + toCents(item.gastoNovo), 0);
  const previewsComDelta = previews.map((item) => ({
    ...item,
    delta: item.gastoNovo - item.gastoAnterior,
  }));

  return {
    totalDespesas: fromCents(totalDespesasCents),
    baseValor: roundTo(baseValor, 2),
    totalDistribuido: fromCents(totalDistribuidoCents),
    diferencaArredondamento: fromCents(residuoCents),
    temBaseZero: false,
    temEntregaValorZero: previewsComDelta.some((item) => item.temValorZero),
    entregas: previewsComDelta,
  };
}

export function gerarAtualizacoesEntrega(rateio: RateioResumo): AtualizacaoCustoEntrega[] {
  return rateio.entregas.map((entrega) => ({
    id: entrega.id,
    gastos_entrega: roundTo(entrega.gastoNovo, 2),
    percentual_gastos:
      entrega.valor > 0 ? roundTo((entrega.gastoNovo / entrega.valor) * 100, 4) : 0,
  }));
}

export function isEntregaImpactada(preview: RateioEntregaPreview, tolerance = 0.005): boolean {
  return Math.abs(preview.delta) >= tolerance;
}

