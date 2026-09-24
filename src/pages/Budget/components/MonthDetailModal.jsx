// src/pages/Budget/components/MonthDetailModal.jsx
import { useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { TX_CATEGORIES } from '../../../hooks/useTransactions';
import { getTxsInMonth } from '../budgetHelpers';

export default function MonthDetailModal({ data, onClose }) {
  const { label, year, month, groupLabel, budget, spent, ok, hex, transactions, groupKey } = data;
  const sheetRef = useRef(null);

  const txs = useMemo(() => getTxsInMonth(transactions, groupKey, year, month), [transactions, groupKey, year, month]);
  const byCategory = useMemo(() => {
    const map = {};
    txs.forEach((tx) => {
      const key = tx.category || 'other';
      map[key] = (map[key] || 0) + tx.amount;
    });
    return Object.entries(map)
      .map(([key, total]) => {
        const meta = TX_CATEGORIES.find((c) => c.value === key);
        return { key, total, label: meta?.label || key, emoji: meta?.emoji || '📦' };
      })
      .sort((a, b) => b.total - a.total);
  }, [txs]);

  useEffect(() => {
    if (!sheetRef.current) return;
    animate(sheetRef.current, { translateY: ['100%', '0%'], opacity: [0, 1], duration: 320, ease: 'outExpo' });
    if (sheetRef.current.querySelectorAll('.detail-row').length) {
      animate(sheetRef.current.querySelectorAll('.detail-row'), { opacity: [0, 1], translateX: [-12, 0], duration: 250, delay: stagger(40), ease: 'outExpo' });
    }
  }, []);

  const handleClose = () => {
    if (!sheetRef.current) { onClose(); return; }
    animate(sheetRef.current, { translateY: ['0%', '100%'], opacity: [1, 0], duration: 220, ease: 'inExpo' });
    setTimeout(onClose, 220);
  };

  const diff = budget > 0 ? budget - spent : null;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = budget > 0 && spent > budget;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={handleClose}>
      <div ref={sheetRef} onClick={(e) => e.stopPropagation()} className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl"
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', opacity: 0 }}>

        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>

        <div className="px-5 pt-2 pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: hex + '22', color: hex, border: `1px solid ${hex}44` }}>
                {label} {year}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px',
                background: ok === null ? 'rgba(255,255,255,0.05)' : ok ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                color: ok === null ? 'rgba(255,255,255,0.3)' : ok ? '#34d399' : '#fb7185',
                border: `1px solid ${ok === null ? 'rgba(255,255,255,0.1)' : ok ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              }}>
                {ok === null ? 'Sin presupuesto' : ok ? '✓ Cumplido' : '✗ Excedido'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{groupLabel}</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/70">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 space-y-5 pb-8">
          <div className="grid grid-cols-3 gap-2">
            {[
              { lbl: 'Gastado', val: `Bs ${spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`, color: isOver ? 'text-rose-400' : 'text-white' },
              { lbl: 'Presupuesto', val: budget > 0 ? `Bs ${budget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}` : '—', color: 'text-white/60' },
              {
                lbl: diff !== null ? (isOver ? 'Exceso' : 'Restó') : 'Transacc.',
                val: diff !== null ? `Bs ${Math.abs(diff).toLocaleString('es-BO', { maximumFractionDigits: 0 })}` : `${txs.length}`,
                color: diff !== null ? (isOver ? 'text-rose-400' : 'text-emerald-400') : 'text-white/60',
              },
            ].map(({ lbl, val, color }) => (
              <div key={lbl} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-[9px] text-white/30 mb-1 uppercase tracking-wide">{lbl}</p>
                <p className={`text-sm font-bold font-mono ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          {budget > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-white/30">
                <span>0</span>
                <span className={pct > 100 ? 'text-rose-400 font-bold' : ''}>{pct.toFixed(0)}%</span>
                <span>Bs {budget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#f43f5e' : hex }} />
              </div>
            </div>
          )}

          {byCategory.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide">Por categoría</p>
              {byCategory.map(({ key, total, label: catLabel, emoji }) => (
                <div key={key} className="detail-row space-y-1" style={{ opacity: 0 }}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/70">{emoji} {catLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-[10px]">{spent > 0 ? ((total / spent) * 100).toFixed(0) : 0}%</span>
                      <span className="text-white/80 font-semibold font-mono">Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(total / (byCategory[0]?.total || 1)) * 100}%`, background: hex + 'cc' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
