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

const ROLE_ORDER = [
  'core',
  'growth',
  'defensive',
  'liquidity',
  'yield',
  'speculative',
  'trading',
];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getRowStatus(row) {
  if (row.status === 'critical' || row.status === 'warning' || row.status === 'ok') {
    return row.status;
  }
  const current = toNumber(row.currentPct ?? row.current);
  const target = toNumber(row.targetPct ?? row.target);
  const diff = Math.abs(current - target);
  if (diff >= 5) return 'critical';
  if (diff >= 1) return 'warning';
  return 'ok';
}

function AllocationRow({ row }) {
  const color = ROLE_COLORS[row.role] || '#a4a19b';
  const current = toNumber(row.currentPct ?? row.current);
  const target = toNumber(row.targetPct ?? row.target);
  const diff = current - target;
  const status = getRowStatus(row);
  const fill = Math.min(Math.max(current, 0), 100);
  const mark = Math.min(Math.max(target, 0), 100);

  const delta =
    status === 'ok'
      ? 'OK'
      : `${diff > 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)}%`;

  return (
    <div className={`alloc-row alloc-row--${status}`}>
      <span className="alloc-row__dot" style={{ background: color }} />
      <span className="alloc-row__name">
        {LABELS[row.role] || row.label || row.role}
      </span>

      <div className="alloc-row__track" aria-hidden="true">
        <div
          className="alloc-row__fill"
          style={{ width: `${fill}%`, background: color }}
        />
        <div className="alloc-row__marker" style={{ left: `${mark}%` }} />
      </div>

      <span className="alloc-row__pcts">
        <b>{formatPct(current)}</b>
        <span>/ {formatPct(target)}</span>
      </span>

      <span className={`alloc-row__delta alloc-row__delta--${status}`}>
        {delta}
      </span>

      {row.currentUSD != null && (
        <span className="alloc-row__usd">
          $
          {toNumber(row.currentUSD).toLocaleString('en-US', {
            maximumFractionDigits: 0,
          })}
        </span>
      )}
    </div>
  );
}

export default function PortfolioAllocation({
  allocation,
  investorProfile = 'moderado',
  onProfileChange,
}) {
  const rows = useMemo(() => {
    if (Array.isArray(allocation)) return allocation;
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

  const normalized = useMemo(() => {
    const list = rows.filter(Boolean).map((row) => ({
      ...row,
      role: row.role || row.key,
      status: getRowStatus(row),
    }));

    // orden fijo por rol
    list.sort((a, b) => {
      const ia = ROLE_ORDER.indexOf(a.role);
      const ib = ROLE_ORDER.indexOf(b.role);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return list;
  }, [rows]);

  const counts = useMemo(
    () => ({
      critical: normalized.filter((r) => r.status === 'critical').length,
      warning: normalized.filter((r) => r.status === 'warning').length,
      ok: normalized.filter((r) => r.status === 'ok').length,
    }),
    [normalized],
  );

  return (
    <section className="alloc-section">
      <header className="alloc-section__header">
        <div>
          <p className="alloc-section__eyebrow">Portfolio</p>
          <h2 className="alloc-section__title">Asignación</h2>
        </div>

        <div className="alloc-section__controls">
          {onProfileChange && (
            <select
              className="alloc-profile-select"
              value={investorProfile}
              onChange={(e) => onProfileChange(e.target.value)}
              aria-label="Perfil de inversor"
            >
              <option value="defensivo">Defensivo</option>
              <option value="moderado">Moderado</option>
              <option value="crecimiento">Crecimiento</option>
              <option value="agresivo">Agresivo</option>
            </select>
          )}

          <div className="alloc-section__counts">
            {counts.critical > 0 && (
              <span className="alloc-count alloc-count--critical">
                {counts.critical}
              </span>
            )}
            {counts.warning > 0 && (
              <span className="alloc-count alloc-count--warning">
                {counts.warning}
              </span>
            )}
            {counts.ok > 0 && (
              <span className="alloc-count alloc-count--ok">{counts.ok}</span>
            )}
          </div>
        </div>
      </header>

      {!normalized.length ? (
        <div className="alloc-section--empty">Sin datos de asignación</div>
      ) : (
        <div className="alloc-list">
          <div className="alloc-list__head">
            <span />
            <span>Rol</span>
            <span className="alloc-list__head-track" />
            <span>Actual / Obj</span>
            <span>Δ</span>
            <span className="alloc-list__head-usd">USD</span>
          </div>

          {normalized.map((row) => (
            <AllocationRow key={row.key || row.role} row={row} />
          ))}
        </div>
      )}

      <p className="alloc-legend">
        <span className="alloc-legend__swatch" /> Actual
        <span className="alloc-legend__marker" /> Objetivo
        <span className="alloc-legend__hint">
          Rojo ≥5% · Amarillo ≥1% · Azul en rango
        </span>
      </p>
    </section>
  );
}