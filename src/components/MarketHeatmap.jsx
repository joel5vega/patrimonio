// src/components/MarketHeatmap.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Bitcoin, CircleDollarSign, TrendingUp, BarChart2,
  Landmark, Layers, RefreshCw, ShieldCheck, Zap,
  Dices, Droplets, Building2, Briefcase, DollarSign,
  // sector icons
  Cpu, HeartPulse, Pill, Dna, Activity,
  Shield, Plane, CreditCard, Flame, Sun,
  Coffee, ShoppingBag, ShoppingCart, Utensils,
  Wrench, Mountain, Signal, Globe2, Gem, Lock,
  Smartphone, Car, Tv2, Tractor,
} from 'lucide-react';
import './MarketHeatmap.css';

/* ─── utils ─────────────────────────────────────────────── */
const fmt    = (v, d = 0) => v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtPct = v => v == null ? null : (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%';

/* ─── Roles ─────────────────────────────────────────────── */
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

// Roles que siempre muestran sus tiles rotados 90° (muchos activos pequeños)
const ALWAYS_ROTATED_ROLES = new Set(['trading', 'speculative']);

/* ─── Iconos reales (Simple Icons CDN) ─────────────────── */
const SI_SLUGS = {
  BTC:'bitcoin', ETH:'ethereum', SOL:'solana', BNB:'binance',
  XRP:'xrp', ADA:'cardano', AVAX:'avalanche', DOT:'polkadot',
  MATIC:'polygon', UNI:'uniswap', AAVE:'aave', LINK:'chainlink',
  DOGE:'dogecoin', USDT:'tether', USDC:'usdcoin', DAI:'dai',XRP:'xrp/usd',
};
const SI_COLORS = {
  BTC:'#f7931a', ETH:'#627eea', SOL:'#9945ff', BNB:'#f3ba2f',
  XRP:'#346aa9', ADA:'#0033ad', AVAX:'#e84142', DOT:'#e6007a',
  MATIC:'#8247e5', UNI:'#ff007a', AAVE:'#b6509e', LINK:'#2a5ada',
  DOGE:'#c2a633', USDT:'#26a17b', USDC:'#2775ca', DAI:'#f5ac37',
};

function AssetIcon({ asset, size = 16 }) {
  const sym  = (asset.symbol || '').toUpperCase();
  const slug = SI_SLUGS[sym];
  const col  = SI_COLORS[sym];
  const [err, setErr] = useState(false);
  const { Icon, color } = resolveIconLucide(asset);
  if (slug && !err) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(col||'ffffff').replace('#','')}`}
        alt={sym} width={size} height={size}
        style={{ borderRadius: 3, flexShrink: 0, display: 'block' }}
        onError={() => setErr(true)}
      />
    );
  }
  return <Icon size={size} color={color} strokeWidth={2} style={{ flexShrink: 0 }} />;
}

/* ─── Lucide fallback ───────────────────────────────────── */
const SYMBOL_LUCIDE = {
  // ETFs diversificados
  VOO:{Icon:BarChart2,color:'#10b981'}, SPY:{Icon:BarChart2,color:'#10b981'},
  IVV:{Icon:BarChart2,color:'#10b981'}, VTI:{Icon:BarChart2,color:'#34d399'},
  // Tecnología
  QQQM:{Icon:Cpu,color:'#60a5fa'}, QQQ:{Icon:Cpu,color:'#60a5fa'},
  NVDA:{Icon:Cpu,color:'#76c442'}, TSLA:{Icon:Zap,color:'#34d399'},
  AAPL:{Icon:Smartphone,color:'#94a3b8'}, MSFT:{Icon:Cpu,color:'#60a5fa'},
  GOOGL:{Icon:Cpu,color:'#ea4335'}, GOOG:{Icon:Cpu,color:'#ea4335'},
  META:{Icon:Cpu,color:'#1877f2'}, AMZN:{Icon:ShoppingCart,color:'#ff9900'},
  AMD:{Icon:Cpu,color:'#ed1c24'}, INTC:{Icon:Cpu,color:'#0071c5'},
  NFLX:{Icon:Tv2,color:'#e50914'}, UBER:{Icon:Car,color:'#94a3b8'},
  PLTR:{Icon:Cpu,color:'#a855f7'}, SNOW:{Icon:Cpu,color:'#29b5e8'},
  CRM:{Icon:Cpu,color:'#00a1e0'}, ORCL:{Icon:Cpu,color:'#f80000'},
  ADBE:{Icon:Cpu,color:'#ff0000'}, PYPL:{Icon:Cpu,color:'#003087'},
  // Salud
  JNJ:{Icon:HeartPulse,color:'#d4163c'}, UNH:{Icon:HeartPulse,color:'#006db0'},
  PFE:{Icon:Pill,color:'#0093d0'}, ABBV:{Icon:Pill,color:'#071d49'},
  MRK:{Icon:Pill,color:'#009999'}, MRNA:{Icon:Dna,color:'#0f2a57'},
  BNTX:{Icon:Dna,color:'#2b2b73'}, ISRG:{Icon:HeartPulse,color:'#0077c8'},
  ABT:{Icon:Activity,color:'#e31837'},
  // Defensa
  LMT:{Icon:Shield,color:'#1a3a5c'}, RTX:{Icon:Shield,color:'#0e3d8b'},
  NOC:{Icon:Shield,color:'#21314d'}, GD:{Icon:Shield,color:'#003168'},
  BA:{Icon:Plane,color:'#1d428a'}, KTOS:{Icon:Shield,color:'#4a90d9'},
  // Finanzas
  JPM:{Icon:Landmark,color:'#1a478c'}, BAC:{Icon:Landmark,color:'#e31837'},
  GS:{Icon:Landmark,color:'#7399c6'}, MS:{Icon:Landmark,color:'#003087'},
  V:{Icon:CreditCard,color:'#1a1f71'}, MA:{Icon:CreditCard,color:'#eb001b'},
  COIN:{Icon:Bitcoin,color:'#0052ff'},
  // Energía
  XOM:{Icon:Flame,color:'#d22630'}, CVX:{Icon:Flame,color:'#0046ad'},
  COP:{Icon:Flame,color:'#d6001c'}, NEE:{Icon:Sun,color:'#00afec'},
  ENPH:{Icon:Sun,color:'#ff6600'},
  // Consumo básico
  KO:{Icon:Coffee,color:'#f40009'}, PG:{Icon:ShoppingBag,color:'#003068'},
  PEP:{Icon:Coffee,color:'#004b93'}, WMT:{Icon:ShoppingCart,color:'#0071ce'},
  COST:{Icon:ShoppingCart,color:'#005dab'}, MCD:{Icon:Utensils,color:'#da291c'},
  SBUX:{Icon:Coffee,color:'#00704a'}, NKE:{Icon:ShoppingBag,color:'#f05924'},
  DIS:{Icon:Tv2,color:'#006e99'}, LULU:{Icon:ShoppingBag,color:'#94a3b8'},
  // Materiales / industria
  CAT:{Icon:Wrench,color:'#ffcd11'}, DE:{Icon:Tractor,color:'#367c2b'},
  FCX:{Icon:Mountain,color:'#f26522'}, GDX:{Icon:Mountain,color:'#c9a949'},
  // Telecom
  VZ:{Icon:Signal,color:'#cd040b'}, T:{Icon:Signal,color:'#00a8e0'},
  // ETFs internacionales
  VXUS:{Icon:Globe2,color:'#06b6d4'}, VWO:{Icon:Globe2,color:'#06b6d4'},
  EMXC:{Icon:Globe2,color:'#06b6d4'},
  SCHD:{Icon:TrendingUp,color:'#facc15'},
  // Metales
  IAU:{Icon:Gem,color:'#eab308'}, GLD:{Icon:Gem,color:'#eab308'},
  SLV:{Icon:Gem,color:'#94a3b8'},
  // Renta fija
  BND:{Icon:Lock,color:'#facc15'}, TIP:{Icon:Shield,color:'#facc15'},
  AGG:{Icon:Lock,color:'#facc15'},
  VNQ:{Icon:Building2,color:'#f97316'},
  SGOV:{Icon:DollarSign,color:'#06b6d4'},
};

/* ─── Sector → icono + color de fondo cuando no hay PnL ───── */
const SECTOR_META = {
  tecnologia:            { Icon: Cpu,          color: '#60a5fa', bg: 'rgba(96,165,250,0.18)'   },
  salud:                 { Icon: HeartPulse,   color: '#f43f5e', bg: 'rgba(244,63,94,0.18)'    },
  defensa:               { Icon: Shield,       color: '#94a3b8', bg: 'rgba(148,163,184,0.18)'  },
  consumo_basico:        { Icon: ShoppingBag,  color: '#a3e635', bg: 'rgba(163,230,53,0.12)'   },
  consumo_discrecional:  { Icon: ShoppingCart, color: '#f97316', bg: 'rgba(249,115,22,0.15)'   },
  finanzas:              { Icon: Landmark,     color: '#3b82f6', bg: 'rgba(59,130,246,0.18)'   },
  energia:               { Icon: Flame,        color: '#fb923c', bg: 'rgba(251,146,60,0.18)'   },
  energia_renovable:     { Icon: Sun,          color: '#facc15', bg: 'rgba(250,204,21,0.15)'   },
  materiales:            { Icon: Wrench,       color: '#b45309', bg: 'rgba(180,83,9,0.20)'     },
  telecomunicaciones:    { Icon: Signal,       color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'    },
  inmobiliario_cotizado: { Icon: Building2,    color: '#f97316', bg: 'rgba(249,115,22,0.15)'   },
  metales_preciosos:     { Icon: Gem,          color: '#eab308', bg: 'rgba(234,179,8,0.18)'    },
  mineria:               { Icon: Mountain,     color: '#78716c', bg: 'rgba(120,113,108,0.18)'  },
  bonos_gobierno:        { Icon: Lock,         color: '#facc15', bg: 'rgba(250,204,21,0.12)'   },
  bonos_inflacion:       { Icon: Shield,       color: '#a3e635', bg: 'rgba(163,230,53,0.12)'   },
  diversificado_eeuu:    { Icon: BarChart2,    color: '#10b981', bg: 'rgba(16,185,129,0.15)'   },
  diversificado_global:  { Icon: Globe2,       color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'    },
  dividendos_value:      { Icon: TrendingUp,   color: '#facc15', bg: 'rgba(250,204,21,0.12)'   },
  emergentes:            { Icon: Globe2,       color: '#f97316', bg: 'rgba(249,115,22,0.15)'   },
  efectivo_global:       { Icon: DollarSign,   color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'    },
  crypto_l1:             { Icon: Layers,       color: '#a855f7', bg: 'rgba(168,85,247,0.18)'   },
  crypto_l2:             { Icon: Layers,       color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)'   },
  crypto_defi:           { Icon: Zap,          color: '#14b8a6', bg: 'rgba(20,184,166,0.18)'   },
  crypto_pagos:          { Icon: CreditCard,   color: '#38bdf8', bg: 'rgba(56,189,248,0.18)'   },
  crypto_stablecoin:     { Icon: DollarSign,   color: '#22d3ee', bg: 'rgba(34,211,238,0.12)'   },
  crypto_meme:           { Icon: Dices,        color: '#f43f5e', bg: 'rgba(244,63,94,0.15)'    },
};

const TYPE_LUCIDE = {
  crypto:{Icon:Bitcoin,color:'#f97316'}, stable:{Icon:DollarSign,color:'#22d3ee'},
  etf:{Icon:BarChart2,color:'#10b981'}, stock:{Icon:Building2,color:'#60a5fa'},
  manual:{Icon:Briefcase,color:'#94a3b8'},
};

/* Prioridad: símbolo concreto → sector → rol → tipo → fallback */
function resolveIconLucide(asset) {
  const sym    = (asset.symbol||'').toUpperCase();
  const sector = asset.classification?.sector;
  const role   = asset.classification?.role;
  const type   = asset.type;
  if (SYMBOL_LUCIDE[sym])            return SYMBOL_LUCIDE[sym];
  if (sector && SECTOR_META[sector]) return { Icon: SECTOR_META[sector].Icon, color: SECTOR_META[sector].color };
  if (role && ROLE_META[role])       return { Icon: ROLE_META[role].Icon, color: ROLE_META[role].color };
  if (type && TYPE_LUCIDE[type])     return TYPE_LUCIDE[type];
  return { Icon: Briefcase, color: '#64748b' };
}

/* ─── Color de fondo del tile ────────────────────────────── */
function tileBg(p, asset) {
  // Con PnL: escala verde/rojo
  if (p != null) {
    if (p >= 5)  return 'rgba(5,150,105,0.82)';
    if (p >= 2)  return 'rgba(16,185,129,0.60)';
    if (p >= 0)  return 'rgba(16,185,129,0.32)';
    if (p >= -2) return 'rgba(244,63,94,0.32)';
    if (p >= -5) return 'rgba(244,63,94,0.58)';
    return 'rgba(225,29,72,0.80)';
  }
  // Sin PnL: color del sector
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
            <span className="hm-tooltip__lbl">Peso</span>
            <span className="hm-tooltip__val">{asset.weightPct.toFixed(1)}%</span>
          </div>
        )}
        {pctLabel && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">PnL</span>
            <span className={`hm-tooltip__pnl ${pct >= 0 ? 'up' : 'down'}`}>{pctLabel}</span>
          </div>
        )}
        {asset.price != null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Precio</span>
            <span className="hm-tooltip__val">{fmt(asset.price, 2)}</span>
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
      {roleMeta && (
        <div className="hm-tooltip__footer" style={{ borderColor: `${roleMeta.color}22` }}>
          <roleMeta.Icon size={10} color={roleMeta.color} style={{ marginRight: 5, flexShrink: 0 }} />
          <span className="hm-tooltip__role" style={{ color: roleMeta.color }}>{roleMeta.label}</span>
          {asset.strategy?.reduce && (
            <span className="hm-tooltip__action">↓ Reducir</span>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

/* ─── Tile ───────────────────────────────────────────────── */
function HeatTile({ asset, sizePct, forceRotate }) {
  const [hover, setHover]       = useState(false);
  const [anchorRect, setAnchor] = useState(null);
  const tileRef                 = useRef(null);
  const onEnter = useCallback(() => {
    if (tileRef.current) setAnchor(tileRef.current.getBoundingClientRect());
    setHover(true);
  }, []);
  const onLeave = useCallback(() => { setHover(false); setAnchor(null); }, []);

  const pct       = asset.pnlPct ?? null;
  const bg        = tileBg(pct, asset);
  const pctLabel  = fmtPct(pct);
  const ticker = (asset.symbol || '').split('/')[0] || asset.name?.slice(0, 5).toUpperCase() || '?';
  const role      = asset.classification?.role;
  const roleColor = ROLE_META[role]?.color ?? '#334155';
  const rotated   = forceRotate || sizePct < 5;
  const mini      = !rotated && sizePct < 9;

  return (
    <div
      ref={tileRef}
      className={[
        'hm-tile',
        rotated ? 'hm-tile--rot' : '',
        mini    ? 'hm-tile--mini' : '',
      ].filter(Boolean).join(' ')}
      style={{
        width:      `calc(${sizePct}% - 2px)`,
        background: bg,
        border:     `2px solid ${roleColor}55`,
        boxShadow:  hover ? `inset 0 0 0 1px ${roleColor}88, 0 0 10px ${roleColor}22` : 'none',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Peso del portfolio (solo tiles normales grandes) */}
      {!rotated && !mini && asset.weightPct != null && (
        <span className="hm-tile__weight">{asset.weightPct.toFixed(1)}%</span>
      )}

      {rotated ? (
        /* ── Contenido rotado 90° ── */
        <div className="hm-tile__rot-inner">
          <AssetIcon asset={asset} size={11} />
          <span className="hm-tile__rot-ticker">{ticker}</span>
          {pctLabel && (
            <span className="hm-tile__rot-change"
              style={{ color: pct >= 0 ? '#34d399' : '#fb7185' }}>
              {pctLabel}
            </span>
          )}
        </div>
      ) : (
        /* ── Contenido normal ── */
        <>
          <div className="hm-tile__icon-wrap">
            <AssetIcon asset={asset} size={mini ? 13 : 17} />
          </div>
          <span className="hm-tile__ticker">{ticker}</span>
          {pctLabel && (
            <span className="hm-tile__change"
              style={{ color: pct >= 0 ? '#34d399' : '#fb7185' }}>
              {pctLabel}
            </span>
          )}
        </>
      )}

      {hover && anchorRect && (
        <TooltipPortal asset={asset} anchorRect={anchorRect} pct={pct} pctLabel={pctLabel} />
      )}
    </div>
  );
}

/* ─── Banda ──────────────────────────────────────────────── */
function RoleBand({ role, assets, totalVal, isSmall }) {
  const meta     = ROLE_META[role] ?? { color: '#64748b', Icon: Briefcase, label: role };
  const bandVal  = assets.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const bandPct  = totalVal > 0 ? (bandVal / totalVal) * 100 : 0;
  // Ordenar de mayor a menor dentro de la banda
  const sorted   = [...assets].sort((a, b) => (b.valueUSD||0) - (a.valueUSD||0));
  const forceRot = ALWAYS_ROTATED_ROLES.has(role);

  return (
    <div
      className={`hm-band${isSmall ? ' hm-band--sm' : ''}`}
      style={{
        flex:           `${bandPct} 0 0`,
        '--band-color': meta.color,
        borderColor:    `${meta.color}33`,
        minWidth:       `${Math.max(sorted.length * (forceRot ? 28 : 42), 55)}px`,
      }}
    >
      <div className="hm-band__head">
        <meta.Icon size={9} strokeWidth={2.5} color={meta.color} style={{ flexShrink: 0 }} />
        <span className="hm-band__label">{meta.label}</span>
        <span className="hm-band__pct">{bandPct.toFixed(1)}%</span>
      </div>
     <div className={`hm-band__tiles${forceRot ? ' hm-band__tiles--rot' : ''}`}>
  {sorted.map((a, i) => {
    // Distribuye en 2 filas: mitad arriba, mitad abajo
    const half    = Math.ceil(sorted.length / 2);
    const row1    = sorted.slice(0, half);
    const row2    = sorted.slice(half);
    const sizePct = bandVal > 0 ? (a.valueUSD / bandVal) * 100 : 100 / sorted.length;
    return null; // reemplazado por las 2 filas abajo
  })}
  {/* Renderizar 2 sub-filas cuando está rotado */}
  {forceRot ? (() => {
    const half = Math.ceil(sorted.length / 2);
    const rows = [sorted.slice(0, half), sorted.slice(half)];
    return rows.map((row, ri) => (
      <div key={ri} className="hm-band__tiles-row">
        {row.map(a => {
          const sizePct = bandVal > 0 ? (a.valueUSD / bandVal) * 100 : 100 / sorted.length;
          return (
            <HeatTile key={a.id || a.name} asset={a} sizePct={sizePct} forceRotate={true} />
          );
        })}
      </div>
    ));
  })() : sorted.map(a => {
    const sizePct = bandVal > 0 ? (a.valueUSD / bandVal) * 100 : 100 / sorted.length;
    return (
      <HeatTile key={a.id || a.name} asset={a} sizePct={sizePct} forceRotate={false} />
    );
  })}
</div>
    </div>
  );
}

/* ─── Distribución en 3 filas ────────────────────────────
   Ordena roles por valor DESC, luego bin-packing greedy
   en 3 cubetas. Dentro de cada cubeta los roles también
   quedan ordenados de mayor a menor.
──────────────────────────────────────────────────────── */
function distributeRoles(byRole) {
  const entries = Object.entries(byRole)
    .map(([role, assets]) => ({
      role,
      val: assets.reduce((s, a) => s + (a.valueUSD || 0), 0),
    }))
    .sort((a, b) => b.val - a.val);   // ← orden DESC global

  if (!entries.length) return [[], [], []];

  const buckets = [[], [], []];
  const sums    = [0, 0, 0];

  for (const e of entries) {
    // Asignar al bucket con menor suma acumulada
    const idx = sums.indexOf(Math.min(...sums));
    buckets[idx].push({ role: e.role, val: e.val });
    sums[idx] += e.val;
  }

  // Ordenar DENTRO de cada bucket de mayor a menor
  buckets.forEach(b => b.sort((a, bb) => bb.val - a.val));

  // Ordenar los 3 buckets: el más pesado en fila 0
  buckets.sort((a, bb) => {
    const sa = a.reduce((s, x) => s + x.val, 0);
    const sb = bb.reduce((s, x) => s + x.val, 0);
    return sb - sa;
  });

  return buckets.map(b => b.map(x => x.role));
}

/* ─── Fila ───────────────────────────────────────────────── */
function HeatRow({ roles, byRole, totalVal, rowIdx }) {
  const present = roles.filter(r => byRole[r]);
  if (!present.length) return null;
  const isSmall = rowIdx >= 1;
  return (
    <div className={`hm-row${isSmall ? ' hm-row--sm' : ''}`}>
      {present.map(role => (
        <RoleBand key={role} role={role} assets={byRole[role]} totalVal={totalVal} isSmall={isSmall} />
      ))}
    </div>
  );
}

/* ─── Leyenda ────────────────────────────────────────────── */
function RoleLegend({ roles }) {
  return (
    <div className="hm-legend">
      {roles.map(role => {
        const meta = ROLE_META[role];
        if (!meta) return null;
        return (
          <span key={role} className="hm-legend__chip">
            <span className="hm-legend__dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        );
      })}
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

  const byRole = {};
  enriched.forEach(a => {
    const r = a.classification?.role ?? 'liquidity';
    if (!byRole[r]) byRole[r] = [];
    byRole[r].push(a);
  });

  const [row0, row1, row2] = distributeRoles(byRole);

  // Leyenda: roles ordenados por valor desc
  const allPresent = Object.keys(byRole).sort((a, b) => {
    const va = byRole[a].reduce((s, x) => s + (x.valueUSD||0), 0);
    const vb = byRole[b].reduce((s, x) => s + (x.valueUSD||0), 0);
    return vb - va;
  });

  const up     = investible.filter(a => (a.pnlPct ?? 0) >= 0).length;
  const down   = investible.filter(a => (a.pnlPct ?? 0) <  0).length;
  const noData = investible.filter(a =>  a.pnlPct == null).length;

  return (
    <div className="hm-container">
      <div className="hm-header">
        <span className="hm-title">Mapa de calor · Invertible</span>
        <div className="hm-counts">
          {down   > 0 && <span className="hm-count red">▼ {down}</span>}
          {noData > 0 && <span className="hm-count neutral">― {noData}</span>}
          {up     > 0 && <span className="hm-count green">▲ {up}</span>}
        </div>
      </div>

      <div className="hm-grid">
        <HeatRow roles={row0} byRole={byRole} totalVal={totalVal} rowIdx={0} />
        <HeatRow roles={row1} byRole={byRole} totalVal={totalVal} rowIdx={1} />
        <HeatRow roles={row2} byRole={byRole} totalVal={totalVal} rowIdx={2} />
      </div>

      <RoleLegend roles={allPresent} />
    </div>
  );
}