// src/pages/Budget/components/BudgetHistory.jsx
import { useState, useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import MonthDetailModal from './MonthDetailModal';

export default function BudgetHistory({ history, hex, transactions, groupKey, groupLabel, budget }) {
  const ref = useRef(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current.querySelectorAll('.hist-bar'), { scaleY: [0, 1], opacity: [0, 1], duration: 400, delay: stagger(60), ease: 'outExpo' });
  }, []);

  const maxSpent = Math.max(...history.map((h) => Math.max(h.spent, h.budget || 0)), 1);

  return (
    <>
      <div ref={ref} className="pt-3 border-t border-white/5 space-y-2">
        <p className="text-[10px] text-[#eeeeee]/30 font-bold uppercase tracking-wide">Historial — toca un mes para ver detalles</p>
        <div className="flex items-end gap-1.5 h-16">
          {history.map((h, i) => (
            <button key={i} type="button" onClick={() => setModal({ ...h, groupKey, groupLabel, budget, hex, transactions })}
              className="flex-1 flex flex-col items-center gap-1 h-full hover:opacity-80 active:scale-95 transition-all">
              <div className="flex-1 w-full flex items-end relative">
                {h.budget > 0 && (
                  <div className="absolute w-full border-t border-dashed border-[#323232]" style={{ bottom: `${(h.budget / maxSpent) * 100}%` }} />
                )}
                <div className="hist-bar w-full rounded-t-sm origin-bottom"
                  style={{ height: `${Math.max((h.spent / maxSpent) * 100, h.spent > 0 ? 4 : 0)}%`, background: h.ok === null ? 'rgba(255,255,255,0.15)' : h.ok ? hex + 'cc' : '#f43f5e' }} />
              </div>
              <span className="text-[8px] text-[#eeeeee]/30 leading-none">{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      {modal && <MonthDetailModal data={modal} onClose={() => setModal(null)} />}
    </>
  );
}
