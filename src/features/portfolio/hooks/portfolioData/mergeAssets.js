// src/features/portfolio/hooks/portfolioData/mergeAssets.js
//
// Combina los activos del análisis (backend) con los activos manuales vivos.
// Solo Quantfury se sobreescribe con el dato manual (más fresco); los
// manuales que el backend aún no conoce se agregan al final.

import { normalizeAsset } from './normalizeAsset.js';

const keyOf = (asset) => `${asset.source}:${asset.symbol}`;

function overrideWithManual(analyzed, manual) {
  return normalizeAsset({
    ...analyzed,
    ...manual,
    classification: manual.classification ?? analyzed.classification,
    strategy: manual.strategy ?? analyzed.strategy,
    sourceMeta: { ...analyzed.sourceMeta, ...manual.sourceMeta },
    valueUSD:
      manual.marketValueUSD ??
      manual.costBasisUSD ??
      manual.valueUSD ??
      analyzed.valueUSD,
  });
}

export function mergeAnalysisWithManual(analyzedAssets = [], manualAssets = []) {
  const analyzed = (Array.isArray(analyzedAssets) ? analyzedAssets : []).map(normalizeAsset);
  const manual = (Array.isArray(manualAssets) ? manualAssets : []).map(normalizeAsset);

  const manualById = new Map(manual.map((asset) => [asset.id, asset]));
  const manualByKey = new Map(manual.map((asset) => [keyOf(asset), asset]));

  const merged = analyzed.map((asset) => {
    const match = manualById.get(asset.id) ?? manualByKey.get(keyOf(asset));
    return asset.source === 'quantfury' && match ? overrideWithManual(asset, match) : asset;
  });

  const knownKeys = new Set(merged.map(keyOf));
  const onlyManual = manual.filter((asset) => !knownKeys.has(keyOf(asset)));

  return [...merged, ...onlyManual];
}
