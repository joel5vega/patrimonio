import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { animate } from 'animejs';
import { formatUSD } from '../wealthHistory.helpers';

const pathFor = (data, x, y) => {
  if (data.length < 2) return '';
  const points = data.map((item, index) => [x(index, data.length), y(item.v)]);
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point[0]},${point[1]}`;
    const previous = points[index - 1]; const center = (previous[0] + point[0]) / 2;
    return `${path} C ${center},${previous[1]} ${center},${point[1]} ${point[0]},${point[1]}`;
  }, '');
};

function Tooltip({ point, series, position, rect }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) animate(ref.current, { opacity: [0, 1], scale: [0.9, 1], duration: 140 }); }, [point?.index]);
  if (!point || !rect) return null;
  return ReactDOM.createPortal(<div ref={ref} className="wh-tooltip" style={{ left: rect.left + position.x, top: rect.top + position.y - 12 }}><p className="wh-tooltip-date">{point.date}</p><div className="wh-tooltip-divider" />{series.map((item) => <div className="wh-tooltip-row" key={item.key}><span className="wh-tooltip-label"><i style={{ background: item.color }} />{item.label}</span><span className="wh-tooltip-val" style={{ color: item.color }}>{formatUSD(item.data[point.index]?.v)}</span></div>)}</div>, document.body);
}

export default function WealthHistoryChart({ series, onHoverChange }) {
  const W = 640; const H = 280; const P = { top: 20, right: 20, bottom: 38, left: 58 };
  const [hover, setHover] = useState(null); const [rect, setRect] = useState(null); const [position, setPosition] = useState({ x: 0, y: 0 });
  const primary = series[0]; const values = series.flatMap((item) => item.data.map((point) => point.v));
  if (!primary?.data?.length || !values.length) return null;
  const minValue = Math.min(...values); const maxValue = Math.max(...values); const padding = (maxValue - minValue) * 0.1 || 1; const min = minValue - padding; const max = maxValue + padding; const range = max - min || 1;
  const x = (index, length) => P.left + (index / Math.max(length - 1, 1)) * (W - P.left - P.right); const y = (value) => P.top + (1 - (value - min) / range) * (H - P.top - P.bottom);
  const move = useCallback((event) => { const box = event.currentTarget.getBoundingClientRect(); const clientX = event.touches?.[0]?.clientX ?? event.clientX; const relative = Math.max(0, Math.min(W - P.left - P.right, clientX - box.left - P.left)); const index = Math.round(relative / (W - P.left - P.right) * (primary.data.length - 1)); const point = { index, date: primary.data[index]?.date }; setHover(point); setRect(box); setPosition({ x: x(index, primary.data.length), y: y(primary.data[index]?.v || min) }); onHoverChange?.(point); }, [primary, min, onHoverChange]);
  const leave = () => { setHover(null); onHoverChange?.(null); };
  const grid = [0, 1, 2, 3, 4].map((step) => min + ((max - min) * step) / 4);
  return <><svg className="wh-chart-svg" viewBox={`0 0 ${W} ${H}`} onMouseMove={move} onMouseLeave={leave} onTouchMove={move} onTouchEnd={leave}><defs><linearGradient id="wh-total-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={primary.color} stopOpacity=".28" /><stop offset="100%" stopColor={primary.color} stopOpacity="0" /></linearGradient></defs>{grid.map((value) => <g key={value}><line x1={P.left} y1={y(value)} x2={W - P.right} y2={y(value)} stroke="rgba(255,255,255,.07)" strokeDasharray="4 5" /><text x={P.left - 8} y={y(value) + 4} textAnchor="end" className="wh-axis-label">{formatUSD(value)}</text></g>)}{series.map((item, index) => { const path = pathFor(item.data, x, y); const area = index === 0 && path ? `${path} L ${x(item.data.length - 1, item.data.length)},${H - P.bottom} L ${x(0, item.data.length)},${H - P.bottom} Z` : null; return <g key={item.key}>{area && <path d={area} fill="url(#wh-total-gradient)" />}{path && <path d={path} fill="none" stroke={item.color} strokeWidth={index === 0 ? 3 : 1.8} strokeLinecap="round" opacity={index === 0 ? 1 : .82} />}</g>; })}{hover && <line x1={x(hover.index, primary.data.length)} y1={P.top} x2={x(hover.index, primary.data.length)} y2={H - P.bottom} stroke="rgba(255,255,255,.3)" strokeDasharray="4 4" />}</svg><Tooltip point={hover} series={series} position={position} rect={rect} /></>;
}