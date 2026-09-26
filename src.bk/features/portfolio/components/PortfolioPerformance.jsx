import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/** Ventanas de rendimiento por defecto (orden de visualización). */
export const DEFAULT_WINDOW_ORDER = ['1D', '7D', '30D'];

/** Etiquetas cortas por ventana. */
export const DEFAULT_WINDOW_LABELS = {
  '1D': '1D',
  '7D': '7D',
  '30D': '30D',
};

const formatUSD = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    signDisplay: 'always',
  });

const formatPct = (value) =>
  `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

/**
 * Celda de una ventana de performance.
 * Usa performance.cashFlowAdjusted* (ajustado por aportes/retiros),
 * no el delta bruto de saldo.
 */
function PerformanceCell({
  label,
  data,
  formatChangeUSD = formatUSD,
  formatChangePct = formatPct,
}) {
  if (!data?.available) {
    return (
      <div className="perf-cell perf-cell--empty">
        <span className="perf-cell__label">{label}</span>
        <span className="perf-cell__muted">Sin datos</span>
      </div>
    );
  }

  const changeUSD = Number(data.performance?.cashFlowAdjustedChangeUSD ?? 0);
  const changePct = Number(data.performance?.netPerformancePct ?? 0);
  const netFlow = Number(data.cashFlows?.netUSD || 0);
  const hasFlow = Math.abs(netFlow) > 0.01;
  const isUp = changeUSD >= 0;

  return (
    <div className={`perf-cell ${isUp ? 'up' : 'down'}`}>
      <span className="perf-cell__label">{label}</span>
      <span className="perf-cell__pct">
        {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {formatChangePct(changePct)}
      </span>
      <span className="perf-cell__usd">{formatChangeUSD(changeUSD)}</span>
      {hasFlow && <span className="perf-cell__flag">excl. aportes</span>}
    </div>
  );
}

/**
 * Franja de performance (1D / 7D / 30D).
 *
 * @param {object}   props
 * @param {object}   props.historicalContext  - { available, windows: { '1D'|..., ... } }
 * @param {string[]} [props.windowOrder]      - orden de columnas (default: 1D, 7D, 30D)
 * @param {object}   [props.windowLabels]     - mapa key → etiqueta visible
 * @param {function} [props.formatChangeUSD]  - formatter USD (opcional)
 * @param {function} [props.formatChangePct]  - formatter % (opcional)
 * @param {string}   [props.className]
 */
export default function PortfolioPerformance({
  historicalContext,
  windowOrder = DEFAULT_WINDOW_ORDER,
  windowLabels = DEFAULT_WINDOW_LABELS,
  formatChangeUSD,
  formatChangePct,
  className = '',
}) {
  const windows = historicalContext?.windows;
  if (!historicalContext?.available || !windows) return null;

  return (
    <section
      className={`perf-strip ${className}`}
      style={{
        // Parametrizable vía CSS vars o style override
        '--perf-cols': windowOrder.length,
      }}
    >
      {windowOrder.map((key) => (
        <PerformanceCell
          key={key}
          label={windowLabels[key] ?? key}
          data={windows[key]}
          formatChangeUSD={formatChangeUSD}
          formatChangePct={formatChangePct}
        />
      ))}
    </section>
  );
}