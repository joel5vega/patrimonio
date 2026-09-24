// src/pages/Dashboard/components/HeroCard.jsx
import { forwardRef } from 'react';
import { Wallet, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import AnimatedNumber from '../../../ui/AnimatedNumber';

const HeroCard = forwardRef(function HeroCard(
  { totalValue, usdValue, bobRate, pctCrypto, pctEtf, pctManual, isPositive, totalPnl, monthlyReturn },
  ref,
) {
  return (
    <div ref={ref} className="db-hero" style={{ opacity: 0 }}>
      <div className="db-hero-bg-glow" />

      <div className="db-hero-eyebrow"><Wallet size={13} /> Patrimonio Total</div>
      <div className="db-hero-main">
        <div className="db-hero-bs">
          Bs <AnimatedNumber value={totalValue} prefix="" decimals={2} className="db-hero-bs-num" />
        </div>
        <div className="db-hero-usd">
          <AnimatedNumber value={usdValue} prefix="$" decimals={1} className="db-hero-usd-num" />
          <span className="db-hero-usd-label">USD</span>
          <span className="db-hero-rate">Bs {bobRate ? bobRate.toFixed(2) : '0.00'}/USD</span>
        </div>
      </div>

      <div className="db-hero-alloc">
        <div className="db-alloc-bar">
          <div className="db-alloc-seg db-alloc-seg--crypto" style={{ width: `${pctCrypto}%` }} />
          <div className="db-alloc-seg db-alloc-seg--etf"    style={{ width: `${pctEtf}%` }} />
          <div className="db-alloc-seg db-alloc-seg--manual" style={{ width: `${pctManual}%` }} />
        </div>
        <div className="db-alloc-legend">
          <span className="db-alloc-dot db-alloc-dot--crypto" />
          <span className="db-alloc-lbl">Crypto {pctCrypto.toFixed(0)}%</span>
          <span className="db-alloc-dot db-alloc-dot--etf" />
          <span className="db-alloc-lbl">ETFs {pctEtf.toFixed(0)}%</span>
          <span className="db-alloc-dot db-alloc-dot--manual" />
          <span className="db-alloc-lbl">Manual {pctManual.toFixed(0)}%</span>
        </div>
      </div>

      <div className="db-hero-badges">
        <div className={`db-badge ${isPositive ? 'db-badge--up' : 'db-badge--down'}`}>
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {isPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)} P&amp;L
        </div>
        <div className="db-badge db-badge--teal">
          <Zap size={13} /> +{monthlyReturn}% este mes
        </div>
      </div>
    </div>
  );
});

export default HeroCard;
