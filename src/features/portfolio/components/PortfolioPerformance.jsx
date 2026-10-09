import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const DEFAULT_WINDOW_ORDER = ['1D', '7D', '30D'];
export const DEFAULT_WINDOW_LABELS = {
  '1D': '1D',
  '7D': '7D',
  '30D': '30D',
};

const formatUSD = (v) =>
  Number(v || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  });

const formatPct = (v) =>
  `${v >= 0 ? '+' : ''}${Number(v || 0).toFixed(1)}%`;

function PerformanceCell({ label, data }) {
  if (!data?.available) {
    return (
      <div className="perf-pill perf-pill--empty">
        <span className="perf-pill__label">{label}</span>
        <span className="perf-pill__muted">—</span>
      </div>
    );
  }

  const changeUSD = Number(data.performance?.cashFlowAdjustedChangeUSD ?? 0);
  const changePct = Number(data.performance?.netPerformancePct ?? 0);
  const isUp = changeUSD >= 0;

  return (
    <div className={`perf-pill ${isUp ? 'up' : 'down'}`} title={formatUSD(changeUSD)}>
      <span className="perf-pill__label">{label}</span>
      <span className="perf-pill__pct">
        {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
        {formatPct(changePct)}
      </span>
    </div>
  );
}

export default function PortfolioPerformance({
  historicalContext,
  windowOrder = DEFAULT_WINDOW_ORDER,
  windowLabels = DEFAULT_WINDOW_LABELS,
  className = '',
}) {
  const windows = historicalContext?.windows;
  if (!historicalContext?.available || !windows) return null;

  return (
    <div className={`perf-inline ${className}`.trim()}>
      {windowOrder.map((key) => (
        <PerformanceCell
          key={key}
          label={windowLabels[key] ?? key}
          data={windows[key]}
        />
      ))}
    </div>
  );
}