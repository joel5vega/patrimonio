// src/features/portfolio/components/PortfolioHeatmap.jsx
import { useMemo } from 'react';
import MarketHeatmap from './MarketHeatmap';

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function calculatePnlPct(asset) {
  // Soporta tanto sourceMeta (formato antiguo) como propiedades raíz (nuevo futuresMonitoring)
  const entryPrice = numberOrNull(
    asset.entryPrice ?? asset.sourceMeta?.entryPrice
  );
  const currentPrice = numberOrNull(
    asset.markPrice ??
    asset.sourceMeta?.marketPrice ??
    asset.sourceMeta?.priceUSD
  );

  if (!entryPrice || entryPrice <= 0 || currentPrice == null) {
    return null;
  }

  // Si ya viene calculado en el JSON (como unrealizedPnlPct), lo priorizamos
  if (asset.unrealizedPnlPct !== undefined) {
    return numberOrNull(asset.unrealizedPnlPct);
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

  // Detecta si es futuro ya sea por su tipo, o por la presencia de campos de futuros
  const isFutures = 
    asset.type === "futures" || 
    asset.positionSide !== undefined || 
    asset.leverage !== undefined;

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

    valueUSD: Number(asset.notionalUSD || asset.valueUSD || 0),
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

    type: isFutures ? "futures" : (isPendingInvestmentCash ? "cash" : (asset.type || "other")),

    ...(isFutures
      ? {
          positionSide: asset.positionSide || null,
          notionalUSD: numberOrNull(asset.notionalUSD),
          leverage: numberOrNull(asset.leverage),
          liquidationPrice: numberOrNull(asset.liquidationPrice),
          liquidationDistancePct: numberOrNull(asset.liquidationDistancePct),
          marginMode: asset.marginMode || null,
        }
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
      : numberOrNull(asset.quantity ?? sourceMeta.quantity),

    marketPrice: isPendingInvestmentCash
      ? 1
      : numberOrNull(
          asset.markPrice ??
          sourceMeta.marketPrice ??
          sourceMeta.priceUSD,
        ),

    entryPrice: isPendingInvestmentCash
      ? 1
      : numberOrNull(asset.entryPrice ?? sourceMeta.entryPrice),

    pnlUSD: isPendingInvestmentCash
      ? 0
      : numberOrNull(
          asset.unrealizedPnlUSD ??
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
  futuresMonitoring = null, // Recibimos el objeto completo en lugar de un array plano
  bobRate,
}) {
  const normalizedAssets = useMemo(() => {
    return assets
      .filter((asset) => Number(asset?.valueUSD) > 0)
      .map(normalizeAsset);
  }, [assets]);
  
  const normalizedFutures = useMemo(() => {
    // Extraemos las posiciones directamente de la agregación multiexchange
    const rawPositions = futuresMonitoring?.aggregated?.positions || [];
    return rawPositions
      .filter((asset) => {
        const notional =
          Number(asset.notionalUSD) ||
          Number(asset.sourceMeta?.notionalUSD) ||
          Number(asset.valueUSD);

        return Number.isFinite(notional) && notional > 0;
      })
      .map(normalizeAsset);
  }, [futuresMonitoring]);
  return (
    <MarketHeatmap
      assets={normalizedAssets}
      futuresAssets={normalizedFutures}
      bobRate={bobRate}
    />
  );
}