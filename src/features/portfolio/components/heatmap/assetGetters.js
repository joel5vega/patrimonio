// src/features/portfolio/components/heatmap/assetGetters.js
import { firstFiniteNumber } from './format';

// ─── Getters de assets ──────────────────────────────────────

export function getRole(asset = {}) {
  return (
    asset.role ??
    asset.classification?.role ??
    'unclassified'
  );
}

export function getSector(asset = {}) {
  return (
    asset.sector ??
    asset.classification?.sector ??
    null
  );
}

export function getQuantity(asset = {}) {
  return firstFiniteNumber(
    asset.quantity,
    asset.net_qty,
    asset.netQty,
    asset.sourceMeta?.quantity,
    asset.sourceMeta?.balances?.total,
  );
}

export function getEntryPrice(asset = {}) {
  return firstFiniteNumber(
    asset.entryPrice,
    asset.entry_price,
    asset.avgEntryPrice,
    asset.avg_entry_price,
    asset.sourceMeta?.entryPrice,
    asset.sourceMeta?.entry_price,
    asset.sourceMeta?.avgEntryPrice,
    asset.sourceMeta?.avg_entry_price,
  );
}

export function getMarketPrice(asset = {}) {
  return firstFiniteNumber(
    asset.marketPrice,
    asset.market_price,
    asset.markPrice,
    asset.mark_price,
    asset.priceUSD,
    asset.price_usd,
    asset.currentPrice,
    asset.current_price,
    asset.sourceMeta?.marketPrice,
    asset.sourceMeta?.market_price,
    asset.sourceMeta?.markPrice,
    asset.sourceMeta?.mark_price,
    asset.sourceMeta?.priceUSD,
    asset.sourceMeta?.price_usd,
  );
}

export function getCostBasisUSD(asset = {}) {
  return firstFiniteNumber(
    asset.costBasisUSD,
    asset.cost_basis_usd,
    asset.sourceMeta?.costBasisUSD,
    asset.sourceMeta?.cost_basis_usd,
  );
}

export function getMarketValueUSD(asset = {}) {
  return firstFiniteNumber(
    asset.marketValueUSD,
    asset.market_value_usd,
    asset.sourceMeta?.marketValueUSD,
    asset.sourceMeta?.market_value_usd,
    asset.valueUSD,
  );
}

export function getUnrealizedPnlUSD(asset = {}) {
  return firstFiniteNumber(
    asset.unrealizedPnlUSD,
    asset.unrealized_pnl_usd,
    asset.pnlUSD,
    asset.pnl_usd,
    asset.sourceMeta?.unrealizedPnlUSD,
    asset.sourceMeta?.unrealized_pnl_usd,
    asset.sourceMeta?.pnlUSD,
    asset.sourceMeta?.pnl_usd,
  );
}

export function getUnrealizedPnlPct(asset = {}) {
  return firstFiniteNumber(
    asset.unrealizedPnlPct,
    asset.unrealized_pnl_pct,
    asset.pnlPct,
    asset.pnl_pct,
    asset.sourceMeta?.unrealizedPnlPct,
    asset.sourceMeta?.unrealized_pnl_pct,
    asset.sourceMeta?.pnlPct,
    asset.sourceMeta?.pnl_pct,
  );
}

export function getDailyChangePct(asset = {}) {
  return firstFiniteNumber(
    asset.dailyChangePct,
    asset.daily_change_pct,
    asset.changePct,
    asset.change_pct,
    asset.sourceMeta?.dailyChangePct,
    asset.sourceMeta?.daily_change_pct,
    asset.sourceMeta?.changePct,
    asset.sourceMeta?.change_pct,
  );
}

export function getEntryPriceConfidence(asset = {}) {
  return (
    asset.entryPriceConfidence ??
    asset.entry_price_confidence ??
    asset.sourceMeta?.entryPriceConfidence ??
    asset.sourceMeta?.entry_price_confidence ??
    null
  );
}

export function getQuantityDifference(asset = {}) {
  return firstFiniteNumber(
    asset.entryPriceMeta?.quantityDifference,
    asset.entry_price_meta?.quantity_difference,
    asset.sourceMeta?.entryPriceMeta?.quantityDifference,
    asset.sourceMeta?.entry_price_meta?.quantity_difference,
  );
}

export function getPerformance(asset = {}) {
  const quantity = getQuantity(asset);
  const entryPrice = getEntryPrice(asset);
  const marketPrice = getMarketPrice(asset);

  const explicitPnlUSD = getUnrealizedPnlUSD(asset);
  const explicitPnlPct = getUnrealizedPnlPct(asset);

  const calculatedCostBasis =
    quantity !== null &&
    entryPrice !== null &&
    entryPrice > 0
      ? quantity * entryPrice
      : null;

  const costBasisUSD =
    getCostBasisUSD(asset) ?? calculatedCostBasis;

  const calculatedMarketValue =
    quantity !== null &&
    marketPrice !== null &&
    marketPrice > 0
      ? quantity * marketPrice
      : null;

  const marketValueUSD =
    getMarketValueUSD(asset) ?? calculatedMarketValue;

  const pnlUSD =
    explicitPnlUSD ??
    (costBasisUSD !== null && marketValueUSD !== null
      ? marketValueUSD - costBasisUSD
      : null);

  const pnlPct =
    explicitPnlPct ??
    (pnlUSD !== null &&
    costBasisUSD !== null &&
    costBasisUSD > 0
      ? (pnlUSD / costBasisUSD) * 100
      : null);

  const dailyChangePct = getDailyChangePct(asset);
  const quantityDifference = getQuantityDifference(asset);

  const isPartial =
    getEntryPriceConfidence(asset) === 'partial' ||
    (quantityDifference !== null &&
      Math.abs(quantityDifference) > 1e-8);

  return {
    quantity,
    entryPrice,
    marketPrice,
    costBasisUSD,
    marketValueUSD,
    pnlUSD,
    pnlPct,
    dailyChangePct,
    quantityDifference,
    isPartial,
  };
}

// ─── Helpers de futuros ─────────────────────────────────────

export function getPositionSide(asset = {}) {
  return (
    asset.positionSide ??
    asset.sourceMeta?.positionSide ??
    null
  );
}

/**
 * Nocional real de un futuro.
 * NO hace fallback a marketValueUSD / valueUSD porque esos
 * campos existen también para spot y stablecoins.
 */
export function getNotionalUSD(asset = {}) {
  return firstFiniteNumber(
    asset.notionalUSD,
    asset.notional_usd,
    asset.sourceMeta?.notionalUSD,
    asset.sourceMeta?.notional_usd,
  );
}

export function getLeverage(asset = {}) {
  return firstFiniteNumber(
    asset.leverage,
    asset.sourceMeta?.leverage,
  );
}

export function getLiquidationDistancePct(asset = {}) {
  return firstFiniteNumber(
    asset.liquidationDistancePct,
    asset.sourceMeta?.liquidationDistancePct,
  );
}

/**
 * Detecta si un asset es un futuro/derivado real.
 *
 * Reglas (de más estricta a más laxa):
 *  1. type === "futures"  → sí
 *  2. positionSide LONG/SHORT  → sí
 *  3. groupKey de derivados explícitos (binance_usdm, bybit_usdm, ...)
 *     Y tiene notionalUSD real > 0
 *
 * NO se considera "bybit" ni "binance" como derivados por sí solos,
 * porque esos son también los groupKey de las cuentas spot.
 */
export function isFuturesAsset(asset = {}) {
  // Regla 1: type explícito
  if (asset.type === 'futures') {
    return true;
  }

  // Regla 2: posición con side
  const positionSide = getPositionSide(asset);
  if (positionSide === 'LONG' || positionSide === 'SHORT') {
    return true;
  }

  // Regla 3: groupKey de derivados explícitos + notional real
  const groupKey = String(asset.groupKey ?? '').toLowerCase();
  const source = String(asset.source ?? '').toLowerCase();

  const DERIVATIVES_GROUPS = new Set([
    'binance_usdm',
    'binanceusdm',
    'binance_futures',
    'bybit_usdm',
    'bybit_derivatives',
    'bybit_linear',
    'bybit_inverse',
  ]);

  const isDerivativesGroup =
    DERIVATIVES_GROUPS.has(groupKey) ||
    DERIVATIVES_GROUPS.has(source);

  if (!isDerivativesGroup) {
    return false;
  }

  const notionalUSD = getNotionalUSD(asset);
  return notionalUSD !== null && notionalUSD > 0;
}

export function getExchangeLabel(asset = {}) {
  const source = String(
    asset.source ?? asset.groupKey ?? '',
  ).toLowerCase();

  if (source.includes('bybit')) return 'Bybit';
  if (source.includes('binance')) return 'Binance';

  return source.toUpperCase() || 'EX';
}