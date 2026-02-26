export function parseNumeroLocale(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const n = Number(val.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function computeSafeValorTotal(valorUnitario: unknown, litros: unknown): number {
  const numValorUnitario = parseNumeroLocale(valorUnitario);
  const numLitros = parseNumeroLocale(litros);
  const total = numValorUnitario * numLitros;
  return typeof total === 'number' && Number.isFinite(total) && !Number.isNaN(total)
    ? Number(total.toFixed(2))
    : 0;
}
