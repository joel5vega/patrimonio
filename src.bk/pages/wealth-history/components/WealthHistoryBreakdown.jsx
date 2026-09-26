import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatUSD } from '../wealthHistory.helpers';

export default function WealthHistoryBreakdown({ rows, totalUSD, previous, visible, onToggle, bobRate }) {
  return <div className="wh-breakdown-section">
    <p className="wh-section-label">Desglose actual</p>
    {rows.filter((row) => row.valueUSD > 0).map((row) => {
      const old = previous?.[row.key]; const diff = old == null ? null : row.valueUSD - old;
      const pct = old ? (diff / old) * 100 : null; const up = diff >= 0;
      return <div key={row.key} className={`wh-breakdown-row ${visible[row.key] ? 'wh-breakdown-row--active' : ''}`} style={{ '--row-color': row.color }} onClick={() => onToggle(row.key)}>
        <div className="wh-breakdown-top"><div className="wh-breakdown-left"><span className="wh-breakdown-dot" style={{ backgroundColor: row.color }} /><div><p className="wh-breakdown-label">{row.label}</p>{row.since && <p className="wh-breakdown-since">desde {row.since}</p>}</div><span className="wh-breakdown-badge" style={{ background: `${row.color}33`, color: row.color }}>en gráfico</span></div><div className="wh-breakdown-right"><p className="wh-breakdown-usd">{formatUSD(row.valueUSD)}</p><p className="wh-breakdown-bs">Bs {(row.valueUSD * bobRate).toLocaleString('es-BO', { maximumFractionDigits: 0 })}</p><p className="wh-breakdown-pct">{totalUSD ? ((row.valueUSD / totalUSD) * 100).toFixed(1) : 0}%</p></div></div>
        <div className="wh-breakdown-bar-track"><div className="wh-breakdown-bar-fill" style={{ width: `${totalUSD ? Math.min((row.valueUSD / totalUSD) * 100, 100) : 0}%`, background: row.color }} /></div>
        {diff != null && <div className={`wh-breakdown-delta ${up ? 'wh-delta-up' : 'wh-delta-down'}`}>{up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}<span>{diff.toFixed(2)} ({pct?.toFixed(1)}%)</span><span className="wh-delta-label">vs. snapshot anterior</span></div>}
      </div>;
    })}
  </div>;
}