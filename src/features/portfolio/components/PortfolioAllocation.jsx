import { useMemo } from 'react';
import { ROLE_COLORS } from '../constants/portfolioColors';
import { formatPct } from '../utils/portfolioFormatters';
import '../styles/portfolio.css';

const LABELS = {
  core: 'Core',
  growth: 'Growth',
  defensive: 'Defensive',
  liquidity: 'Liquidez',
  yield: 'Yield',
  speculative: 'Especulativo',
  trading: 'Trading',
};

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getRowStatus(row) {
  if (row.status === 'critical' || row.status === 'warning' || row.status === 'ok') {
    return row.status;
  }
  const current = toNumber(row.currentPct ?? row.current);
  const target = toNumber(row.targetPct ?? row.target);
  const difference = Math.abs(current - target);
  if (difference >= 5) return 'critical';
  if (difference >= 1) return 'warning';
  return 'ok';
}

function AllocationCard({ row }) {
  const color = ROLE_COLORS[row.role] || '#a4a19b';
  const current = toNumber(row.currentPct ?? row.current);
  const target = toNumber(row.targetPct ?? row.target);
  const difference = current - target;
  const status = getRowStatus(row);
  const currentWidth = Math.min(Math.max(current, 0), 100);
  const targetPos = Math.min(Math.max(target, 0), 100);

  const deltaLabel =
    status === 'ok'
      ? 'En rango'
      : difference > 0
        ? `+${Math.abs(difference).toFixed(1)}%`
        : `−${Math.abs(difference).toFixed(1)}%`;

  return (
    <article className={`alloc-card alloc-card--${status}`}>
      <header className="alloc-card__head">
        <div className="alloc-card__role">
          <span className="alloc-card__dot" style={{ background: color }} />
          <span className="alloc-card__name">
            {LABELS[row.role] || row.label || row.role}
          </span>
        </div>
        <span className={`alloc-card__delta alloc-card__delta--${status}`}>
          {deltaLabel}
        </span>
      </header>

      <div className="alloc-card__track" aria-hidden="true">
        <div
          className="alloc-card__fill"
          style={{ width: `${currentWidth}%`, background: color }}
        />
        <div
          className="alloc-card__marker"
          style={{ left: `${targetPos}%` }}
          title={`Objetivo ${formatPct(target)}`}
        />
      </div>

      <div className="alloc-card__meta">
        <span>
          <em>Actual</em> {formatPct(current)}
        </span>
        <span>
          <em>Objetivo</em> {formatPct(target)}
        </span>
        {row.currentUSD != null && (
          <span className="alloc-card__usd">
            $
            {toNumber(row.currentUSD).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        )}
      </div>
    </article>
  );
}

export default function PortfolioAllocation({ allocation }) {
  const rows = useMemo(() => {
    if (Array.isArray(allocation?.rows)) return allocation.rows;
    if (Array.isArray(allocation?.roles)) return allocation.roles;
    if (allocation?.byRole && typeof allocation.byRole === 'object') {
      return Object.entries(allocation.byRole).map(([role, item]) => ({
        role,
        ...(typeof item === 'object' && item !== null
          ? item
          : { currentPct: item }),
      }));
    }
    return [];
  }, [allocation]);

  const normalizedRows = useMemo(
    () =>
      rows.filter(Boolean).map((row) => ({
        ...row,
        role: row.role || row.key,
        status: getRowStatus(row),
      })),
    [rows],
  );

  const groups = useMemo(
    () => ({
      critical: normalizedRows.filter((r) => r.status === 'critical'),
      warning: normalizedRows.filter((r) => r.status === 'warning'),
      ok: normalizedRows.filter((r) => r.status === 'ok'),
    }),
    [normalizedRows],
  );

  const sections = [
    { key: 'critical', title: 'Urgente', items: groups.critical },
    { key: 'warning', title: 'Ajuste', items: groups.warning },
    { key: 'ok', title: 'En rango', items: groups.ok },
  ].filter((s) => s.items.length);

  if (!normalizedRows.length) {
    return (
      <section className="alloc-section alloc-section--empty">
        <p>No hay datos de asignación.</p>
      </section>
    );
  }

  return (
    <section className="alloc-section">
      <header className="alloc-section__header">
        <div>
          <p className="alloc-section__eyebrow">Portfolio</p>
          <h2 className="alloc-section__title">Rebalanceo</h2>
        </div>
        <div className="alloc-section__counts">
          {groups.critical.length > 0 && (
            <span className="alloc-count alloc-count--critical">
              {groups.critical.length} urgente
            </span>
          )}
          {groups.warning.length > 0 && (
            <span className="alloc-count alloc-count--warning">
              {groups.warning.length} ajuste
            </span>
          )}
          {groups.ok.length > 0 && (
            <span className="alloc-count alloc-count--ok">
              {groups.ok.length} ok
            </span>
          )}
        </div>
      </header>

      <div className="alloc-section__body">
        {sections.map((section) => (
          <div key={section.key} className={`alloc-group alloc-group--${section.key}`}>
            <h3 className="alloc-group__title">
              {section.title}
              <span>{section.items.length}</span>
            </h3>
            <div className="alloc-grid">
              {section.items.map((row) => (
                <AllocationCard key={row.key || row.role} row={row} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="alloc-legend">
        <span className="alloc-legend__swatch" /> Actual
        <span className="alloc-legend__marker" /> Objetivo
      </p>
    </section>
  );
}