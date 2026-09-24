// src/pages/Analytics/components/DonutChart.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { animate, stagger } from 'animejs';
import { TX_GROUPS } from '../../../hooks/useTransactions';
import { GROUP_HEX } from '../../../features/transactions/constants/groupPalette';

function DonutTooltip({ slice, anchorPos }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!ref.current || !anchorPos) return;
    const tt = ref.current.getBoundingClientRect();
    const GAP = 14;
    const vw = window.innerWidth;
    let left = anchorPos.x - tt.width / 2;
    let top = anchorPos.y - tt.height - GAP;
    if (top < 8) {
      top = anchorPos.y + GAP;
      left = Math.max(8, Math.min(left, vw - tt.width - 8));
    }
    setPos({ top, left });
    animate(ref.current, { opacity: [0, 1], scale: [0.9, 1] }, { duration: 140, ease: 'outExpo' });
  }, [anchorPos]);

  const style = pos ? { top: pos.top, left: pos.left, opacity: 1 } : { top: -9999, left: -9999, opacity: 0 };

  return ReactDOM.createPortal(
    <div
      ref={ref}
      style={{
        ...style, position: 'fixed', zIndex: 9999, background: 'rgba(2,6,23,0.97)',
        border: `1px solid ${slice.hex}44`, borderRadius: '0.85rem', padding: '0.65rem 0.85rem',
        minWidth: '150px', pointerEvents: 'none',
        boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px ${slice.hex}22`,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: slice.hex, flexShrink: 0, boxShadow: `0 0 6px ${slice.hex}88` }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'white' }}>{slice.label}</span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.3rem 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {[
          ['Total', `Bs ${slice.total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`, 'white'],
          ['Del total', `${slice.pct.toFixed(1)}%`, slice.hex],
          ['Transacc.', slice.count, 'rgba(255,255,255,0.7)'],
        ].map(([lbl, val, color]) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontSize: '0.58rem', color: 'rgba(148,163,184,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>{lbl}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono,monospace' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}

export default function DonutChart({ byGroup, totalExp, expenses, onGroupClick, activeGroup }) {
  const [hovered, setHovered] = useState(null);
  const [anchorPos, setAnchorPos] = useState(null);
  const svgRef = useRef(null);
  const sliceRefs = useRef({});

  const CX = 130, CY = 130, R = 95, RI = 62;
  const P = (r, t) => [CX + r * Math.cos(t), CY + r * Math.sin(t)];

  const slices = useMemo(() => {
    let cum = -Math.PI / 2;
    return byGroup.map(({ key, total }) => {
      const angle = (total / totalExp) * 2 * Math.PI;
      const start = cum;
      const mid = cum + angle / 2;
      cum += angle;
      const large = angle > Math.PI ? 1 : 0;
      const [x1, y1] = P(R, start);
      const [x2, y2] = P(R, cum);
      const [xi1, yi1] = P(RI, cum);
      const [xi2, yi2] = P(RI, start);
      const pct = (total / totalExp) * 100;
      const count = expenses.filter((e) => e.parentCategory === key || e.group === key).length;
      return {
        key,
        label: TX_GROUPS?.find((g) => g.value === key)?.label || key,
        total, pct, count,
        hex: GROUP_HEX[key] || 'rgba(255,255,255,0.3)',
        mid,
        path: `M${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${RI} ${RI} 0 ${large} 0 ${xi2} ${yi2} Z`,
        lx: P(R + 18, mid)[0], ly: P(R + 18, mid)[1],
        lsx: P(R + 2, mid)[0], lsy: P(R + 2, mid)[1],
        lex: P(R + 13, mid)[0], ley: P(R + 13, mid)[1],
      };
    });
  }, [byGroup, totalExp, expenses]);

  useEffect(() => {
    if (!svgRef.current) return;
    animate(svgRef.current.querySelectorAll('.dona-slice'), { opacity: [0, 1] }, { duration: 600, delay: stagger(80), ease: 'outExpo' });
  }, [byGroup.length]);

  const handleEnter = useCallback((slice, e) => {
    setHovered(slice.key);
    setAnchorPos({ x: e.clientX, y: e.clientY });
    if (sliceRefs.current[slice.key]) animate(sliceRefs.current[slice.key], { scale: 1.04 }, { duration: 150, ease: 'outSine' });
  }, []);

  const handleLeave = useCallback((slice) => {
    setHovered(null);
    setAnchorPos(null);
    if (sliceRefs.current[slice.key]) animate(sliceRefs.current[slice.key], { scale: 1 }, { duration: 200, ease: 'outBack' });
  }, []);

  const handleClick = useCallback((slice) => {
    if (sliceRefs.current[slice.key]) {
      animate(sliceRefs.current[slice.key], { scale: [1.04, 0.96, 1.02, 1] }, { duration: 350, ease: 'outElastic(1, 0.5)' });
    }
    onGroupClick(activeGroup ? null : slice.key);
  }, [activeGroup, onGroupClick]);

  const hoveredSlice = slices.find((s) => s.key === hovered);
  const activeTotal = byGroup.find((g) => g.key === activeGroup)?.total || 0;

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
          {slices.map((s) => {
            const isActive = activeGroup === s.key;
            const isHovered = hovered === s.key;
            const isDimmed = activeGroup && activeGroup !== s.key;
            return (
              <g
                key={s.key}
                ref={(el) => (sliceRefs.current[s.key] = el)}
                style={{ cursor: 'pointer', transformOrigin: `${CX}px ${CY}px`, filter: isHovered || isActive ? `drop-shadow(0 0 8px ${s.hex}88)` : 'none' }}
                onMouseEnter={(e) => handleEnter(s, e)}
                onMouseLeave={() => handleLeave(s)}
                onMouseMove={(e) => setAnchorPos({ x: e.clientX, y: e.clientY })}
                onClick={() => handleClick(s)}
              >
                <path className="dona-slice" d={s.path} fill={s.hex} stroke="rgba(2,6,23,0.9)" strokeWidth="2.5"
                  opacity={isDimmed ? 0.25 : isActive ? 1 : 0.88} style={{ transition: 'opacity 0.2s' }} />
              </g>
            );
          })}
          {slices.filter((s) => s.pct > 8).map((s) => {
            const anchor = Math.cos(s.mid) >= 0 ? 'start' : 'end';
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
            {activeGroup ? TX_GROUPS?.find((g) => g.value === activeGroup)?.label : 'GASTOS'}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="white" fontSize="19" fontWeight="700" fontFamily="JetBrains Mono,monospace">
            Bs {(activeGroup ? activeTotal : totalExp).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </text>
          {activeGroup && (
            <text x={CX} y={CY + 24} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="8" fontFamily="JetBrains Mono,monospace">
              {slices.find((s) => s.key === activeGroup)?.pct.toFixed(1)}% del total
            </text>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', width: '100%' }}>
        {slices.map((s) => {
          const isActive = activeGroup === s.key;
          return (
            <button
              key={s.key} type="button" onClick={() => onGroupClick(isActive ? null : s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', borderRadius: '999px',
                border: `1px solid ${isActive ? s.hex : `${s.hex}33`}`, background: isActive ? `${s.hex}22` : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s', opacity: activeGroup && !isActive ? 0.35 : 1,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.hex, flexShrink: 0, boxShadow: isActive ? `0 0 6px ${s.hex}` : 'none' }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: isActive ? s.hex : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '0.58rem', color: isActive ? s.hex : 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono,monospace' }}>
                {s.pct.toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>

      {hoveredSlice && anchorPos && <DonutTooltip slice={hoveredSlice} anchorPos={anchorPos} />}
    </div>
  );
}
