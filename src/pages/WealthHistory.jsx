import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PERIODS = [
  { key: '1W',  label: '1S',   days: 7 },
  { key: '1M',  label: '1M',   days: 30 },
  { key: '3M',  label: '3M',   days: 90 },
  { key: '1Y',  label: '1A',   days: 365 },
  { key: 'ALL', label: 'Todo', days: 9999 },
];

const FIXED_TYPES = [
  { key: 'total',  label: 'Total',  field: 'totalPortfolioUSD', color: '#14b8a6' },
  { key: 'crypto', label: 'Crypto', field: 'cryptoUSD',         color: '#f97316' },
  { key: 'etfs',   label: 'ETFs',   field: 'inversionUSD',      color: '#3b82f6' },
];

const SPECIAL_TODO = {
  key: 'todo_full',
  label: 'Todo',
  field: 'todo_full',
  color: '#22c55e',
};

const MANUAL_PALETTE = ['#a855f7', '#ec4899', '#facc15', '#06b6d4', '#10b981'];

const fmt = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`);

// ─── Gráfico ───────────────────────────────────────────────
const MultiLineChart = ({ series, onHover, period }) => {
  const W = 400, H = 180;
  const PAD_T = 12, PAD_B = 20, PAD_L = 46, PAD_R = 12;

  const primary = series[0] || { data: [] };
  const allVals = primary.data.map((d) => d.v);
  if (!allVals.length) return null;

  const min   = Math.min(...allVals);
  const max   = Math.max(...allVals);
  const range = max - min || 1;

  const toX = (i, len) =>
    PAD_L + (i / Math.max(len - 1, 1)) * (W - PAD_L - PAD_R);
  const toY = (v) =>
    PAD_T + (1 - (v - min) / range) * (H - PAD_T - PAD_B);

  const yLabels = [max, (max + min) / 2, min];

  const handleMove = (evt) => {
    if (!primary.data.length) return;
    const rect = evt.currentTarget.getBoundingClientRect();
    const x    = evt.clientX - rect.left;

    const len = primary.data.length;
    const rel = (x - PAD_L) / (W - PAD_L - PAD_R);
    const idx = Math.min(len - 1, Math.max(0, Math.round(rel * (len - 1))));
    const point = primary.data[idx];

    if (onHover) onHover({ index: idx, date: point.date });
  };

  const handleLeave = () => {
    if (onHover) onHover(null);
  };

  const parseD = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  };

  const pickLabeledPoints = () => {
    if (!primary.data.length) return [];

    if (period === '1W') {
      return primary.data.map((d, index) => ({ ...d, index }));
    }

    if (period === '1M') {
      const result = [];
      let lastDate = null;
      primary.data.forEach((d, index) => {
        const curr = parseD(d.date);
        if (!lastDate || (curr - lastDate) / (1000 * 60 * 60 * 24) >= 7) {
          result.push({ ...d, index });
          lastDate = curr;
        }
      });
      return result;
    }

    if (period === '3M' || period === '1Y') {
      const map = new Map(); // YYYY-MM
      primary.data.forEach((d, index) => {
        const key = d.date.slice(0, 7);
        if (!map.has(key)) map.set(key, { ...d, index });
      });
      return Array.from(map.values());
    }

    if (period === 'ALL') {
      const map = new Map(); // YYYY
      primary.data.forEach((d, index) => {
        const key = d.date.slice(0, 4);
        if (!map.has(key)) map.set(key, { ...d, index });
      });
      return Array.from(map.values());
    }

    return [];
  };

  const pointLabels = pickLabeledPoints();

  const xAxisLabels = (() => {
    if (!primary.data.length) return [];
    if (period === '1W') {
      return primary.data.map((d, index) => ({
        index,
        date: d.date.slice(5), // MM-DD
      }));
    }
    if (period === '1M') {
      return pointLabels.map((p) => ({
        index: p.index,
        date: p.date.slice(5), // MM-DD
      }));
    }
    if (period === '3M' || period === '1Y') {
      return pointLabels.map((p) => ({
        index: p.index,
        date: p.date.slice(0, 7), // YYYY-MM
      }));
    }
    if (period === 'ALL') {
      return pointLabels.map((p) => ({
        index: p.index,
        date: p.date.slice(0, 4), // YYYY
      }));
    }
    return [];
  })();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <defs>
        {series.map((s) => (
          <linearGradient
            key={s.key}
            id={`grd-${s.key}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%"   stopColor={s.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0"   />
          </linearGradient>
        ))}
      </defs>

      {yLabels.map((val, i) => {
        const y = toY(val);
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={y}
              x2={W - PAD_R}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text
              x={PAD_L - 4}
              y={y + 3.5}
              textAnchor="end"
              fontSize="8"
              fill="rgba(255,255,255,0.35)"
              fontFamily="monospace"
            >
              {fmt(val)}
            </text>
          </g>
        );
      })}

      <line
        x1={PAD_L}
        y1={H - PAD_B}
        x2={W - PAD_R}
        y2={H - PAD_B}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
      {xAxisLabels.map((l) => {
        const x = toX(l.index, primary.data.length);
        return (
          <g key={l.date}>
            <line
              x1={x}
              y1={H - PAD_B}
              x2={x}
              y2={H - PAD_B + 3}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(255,255,255,0.4)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont"
            >
              {l.date}
            </text>
          </g>
        );
      })}

      {series.map((s) => {
        if (s.data.length < 2) return null;
        const pts   = s.data.map((d, i) => `${toX(i, s.data.length)},${toY(d.v)}`);
        const lineD = 'M ' + pts.join(' L ');
        const areaD =
          lineD +
          ` L ${toX(s.data.length - 1, s.data.length)},${H - PAD_B}` +
          ` L ${PAD_L},${H - PAD_B} Z`;

        return (
          <g key={s.key}>
            <path d={areaD} fill={`url(#grd-${s.key})`} />
            <path
              d={lineD}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}

      {pointLabels.map((p) => {
        const x = toX(p.index, primary.data.length);
        const y = toY(p.v);
        return (
          <g key={p.date}>
            <circle cx={x} cy={y} r={1.5} fill="#fff" />
            <rect
              x={x - 16}
              y={y - 14}
              width={32}
              height={10}
              rx={3}
              fill="rgba(15,23,42,0.9)"
            />
            <text
              x={x}
              y={y - 7}
              textAnchor="middle"
              fontSize="7"
              fill="#e5e7eb"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont"
            >
              {fmt(p.v)}
            </text>
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
    totalCryptoUSD,
    totalInversionUSD,
    totalManualUSD,
    manualAssets,
    loading,
    bobRate,
    ahorroBsUSD,
  } = useApp();

  const [hoverPoint, setHoverPoint] = useState(null);
  const [period, setPeriod]         = useState('1M');
  const [visible, setVisible]       = useState({
    todo_full: true,
    total: false,
    crypto: false,
    etfs: false,
  });

  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;

  const manualTypes = useMemo(
    () =>
      (manualAssets ?? []).map((a, i) => {
        const uiName  = a.name;
        let fieldName = uiName;
        if (uiName === 'Ahorro $') fieldName = 'Ahorro';
        if (uiName === 'Ahorro en Bs') fieldName = 'AhorroBs';

        const isAhorroBs = fieldName === 'AhorroBs';
        const valueUSD   = isAhorroBs
          ? (a.valueBOB ?? a.amount ?? 0) / bobRate
          : a.valueUSD;

        return {
          key:       `manual_${fieldName}`,
          label:     uiName,
          field:     `manual_${fieldName}`,
          color:     MANUAL_PALETTE[i % MANUAL_PALETTE.length],
          since:     a.since ?? null,
          valueUSD,
          isManual:  true,
          isAhorroBs,
        };
      }),
    [manualAssets, bobRate]
  );

  const currentTotalUSD =
    totalCryptoUSD +
    totalInversionUSD +
    (manualTypes ?? [])
      .filter((t) => !t.isAhorroBs)
      .reduce((sum, t) => sum + (t.valueUSD ?? 0), 0);

  const ALL_TYPES = [SPECIAL_TODO, ...FIXED_TYPES, ...manualTypes];

  const vis = useMemo(() => {
    const defaults = {};
    manualTypes.forEach((t) => {
      if (!(t.key in visible)) defaults[t.key] = false;
    });
    return { ...defaults, ...visible };
  }, [visible, manualTypes]);

  const currentByKey = useMemo(
    () => ({
      todo_full: currentTotalUSD + ahorroBsUSD,
      total:  currentTotalUSD,
      crypto: totalCryptoUSD,
      etfs:   totalInversionUSD,
      ...Object.fromEntries((manualTypes ?? []).map((t) => [t.key, t.valueUSD])),
    }),
    [currentTotalUSD, totalCryptoUSD, totalInversionUSD, manualTypes, ahorroBsUSD]
  );

  const seriesData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = ALL_TYPES.reduce((acc, asset) => {
      if (!chartHistory?.length) {
        acc[asset.key] = [];
        return acc;
      }

      const allSorted = [...chartHistory].sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      if (asset.key === 'todo_full') {
        acc[asset.key] = [];
        return acc;
      }

      const rawSeries = allSorted
        .map((d) => {
          const raw = d[asset.field];
          if (raw == null) return null;

          if (asset.isManual) {
            let v = raw;
            if (asset.isAhorroBs && bobRate) v = v / bobRate;
            return { date: d.date, v };
          }

          return { date: d.date, v: raw };
        })
        .filter(Boolean);

      const filtered = rawSeries.filter((d) => {
        if (days < 9999 && new Date(d.date) < cutoff) return false;
        return true;
      });

      acc[asset.key] = filtered;
      return acc;
    }, {});

    const totalSeries    = result['total'] ?? [];
    const ahorroBsSeries = result['manual_AhorroBs'] ?? [];

    if (totalSeries.length) {
      const mapBs = new Map(ahorroBsSeries.map((p) => [p.date, p.v]));
      const todoSeries = totalSeries
        .map((p) => {
          const bsUSD = mapBs.get(p.date) ?? 0;
          return { date: p.date, v: p.v + bsUSD };
        })
        .filter((d) => {
          if (days < 9999 && new Date(d.date) < cutoff) return false;
          return true;
        });
      result['todo_full'] = todoSeries;
    } else {
      result['todo_full'] = [];
    }

    return result;
  }, [chartHistory, days, manualTypes, bobRate, ALL_TYPES]);

  const toggleVisible = (key) =>
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeSeries = ALL_TYPES
    .filter((a) => vis[a.key])
    .map((a) => ({ ...a, data: seriesData[a.key] ?? [] }));

  const primarySeries = activeSeries[0];
  const first         = primarySeries?.data[0]?.v ?? 0;
  const last          =
    primarySeries?.data[primarySeries?.data.length - 1]?.v ?? 0;
  const delta    = last - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;
  const isUp     = delta >= 0;
  const longestSeries = activeSeries.reduce(
    (a, b) => (b.data.length > (a?.data.length ?? 0) ? b : a),
    null
  );

  const ChipButton = ({ type }) => {
    const active = vis[type.key];
    return (
      <button
        onClick={() => toggleVisible(type.key)}
        style={
          active
            ? {
                backgroundColor: type.color,
                color: '#000',
                borderColor: type.color,
              }
            : { borderColor: type.color + '55' }
        }
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: active ? '#000' : type.color }}
        />
        {type.label}
        {active ? (
          <span className="text-[10px] opacity-70">
            {fmt(currentByKey[type.key] ?? 0)}
          </span>
        ) : type.since ? (
          <span className="text-[9px] opacity-40">{type.since}</span>
        ) : null}
      </button>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Historial Patrimonial</h1>

      <div className="bg-gradient-to-br from-brand-teal to-emerald-600 p-6 rounded-3xl shadow-xl shadow-brand-teal/10">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
          Patrimonio Total (Todo)
        </p>
        <h2 className="text-4xl font-black">
          Bs {((currentTotalUSD + ahorroBsUSD) * 6.96).toFixed(2)}
        </h2>
        <p className="text-white/70 text-sm mt-1">
          ${(currentTotalUSD + ahorroBsUSD).toFixed(2)} USD
        </p>
        {primarySeries && (
          <div className="flex items-center gap-2 text-sm font-bold mt-3 w-fit px-3 py-1 rounded-full bg-black/20">
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isUp ? '+' : ''}
            {delta.toFixed(2)} USD ({deltaPct.toFixed(2)}%) en el periodo
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Mostrar en gráfico
        </p>
        <div className="flex flex-wrap gap-2">
          <ChipButton key={SPECIAL_TODO.key} type={SPECIAL_TODO} />
          {FIXED_TYPES.map((a) => (
            <ChipButton key={a.key} type={a} />
          ))}
        </div>
        {manualTypes.length > 0 && (
          <>
            <p className="text-[10px] text-white/20 uppercase tracking-wider pt-1">
              Activos manuales
            </p>
            <div className="flex flex-wrap gap-2">
              {manualTypes.map((a) => (
                <ChipButton key={a.key} type={a} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex bg-brand-card rounded-2xl border border-white/5 p-1 gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === p.key ? 'bg-brand-teal text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-brand-card rounded-3xl border border-white/5 p-5">
        {activeSeries.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {activeSeries.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 rounded-full inline-block"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[10px] text:white/50">{s.label}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: s.color }}
                >
                  {fmt(s.data[s.data.length - 1]?.v ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
        {activeSeries.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-white/30 text-sm">
            Selecciona al menos un grupo
          </div>
        ) : activeSeries.every((s) => s.data.length < 2) ? (
          <div className="h-36 flex items-center justify-center text-white/30 text-sm">
            No hay suficiente historial para este periodo
          </div>
        ) : (
          <>
            {hoverPoint && primarySeries && (
              <div className="flex justify-between text-[10px] text-white/60 mb-1">
                <span>{hoverPoint.date}</span>
                <span>
                  {primarySeries.label}: $
                  {primarySeries.data[hoverPoint.index]?.v.toFixed(2)}
                </span>
              </div>
            )}
            <div className="w-full">
              <MultiLineChart
                series={activeSeries}
                onHover={setHoverPoint}
                period={period}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>{longestSeries?.data[0]?.date}</span>
              <span>
                {
                  longestSeries?.data[
                    longestSeries.data.length - 1
                  ]?.date
                }
              </span>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Desglose actual
        </p>
        {[
          {
            label: 'Todo (Total + Ahorro Bs)',
            key: 'todo_full',
            valueUSD: currentTotalUSD + ahorroBsUSD,
            color: SPECIAL_TODO.color,
            since: null,
          },
          {
            label: 'Total sin Bs',
            key: 'total',
            valueUSD: currentTotalUSD,
            color: FIXED_TYPES[0].color,
            since: null,
          },
          {
            label: 'Crypto (Binance)',
            key: 'crypto',
            valueUSD: totalCryptoUSD,
            color: '#f97316',
            since: null,
          },
          {
            label: 'ETFs (Admirals)',
            key: 'etfs',
            valueUSD: totalInversionUSD,
            color: '#3b82f6',
            since: null,
          },
          ...(manualTypes ?? [])
            .filter((a) => a.valueUSD > 0)
            .map((a) => ({
              label: a.label,
              key: a.key,
              valueUSD: a.valueUSD,
              color: a.color,
              since: a.since ?? null,
            })),
        ]
          .filter((r) => r.valueUSD > 0)
          .map((row) => (
            <div
              key={row.key}
              onClick={() => toggleVisible(row.key)}
              style={{
                borderColor: vis[row.key]
                  ? row.color + '66'
                  : 'rgba(255,255,255,0.05)',
              }}
              className="bg-brand-card rounded-2xl border p-4 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <div>
                  <p className="text-sm font-semibold">{row.label}</p>
                  {row.since && (
                    <p className="text-[10px] text-white/30">
                      desde {row.since}
                    </p>
                  )}
                </div>
                {vis[row.key] && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      backgroundColor: row.color + '33',
                      color: row.color,
                    }}
                  >
                    visible
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">${row.valueUSD.toFixed(2)}</p>
                <p className="text-xs text-white/40">
                  Bs {(row.valueUSD * 6.96).toFixed(2)}
                </p>
                <p className="text-[10px] text-white/30">
                  {currentTotalUSD + ahorroBsUSD > 0
                    ? ((row.valueUSD / (currentTotalUSD + ahorroBsUSD)) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          ))}
      </div>

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
                <div
                  key={d.date}
                  className={`flex justify-between items-center px-4 py-3 ${
                    i > 0 ? 'border-t border-white/5' : ''
                  }`}
                >
                  <span className="text-sm text-white/70">{d.date}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">
                      ${d.v.toFixed(2)}
                    </span>
                    {diff !== 0 && (
                      <span
                        className={`ml-2 text-xs font-bold ${
                          diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {diff >= 0 ? '+' : ''}
                        {diff.toFixed(2)}
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