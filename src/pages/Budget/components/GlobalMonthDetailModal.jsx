// src/pages/Budget/components/GlobalMonthDetailModal.jsx
import { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { GROUP_HEX } from '../../../features/transactions/constants/groupPalette';
import { getGlobalMonthDetail } from '../budgetHelpers';
import MonthDetailModal from './MonthDetailModal';

export default function GlobalMonthDetailModal({ data, onClose }) {
  const { label, year, month, groups, groupBudgetsMap, transactions } = data;
  const sheetRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const detail = useMemo(
    () => getGlobalMonthDetail(transactions, groups, groupBudgetsMap, year, month),
    [transactions, groups, groupBudgetsMap, year, month],
  );

  const passed = detail.filter((d) => d.ok === true).length;
  const failed = detail.filter((d) => d.ok === false).length;
  const total = detail.filter((d) => d.ok !== null).length;

  useEffect(() => {
    if (!sheetRef.current) return;
    animate(sheetRef.current, { translateY: ['100%', '0%'], opacity: [0, 1], duration: 320, ease: 'outExpo' });
    animate(sheetRef.current.querySelectorAll('.gm-row'), { opacity: [0, 1], translateX: [-10, 0], duration: 250, delay: stagger(50), ease: 'outExpo' });
  }, []);

  const handleClose = () => {
    animate(sheetRef.current, { translateY: ['0%', '100%'], opacity: [1, 0], duration: 220, ease: 'inExpo' });
    setTimeout(onClose, 220);
  };

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={handleClose}>
        <div ref={sheetRef} onClick={(e) => e.stopPropagation()} className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', opacity: 0 }}>

          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>

          <div className="px-5 pt-2 pb-4 flex justify-between items-start">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide font-bold mb-0.5">Cumplimiento global</p>
              <h2 className="text-xl font-bold">{label} {year}</h2>
              <div className="flex gap-1.5 mt-1.5">
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                  ✓ {passed} cumplidos
                </span>
                {failed > 0 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}>
                    ✗ {failed} excedidos
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/70">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 space-y-3 pb-8">
            {total > 0 && (
              <div className="bg-white/5 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Grupos con presupuesto</span>
                  <span className="font-bold font-mono">{passed}/{total}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(passed / total) * 100}%`, background: passed === total ? '#10b981' : passed > 0 ? '#eab308' : '#f43f5e' }} />
                </div>
              </div>
            )}

            {detail.map(({ key, label: gLabel, budget, spent, ok, pct }) => {
              const hex = GROUP_HEX[key] || 'rgba(255,255,255,0.3)';
              const isOver = ok === false;
              const diff = budget > 0 ? budget - spent : null;

              return (
                <div key={key} className="gm-row" style={{ opacity: 0 }}>
                  <button
                    type="button"
                    onClick={() => setSelected({ groupKey: key, groupLabel: gLabel, budget, spent, ok, hex, label, year, month, transactions })}
                    className="w-full bg-white/5 rounded-2xl p-3.5 space-y-2.5 text-left hover:bg-white/8 transition-colors active:scale-[0.98]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hex }} />
                        <span className="text-sm font-bold" style={{ color: hex }}>{gLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ok !== null && (
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '999px',
                            background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                            color: ok ? '#34d399' : '#fb7185',
                            border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                          }}>
                            {ok ? '✓ Cumplido' : '✗ Excedido'}
                          </span>
                        )}
                      </div>
                    </div>

                    {budget > 0 && (
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#f43f5e' : hex }} />
                      </div>
                    )}

                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">
                        Bs {spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                        {budget > 0 && <span className="text-white/20"> / {budget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>}
                      </span>
                      {diff !== null && (
                        <span style={{ color: isOver ? '#fb7185' : '#34d399' }} className="font-semibold font-mono">
                          {isOver ? `+${(spent - budget).toLocaleString('es-BO', { maximumFractionDigits: 0 })}` : `-${diff.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && <MonthDetailModal data={selected} onClose={() => setSelected(null)} />}
    </>,
    document.body,
  );
}
