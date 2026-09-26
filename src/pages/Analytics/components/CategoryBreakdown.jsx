// src/pages/Analytics/components/CategoryBreakdown.jsx
import { TX_GROUPS } from '../../../hooks/useTransactions';
import { GROUP_COLORS, GROUP_HEX } from '../../../features/transactions/constants/groupPalette';
import Bar from '../../../ui/Bar';
import DonutChart from './DonutChart';
import CategoryRow from './CategoryRow';

export default function CategoryBreakdown({
  viewMode, byGroup, totalExp, expenses, activeGroup, setActiveGroup,
  byCategory, maxGroup, prevByGroup, filteredByCategory,
}) {
  if (viewMode === 'groups') {
    return (
      <div className="bg-[#1f1f1f] rounded-lg border border-white/5 p-4 space-y-4 analytics-card">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm">Distribución por grupo</h3>
          {activeGroup && (
            <button
              type="button"
              onClick={() => setActiveGroup(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: 700,
                color: GROUP_HEX[activeGroup] || '#1f1f1f',
                background: `${GROUP_HEX[activeGroup] || '#1f1f1f'}18`,
                border: `1px solid ${GROUP_HEX[activeGroup] || '#1f1f1f'}33`,
                borderRadius: '999px', padding: '0.2rem 0.6rem', cursor: 'pointer',
              }}
            >
              {TX_GROUPS?.find((g) => g.value === activeGroup)?.label}
            </button>
          )}
        </div>

        {byGroup.length === 0 ? (
          <p className="text-[#eeeeee]/30 text-sm text-center py-4">Sin datos registrados en este período</p>
        ) : (
          <DonutChart byGroup={byGroup} totalExp={totalExp} expenses={expenses} onGroupClick={setActiveGroup} activeGroup={activeGroup} />
        )}

        {byGroup.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            {byGroup.map(({ key, total }) => (
              <CategoryRow key={key} groupKey={key} total={total} totalExp={totalExp} categories={byCategory} maxGroup={maxGroup} prevTotal={prevByGroup[key] ?? null} />
            ))}
          </div>
        )}

        {activeGroup && filteredByCategory.length === 0 && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <p className="text-10px text-[#eeeeee]/40 font-bold uppercase tracking-wide">
              Categorías en {TX_GROUPS?.find((g) => g.value === activeGroup)?.label}
            </p>
            {filteredByCategory.map(({ key, total, label, emoji }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold flex items-center gap-1.5">{emoji} {label}</span>
                  <span className="text-[#eeeeee]/50">Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
                  <span className="text-[#eeeeee]/30 ml-1">
                    {((total / byGroup.find((g) => g.key === activeGroup)?.total) * 100).toFixed(0)}%
                  </span>
                </div>
                <Bar pct={(total / filteredByCategory[0]?.total) * 100} color={GROUP_COLORS[activeGroup] || 'bg-[#1f1f1f]/20'} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // viewMode === 'categories' — vista plana
  return (
    <div className="bg-[#1f1f1f] rounded-lg border border-white/5 p-4 space-y-3 analytics-card">
      <h3 className="font-bold text-sm">Detalle por categoría</h3>
      {byCategory.length === 0 ? (
        <p className="text-[#eeeeee]/30 text-sm text-center py-4">Sin gastos registrados</p>
      ) : (
        <div className="space-y-3">
          {byCategory.map(({ key, total, label, emoji, parent }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded flex-shrink-0" style={{ background: GROUP_HEX[parent] || 'rgba(255,255,255,0.2)' }} />
                  {emoji} {label}
                </span>
                <span className="text-[#eeeeee]/50">Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
                <span className="text-[#eeeeee]/30 ml-1">{((total / totalExp) * 100).toFixed(0)}%</span>
              </div>
              <Bar pct={(total / byCategory[0]?.total) * 100} color={GROUP_COLORS[parent] || 'bg-[#1f1f1f]/20'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
