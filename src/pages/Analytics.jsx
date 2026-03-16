import { useApp } from '../context/AppContext';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MOCK_BARS = [38, 62, 45, 80, 55, 90, 70];

const Analytics = () => {
  const { assets } = useApp();

  const sorted = [...assets].map((a) => ({
    ...a,
    pnlPct: (((a.currentPrice - a.avgBuyPrice) / a.avgBuyPrice) * 100).toFixed(1),
  })).sort((a, b) => parseFloat(b.pnlPct) - parseFloat(a.pnlPct));

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const totalBOB = assets.reduce((s, a) => s + a.quantity * a.currentPrice * 6.96, 0);
  const allocation = assets.map((a) => ({
    name: a.symbol,
    pct: ((a.quantity * a.currentPrice * 6.96 / totalBOB) * 100).toFixed(1),
    type: a.type,
  }));

  return (
    <div className="space-y-5 pt-2">
      <h1 className="text-2xl font-bold">Análisis</h1>

      {/* Bar Chart */}
      <div className="bg-brand-card p-5 rounded-3xl border border-white/5">
        <p className="text-xs font-bold text-white/40 uppercase mb-4">Rendimiento Semanal</p>
        <div className="flex items-end justify-between h-28 gap-2">
          {MOCK_BARS.map((h, i) => (
            <div key={i} className="relative flex-1 h-full flex items-end">
              <div
                style={{ height: `${h}%` }}
                className="w-full bg-brand-teal/80 rounded-t-lg transition-all hover:bg-brand-teal"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {DAYS.map((d) => (
            <span key={d} className="flex-1 text-center text-[10px] text-white/40 font-bold">{d}</span>
          ))}
        </div>
      </div>

      {/* Allocation */}
      <div className="bg-brand-card p-5 rounded-3xl border border-white/5">
        <p className="text-xs font-bold text-white/40 uppercase mb-4">Distribución del Portafolio</p>
        <div className="space-y-3">
          {allocation.map((a) => (
            <div key={a.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{a.name}</span>
                <span className="text-white/50">{a.pct}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div style={{ width: `${a.pct}%` }} className="bg-brand-teal h-2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best / Worst */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-card p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Mejor Activo</p>
          <p className="font-bold text-emerald-400">{best?.symbol}</p>
          <p className="text-sm text-emerald-400">+{best?.pnlPct}%</p>
        </div>
        <div className="bg-brand-card p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Peor Activo</p>
          <p className="font-bold text-rose-400">{worst?.symbol}</p>
          <p className="text-sm text-rose-400">{worst?.pnlPct}%</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
