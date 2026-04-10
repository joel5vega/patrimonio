// src/components/MarketHeatmap.jsx
import React, { useState } from 'react';
import {
  Bitcoin, CircleDollarSign, TrendingUp, BarChart2,
  Landmark, Layers, RefreshCw, ShieldCheck, Zap,
  Dices, Droplets, Building2, Briefcase, DollarSign,
} from 'lucide-react';
import './MarketHeatmap.css';

/* ── helpers ── */
const fmt = (v, d = 0) =>
  v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

const fmtPct = v =>
  v == null ? null : (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%';

/* ── Role metadata — synced with portfolioAnalysis.js ── */
const ROLE_META = {
  core:        { color: '#3b82f6', Icon: Landmark,    label: 'Core'        },
  growth:      { color: '#10b981', Icon: TrendingUp,  label: 'Growth'      },
  defensive:   { color: '#facc15', Icon: ShieldCheck, label: 'Defensive'   },
  liquidity:   { color: '#06b6d4', Icon: Droplets,    label: 'Liquidity'   },
  yield:       { color: '#14b8a6', Icon: Zap,         label: 'Yield'       },
  speculative: { color: '#f43f5e', Icon: Dices,       label: 'Speculative' },
  trading:     { color: '#a855f7', Icon: RefreshCw,   label: 'Trading'     },
  reserve:     { color: '#94a3b8', Icon: Briefcase,   label: 'Reserve'     },
  patrimony:   { color: '#f97316', Icon: Building2,   label: 'Patrimony'   },
};

/* ── Icon resolver: symbol > role > type ── */
const SYMBOL_ICON = {
  BTC:  { Icon: Bitcoin,          color: '#f97316' },
  ETH:  { Icon: Layers,           color: '#818cf8' },
  SOL:  { Icon: Zap,              color: '#facc15' },
  BNB:  { Icon: CircleDollarSign, color: '#eab308' },
  XRP:  { Icon: Droplets,         color: '#38bdf8' },
  ADA:  { Icon: Droplets,         color: '#60a5fa' },
  LINK: { Icon: Layers,           color: '#2563eb' },
  AVAX: { Icon: TrendingUp,       color: '#ef4444' },
  DOT:  { Icon: Layers,           color: '#a855f7' },
  MATIC:{ Icon: Layers,           color: '#8b5cf6' },
  UNI:  { Icon: RefreshCw,        color: '#f472b6' },
  AAVE: { Icon: Zap,              color: '#818cf8' },
  DOGE: { Icon: CircleDollarSign, color: '#facc15' },
  SHIB: { Icon: CircleDollarSign, color: '#f97316' },
  PEPE: { Icon: CircleDollarSign, color: '#4ade80' },
  USDT: { Icon: DollarSign,       color: '#22d3ee' },
  USDC: { Icon: DollarSign,       color: '#60a5fa' },
  BUSD: { Icon: DollarSign,       color: '#facc15' },
  DAI:  { Icon: DollarSign,       color: '#f59e0b' },
  FDUSD:{ Icon: DollarSign,       color: '#94a3b8' },
  VOO:  { Icon: BarChart2,        color: '#10b981' },
  SPY:  { Icon: BarChart2,        color: '#10b981' },
  QQQM: { Icon: BarChart2,        color: '#60a5fa' },
  QQQ:  { Icon: BarChart2,        color: '#60a5fa' },
  VTI:  { Icon: BarChart2,        color: '#34d399' },
  IVV:  { Icon: BarChart2,        color: '#10b981' },
  VXUS: { Icon: BarChart2,        color: '#06b6d4' },
  VWO:  { Icon: BarChart2,        color: '#06b6d4' },
  EMXC: { Icon: BarChart2,        color: '#06b6d4' },
  SCHD: { Icon: BarChart2,        color: '#facc15' },
  IAU:  { Icon: CircleDollarSign, color: '#eab308' },
  GLD:  { Icon: CircleDollarSign, color: '#eab308' },
  SLV:  { Icon: CircleDollarSign, color: '#94a3b8' },
  BND:  { Icon: BarChart2,        color: '#facc15' },
  TIP:  { Icon: BarChart2,        color: '#facc15' },
  VNQ:  { Icon: Building2,        color: '#facc15' },
  SGOV: { Icon: DollarSign,       color: '#06b6d4' },
  NVDA: { Icon: TrendingUp,       color: '#4ade80' },
  TSLA: { Icon: Zap,              color: '#34d399' },
  MSFT: { Icon: Building2,        color: '#60a5fa' },
  AAPL: { Icon: Building2,        color: '#94a3b8' },
};

const TYPE_ICON = {
  crypto:  { Icon: Bitcoin,    color: '#f97316' },
  stable:  { Icon: DollarSign, color: '#22d3ee' },
  etf:     { Icon: BarChart2,  color: '#10b981' },
  stock:   { Icon: Building2,  color: '#60a5fa' },
  manual:  { Icon: Briefcase,  color: '#94a3b8' },
};

function resolveIcon(asset) {
  const sym  = (asset.symbol || '').toUpperCase();
  const role = asset.classification?.role;
  const type = asset.type;
  if (SYMBOL_ICON[sym])        return SYMBOL_ICON[sym];
  if (role && ROLE_META[role]) return { Icon: ROLE_META[role].Icon, color: ROLE_META[role].color };
  if (type && TYPE_ICON[type]) return TYPE_ICON[type];
  return { Icon: Briefcase, color: '#64748b' };
}

/* ── PnL background ── */
function tileBg(pnlPct) {
  if (pnlPct == null) return 'rgba(30,41,59,0.7)';
  if (pnlPct >=  5)  return 'rgba(5,150,105,0.82)';
  if (pnlPct >=  2)  return 'rgba(16,185,129,0.60)';
  if (pnlPct >=  0)  return 'rgba(16,185,129,0.32)';
  if (pnlPct >= -2)  return 'rgba(244,63,94,0.32)';
  if (pnlPct >= -5)  return 'rgba(244,63,94,0.58)';
  return 'rgba(225,29,72,0.80)';
}

/* ── Tooltip ── */
function HeatTooltip({ asset, pct, pctLabel }) {
  const { Icon, color } = resolveIcon(asset);
  const role     = asset.classification?.role;
  const roleMeta = role ? ROLE_META[role] : null;
  const isDeFi   = asset.classification?.isDeFi;
  const aprPct   = asset.classification?.aprPct;

  return (
    <div className="heatmap-tooltip">
      <div className="heatmap-tooltip-header">
        <div
          className="heatmap-tooltip-icon-wrap"
          style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
        >
          <Icon size={16} color={color} strokeWidth={2} />
        </div>
        <div>
          <div className="heatmap-tooltip-name">{asset.name}</div>
          {asset.symbol && asset.symbol !== asset.name && (
            <div className="heatmap-tooltip-symbol">{asset.symbol}</div>
          )}
        </div>
      </div>

      <div className="heatmap-tooltip-divider" />

      <div className="heatmap-tooltip-rows">
        <div className="heatmap-tooltip-row">
          <span className="heatmap-tooltip-label">Valor</span>
          <span className="heatmap-tooltip-val">{fmt(asset.valueUSD, 0)}</span>
        </div>
        {asset.pct != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">Peso</span>
            <span className="heatmap-tooltip-val">{asset.pct.toFixed(1)}%</span>
          </div>
        )}
        {pctLabel && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">PnL</span>
            <span className={`heatmap-tooltip-pnl ${pct >= 0 ? 'up' : 'down'}`}>{pctLabel}</span>
          </div>
        )}
        {asset.price != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">Precio</span>
            <span className="heatmap-tooltip-val">{fmt(asset.price, 2)}</span>
          </div>
        )}
        {isDeFi && aprPct != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">APR</span>
            <span className="heatmap-tooltip-val" style={{ color: '#14b8a6' }}>
              <Zap size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              {aprPct}%
            </span>
          </div>
        )}
      </div>

      {roleMeta && (
        <div
          className="heatmap-tooltip-footer"
          style={{ borderColor: `${roleMeta.color}22` }}
        >
          <roleMeta.Icon size={10} color={roleMeta.color} style={{ marginRight: 5, flexShrink: 0 }} />
          <span className="heatmap-tooltip-role" style={{ color: roleMeta.color }}>
            {roleMeta.label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main tile (large, top row) ── */
function HeatTile({ asset, flex }) {
  const [hover, setHover] = useState(false);
  const pct       = asset.pnlPct ?? null;
  const bg        = tileBg(pct);
  const pctLabel  = fmtPct(pct);
  const ticker    = asset.symbol || asset.name?.slice(0, 6).toUpperCase() || '?';
  const { Icon, color } = resolveIcon(asset);
  const role      = asset.classification?.role;
  const roleColor = role ? (ROLE_META[role]?.color ?? '#334155') : '#334155';
  const isDeFi    = asset.classification?.isDeFi;
  const aprPct    = asset.classification?.aprPct;

  return (
    <div
      className="heatmap-tile"
      style={{
        flex,
        background: bg,
        border: `2px solid ${roleColor}99`,
        boxShadow: hover
          ? `inset 0 0 0 1px ${roleColor}bb, 0 0 12px ${roleColor}22`
          : `0 0 0 0px transparent`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {asset.pct != null && (
        <span className="tile-weight">{asset.pct.toFixed(1)}%</span>
      )}

      <Icon size={20} color={color} strokeWidth={2} className="tile-icon" />
      <span className="tile-ticker">{ticker}</span>

      {/* Value shown on large tiles */}
      {asset.pct > 8 && asset.valueUSD != null && (
        <span className="tile-value">{fmt(asset.valueUSD, 0)}</span>
      )}

      {/* DeFi APR badge */}
      {isDeFi && aprPct != null && (
        <span className="tile-apr">
          <Zap size={9} style={{ marginRight: 2, verticalAlign: 'middle' }} />
          {aprPct}% APR
        </span>
      )}

      {/* PnL or no-data indicator */}
      {pctLabel
        ? <span className="tile-change" style={{ color: pct >= 0 ? '#34d399' : '#fb7185' }}>{pctLabel}</span>
        : <span className="tile-no-data">—</span>
      }

      {hover && <HeatTooltip asset={asset} pct={pct} pctLabel={pctLabel} />}
    </div>
  );
}

/* ── Mini tile inside a role group ── */
function MiniTile({ asset }) {
  const [hover, setHover] = useState(false);
  const pct      = asset.pnlPct ?? null;
  const pctLabel = fmtPct(pct);
  const ticker   = asset.symbol || asset.name?.slice(0, 4).toUpperCase() || '?';

  return (
    <div
      className="heatmap-mini-tile"
      style={{ background: tileBg(pct) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="mini-ticker">{ticker}</span>
      {pctLabel
        ? <span className="mini-change" style={{ color: pct >= 0 ? '#34d399' : '#fb7185' }}>{pctLabel}</span>
        : <span className="mini-nodata">—</span>
      }
      {hover && <HeatTooltip asset={asset} pct={pct} pctLabel={pctLabel} />}
    </div>
  );
}

/* ── Role group block (secondary row) ── */
function RoleGroup({ role, assets, flex }) {
  const meta = ROLE_META[role] ?? { color: '#334155', Icon: Briefcase, label: role };
  const { Icon } = meta;
  const groupTotal = assets.reduce((s, a) => s + (a.pct ?? 0), 0);

  return (
    <div
      className="heatmap-role-group"
      style={{
        flex,
        border: `2px solid ${meta.color}77`,
        boxShadow: `0 0 8px ${meta.color}11`,
      }}
    >
      {/* Group header */}
      <div
        className="heatmap-role-group__header"
        style={{ borderBottom: `1px solid ${meta.color}33` }}
      >
        <Icon size={10} color={meta.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
        <span className="heatmap-role-group__label" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="heatmap-role-group__pct" style={{ color: `${meta.color}99` }}>
          {groupTotal.toFixed(1)}%
        </span>
      </div>

      {/* Mini tiles */}
      <div className="heatmap-role-group__tiles">
        {assets.map(a => (
          <MiniTile key={a.id || a.name} asset={a} />
        ))}
      </div>
    </div>
  );
}

/* ── Role legend ── */
function RoleLegend({ roles }) {
  if (!roles.length) return null;
  return (
    <div className="heatmap-role-legend">
      {roles.map(role => {
        const meta = ROLE_META[role];
        if (!meta) return null;
        return (
          <span key={role} className="heatmap-role-chip">
            <span className="heatmap-role-chip__dot" style={{ background: meta.color }} />
            <span style={{ color: meta.color }}>{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ── MarketHeatmap ── */
export default function MarketHeatmap({ assets }) {
  // Only investible
  const investible = (assets || []).filter(a => {
    const role = a.classification?.role ?? a.role;
    return role !== 'reserve' && role !== 'patrimony' && !a.locked;
  });

  if (!investible.length) return null;

  const totalVal = investible.reduce((s, a) => s + (a.valueUSD || 0), 0);
  if (!totalVal) return null;

  const sorted = [...investible]
    .sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0))
    .map(a => ({ ...a, pct: ((a.valueUSD || 0) / totalVal) * 100 }));

  // Top 5 → main row; rest → secondary grouped by role
  const MAIN_COUNT = Math.min(5, sorted.length);
  const mainTiles  = sorted.slice(0, MAIN_COUNT);
  const secAssets  = sorted.slice(MAIN_COUNT);

  // Group secondary assets by role, preserve role order
  const ROLE_ORDER = Object.keys(ROLE_META);
  const grouped = secAssets.reduce((acc, a) => {
    const role = a.classification?.role ?? 'liquidity';
    if (!acc[role]) acc[role] = [];
    acc[role].push(a);
    return acc;
  }, {});

  const groupEntries = ROLE_ORDER
    .filter(r => grouped[r]?.length > 0)
    .map(r => ({
      role: r,
      assets: grouped[r],
      totalPct: grouped[r].reduce((s, a) => s + (a.pct ?? 0), 0),
    }));

  const up     = investible.filter(a => (a.pnlPct ?? null) !== null && (a.pnlPct ?? 0) >= 0).length;
  const down   = investible.filter(a => (a.pnlPct ?? null) !== null && (a.pnlPct ?? 0) <  0).length;
  const noData = investible.filter(a => a.pnlPct == null).length;

  const presentRoles = [...new Set(sorted.map(a => a.classification?.role).filter(Boolean))]
    .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));

  return (
    <div className="heatmap-container">
      {/* Header */}
      <div className="heatmap-header">
        <span className="heatmap-title">Mapa de calor · Invertible</span>
        <div className="heatmap-legend">
          {down   > 0 && <span className="legend-item red">▼ {down}</span>}
          {noData > 0 && <span className="legend-item neutral">― {noData}</span>}
          {up     > 0 && <span className="legend-item green">▲ {up}</span>}
        </div>
      </div>

      <div className="heatmap-grid">
        {/* Main row — top 5 assets */}
        <div className="heatmap-row-main">
          {mainTiles.map(a => (
            <HeatTile key={a.id || a.name} asset={a} flex={a.pct} />
          ))}
        </div>

        {/* Secondary row — role groups */}
        {groupEntries.length > 0 && (
          <div className="heatmap-row-secondary">
            {groupEntries.map(g => (
              <RoleGroup
                key={g.role}
                role={g.role}
                assets={g.assets}
                flex={g.totalPct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <RoleLegend roles={presentRoles} />
    </div>
  );
}