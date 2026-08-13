export const classifyManualField = (name = '') => {
  const value = String(name).toLowerCase().trim();
  if (value === 'airtm') return 'yield';
  if (['ahorro', 'ahorrobs', 'safi'].includes(value)) return 'reserve';
  if (['t ach', 't sas'].includes(value)) return 'patrimony';
  return 'trading';
};

export const hasBobRate = (bobRate) => Number.isFinite(Number(bobRate)) && Number(bobRate) > 0;

export const toManualUSD = (name, value, bobRate) => {
  if (typeof value !== 'number') return 0;
  if (String(name).toLowerCase().trim() !== 'ahorrobs') return value;
  return hasBobRate(bobRate) ? value / Number(bobRate) : 0;
};

export const computeRolesFromRow = (row = {}, bobRate) => {
  const roles = { trading: 0, yield: 0, reserve: 0, patrimony: 0 };
  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith('manual_') || value == null || value === 0) return;
    const name = key.replace('manual_', '').trim();
    roles[classifyManualField(name)] += toManualUSD(name, value, bobRate);
  });
  return roles;
};

export const getTotalWithoutPatrimony = (row, bobRate) => {
  const patrimony = computeRolesFromRow(row, bobRate).patrimony;
  return Math.max(0, Number(row?.totalPortfolioUSD || 0) - patrimony);
};

export const formatUSD = (value = 0) => `$${Number(value || 0).toFixed(2)}`;
export const formatCompact = (value = 0) => Number(value) >= 1000 ? `$${(Number(value) / 1000).toFixed(1)}k` : `$${Number(value).toFixed(0)}`;
export const sortHistory = (history = []) => [...history].sort((a, b) => String(a.date).localeCompare(String(b.date)));

export const getManualTypes = (assets = [], bobRate) => assets.map((asset, index) => {
  const fieldName = asset.name === 'Ahorro $' ? 'Ahorro' : asset.name === 'Ahorro en Bs' ? 'AhorroBs' : asset.name;
  const isAhorroBs = fieldName === 'AhorroBs';
  const conversionUnavailable = isAhorroBs && !hasBobRate(bobRate);
  return {
    key: `manual_${fieldName}`,
    field: `manual_${fieldName}`,
    label: asset.name,
    color: ['#a855f7', '#ec4899', '#facc15', '#10b981'][index % 4],
    icon: 'landmark',
    since: asset.since || null,
    valueUSD: isAhorroBs ? toManualUSD(fieldName, Number(asset.valueBOB ?? asset.amount ?? 0), bobRate) : Number(asset.valueUSD || 0),
    isAhorroBs,
    conversionUnavailable,
  };
});

export const buildSeries = ({ history = [], days, manualTypes, bobRate }) => {
  const sorted = sortHistory(history);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
  const inRange = (date) => days === 9999 || new Date(`${date}T00:00:00`) >= cutoff;
  const map = (field, transform = (v) => Number(v || 0)) => sorted.filter((row) => row[field] != null).map((row) => ({ date: row.date, v: transform(row[field], row) })).filter((item) => inRange(item.date));
  const series = {
    total: sorted.map((row) => ({ date: row.date, v: getTotalWithoutPatrimony(row, bobRate) })).filter((item) => inRange(item.date)),
    crypto: map('cryptoUSD'),
    etfs: map('inversionUSD'),
  };
  series.todo_full = series.total.map((item) => ({ date: item.date, v: item.v + toManualUSD('AhorroBs', Number(sorted.find((row) => row.date === item.date)?.manual_AhorroBs || 0), bobRate) }));
  ['trading', 'yield', 'reserve', 'patrimony'].forEach((role) => { series[`role_${role}`] = sorted.map((row) => ({ date: row.date, v: computeRolesFromRow(row, bobRate)[role] })).filter((item) => inRange(item.date)); });
  manualTypes.forEach((asset) => { series[asset.key] = map(asset.field, (value) => asset.isAhorroBs ? toManualUSD('AhorroBs', Number(value || 0), bobRate) : Number(value || 0)); });
  return series;
};