// src/pages/WealthHistory.jsx
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, Eye, ChevronDown } from 'lucide-react';
import { animate, stagger } from 'animejs';
import './WealthHistory.css';

// ── Constantes ────────────────────────────────────────────────
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

const SPECIAL_TODO = { key: 'todo_full', label: 'Todo', field: 'todo_full', color: '#22c55e' };

const ROLE_TYPES = [
  { key: 'role_trading',   label: 'Trading (QF)',  color: '#ec4899' },
  { key: 'role_yield',     label: 'Yield (AirTM)', color: '#a855f7' },
  { key: 'role_reserve',   label: 'Reservas',      color: '#facc15' },
  { key: 'role_patrimony', label: 'Patrimonio',    color: '#06b6d4' },
];

const MANUAL_PALETTE        = ['#a855f7', '#ec4899', '#facc15', '#06b6d4', '#10b981'];
const EXCLUDED_FROM_TRADING = new Set(['AirTM', 'Ahorro', 'AhorroBs', 'SAFI', 't ACH', 't SAS']);

// ── Helpers puros ─────────────────────────────────────────────
function classifyManualField(name) {
  const l = name.toLowerCase().trim();
  if (l === 'airtm')                              return 'yield';
  if (['ahorro', 'ahorrobs', 'safi'].includes(l)) return 'reserve';
  if (['t ach', 't sas'].includes(l))             return 'patrimony';
  return 'trading';
}

function computeRolesFromRow(row, bobRate) {
  const rate  = bobRate || 6.96;
  const roles = { trading: 0, yield: 0, reserve: 0, patrimony: 0 };
  Object.entries(row).forEach(([key, val]) => {
    if (!key.startsWith('manual_') || val == null || val === 0) return;
    const name = key.replace('manual_', '').trim();
    const usd  = name.toLowerCase() === 'ahorrobs'
      ? (typeof val === 'number' ? val / rate : 0)
      : (typeof val === 'number' ? val : 0);
    const role = classifyManualField(name);
    roles[role] = (roles[role] ?? 0) + usd;
  });
  return roles;
}

const fmt  = (n = 0) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toFixed(0)}`;
const fmtF = (n = 0) => `$${Number(n).toFixed(2)}`;

// ── Smooth path (bezier cúbico) ───────────────────────────────
function buildSmoothPath(data, toX, toY) {
  if (data.length < 2) return '';
  const pts = data.map((d, i) => [toX(i, data.length), toY(d.v)]);
  let path = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return path;
}

// ── ChartTooltip ──────────────────────────────────────────────
const ChartTooltip = ({ point, series, anchorX, anchorY, svgRect }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, { opacity: [0, 1], scale: [0.9, 1], duration: 150, ease: 'outExpo' });
  }, [point?.index]);

  if (!point || !svgRect) return null;

  const GAP  = 14;
  const left = svgRect.left + anchorX;
  const top  = svgRect.top  + anchorY - GAP;

  return ReactDOM.createPortal(
    <div ref={ref} className="wh-tooltip" style={{ left, top }}>
      <p className="wh-tooltip-date">{point.date}</p>
      <div className="wh-tooltip-divider" />
      {series.map(s => {
        const v = s.data[point.index]?.v;
        if (v == null) return null;
        return (
          <div key={s.key} className="wh-tooltip-row">
            <span className="wh-tooltip-label">
              <span className="wh-tooltip-dot" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="wh-tooltip-val" style={{ color: s.color }}>{fmtF(v)}</span>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

// ── MultiLineChart ────────────────────────────────────────────
const MultiLineChart = ({ series, period, onHoverChange }) => {
  const W = 560, H = 240;
  const PAD = { t: 20, b: 34, l: 54, r: 18 };

  const [hoverIdx,  setHoverIdx]  = useState(null);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const [svgRect,   setSvgRect]   = useState(null);
  const svgRef = useRef(null);

  const primary = series[0] || { data: [] };
  const allVals = series.flatMap(s => s.data.map(d => d.v));
  if (!allVals.length) return null;

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const pad    = (rawMax - rawMin) * 0.08 || 1;
  const min    = rawMin - pad;
  const max    = rawMax + pad;
  const range  = max - min || 1;

  const toX = (i, len) => PAD.l + (i / Math.max(len - 1, 1)) * (W - PAD.l - PAD.r);
  const toY = (v)       => PAD.t + (1 - (v - min) / range)   * (H - PAD.t - PAD.b);

  const parseD = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  };

  const pickLabels = () => {
    if (!primary.data.length) return [];
    if (period === '1W') return primary.data.map((d, i) => ({ ...d, index: i }));
    if (period === '1M') {
      const r = []; let last = null;
      primary.data.forEach((d, i) => {
        const c = parseD(d.date);
        if (!last || (c - last) / 86400000 >= 7) { r.push({ ...d, index: i }); last = c; }
      });
      return r;
    }
    if (period === '3M' || period === '1Y') {
      const m = new Map();
      primary.data.forEach((d, i) => {
        const k = d.date.slice(0, 7);
        if (!m.has(k)) m.set(k, { ...d, index: i });
      });
      return Array.from(m.values());
    }
    if (period === 'ALL') {
      const m = new Map();
      primary.data.forEach((d, i) => {
        const k = d.date.slice(0, 4);
        if (!m.has(k)) m.set(k, { ...d, index: i });
      });
      return Array.from(m.values());
    }
    return [];
  };

  const pointLabels = pickLabels();
  const xLabels = (() => {
    if (!primary.data.length) return [];
    if (period === '1W')                    return primary.data.map((d, i) => ({ index: i, txt: d.date.slice(5) }));
    if (period === '1M')                    return pointLabels.map(p => ({ index: p.index, txt: p.date.slice(5) }));
    if (period === '3M' || period === '1Y') return pointLabels.map(p => ({ index: p.index, txt: p.date.slice(0, 7) }));
    if (period === 'ALL')                   return pointLabels.map(p => ({ index: p.index, txt: p.date.slice(0, 4) }));
    return [];
  })();

  const yLabels = Array.from({ length: 5 }, (_, i) => max - (i / 4) * (max - min));

  const handleMove = useCallback((e) => {
    if (!primary.data.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setSvgRect(rect);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x   = clientX - rect.left;
    const len = primary.data.length;
    const rel = (x - PAD.l) / (W - PAD.l - PAD.r);
    const idx = Math.min(len - 1, Math.max(0, Math.round(rel * (len - 1))));
    setHoverIdx(idx);
    setAnchorPos({ x: toX(idx, len), y: toY(primary.data[idx]?.v ?? rawMin) });
    onHoverChange?.({ index: idx, date: primary.data[idx].date });
  }, [primary.data, rawMin]);

  const handleLeave = useCallback(() => {
    setHoverIdx(null);
    onHoverChange?.(null);
  }, [onHoverChange]);

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="wh-chart-svg"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchMove={handleMove}
        onTouchEnd={handleLeave}
      >
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`grd-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.4"  />
              <stop offset="60%"  stopColor={s.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0"    />
            </linearGradient>
          ))}
          {/* Filtro glow para líneas */}
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Y */}
        {yLabels.map((val, i) => {
          const y = toY(val);
          return (
            <g key={i}>
              <line
                x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
                strokeDasharray={i === 0 || i === 4 ? 'none' : '4,4'}
              />
              <text
                x={PAD.l - 6} y={y + 4}
                textAnchor="end" fontSize="9"
                fill="rgba(255,255,255,0.45)"
                fontFamily="'JetBrains Mono', monospace"
              >
                {fmt(val)}
              </text>
            </g>
          );
        })}

        {/* Eje X base */}
        <line
          x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1"
        />

        {/* Labels X */}
        {xLabels.map(l => {
          const x = toX(l.index, primary.data.length);
          return (
            <g key={l.txt}>
              <line
                x1={x} y1={H - PAD.b} x2={x} y2={H - PAD.b + 4}
                stroke="rgba(255,255,255,0.18)" strokeWidth="1"
              />
              <text
                x={x} y={H - PAD.b + 14}
                textAnchor="middle" fontSize="9"
                fill="rgba(255,255,255,0.45)"
                fontFamily="'JetBrains Mono', monospace"
              >
                {l.txt}
              </text>
            </g>
          );
        })}

        {/* Series: área + glow + línea */}
        {series.map(s => {
          if (s.data.length < 2) return null;
          const lineD = buildSmoothPath(s.data, toX, toY);
          const areaD = lineD
            + ` L ${toX(s.data.length - 1, s.data.length)},${H - PAD.b}`
            + ` L ${PAD.l},${H - PAD.b} Z`;
          return (
            <g key={s.key}>
              {/* Área */}
              <path d={areaD} fill={`url(#grd-${s.key})`} />
              {/* Glow de línea */}
              <path
                d={lineD} fill="none"
                stroke={s.color} strokeWidth="6"
                strokeLinecap="round" strokeLinejoin="round"
                opacity="0.18"
              />
              {/* Línea principal */}
              <path
                d={lineD} fill="none"
                stroke={s.color} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Línea vertical hover */}
        {hoverIdx !== null && (
          <line
            x1={toX(hoverIdx, primary.data.length)} y1={PAD.t}
            x2={toX(hoverIdx, primary.data.length)} y2={H - PAD.b}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4,4"
          />
        )}

        {/* Puntos hover */}
        {hoverIdx !== null && series.map(s => {
          const d = s.data[hoverIdx];
          if (!d) return null;
          const x = toX(hoverIdx, s.data.length);
          const y = toY(d.v);
          return (
            <g key={s.key}>
              <circle cx={x} cy={y} r={10}  fill={s.color} opacity="0.1"  />
              <circle cx={x} cy={y} r={6}   fill={s.color} opacity="0.2"  />
              <circle cx={x} cy={y} r={4}   fill={s.color} />
              <circle cx={x} cy={y} r={1.8} fill="#fff"    />
            </g>
          );
        })}

        {/* Puntos de referencia sin hover */}
        {hoverIdx === null && pointLabels.map(p => (
          <circle
            key={p.date}
            cx={toX(p.index, primary.data.length)}
            cy={toY(p.v)}
            r={2.5} fill="#fff" opacity="0.4"
          />
        ))}
      </svg>

      {hoverIdx !== null && (
        <ChartTooltip
          point={{ index: hoverIdx, date: primary.data[hoverIdx]?.date }}
          series={series}
          anchorX={anchorPos.x}
          anchorY={anchorPos.y}
          svgRect={svgRect}
        />
      )}
    </>
  );
};

// ── ChipButton ────────────────────────────────────────────────
const ChipButton = ({ type, active, onToggle, currentValue }) => (
  <button
    onClick={() => onToggle(type.key)}
    className={`wh-chip ${active ? 'wh-chip--active' : ''}`}
    style={active
      ? { backgroundColor: type.color, color: '#000', borderColor: type.color }
      : { borderColor: type.color + '44' }}
  >
    <span className="wh-chip-dot" style={{ backgroundColor: active ? '#000' : type.color }} />
    {type.label}
    <span className="wh-chip-val" style={{ opacity: active ? 0.7 : 0.4 }}>
      {fmt(currentValue ?? 0)}
    </span>
  </button>
);

// ── BreakdownRow ──────────────────────────────────────────────
const BreakdownRow = ({ row, active, onToggle, totalUSD, prevValue, bobRate }) => {
  const BOB     = bobRate || 6.96;
  const diff    = prevValue != null ? row.valueUSD - prevValue : null;
  const diffPct = prevValue > 0 ? ((row.valueUSD - prevValue) / prevValue) * 100 : null;
  const isUp    = diff == null || diff >= 0;

  return (
    <div
      onClick={() => onToggle(row.key)}
      className={`wh-breakdown-row ${active ? 'wh-breakdown-row--active' : ''}`}
      style={{ '--row-color': row.color }}
    >
      <div className="wh-breakdown-top">
        <div className="wh-breakdown-left">
          <span className="wh-breakdown-dot" style={{ backgroundColor: row.color }} />
          <div>
            <p className="wh-breakdown-label">{row.label}</p>
            {row.since && <p className="wh-breakdown-since">desde {row.since}</p>}
          </div>
          {active && (
            <span className="wh-breakdown-badge"
              style={{ backgroundColor: row.color + '33', color: row.color }}>
              en gráfico
            </span>
          )}
        </div>
        <div className="wh-breakdown-right">
          <p className="wh-breakdown-usd">{fmtF(row.valueUSD)}</p>
          <p className="wh-breakdown-bs">
            Bs {(row.valueUSD * BOB).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
          <p className="wh-breakdown-pct">
            {totalUSD > 0 ? ((row.valueUSD / totalUSD) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="wh-breakdown-bar-track">
        <div className="wh-breakdown-bar-fill"
          style={{
            width:      `${totalUSD > 0 ? Math.min((row.valueUSD / totalUSD) * 100, 100) : 0}%`,
            background: row.color,
          }}
        />
      </div>

      {diff !== null && (
        <div className="wh-breakdown-delta">
          {isUp
            ? <TrendingUp  size={10} className="wh-delta-up"   />
            : <TrendingDown size={10} className="wh-delta-down" />}
          <span className={isUp ? 'wh-delta-up' : 'wh-delta-down'}>
            {isUp ? '+' : ''}{diff.toFixed(2)} ({diffPct?.toFixed(1)}%)
          </span>
          <span className="wh-delta-label">vs snapshot anterior</span>
        </div>
      )}
    </div>
  );
};

// ── SnapshotsTable ────────────────────────────────────────────
const SnapshotsTable = ({ series }) => {
  const [expanded, setExpanded] = useState(false);

  if (!series || series.data.length < 2) return null;
  const rows    = [...series.data].reverse();
  const visible = expanded ? rows : rows.slice(0, 5);

  return (
    <div className="wh-snapshots">
      <div className="wh-snapshots-header">
        <p className="wh-section-label">Snapshots · {series.label}</p>
        <span className="wh-snapshots-count">{rows.length} registros</span>
      </div>

      <div className="wh-snapshots-table">
        {visible.map((d, i) => {
          const idx  = series.data.findIndex(x => x.date === d.date);
          const prev = series.data[idx - 1];
          const diff = prev ? d.v - prev.v : 0;
          const pct  = prev && prev.v > 0 ? (diff / prev.v) * 100 : 0;
          return (
            <div key={d.date} className={`wh-snapshot-row ${i > 0 ? 'wh-snapshot-row--border' : ''}`}>
              <span className="wh-snapshot-date">{d.date}</span>
              <div className="wh-snapshot-right">
                <span className="wh-snapshot-val">{fmtF(d.v)}</span>
                {diff !== 0 && (
                  <span className={`wh-snapshot-diff ${diff >= 0 ? 'wh-delta-up' : 'wh-delta-down'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                    <span className="wh-snapshot-pct"> ({pct.toFixed(1)}%)</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rows.length > 5 && (
        <button className="wh-expand-btn" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Ver menos' : `Ver ${rows.length - 5} más`}
          <ChevronDown size={12} className={expanded ? 'wh-chevron-open' : ''} />
        </button>
      )}
    </div>
  );
};

// ── WealthHistory ─────────────────────────────────────────────
const WealthHistory = () => {
  const {
    chartHistory, totalCryptoUSD, totalInversionUSD,
    manualAssets, loading, bobRate,
  } = useApp();

  const BOB = bobRate || 6.96;

  const fmtBs = useCallback(
    (usd) => `Bs ${(usd * BOB).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`,
    [BOB]
  );

  const [period,  setPeriod]  = useState('1M');
  const [visible, setVisible] = useState({ todo_full: true });
  const [hoverPt, setHoverPt] = useState(null);
  const headerRef = useRef(null);
  const chipsRef  = useRef(null);

  useEffect(() => {
    if (!headerRef.current) return;
    animate(headerRef.current, { opacity: [0, 1], translateY: [-12, 0], duration: 500, ease: 'outExpo' });
  }, [loading]);

  useEffect(() => {
    if (!chipsRef.current) return;
    animate(chipsRef.current.querySelectorAll('button'), {
      opacity: [0, 1], translateY: [6, 0], duration: 300, delay: stagger(30), ease: 'outExpo',
    });
  }, [loading]);

  // manualTypes
  const manualTypes = useMemo(() =>
    (manualAssets ?? []).map((a, i) => {
      let fieldName = a.name;
      if (a.name === 'Ahorro $')     fieldName = 'Ahorro';
      if (a.name === 'Ahorro en Bs') fieldName = 'AhorroBs';
      const isAhorroBs = fieldName === 'AhorroBs';
      const valueUSD   = isAhorroBs
        ? (a.valueBOB ?? a.amount ?? 0) / BOB
        : (a.valueUSD ?? 0);
      return {
        key:       `manual_${fieldName}`,
        label:     a.name,
        field:     `manual_${fieldName}`,
        color:     MANUAL_PALETTE[i % MANUAL_PALETTE.length],
        since:     a.since ?? null,
        valueUSD,
        isManual:  true,
        isAhorroBs,
        isTrading: !EXCLUDED_FROM_TRADING.has(fieldName),
      };
    }), [manualAssets, BOB]);

  // ahorroBsUSD calculado localmente
  const ahorroBsUSD = useMemo(() => {
    const asset = manualAssets?.find(a => a.name === 'Ahorro en Bs' || a.name === 'AhorroBs');
    if (!asset) return 0;
    return (asset.valueBOB ?? asset.amount ?? 0) / BOB;
  }, [manualAssets, BOB]);

  const currentTotalUSD = (totalCryptoUSD ?? 0) + (totalInversionUSD ?? 0) +
    manualTypes.filter(t => !t.isAhorroBs).reduce((s, t) => s + (t.valueUSD ?? 0), 0);

  const currentRoleValues = useMemo(() => {
    if (!chartHistory?.length) return { trading: 0, yield: 0, reserve: 0, patrimony: 0 };
    const latest = [...chartHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
    return computeRolesFromRow(latest, BOB);
  }, [chartHistory, BOB]);

  const ALL_TYPES = [SPECIAL_TODO, ...FIXED_TYPES, ...ROLE_TYPES, ...manualTypes];

  const vis = useMemo(() => {
    const d = {};
    ALL_TYPES.forEach(t => { d[t.key] = false; });
    return { ...d, ...visible };
  }, [visible, manualTypes]);

  const currentByKey = useMemo(() => ({
    todo_full:      currentTotalUSD + ahorroBsUSD,
    total:          currentTotalUSD,
    crypto:         totalCryptoUSD ?? 0,
    etfs:           totalInversionUSD ?? 0,
    role_trading:   currentRoleValues.trading,
    role_yield:     currentRoleValues.yield,
    role_reserve:   currentRoleValues.reserve,
    role_patrimony: currentRoleValues.patrimony,
    ...Object.fromEntries(manualTypes.map(t => [t.key, t.valueUSD])),
  }), [currentTotalUSD, totalCryptoUSD, totalInversionUSD, manualTypes, ahorroBsUSD, currentRoleValues]);

  const days = PERIODS.find(p => p.key === period)?.days ?? 30;

  const seriesData = useMemo(() => {
    const cutoff  = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const inRange = (s) => days >= 9999 || new Date(s) >= cutoff;
    const sorted  = chartHistory?.length
      ? [...chartHistory].sort((a, b) => a.date.localeCompare(b.date))
      : [];
    const result = {};

    for (const a of FIXED_TYPES) {
      result[a.key] = sorted
        .map(d => d[a.field] != null ? { date: d.date, v: d[a.field] } : null)
        .filter(Boolean).filter(d => inRange(d.date));
    }

    const totalS = result['total'] ?? [];
    const mapBs  = new Map(sorted.map(d => [
      d.date,
      d['manual_AhorroBs'] != null ? d['manual_AhorroBs'] / BOB : 0,
    ]));
    result['todo_full'] = totalS
      .map(p => ({ date: p.date, v: p.v + (mapBs.get(p.date) ?? 0) }))
      .filter(d => inRange(d.date));

    for (const r of ROLE_TYPES) {
      const roleName = r.key.replace('role_', '');
      result[r.key] = sorted
        .map(d => {
          const v = computeRolesFromRow(d, BOB)[roleName] ?? 0;
          return v > 0 ? { date: d.date, v } : null;
        })
        .filter(Boolean).filter(d => inRange(d.date));
    }

    for (const a of manualTypes) {
      result[a.key] = sorted
        .map(d => {
          const raw = d[a.field];
          if (raw == null) return null;
          const v = a.isAhorroBs ? raw / BOB : raw;
          return { date: d.date, v };
        })
        .filter(Boolean).filter(d => inRange(d.date));
    }

    return result;
  }, [chartHistory, days, manualTypes, BOB]);

  const toggleVisible = useCallback((key) => setVisible(p => ({ ...p, [key]: !p[key] })), []);

  const activeSeries = ALL_TYPES
    .filter(a => vis[a.key])
    .map(a => ({ ...a, data: seriesData[a.key] ?? [] }));

  const primarySeries = activeSeries[0];
  const first    = primarySeries?.data[0]?.v ?? 0;
  const lastVal  = primarySeries?.data[primarySeries?.data.length - 1]?.v ?? 0;
  const delta    = lastVal - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;
  const isUp     = delta >= 0;

  const hoverVal = hoverPt != null && primarySeries
    ? (primarySeries.data[hoverPt.index]?.v ?? null)
    : null;

  const prevSnap = useMemo(() => {
    if (!chartHistory?.length) return null;
    return [...chartHistory].sort((a, b) => b.date.localeCompare(a.date))[1] ?? null;
  }, [chartHistory]);

  const prevByKey = useMemo(() => {
    if (!prevSnap) return {};
    const roles  = computeRolesFromRow(prevSnap, BOB);
    const prevBs = prevSnap['manual_AhorroBs'] != null ? prevSnap['manual_AhorroBs'] / BOB : 0;
    const prevT  = prevSnap['totalPortfolioUSD'] ?? 0;
    return {
      todo_full:      prevT + prevBs,
      total:          prevT,
      crypto:         prevSnap['cryptoUSD']    ?? 0,
      etfs:           prevSnap['inversionUSD'] ?? 0,
      role_trading:   roles.trading,
      role_yield:     roles.yield,
      role_reserve:   roles.reserve,
      role_patrimony: roles.patrimony,
      ...Object.fromEntries(manualTypes.map(t => [t.key, prevSnap[t.field] ?? 0])),
    };
  }, [prevSnap, BOB, manualTypes]);

  const tradingManual    = manualTypes.filter(t =>  t.isTrading && (t.valueUSD ?? 0) > 0);
  const nonTradingManual = manualTypes.filter(t => !t.isTrading && (t.valueUSD ?? 0) > 0);

  if (loading) return (
    <div className="wh-loading">
      <div className="wh-spinner" />
    </div>
  );

  const totalDisplay = currentTotalUSD + ahorroBsUSD;
  const displayVal   = hoverVal ?? totalDisplay;

  return (
    <div className="wh-page">

      {/* Header */}
      <div ref={headerRef} className="wh-header" style={{ opacity: 0 }}>
        <div className="wh-header-inner">
          <div>
            <h1 className="wh-title">Historial Patrimonial</h1>
            <p className="wh-subtitle">
              {new Date().toLocaleDateString('es-BO', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Hero + Gráfico en desktop: side by side */}
      <div className="wh-top-grid">

        {/* Hero */}
        <div className="wh-hero">
          <div className="wh-hero-glow" />
          {/* <p className="wh-hero-eyebrow">Patrimonio Total</p> */}
          <div className="wh-hero-value-wrap">
            <p className="wh-hero-value">
              {fmtF(displayVal)}
              <span className="wh-hero-currency">USD</span>
            </p>
            {/* <p className="wh-hero-bs">{fmtBs(displayVal)}</p> */}
            <p className="wh-hero-rate">TC: Bs {BOB.toFixed(2)} / USD</p>
          </div>

          {primarySeries && hoverPt == null && (
            <div className={`wh-hero-delta ${isUp ? 'wh-hero-delta--up' : 'wh-hero-delta--down'}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? '+' : ''}{delta.toFixed(2)} USD ({deltaPct.toFixed(2)}%) en el período
            </div>
          )}
          {hoverPt && (
            <p className="wh-hero-hover-date">{hoverPt.date}</p>
          )}

          {/* Mini stats */}
          <div className="wh-hero-stats">
            {[
              { label: 'Crypto',  val: totalCryptoUSD ?? 0,    color: '#f97316' },
              { label: 'ETFs',    val: totalInversionUSD ?? 0, color: '#3b82f6' },
              { label: 'Ahorro',  val: ahorroBsUSD,            color: '#facc15' },
            ].map(s => (
              <div key={s.label} className="wh-hero-stat">
                <span className="wh-hero-stat-dot" style={{ background: s.color }} />
                <div>
                  <p className="wh-hero-stat-label">{s.label}</p>
                  <p className="wh-hero-stat-val" style={{ color: s.color }}>{fmt(s.val)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        <div className="wh-chart-card">

          {/* Período */}
          <div className="wh-period-bar">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`wh-period-btn ${period === p.key ? 'wh-period-btn--active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Leyenda */}
          {activeSeries.length > 0 && (
            <div className="wh-chart-legend">
              {activeSeries.map(s => (
                <div key={s.key} className="wh-legend-item">
                  <span className="wh-legend-line" style={{ backgroundColor: s.color }} />
                  <span className="wh-legend-name">{s.label}</span>
                  <span className="wh-legend-val" style={{ color: s.color }}>
                    {fmt(hoverPt != null
                      ? (s.data[hoverPt.index]?.v ?? 0)
                      : (s.data[s.data.length - 1]?.v ?? 0)
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* SVG */}
          {activeSeries.length === 0 ? (
            <div className="wh-chart-empty">
              <Eye size={28} opacity={0.3} />
              <p>Selecciona al menos un activo</p>
            </div>
          ) : activeSeries.every(s => s.data.length < 2) ? (
            <div className="wh-chart-empty">
              <p>Sin suficiente historial para este período</p>
            </div>
          ) : (
            <MultiLineChart series={activeSeries} period={period} onHoverChange={setHoverPt} />
          )}

          {/* Fechas extremas */}
          {activeSeries.length > 0 && (() => {
            const longest = activeSeries.reduce(
              (a, b) => b.data.length > (a?.data.length ?? 0) ? b : a, null
            );
            return longest?.data.length > 1 ? (
              <div className="wh-chart-dates">
                <span>{longest.data[0]?.date}</span>
                <span>{longest.data[longest.data.length - 1]?.date}</span>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Selector de series */}
      <div ref={chipsRef} className="wh-chips-section">
        <p className="wh-section-label">Mostrar en gráfico</p>
        <div className="wh-chips-row">
          {[SPECIAL_TODO, ...FIXED_TYPES].map(t => (
            <ChipButton key={t.key} type={t} active={vis[t.key]}
              onToggle={toggleVisible} currentValue={currentByKey[t.key]} />
          ))}
        </div>

        <p className="wh-section-sublabel">Por categoría</p>
        <div className="wh-chips-row">
          {ROLE_TYPES.map(t => (
            <ChipButton key={t.key} type={t} active={vis[t.key]}
              onToggle={toggleVisible} currentValue={currentByKey[t.key]} />
          ))}
        </div>


        {nonTradingManual.length > 0 && (
          <>
            <p className="wh-section-sublabel">Activos manuales</p>
            <div className="wh-chips-row">
              {nonTradingManual.map(t => (
                <ChipButton key={t.key} type={t} active={vis[t.key]}
                  onToggle={toggleVisible} currentValue={currentByKey[t.key]} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desglose + Snapshots en desktop: 2 columnas */}
      <div className="wh-bottom-grid">

        {/* Desglose */}
        <div className="wh-breakdown-section">
          <p className="wh-section-label">Desglose actual</p>
          {[
            { label: 'Todo (Total + Ahorro Bs)', key: 'todo_full', valueUSD: currentTotalUSD + ahorroBsUSD, color: SPECIAL_TODO.color },
            { label: 'Total sin Bs',             key: 'total',     valueUSD: currentTotalUSD,               color: FIXED_TYPES[0].color },
            { label: 'Crypto (Binance)',          key: 'crypto',    valueUSD: totalCryptoUSD ?? 0,           color: '#f97316' },
            { label: 'ETFs (Admirals)',           key: 'etfs',      valueUSD: totalInversionUSD ?? 0,        color: '#3b82f6' },
          ].filter(r => r.valueUSD > 0).map(row => (
            <BreakdownRow key={row.key} row={row} active={vis[row.key]}
              onToggle={toggleVisible} totalUSD={totalDisplay}
              prevValue={prevByKey[row.key]} bobRate={BOB} />
          ))}

          <p className="wh-section-sublabel wh-section-sublabel--pt">Por categoría</p>
          {[
            { label: 'Trading (Quantfury)', key: 'role_trading',   valueUSD: currentRoleValues.trading,   color: '#ec4899' },
            { label: 'Yield (AirTM DeFi)', key: 'role_yield',      valueUSD: currentRoleValues.yield,     color: '#a855f7' },
            { label: 'Reservas',           key: 'role_reserve',    valueUSD: currentRoleValues.reserve,   color: '#facc15' },
            { label: 'Patrimonio físico',  key: 'role_patrimony',  valueUSD: currentRoleValues.patrimony, color: '#06b6d4' },
          ].filter(r => r.valueUSD > 0).map(row => (
            <BreakdownRow key={row.key} row={row} active={vis[row.key]}
              onToggle={toggleVisible} totalUSD={totalDisplay}
              prevValue={prevByKey[row.key]} bobRate={BOB} />
          ))}

          {tradingManual.length > 0 && (
            <p className="wh-section-sublabel wh-section-sublabel--pt">Quantfury — individual</p>
          )}
          {tradingManual.map(a => (
            <BreakdownRow key={a.key}
              row={{ label: a.label, key: a.key, valueUSD: a.valueUSD, color: a.color, since: a.since }}
              active={vis[a.key]} onToggle={toggleVisible} totalUSD={totalDisplay}
              prevValue={prevByKey[a.key]} bobRate={BOB} />
          ))}

          {nonTradingManual.length > 0 && (
            <p className="wh-section-sublabel wh-section-sublabel--pt">Activos manuales</p>
          )}
          {nonTradingManual.map(a => (
            <BreakdownRow key={a.key}
              row={{ label: a.label, key: a.key, valueUSD: a.valueUSD, color: a.color, since: a.since }}
              active={vis[a.key]} onToggle={toggleVisible} totalUSD={totalDisplay}
              prevValue={prevByKey[a.key]} bobRate={BOB} />
          ))}
        </div>

        {/* Snapshots */}
        <div>
          <SnapshotsTable series={primarySeries} />
        </div>
      </div>

    </div>
  );
};

export default WealthHistory;