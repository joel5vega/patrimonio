// src/features/portfolio/components/heatmap/TopHoldings.jsx
//
// OPCIÓN 1: sección "TOP HOLDINGS" del popup (hover), con logos.
// Lee `asset.lookThrough`, ya calculado por el backend.
import React from 'react';
import HoldingLogo from './HoldingLogo';

const pct = (n) => `${Number(n).toFixed(1)}%`;

export default function TopHoldings({ lookThrough, limit = 5 }) {
  const holdings = lookThrough?.topHoldings?.slice(0, limit) ?? [];
  if (!holdings.length) return null;

  const shownPct = holdings.reduce((sum, h) => sum + h.etfWeightPct, 0);

  return (
    <div className="hm-hold">
      <div className="hm-hold-head">
        <span>TOP HOLDINGS</span>
        <span>{pct(shownPct)}</span>
      </div>

      {holdings.map((h) => (
        <div className="hm-hold-row" key={h.symbol} title={h.name}>
          <HoldingLogo symbol={h.symbol} logoUrl={h.logoUrl} size={16} />
          <span className="hm-hold-symbol">{h.symbol}</span>
          <span className="hm-hold-name">{h.name}</span>
          <span className="hm-hold-weight">{pct(h.etfWeightPct)}</span>
        </div>
      ))}

      {lookThrough.expenseRatio != null && (
        <div className="hm-hold-head hm-hold-foot">
          <span>EXPENSE RATIO</span>
          <span>{Number(lookThrough.expenseRatio).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}
