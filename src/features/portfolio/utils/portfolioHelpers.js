export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeAssetKey(symbol, name) {
  const raw = String(symbol || name || '')
    .toUpperCase()
    .trim();

  return raw
    .split('/')[0]
    .split('-')[0]
    .split(' ')[0]
    .trim();
}


export function normalizeType(type) {
  return normalizeText(type);
}


export function normalizeGroupKey(groupKey) {
  return normalizeText(groupKey);
}


export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}


export function round(value, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round(
    (value + Number.EPSILON) * factor,
  ) / factor;
}


export function getAssetValue(asset) {
  return Math.max(
    0,
    toFiniteNumber(asset?.valueUSD),
  );
}

export function percentageMap(values, denominator) {
  if (denominator <= 0) {
    return Object.fromEntries(
      Object.keys(values).map(
        (key) => [key, 0],
      ),
    );
  }

  return Object.fromEntries(
    Object.entries(values).map(
      ([key, value]) => [
        key,
        round(
          (value / denominator) * 100,
          4,
        ),
      ],
    ),
  );
}