// src/pages/Analytics/components/OverviewCards.jsx
import { Target, ArrowUpRight } from 'lucide-react';
import DeltaBadge from '../../../ui/DeltaBadge';
import Sparkline from '../../../ui/Sparkline';

export function SummaryCards({ totalInc, prevTotalInc, totalExp, prevTotalExp, balance }) {
  const prevBalance = prevTotalInc - prevTotalExp;
  const rows = [
    { label: 'Ingresos', value: totalInc, prev: prevTotalInc, color: 'text-emerald-400', invert: false },
    { label: 'Gastos', value: totalExp, prev: prevTotalExp, color: 'text-rose-400', invert: true },
    { label: 'Balance', value: Math.abs(balance), prev: Math.abs(prevBalance), color: balance >= 0 ? 'text-teal-400' : 'text-rose-400', invert: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 analytics-card">
      {rows.map(({ label, value, prev, color, invert }) => (
        <div key={label} className="bg-brand-card rounded-2xl p-3 border border-white/5">
          <p className="text-10px text-white/40 mb-1">{label}</p>
          <p className={`text-sm font-bold ${color}`}>
            Bs {value.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-1"><DeltaBadge current={value} previous={prev} invert={invert} /></div>
        </div>
      ))}
    </div>
  );
}

export function KpiCards({ savingsRate, monthlyTrend, avgMonthlyExp, projectedExp, currentMonthInc, period, daysLeft, dailyBudget, now }) {
  return (
    <div className="grid grid-cols-2 gap-3 analytics-card">
      <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
        <div className="flex justify-between items-start mb-2">
          <p className="text-10px text-white/40">Tasa de ahorro</p>
          <Target size={14} className="text-white/20" />
        </div>
        <p className={`text-xl font-bold ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-rose-400'}`}>
          {savingsRate.toFixed(1)}%
        </p>
        <p className="text-10px text-white/30 mt-1">Meta: 20%</p>
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
        <div className="flex justify-between items-start mb-2">
          <p className="text-10px text-white/40">Prom. mes</p>
          <Sparkline data={monthlyTrend.map((m) => m.exp)} color="#2dd4bf" />
        </div>
        <p className="text-xl font-bold text-white/80">
          Bs {avgMonthlyExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
        </p>
        <p className="text-10px text-white/30 mt-1">últimos 3 meses</p>
      </div>

      {projectedExp !== null && (
        <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-10px text-white/40">Proyección mes</p>
            <ArrowUpRight size={14} className="text-white/20" />
          </div>
          <p className={`text-xl font-bold ${projectedExp > currentMonthInc ? 'text-rose-400' : 'text-white/80'}`}>
            Bs {projectedExp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-10px text-white/30 mt-1">Ritmo actual (día {now.getDate()})</p>
        </div>
      )}

      {period === '1m' && (
        <div className="bg-brand-card rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-10px text-white/40">Disponible</p>
            <span className="text-10px text-white/30">{daysLeft} días restantes</span>
          </div>
          <p className={`text-xl font-bold ${dailyBudget > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            Bs {Math.max(dailyBudget, 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-10px text-white/30 mt-1">
            {currentMonthInc > 0
              ? `Ingreso: Bs ${currentMonthInc.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
              : 'Sin ingresos registrados'}
          </p>
        </div>
      )}
    </div>
  );
}
