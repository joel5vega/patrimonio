// src/features/portfolio/hooks/portfolioData/futuresAssets.js
//
// Posiciones de futuros = las detectadas en `assets` + las que reporta el
// riesgo operativo (Binance/Bybit), sin duplicados.
// La detección usa la MISMA regla que el heatmap (assetGetters.isFuturesAsset).

import { isFuturesAsset } from '../../components/heatmap/assetGetters.js';
import { normalizeAsset } from './normalizeAsset.js';

const dedupeKey = (asset) =>
  [
    asset.source ?? asset.groupKey ?? 'unknown',
    asset.symbol ?? asset.name ?? 'unknown',
    asset.positionSide ?? '',
    asset.quantity ?? '',
    asset.entryPrice ?? '',
  ].join(':');

/** [{ positions, source, groupKey }] → activos normalizados */
function positionsFromRisk(operationalRisk = {}) {
  const binance = operationalRisk?.binance?.usdMFutures ?? {};
  const bybit = operationalRisk?.bybit?.futures ?? {};

  const groups = [
    { positions: binance.shortPositions, source: 'binance', groupKey: 'binance_usdm' },
    { positions: binance.longPositions, source: 'binance', groupKey: 'binance_usdm' },
    { positions: bybit.shortPositions, source: 'bybit', groupKey: 'bybit' },
    { positions: bybit.longPositions, source: 'bybit', groupKey: 'bybit' },
  ];

  return groups.flatMap(({ positions = [], source, groupKey }) =>
    positions.map((position) => {
      const withDefaults = {
        ...position,
        source: position.source ?? source,
        groupKey: position.groupKey ?? groupKey,
      };
      return normalizeAsset({
        ...withDefaults,
        id:
          position.id ??
          `${withDefaults.source}-${position.symbol}-${position.positionSide ?? ''}`,
      });
    }),
  );
}

export function extractFuturesAssets(assets = [], operationalRisk = {}) {
  const seen = new Set();

  return [...assets.filter(isFuturesAsset), ...positionsFromRisk(operationalRisk)].filter((asset) => {
    const key = dedupeKey(asset);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
