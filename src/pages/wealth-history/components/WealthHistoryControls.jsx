import { Activity, BarChart3, Coins, Layers3, Landmark, Percent, ShieldCheck, WalletCards } from 'lucide-react';
import { VIEW_MODES } from '../wealthHistory.constants';
import { formatCompact } from '../wealthHistory.helpers';

const ICONS = { wallet: WalletCards, coins: Coins, chart: BarChart3, layers: Layers3, activity: Activity, percent: Percent, shield: ShieldCheck, landmark: Landmark };

export function Icon({ name, size = 15 }) { const Component = ICONS[name] || BarChart3; return <Component size={size} strokeWidth={1.8} aria-hidden="true" />; }

export function ViewModeSelector({ mode, onChange }) {
  return <div className="wh-view-modes">{VIEW_MODES.map((item) => <button key={item.key} type="button" className={`wh-view-mode ${mode === item.key ? 'is-active' : ''}`} onClick={() => onChange(item.key)}><Icon name={item.key === 'summary' ? 'wallet' : item.key === 'allocation' ? 'chart' : 'activity'} />{item.label}</button>)}</div>;
}

export function PeriodSelector({ periods, selected, onChange }) {
  return <div className="wh-period-bar">{periods.map((item) => <button key={item.key} type="button" className={`wh-period-btn ${selected === item.key ? 'wh-period-btn--active' : ''}`} onClick={() => onChange(item.key)}>{item.label}</button>)}</div>;
}

export function SeriesControls({ types, values, visible, onToggle }) {
  return <section className="wh-controls"><p className="wh-section-label">Series visibles</p><div className="wh-chips-row">{types.map((type) => <button type="button" key={type.key} className={`wh-chip ${visible[type.key] ? 'wh-chip--active' : ''}`} onClick={() => onToggle(type.key)} style={{ '--chip-color': type.color }}><Icon name={type.icon} size={13} /><span>{type.label}</span><small>{formatCompact(values[type.key])}</small></button>)}</div></section>;
}