// src/pages/Budget/Budget.jsx
import { TX_CATEGORIES } from '../../hooks/useTransactions';
import { matchesGroup } from './budgetHelpers';
import { useBudgetData } from './useBudgetData';
import GlobalSummary from './components/GlobalSummary';
import BudgetCard from './components/BudgetCard';
import GlobalMonthDetailModal from './components/GlobalMonthDetailModal';

export default function Budget() {
  const d = useBudgetData();

  if (d.loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-[#eeeeee]/40 text-sm animate-pulse">Cargando presupuesto...</p>
      </div>
    );
  }

  if (d.error) {
    return (
      <div className="flex items-center justify-center h-40 px-4">
        <p className="text-rose-400 text-sm text-center">{d.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Presupuesto</h1>
        <p className="text-[#eeeeee]/40 text-xs mt-0.5">
          {new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <GlobalSummary
        totalSpentM={d.totalSpentM}
        totalBudget={d.totalBudget}
        totalSpentW={d.totalSpentW}
        overallPct={d.overallPct}
        globalHistory={d.globalHistory}
        onSelectMonth={(h) => d.setGlobalModal({ ...h, groups: d.groups, groupBudgetsMap: d.groupBudgetsMap, transactions: d.transactions })}
      />

      <div className="space-y-3">
        {d.groups.map(({ value: key, label }) => {
          const groupSubcats = TX_CATEGORIES.filter((c) => matchesGroup(c, key));
          return (
            <BudgetCard
              key={key}
              groupKey={key}
              label={label}
              transactions={d.transactions}
              subcategories={groupSubcats}
              budgets={d.budgets}
              monthlySpent={d.monthlyByGroup[key] || 0}
              weeklySpent={d.weeklyByGroup[key] || 0}
              onSave={d.saveBudget}
            />
          );
        })}
      </div>

      {d.globalModal && (
        <GlobalMonthDetailModal data={d.globalModal} onClose={() => d.setGlobalModal(null)} />
      )}
    </div>
  );
}
