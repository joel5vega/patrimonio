// src/features/portfolio/hooks/portfolioData/numbers.js
//
// Helpers numéricos puros usados por el resto de módulos.

export function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * Primer número válido entre `keys`, buscando primero en el activo y luego
 * en `asset.sourceMeta`. Con { positive: true } ignora valores <= 0.
 */
export function pickNumber(asset = {}, keys = [], { positive = false } = {}) {
  const candidates = [
    ...keys.map((key) => asset[key]),
    ...keys.map((key) => asset.sourceMeta?.[key]),
  ];

  for (const value of candidates) {
    if (value === null || value === undefined || value === '') continue;
    const number = Number(value);
    if (Number.isFinite(number) && (!positive || number > 0)) return number;
  }
  return null;
}

/** Valor de mercado en USD de un activo. */
export function getAssetValueUSD(asset = {}) {
  return safeNumber(
    asset.marketValueUSD ??
      asset.market_value_usd ??
      asset.valueUSD ??
      asset.value_usd ??
      asset.sourceMeta?.marketValueUSD ??
      asset.sourceMeta?.market_value_usd,
  );
}
