// src/components/MarketHeatmap.jsx
import React, { useState } from 'react';
import {
  Bitcoin, CircleDollarSign, TrendingUp, BarChart2,
  Landmark, Layers, RefreshCw, ShieldCheck, Zap,
  Dices, Droplets, Building2, Briefcase, DollarSign,
} from 'lucide-react';
import './MarketHeatmap.css';

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (v, d = 0) =>
  v == null
    ? '—'
    : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

const fmtPct = v =>
  v == null ? null : (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%';

const fmtBs = (v, rate) =>
  v == null || !rate ? null : 'Bs ' + Math.round(v * rate).toLocaleString('es-BO');

// ─── ROLE METADATA ───────────────────────────────────────────
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

// ─── ICON RESOLVER ───────────────────────────────────────────
const SYMBOL_ICON = {
  BTC:   { Icon: Bitcoin,          color: '#f97316' },
  ETH:   { Icon: Layers,           color: '#818cf8' },
  SOL:   { Icon: Zap,              color: '#facc15' },
  BNB:   { Icon: CircleDollarSign, color: '#eab308' },
  XRP:   { Icon: Droplets,         color: '#38bdf8' },
  ADA:   { Icon: Droplets,         color: '#60a5fa' },
  LINK:  { Icon: Layers,           color: '#2563eb' },
  AVAX:  { Icon: TrendingUp,       color: '#ef4444' },
  DOT:   { Icon: Layers,           color: '#a855f7' },
  MATIC: { Icon: Layers,           color: '#8b5cf6' },
  UNI:   { Icon: RefreshCw,        color: '#f472b6' },
  AAVE:  { Icon: Zap,              color: '#818cf8' },
  DOGE:  { Icon: CircleDollarSign, color: '#facc15' },
  SHIB:  { Icon: CircleDollarSign, color: '#f97316' },
  PEPE:  { Icon: CircleDollarSign, color: '#4ade80' },
  USDT:  { Icon: DollarSign,       color: '#22d3ee' },
  USDC:  { Icon: DollarSign,       color: '#60a5fa' },
  BUSD:  { Icon: DollarSign,       color: '#facc15' },
  DAI:   { Icon: DollarSign,       color: '#f59e0b' },
  FDUSD: { Icon: DollarSign,       color: '#94a3b8' },
  VOO:   { Icon: BarChart2,        color: '#10b981' },
  SPY:   { Icon: BarChart2,        color: '#10b981' },
  QQQM:  { Icon: BarChart2,        color: '#60a5fa' },
  QQQ:   { Icon: BarChart2,        color: '#60a5fa' },
  VTI:   { Icon: BarChart2,        color: '#34d399' },
  IVV:   { Icon: BarChart2,        color: '#10b981' },
  VXUS:  { Icon: BarChart2,        color: '#06b6d4' },
  VWO:   { Icon: BarChart2,        color: '#06b6d4' },
  EMXC:  { Icon: BarChart2,        color: '#06b6d4' },
  SCHD:  { Icon: BarChart2,        color: '#facc15' },
  IAU:   { Icon: CircleDollarSign, color: '#eab308' },
  GLD:   { Icon: CircleDollarSign, color: '#eab308' },
  SLV:   { Icon: CircleDollarSign, color: '#94a3b8' },
  BND:   { Icon: BarChart2,        color: '#facc15' },
  TIP:   { Icon: BarChart2,        color: '#facc15' },
  VNQ:   { Icon: Building2,        color: '#facc15' },
  SGOV:  { Icon: DollarSign,       color: '#06b6d4' },
  NVDA:  { Icon: TrendingUp,       color: '#4ade80' },
  TSLA:  { Icon: Zap,              color: '#34d399' },
  MSFT:  { Icon: Building2,        color: '#60a5fa' },
  AAPL:  { Icon: Building2,        color: '#94a3b8' },
};

const TYPE_ICON = {
  crypto: { Icon: Bitcoin,    color: '#f97316' },
  stable: { Icon: DollarSign, color: '#22d3ee' },
  etf:    { Icon: BarChart2,  color: '#10b981' },
  stock:  { Icon: Building2,  color: '#60a5fa' },
  manual: { Icon: Briefcase,  color: '#94a3b8' },
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

// ─── TILE BACKGROUND ────────────────────────────────────────
function tileBg(pnlPct) {
  if (pnlPct == null) return 'rgba(30,41,59,0.7)';
  if (pnlPct >=  5)  return 'rgba(5,150,105,0.82)';
  if (pnlPct >=  2)  return 'rgba(16,185,129,0.60)';
  if (pnlPct >=  0)  return 'rgba(16,185,129,0.32)';
  if (pnlPct >= -2)  return 'rgba(244,63,94,0.32)';
  if (pnlPct >= -5)  return 'rgba(244,63,94,0.58)';
  return 'rgba(225,29,72,0.80)';
}

// ─── TOOLTIP ─────────────────────────────────────────────────
function HeatTooltip({ asset, bobRate }) {
  const { Icon, color } = resolveIcon(asset);
  const role     = asset.classification?.role;
  const roleMeta = role ? ROLE_META[role] : null;
  const isDeFi   = asset.classification?.isDeFi;
  const aprPct   = asset.classification?.aprPct;
  const pnlPct   = asset.pnlPct ?? null;
  const pnl      = asset.pnl    ?? null;

  return (
    <div className="heatmap-tooltip">
      {/* Header */}
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

      {/* Cantidad / subtitle */}
      {asset.subtitle && (
        <div className="heatmap-tooltip-qty">{asset.subtitle}</div>
      )}

      {/* Filas */}
      <div className="heatmap-tooltip-rows">
        {/* Valor */}
        <div className="heatmap-tooltip-row">
          <span className="heatmap-tooltip-label">Valor</span>
          <div style={{ textAlign: 'right' }}>
            <span className="heatmap-tooltip-val">{fmt(asset.valueUSD, 0)}</span>
            {bobRate && (
              <div className="heatmap-tooltip-sub">{fmtBs(asset.valueUSD, bobRate)}</div>
            )}
          </div>
        </div>

        {/* Peso */}
        {asset.pct != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">Peso</span>
            <span className="heatmap-tooltip-val">{asset.pct.toFixed(1)}%</span>
          </div>
        )}

        {/* Precio */}
        {asset.price != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">Precio</span>
            <span className="heatmap-tooltip-val">
              {fmt(asset.price, asset.price < 1 ? 4 : 2)}
            </span>
          </div>
        )}

        {/* PnL */}
        {pnlPct != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">PnL</span>
            <span className={`heatmap-tooltip-pnl ${pnlPct >= 0 ? 'up' : 'down'}`}>
              {pnl != null && `${pnl >= 0 ? '+' : ''}${fmt(pnl, 2)} · `}
              {fmtPct(pnlPct)}
            </span>
          </div>
        )}

        {/* APR DeFi */}
        {isDeFi && aprPct != null && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">APR</span>
            <span className="heatmap-tooltip-val" style={{ color: '#14b8a6' }}>
              <Zap size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              {aprPct}%
            </span>
          </div>
        )}

        {/* Extra: TP, órdenes */}
        {asset.extra && (
          <div className="heatmap-tooltip-row">
            <span className="heatmap-tooltip-label">Info</span>
            <span className="heatmap-tooltip-val" style={{ color: '#facc15' }}>
              {asset.extra}
            </span>
          </div>
        )}
      </div>

      {/* Footer: rol */}
      {roleMeta && (
        <div
          className="heatmap-tooltip-footer"
          style={{ borderColor: `${roleMeta.color}22` }}
        >
          <roleMeta.Icon size={10} color={roleMeta.color} style={{ marginRight: 5, flexShrink: 0 }} />
          <span className="heatmap-tooltip-role" style={{ color: roleMeta.color }}>
            {roleMeta.label}
          </span>
          {asset.strategy && (
            <span className="heatmap-tooltip-action" style={{
              color: asset.strategy.accumulate ? '#10b981'
                   : asset.strategy.reduce     ? '#f43f5e'
                   : asset.strategy.useForTrading ? '#a855f7'
                   : '#94a3b8',
            }}>
              {asset.strategy.accumulate  ? 'ACUMULAR'
               : asset.strategy.reduce   ? 'REDUCIR'
               : asset.strategy.useForTrading ? 'TRADING'
               : 'MANTENER'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── HEAT TILE (fila principal) ──────────────────────────────
function HeatTile({ asset, flex, bobRate }) {
  const [hover, setHover] = useState(false);
  const pnlPct    = asset.pnlPct ?? null;
  const bg        = tileBg(pnlPct);
  const pctLabel  = fmtPct(pnlPct);
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
          : '0 0 0 0px transparent',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {asset.pct != null && (
        <span className="tile-weight">{asset.pct.toFixed(1)}%</span>
      )}

      <Icon size={20} color={color} strokeWidth={2} className="tile-icon" />
      <span className="tile-ticker">{ticker}</span>

      {asset.pct > 8 && asset.valueUSD != null && (
        <span className="tile-value">{fmt(asset.valueUSD, 0)}</span>
      )}

      {isDeFi && aprPct != null && (
        <span className="tile-apr">
          <Zap size={9} style={{ marginRight: 2, verticalAlign: 'middle' }} />
          {aprPct}% APR
        </span>
      )}

      {pctLabel
        ? <span className="tile-change" style={{ color: pnlPct >= 0 ? '#34d399' : '#fb7185' }}>{pctLabel}</span>
        : <span className="tile-no-data">—</span>
      }

      {hover && <HeatTooltip asset={asset} bobRate={bobRate} />}
    </div>
  );
}

// ─── MINI TILE (grupos secundarios) ─────────────────────────
function MiniTile({ asset, bobRate }) {
  const [hover, setHover] = useState(false);
  const pnlPct   = asset.pnlPct ?? null;
  const pctLabel = fmtPct(pnlPct);
  const ticker   = asset.symbol || asset.name?.slice(0, 4).toUpperCase() || '?';

  return (
    <div
      className="heatmap-mini-tile"
      style={{ background: tileBg(pnlPct) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="mini-ticker">{ticker}</span>
      {pctLabel
        ? <span className="mini-change" style={{ color: pnlPct >= 0 ? '#34d399' : '#fb7185' }}>{pctLabel}</span>
        : <span className="mini-nodata">—</span>
      }
      {hover && <HeatTooltip asset={asset} bobRate={bobRate} />}
    </div>
  );
}

// ─── ROLE GROUP (fila secundaria) ───────────────────────────
function RoleGroup({ role, assets, flex, bobRate }) {
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

      <div className="heatmap-role-group__tiles">
        {assets.map(a => (
          <MiniTile key={a.id || a.name} asset={a} bobRate={bobRate} />
        ))}
      </div>
    </div>
  );
}

// ─── ROLE LEGEND ────────────────────────────────────────────
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

// ─── EXPORT ──────────────────────────────────────────────────
// En Portfolio.jsx usar:
//   <MarketHeatmap assets={v3?.assets ?? allAssets} bobRate={bobRate} />
export default function MarketHeatmap({ assets, bobRate }) {
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

  const MAIN_COUNT = Math.min(5, sorted.length);
  const mainTiles  = sorted.slice(0, MAIN_COUNT);
  const secAssets  = sorted.slice(MAIN_COUNT);

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
      role:     r,
      assets:   grouped[r],
      totalPct: grouped[r].reduce((s, a) => s + (a.pct ?? 0), 0),
    }));

  const up     = investible.filter(a => a.pnlPct != null && a.pnlPct >= 0).length;
  const down   = investible.filter(a => a.pnlPct != null && a.pnlPct <  0).length;
  const noData = investible.filter(a => a.pnlPct == null).length;

  const presentRoles = [...new Set(sorted.map(a => a.classification?.role).filter(Boolean))]
    .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <span className="heatmap-title">Mapa de calor · Invertible</span>
        <div className="heatmap-legend">
          {down   > 0 && <span className="legend-item red">▼ {down}</span>}
          {noData > 0 && <span className="legend-item neutral">― {noData}</span>}
          {up     > 0 && <span className="legend-item green">▲ {up}</span>}
        </div>
      </div>

      <div className="heatmap-grid">
        <div className="heatmap-row-main">
          {mainTiles.map(a => (
            <HeatTile key={a.id || a.name} asset={a} flex={a.pct} bobRate={bobRate} />
          ))}
        </div>

        {groupEntries.length > 0 && (
          <div className="heatmap-row-secondary">
            {groupEntries.map(g => (
              <RoleGroup
                key={g.role}
                role={g.role}
                assets={g.assets}
                flex={g.totalPct}
                bobRate={bobRate}
              />
            ))}
          </div>
        )}
      </div>

      <RoleLegend roles={presentRoles} />
    </div>
  );
}