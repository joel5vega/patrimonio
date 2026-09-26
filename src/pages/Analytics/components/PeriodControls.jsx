// src/pages/Analytics/components/PeriodControls.jsx
import { useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { animate } from 'animejs';
import { PERIODS } from '../useAnalyticsData';
import { toInputDate, fmtDate } from '../dateHelpers';

function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, onClear }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerRef.current) return;
    animate(pickerRef.current, { opacity: [0, 1], y: [-8, 0] }, { duration: 220, ease: 'outExpo' });
  }, []);

  return (
    <div ref={pickerRef} className="bg-[#1f1f1f] border border-[#262626] rounded-lg p-4 space-y-3" style={{ opacity: 0 }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-[#2b7fff]" />
          <span className="text-xs font-bold text-[#eeeeee]/70">Rango personalizado</span>
        </div>
        <button type="button" onClick={onClear} className="text-[#eeeeee]/30 hover:text-[#eeeeee]/60 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: 'Desde', value: toInputDate(startDate), max: toInputDate(endDate || new Date()), min: undefined,
            onChange: (e) => onStartChange(e.target.value ? new Date(`${e.target.value}T00:00:00`) : null),
            display: startDate,
          },
          {
            label: 'Hasta', value: toInputDate(endDate), max: toInputDate(new Date()), min: toInputDate(startDate),
            onChange: (e) => onEndChange(e.target.value ? new Date(`${e.target.value}T23:59:59`) : null),
            display: endDate,
          },
        ].map(({ label, value, max, min, onChange, display }) => (
          <div key={label}>
            <label className="text-10px text-[#eeeeee]/40 block mb-1.5 font-semibold uppercase tracking-wide">{label}</label>
            <input
              type="date" value={value} max={max} min={min} onChange={onChange}
              className="w-full bg-[#1f1f1f]/5 border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#eeeeee]/80 focus:outline-none focus:border-[#2b7fff]/50 transition-all color-scheme:dark"
            />
            {display && <p className="text-10px text-[#2b7fff] mt-1 ml-1">{fmtDate(display)}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { label: 'Este mes', fn: () => { const n = new Date(); onStartChange(new Date(n.getFullYear(), n.getMonth(), 1)); onEndChange(new Date()); } },
          { label: 'Mes pasado', fn: () => { const n = new Date(); onStartChange(new Date(n.getFullYear(), n.getMonth() - 1, 1)); onEndChange(new Date(n.getFullYear(), n.getMonth(), 0)); } },
          { label: 'Año 2026', fn: () => { onStartChange(new Date('2026-01-01')); onEndChange(new Date('2026-12-31')); } },
        ].map(({ label, fn }) => (
          <button key={label} type="button" onClick={fn}
            className="text-10px px-2.5 py-1 rounded border border-[#262626] text-[#eeeeee]/40 hover:text-[#2b7fff] hover:border-[#2b7fff]/40 transition-all font-semibold">
            {label}
          </button>
        ))}
      </div>

      {startDate && endDate && (
        <div className="bg-[#2b7fff]/10 border border-[#2b7fff]/20 rounded-xl px-3 py-2">
          <p className="text-11px text-[#2b7fff] font-semibold">{fmtDate(startDate)} → {fmtDate(endDate)}</p>
          <p className="text-10px text-[#eeeeee]/40 mt-0.5">
            {Math.round((endDate - startDate) / 86400000) + 1} días seleccionados
          </p>
        </div>
      )}
    </div>
  );
}

export default function PeriodControls({ period, setPeriod, customStart, customEnd, setCustomStart, setCustomEnd }) {
  return (
    <>
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
              period === p.value
                ? p.value === 'custom' ? 'bg-purple-500 text-[#eeeeee]' : 'bg-[#2b7fff] text-[#eeeeee]'
                : 'bg-[#1f1f1f] text-[#eeeeee]/40 border border-[#262626]'
            }`}
          >
            {p.value === 'custom' ? (
              <span className="flex items-center justify-center gap-1"><Calendar size={11} />{p.label}</span>
            ) : p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <DateRangePicker
          startDate={customStart}
          endDate={customEnd}
          onStartChange={setCustomStart}
          onEndChange={setCustomEnd}
          onClear={() => { setCustomStart(null); setCustomEnd(null); setPeriod('1m'); }}
        />
      )}
    </>
  );
}
