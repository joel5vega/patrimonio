// useManualAssets.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeManualAssets,
  addManualAsset,
  removeManualAsset,
  updateManualAsset,
} from '../lib/firebase';

const DEFAULT_BOB_PER_USD = 10;

function toFiniteNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resolveManualValueUSD(asset, rate) {
  const marketValueUSD = toFiniteNumber(
    asset.market_value_usd ?? asset.marketValueUSD,
  );

  const costBasisUSD = toFiniteNumber(
    asset.cost_basis_usd ?? asset.costBasisUSD,
  );

  const notionalUSD = toFiniteNumber(
    asset.notional_usd ?? asset.notionalUSD,
  );

  const amountUSD = toFiniteNumber(
    asset.amount,
    0,
  );

  // Quantfury no tiene cotización dinámica aún. En ese caso se usa costo,
  // nunca el amount prorrateado que el importador usa para el equity.
  if (asset.source === 'quantfury') {
    return (
      marketValueUSD ??
      costBasisUSD ??
      notionalUSD ??
      amountUSD
    );
  }

  if (asset.currency === 'BOB') {
    return amountUSD / rate;
  }

  return marketValueUSD ?? amountUSD;
}

function normalizeManualAsset(asset, rate, index) {
  const sourceMeta = asset.sourceMeta ?? {};

  const quantity = toFiniteNumber(
    asset.quantity ??
      asset.net_qty ??
      asset.netQty ??
      sourceMeta.quantity,
  );

  const entryPrice = toFiniteNumber(
    asset.entryPrice ??
      asset.entry_price ??
      asset.avgEntryPrice ??
      asset.avg_entry_price ??
      sourceMeta.entryPrice ??
      sourceMeta.entry_price ??
      sourceMeta.avgEntryPrice ??
      sourceMeta.avg_entry_price,
  );

  const marketPrice = toFiniteNumber(
    asset.marketPrice ??
      asset.market_price ??
      sourceMeta.marketPrice ??
      sourceMeta.market_price,
  );

  const costBasisUSD = toFiniteNumber(
    asset.costBasisUSD ??
      asset.cost_basis_usd ??
      sourceMeta.costBasisUSD ??
      sourceMeta.cost_basis_usd,
  );

  const marketValueUSD = toFiniteNumber(
    asset.marketValueUSD ??
      asset.market_value_usd ??
      sourceMeta.marketValueUSD ??
      sourceMeta.market_value_usd,
  );

  const realizedPnlUSD = toFiniteNumber(
    asset.realizedPnlUSD ??
      asset.realized_pnl_usd ??
      sourceMeta.realizedPnlUSD ??
      sourceMeta.realized_pnl_usd,
  );

  const explicitUnrealizedPnlUSD = toFiniteNumber(
    asset.unrealizedPnlUSD ??
      asset.unrealized_pnl_usd ??
      sourceMeta.unrealizedPnlUSD ??
      sourceMeta.unrealized_pnl_usd,
  );

  const explicitUnrealizedPnlPct = toFiniteNumber(
    asset.unrealizedPnlPct ??
      asset.unrealized_pnl_pct ??
      sourceMeta.unrealizedPnlPct ??
      sourceMeta.unrealized_pnl_pct,
  );

  const valueUSD = resolveManualValueUSD(asset, rate);

  const computedMarketValueUSD =
    marketValueUSD ??
    (quantity !== null && marketPrice !== null
      ? quantity * marketPrice
      : null);

  const computedCostBasisUSD =
    costBasisUSD ??
    (quantity !== null && entryPrice !== null
      ? quantity * entryPrice
      : null);

  const unrealizedPnlUSD =
    explicitUnrealizedPnlUSD ??
    (computedMarketValueUSD !== null && computedCostBasisUSD !== null
      ? computedMarketValueUSD - computedCostBasisUSD
      : null);

  const unrealizedPnlPct =
    explicitUnrealizedPnlPct ??
    (unrealizedPnlUSD !== null && computedCostBasisUSD !== null && computedCostBasisUSD > 0
      ? (unrealizedPnlUSD / computedCostBasisUSD) * 100
      : null);

  return {
    ...asset,

    id: asset.id ?? `${asset.source ?? 'manual'}-${asset.symbol ?? asset.name ?? index}`,
    name: asset.name ?? asset.symbol ?? 'Activo manual',
    symbol: asset.symbol ?? asset.name ?? '—',
    source: asset.source ?? asset.groupKey ?? 'manual',
    groupKey: asset.groupKey ?? asset.source ?? 'manual',
    type: asset.type ?? 'manual',

    // Campos comunes para el portfolio y MarketHeatmap.
    quantity,
    entryPrice,
    marketPrice,
    costBasisUSD: computedCostBasisUSD,
    marketValueUSD: computedMarketValueUSD,
    unrealizedPnlUSD,
    unrealizedPnlPct,
    realizedPnlUSD,

    valueUSD,
    valueBOB: valueUSD * rate,
    since: asset.since ?? null,

    // Mantiene el mismo contrato que usan los assets de Admirals/Binance.
    sourceMeta: {
      ...sourceMeta,
      quantity,
      entryPrice,
      marketPrice,
      costBasisUSD: computedCostBasisUSD,
      marketValueUSD: computedMarketValueUSD,
      unrealizedPnlUSD,
      unrealizedPnlPct,
      realizedPnlUSD,
      entryPriceSource:
        asset.entryPriceSource ??
        asset.entry_price_source ??
        sourceMeta.entryPriceSource ??
        sourceMeta.entry_price_source ??
        null,
      entryPriceMethod:
        asset.entryPriceMethod ??
        asset.entry_price_method ??
        sourceMeta.entryPriceMethod ??
        sourceMeta.entry_price_method ??
        null,
      valuationStatus:
        asset.valuationStatus ??
        asset.valuation_status ??
        sourceMeta.valuationStatus ??
        sourceMeta.valuation_status ??
        (asset.source === 'quantfury' ? 'cost_basis_only' : null),
    },
  };
}

export function useManualAssets(bobRate = DEFAULT_BOB_PER_USD) {
  const { user } = useAuth();
  const [rawAssets, setRawAssets] = useState([]);

  useEffect(() => {
    if (!user) {
      setRawAssets([]);
      return undefined;
    }

    const unsub = subscribeManualAssets(user.uid, setRawAssets);
    return () => unsub();
  }, [user]);

  const rate = bobRate || DEFAULT_BOB_PER_USD;

  const manualAssets = useMemo(
    () => rawAssets.map((asset, index) => normalizeManualAsset(asset, rate, index)),
    [rawAssets, rate],
  );

  const totalManualUSD = useMemo(
    () => manualAssets.reduce(
      (sum, asset) => sum + toFiniteNumber(asset.valueUSD, 0),
      0,
    ),
    [manualAssets],
  );

  const recalcTotal = useCallback(
    (assets) => assets.reduce(
      (sum, asset) => sum + resolveManualValueUSD(asset, rate),
      0,
    ),
    [rate],
  );

  const addAsset = useCallback(
    async (asset) => {
      if (!user) return;

      await addManualAsset(user.uid, {
        name: String(asset.name || '').trim(),
        type: asset.type ?? 'manual',
        currency: asset.currency ?? 'USD',
        amount: parseFloat(asset.amount),
        note: asset.note || '',
        since: asset.since ?? new Date().toISOString().split('T')[0],
      });
    },
    [user],
  );

  const removeAsset = useCallback(
    async (id) => {
      if (!user) return;
      await removeManualAsset(user.uid, id);
    },
    [user],
  );

  const updateAsset = useCallback(
    async (id, updates) => {
      if (!user) return;

      await updateManualAsset(user.uid, id, {
        ...updates,
        type: updates.type ?? 'manual',
        amount: parseFloat(updates.amount),
        since: updates.since ?? new Date().toISOString().split('T')[0],
      });
    },
    [user],
  );

  return {
    manualAssets,
    totalManualUSD,
    BOB_PER_USD: rate,
    recalcTotal,
    addAsset,
    removeAsset,
    updateAsset,
  };
}