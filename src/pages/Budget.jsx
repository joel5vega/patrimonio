// src/pages/Budget.jsx
import { useState, useMemo } from 'react';
import { useTransactions, TX_GROUPS } from '../hooks/useTransactions';
import { useBudget } from '../hooks/useBudget';
import { CheckCircle, AlertTriangle, Edit2, X, Save } from 'lucide-react';
import { isInPeriod, parseLocal } from '../utils/filterByPeriod';
import { useAuth } from '../context/AuthContext';

const GROUP_COLORS = {
  hogar: 'bg-blue-500', familia: 'bg-pink-500',
  desarrollo: 'bg-purple-500', fe: 'bg-yellow-500',
  inversiones: 'bg-emerald-500', ingresos: 'bg-teal-500', otros: 'bg-white/30',
};
const GROUP_TEXT = {
  hogar: 'text-blue-400', familia: 'text-pink-400',
  desarrollo: 'text-purple-400', fe: 'text-yellow-400',
  inversiones: 'text-emerald-400', ingresos: 'text-teal-400', otros: 'text-white/40',
};

// Promedio mensual de los últimos N meses usando parseLocal
function getMonthlyAvg(transactions, group, months = 3) {
  const results = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const total = transactions
      .filter(tx => tx.type === 'expense' && tx.parentCategory === group)
      .filter(tx => {
        const d = parseLocal(tx.date);
        return d >= start && d <= end;
      })
      .reduce((s, tx) => s + tx.amount, 0);
    results.push(total);
  }
  return results.reduce((a, b) => a + b, 0) / months;
}

const Bar = ({ pct, color, warn }) => (
  <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all ${warn ? 'bg-rose-500' : color}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  </div>
);

export default function Budget() {
  const { transactions } = useTransactions();
  
  const { budgets, saveBudget ,loading: budgetLoading} = useBudget();
  const [editing, setEditing] = useState(null);
  const [inputVal, setInputVal] = useState('');

  // Gasto del mes actual por grupo — usa isInPeriod('month')
  const monthlyByGroup = useMemo(() => {
    const map = {};
    transactions
      .filter(tx => tx.type === 'expense' && isInPeriod(tx.date, 'month'))
      .forEach(tx => {
        const key = tx.parentCategory || 'otros';
        map[key] = (map[key] || 0) + tx.amount;
      });
    return map;
  }, [transactions]);

  // Gasto de la semana actual por grupo — usa isInPeriod('week')
  const weeklyByGroup = useMemo(() => {
    const map = {};
    transactions
      .filter(tx => tx.type === 'expense' && isInPeriod(tx.date, 'week'))
      .forEach(tx => {
        const key = tx.parentCategory || 'otros';
        map[key] = (map[key] || 0) + tx.amount;
      });
    return map;
  }, [transactions]);

  const groups = TX_GROUPS.filter(g => g.value !== 'ingresos');

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpentM = Object.values(monthlyByGroup).reduce((a, b) => a + b, 0);
  const totalSpentW = Object.values(weeklyByGroup).reduce((a, b) => a + b, 0);
  const overallPct  = totalBudget > 0 ? (totalSpentM / totalBudget) * 100 : 0;

  const handleEdit = (key) => {
    setEditing(key);
    setInputVal(budgets[key] || '');
  };
  const handleSave = () => {
    if (editing) saveBudget(editing, inputVal);
    setEditing(null);
  };
 if (budgetLoading) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-white/40 text-sm animate-pulse">Cargando presupuesto...</p>
    </div>
  );
  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Presupuesto</h1>
        <p className="text-white/40 text-xs mt-0.5">
          {new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Resumen global del mes */}
      <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
        <div className="flex justify-between text-xs text-white/50">
          <span>Gastado este mes</span>
          <span>
            <span className={overallPct > 100 ? 'text-rose-400 font-bold' : 'text-white/70'}>
              Bs {totalSpentM.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </span>
            {totalBudget > 0 && (
              <span className="text-white/30">
                {' '}/ Bs {totalBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
              </span>
            )}
          </span>
        </div>
        <Bar pct={overallPct} color="bg-teal-500" warn={overallPct > 100} />
        <div className="flex justify-between text-[10px] text-white/30">
          <span>
            Esta semana: Bs {totalSpentW.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </span>
          {totalBudget > 0 && (
            <span>{overallPct.toFixed(0)}% del presupuesto total</span>
          )}
        </div>
      </div>

      {/* Cards por grupo */}
      <div className="space-y-3">
        {groups.map(({ value: key, label }) => {
          const budget = budgets[key] || 0;
          const spent  = monthlyByGroup[key] || 0;
          const weekly = weeklyByGroup[key] || 0;
          const avg    = getMonthlyAvg(transactions, key, 3);
          const pct    = budget > 0 ? (spent / budget) * 100 : 0;
          const isOver = budget > 0 && spent > budget;
          const isEdit = editing === key;

          return (
            <div key={key} className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-2">
              {/* Título */}
              <div className="flex justify-between items-center">
                <span className={`font-bold text-sm ${GROUP_TEXT[key] || 'text-white/60'}`}>
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {isOver
                    ? <AlertTriangle size={13} className="text-rose-400" />
                    : budget > 0
                    ? <CheckCircle size={13} className="text-emerald-400" />
                    : null}
                  <button
                    onClick={() => isEdit ? setEditing(null) : handleEdit(key)}
                    className="p-1 rounded-lg bg-white/5 text-white/40"
                  >
                    {isEdit ? <X size={12} /> : <Edit2 size={12} />}
                  </button>
                </div>
              </div>

              {/* Editor de presupuesto */}
              {isEdit && (
                <div className="flex gap-2 items-center">
                  <span className="text-white/40 text-xs">Bs</span>
                  <input
                    type="number"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    className="flex-1 bg-white/10 rounded-xl px-3 py-1.5 text-sm text-white outline-none"
                    placeholder="Presupuesto mensual"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="bg-brand-teal text-black px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Save size={12} /> Guardar
                  </button>
                </div>
              )}

              {/* Barra de progreso */}
              <div className="flex items-center gap-2">
                <Bar
                  pct={budget > 0 ? pct : 0}
                  color={GROUP_COLORS[key] || 'bg-white/20'}
                  warn={isOver}
                />
                <span className={`text-xs font-bold min-w-[36px] text-right ${isOver ? 'text-rose-400' : 'text-white/50'}`}>
                  {budget > 0 ? `${pct.toFixed(0)}%` : '—'}
                </span>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-1 text-[10px] text-white/40">
                <div>
                  <p>Este mes</p>
                  <p className="text-white/70 font-semibold">
                    Bs {spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p>Esta semana</p>
                  <p className="text-white/70 font-semibold">
                    Bs {weekly.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p>Promedio 3M</p>
                  <p className="text-white/70 font-semibold">
                    Bs {avg.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Estado presupuesto */}
              {budget > 0 && (
                <p className={`text-[10px] font-semibold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isOver
                    ? `⚠ Excedido por Bs ${(spent - budget).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
                    : `✓ Restan Bs ${(budget - spent).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}