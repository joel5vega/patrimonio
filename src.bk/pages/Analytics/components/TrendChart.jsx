// src/pages/Analytics/components/TrendChart.jsx
export default function TrendChart({ monthlyTrend }) {
  const maxVal = Math.max(...monthlyTrend.map((x) => Math.max(x.exp, x.inc)), 1);

  return (
    <div className="bg-brand-card rounded-2xl border border-white/5 p-4 analytics-card">
      <h3 className="font-bold text-sm mb-4">Tendencia Semestral</h3>
      <div className="flex items-end gap-2 h-20">
        {monthlyTrend.map((m, i) => {
          const isLast = i === monthlyTrend.length - 1;
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end h-16">
                <div
                  className={`flex-1 rounded-t transition-all duration-500 ${isLast ? 'bg-rose-500' : 'bg-rose-500/40'}`}
                  style={{ height: `${(m.exp / maxVal) * 100}%` }}
                />
                <div
                  className={`flex-1 rounded-t transition-all duration-500 ${isLast ? 'bg-emerald-500' : 'bg-emerald-500/30'}`}
                  style={{ height: `${(m.inc / maxVal) * 100}%` }}
                />
              </div>
              <span className="text-9px text-white/30 capitalize">{m.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-10px text-white/40">Gastos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-10px text-white/40">Ingresos</span>
        </div>
      </div>
    </div>
  );
}
