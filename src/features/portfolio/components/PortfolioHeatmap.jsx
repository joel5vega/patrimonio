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

export default function PortfolioHeatmap({ assets = [], bobRate }) {
  const normalizedAssets = useMemo(() => {
    return assets
      .filter((asset) => Number(asset?.valueUSD) > 0)
      .map((asset) => {
        const classification = asset.classification || {};
        const sourceMeta = asset.sourceMeta || {};
        const pnlPct = calculatePnlPct(asset);

        return {
          ...asset,

          id: asset.id || `${asset.source || 'manual'}-${asset.symbol}`,
          symbol: asset.symbol || asset.name || 'N/A',
          name: asset.name || asset.symbol || 'Activo sin nombre',

          valueUSD: Number(asset.valueUSD || 0),
          weightPct: Number(asset.weightPct || 0),

          role: asset.role || classification.role || 'unclassified',
          sector: classification.sector || 'sin_sector',
          assetClass: classification.assetClass || 'sin_clase',
          riskLevel: Number(classification.riskLevel || 0),

          source: asset.source || asset.groupKey || 'manual',
          type: asset.type || 'other',

          quantity: numberOrNull(sourceMeta.quantity),
          marketPrice: numberOrNull(
            sourceMeta.marketPrice ?? sourceMeta.priceUSD,
          ),
          entryPrice: numberOrNull(sourceMeta.entryPrice),

          pnlUSD: numberOrNull(sourceMeta.unrealizedPnlUSD),
          pnlPct,

          isNeutral:
            asset.type === 'stablecoin' ||
            classification.assetClass === 'efectivo' ||
            pnlPct === null,

          strategy: asset.strategy || {},
        };
      });
  }, [assets]);

  return (
    <MarketHeatmap
      assets={normalizedAssets}
      bobRate={bobRate}
    />
  );
}