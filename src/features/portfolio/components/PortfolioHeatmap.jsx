// src/features/portfolio/components/PortfolioHeatmap.jsx
import { useMemo } from 'react';
import MarketHeatmap from './MarketHeatmap';

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n)? n : null;
}

function calculatePnlPct(asset) {
  if (asset.unrealizedPnlPct!== undefined) {
    return numberOrNull(asset.unrealizedPnlPct);
  }
  const entry = numberOrNull(asset.entryPrice?? asset.sourceMeta?.entryPrice);
  const current = numberOrNull(
    asset.markPrice?? asset.sourceMeta?.marketPrice?? asset.sourceMeta?.priceUSD
  );
  if (!entry || entry <= 0 || current == null) return null;
  return ((current - entry) / entry) * 100;
}

function normalizeAsset(asset) {
  const c = asset.classification || {};
  const meta = asset.sourceMeta || {};

  const isFutures =
    asset.type === "futures" ||
    asset.positionSide!== undefined ||
    asset.leverage!== undefined;

  return {
   ...asset,
    id: asset.id || `${asset.source || "manual"}-${asset.symbol}`,
    symbol: asset.symbol || asset.name || "N/A",
    name: asset.name || asset.symbol || "Activo sin nombre",

    valueUSD: Number(asset.valueUSD || asset.notionalUSD || 0),
    weightPct: Number(asset.weightPct || 0),

    role: asset.role || c.role || "unclassified",
    sector: c.sector || "sin_sector",
    assetClass: c.assetClass || "sin_clase",
    riskLevel: Number(c.riskLevel || 0),
    source: asset.source || asset.groupKey || "manual",
    type: asset.type || (isFutures? "futures" : "other"),

    // Futuros
    positionSide: isFutures? asset.positionSide || null : null,
    notionalUSD: isFutures? numberOrNull(asset.notionalUSD) : null,
    leverage: isFutures? numberOrNull(asset.leverage) : null,
    liquidationPrice: isFutures? numberOrNull(asset.liquidationPrice) : null,
    liquidationDistancePct: isFutures? numberOrNull(asset.liquidationDistancePct) : null,
    marginMode: isFutures? asset.marginMode || null : null,

    // Precios
    quantity: numberOrNull(asset.quantity?? meta.quantity),
    marketPrice: numberOrNull(asset.markPrice?? meta.marketPrice?? meta.priceUSD),
    entryPrice: numberOrNull(asset.entryPrice?? meta.entryPrice),
    pnlUSD: numberOrNull(asset.unrealizedPnlUSD?? meta.unrealizedPnlUSD),
    pnlPct: calculatePnlPct(asset),

    // Flags genéricos, sin lógica de Wallbit/USDT
    isNeutral: c.assetClass === "efectivo" || asset.type === "cash" || asset.type === "stablecoin",
  };
}

export default function PortfolioHeatmap({
  assets = [],
  futuresMonitoring = null,
  bobRate,
  historicalContext = null,
  decisionSupport = null,
}) {
  const normalizedAssets = useMemo(() => {
    return assets
     .filter((a) => Number(a?.valueUSD) > 0)
     .map(normalizeAsset);
  }, [assets]);

  const normalizedFutures = useMemo(() => {
    const raw = futuresMonitoring?.aggregated?.positions || [];
    return raw
     .filter((a) => {
        const n = Number(a.notionalUSD) || Number(a.sourceMeta?.notionalUSD) || Number(a.valueUSD);
        return Number.isFinite(n) && n > 0;
      })
     .map(normalizeAsset);
  }, [futuresMonitoring]);

  return (
    <MarketHeatmap
      assets={normalizedAssets}
      futuresAssets={normalizedFutures}
      bobRate={bobRate}
      historicalContext={historicalContext}
      decisionSupport={decisionSupport}
    />
  );
}