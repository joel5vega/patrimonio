// src/pages/Analytics/components/ComparisonBanner.jsx
import { useRef, useEffect } from 'react';
import { animate } from 'animejs';
import DeltaBadge from '../../../ui/DeltaBadge';
import { fmtDate } from '../dateHelpers';

export default function ComparisonBanner({ period, prevRange, prevTotalExp, prevTotalInc, totalExp, totalInc }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, { opacity: [0, 1], y: [-6, 0] }, { duration: 250, ease: 'outExpo' });
  }, [period]);

  if (!prevRange || (prevTotalExp === 0 && prevTotalInc === 0)) return null;

  const balance = totalInc - totalExp;
  const prevBalance = prevTotalInc - prevTotalExp;

  const rows = [
    { label: 'Gastos', value: totalExp, prev: prevTotalExp, color: 'text-rose-400', invert: true },
    { label: 'Ingresos', value: totalInc, prev: prevTotalInc, color: 'text-emerald-400', invert: false },
    { label: 'Balance', value: Math.abs(balance), prev: Math.abs(prevBalance), color: balance >= 0 ? 'text-teal-400' : 'text-rose-400', invert: false },
  ];

  return (
    <div ref={ref} style={{ opacity: 0 }} className="bg-brand-card rounded-2xl border border-white/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
          <span className="text-10px font-bold text-white/40 uppercase tracking-wide">vs período anterior</span>
        </div>
        <span className="text-10px text-white/25">{fmtDate(prevRange.start)} → {fmtDate(prevRange.end)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rows.map(({ label, value, prev, color, invert }) => (
          <div key={label} className="bg-white/3 rounded-xl p-2">
            <p className="text-9px text-white/30 mb-1">{label}</p>
            <p className={`text-xs font-bold ${color}`}>
              Bs {value.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-1"><DeltaBadge current={value} previous={prev} invert={invert} /></div>
            <p className="text-9px text-white/20 mt-0.5">
              ant: Bs {prev.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
