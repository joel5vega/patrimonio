// src/pages/Analytics.jsx
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTransactions, TX_CATEGORIES, TX_GROUPS } from '../hooks/useTransactions';
import {
  BarChart2, PieChart, TrendingDown, TrendingUp, Lightbulb,
  Target, ArrowUpRight, Calendar, ChevronRight, X, PiggyBank,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { animate, stagger } from 'animejs';

// ── Períodos ──────────────────────────────────────────────────
const PERIODS = [
  { label: '7D',    value: '7d'     },
  { label: '1M',    value: '1m'     },
  { label: '3M',    value: '3m'     },
  { label: '1A',    value: '1y'     },
  { label: 'Todo',  value: 'all'    },
  { label: 'Fecha', value: 'custom' },
];

function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case '7d': return new Date(now - 7 * 86400000);
    case '1m': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:   return null;
  }
}

function toDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw?.toDate === 'function') return raw.toDate();
  if (typeof raw === 'number') return new Date(raw);
  if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function fmtDate(raw) {
  const d = toDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toInputDate(date) {
  if (!date) return '';
  const d = toDate(date);
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

function getMonthStart(monthsAgo) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}

function getMonthEnd(monthsAgo) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
}

function getPreviousRange(period, customStart, customEnd) {
  const now = new Date();
  switch (period) {
    case '7d': return {
      start: new Date(now - 14 * 86400000),
      end:   new Date(now - 7  * 86400000),
    };
    case '1m': return {
      start: new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()),
      end:   new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
    };
    case '3m': return {
      start: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      end:   new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
    };
    case '1y': return {
      start: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      end:   new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
    };
    case 'custom': {
      if (!customStart || !customEnd) return null;
      const diff = customEnd - customStart;
      const end  = new Date(customStart - 1);
      return { start: new Date(end - diff), end };
    }
    default: return null;
  }
}

// ── UI Helpers & Paletas de Grupos Actualizadas ──────────────
const Bar = ({ pct, color }) => (
  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  </div>
);

const GROUP_COLORS = {
  hogar:       'bg-blue-500',
  estilo_vida: 'bg-pink-500',
  bienestar:   'bg-purple-500',
  fe:          'bg-yellow-500',
  finanzas:    'bg-emerald-500',
  ingresos:    'bg-teal-500',
  otros:       'bg-white/30',
};

const GROUP_TEXT = {
  hogar:       'text-blue-400',
  estilo_vida: 'text-pink-400',
  bienestar:   'text-purple-400',
  fe:          'text-yellow-400',
  finanzas:    'text-emerald-400',
  ingresos:    'text-teal-400',
  otros:       'text-white/40',
};

const GROUP_HEX = {
  hogar:       '#3b82f6',
  estilo_vida: '#ec4899',
  bienestar:   '#a855f7',
  fe:          '#eab308',
  finanzas:    '#10b981',
  ingresos:    '#14b8a6',
  otros:       'rgba(255,255,255,0.3)',
};

const Sparkline = ({ data, color = '#2dd4bf' }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = 28;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - (v / max) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

const DeltaBadge = ({ current, previous, invert = false }) => {
  if (previous == null || previous === 0) return null;
  const delta  = ((current - previous) / previous) * 100;
  const isGood = invert ? delta < 0 : delta > 0;
  const abs    = Math.abs(delta);
  if (abs < 1) return (
    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(148,163,184,0.5)', fontFamily: 'JetBrains Mono,monospace' }}>≈</span>
  );
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
      fontSize: '0.6rem', fontWeight: 800,
      padding: '0.1rem 0.35rem', borderRadius: '4px',
      fontFamily: 'JetBrains Mono,monospace',
      background: isGood ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
      color:      isGood ? '#34d399'               : '#fb7185',
      whiteSpace: 'nowrap',
    }}>
      {delta > 0 ? '▲' : '▼'} {abs.toFixed(1)}%
    </span>
  );
};

function getInsights({ savingsRate, byGroup, totalExp, monthlyTrend, expenses }) {
  const tips = [];
  
  if (savingsRate < 0) {
    tips.push({ icon: '🚨', color: 'text-rose-400', msg: 'Tus gastos superan tus ingresos en este período. Revisa tus compras discrecionales.' });
  } else if (savingsRate < 15) {
    tips.push({ icon: '⚠️', color: 'text-yellow-400', msg: `Tu tasa de ahorro está en ${savingsRate.toFixed(0)}%. Intenta acercarte a la meta del 20%.` });
  } else if (savingsRate >= 20) {
    tips.push({ icon: '🎉', color: 'text-emerald-400', msg: `¡Excelente disciplina! Estás ahorrando e invirtiendo el ${savingsRate.toFixed(0)}% de tus ingresos.` });
  }

  const topGroup = byGroup[0];
  if (topGroup && totalExp > 0) {
    const pct = (topGroup.total / totalExp) * 100;
    const groupLabel = TX_GROUPS.find(g => g.value === topGroup.key)?.label || topGroup.key;
    if (pct > 35) {
      tips.push({ icon: '📊', color: 'text-orange-400', msg: `"${groupLabel}" absorbe el ${pct.toFixed(0)}% de tus egresos.` });
    }
  }

  // Alerta específica de compras
  const salidasyOcio = expenses.filter(e => e.category === 'citas_salidas' || e.category === 'comida_fuera').reduce((s, e) => s + e.amount, 0);
  if (totalExp > 0 && (salidasyOcio / totalExp) > 0.25) {
    tips.push({ icon: '🍔', color: 'text-pink-400', msg: 'Las salidas y restaurantes representan más del 25% de tus gastos actuales.' });
  }

  if (monthlyTrend.length >= 2) {
    const last   = monthlyTrend[monthlyTrend.length - 1].exp;
    const prev   = monthlyTrend[monthlyTrend.length - 2].exp;
    const change = ((last - prev) / (prev || 1)) * 100;
    if (change > 15) {
      tips.push({ icon: '📈', color: 'text-rose-300', msg: `Tus gastos aumentaron un ${change.toFixed(0)}% con respecto al mes anterior.` });
    } else if (change < -10) {
      tips.push({ icon: '📉', color: 'text-teal-400', msg: `¡Buen trabajo! Redujiste tus gastos un ${Math.abs(change).toFixed(0)}% respecto al mes pasado.` });
    }
  }

  if (tips.length === 0) {
    tips.push({ icon: '💡', color: 'text-white/50', msg: 'Registra tus movimientos diariamente para obtener mejores proyecciones.' });
  }

  return tips;
}

// ── DonutTooltip ──────────────────────────────────────────────
function DonutTooltip({ slice, anchorPos }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!ref.current || !anchorPos) return;
    const tt  = ref.current.getBoundingClientRect();
    const GAP = 14;
    const vw  = window.innerWidth;
    let left = anchorPos.x - tt.width / 2;
    let top  = anchorPos.y - tt.height - GAP;
    if (top < 8) top = anchorPos.y + GAP;
    left = Math.max(8, Math.min(left, vw - tt.width - 8));
    setPos({ top, left });
    animate(ref.current, { opacity: [0, 1], scale: [0.9, 1], duration: 140, ease: 'outExpo' });
  }, [anchorPos]);

  const style = pos
    ? { top: pos.top, left: pos.left, opacity: 1 }
    : { top: -9999,   left: -9999,    opacity: 0 };

  return ReactDOM.createPortal(
    <div ref={ref} style={{
      ...style,
      position: 'fixed', zIndex: 9999,
      background: 'rgba(2,6,23,0.97)',
      border: `1px solid ${slice.hex}44`,
      borderRadius: '0.85rem',
      padding: '0.65rem 0.85rem',
      minWidth: '150px',
      pointerEvents: 'none',
      boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px ${slice.hex}22`,
      whiteSpace: 'nowrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: slice.hex, flexShrink: 0, boxShadow: `0 0 6px ${slice.hex}88` }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'white' }}>{slice.label}</span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.3rem 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {[
          { lbl: 'Total',     val: `Bs ${slice.total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`, color: 'white' },
          { lbl: 'Del total', val: `${slice.pct.toFixed(1)}%`,  color: slice.hex },
          { lbl: 'Transacc.', val: `${slice.count}`,            color: 'rgba(255,255,255,0.7)' },
        ].map(({ lbl, val, color }) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontSize: '0.58rem', color: 'rgba(148,163,184,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>{lbl}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono,monospace' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ── DonutAnalytics ────────────────────────────────────────────
const DonutAnalytics = ({ byGroup, totalExp, expenses, onGroupClick, activeGroup }) => {
  const [hovered,   setHovered]   = useState(null);
  const [anchorPos, setAnchorPos] = useState(null);
  const svgRef    = useRef(null);
  const sliceRefs = useRef({});

  const CX = 130, CY = 130, R = 95, RI = 62;
  const P  = (r, t) => [CX + r * Math.cos(t), CY + r * Math.sin(t)];

  const slices = useMemo(() => {
    let cum = -Math.PI / 2;
    return byGroup.map(({ key, total }) => {
      const angle       = (total / totalExp) * 2 * Math.PI;
      const start       = cum;
      const mid         = cum + angle / 2;
      cum              += angle;
      const large       = angle > Math.PI ? 1 : 0;
      const [x1,  y1]  = P(R,   start);
      const [x2,  y2]  = P(R,   cum);
      const [xi1, yi1] = P(RI,  cum);
      const [xi2, yi2] = P(RI,  start);
      const pct   = (total / totalExp) * 100;
      const count = expenses.filter(e => (e.parentCategory || 'otros') === key).length;
      return {
        key,
        label: TX_GROUPS?.find(g => g.value === key)?.label || key,
        total, pct, count,
        hex:  GROUP_HEX[key] || 'rgba(255,255,255,0.3)',
        mid,
        path: `M${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}L${xi1} ${yi1}A${RI} ${RI} 0 ${large} 0 ${xi2} ${yi2}Z`,
        lx:  P(R + 18, mid)[0], ly:  P(R + 18, mid)[1],
        lsx: P(R + 2,  mid)[0], lsy: P(R + 2,  mid)[1],
        lex: P(R + 13, mid)[0], ley: P(R + 13, mid)[1],
      };
    });
  }, [byGroup, totalExp, expenses]);

  useEffect(() => {
    if (!svgRef.current) return;
    animate(svgRef.current.querySelectorAll('.dona-slice'), {
      opacity: [0, 1], duration: 600, delay: stagger(80), ease: 'outExpo',
    });
  }, [byGroup.length]);

  const handleEnter = useCallback((slice, e) => {
    setHovered(slice.key);
    setAnchorPos({ x: e.clientX, y: e.clientY });
    if (sliceRefs.current[slice.key])
      animate(sliceRefs.current[slice.key], { scale: 1.04, duration: 150, ease: 'outSine' });
  }, []);

  const handleLeave = useCallback((slice) => {
    setHovered(null);
    setAnchorPos(null);
    if (sliceRefs.current[slice.key])
      animate(sliceRefs.current[slice.key], { scale: 1, duration: 200, ease: 'outBack(2)' });
  }, []);

  const handleClick = useCallback((slice) => {
    if (sliceRefs.current[slice.key])
      animate(sliceRefs.current[slice.key], { scale: [1.04, 0.96, 1.02, 1], duration: 350, ease: 'outElastic(1, 0.5)' });
    onGroupClick(slice.key === activeGroup ? null : slice.key);
  }, [activeGroup, onGroupClick]);

  const hoveredSlice = slices.find(s => s.key === hovered);
  const activeTotal  = byGroup.find(g => g.key === activeGroup)?.total || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
        <svg ref={svgRef} width="100%" viewBox="0 0 260 260" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
          <defs>
            <filter id="glow-global">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {slices.map(s => {
            const isActive  = activeGroup === s.key;
            const isHovered = hovered === s.key;
            const isDimmed  = activeGroup && activeGroup !== s.key;
            return (
              <g key={s.key} ref={el => sliceRefs.current[s.key] = el}
                style={{ cursor: 'pointer', transformOrigin: `${CX}px ${CY}px`, filter: isHovered || isActive ? `drop-shadow(0 0 8px ${s.hex}88)` : 'none' }}
                onMouseEnter={e => handleEnter(s, e)}
                onMouseLeave={() => handleLeave(s)}
                onMouseMove={e => setAnchorPos({ x: e.clientX, y: e.clientY })}
                onClick={() => handleClick(s)}
              >
                <path className="dona-slice" d={s.path} fill={s.hex}
                  stroke="rgba(2,6,23,0.9)" strokeWidth="2.5"
                  opacity={isDimmed ? 0.25 : isActive ? 1 : 0.88}
                  style={{ transition: 'opacity 0.2s' }}
                />
              </g>
            );
          })}

          {slices.filter(s => s.pct >= 8).map(s => {
            const anchor   = Math.cos(s.mid) >= 0 ? 'start' : 'end';
            const isDimmed = activeGroup && activeGroup !== s.key;
            return (
              <g key={`lbl-${s.key}`} opacity={isDimmed ? 0.2 : 1} style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}>
                <line x1={s.lsx} y1={s.lsy} x2={s.lex} y2={s.ley} stroke={s.hex} strokeWidth="1.5" opacity="0.5" />
                <text x={s.lx} y={s.ly - 3} textAnchor={anchor} fill={s.hex} fontSize="8.5" fontWeight="800" fontFamily="Inter,sans-serif">{s.label}</text>
                <text x={s.lx} y={s.ly + 8} textAnchor={anchor} fill="rgba(148,163,184,0.7)" fontSize="7.5" fontFamily="JetBrains Mono,monospace">{s.pct.toFixed(1)}%</text>
              </g>
            );
          })}

          <text x={CX} y={CY - 14} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="8" fontWeight="800" fontFamily="Inter,sans-serif" letterSpacing="1.5">
            {activeGroup ? (TX_GROUPS?.find(g => g.value === activeGroup)?.label || activeGroup).toUpperCase() : 'GASTOS'}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="white" fontSize="19" fontWeight="700" fontFamily="JetBrains Mono,monospace">
            Bs {(activeGroup ? activeTotal : totalExp).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </text>
          {activeGroup && (
            <text x={CX} y={CY + 24} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="8" fontFamily="JetBrains Mono,monospace">
              {slices.find(s => s.key === activeGroup)?.pct.toFixed(1)}% del total
            </text>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', width: '100%' }}>
        {slices.map(s => {
          const isActive = activeGroup === s.key;
          return (
            <button key={s.key} type="button" onClick={() => onGroupClick(s.key === activeGroup ? null : s.key)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.25rem 0.65rem', borderRadius: '999px',
              border: `1px solid ${isActive ? s.hex : s.hex + '33'}`,
              background: isActive ? `${s.hex}22` : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s',
              opacity: activeGroup && !isActive ? 0.35 : 1,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.hex, flexShrink: 0, boxShadow: isActive ? `0 0 6px ${s.hex}` : 'none' }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: isActive ? s.hex : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              <span style={{ fontSize: '0.58rem', color: isActive ? s.hex : 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono,monospace' }}>{s.pct.toFixed(0)}%</span>
            </button>
          );
        })}
      </div>

      {hoveredSlice && anchorPos && <DonutTooltip slice={hoveredSlice} anchorPos={anchorPos} />}
    </div>
  );
};

// ── DateRangePicker ───────────────────────────────────────────
const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange, onClear }) => {
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!pickerRef.current) return;
    animate(pickerRef.current, { opacity: [0, 1], y: [-8, 0], duration: 220, ease: 'outExpo' });
  }, []);

  return (
    <div ref={pickerRef} className="bg-brand-card border border-white/10 rounded-2xl p-4 space-y-3" style={{ opacity: 0 }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-brand-teal" />
          <span className="text-xs font-bold text-white/70">Rango personalizado</span>
        </div>
        <button type="button" onClick={onClear} className="text-white/30 hover:text-white/60 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Desde', value: toInputDate(startDate), max: toInputDate(endDate || new Date()), min: undefined, onChange: e => onStartChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : null), display: startDate },
          { label: 'Hasta', value: toInputDate(endDate),   max: toInputDate(new Date()),             min: toInputDate(startDate), onChange: e => onEndChange(e.target.value ? new Date(e.target.value + 'T23:59:59') : null), display: endDate },
        ].map(({ label, value, max, min, onChange, display }) => (
          <div key={label}>
            <label className="text-[10px] text-white/40 block mb-1.5 font-semibold uppercase tracking-wide">{label}</label>
            <input type="date" value={value} max={max} min={min} onChange={onChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-brand-teal/50 transition-all [color-scheme:dark]"
            />
            {display && <p className="text-[10px] text-brand-teal mt-1 ml-1">{fmtDate(display)}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { label: 'Este mes',   fn: () => { const n = new Date(); onStartChange(new Date(n.getFullYear(), n.getMonth(), 1)); onEndChange(new Date()); }},
          { label: 'Mes pasado', fn: () => { const n = new Date(); onStartChange(new Date(n.getFullYear(), n.getMonth() - 1, 1)); onEndChange(new Date(n.getFullYear(), n.getMonth(), 0)); }},
          { label: 'Año 2026',   fn: () => { onStartChange(new Date('2026-01-01')); onEndChange(new Date('2026-12-31')); }},
        ].map(s => (
          <button key={s.label} type="button" onClick={s.fn}
            className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-white/40 hover:text-brand-teal hover:border-brand-teal/40 transition-all font-semibold">
            {s.label}
          </button>
        ))}
      </div>

      {startDate && endDate && (
        <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-xl px-3 py-2">
          <p className="text-[11px] text-brand-teal font-semibold">📅 {fmtDate(startDate)} → {fmtDate(endDate)}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{Math.round((endDate - startDate) / 86400000) + 1} días seleccionados</p>
        </div>
      )}
    </div>
  );
};

// ── ComparisonBanner ──────────────────────────────────────────
const ComparisonBanner = ({ period, prevRange, prevTotalExp, prevTotalInc, totalExp, totalInc }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, { opacity: [0, 1], y: [-6, 0], duration: 250, ease: 'outExpo' });
  }, [period]);

  if (!prevRange || (prevTotalExp === 0 && prevTotalInc === 0)) return null;

  const balance     = totalInc    - totalExp;
  const prevBalance = prevTotalInc - prevTotalExp;

  return (
    <div ref={ref} style={{ opacity: 0 }} className="bg-brand-card rounded-2xl border border-white/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">vs período anterior</span>
        </div>
        <span className="text-[10px] text-white/25">{fmtDate(prevRange.start)} → {fmtDate(prevRange.end)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Gastos',   value: totalExp,          prev: prevTotalExp,          color: 'text-rose-400',                                     invert: true  },
          { label: 'Ingresos', value: totalInc,          prev: prevTotalInc,          color: 'text-emerald-400',                                  invert: false },
          { label: 'Balance',  value: Math.abs(balance), prev: Math.abs(prevBalance), color: balance >= 0 ? 'text-teal-400' : 'text-rose-400',    invert: false },
        ].map(({ label, value, prev, color, invert }) => (
          <div key={label} className="bg-white/3 rounded-xl p-2">
            <p className="text-[9px] text-white/30 mb-1">{label}</p>
            <p className={`text-xs font-bold ${color}`}>
              Bs {value.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-1">
              <DeltaBadge current={value} previous={prev} invert={invert} />
            </div>
            <p className="text-[9px] text-white/20 mt-0.5">
              ant: Bs {prev.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── CategoryRow ───────────────────────────────────────────────
const CategoryRow = ({ groupKey, total, totalExp, categories, maxGroup, prevTotal }) => {
  const [open, setOpen] = useState(false);
  const subRef = useRef(null);
  const color  = GROUP_COLORS[groupKey] || 'bg-white/20';
  const text   = GROUP_TEXT[groupKey]   || 'text-white/60';
  const hex    = GROUP_HEX[groupKey]    || 'rgba(255,255,255,0.3)';
  const glabel = (key) => TX_GROUPS?.find(g => g.value === key)?.label || key;

  const subItems = categories
    .filter(c => c.parent === groupKey)
    .sort((a, b) => b.total - a.total);

  const subMax = Math.max(...subItems.map(s => s.total), 1);

  useEffect(() => {
    if (!subRef.current || !open) return;
    animate(subRef.current.querySelectorAll('.sub-cat-row'), {
      opacity: [0, 1], x: [-8, 0], duration: 200, delay: stagger(30), ease: 'outExpo',
    });
  }, [open]);

  return (
    <div className="space-y-1.5">
      <button type="button" onClick={() => subItems.length > 0 && setOpen(v => !v)} className="w-full text-left">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5">
            {subItems.length > 0 && (
              <ChevronRight size={12} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''} text-white/30`} />
            )}
            <span className={`font-bold ${text}`}>{glabel(groupKey)}</span>
            {subItems.length > 0 && (
              <span className="text-[10px] text-white/20">{subItems.length} cat.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DeltaBadge current={total} previous={prevTotal} invert={true} />
            <span className="text-white/30 text-[10px]">
              {totalExp > 0 ? ((total / totalExp) * 100).toFixed(0) : 0}%
            </span>
            <span className={`font-bold ${text}`}>
              Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
        <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${maxGroup > 0 ? (total / maxGroup) * 100 : 0}%` }} />
        </div>
      </button>

      {open && subItems.length > 0 && (
        <div ref={subRef} className="pl-4 space-y-2 mt-1 border-l border-white/5 ml-1.5">
          {subItems.map(({ key, total: subTotal, label, emoji }) => (
            <div key={key} className="sub-cat-row space-y-1" style={{ opacity: 0 }}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 flex items-center gap-1.5">
                  <span className="text-sm">{emoji}</span>{label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white/25 text-[10px]">
                    {total > 0 ? ((subTotal / total) * 100).toFixed(0) : 0}%
                  </span>
                  <span className="text-white/50 font-semibold">
                    Bs {subTotal.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full opacity-60 transition-all duration-500"
                  style={{ width: `${(subTotal / subMax) * 100}%`, background: hex }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Componente Principal ──────────────────────────────────────
const Analytics = () => {
  const { user }         = useAuth();
  const { transactions } = useTransactions();

  const [activeGroup, setActiveGroup] = useState(null);
  const [period,      setPeriod]      = useState('1m');
  const [viewMode,    setViewMode]    = useState('groups');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd,   setCustomEnd]   = useState(null);
  const cardsRef = useRef(null);

  // ── Filtrado período seleccionado ─────────────────────────
  const filtered = useMemo(() => {
    const start = period === 'custom' ? customStart : getStartDate(period);
    const end   = period === 'custom' ? customEnd   : null;
    return transactions.filter(tx => {
      if (tx.type === 'transfer') return false;
      const d = toDate(tx.date);
      if (!d) return false;
      if (start && d < start) return false;
      if (end   && d > end)   return false;
      return true;
    });
  }, [transactions, period, customStart, customEnd]);

  const expenses = useMemo(() => filtered.filter(tx => tx.type === 'expense'), [filtered]);
  const incomes  = useMemo(() => filtered.filter(tx => tx.type === 'income'),  [filtered]);
  const totalExp = useMemo(() => expenses.reduce((s, tx) => s + tx.amount, 0), [expenses]);
  const totalInc = useMemo(() => incomes.reduce((s,  tx) => s + tx.amount, 0), [incomes]);
  const balance     = totalInc - totalExp;
  const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

  // ── Gastos/ingresos del mes actual ────────────────────────
  const currentMonthExp = useMemo(() => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter(tx => {
        if (tx.type !== 'expense') return false;
        const d = toDate(tx.date);
        return d && d >= start;
      })
      .reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  const currentMonthInc = useMemo(() => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter(tx => {
        if (tx.type !== 'income') return false;
        const d = toDate(tx.date);
        return d && d >= start;
      })
      .reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  // ── Tendencia 6 meses ─────────────────────────────────────
  const monthlyTrend = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const start = getMonthStart(5 - i);
    const end   = getMonthEnd(5 - i);
    const label = start.toLocaleString('es-BO', { month: 'short' });
    const txs   = transactions.filter(tx => {
      if (tx.type === 'transfer') return false;
      const d = toDate(tx.date);
      return d && d >= start && d <= end;
    });
    return {
      label,
      exp: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      inc: txs.filter(t => t.type === 'income').reduce((s,  t) => s + t.amount, 0),
    };
  }), [transactions]);

  const avgMonthlyExp = useMemo(() => {
    const last3 = monthlyTrend.slice(-3);
    return last3.reduce((s, m) => s + m.exp, 0) / 3;
  }, [monthlyTrend]);

  const projectedExp = useMemo(() => {
    if (period !== '1m') return null;
    const now         = new Date();
    const day         = now.getDate();
    if (day === 0) return null;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return (currentMonthExp / day) * daysInMonth;
  }, [currentMonthExp, period]);

  // ── Agrupaciones con las Claves Actualizadas ─────────────
  const byGroup = useMemo(() => {
    const map = {};
    for (const tx of expenses) {
      const key = tx.parentCategory || 'otros';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map).map(([key, total]) => ({ key, total })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const tx of expenses) {
      const key = tx.category || 'other';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map).map(([key, total]) => {
      const meta = TX_CATEGORIES.find(c => c.value === key);
      return { key, total, label: meta?.label || key, emoji: meta?.emoji || '📦', parent: meta?.parent || 'otros' };
    }).sort((a, b) => b.total - a.total);
  }, [expenses]);

  // ── Período anterior ──────────────────────────────────────
  const prevRange    = useMemo(() => getPreviousRange(period, customStart, customEnd), [period, customStart, customEnd]);
  const prevFiltered = useMemo(() => {
    if (!prevRange) return [];
    return transactions.filter(tx => {
      if (tx.type === 'transfer') return false;
      const d = toDate(tx.date);
      return d && d >= prevRange.start && d <= prevRange.end;
    });
  }, [transactions, prevRange]);

  const prevExpenses = useMemo(() => prevFiltered.filter(tx => tx.type === 'expense'), [prevFiltered]);
  const prevIncomes  = useMemo(() => prevFiltered.filter(tx => tx.type === 'income'),  [prevFiltered]);
  const prevTotalExp = useMemo(() => prevExpenses.reduce((s, tx) => s + tx.amount, 0), [prevExpenses]);
  const prevTotalInc = useMemo(() => prevIncomes.reduce((s,  tx) => s + tx.amount, 0), [prevIncomes]);
  const prevByGroup  = useMemo(() => {
    const map = {};
    for (const tx of prevExpenses) {
      const key = tx.parentCategory || 'otros';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return map;
  }, [prevExpenses]);

  // ── Auxiliares de Cálculo ──────────────────────────────────
  const maxGroup           = byGroup[0]?.total || 1;
  const filteredByCategory = activeGroup ? byCategory.filter(c => c.parent === activeGroup) : byCategory;

  const now          = new Date();
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft     = daysInMonth - now.getDate();
  const monthBalance = currentMonthInc - currentMonthExp;
  const dailyBudget  = monthBalance > 0 ? monthBalance / (daysLeft || 1) : 0;

  const insights = getInsights({ savingsRate, byGroup, totalExp, monthlyTrend, expenses });

  useEffect(() => {
    if (!cardsRef.current) return;
    animate(cardsRef.current.querySelectorAll('.analytics-card'), {
      opacity: [0, 1], y: [10, 0], duration: 300, delay: stagger(50), ease: 'outExpo',
    });
  }, [period, customStart, customEnd]);

  const periodLabel = useMemo(() => {
    if (period === 'custom') {
      if (customStart && customEnd) return `${fmtDate(customStart)} → ${fmtDate(customEnd)}`;
      if (customStart) return `Desde ${fmtDate(customStart)}`;
      return 'Rango personalizado';
    }
    return PERIODS.find(p => p.value === period)?.label || '';
  }, [period, customStart, customEnd]);

  return (
    <div className="space-y-5 pb-24">

      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold">Análisis Financiero</h1>
          {period === 'custom' && (customStart || customEnd) && (
            <p className="text-[11px] text-brand-teal mt-0.5">{periodLabel}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('groups')}
            className={`p-2 rounded-xl text-sm transition-colors ${viewMode === 'groups' ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40'}`}>
            <PieChart size={16} />
          </button>
          <button onClick={() => setViewMode('categories')}
            className={`p-2 rounded-xl text-sm transition-colors ${viewMode === 'categories' ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40'}`}>
            <BarChart2 size={16} />
          </button>
        </div>
      </div>

      {/* Selector de Período */}
      <div className="flex gap-1.5">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              period === p.value
                ? p.value === 'custom' ? 'bg-purple-500 text-white' : 'bg-brand-teal text-black'
                : 'bg-brand-card text-white/40 border border-white/10'
            }`}>
            {p.value === 'custom'
              ? <span className="flex items-center justify-center gap-1"><Calendar size={11} />{p.label}</span>
              : p.label
            }
          </button>
        ))}
      </div>

      {/* DateRangePicker */}
      {period === 'custom' && (
        <DateRangePicker
          startDate={customStart} endDate={customEnd}
          onStartChange={setCustomStart} onEndChange={setCustomEnd}
          onClear={() => { setCustomStart(null); setCustomEnd(null); setPeriod('1m'); }}
        />
      )}

      {/* ComparisonBanner */}
      <ComparisonBanner
        period={period} prevRange={prevRange}
        prevTotalExp={prevTotalExp} prevTotalInc={prevTotalInc}
        totalExp={totalExp} totalInc={totalInc}
      />

      {/* Tarjetas y Paneles */}
      <div ref={cardsRef} className="space-y-5">

        {/* Resumen General */}
        <div className="grid grid-cols-3 gap-3 analytics-card">
          {[
            { label: 'Ingresos', value: totalInc,          prev: prevTotalInc, color: 'text-emerald-400', invert: false },
            { label: 'Gastos',   value: totalExp,          prev: prevTotalExp, color: 'text-rose-400',    invert: true  },
            { label: 'Balance',  value: Math.abs(balance), prev: Math.abs(prevTotalInc - prevTotalExp), color: balance >= 0 ? 'text-teal-400' : 'text-rose-400', invert: false },
          ].map(({ label, value, prev, color, invert }) => (
            <div key={label} className="bg-brand-card rounded-2xl p-3 border border-white/5">
              <p className="text-[10px] text-white/40 mb-1">{label}</p>
              <p className={`text-sm font-bold ${color}`}>
                Bs {value.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
              </p>
              <div className="mt-1">
                <DeltaBadge current={value} previous={prev} invert={invert} />
              </div>
            </div>
          ))}
        </div>

        {/* Indicadores Clave (KPIs) */}
        <div className="grid grid-cols-2 gap-3 analytics-card">
          <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/40">Tasa de ahorro</p>
              <Target size={14} className="text-white/20" />
            </div>
            <p className={`text-xl font-bold ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-rose-400'}`}>
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-white/30 mt-1">Meta: 20%</p>
            <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }} />
            </div>
          </div>

          <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/40">Prom./mes</p>
              <Sparkline data={monthlyTrend.map(m => m.exp)} />
            </div>
            <p className="text-xl font-bold text-white/80">
              Bs {avgMonthlyExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-white/30 mt-1">Últimos 3 meses</p>
          </div>

          {projectedExp !== null && (
            <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-white/40">Proyección mes</p>
                <ArrowUpRight size={14} className="text-white/20" />
              </div>
              <p className={`text-xl font-bold ${projectedExp > (currentMonthInc || avgMonthlyExp) ? 'text-rose-400' : 'text-white/80'}`}>
                Bs {projectedExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-white/30 mt-1">Ritmo actual (día {now.getDate()})</p>
            </div>
          )}

          {period === '1m' && (
            <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-white/40">Disponible/día</p>
                <span className="text-[10px] text-white/30">{daysLeft}d restantes</span>
              </div>
              <p className={`text-xl font-bold ${dailyBudget > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                Bs {Math.max(dailyBudget, 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-white/30 mt-1">
                {currentMonthInc > 0
                  ? `Ingreso: Bs ${currentMonthInc.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
                  : 'Sin ingresos registrados'}
              </p>
            </div>
          )}
        </div>

        {/* Tendencia 6 Meses */}
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 analytics-card">
          <h3 className="font-bold text-sm mb-4">Tendencia Semestral</h3>
          <div className="flex items-end gap-2 h-20">
            {monthlyTrend.map((m, i) => {
              const maxVal = Math.max(...monthlyTrend.map(x => Math.max(x.exp, x.inc)), 1);
              const isLast = i === monthlyTrend.length - 1;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end h-16">
                    <div className={`flex-1 rounded-t transition-all duration-500 ${isLast ? 'bg-rose-500' : 'bg-rose-500/40'}`}
                      style={{ height: `${(m.exp / maxVal) * 100}%` }} />
                    <div className={`flex-1 rounded-t transition-all duration-500 ${isLast ? 'bg-emerald-500' : 'bg-emerald-500/30'}`}
                      style={{ height: `${(m.inc / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-white/30 capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-white/40">Gastos</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-white/40">Ingresos</span></div>
          </div>
        </div>

        {/* Diagnóstico Financiero */}
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3 analytics-card">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-yellow-400" />
            <h3 className="font-bold text-sm">Diagnóstico financiero</h3>
          </div>
          {insights.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-base leading-none">{tip.icon}</span>
              <p className={`${tip.color} leading-snug`}>{tip.msg}</p>
            </div>
          ))}
        </div>

        {/* Gráfico de Dona y Grupos */}
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-4 analytics-card">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Distribución por grupo</h3>
            {activeGroup && (
              <button type="button" onClick={() => setActiveGroup(null)} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.65rem', fontWeight: 700,
                color: GROUP_HEX[activeGroup] || '#fff',
                background: `${GROUP_HEX[activeGroup]}18`,
                border: `1px solid ${GROUP_HEX[activeGroup]}33`,
                borderRadius: '999px', padding: '0.2rem 0.6rem', cursor: 'pointer',
              }}>
                × {TX_GROUPS?.find(g => g.value === activeGroup)?.label}
              </button>
            )}
          </div>

          {byGroup.length === 0
            ? <p className="text-white/30 text-sm text-center py-4">Sin datos registrados en este período</p>
            : <DonutAnalytics byGroup={byGroup} totalExp={totalExp} expenses={expenses} onGroupClick={setActiveGroup} activeGroup={activeGroup} />
          }

          {viewMode === 'groups' && byGroup.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              {byGroup.map(({ key, total }) => (
                <CategoryRow key={key} groupKey={key} total={total} totalExp={totalExp}
                  categories={byCategory} maxGroup={maxGroup} prevTotal={prevByGroup[key] ?? null} />
              ))}
            </div>
          )}

          {activeGroup && filteredByCategory.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide">
                Categorías en {TX_GROUPS?.find(g => g.value === activeGroup)?.label}
              </p>
              {filteredByCategory.map(({ key, total, label, emoji }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold">{emoji} {label}</span>
                    <span className="text-white/50">
                      Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                      <span className="text-white/30 ml-1">
                        ({((total / (byGroup.find(g => g.key === activeGroup)?.total || 1)) * 100).toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <Bar pct={(total / (filteredByCategory[0]?.total || 1)) * 100} color={GROUP_COLORS[activeGroup] || 'bg-white/20'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vista por Categoría Plana */}
        {viewMode === 'categories' && (
          <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3 analytics-card">
            <h3 className="font-bold text-sm">Detalle por categoría</h3>
            {byCategory.length === 0 && <p className="text-white/30 text-sm text-center py-4">Sin gastos registrados</p>}
            {byCategory.map(({ key, total, label, emoji, parent }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GROUP_HEX[parent] || 'rgba(255,255,255,0.2)' }} />
                    {emoji} {label}
                  </span>
                  <span className="text-white/50">
                    Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                    <span className="text-white/30 ml-1">({((total / totalExp) * 100).toFixed(0)}%)</span>
                  </span>
                </div>
                <Bar pct={(total / (byCategory[0]?.total || 1)) * 100} color={GROUP_COLORS[parent] || 'bg-white/20'} />
              </div>
            ))}
          </div>
        )}

        {/* Top 5 Mayor Impacto */}
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-2 analytics-card">
          <h3 className="font-bold text-sm mb-3">Mayores egresos del período</h3>
          {expenses.length === 0 && <p className="text-white/30 text-sm text-center py-3">Sin registro de gastos</p>}
          {[...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map(tx => {
            const meta = TX_CATEGORIES.find(c => c.value === tx.category);
            return (
              <div key={tx.id || tx.concept + tx.amount} className="flex justify-between items-center text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta?.emoji || '📦'}</span>
                  <div>
                    <p className="font-semibold text-white/90">{tx.concept || tx.title || 'Gasto'}</p>
                    <p className="text-[10px] text-white/30">{fmtDate(tx.date)}</p>
                  </div>
                </div>
                <span className="text-rose-400 font-bold">
                  Bs {tx.amount.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Analytics;