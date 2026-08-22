import {round,toNumber} from './portfolioFormatters.js';

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

// ─── HELPERS ──────────────────────────────────────────────────

export function safeObject(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


export function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}





export function normalizeSymbol(value) {
  const symbol =
    String(value || '')
      .trim();

  return symbol || '';
}


//AI Report
// ─── VALIDACIÓN NUMÉRICA ──────────────────────────────────────

export function containsInvalidNumber(
  value,
) {
  if (
    typeof value ===
    'number'
  ) {
    return !Number.isFinite(
      value,
    );
  }


  if (
    Array.isArray(value)
  ) {
    return value.some(
      containsInvalidNumber,
    );
  }


  if (
    value &&
    typeof value ===
      'object'
  ) {
    return Object.values(
      value,
    ).some(
      containsInvalidNumber,
    );
  }


  return false;
}


// ─── NORMALIZACIÓN DE ACTIVOS ─────────────────────────────────

export function normalizeAssets(
  analysis,
) {
  return safeArray(
    analysis?.assets,
  ).map(
    (asset) => ({
      ...asset,

      source:
        resolveAssetSource(
          asset,
        ),

      classification: {
        ...(asset?.classification ||
          {}),

        sector:
          asset?.classification
            ?.sector ||
          'otros',
      },
    }),
  );
}


// ─── SOURCE RESOLUTION ────────────────────────────────────────

export function resolveAssetSource(asset) {
  const explicitSource =
    normalizeText(
      asset?.groupKey ||
      asset?.source ||
      asset?.broker ||
      asset?.platform,
    );


  // manual no debe impedir
  // inferencias posteriores.
  if (
    explicitSource &&
    explicitSource !== 'manual'
  ) {
    return explicitSource;
  }


  const note =
    normalizeText(
      asset?.note,
    );

  const symbol =
    normalizeSymbol(
      asset?.symbol,
    ).toUpperCase();

  const type =
    normalizeText(
      asset?.type,
    );


  if (
    note.includes(
      'quantfury',
    )
  ) {
    return 'quantfury';
  }


  if (
    note.includes(
      'binance',
    )
  ) {
    return 'binance';
  }


  if (
    note.includes(
      'admirals',
    )
  ) {
    return 'admirals';
  }


  if (
    type === 'crypto' &&
    [
      'BTC',
      'ETH',
      'SOL',
      'ADA',
      'HBAR',
      'USDT',
      'XRP',
    ].includes(symbol)
  ) {
    return 'binance';
  }


  if (
    type === 'etf' &&
    [
      'BND',
      'EMXC',
      'IAU',
      'VOO',
      'VXUS',
    ].includes(symbol)
  ) {
    return 'admirals';
  }


  if (
    type === 'stock' &&
    [
      'CEG',
      'MELI',
      'SLV',
    ].includes(symbol)
  ) {
    return 'quantfury';
  }


  return 'manual';
}


// ─── SOURCE EXPOSURE ──────────────────────────────────────────

export function calculateSourceExposure(
  assets,
) {
  return assets.reduce(
    (acc, asset) => {
      const source =
        resolveAssetSource(
          asset,
        );

      acc[source] =
        round(
          (
            acc[source] || 0
          ) +
          toNumber(
            asset?.valueUSD,
          ),
          2,
        );

      return acc;
    },
    {},
  );
}

