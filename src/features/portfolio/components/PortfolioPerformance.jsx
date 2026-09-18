import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const WINDOW_LABELS = { '1D': '1D', '7D': '7D', '30D': '30D' };
const WINDOW_ORDER = ['1D', '7D', '30D'];

const formatUSD = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    signDisplay: 'always',
  });

const formatPct = (value) =>
  `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

function PerformanceCell({ label, data }) {
  if (!data?.available) {
    return (
      <div className="perf-cell perf-cell--empty">
        <span className="perf-cell__label">{label}</span>
        <span className="perf-cell__muted">Sin datos</span>
      </div>
    );
  }

  const changeUSD = Number(data.financial?.changeUSD || 0);
  const changePct = Number(data.financial?.changePct || 0);
  const netFlow = Number(data.cashFlows?.netUSD || 0);
  const hasFlow = Math.abs(netFlow) > 0.01;
  const isUp = changeUSD >= 0;

  return (
    <div className={`perf-cell ${isUp ? 'up' : 'down'}`}>
      <span className="perf-cell__label">{label}</span>
      <span className="perf-cell__pct">
        {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {formatPct(changePct)}
      </span>
      {/* <span className="perf-cell__usd">{formatUSD(changeUSD)}</span> */}
      {/* {hasFlow && <span className="perf-cell__flag">incl. aportes</span>} */}
    </div>
  );
}

export default function PortfolioPerformance({ historicalContext, className = '' }) {
  const windows = historicalContext?.windows;
  if (!historicalContext?.available || !windows) return null;

  return (
    <section className={`perf-strip ${className}`}>
      {WINDOW_ORDER.map((key) => (
        <PerformanceCell key={key} label={WINDOW_LABELS[key]} data={windows[key]} />
      ))}
    </section>
  );
}