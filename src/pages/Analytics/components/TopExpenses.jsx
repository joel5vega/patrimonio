// src/pages/Analytics/components/TopExpenses.jsx
import { TX_CATEGORIES } from '../../../hooks/useTransactions';
import { fmtDate } from '../dateHelpers';

export default function TopExpenses({ expenses }) {
  return (
    <div className="bg-[#1f1f1f] rounded-lg border border-white/5 p-4 space-y-2 analytics-card">
      <h3 className="font-bold text-sm mb-3">Mayores egresos del período</h3>
      {expenses.length === 0 ? (
        <p className="text-[#eeeeee]/30 text-sm text-center py-3">Sin registro de gastos</p>
      ) : (
        <div className="space-y-2">
          {[...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map((tx) => {
            const meta = TX_CATEGORIES.find((c) => c.value === tx.category);
            return (
              <div key={tx.id} className="flex justify-between items-center text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta?.emoji}</span>
                  <div>
                    <p className="font-semibold text-[#eeeeee]/90">{tx.concept || tx.title || 'Gasto'}</p>
                    <p className="text-10px text-[#eeeeee]/30">{fmtDate(tx.date)}</p>
                  </div>
                </div>
                <span className="text-rose-400 font-bold">
                  Bs {tx.amount.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
