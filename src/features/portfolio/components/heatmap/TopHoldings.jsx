// TopHoldings.jsx — versión más compacta
import React from 'react';
import HoldingLogo from './HoldingLogo';

const pct = (n) => `${Number(n).toFixed(1)}%`;

/** Nombre legible y corto para el tooltip */
function friendlyLabel(h) {
  if (h.alias) return h.alias;
  const name = String(h.name || '').trim();
  if (!name) return h.symbol;

  // Acortar nombres corporativos típicos
  const short = name
    .replace(/\b(Inc\.?|Corp\.?|Co\.?|Ltd\.?|Limited|Holdings?|N\.?V\.?|S\.?A\.?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Si queda muy largo, cortar por palabra
  if (short.length > 22) {
    const cut = short.slice(0, 22).replace(/\s+\S*$/, '');
    return cut || short.slice(0, 20);
  }
  return short || h.symbol;
}

export default function TopHoldings({ lookThrough, limit = 5 }) {
  const holdings = lookThrough?.topHoldings?.slice(0, limit) ?? [];
  if (!holdings.length) return null;

  const shownPct = holdings.reduce((sum, h) => sum + (h.etfWeightPct || 0), 0);

  return (
    <div className="hm-hold">
      <div className="hm-hold__head">
        <span>Top holdings</span>
        <span className="hm-hold__total">{pct(shownPct)}</span>
      </div>

      <div className="hm-hold__list">
        {holdings.map((h) => (
          <div
            className="hm-hold__row"
            key={h.symbol}
            title={`${h.name || h.symbol} · ${h.symbol}`}
          >
            <HoldingLogo symbol={h.symbol} logoUrl={h.logoUrl} size={20} />
            <span className="hm-hold__name">{friendlyLabel(h)}</span>
            <span className="hm-hold__weight">{pct(h.etfWeightPct)}</span>
          </div>
        ))}
      </div>

      {lookThrough.expenseRatio != null && (
        <div className="hm-hold__foot">
          <span>Expense ratio</span>
          <span>{Number(lookThrough.expenseRatio).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}