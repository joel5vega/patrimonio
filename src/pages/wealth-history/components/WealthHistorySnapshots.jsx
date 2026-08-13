import { useMemo, useState } from 'react';
import { formatUSD } from '../wealthHistory.helpers';
import { ExpandButton } from './WealthHistoryControls';

export default function WealthHistorySnapshots({ series }) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => [...(series?.data || [])].reverse(), [series]);
  if (!rows.length) return null;
  const visible = expanded ? rows : rows.slice(0, 5);
  return <div className="wh-snapshots"><div className="wh-snapshots-header"><p className="wh-section-label">Snapshots {series.label}</p><span className="wh-snapshots-count">{rows.length} registros</span></div><div className="wh-snapshots-table">{visible.map((row, index) => { const previous = rows[index + 1]; const diff = previous ? row.v - previous.v : null; return <div key={row.date} className={`wh-snapshot-row ${index ? 'wh-snapshot-row--border' : ''}`}><span className="wh-snapshot-date">{row.date}</span><div className="wh-snapshot-right"><span className="wh-snapshot-val">{formatUSD(row.v)}</span>{diff != null && <span className={`wh-snapshot-diff ${diff >= 0 ? 'wh-delta-up' : 'wh-delta-down'}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</span>}</div></div>; })}</div><ExpandButton expanded={expanded} onClick={() => setExpanded((value) => !value)} count={rows.length} /></div>;
}