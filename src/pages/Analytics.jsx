import { useState, useMemo } from 'react';
import { useTransactions, TX_CATEGORIES, TX_GROUPS } from '../hooks/useTransactions';
import { BarChart2, PieChart, TrendingDown, TrendingUp, Lightbulb, Target, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    case '7d': return new Date(now - 7 * 86400000);
    case '1m': return new Date(now.getFullYear(), now.getMonth() - 1,  now.getDate());
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:   return null;
  }
}

// ── Normalizar fecha a Date (sin tocar el hook) ───────────
function toDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw?.toDate === 'function') return raw.toDate(); // Firestore Timestamp
  if (typeof raw === 'number') return new Date(raw);
  if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

// ── Formatear fecha para mostrar ─────────────────────────
function fmtDate(raw) {
  const d = toDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Helpers de tendencia mensual ──────────────────────────
function getMonthStart(monthsAgo) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}
function getMonthEnd(monthsAgo) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
}

// ── UI helpers ────────────────────────────────────────────
const Bar = ({ pct, color }) => (
  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
);

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

// ── Sparkline SVG ─────────────────────────────────────────
const Sparkline = ({ data, color = '#2dd4bf' }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = 28;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - (v / max) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

// ── Insights financieros ──────────────────────────────────
function getInsights({ savingsRate, byGroup, totalExp, monthlyTrend }) {
  const tips = [];
  if (savingsRate < 0)
    tips.push({ icon: '🚨', color: 'text-rose-400', msg: 'Estás gastando más de lo que ingresas. Revisa gastos no esenciales.' });
  else if (savingsRate < 10)
    tips.push({ icon: '⚠️', color: 'text-yellow-400', msg: `Tu tasa de ahorro es ${savingsRate.toFixed(0)}%. Lo recomendado es ≥20%.` });
  else if (savingsRate >= 20)
    tips.push({ icon: '✅', color: 'text-emerald-400', msg: `¡Excelente! Estás ahorrando el ${savingsRate.toFixed(0)}% de tus ingresos.` });

  const topGroup = byGroup[0];
  if (topGroup && totalExp > 0) {
    const pct = (topGroup.total / totalExp) * 100;
    if (pct > 40)
      tips.push({ icon: '📊', color: 'text-orange-400', msg: `"${topGroup.key}" consume el ${pct.toFixed(0)}% de tus gastos.` });
  }

  if (monthlyTrend.length >= 2) {
    const last = monthlyTrend[monthlyTrend.length - 1].exp;
    const prev = monthlyTrend[monthlyTrend.length - 2].exp;
    const change = ((last - prev) / (prev || 1)) * 100;
    if (change > 15)
      tips.push({ icon: '📈', color: 'text-rose-300', msg: `Tus gastos subieron ${change.toFixed(0)}% vs el mes anterior.` });
    else if (change < -10)
      tips.push({ icon: '📉', color: 'text-teal-400', msg: `¡Bien! Redujiste gastos un ${Math.abs(change).toFixed(0)}% vs el mes pasado.` });
  }

  if (tips.length === 0)
    tips.push({ icon: '💡', color: 'text-white/50', msg: 'Registra más transacciones para recibir consejos personalizados.' });

  return tips;
}

// ── Componente principal ──────────────────────────────────
const Analytics = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [period,   setPeriod]   = useState('1m');
  const [viewMode, setViewMode] = useState('groups');

  // Filtrar por período — toDate() aquí para no tocar el hook
  const filtered = useMemo(() => {
    const start = getStartDate(period);
    return transactions.filter(tx => {
      if (tx.type === 'transfer') return false;
      if (!start) return true;
      const d = toDate(tx.date);
      return d && d >= start;
    });
  }, [transactions, period]);

  const expenses = filtered.filter(tx => tx.type === 'expense');
  const incomes  = filtered.filter(tx => tx.type === 'income');

  const totalExp    = expenses.reduce((s, tx) => s + tx.amount, 0);
  const totalInc    = incomes.reduce((s,  tx) => s + tx.amount, 0);
  const balance     = totalInc - totalExp;
  const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

  // Tendencia 6 meses
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const start = getMonthStart(5 - i);
      const end   = getMonthEnd(5 - i);
      const label = start.toLocaleString('es-BO', { month: 'short' });
      const txs   = transactions.filter(tx => {
        if (tx.type === 'transfer') return false;
        const d = toDate(tx.date);
        return d && d >= start && d <= end;
      });
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
      return { label, exp, inc };
    });
  }, [transactions]);

  const avgMonthlyExp = useMemo(() => {
    const last3 = monthlyTrend.slice(-3);
    return last3.reduce((s, m) => s + m.exp, 0) / 3;
  }, [monthlyTrend]);

  const projectedExp = useMemo(() => {
    if (period !== '1m') return null;
    const now = new Date();
    const day = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return (totalExp / day) * daysInMonth;
  }, [totalExp, period]);

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

  const now         = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft    = daysInMonth - now.getDate();
  const dailyBudget = balance > 0 ? balance / (daysLeft || 1) : 0;

  const insights = getInsights({ savingsRate, byGroup, totalExp, monthlyTrend });

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

      {/* KPIs Financieros */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tasa de ahorro */}
        <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-white/40">Tasa de ahorro</p>
            <Target size={14} className="text-white/20" />
          </div>
          <p className={`text-xl font-bold ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-rose-400'}`}>
            {savingsRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-white/30 mt-1">Meta recomendada: 20%</p>
          <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Gasto promedio mensual */}
        <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-white/40">Gasto promedio/mes</p>
            <Sparkline data={monthlyTrend.map(m => m.exp)} />
          </div>
          <p className="text-xl font-bold text-white/80">
            Bs {avgMonthlyExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-white/30 mt-1">Últimos 3 meses</p>
        </div>

        {/* Proyección fin de mes */}
        {projectedExp !== null && (
          <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/40">Proyección mes</p>
              <ArrowUpRight size={14} className="text-white/20" />
            </div>
            <p className={`text-xl font-bold ${projectedExp > totalInc ? 'text-rose-400' : 'text-white/80'}`}>
              Bs {projectedExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-white/30 mt-1">Al ritmo actual de gasto</p>
          </div>
        )}

        {/* Disponible por día */}
        {period === '1m' && (
          <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/40">Disponible/día</p>
              <span className="text-[10px] text-white/30">{daysLeft}d restantes</span>
            </div>
            <p className={`text-xl font-bold ${dailyBudget > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              Bs {Math.max(dailyBudget, 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-white/30 mt-1">Para llegar a fin de mes</p>
          </div>
        )}
      </div>

      {/* Tendencia 6 meses */}
      <div className="bg-brand-card rounded-2xl border border-white/5 p-4">
        <h3 className="font-bold text-sm mb-4">Tendencia 6 meses</h3>
        <div className="flex items-end gap-2 h-20">
          {monthlyTrend.map((m, i) => {
            const maxVal = Math.max(...monthlyTrend.map(x => Math.max(x.exp, x.inc)), 1);
            const expH = (m.exp / maxVal) * 100;
            const incH = (m.inc / maxVal) * 100;
            const isLast = i === monthlyTrend.length - 1;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-16">
                  <div className={`flex-1 rounded-t ${isLast ? 'bg-rose-500' : 'bg-rose-500/40'}`}
                    style={{ height: `${expH}%` }} />
                  <div className={`flex-1 rounded-t ${isLast ? 'bg-emerald-500' : 'bg-emerald-500/30'}`}
                    style={{ height: `${incH}%` }} />
                </div>
                <span className="text-[9px] text-white/30">{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] text-white/40">Gastos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-white/40">Ingresos</span>
          </div>
        </div>
      </div>

      {/* Diagnóstico financiero */}
      <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-400" />
          <h3 className="font-bold text-sm">Diagnóstico financiero</h3>
        </div>
        {insights.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-base leading-none">{tip.icon}</span>
            <p className={`${tip.color} leading-snug`}>{tip.msg}</p>
          </div>
        ))}
      </div>

      {/* Gastos por grupo */}
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

      {/* Gastos por categoría */}
      {viewMode === 'categories' && (
        <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="font-bold text-sm">Gastos por categoría</h3>
          {byCategory.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Sin datos en este período</p>
          )}
          {byCategory.map(({ key, total, label, emoji, parent }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">{emoji} {label}</span>
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

      {/* Top gastos */}
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
                    {/* ✅ fmtDate convierte cualquier formato a string */}
                    <p className="text-white/30">{fmtDate(tx.date)}</p>
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