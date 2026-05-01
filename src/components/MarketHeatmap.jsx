// src/components/MarketHeatmap.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Bitcoin, TrendingUp, BarChart2, Landmark, Layers, 
  RefreshCw, ShieldCheck, Zap, Dices, Droplets, 
  Building2, Briefcase, DollarSign, Cpu, HeartPulse, 
  Lock, Shield, CreditCard, Flame, Sun, ShoppingBag, 
  ShoppingCart, Droplet, Signal, Globe2, Gem, Box, Smartphone
} from 'lucide-react';
import './MarketHeatmap.css';

/* ─── utils ─────────────────────────────────────────────── */
const fmt    = (v, d = 0) => v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtPct = v => v == null ? null : (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%';

/* ─── Roles y Sectores ──────────────────────────────────── */
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

/* ─── Iconos ───────────────────────────────────────────── */
const SI_SLUGS = {
  BTC:'bitcoin', ETH:'ethereum', SOL:'solana', BNB:'binance',
  XRP:'xrp', ADA:'cardano', AVAX:'avalanche', DOT:'polkadot',
  MATIC:'polygon', UNI:'uniswap', AAVE:'aave', LINK:'chainlink',
  DOGE:'dogecoin', USDT:'tether', USDC:'usdcoin', DAI:'dai',
  MELI:'mercadolibre',
};

const SI_COLORS = {
  BTC:'#f7931a', ETH:'#627eea', SOL:'#9945ff', BNB:'#f3ba2f',
  XRP:'#346aa9', ADA:'#0033ad', AVAX:'#e84142', DOT:'#e6007a',
  MATIC:'#8247e5', UNI:'#ff007a', AAVE:'#b6509e', LINK:'#2a5ada',
  DOGE:'#c2a633', USDT:'#26a17b', USDC:'#2775ca', DAI:'#f5ac37',
  MELI:'#FFE600',
};

function AssetIcon({ asset, size = 16 }) {
  const sym  = (asset.symbol || '').toUpperCase().split('/')[0];
  const slug = SI_SLUGS[sym];
  const col  = SI_COLORS[sym];
  const [err, setErr] = useState(false);
  const { Icon, color } = resolveIconLucide(asset);
  if (slug && !err) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(col||'ffffff').replace('#','')}`}
        alt={sym} width={size} height={size}
        style={{ borderRadius: 3, flexShrink: 0, display: 'block', objectFit: 'contain' }}
        onError={() => setErr(true)}
      />
    );
  }
  return <Icon size={size} color={color} strokeWidth={2} style={{ flexShrink: 0 }} />;
}

const SYMBOL_LUCIDE = {
  VOO:{Icon:BarChart2,color:'#10b981'}, SPY:{Icon:BarChart2,color:'#10b981'},
  IVV:{Icon:BarChart2,color:'#10b981'}, VTI:{Icon:BarChart2,color:'#34d399'},
  QQQM:{Icon:Cpu,color:'#60a5fa'}, QQQ:{Icon:Cpu,color:'#60a5fa'},
  NVDA:{Icon:Cpu,color:'#76c442'}, TSLA:{Icon:Zap,color:'#34d399'},
  AAPL:{Icon:Smartphone,color:'#94a3b8'}, MSFT:{Icon:Cpu,color:'#60a5fa'},
  VXUS:{Icon:Globe2,color:'#06b6d4'}, VWO:{Icon:Globe2,color:'#06b6d4'},
  SCHD:{Icon:TrendingUp,color:'#facc15'}, IAU:{Icon:Gem,color:'#eab308'},
  GLD:{Icon:Gem,color:'#eab308'}, BND:{Icon:Lock,color:'#facc15'},
  TIP:{Icon:Shield,color:'#facc15'}, VNQ:{Icon:Building2,color:'#f97316'},
  SGOV:{Icon:DollarSign,color:'#06b6d4'},
  MU:   {Icon:Cpu, color:'#60a5fa'},
  LITE: {Icon:Cpu, color:'#60a5fa'},
  MELI: {Icon:ShoppingBag, color:'#facc15'},
};

const SECTOR_META = {
  diversificado_eeuu:    { Icon: BarChart2,    color: '#10b981', bg: 'rgba(16,185,129,0.18)'   },
  diversificado_global:  { Icon: Globe2,       color: '#06b6d4', bg: 'rgba(6,182,212,0.18)'    },
  emergentes:            { Icon: Globe2,       color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'   },
  tecnologia:            { Icon: Cpu,          color: '#60a5fa', bg: 'rgba(96,165,250,0.18)'   },
  salud:                 { Icon: HeartPulse,   color: '#fb7185', bg: 'rgba(251,113,133,0.18)'  },
  defensa:               { Icon: Shield,       color: '#64748b', bg: 'rgba(100,116,139,0.18)'  },
  finanzas:              { Icon: Landmark,     color: '#3b82f6', bg: 'rgba(59,130,246,0.18)'   },
  energia:               { Icon: Droplet,      color: '#f59e0b', bg: 'rgba(245,158,11,0.18)'   },
  energia_renovable:     { Icon: Sun,          color: '#84cc16', bg: 'rgba(132,204,22,0.18)'   },
  consumo_basico:        { Icon: ShoppingCart, color: '#14b8a6', bg: 'rgba(20,184,166,0.18)'   },
  consumo_discrecional:  { Icon: ShoppingBag,  color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)'   },
  materiales:            { Icon: Box,          color: '#d946ef', bg: 'rgba(217,70,239,0.18)'   },
  telecomunicaciones:    { Icon: Signal,       color: '#3b82f6', bg: 'rgba(59,130,246,0.18)'   },
  inmobiliario_cotizado: { Icon: Building2,    color: '#f97316', bg: 'rgba(249,115,22,0.18)'   },
  metales_preciosos:     { Icon: Gem,          color: '#eab308', bg: 'rgba(234,179,8,0.18)'    },
  bonos_gobierno:        { Icon: Lock,         color: '#facc15', bg: 'rgba(250,204,21,0.12)'   },
  bonos_inflacion:       { Icon: Shield,       color: '#facc15', bg: 'rgba(250,204,21,0.12)'   },
  efectivo_global:       { Icon: DollarSign,   color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'    },
  crypto_l1:             { Icon: Layers,       color: '#a855f7', bg: 'rgba(168,85,247,0.18)'   },
  crypto_l2:             { Icon: Layers,       color: '#d946ef', bg: 'rgba(217,70,239,0.18)'   },
  crypto_defi:           { Icon: Zap,          color: '#14b8a6', bg: 'rgba(20,184,166,0.18)'   },
  crypto_pagos:          { Icon: CreditCard,   color: '#3b82f6', bg: 'rgba(59,130,246,0.18)'   },
  crypto_meme:           { Icon: Flame,        color: '#f43f5e', bg: 'rgba(244,63,94,0.18)'    },
  crypto_stablecoin:     { Icon: DollarSign,   color: '#22d3ee', bg: 'rgba(34,211,238,0.18)'   },
};

const TYPE_LUCIDE = {
  crypto:{Icon:Bitcoin,color:'#f97316'}, stable:{Icon:DollarSign,color:'#22d3ee'},
  etf:{Icon:BarChart2,color:'#10b981'}, stock:{Icon:Building2,color:'#60a5fa'},
  manual:{Icon:Briefcase,color:'#94a3b8'},
};

function resolveIconLucide(asset) {
  const sym    = (asset.symbol||'').toUpperCase().split('/')[0];
  const sector = asset.classification?.sector;
  const role   = asset.classification?.role;
  const type   = asset.type;
  if (SYMBOL_LUCIDE[sym])            return SYMBOL_LUCIDE[sym];
  if (sector && SECTOR_META[sector]) return { Icon: SECTOR_META[sector].Icon, color: SECTOR_META[sector].color };
  if (role && ROLE_META[role])       return { Icon: ROLE_META[role].Icon, color: ROLE_META[role].color };
  if (type && TYPE_LUCIDE[type])     return TYPE_LUCIDE[type];
  return { Icon: Briefcase, color: '#64748b' };
}

function tileBg(p, asset) {
  if (p != null) {
    if (p >= 5)  return 'rgba(5,150,105,0.82)';
    if (p >= 2)  return 'rgba(16,185,129,0.60)';
    if (p >= 0)  return 'rgba(16,185,129,0.32)';
    if (p >= -2) return 'rgba(244,63,94,0.32)';
    if (p >= -5) return 'rgba(244,63,94,0.58)';
    return 'rgba(225,29,72,0.80)';
  }
  const sector = asset?.classification?.sector;
  if (sector && SECTOR_META[sector]) return SECTOR_META[sector].bg;
  const role = asset?.classification?.role;
  if (role === 'trading')     return 'rgba(168,85,247,0.15)';
  if (role === 'speculative') return 'rgba(244,63,94,0.15)';
  return 'rgba(30,41,59,0.70)';
}

/* ─── Portal Tooltip ─────────────────────────────────────── */
function TooltipPortal({ asset, anchorRect, pct, pctLabel }) {
  const [pos, setPos] = useState(null);
  const ttRef = useRef(null);
  useEffect(() => {
    if (!anchorRect || !ttRef.current) return;
    const tt  = ttRef.current.getBoundingClientRect();
    const GAP = 10;
    const vw  = window.innerWidth;
    let top  = anchorRect.top - tt.height - GAP;
    if (top < 8) top = anchorRect.bottom + GAP;
    let left = anchorRect.left + anchorRect.width / 2 - tt.width / 2;
    left = Math.max(8, Math.min(left, vw - tt.width - 8));
    setPos({ top, left });
  }, [anchorRect]);

  const role     = asset.classification?.role;
  const roleMeta = role ? ROLE_META[role] : null;
  const sector   = asset.classification?.sector;
  const isDeFi   = asset.classification?.isDeFi;
  const aprPct   = asset.classification?.aprPct;
  const { color } = resolveIconLucide(asset);
  const style = pos
    ? { top: pos.top, left: pos.left, opacity: 1 }
    : { top: -9999, left: -9999, opacity: 0 };

  return ReactDOM.createPortal(
    <div ref={ttRef} className="hm-tooltip" style={style}>
      <div className="hm-tooltip__head">
        <div className="hm-tooltip__icon-wrap"
          style={{ background: `${color}1a`, border: `1px solid ${color}40` }}>
          <AssetIcon asset={asset} size={16} />
        </div>
        <div>
          <div className="hm-tooltip__name">{asset.name}</div>
          {asset.symbol && asset.symbol !== asset.name && (
            <div className="hm-tooltip__symbol">{asset.symbol}</div>
          )}
        </div>
      </div>
      <div className="hm-tooltip__div" />
      <div className="hm-tooltip__rows">
        <div className="hm-tooltip__row">
          <span className="hm-tooltip__lbl">Valor</span>
          <span className="hm-tooltip__val">{fmt(asset.valueUSD, 0)}</span>
        </div>
        {asset.weightPct != null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Peso global</span>
            <span className="hm-tooltip__val">{asset.weightPct.toFixed(1)}%</span>
          </div>
        )}
        {pctLabel && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">PnL</span>
            <span className={`hm-tooltip__pnl ${pct >= 0 ? 'up' : 'down'}`}>{pctLabel}</span>
          </div>
        )}
        {isDeFi && aprPct != null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">APR</span>
            <span className="hm-tooltip__val" style={{ color: '#14b8a6' }}>
              <Zap size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              {aprPct}%
            </span>
          </div>
        )}
      </div>
      {(roleMeta || sector) && (
        <div className="hm-tooltip__footer" style={{ borderColor: roleMeta ? `${roleMeta.color}22` : 'rgba(255,255,255,0.1)' }}>
          {roleMeta && (
            <>
              <roleMeta.Icon size={10} color={roleMeta.color} style={{ marginRight: 5, flexShrink: 0 }} />
              <span className="hm-tooltip__role" style={{ color: roleMeta.color }}>{roleMeta.label}</span>
            </>
          )}
          {roleMeta && sector && <span style={{ opacity: 0.3, margin: '0 4px' }}>|</span>}
          {sector && (
            <span className="hm-tooltip__sector" style={{ opacity: 0.7, fontSize: '0.55rem', textTransform: 'uppercase' }}>
              {sector.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

/* ─── Tile ───────────────────────────────────────────────── */
function HeatTile({ asset, roleColor, isSmallBlock }) {
  const [hover, setHover]       = useState(false);
  const [anchorRect, setAnchor] = useState(null);
  const tileRef                 = useRef(null);
  
  const onEnter = useCallback(() => {
    if (tileRef.current) setAnchor(tileRef.current.getBoundingClientRect());
    setHover(true);
  }, []);
  const onLeave = useCallback(() => { setHover(false); setAnchor(null); }, []);

  const pct      = asset.pnlPct ?? null;
  const bg       = tileBg(pct, asset);
  const pctLabel = fmtPct(pct);
  const ticker   = (asset.symbol || '').split('/')[0] || asset.name?.slice(0, 5).toUpperCase() || '?';
  const isMini   = isSmallBlock || asset.valueUSD < 500;

  return (
    <div
      ref={tileRef}
      className={`hm-tile ${isMini ? 'hm-tile--mini' : ''}`}
      style={{
        flex: `${asset.valueUSD} 1 auto`,
        background: bg,
        border: `1px solid rgba(255,255,255,0.06)`,
        boxShadow: hover ? `inset 0 0 0 1px rgba(255,255,255,0.3), 0 0 12px ${roleColor}40` : 'none',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {!isMini && asset.weightPct != null && (
        <span className="hm-tile__weight">{asset.weightPct.toFixed(1)}%</span>
      )}
      <div className="hm-tile__inner">
        <div className="hm-tile__icon-wrap">
          <AssetIcon asset={asset} size={isMini ? 12 : 17} />
        </div>
        <span className="hm-tile__ticker">{ticker}</span>
        {pctLabel && (
          <span className="hm-tile__change" style={{ color: pct >= 0 ? '#34d399' : '#fb7185' }}>
            {pctLabel}
          </span>
        )}
      </div>
      {hover && anchorRect && (
        <TooltipPortal asset={asset} anchorRect={anchorRect} pct={pct} pctLabel={pctLabel} />
      )}
    </div>
  );
}

/* ─── Role Block ─────────────────────────────────────────── */
function RoleBlock({ role, assets, roleTotalVal, totalGlobalVal }) {
  const meta = ROLE_META[role] ?? { color: '#64748b', Icon: Briefcase, label: role };
  const roleGlobalPct = totalGlobalVal > 0 ? (roleTotalVal / totalGlobalVal) * 100 : 0;

  // FIX: tiles ordenados de mayor a menor valor dentro del bloque
  const sorted = [...assets].sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));
  const isSmallBlock = roleGlobalPct < 12;

  return (
    <div
      className="hm-group"
      style={{
        flex: `${roleGlobalPct} 0 0`,
        '--role-color': meta.color,
        border: `2px solid ${meta.color}88`,
        boxShadow: `0 4px 20px -2px ${meta.color}15`,
      }}
    >
      <div className="hm-group__head" style={{ background: `${meta.color}1a`, borderBottom: `1px solid ${meta.color}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <meta.Icon size={12} strokeWidth={2.5} color={meta.color} />
          <span className="hm-group__title" style={{ color: meta.color }}>{meta.label.toUpperCase().slice(0, 7)}</span>
        </div>
        <span className="hm-group__pct" style={{ color: meta.color, opacity: 0.8 }}>{roleGlobalPct.toFixed(1)}%</span>
      </div>
      <div className="hm-group__content">
        {sorted.map(a => (
          <HeatTile
            key={a.id || a.name}
            asset={a}
            roleColor={meta.color}
            isSmallBlock={isSmallBlock}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function MarketHeatmap({ assets }) {
  const investible = (assets || []).filter(a => {
    const r = a.classification?.role ?? a.role;
    return r !== 'reserve' && r !== 'patrimony' && !a.locked && (a.valueUSD || 0) > 1;
  });
  if (!investible.length) return null;

  const totalVal = investible.reduce((s, a) => s + (a.valueUSD || 0), 0);
  if (!totalVal) return null;

  const enriched = investible.map(a => ({
    ...a,
    weightPct: (a.valueUSD / totalVal) * 100,
  }));

  // Agrupar por rol
  const byRole = {};
  enriched.forEach(a => {
    const role = a.classification?.role || 'liquidity';
    if (!byRole[role]) byRole[role] = { assets: [], total: 0 };
    byRole[role].assets.push(a);
    byRole[role].total += (a.valueUSD || 0);
  });

  // FIX: roles ordenados de mayor a menor peso ANTES de distribuir en filas
  const sortedRoles = Object.entries(byRole)
    .sort((a, b) => b[1].total - a[1].total)   // ← descendente por valor
    .map(([key, data]) => ({ key, ...data }));

  // Bin packing en 3 filas equilibradas
  const rows = [
    { total: 0, roles: [] },
    { total: 0, roles: [] },
    { total: 0, roles: [] },
  ];

  for (const r of sortedRoles) {
    const targetRow = rows.reduce((min, row) => row.total < min.total ? row : min, rows[0]);
    targetRow.roles.push(r);
    targetRow.total += r.total;
  }

  // FIX: dentro de cada fila, ordenar bloques de mayor a menor (izquierda → derecha)
  rows.forEach(row => {
    row.roles.sort((a, b) => b.total - a.total);
  });

  // Filas de mayor peso arriba
  rows.sort((a, b) => b.total - a.total);

  const up     = investible.filter(a => (a.pnlPct ?? 0) >= 0).length;
  const down   = investible.filter(a => (a.pnlPct ?? 0) <  0).length;
  const noData = investible.filter(a =>  a.pnlPct == null).length;

  return (
    <div className="hm-container">
      <div className="hm-header">
        <span className="hm-title">Mapa de calor · Portafolio</span>
        <div className="hm-counts">
          {down   > 0 && <span className="hm-count red">▼ {down}</span>}
          {noData > 0 && <span className="hm-count neutral">― {noData}</span>}
          {up     > 0 && <span className="hm-count green">▲ {up}</span>}
        </div>
      </div>

      <div className="hm-grid">
        {rows.map((row, idx) => {
          if (row.total === 0) return null;
          return (
            <div
              key={idx}
              className="hm-row"
              style={{ flex: `${row.total} 0 0` }}
            >
              {row.roles.map(r => (
                <RoleBlock
                  key={r.key}
                  role={r.key}
                  assets={r.assets}
                  roleTotalVal={r.total}
                  totalGlobalVal={totalVal}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}