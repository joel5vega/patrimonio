import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, CircleAlert, Target } from 'lucide-react';
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

const STATUS_BY_DIFFERENCE = {
  critical: 'critical',
  warning: 'warning',
  ok: 'ok',
};

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getRowStatus(row) {
  if (STATUS_BY_DIFFERENCE[row.status]) return row.status;

  const current = toNumber(row.currentPct ?? row.current);
  const target = toNumber(row.targetPct ?? row.target);
  const difference = Math.abs(current - target);

  if (difference >= 5) return 'critical';
  if (difference >= 1) return 'warning';
  return 'ok';
}

function StatusIcon({ status }) {
  if (status === 'critical') {
    return <AlertTriangle size={16} aria-label="Crítico" />;
  }

  if (status === 'warning') {
    return <CircleAlert size={16} aria-label="Advertencia" />;
  }

  return <CheckCircle2 size={16} aria-label="Correcto" />;
}

function AllocationCard({ row }) {
  const color = ROLE_COLORS[row.role] || '#94a3b8';
  const current = toNumber(row.currentPct ?? row.current);
  const target = toNumber(row.targetPct ?? row.target);
  const difference = current - target;
  const status = getRowStatus(row);
  const currentWidth = Math.min(Math.max(current, 0), 100);
  const targetWidth = Math.min(Math.max(target, 0), 100);

  const action =
    status === 'ok'
      ? 'OK'
      : difference > 0
        ? `↓ Sobran ${Math.abs(difference).toFixed(1)}%`
        : `↑ Faltan ${Math.abs(difference).toFixed(1)}%`;

  return (
    <article className={`allocation-card allocation-card--${status}`}>
      <div className="allocation-card__header">
        <div className="allocation-card__title">
          <span
            className="allocation-card__dot"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <strong>{LABELS[row.role] || row.label || row.role}</strong>
        </div>

        <span className={`allocation-card__status allocation-card__status--${status}`}>
          <StatusIcon status={status} />
          {action}
        </span>
      </div>

      <div className="allocation-card__values">
        <span>Actual: {formatPct(current)}</span>
        <span>Objetivo: {formatPct(target)}</span>
      </div>

      <div className="allocation-card__bar" aria-label={`Actual ${current}%, objetivo ${target}%`}>
        <div
          className="allocation-card__target"
          style={{ width: `${targetWidth}%` }}
        />
        <div
          className="allocation-card__current"
          style={{ width: `${currentWidth}%`, backgroundColor: color }}
        />
      </div>

      {row.currentUSD != null && (
        <small className="allocation-card__amount">
          ${toNumber(row.currentUSD).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </small>
      )}
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
        ...item,
      }));
    }

    return [];
  }, [allocation]);

  const normalizedRows = useMemo(
    () =>
      rows
        .filter(Boolean)
        .map((row) => ({
          ...row,
          role: row.role || row.key,
          status: getRowStatus(row),
        })),
    [rows],
  );

  const groups = useMemo(
    () => ({
      critical: normalizedRows.filter((row) => row.status === 'critical'),
      warning: normalizedRows.filter((row) => row.status === 'warning'),
      ok: normalizedRows.filter((row) => row.status === 'ok'),
    }),
    [normalizedRows],
  );

  const renderGroup = (key, title, items) => {
    if (!items.length) return null;

    return (
      <section className={`allocation-group allocation-group--${key}`} key={key}>
        <div className="allocation-group__header">
          <h3>{title}</h3>
          <span>{items.length}</span>
        </div>

        <div className="allocation-group__items">
          {items.map((row) => (
            <AllocationCard
              key={row.key || row.role}
              row={row}
            />
          ))}
        </div>
      </section>
    );
  };

  if (!normalizedRows.length) {
    return (
      <section className="portfolio-allocation portfolio-allocation--empty">
        <Target size={18} />
        <p>No hay datos de asignación para mostrar.</p>
      </section>
    );
  }

  return (
    <section className="portfolio-allocation">
      <div className="portfolio-allocation__header">
        <div>
          <p className="portfolio-allocation__eyebrow">Portfolio</p>
          <h2>Rebalanceo</h2>
        </div>

        <div className="portfolio-allocation__summary" aria-label="Resumen de asignación">
          <span className="summary-badge summary-badge--critical">
            {groups.critical.length}
          </span>
          <span className="summary-badge summary-badge--warning">
            {groups.warning.length}
          </span>
          <span className="summary-badge summary-badge--ok">
            {groups.ok.length}
          </span>
        </div>
      </div>

      <div className="portfolio-allocation__groups">
        {renderGroup('critical', 'Urgente', groups.critical)}
        {renderGroup('warning', 'Ajuste', groups.warning)}
        {renderGroup('ok', 'OK', groups.ok)}
      </div>
    </section>
  );
}