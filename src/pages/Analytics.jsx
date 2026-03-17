import { useState, useMemo } from 'react';
import { useTransactions, TX_CATEGORIES, TX_GROUPS } from '../hooks/useTransactions';
import { BarChart2, PieChart, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import {useAuth} from '../context/AuthContext';
// ── Períodos ──────────────────────────────────────────────
const PERIODS = [
  { label: '7D',   value: '7d'  },
  { label: '1M',   value: '1m'  },
  { label: '3M',   value: '3m'  },
  { label: '1A',   value: '1y'  },
  { label: 'Todo', value: 'all' },
];

function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case '7d':  return new Date(now - 7  * 86400000);
    case '1m':  return new Date(now.getFullYear(), now.getMonth() - 1,  now.getDate());
    case '3m':  return new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
    case '1w':  return new Date(now - 7  * 86400000);
    case '1y':  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:    return null;
  }
}

// ── Mini barra de progreso ────────────────────────────────
const Bar = ({ pct, color }) => (
  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
);

// ── Colores por grupo ────────────────────────────────────
const GROUP_COLORS = {
  hogar:       'bg-blue-500',
  familia:     'bg-pink-500',
  desarrollo:  'bg-purple-500',
  fe:          'bg-yellow-500',
  inversiones: 'bg-emerald-500',
  ingresos:    'bg-teal-500',
  otros:       'bg-white/30',
};
const GROUP_TEXT = {
  hogar:       'text-blue-400',
  familia:     'text-pink-400',
  desarrollo:  'text-purple-400',
  fe:          'text-yellow-400',
  inversiones: 'text-emerald-400',
  ingresos:    'text-teal-400',
  otros:       'text-white/40',
};

// ── Componente principal ──────────────────────────────────
const Analytics = () => {
    const { user } = useAuth();
  const { transactions } = useTransactions();
  const [period,   setPeriod]   = useState('1m');
  const [viewMode, setViewMode] = useState('groups'); // 'groups' | 'categories'
 console.log('UID actual:', user?.uid);
  console.log('Transactions:', transactions.length);
  // Filtrar por período
  const filtered = useMemo(() => {
    const start = getStartDate(period);
    return transactions.filter(tx => {
      if (tx.type === 'transfer') return false;
      if (!start) return true;
      return new Date(tx.date) >= start;
    });
  }, [transactions, period]);

  const expenses = filtered.filter(tx => tx.type === 'expense');
  const incomes  = filtered.filter(tx => tx.type === 'income');

  const totalExp = expenses.reduce((s, tx) => s + tx.amount, 0);
  const totalInc = incomes.reduce((s,  tx) => s + tx.amount, 0);
  const balance  = totalInc - totalExp;

  // Agrupar gastos por grupo padre
  const byGroup = useMemo(() => {
    const map = {};
    for (const tx of expenses) {
      const key = tx.parentCategory || 'otros';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([key, total]) => ({ key, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Agrupar gastos por subcategoría
  const byCategory = useMemo(() => {
    const map = {};
    for (const tx of expenses) {
      const key = tx.category || 'other';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([key, total]) => {
        const meta = TX_CATEGORIES.find(c => c.value === key);
        return { key, total, label: meta?.label || key, emoji: meta?.emoji || '📦', parent: meta?.parent || 'otros' };
      })
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const maxGroup = byGroup[0]?.total || 1;
  const maxCat   = byCategory[0]?.total || 1;

  const groupLabel = (key) => TX_GROUPS.find(g => g.value === key)?.label || key;

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold">Análisis</h1>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('groups')}
            className={`p-2 rounded-xl text-sm ${viewMode === 'groups' ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40'}`}>
            <PieChart size={16} />
          </button>
          <button onClick={() => setViewMode('categories')}
            className={`p-2 rounded-xl text-sm ${viewMode === 'categories' ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40'}`}>
            <BarChart2 size={16} />
          </button>
        </div>
      </div>

      {/* Period Pills */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-colors ${
              period === p.value ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40 border border-white/10'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-brand-card rounded-2xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40 mb-1">Ingresos</p>
          <p className="text-sm font-bold text-emerald-400">
            Bs {totalInc.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-brand-card rounded-2xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40 mb-1">Gastos</p>
          <p className="text-sm font-bold text-rose-400">
            Bs {totalExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-brand-card rounded-2xl p-3 border border-white/5">
          <p className="text-[10px] text-white/40 mb-1">Balance</p>
          <div className="flex items-center gap-1">
            {balance >= 0
              ? <TrendingUp size={12} className="text-teal-400" />
              : <TrendingDown size={12} className="text-rose-400" />}
            <p className={`text-sm font-bold ${balance >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              Bs {Math.abs(balance).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico por grupos */}
      {viewMode === 'groups' && (
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="font-bold text-sm">Gastos por grupo</h3>
          {byGroup.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Sin datos en este período</p>
          )}
          {byGroup.map(({ key, total }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-semibold ${GROUP_TEXT[key] || 'text-white/60'}`}>
                  {groupLabel(key)}
                </span>
                <span className="text-white/50">
                  Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  <span className="text-white/30 ml-1">
                    ({((total / totalExp) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
              <Bar pct={(total / maxGroup) * 100} color={GROUP_COLORS[key] || 'bg-white/20'} />
            </div>
          ))}
        </div>
      )}

      {/* Gráfico por categorías */}
      {viewMode === 'categories' && (
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="font-bold text-sm">Gastos por categoría</h3>
          {byCategory.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Sin datos en este período</p>
          )}
          {byCategory.map(({ key, total, label, emoji, parent }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">
                  {emoji} {label}
                </span>
                <span className="text-white/50">
                  Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  <span className="text-white/30 ml-1">
                    ({((total / totalExp) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
              <Bar pct={(total / maxCat) * 100} color={GROUP_COLORS[parent] || 'bg-white/20'} />
            </div>
          ))}
        </div>
      )}

      {/* Top transacciones del período */}
      <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-2">
        <h3 className="font-bold text-sm mb-3">Top gastos del período</h3>
        {expenses
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map(tx => {
            const meta = TX_CATEGORIES.find(c => c.value === tx.category);
            return (
              <div key={tx.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span>{meta?.emoji || '📦'}</span>
                  <div>
                    <p className="font-semibold">{tx.concept || tx.title}</p>
                    <p className="text-white/30">{tx.date}</p>
                  </div>
                </div>
                <span className="text-rose-400 font-bold">
                  Bs {tx.amount.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Analytics;
