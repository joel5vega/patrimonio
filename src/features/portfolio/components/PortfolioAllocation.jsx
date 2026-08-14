import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, CircleAlert, Target } from 'lucide-react';
import { ROLE_COLORS } from '../constants/portfolioColors';
import { formatPct } from '../utils/portfolioFormatters';

const LABELS = { core: 'Core', growth: 'Growth', defensive: 'Defensive', liquidity: 'Liquidez', yield: 'Yield', speculative: 'Speculativo', trading: 'Trading' };

function StatusIcon({ status }) {
  if (status === 'critical') return <CircleAlert size={13} />;
  if (status === 'warning') return <AlertTriangle size={13} />;
  return <CheckCircle2 size={13} />;
}

function AllocationCard({ row }) {
  const color = ROLE_COLORS[row.role] || '#94a3b8';
  const current = Number(row.currentPct || 0);
  const target = Number(row.targetPct || 0);
  const difference = current - target;
  const currentWidth = Math.min(Math.max(current, 0), 100);
  const targetWidth = Math.min(Math.max(target, 0), 100);
  const action = row.status === 'ok'
    ? 'OK'
    : difference > 0
      ? `↓ Sobran ${Math.abs(difference).toFixed(1)}%`
      : `↑ Faltan ${Math.abs(difference).toFixed(1)}%`;

  return (
    <article className={`portfolio-target-card ${row.status}`}>
      <header className="portfolio-target-card-head">
        <div className="portfolio-target-name" style={{ color }}>
          <span className="portfolio-target-dot" style={{ background: color }} />
          {LABELS[row.role] || row.role}
        </div>
        <div className="portfolio-target-values">
          <strong>{formatPct(current)}</strong>
          <span>{formatPct(target)} meta</span>
        </div>
      </header>
      <div className="portfolio-target-track">
        <span className="portfolio-target-fill" style={{ width: `${currentWidth}%`, background: color }} />
        <span className="portfolio-target-zone" style={{ left: `${Math.max(0, targetWidth - 3)}%`, width: '6%' }} />
        <span className="portfolio-target-marker" style={{ left: `${targetWidth}%` }} />
      </div>
      <footer className="portfolio-target-card-foot"><span>0</span><span style={{ color }}>{formatPct(target)}</span><span>100</span></footer>
      <div className="portfolio-target-action" style={{ color: row.status === 'critical' ? '#fb7185' : row.status === 'warning' ? '#facc15' : '#34d399' }}><StatusIcon status={row.status} />{action}</div>
    </article>
  );
}

export default function PortfolioAllocation({ allocation }) {
  const rows = useMemo(() => {
    if (Array.isArray(allocation?.rows)) return allocation.rows;
    return Object.entries(allocation?.byRole || {}).map(([role, item]) => ({ role, ...item }));
  }, [allocation]);

  const groups = useMemo(() => ({
    critical: rows.filter((row) => row.status === 'critical'),
    warning: rows.filter((row) => row.status === 'warning'),
    ok: rows.filter((row) => row.status === 'ok'),
  }), [rows]);

  const renderGroup = (key, title, items) => {
    if (!items.length) return null;
    return <section className={`portfolio-target-group ${key}`}><h3><StatusIcon status={key} />{title}<span>{items.length}</span></h3><div className="portfolio-target-grid">{items.map((row) => <AllocationCard key={row.role} row={row} />)}</div></section>;
  };

  return (
    <section className="portfolio-card portfolio-allocation">
      <div className="portfolio-section-head"><div><span className="portfolio-eyebrow">Rebalanceo</span><h2 className="portfolio-section-title">Asignación</h2></div><Target size={18} className="portfolio-section-icon" /></div>
      <div className="portfolio-target-summary"><span className="critical"><CircleAlert size={12} />{groups.critical.length}</span><span className="warning"><AlertTriangle size={12} />{groups.warning.length}</span><span className="ok"><CheckCircle2 size={12} />{groups.ok.length}</span></div>
      <div className="portfolio-target-groups">{renderGroup('critical', 'Urgente', groups.critical)}{renderGroup('warning', 'Ajuste', groups.warning)}{renderGroup('ok', 'OK', groups.ok)}</div>
    </section>
  );
}