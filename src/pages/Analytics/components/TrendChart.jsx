import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from '../Analytics.module.css';

const SERIES = [
  { key: 'income', label: 'Ingresos', color: '#2b7fff' },
  { key: 'expenses', label: 'Consumo', color: '#e05a68' },
  { key: 'investments', label: 'Inversión', color: '#8f78d8' },
];

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

function buildPath(points) {
  if (!points.length) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

function buildArea(points, baselineY) {
  if (!points.length) return '';
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(1)} ${baselineY} L ${first.x.toFixed(1)} ${baselineY} Z`;
}

export default function TrendChart({ trend = [] }) {
  const [open, setOpen] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);

  const chart = useMemo(() => {
    const W = 640;
    const H = 180;
    const padL = 8;
    const padR = 8;
    const padT = 16;
    const padB = 28;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const max = Math.max(
      ...trend.map((m) =>
        Math.max(
          Number(m.income || 0),
          Number(m.expenses || 0),
          Number(m.investments || 0),
        ),
      ),
      1,
    );

    const n = Math.max(trend.length, 1);
    const step = n === 1 ? 0 : innerW / (n - 1);

    const seriesPoints = {};
    for (const s of SERIES) {
      seriesPoints[s.key] = trend.map((m, i) => {
        const value = Number(m[s.key] || 0);
        const x = padL + (n === 1 ? innerW / 2 : i * step);
        const y = padT + innerH - (value / max) * innerH;
        return { x, y, value };
      });
    }

    const labels = trend.map((m, i) => ({
      x: padL + (n === 1 ? innerW / 2 : i * step),
      label: m.label,
      net: Number(m.netCashflow || 0),
      key: m.key || m.label || i,
    }));

    return { W, H, padT, padB, padL, max, seriesPoints, labels, baselineY: padT + innerH };
  }, [trend]);

  if (!trend.length) {
    return (
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Evolución mensual</h2>
            <p className={styles.sectionHint}>Sin datos para graficar</p>
          </div>
        </div>
      </section>
    );
  }

  const active = hoverIndex != null ? trend[hoverIndex] : null;

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Evolución mensual</h2>
          <p className={styles.sectionHint}>
            {trend.length} meses · ingresos, consumo e inversión
          </p>
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Ocultar gráfico' : 'Mostrar gráfico'}
        >
          {open ? (
            <>
              Ocultar <ChevronUp size={14} />
            </>
          ) : (
            <>
              Mostrar <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {open && (
        <>
          <div className={styles.trendLegend}>
            {SERIES.map((s) => (
              <span key={s.key}>
                <i style={{ background: s.color, width: 10, height: 2, borderRadius: 1 }} />
                {s.label}
              </span>
            ))}
          </div>

          {active && (
            <div className={styles.trendTooltip}>
              <strong className={styles.trendTooltipMonth}>{active.label}</strong>
              <span style={{ color: '#2b7fff' }}>Ing. {money(active.income)}</span>
              <span style={{ color: '#e05a68' }}>Cons. {money(active.expenses)}</span>
              <span style={{ color: '#8f78d8' }}>Inv. {money(active.investments)}</span>
              <span
                className={
                  active.netCashflow >= 0 ? styles.netPositive : styles.netNegative
                }
              >
                Neto{' '}
                {active.netCashflow >= 0 ? '+' : '−'}
                {Math.abs(active.netCashflow).toLocaleString('es-BO', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}

          <div className={styles.lineChartWrap}>
            <svg
              viewBox={`0 0 ${chart.W} ${chart.H}`}
              className={styles.lineChartSvg}
              role="img"
              aria-label="Evolución mensual de ingresos, consumo e inversión"
            >
              {/* grid */}
              {[0.25, 0.5, 0.75, 1].map((t) => {
                const y = chart.baselineY - t * (chart.baselineY - chart.padT);
                return (
                  <line
                    key={t}
                    x1={chart.padL}
                    x2={chart.W - 8}
                    y1={y}
                    y2={y}
                    stroke="#262626"
                    strokeWidth="1"
                  />
                );
              })}

              {/* soft area under income */}
              <path
                d={buildArea(chart.seriesPoints.income, chart.baselineY)}
                fill="rgba(43, 127, 255, 0.08)"
              />

              {SERIES.map((s) => (
                <path
                  key={s.key}
                  d={buildPath(chart.seriesPoints[s.key])}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* hover targets + dots */}
              {chart.labels.map((lbl, i) => (
                <g key={lbl.key}>
                  <line
                    x1={lbl.x}
                    x2={lbl.x}
                    y1={chart.padT}
                    y2={chart.baselineY}
                    stroke={hoverIndex === i ? '#323232' : 'transparent'}
                    strokeWidth="1"
                  />
                  {SERIES.map((s) => {
                    const p = chart.seriesPoints[s.key][i];
                    return (
                      <circle
                        key={s.key}
                        cx={p.x}
                        cy={p.y}
                        r={hoverIndex === i ? 3.5 : 2.25}
                        fill={s.color}
                        opacity={hoverIndex === i ? 1 : 0.85}
                      />
                    );
                  })}
                  {/* hit area */}
                  <rect
                    x={lbl.x - (chart.W / Math.max(trend.length, 1)) / 2}
                    y={0}
                    width={chart.W / Math.max(trend.length, 1)}
                    height={chart.H}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                    onFocus={() => setHoverIndex(i)}
                    onBlur={() => setHoverIndex(null)}
                  />
                  <text
                    x={lbl.x}
                    y={chart.H - 8}
                    textAnchor="middle"
                    fill="#5e5d59"
                    fontSize="10"
                    style={{ textTransform: 'capitalize' }}
                  >
                    {lbl.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </>
      )}
    </section>
  );
}