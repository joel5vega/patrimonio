// src/features/portfolio/components/MarketHeatmap.jsx
//
// Heatmap tipo treemap: el área de cada rol y de cada activo es
// proporcional a su valor en USD. Flujo:
//   assets → enrich (valor + peso) → agrupar por rol → squarify → render absoluto
import React, { useEffect, useMemo, useRef } from 'react';
import { animate, stagger } from 'animejs';

import { useETFExposure } from '../hooks/useETFExposure';
import { firstFiniteNumber } from './heatmap/format';
import { getPerformance, getRole, isFuturesAsset } from './heatmap/assetGetters';
import {
  stageHeight,
  useContainerWidth,
  useTreemapLayout,
  useViewportHeight,
} from './heatmap/useTreemapLayout';
import RoleFrame from './heatmap/RoleFrame';
import HeatTile from './heatmap/HeatTile';
import FuturesBlock from './heatmap/FuturesBlock';

import '../styles/MarketHeatmap.css';

const EXCLUDED_ROLES = new Set(['reserve', 'patrimony']);

const valueOf = (asset) =>
  firstFiniteNumber(asset.marketValueUSD, asset.market_value_usd, asset.valueUSD) ?? 0;

const isInvestable = (asset) =>
  !isFuturesAsset(asset) &&
  !EXCLUDED_ROLES.has(getRole(asset)) &&
  !asset.locked &&
  valueOf(asset) > 1;

// Añade valueUSD y weightPct a cada activo.
function enrichAssets(assets) {
  const total = assets.reduce((sum, a) => sum + valueOf(a), 0);
  const enriched = assets.map((a) => ({
    ...a,
    valueUSD: valueOf(a),
    weightPct: total > 0 ? (valueOf(a) / total) * 100 : 0,
  }));
  return { enriched, total };
}

// Agrupa por rol y ordena de mayor a menor.
function groupByRole(assets) {
  const map = {};
  for (const asset of assets) {
    const key = getRole(asset);
    map[key] ??= { key, assets: [], total: 0 };
    map[key].assets.push(asset);
    map[key].total += asset.valueUSD;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// Contadores ▼ / ― / ▲ del encabezado.
function countPerformance(assets) {
  return assets.reduce(
    (stats, asset) => {
      const pnl = getPerformance(asset).pnlPct;
      if (pnl === null) stats.noData += 1;
      else if (pnl >= 0) stats.up += 1;
      else stats.down += 1;
      return stats;
    },
    { up: 0, down: 0, noData: 0 },
  );
}

export default function MarketHeatmap({ assets = [], futuresAssets = [] }) {
  const { data: etfData } = useETFExposure(assets);
  const [stageRef, width] = useContainerWidth();
  const viewportHeight = useViewportHeight();
  const height = stageHeight(width, viewportHeight);

  const { enriched, total } = useMemo(
    () => enrichAssets(assets.filter(isInvestable)),
    [assets],
  );
  const roles = useMemo(() => groupByRole(enriched), [enriched]);
  const stats = useMemo(() => countPerformance(enriched), [enriched]);
  const layout = useTreemapLayout(roles, width, height);

  // Animación de entrada, una sola vez cuando hay layout.
  const animated = useRef(false);
  useEffect(() => {
    if (animated.current || !layout.tiles.length || !stageRef.current) return;
    animated.current = true;
    animate(stageRef.current.querySelectorAll('.hm-role, .hm-tile'), {
      opacity: [0, 1],
      duration: 360,
      delay: stagger(18),
      ease: 'outExpo',
    });
  }, [layout.tiles.length, stageRef]);

  if (!enriched.length && !futuresAssets.length) return null;

  return (
    <div className="hm-container">
      <div className="hm-header">
        <span className="hm-title">Portafolio</span>
        <div className="hm-counts">
          {stats.down > 0 && <span className="hm-count red">▼ {stats.down}</span>}
          {stats.noData > 0 && <span className="hm-count neutral">― {stats.noData}</span>}
          {stats.up > 0 && <span className="hm-count green">▲ {stats.up}</span>}
        </div>
      </div>

      <div ref={stageRef} className="hm-stage" style={{ height: height || undefined }}>
        {layout.roles.map((role) => (
          <RoleFrame key={role.key} role={role} totalValueUSD={total} />
        ))}
        {layout.tiles.map((rect) => (
          <HeatTile
            key={rect.asset.id || rect.asset.symbol || rect.asset.name}
            rect={rect}
            etfData={etfData}
          />
        ))}
      </div>

      {futuresAssets.length > 0 && <FuturesBlock assets={futuresAssets} />}
    </div>
  );
}