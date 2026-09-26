// components/BinanceExposure.jsx
// Riesgo Binance — barra Spot/BUY/SELL + 4 stat cards + HHI/Top3
import React from 'react';

const fmt = (v, d = 2) => '$' + Number(v ?? 0).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Props:
 *   totalCryptoUSD  {number}
 *   reservedBUY     {number}
 *   pendingSELL     {number}
 *   grossExposure   {number}
 *   riskScore       {number}   0-100
 *   hhi             {number}
 *   top3Pct         {number}
 */
export default function BinanceExposure({
  totalCryptoUSD = 0,
  reservedBUY = 0,
  pendingSELL = 0,
  grossExposure = 0,
  riskScore = 0,
  hhi = 0,
  top3Pct = 0,
}) {
  const riskColor =
    riskScore >= 70 ? 'text-rose-400'
    : riskScore >= 40 ? 'text-yellow-400'
    : 'text-emerald-400';

  const riskStyle = {
    color: riskScore >= 70 ? '#fb7185' : riskScore >= 40 ? '#facc15' : '#34d399',
  };

  const spotPct   = grossExposure > 0 ? (totalCryptoUSD / grossExposure) * 100 : 0;
  const buyPct    = grossExposure > 0 ? (reservedBUY    / grossExposure) * 100 : 0;
  const sellPct   = grossExposure > 0 ? (pendingSELL    / grossExposure) * 100 : 0;

  return (
    <div>
      {/* Risk bar */}
      {grossExposure > 0 && (
        <>
          <div className="portfolio-riskbar">
            <div className="portfolio-riskbar-segment spot" style={{ width: `${spotPct}%` }} />
            <div className="portfolio-riskbar-segment buy"  style={{ width: `${buyPct}%`  }} />
            <div className="portfolio-riskbar-segment sell" style={{ width: `${sellPct}%` }} />
          </div>
          <div className="portfolio-risk-legend">
            <span><i className="spot" />Spot</span>
            <span><i className="buy" />Ord. BUY</span>
            <span><i className="sell" />Ord. SELL</span>
          </div>
        </>
      )}

      {/* 4 stat cards: Spot / BUY / SELL / Exposición */}
      <div className="portfolio-stats-grid four">
        <StatCard label="Spot"       value={fmt(totalCryptoUSD)} tone="text-white"      />
        <StatCard label="Ord. BUY"   value={fmt(reservedBUY)}    tone="text-yellow-400" />
        <StatCard label="Ord. SELL"  value={fmt(pendingSELL)}    tone="text-blue-400"   />
        <StatCard label="Exposición" value={fmt(grossExposure)}  tone="text-emerald-400"/>
      </div>

      {/* HHI + Top 3 */}
      <div className="portfolio-stats-grid two" style={{ marginTop: '0.75rem' }}>
        <StatCard label="HHI"        value={hhi.toFixed(4)}     tone="text-white" />
        <StatCard label="Top 3 conc." value={`${top3Pct.toFixed(1)}%`}
          tone={top3Pct >= 80 ? 'text-rose-400' : 'text-white'} />
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className="portfolio-stat-card">
      <p className="portfolio-stat-label">{label}</p>
      <p className={`portfolio-stat-value ${tone ?? ''}`}>{value}</p>
    </div>
  );
}
