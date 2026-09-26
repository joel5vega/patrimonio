// src/pages/Analytics/components/CategoryRow.jsx
import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { TX_GROUPS } from '../../../hooks/useTransactions';
import { GROUP_COLORS, GROUP_TEXT, GROUP_HEX } from '../../../features/transactions/constants/groupPalette';
import DeltaBadge from '../../../ui/DeltaBadge';

export default function CategoryRow({ groupKey, total: groupTotal, totalExp: expensesTotal, categories, maxGroup: groupMax, prevTotal: prevRowTotal }) {
  const [open, setOpen] = useState(false);
  const subRef = useRef(null);

  const color = GROUP_COLORS[groupKey] || 'bg-[#1f1f1f]/20';
  const text = GROUP_TEXT[groupKey] || 'text-[#eeeeee]/60';
  const hex = GROUP_HEX[groupKey] || 'rgba(255,255,255,0.3)';
  const groupLabel = TX_GROUPS?.find((group) => group.value === groupKey)?.label || groupKey;

  const subItems = categories
    .filter((category) => category.parent === groupKey)
    .map((category) => ({ key: category.key, subTotal: Number(category.total) || 0, label: category.label || category.key, emoji: category.emoji || '' }))
    .sort((a, b) => b.subTotal - a.subTotal);

  const subMax = Math.max(...subItems.map((item) => item.subTotal), 1);

  useEffect(() => {
    if (!subRef.current || !open) return;
    animate(subRef.current.querySelectorAll('.sub-cat-row'), { opacity: [0, 1], translateX: [-8, 0] }, { duration: 200, delay: stagger(30), ease: 'outExpo' });
  }, [open]);

  const groupPercentage = expensesTotal > 0 ? (groupTotal / expensesTotal) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <button type="button" onClick={() => subItems.length > 0 && setOpen((v) => !v)} className="w-full text-left">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5">
            {subItems.length > 0 && (
              <ChevronRight size={12} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''} text-[#eeeeee]/30`} />
            )}
            <span className={`font-bold ${text}`}>{groupLabel}</span>
            {subItems.length > 0 && <span className="text-10px text-[#eeeeee]/20">{subItems.length} cat.</span>}
          </div>
          <div className="flex items-center gap-2">
            <DeltaBadge current={groupTotal} previous={prevRowTotal} invert />
            <span className="text-[#eeeeee]/30 text-10px">{groupPercentage.toFixed(0)}%</span>
            <span className="font-bold text-[#eeeeee]/80">
              Bs {groupTotal.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </button>

      <div className="mt-1.5 h-1.5 bg-[#1f1f1f]/5 rounded overflow-hidden">
        <div className={`h-full rounded transition-all duration-500 ${color}`} style={{ width: `${Math.min((groupTotal / groupMax) * 100, 100)}%` }} />
      </div>

      {open && subItems.length > 0 && (
        <div ref={subRef} className="pl-4 space-y-2 mt-1 border-l border-white/5 ml-1.5">
          {subItems.map(({ key, subTotal, label, emoji }) => {
            const subPercentage = groupTotal > 0 ? (subTotal / groupTotal) * 100 : 0;
            const subBarPercentage = subMax > 0 ? (subTotal / subMax) * 100 : 0;
            return (
              <div key={key} className="sub-cat-row space-y-1" style={{ opacity: 0 }}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#eeeeee]/60 flex items-center gap-1.5">
                    <span className="text-sm">{emoji}</span>{label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#eeeeee]/25 text-10px">{subPercentage.toFixed(0)}%</span>
                    <span className="text-[#eeeeee]/50 font-semibold">
                      Bs {subTotal.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-[#1f1f1f]/5 rounded overflow-hidden">
                  <div className="h-full rounded opacity-60 transition-all duration-500" style={{ width: `${Math.min(subBarPercentage, 100)}%`, background: hex }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
