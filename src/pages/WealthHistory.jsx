import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PERIODS = [
  { key: '1W',  label: '1S',   days: 7    },
  { key: '1M',  label: '1M',   days: 30   },
  { key: '3M',  label: '3M',   days: 90   },
  { key: '1Y',  label: '1A',   days: 365  },
  { key: 'ALL', label: 'Todo', days: 9999 },
];

const FIXED_TYPES = [
  { key: 'total',  label: 'Total',  field: 'totalPortfolioUSD', color: '#14b8a6' },
  { key: 'crypto', label: 'Crypto', field: 'cryptoUSD',         color: '#f97316' },
  { key: 'etfs',   label: 'ETFs',   field: 'inversionUSD',      color: '#3b82f6' },
];

const MANUAL_PALETTE = ['#a855f7', '#ec4899', '#facc15', '#06b6d4', '#10b981'];

// ─── Gráfico multi-línea ──────────────────────────────────
const MultiLineChart = ({ series }) => {
  const W = 320, H = 120, PAD = 10;
  const allVals = series.flatMap((s) => s.data.map((d) => d.v));
  if (!allVals.length) return null;
  const min   = Math.min(...allVals);
  const max   = Math.max(...allVals);
  const range = max - min || 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.key} id={`grd-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={s.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0"    />
          </linearGradient>
        ))}
      </defs>
      {series.map((s) => {
        if (s.data.length < 2) return null;
        const pts = s.data.map((d, i) => {
          const x = PAD + (i / (s.data.length - 1)) * (W - PAD * 2);
          const y = H - PAD - ((d.v - min) / range) * (H - PAD * 2);
          return `${x},${y}`;
        });
        const lineD = 'M ' + pts.join(' L ');
        const areaD = lineD + ` L ${W - PAD},${H - PAD} L ${PAD},${H - PAD} Z`;
        return (
          <g key={s.key}>
            <path d={areaD} fill={`url(#grd-${s.key})`} />
            <path d={lineD} fill="none" stroke={s.color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
};

// ─── Componente principal ─────────────────────────────────
const WealthHistory = () => {
  const {
    chartHistory,
    totalCryptoUSD, totalInversionUSD, totalManualUSD,
    manualAssets, loading,
  } = useApp();

  const [period, setPeriod]   = useState('1M');
  const [visible, setVisible] = useState({ total: true, crypto: false, etfs: false });

  const days         = PERIODS.find((p) => p.key === period)?.days ?? 30;
  const today        = new Date().toISOString().split('T')[0];
  const currentTotalUSD = totalCryptoUSD + totalInversionUSD + (totalManualUSD ?? 0);

  // Tipos dinámicos: uno por activo manual
  const manualTypes = useMemo(() =>
    (manualAssets ?? []).map((a, i) => ({
      key:      `manual_${a.id}`,
      label:    a.name,
      color:    MANUAL_PALETTE[i % MANUAL_PALETTE.length],
      since:    a.since ?? null,
      valueUSD: a.valueUSD,
      isManual: true,
      assetId:  a.id,
    })),
  [manualAssets]);

  const ALL_TYPES = [...FIXED_TYPES, ...manualTypes];

  // Merge visible con defaults false para activos manuales nuevos
  const vis = useMemo(() => {
    const defaults = {};
    manualTypes.forEach((t) => { if (!(t.key in visible)) defaults[t.key] = false; });
    return { ...defaults, ...visible };
  }, [visible, manualTypes]);

  const currentByKey = useMemo(() => ({
    total:  currentTotalUSD,
    crypto: totalCryptoUSD,
    etfs:   totalInversionUSD,
    ...Object.fromEntries((manualAssets ?? []).map((a) => [`manual_${a.id}`, a.valueUSD])),
  }), [currentTotalUSD, totalCryptoUSD, totalInversionUSD, manualAssets]);

  // Construir series de datos
  const seriesData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return ALL_TYPES.reduce((acc, asset) => {
      if (asset.isManual) {
        const since   = asset.since ? new Date(asset.since) : null;
        const assetId = asset.assetId;

        const base = (chartHistory ?? []).filter((d) => {
          if (days < 9999 && new Date(d.date) < cutoff) return false;
          if (since && new Date(d.date) < since) return false;
          return true;
        }).map((d) => ({
          date: d.date,
          // Usar valor histórico real del mapa si existe, si no valor actual
          v: d.manualAssets?.[assetId] ?? asset.valueUSD,
        }));

        if (!base.find((d) => d.date === today)) {
          const inRange = !since || new Date(today) >= since;
          if (inRange) base.push({ date: today, v: asset.valueUSD });
        }
        acc[asset.key] = base;
      } else {
        if (!chartHistory?.length) { acc[asset.key] = []; return acc; }
        const filtered = chartHistory
          .filter((d) => days >= 9999 || new Date(d.date) >= cutoff)
          .map((d) => ({ date: d.date, v: d[asset.field] ?? 0 }));
        if (!filtered.find((d) => d.date === today)) {
          filtered.push({ date: today, v: currentByKey[asset.key] ?? 0 });
        }
        acc[asset.key] = filtered;
      }
      return acc;
    }, {});
  }, [chartHistory, days, today, manualTypes, currentByKey]);

  const toggleVisible = (key) =>
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeSeries = ALL_TYPES
    .filter((a) => vis[a.key])
    .map((a) => ({ ...a, data: seriesData[a.key] ?? [] }));

  const primarySeries = activeSeries[0];
  const first         = primarySeries?.data[0]?.v ?? 0;
  const last          = primarySeries?.data[primarySeries?.data.length - 1]?.v ?? 0;
  const delta         = last - first;
  const deltaPct      = first > 0 ? (delta / first) * 100 : 0;
  const isUp          = delta >= 0;
  const longestSeries = activeSeries.reduce((a, b) =>
    (b.data.length > (a?.data.length ?? 0) ? b : a), null);

  // Chip reutilizable
  const ChipButton = ({ type }) => {
    const active = vis[type.key];
    return (
      <button
        onClick={() => toggleVisible(type.key)}
        style={active
          ? { backgroundColor: type.color, color: '#000', borderColor: type.color }
          : { borderColor: type.color + '55' }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all"
      >
        <span className="w-2 h-2 rounded-full"
          style={{ backgroundColor: active ? '#000' : type.color }} />
        {type.label}
        {active
          ? <span className="text-[10px] opacity-70">${(currentByKey[type.key] ?? 0).toFixed(0)}</span>
          : type.since
            ? <span className="text-[9px] opacity-40">{type.since}</span>
            : null
        }
      </button>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Historial Patrimonial</h1>

      {/* ── Card total ── */}
      <div className="bg-gradient-to-br from-brand-teal to-emerald-600 p-6 rounded-3xl shadow-xl shadow-brand-teal/10">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Patrimonio Total</p>
        <h2 className="text-4xl font-black">Bs {(currentTotalUSD * 6.96).toFixed(2)}</h2>
        <p className="text-white/70 text-sm mt-1">${currentTotalUSD.toFixed(2)} USD</p>
        {primarySeries && (
          <div className="flex items-center gap-2 text-sm font-bold mt-3 w-fit px-3 py-1 rounded-full bg-black/20">
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isUp ? '+' : ''}{delta.toFixed(2)} USD ({deltaPct.toFixed(2)}%) en el periodo
          </div>
        )}
      </div>

      {/* ── Toggles ── */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Mostrar en gráfico</p>
        <div className="flex flex-wrap gap-2">
          {FIXED_TYPES.map((a) => <ChipButton key={a.key} type={a} />)}
        </div>
        {manualTypes.length > 0 && (
          <>
            <p className="text-[10px] text-white/20 uppercase tracking-wider pt-1">Activos manuales</p>
            <div className="flex flex-wrap gap-2">
              {manualTypes.map((a) => <ChipButton key={a.key} type={a} />)}
            </div>
          </>
        )}
      </div>

      {/* ── Selector periodo ── */}
      <div className="flex bg-brand-card rounded-2xl border border-white/5 p-1 gap-1">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === p.key ? 'bg-brand-teal text-black' : 'text-white/40 hover:text-white'
            }`}>{p.label}</button>
        ))}
      </div>

      {/* ── Gráfico ── */}
      <div className="bg-brand-card rounded-3xl border border-white/5 p-5">
        {activeSeries.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {activeSeries.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-white/50">{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {activeSeries.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-white/30 text-sm">
            Selecciona al menos un grupo
          </div>
        ) : activeSeries.every((s) => s.data.length < 2) ? (
          <div className="h-32 flex items-center justify-center text-white/30 text-sm">
            No hay suficiente historial para este periodo
          </div>
        ) : (
          <>
            <MultiLineChart series={activeSeries} />
            <div className="flex justify-between text-[10px] text-white/30 mt-2">
              <span>{longestSeries?.data[0]?.date}</span>
              <span>{longestSeries?.data[longestSeries.data.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Desglose actual ── */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Desglose actual</p>
        {[
          { label: 'Crypto (Binance)', key: 'crypto', valueUSD: totalCryptoUSD,    color: '#f97316', since: null },
          { label: 'ETFs (Admirals)',  key: 'etfs',   valueUSD: totalInversionUSD, color: '#3b82f6', since: null },
          ...(manualAssets ?? []).filter((a) => a.valueUSD > 0).map((a, i) => ({
            label:    a.name,
            key:      `manual_${a.id}`,
            valueUSD: a.valueUSD,
            color:    MANUAL_PALETTE[i % MANUAL_PALETTE.length],
            since:    a.since ?? null,
          })),
        ].filter((r) => r.valueUSD > 0).map((row) => (
          <div key={row.key}
            onClick={() => toggleVisible(row.key)}
            style={{ borderColor: vis[row.key] ? row.color + '66' : 'rgba(255,255,255,0.05)' }}
            className="bg-brand-card rounded-2xl border p-4 flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
              <div>
                <p className="text-sm font-semibold">{row.label}</p>
                {row.since && <p className="text-[10px] text-white/30">desde {row.since}</p>}
              </div>
              {vis[row.key] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: row.color + '33', color: row.color }}>
                  visible
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold">${row.valueUSD.toFixed(2)}</p>
              <p className="text-xs text-white/40">Bs {(row.valueUSD * 6.96).toFixed(2)}</p>
              <p className="text-[10px] text-white/30">
                {currentTotalUSD > 0 ? ((row.valueUSD / currentTotalUSD) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabla snapshots — primera serie activa ── */}
      {primarySeries && primarySeries.data.length > 1 && (
        <div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
            Snapshots · {primarySeries.label}
          </p>
          <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
            {[...primarySeries.data].reverse().slice(0, 10).map((d, i) => {
              const idx  = primarySeries.data.findIndex((x) => x.date === d.date);
              const prev = primarySeries.data[idx - 1];
              const diff = prev ? d.v - prev.v : 0;
              return (
                <div key={d.date}
                  className={`flex justify-between items-center px-4 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}>
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