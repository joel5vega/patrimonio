import { PieChart } from 'lucide-react';
import { formatUSD } from '../wealthHistory.helpers';

export default function WealthHistoryComposition({ rows, total }) {
  const items = rows.filter((row) => row.valueUSD > 0);
  return <section className="wh-composition"><div className="wh-panel-heading"><div><p className="wh-section-label">Composición financiera</p><h2>Distribución actual</h2></div><PieChart size={19} /></div><div className="wh-composition-total"><span>Total financiero</span><strong>{formatUSD(total)}</strong></div><div className="wh-allocation-list">{items.map((row) => { const percentage = total ? (row.valueUSD / total) * 100 : 0; return <div className="wh-allocation-item" key={row.key}><div className="wh-allocation-meta"><span><i style={{ background: row.color }} />{row.label}</span><strong>{percentage.toFixed(1)}%</strong></div><div className="wh-allocation-track"><div style={{ width: `${Math.min(percentage, 100)}%`, background: row.color }} /></div><small>{formatUSD(row.valueUSD)}</small></div>; })}</div></section>;
}