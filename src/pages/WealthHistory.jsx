import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PERIODS = [
  { key: '1W',  label: '1S',   days: 7   },
  { key: '1M',  label: '1M',   days: 30  },
  { key: '3M',  label: '3M',   days: 90  },
  { key: '1Y',  label: '1A',   days: 365 },
  { key: 'ALL', label: 'Todo', days: 9999 },
];

const MiniChart = ({ data, color = '#14b8a6' }) => {
  if (!data || data.length < 2) return null;
  const W = 320, H = 120, PAD = 10;
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const lineD = 'M ' + pts.join(' L ');
  const areaD = lineD + ` L ${W - PAD},${H - PAD} L ${PAD},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#grd)" />
      <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const WealthHistory = () => {
  const { chartHistory, totalValue, totalCryptoUSD, totalInversionUSD, totalManualUSD, loading } = useApp();
  const [period, setPeriod] = useState('1M');

  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;

  // Filtrar historia según periodo
  const filtered = useMemo(() => {
    if (!chartHistory?.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return chartHistory
      .filter((d) => days >= 9999 || new Date(d.date) >= cutoff)
      .map((d) => ({ date: d.date, v: d.totalPortfolioUSD }));
  }, [chartHistory, days]);

  // Agregar punto de hoy con el valor actual
  const today = new Date().toISOString().split('T')[0];
  const currentTotalUSD = totalCryptoUSD + totalInversionUSD + (totalManualUSD ?? 0);
  const chartData = useMemo(() => {
    const data = [...filtered];
    if (!data.find((d) => d.date === today)) {
      data.push({ date: today, v: currentTotalUSD });
    }
    return data;
  }, [filtered, today, currentTotalUSD]);

  const first = chartData[0]?.v ?? 0;
  const last  = chartData[chartData.length - 1]?.v ?? 0;
  const delta = last - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;
  const isUp = delta >= 0;
  const color = isUp ? '#14b8a6' : '#f43f5e';

  const totalBOB = currentTotalUSD * 6.96;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Historial Patrimonial</h1>

      {/* Total actual */}
      <div className="bg-gradient-to-br from-brand-teal to-emerald-600 p-6 rounded-3xl shadow-xl shadow-brand-teal/10">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Patrimonio Total</p>
        <h2 className="text-4xl font-black">Bs {totalBOB.toFixed(2)}</h2>
        <p className="text-white/70 text-sm mt-1">${currentTotalUSD.toFixed(2)} USD</p>
        <div className={`flex items-center gap-2 text-sm font-bold mt-3 w-fit px-3 py-1 rounded-full bg-black/20`}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isUp ? '+' : ''}{delta.toFixed(2)} USD ({deltaPct.toFixed(2)}%) en el periodo
        </div>
      </div>

      {/* Selector de periodo */}
      <div className="flex bg-brand-card rounded-2xl border border-white/5 p-1 gap-1">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === p.key ? 'bg-brand-teal text-black' : 'text-white/40 hover:text-white'
            }`}
          >{p.label}</button>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-brand-card rounded-3xl border border-white/5 p-5">
        {chartData.length < 2 ? (
          <div className="h-32 flex items-center justify-center text-white/30 text-sm">
            No hay suficiente historial para este periodo
          </div>
        ) : (
          <>
            <MiniChart data={chartData} color={color} />
            <div className="flex justify-between text-[10px] text-white/30 mt-2">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>

      {/* Desglose por cuenta */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Desglose actual</p>
        {[
          { label: 'Crypto (Binance)', valueUSD: totalCryptoUSD, color: 'bg-orange-500' },
          { label: 'ETFs (Admirals)',  valueUSD: totalInversionUSD, color: 'bg-blue-500' },
          { label: 'Activos manuales', valueUSD: totalManualUSD ?? 0, color: 'bg-emerald-500' },
        ].filter((r) => r.valueUSD > 0).map((row) => (
          <div key={row.label} className="bg-brand-card rounded-2xl border border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${row.color}`} />
              <span className="text-sm font-semibold">{row.label}</span>
            </div>
            <div className="text-right">
              <p className="font-bold">${row.valueUSD.toFixed(2)}</p>
              <p className="text-xs text-white/40">Bs {(row.valueUSD * 6.96).toFixed(2)}</p>
              <p className="text-[10px] text-white/30">{currentTotalUSD > 0 ? ((row.valueUSD / currentTotalUSD) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla histórica */}
      {chartData.length > 1 && (
        <div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Snapshots del periodo</p>
          <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
            {[...chartData].reverse().slice(0, 10).map((d, i) => {
              const prev = chartData[chartData.findIndex((x) => x.date === d.date) - 1];
              const diff = prev ? d.v - prev.v : 0;
              return (
                <div key={d.date} className={`flex justify-between items-center px-4 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  <span className="text-sm text-white/70">{d.date}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">${d.v.toFixed(2)}</span>
                    {diff !== 0 && (
                      <span className={`ml-2 text-xs font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WealthHistory;
