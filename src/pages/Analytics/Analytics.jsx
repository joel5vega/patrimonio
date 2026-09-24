// src/pages/Analytics/Analytics.jsx
import { useRef } from 'react';
import { PieChart, BarChart2 } from 'lucide-react';
import { fmtDate } from './dateHelpers';
import { useAnalyticsData } from './useAnalyticsData';
import PeriodControls from './components/PeriodControls';
import ComparisonBanner from './components/ComparisonBanner';
import { SummaryCards, KpiCards } from './components/OverviewCards';
import TrendChart from './components/TrendChart';
import DiagnosticPanel from './components/DiagnosticPanel';
import CategoryBreakdown from './components/CategoryBreakdown';
import TopExpenses from './components/TopExpenses';

export default function Analytics() {
  const d = useAnalyticsData();
  const cardsRef = useRef(null);

  if (d.authLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-white/40 text-sm animate-pulse">Verificando sesión...</p>
      </div>
    );
  }
  if (!d.user) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-rose-400 text-sm">No hay una sesión activa.</p>
      </div>
    );
  }
  if (d.loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-white/40 text-sm animate-pulse">Cargando análisis...</p>
      </div>
    );
  }
  if (d.error) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-rose-400 text-sm">{d.error}</p>
      </div>
    );
  }

  const showPeriodLabel = d.period === 'custom' || d.customStart || d.customEnd;
  const periodLabelText = d.period === 'custom' && d.customStart && d.customEnd
    ? `${fmtDate(d.customStart)} → ${fmtDate(d.customEnd)}`
    : d.periodLabel;

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold">Análisis Financiero</h1>
          {showPeriodLabel && <p className="text-11px text-brand-teal mt-0.5">{periodLabelText}</p>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => d.setViewMode('groups')}
            className={`p-2 rounded-xl text-sm transition-colors ${d.viewMode === 'groups' ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40'}`}
          >
            <PieChart size={16} />
          </button>
          <button
            onClick={() => d.setViewMode('categories')}
            className={`p-2 rounded-xl text-sm transition-colors ${d.viewMode === 'categories' ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40'}`}
          >
            <BarChart2 size={16} />
          </button>
        </div>
      </div>

      <PeriodControls
        period={d.period} setPeriod={d.setPeriod}
        customStart={d.customStart} customEnd={d.customEnd}
        setCustomStart={d.setCustomStart} setCustomEnd={d.setCustomEnd}
      />

      <ComparisonBanner
        period={d.period} prevRange={d.prevRange}
        prevTotalExp={d.prevTotalExp} prevTotalInc={d.prevTotalInc}
        totalExp={d.totalExp} totalInc={d.totalInc}
      />

      <div ref={cardsRef} className="space-y-5">
        <SummaryCards totalInc={d.totalInc} prevTotalInc={d.prevTotalInc} totalExp={d.totalExp} prevTotalExp={d.prevTotalExp} balance={d.balance} />

        <KpiCards
          savingsRate={d.savingsRate} monthlyTrend={d.monthlyTrend} avgMonthlyExp={d.avgMonthlyExp}
          projectedExp={d.projectedExp} currentMonthInc={d.currentMonthInc} period={d.period}
          daysLeft={d.daysLeft} dailyBudget={d.dailyBudget} now={d.now}
        />

        <TrendChart monthlyTrend={d.monthlyTrend} />

        <DiagnosticPanel insights={d.insights} />

        <CategoryBreakdown
          viewMode={d.viewMode}
          byGroup={d.byGroup} totalExp={d.totalExp} expenses={d.expenses}
          activeGroup={d.activeGroup} setActiveGroup={d.setActiveGroup}
          byCategory={d.byCategory} maxGroup={d.maxGroup}
          prevByGroup={d.prevByGroup} filteredByCategory={d.filteredByCategory}
        />

        <TopExpenses expenses={d.expenses} />
      </div>
    </div>
  );
}
