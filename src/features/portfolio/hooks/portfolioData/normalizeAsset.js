// src/features/portfolio/hooks/portfolioData/normalizeAsset.js
//
// Unifica los distintos formatos de activo (backend, manual, Wallbit) en una
// sola forma con precio, costo, P&L y valor ya calculados.

import { pickNumber, safeNumber } from './numbers.js';

export function isWallbitCash(asset = {}) {
  return (
    (asset.source === 'wallbit' && asset.type === 'cash') ||
    asset.symbol === 'WALLBIT_CASH' ||
    asset.classification?.assetClass === 'cash'
  );
}

export function isReserveAsset(asset = {}) {
  return (
    asset.role === 'reserve' ||
    asset.type === 'cash' ||
    asset.classification?.assetClass === 'cash' ||
    asset.classification?.isInvestable === false
  );
}

// ── Cash de Wallbit: siempre a la par, sin P&L ──────────────

function normalizeWallbitCash(asset) {
  const cash = safeNumber(asset.valueUSD ?? asset.marketValueUSD ?? asset.quantity);

  return {
    ...asset,
    id: asset.id ?? 'wallbit-cash',
    name: asset.name ?? 'Wallbit Cash',
    symbol: asset.symbol ?? 'WALLBIT_CASH',
    source: 'wallbit',
    type: 'cash',
    role: 'reserve',
    quantity: cash,
    entryPrice: 1,
    marketPrice: 1,
    costBasisUSD: cash,
    marketValueUSD: cash,
    valueUSD: cash,
    unrealizedPnlUSD: 0,
    unrealizedPnlPct: 0,
    realizedPnlUSD: 0,
    pnlUSD: 0,
    pnlPct: 0,
    changePct: 0,
    classification: {
      ...(asset.classification ?? {}),
      role: 'reserve',
      assetClass: 'cash',
      isInvestable: false,
    },
    sourceMeta: {
      ...(asset.sourceMeta ?? {}),
      platform: 'wallbit',
      balanceType: 'cash',
      quantity: cash,
      entryPrice: 1,
      marketPrice: 1,
      costBasisUSD: cash,
      marketValueUSD: cash,
      unrealizedPnlUSD: 0,
      valuationStatus: 'cash_at_par',
    },
  };
}

// ── Resto de activos: costo, valor y P&L ────────────────────

function readMetrics(asset) {
  const quantity =
    pickNumber(asset, ['quantity', 'net_qty', 'netQty']) ??
    safeNumberOrNull(asset.sourceMeta?.balances?.total);

  const entryPrice = pickNumber(
    asset,
    ['entryPrice', 'entry_price', 'avgEntryPrice', 'avg_entry_price'],
    { positive: true },
  );
  const marketPrice = pickNumber(
    asset,
    ['marketPrice', 'market_price', 'priceUSD', 'price_usd', 'markPrice', 'mark_price', 'currentPrice', 'current_price'],
    { positive: true },
  );

  return {
    quantity,
    entryPrice,
    marketPrice,
    explicitCost: pickNumber(asset, ['costBasisUSD', 'cost_basis_usd']),
    explicitPnlUSD: pickNumber(asset, ['unrealizedPnlUSD', 'unrealized_pnl_usd', 'pnlUSD', 'pnl_usd']),
    explicitPnlPct: pickNumber(asset, [
      'unrealizedPnlPct', 'unrealized_pnl_pct', 'pnlPct', 'pnl_pct', 'changePct', 'change_pct',
    ]),
    realizedPnlUSD: pickNumber(asset, ['realizedPnlUSD', 'realized_pnl_usd']),
  };
}

function safeNumberOrNull(value) {
  return value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
    ? null
    : Number(value);
}

function normalizeTradedAsset(asset, index) {
  const m = readMetrics(asset);

  const costBasisUSD =
    m.explicitCost ??
    (m.quantity !== null && m.entryPrice !== null ? m.quantity * m.entryPrice : null);

  const rawValueUSD = safeNumber(asset.valueUSD ?? asset.marketValueUSD ?? asset.market_value_usd);
  const calculatedValue =
    m.quantity !== null && m.marketPrice !== null ? m.quantity * m.marketPrice : null;
  const marketValueUSD = calculatedValue ?? (rawValueUSD > 0 ? rawValueUSD : null);

  const unrealizedPnlUSD =
    m.explicitPnlUSD ??
    (marketValueUSD !== null && costBasisUSD !== null ? marketValueUSD - costBasisUSD : null);

  const unrealizedPnlPct =
    m.explicitPnlPct ??
    (unrealizedPnlUSD !== null && costBasisUSD > 0 ? (unrealizedPnlUSD / costBasisUSD) * 100 : null);

  const valueUSD = marketValueUSD ?? (rawValueUSD > 0 ? rawValueUSD : costBasisUSD ?? 0);
  const meta = asset.sourceMeta ?? {};

  return {
    ...asset,
    id: asset.id ?? `${asset.source ?? asset.groupKey ?? 'asset'}-${asset.symbol ?? asset.name ?? index}`,
    name: asset.name ?? asset.symbol ?? 'Activo',
    symbol: asset.symbol ?? asset.name ?? '—',
    source: asset.source ?? asset.groupKey ?? 'unknown',
    role: asset.classification?.role ?? asset.role ?? 'unclassified',
    type: asset.type ?? 'unknown',
    quantity: m.quantity,
    entryPrice: m.entryPrice,
    marketPrice: m.marketPrice,
    costBasisUSD,
    marketValueUSD,
    unrealizedPnlUSD,
    unrealizedPnlPct,
    realizedPnlUSD: m.realizedPnlUSD,
    valueUSD: safeNumber(valueUSD),
    weightPct: safeNumber(asset.weightPct ?? asset.weight),
    pnlUSD: unrealizedPnlUSD,
    pnlPct: unrealizedPnlPct,
    changePct: pickNumber(asset, ['changePct', 'change_pct']),
    sourceMeta: {
      ...meta,
      quantity: m.quantity,
      entryPrice: m.entryPrice,
      marketPrice: m.marketPrice,
      costBasisUSD,
      marketValueUSD,
      unrealizedPnlUSD,
      unrealizedPnlPct,
      realizedPnlUSD: m.realizedPnlUSD,
      entryPriceSource: asset.entryPriceSource ?? asset.entry_price_source ?? meta.entryPriceSource ?? meta.entry_price_source ?? null,
      entryPriceMethod: asset.entryPriceMethod ?? asset.entry_price_method ?? meta.entryPriceMethod ?? meta.entry_price_method ?? null,
      valuationStatus: asset.valuationStatus ?? asset.valuation_status ?? meta.valuationStatus ?? meta.valuation_status ?? null,
    },
  };
}

export function normalizeAsset(asset = {}, index = 0) {
  return isWallbitCash(asset) ? normalizeWallbitCash(asset) : normalizeTradedAsset(asset, index);
}
