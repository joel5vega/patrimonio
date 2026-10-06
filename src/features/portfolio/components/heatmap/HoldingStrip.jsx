// src/features/portfolio/components/heatmap/HoldingStrip.jsx
//
// OPCIÓN 2: fila de mini-logos dentro del tile del ETF.
// Solo se dibuja en tiles grandes; en los pequeños devuelve null (sin ruido).
import React from 'react';
import HoldingLogo from './HoldingLogo';

const MIN_TILE_WIDTH = 150;
const MIN_TILE_HEIGHT = 110;
const SLOT_PX = 24;

/** Cuántos logos caben según el ancho del tile (0 = no mostrar). */
export function stripCapacity(width, height) {
  if (width < MIN_TILE_WIDTH || height < MIN_TILE_HEIGHT) return 0;
  return Math.min(6, Math.floor((width - 16) / SLOT_PX));
}

export default function HoldingStrip({ lookThrough, width, height, size = 18 }) {
  const count = stripCapacity(width, height);
  const holdings = lookThrough?.topHoldings?.slice(0, count) ?? [];
  if (!holdings.length) return null;

  return (
    <div className="hm-hold-strip">
      {holdings.map((h) => (
        <span key={h.symbol} title={`${h.symbol} · ${h.etfWeightPct.toFixed(1)}%`}>
          <HoldingLogo symbol={h.symbol} logoUrl={h.logoUrl} size={size} />
        </span>
      ))}
    </div>
  );
}
