// src/pages/Budget/components/GlobalSummary.jsx
import Bar from '../../../ui/Bar';

export default function GlobalSummary({ totalSpentM, totalBudget, totalSpentW, overallPct, globalHistory, onSelectMonth }) {
  return (
    <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
      <div className="flex justify-between text-xs text-white/50">
        <span>Gastado este mes</span>
        <span>
          <span className={overallPct > 100 ? 'text-rose-400 font-bold' : 'text-white/70'}>
            Bs {totalSpentM.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </span>
          {totalBudget > 0 && (
            <span className="text-white/30"> / Bs {totalBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
          )}
        </span>
      </div>

      <Bar pct={overallPct} color="bg-teal-500" warn={overallPct > 100} />

      <div className="flex justify-between text-[10px] text-white/30">
        <span>Semana: Bs {totalSpentW.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
        {totalBudget > 0 && <span>{overallPct.toFixed(0)}% del presupuesto total</span>}
      </div>

      {totalBudget > 0 && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide mb-2">
            Cumplimiento global — toca para ver detalle
          </p>
          <div className="flex gap-2">
            {globalHistory.map((h, i) => (
              <button key={i} type="button" onClick={() => onSelectMonth(h)}
                className="flex-1 flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition-all"
                style={{
                  padding: '0.4rem 0.2rem', borderRadius: '0.75rem',
                  background: h.total === 0 ? 'rgba(255,255,255,0.03)' : h.allGood ? 'rgba(16,185,129,0.08)' : h.passed > 0 ? 'rgba(234,179,8,0.08)' : 'rgba(244,63,94,0.08)',
                  border: `1px solid ${h.total === 0 ? 'rgba(255,255,255,0.05)' : h.allGood ? 'rgba(16,185,129,0.2)' : h.passed > 0 ? 'rgba(234,179,8,0.2)' : 'rgba(244,63,94,0.2)'}`,
                }}>
                <span style={{ fontSize: '1rem', filter: h.total === 0 ? 'grayscale(1) opacity(0.3)' : undefined }}>
                  {h.total === 0 ? '○' : h.allGood ? '✅' : h.passed > 0 ? '⚠️' : '❌'}
                </span>
                <span className="text-[8px] text-white/30">{h.label}</span>
                {h.total > 0 && (
                  <span className="text-[8px] font-mono font-bold" style={{ color: h.allGood ? '#10b981' : h.passed > 0 ? '#eab308' : '#f43f5e' }}>
                    {h.passed}/{h.total}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
