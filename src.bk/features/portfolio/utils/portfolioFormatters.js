export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
};

export const formatUSD = (value, decimals = 2) =>
  `$${toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export const formatPct = (value, decimals = 1) =>
  `${toNumber(value).toFixed(decimals)}%`;

export const formatSignedPct = (value, decimals = 1) => {
  const number = toNumber(value);
  return `${number >= 0 ? '+' : ''}${number.toFixed(decimals)}%`;
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getAssetSource = (asset = {}) => {
  const groupKey = String(asset.groupKey || '').toLowerCase();
  if (groupKey.startsWith('crypto') || groupKey === 'stable') return 'binance';
  if (groupKey.startsWith('etf') || groupKey === 'admirals') return 'admirals';
  if (groupKey.startsWith('quantfury')) return 'quantfury';
  return 'manual';
};

export const getRoleLabel = (role) => ({
  core: 'Core',
  growth: 'Growth',
  defensive: 'Defensive',
  liquidity: 'Liquidity',
  yield: 'Yield',
  speculative: 'Speculative',
  trading: 'Trading',
  reserve: 'Reserva',
  patrimony: 'Patrimonio',
}[role] || role || 'Sin clasificar');