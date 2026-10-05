// src/features/portfolio/components/PortfolioHeatmap.jsx
import { useMemo } from 'react';
import MarketHeatmap from './MarketHeatmap';

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function calculatePnlPct(asset) {
  const entryPrice = numberOrNull(asset.sourceMeta?.entryPrice);

  const currentPrice = numberOrNull(
    asset.sourceMeta?.marketPrice ??
    asset.sourceMeta?.priceUSD,
  );

  if (!entryPrice || entryPrice <= 0 || currentPrice == null) {
    return null;
  }

  return ((currentPrice - entryPrice) / entryPrice) * 100;
}

function normalizeAsset(asset) {
  const classification = asset.classification || {};
  const sourceMeta = asset.sourceMeta || {};

  const isPendingInvestmentCash =
    asset.source === "wallbit" &&
    (
      asset.type === "cash" ||
      asset.symbol === "WALLBIT_CASH" ||
      classification.assetClass === "cash"
    );

  const pnlPct = isPendingInvestmentCash
    ? 0
    : calculatePnlPct(asset);

  const isFutures = asset.type === "futures";

  return {
    ...asset,

    id:
      asset.id ||
      `${asset.source || "manual"}-${asset.symbol}`,

    symbol:
      isPendingInvestmentCash
        ? "WALLBIT_CASH"
        : asset.symbol || asset.name || "N/A",

    name:
      isPendingInvestmentCash
        ? "Pendiente de inversión"
        : asset.name ||
          asset.symbol ||
          "Activo sin nombre",

    valueUSD: Number(asset.valueUSD || 0),
    weightPct: Number(asset.weightPct || 0),

    role:
      isPendingInvestmentCash
        ? "reserve"
        : asset.role ||
          classification.role ||
          "unclassified",

    sector:
      classification.sector || "sin_sector",

    assetClass:
      isPendingInvestmentCash
        ? "cash"
        : classification.assetClass ||
          "sin_clase",

    riskLevel: Number(
      classification.riskLevel || 0,
    ),

    source:
      asset.source ||
      asset.groupKey ||
      "manual",

    type:
      isPendingInvestmentCash
        ? "cash"
        : asset.type || "other",

    ...(isFutures
      ? {}
      : {
          positionSide: null,
          notionalUSD: null,
          leverage: null,
          liquidationPrice: null,
          liquidationDistancePct: null,
          marginMode: null,
        }),

    quantity: isPendingInvestmentCash
      ? Number(asset.valueUSD || 0)
      : numberOrNull(sourceMeta.quantity),

    marketPrice: isPendingInvestmentCash
      ? 1
      : numberOrNull(
          sourceMeta.marketPrice ??
          sourceMeta.priceUSD,
        ),

    entryPrice: isPendingInvestmentCash
      ? 1
      : numberOrNull(sourceMeta.entryPrice),

    pnlUSD: isPendingInvestmentCash
      ? 0
      : numberOrNull(
          sourceMeta.unrealizedPnlUSD,
        ),

    pnlPct,

    isPendingInvestmentCash,

    isNeutral:
      isPendingInvestmentCash ||
      asset.type === "stablecoin" ||
      classification.assetClass === "efectivo" ||
      pnlPct === null,

    strategy: asset.strategy || {},
  };
}
export default function PortfolioHeatmap({
  assets = [],
  futuresAssets = [],
  bobRate,
}) {
  const normalizedAssets = useMemo(() => {
    return assets
      .filter((asset) => Number(asset?.valueUSD) > 0)
      .map(normalizeAsset);
  }, [assets]);

  const normalizedFutures = useMemo(() => {
    return futuresAssets
      .filter((asset) => {
        const notional =
          Number(asset.notionalUSD) ||
          Number(asset.sourceMeta?.notionalUSD) ||
          Number(asset.valueUSD);

        return Number.isFinite(notional) && notional > 0;
      })
      .map(normalizeAsset);
  }, [futuresAssets]);

  return (
    <MarketHeatmap
      assets={normalizedAssets}
      futuresAssets={normalizedFutures}
      bobRate={bobRate}
    />
  );
}