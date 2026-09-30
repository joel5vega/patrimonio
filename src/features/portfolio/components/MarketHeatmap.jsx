// src/features/portfolio/components/MarketHeatmap.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import ReactDOM from 'react-dom';

import {
  Bitcoin,
  TrendingUp,
  BarChart2,
  Landmark,
  Layers,
  RefreshCw,
  ShieldCheck,
  Zap,
  Dices,
  Droplets,
  Building2,
  Briefcase,
  DollarSign,
  Cpu,
  HeartPulse,
  Lock,
  Shield,
  CreditCard,
  Flame,
  Sun,
  ShoppingBag,
  ShoppingCart,
  Droplet,
  Signal,
  Globe2,
  Gem,
  Box,
  Smartphone,
} from 'lucide-react';

import {
  animate,
  stagger,
} from 'animejs';

import '../styles/MarketHeatmap.css';

// ─── Formatters ─────────────────────────────────────────────

const fmt = (value, digits = 0) => {
  if (value === null || value === undefined) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return `$${number.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`;
};

const fmtPct = (value, digits = 1) => {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return `${number >= 0 ? '+' : ''}${number.toFixed(digits)}%`;
};

function firstFiniteNumber(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

// ─── Getters de assets ──────────────────────────────────────

function getRole(asset = {}) {
  return (
    asset.role ??
    asset.classification?.role ??
    'unclassified'
  );
}

function getSector(asset = {}) {
  return (
    asset.sector ??
    asset.classification?.sector ??
    null
  );
}

function getQuantity(asset = {}) {
  return firstFiniteNumber(
    asset.quantity,
    asset.net_qty,
    asset.netQty,
    asset.sourceMeta?.quantity,
    asset.sourceMeta?.balances?.total,
  );
}

function getEntryPrice(asset = {}) {
  return firstFiniteNumber(
    asset.entryPrice,
    asset.entry_price,
    asset.avgEntryPrice,
    asset.avg_entry_price,
    asset.sourceMeta?.entryPrice,
    asset.sourceMeta?.entry_price,
    asset.sourceMeta?.avgEntryPrice,
    asset.sourceMeta?.avg_entry_price,
  );
}

function getMarketPrice(asset = {}) {
  return firstFiniteNumber(
    asset.marketPrice,
    asset.market_price,
    asset.markPrice,
    asset.mark_price,
    asset.priceUSD,
    asset.price_usd,
    asset.currentPrice,
    asset.current_price,
    asset.sourceMeta?.marketPrice,
    asset.sourceMeta?.market_price,
    asset.sourceMeta?.markPrice,
    asset.sourceMeta?.mark_price,
    asset.sourceMeta?.priceUSD,
    asset.sourceMeta?.price_usd,
  );
}

function getCostBasisUSD(asset = {}) {
  return firstFiniteNumber(
    asset.costBasisUSD,
    asset.cost_basis_usd,
    asset.sourceMeta?.costBasisUSD,
    asset.sourceMeta?.cost_basis_usd,
  );
}

function getMarketValueUSD(asset = {}) {
  return firstFiniteNumber(
    asset.marketValueUSD,
    asset.market_value_usd,
    asset.sourceMeta?.marketValueUSD,
    asset.sourceMeta?.market_value_usd,
    asset.valueUSD,
  );
}

function getUnrealizedPnlUSD(asset = {}) {
  return firstFiniteNumber(
    asset.unrealizedPnlUSD,
    asset.unrealized_pnl_usd,
    asset.pnlUSD,
    asset.pnl_usd,
    asset.sourceMeta?.unrealizedPnlUSD,
    asset.sourceMeta?.unrealized_pnl_usd,
    asset.sourceMeta?.pnlUSD,
    asset.sourceMeta?.pnl_usd,
  );
}

function getUnrealizedPnlPct(asset = {}) {
  return firstFiniteNumber(
    asset.unrealizedPnlPct,
    asset.unrealized_pnl_pct,
    asset.pnlPct,
    asset.pnl_pct,
    asset.sourceMeta?.unrealizedPnlPct,
    asset.sourceMeta?.unrealized_pnl_pct,
    asset.sourceMeta?.pnlPct,
    asset.sourceMeta?.pnl_pct,
  );
}

function getDailyChangePct(asset = {}) {
  return firstFiniteNumber(
    asset.dailyChangePct,
    asset.daily_change_pct,
    asset.changePct,
    asset.change_pct,
    asset.sourceMeta?.dailyChangePct,
    asset.sourceMeta?.daily_change_pct,
    asset.sourceMeta?.changePct,
    asset.sourceMeta?.change_pct,
  );
}

function getEntryPriceConfidence(asset = {}) {
  return (
    asset.entryPriceConfidence ??
    asset.entry_price_confidence ??
    asset.sourceMeta?.entryPriceConfidence ??
    asset.sourceMeta?.entry_price_confidence ??
    null
  );
}

function getQuantityDifference(asset = {}) {
  return firstFiniteNumber(
    asset.entryPriceMeta?.quantityDifference,
    asset.entry_price_meta?.quantity_difference,
    asset.sourceMeta?.entryPriceMeta?.quantityDifference,
    asset.sourceMeta?.entry_price_meta?.quantity_difference,
  );
}

function getPerformance(asset = {}) {
  const quantity = getQuantity(asset);
  const entryPrice = getEntryPrice(asset);
  const marketPrice = getMarketPrice(asset);

  const explicitPnlUSD = getUnrealizedPnlUSD(asset);
  const explicitPnlPct = getUnrealizedPnlPct(asset);

  const calculatedCostBasis =
    quantity !== null &&
    entryPrice !== null &&
    entryPrice > 0
      ? quantity * entryPrice
      : null;

  const costBasisUSD =
    getCostBasisUSD(asset) ?? calculatedCostBasis;

  const calculatedMarketValue =
    quantity !== null &&
    marketPrice !== null &&
    marketPrice > 0
      ? quantity * marketPrice
      : null;

  const marketValueUSD =
    getMarketValueUSD(asset) ?? calculatedMarketValue;

  const pnlUSD =
    explicitPnlUSD ??
    (costBasisUSD !== null && marketValueUSD !== null
      ? marketValueUSD - costBasisUSD
      : null);

  const pnlPct =
    explicitPnlPct ??
    (pnlUSD !== null &&
    costBasisUSD !== null &&
    costBasisUSD > 0
      ? (pnlUSD / costBasisUSD) * 100
      : null);

  const dailyChangePct = getDailyChangePct(asset);
  const quantityDifference = getQuantityDifference(asset);

  const isPartial =
    getEntryPriceConfidence(asset) === 'partial' ||
    (quantityDifference !== null &&
      Math.abs(quantityDifference) > 1e-8);

  return {
    quantity,
    entryPrice,
    marketPrice,
    costBasisUSD,
    marketValueUSD,
    pnlUSD,
    pnlPct,
    dailyChangePct,
    quantityDifference,
    isPartial,
  };
}

// ─── Meta de roles ──────────────────────────────────────────

const ROLE_META = {
  core: { color: '#2b7fff', Icon: Landmark, label: 'Core' },
  growth: { color: '#10b981', Icon: TrendingUp, label: 'Growth' },
  defensive: { color: '#facc15', Icon: ShieldCheck, label: 'Defense' },
  liquidity: { color: '#2b7fff', Icon: Droplets, label: 'Liq' },
  yield: { color: '#2b7fff', Icon: Zap, label: 'Yield' },
  speculative: { color: '#f43f5e', Icon: Dices, label: 'Spec' },
  trading: { color: '#a855f7', Icon: RefreshCw, label: 'Trade' },
  reserve: { color: '#a4a19b', Icon: Briefcase, label: 'Reserve' },
  patrimony: { color: '#f97316', Icon: Building2, label: 'Patrimony' },
  unclassified: { color: '#a4a19b', Icon: Briefcase, label: 'Other' },
};

// ─── Iconos por símbolo ────────────────────────────────────

const SI_SLUGS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binance',
  XRP: 'xrp',
  ADA: 'cardano',
  AVAX: 'avalanche',
  DOT: 'polkadot',
  MATIC: 'polygon',
  UNI: 'uniswap',
  AAVE: 'aave',
  LINK: 'chainlink',
  DOGE: 'dogecoin',
  USDT: 'tether',
  USDC: 'usdcoin',
  DAI: 'dai',
};

const SI_COLORS = {
  BTC: '#f7931a',
  ETH: '#627eea',
  SOL: '#9945ff',
  BNB: '#f3ba2f',
  XRP: '#346aa9',
  ADA: '#0033ad',
  AVAX: '#e84142',
  DOT: '#e6007a',
  MATIC: '#8247e5',
  UNI: '#ff007a',
  AAVE: '#b6509e',
  LINK: '#2a5ada',
  DOGE: '#c2a633',
  USDT: '#26a17b',
  USDC: '#2775ca',
  DAI: '#f5ac37',
};

const SYMBOL_LUCIDE = {
  VOO: { Icon: BarChart2, color: '#10b981' },
  SPY: { Icon: BarChart2, color: '#10b981' },
  IVV: { Icon: BarChart2, color: '#10b981' },
  VTI: { Icon: BarChart2, color: '#34d399' },
  QQQM: { Icon: Cpu, color: '#5a9fff' },
  QQQ: { Icon: Cpu, color: '#5a9fff' },
  NVDA: { Icon: Cpu, color: '#76c442' },
  TSLA: { Icon: Zap, color: '#34d399' },
  AAPL: { Icon: Smartphone, color: '#a4a19b' },
  MSFT: { Icon: Cpu, color: '#5a9fff' },
  VXUS: { Icon: Globe2, color: '#2b7fff' },
  VWO: { Icon: Globe2, color: '#2b7fff' },
  SCHD: { Icon: TrendingUp, color: '#facc15' },
  IAU: { Icon: Gem, color: '#eab308' },
  GLD: { Icon: Gem, color: '#eab308' },
  BND: { Icon: Lock, color: '#facc15' },
  TIP: { Icon: Shield, color: '#facc15' },
  VNQ: { Icon: Building2, color: '#f97316' },
  SGOV: { Icon: DollarSign, color: '#2b7fff' },
  MU: { Icon: Cpu, color: '#5a9fff' },
  LITE: { Icon: Cpu, color: '#5a9fff' },
  MELI: { Icon: ShoppingBag, color: '#facc15' },
  SLV: { Icon: Gem, color: '#eab308' },
  MRNA: { Icon: HeartPulse, color: '#fb7185' },
  HSY: { Icon: ShoppingCart, color: '#2b7fff' },
  SCHW: { Icon: Landmark, color: '#2b7fff' },
  ZTS: { Icon: HeartPulse, color: '#fb7185' },
  MCHI: { Icon: Globe2, color: '#2b7fff' },
  EMBJ: { Icon: Globe2, color: '#2b7fff' },
  CEG: { Icon: Droplet, color: '#f59e0b' },
  ECL: { Icon: Droplet, color: '#f59e0b' },
};

const SECTOR_META = {
  diversificado_eeuu: {
    Icon: BarChart2,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.18)',
  },
  diversificado_global: {
    Icon: Globe2,
    color: '#2b7fff',
    bg: 'rgba(6,182,212,0.18)',
  },
  emergentes: {
    Icon: Globe2,
    color: '#2b7fff',
    bg: 'rgba(59,130,246,0.15)',
  },
  tecnologia: {
    Icon: Cpu,
    color: '#5a9fff',
    bg: 'rgba(96,165,250,0.18)',
  },
  salud: {
    Icon: HeartPulse,
    color: '#fb7185',
    bg: 'rgba(251,113,133,0.18)',
  },
  defensa: {
    Icon: Shield,
    color: '#a4a19b',
    bg: 'rgba(100,116,139,0.18)',
  },
  finanzas: {
    Icon: Landmark,
    color: '#2b7fff',
    bg: 'rgba(59,130,246,0.18)',
  },
  energia: {
    Icon: Droplet,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.18)',
  },
  energia_renovable: {
    Icon: Sun,
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.18)',
  },
  consumo_basico: {
    Icon: ShoppingCart,
    color: '#2b7fff',
    bg: 'rgba(20,184,166,0.18)',
  },
  consumo_discrecional: {
    Icon: ShoppingBag,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.18)',
  },
  materiales: {
    Icon: Box,
    color: '#d946ef',
    bg: 'rgba(217,70,239,0.18)',
  },
  telecomunicaciones: {
    Icon: Signal,
    color: '#2b7fff',
    bg: 'rgba(59,130,246,0.18)',
  },
  inmobiliario_cotizado: {
    Icon: Building2,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.18)',
  },
  metales_preciosos: {
    Icon: Gem,
    color: '#eab308',
    bg: 'rgba(234,179,8,0.18)',
  },
  bonos_gobierno: {
    Icon: Lock,
    color: '#facc15',
    bg: 'rgba(250,204,21,0.12)',
  },
  bonos_inflacion: {
    Icon: Shield,
    color: '#facc15',
    bg: 'rgba(250,204,21,0.12)',
  },
  efectivo_global: {
    Icon: DollarSign,
    color: '#2b7fff',
    bg: 'rgba(6,182,212,0.12)',
  },
  stablecoin_yield: {
    Icon: Zap,
    color: '#2b7fff',
    bg: 'rgba(20,184,166,0.18)',
  },
  crypto_l1: {
    Icon: Layers,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.18)',
  },
  crypto_l2: {
    Icon: Layers,
    color: '#d946ef',
    bg: 'rgba(217,70,239,0.18)',
  },
  crypto_defi: {
    Icon: Zap,
    color: '#2b7fff',
    bg: 'rgba(20,184,166,0.18)',
  },
  crypto_pagos: {
    Icon: CreditCard,
    color: '#2b7fff',
    bg: 'rgba(59,130,246,0.18)',
  },
  crypto_meme: {
    Icon: Flame,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.18)',
  },
  crypto_stablecoin: {
    Icon: DollarSign,
    color: '#2b7fff',
    bg: 'rgba(34,211,238,0.18)',
  },
};

const TYPE_LUCIDE = {
  crypto: { Icon: Bitcoin, color: '#f97316' },
  stablecoin: { Icon: DollarSign, color: '#2b7fff' },
  stable: { Icon: DollarSign, color: '#2b7fff' },
  etf: { Icon: BarChart2, color: '#10b981' },
  stock: { Icon: Building2, color: '#5a9fff' },
  futures: { Icon: TrendingUp, color: '#a855f7' },
  manual: { Icon: Briefcase, color: '#a4a19b' },
};

function resolveIconLucide(asset = {}) {
  const symbol = String(asset.symbol || '')
    .toUpperCase()
    .split('/')[0];

  const sector = getSector(asset);
  const role = getRole(asset);
  const type = asset.type;

  if (SYMBOL_LUCIDE[symbol]) {
    return SYMBOL_LUCIDE[symbol];
  }

  if (sector && SECTOR_META[sector]) {
    return {
      Icon: SECTOR_META[sector].Icon,
      color: SECTOR_META[sector].color,
    };
  }

  if (role && ROLE_META[role]) {
    return {
      Icon: ROLE_META[role].Icon,
      color: ROLE_META[role].color,
    };
  }

  if (type && TYPE_LUCIDE[type]) {
    return TYPE_LUCIDE[type];
  }

  return {
    Icon: Briefcase,
    color: '#a4a19b',
  };
}

function AssetIcon({ asset, size = 16 }) {
  const symbol = String(asset.symbol || '')
    .toUpperCase()
    .split('/')[0];

  const slug = SI_SLUGS[symbol];
  const color = SI_COLORS[symbol];
  const [failed, setFailed] = useState(false);
  const fallback = resolveIconLucide(asset);

  if (slug && !failed) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(
          color || '#1f1f1f'
        ).replace('#', '')}`}
        alt={symbol}
        width={size}
        height={size}
        style={{
          borderRadius: 3,
          display: 'block',
          flexShrink: 0,
          objectFit: 'contain',
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  const Icon = fallback.Icon;

  return (
    <Icon
      size={size}
      color={fallback.color}
      strokeWidth={2}
      style={{ flexShrink: 0 }}
    />
  );
}

// ─── Colores de tile ────────────────────────────────────────

function tileBg(pnlPct, asset) {
  if (pnlPct !== null) {
    if (pnlPct >= 5) return 'rgba(5,150,105,0.82)';
    if (pnlPct >= 2) return 'rgba(16,185,129,0.60)';
    if (pnlPct >= 0) return 'rgba(16,185,129,0.32)';
    if (pnlPct >= -2) return 'rgba(244,63,94,0.32)';
    if (pnlPct >= -5) return 'rgba(244,63,94,0.58)';
    return 'rgba(225,29,72,0.80)';
  }

  const sector = getSector(asset);

  if (sector && SECTOR_META[sector]) {
    return SECTOR_META[sector].bg;
  }

  const role = getRole(asset);

  if (role === 'trading') return 'rgba(168,85,247,0.15)';
  if (role === 'speculative') return 'rgba(244,63,94,0.15)';

  return 'rgba(30,41,59,0.70)';
}

// ─── Tooltip ────────────────────────────────────────────────

function TooltipPortal({ asset, anchorRect, performance }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) {
      return;
    }

    const tooltipRect =
      tooltipRef.current.getBoundingClientRect();

    const gap = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = anchorRect.top - tooltipRect.height - gap;

    if (top < 8) {
      top = anchorRect.bottom + gap;
    }

    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    let left =
      anchorRect.left +
      anchorRect.width / 2 -
      tooltipRect.width / 2;

    left = Math.max(
      8,
      Math.min(
        left,
        viewportWidth - tooltipRect.width - 8,
      ),
    );

    setPosition({ top, left });

    animate(tooltipRef.current, {
      opacity: [0, 1],
      y: [6, 0],
      scale: [0.94, 1],
      duration: 130,
      ease: 'outSine',
    });
  }, [anchorRect]);

  const role = getRole(asset);
  const roleMeta = ROLE_META[role];
  const sector = getSector(asset);
  const isDeFi = asset.classification?.isDeFi;
  const aprPct = asset.classification?.aprPct;
  const { color } = resolveIconLucide(asset);

  const style = position
    ? {
        top: position.top,
        left: position.left,
        opacity: 1,
      }
    : { top: -9999, left: -9999, opacity: 0 };

  const pnlLabel = fmtPct(performance.pnlPct);

  return ReactDOM.createPortal(
    <div ref={tooltipRef} className="hm-tooltip" style={style}>
      <div className="hm-tooltip__head">
        <div
          className="hm-tooltip__icon-wrap"
          style={{
            background: `${color}1a`,
            border: `1px solid ${color}40`,
          }}
        >
          <AssetIcon asset={asset} size={16} />
        </div>

        <div>
          <div className="hm-tooltip__name">{asset.name}</div>

          {asset.symbol && asset.symbol !== asset.name && (
            <div className="hm-tooltip__symbol">
              {asset.symbol}
            </div>
          )}
        </div>
      </div>

      <div className="hm-tooltip__div" />

      <div className="hm-tooltip__rows">
        <div className="hm-tooltip__row">
          <span className="hm-tooltip__lbl">Valor</span>
          <span className="hm-tooltip__val">
            {fmt(
              performance.marketValueUSD ?? asset.valueUSD,
              2,
            )}
          </span>
        </div>

        {asset.weightPct !== null &&
          asset.weightPct !== undefined && (
            <div className="hm-tooltip__row">
              <span className="hm-tooltip__lbl">Peso global</span>
              <span className="hm-tooltip__val">
                {Number(asset.weightPct).toFixed(1)}%
              </span>
            </div>
          )}

        {performance.quantity !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Cantidad</span>
            <span className="hm-tooltip__val">
              {performance.quantity.toLocaleString('en-US', {
                maximumFractionDigits: 8,
              })}
            </span>
          </div>
        )}

        {performance.entryPrice !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Entrada</span>
            <span className="hm-tooltip__val">
              {fmt(performance.entryPrice, 2)}
            </span>
          </div>
        )}

        {performance.marketPrice !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Actual</span>
            <span className="hm-tooltip__val">
              {fmt(performance.marketPrice, 2)}
            </span>
          </div>
        )}

        {performance.costBasisUSD !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Costo</span>
            <span className="hm-tooltip__val">
              {fmt(performance.costBasisUSD, 2)}
            </span>
          </div>
        )}

        {performance.pnlUSD !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">P&L USD</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.pnlUSD >= 0 ? 'up' : 'down'
              }`}
            >
              {fmt(performance.pnlUSD, 2)}
            </span>
          </div>
        )}

        {pnlLabel && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">P&L %</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.pnlPct >= 0 ? 'up' : 'down'
              }`}
            >
              {pnlLabel}
            </span>
          </div>
        )}

        {performance.dailyChangePct !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Hoy</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.dailyChangePct >= 0
                  ? 'up'
                  : 'down'
              }`}
            >
              {fmtPct(performance.dailyChangePct)}
            </span>
          </div>
        )}

        {performance.isPartial && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Entrada</span>
            <span
              className="hm-tooltip__val"
              style={{ color: '#facc15' }}
            >
              Parcial
            </span>
          </div>
        )}

        {isDeFi && aprPct !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">APR</span>
            <span
              className="hm-tooltip__val"
              style={{ color: '#2b7fff' }}
            >
              <Zap
                size={10}
                style={{
                  marginRight: 3,
                  verticalAlign: 'middle',
                }}
              />
              {aprPct}%
            </span>
          </div>
        )}
      </div>

      {(roleMeta || sector) && (
        <div
          className="hm-tooltip__footer"
          style={{
            borderColor: roleMeta
              ? `${roleMeta.color}22`
              : 'rgba(255,255,255,0.1)',
          }}
        >
          {roleMeta && (
            <>
              <roleMeta.Icon
                size={10}
                color={roleMeta.color}
                style={{ marginRight: 5, flexShrink: 0 }}
              />
              <span
                className="hm-tooltip__role"
                style={{ color: roleMeta.color }}
              >
                {roleMeta.label}
              </span>
            </>
          )}

          {roleMeta && sector && (
            <span style={{ margin: '0 4px', opacity: 0.3 }}>
              |
            </span>
          )}

          {sector && (
            <span className="hm-tooltip__sector">
              {sector.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}

// ─── HeatTile ───────────────────────────────────────────────

function HeatTile({ asset, roleColor, isSmallBlock }) {
  const [hover, setHover] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const tileRef = useRef(null);

  const performance = useMemo(
    () => getPerformance(asset),
    [asset],
  );

  const onMouseEnter = useCallback(() => {
    if (tileRef.current) {
      setAnchorRect(tileRef.current.getBoundingClientRect());
    }

    setHover(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHover(false);
    setAnchorRect(null);
  }, []);

  const pnlPct = performance.pnlPct;
  const pctLabel = fmtPct(pnlPct);
  const background = tileBg(pnlPct, asset);

  const ticker =
    String(asset.symbol || '').split('/')[0] ||
    asset.name?.slice(0, 5).toUpperCase() ||
    '?';

  const valueUSD =
    firstFiniteNumber(
      performance.marketValueUSD,
      asset.valueUSD,
    ) ?? 0;

  const isMini = isSmallBlock || valueUSD < 500;

  return (
    <div
      ref={tileRef}
      className={`hm-tile ${isMini ? 'hm-tile--mini' : ''}`}
      style={{
        background,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: hover
          ? `inset 0 0 0 1px rgba(255,255,255,0.3), 0 0 12px ${roleColor}40`
          : 'none',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!isMini &&
        asset.weightPct !== null &&
        asset.weightPct !== undefined && (
          <span className="hm-tile__weight">
            {Number(asset.weightPct).toFixed(1)}%
          </span>
        )}

      <div className="hm-tile__inner">
        <div className="hm-tile__icon-wrap">
          <AssetIcon asset={asset} size={isMini ? 12 : 17} />
        </div>

        <span className="hm-tile__ticker">{ticker}</span>

        {pctLabel && (
          <span
            className="hm-tile__change"
            style={{
              color: pnlPct >= 0 ? '#d1fae5' : '#ffe4e6',
            }}
          >
            {pctLabel}
          </span>
        )}
      </div>

      {hover && anchorRect && (
        <TooltipPortal
          asset={asset}
          anchorRect={anchorRect}
          performance={performance}
        />
      )}
    </div>
  );
}

// ─── RoleBlock ──────────────────────────────────────────────

function RoleBlock({
  role,
  assets,
  roleTotalValueUSD,
  totalValueUSD,
  equalWidth = false,
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;

    animate(
      contentRef.current.querySelectorAll('.hm-tile'),
      {
        opacity: [0, 1],
        scale: [0.75, 1],
        duration: 280,
        delay: stagger(35, { from: 'first' }),
        ease: 'outExpo',
      },
    );
  }, []);

  const meta = ROLE_META[role] ?? ROLE_META.unclassified;

  const roleGlobalPct =
    totalValueUSD > 0
      ? (roleTotalValueUSD / totalValueUSD) * 100
      : 0;

  const sortedAssets = [...assets].sort(
    (left, right) =>
      (right.valueUSD || 0) - (left.valueUSD || 0),
  );

  const isSmallBlock = roleGlobalPct < 12;

  const Icon = meta.Icon;

  // Modo normal: proporcional al peso
  // Modo equalWidth: todos iguales (para fila de roles chicos)
  const flexValue = equalWidth
    ? 1
    : Math.max(roleGlobalPct, 1);

  return (
    <div
      className="hm-group"
      style={{
        flex: `${flexValue} 1 0`,
        '--role-color': meta.color,
        border: `2px solid ${meta.color}88`,
        boxShadow: `0 4px 20px -2px ${meta.color}15`,
      }}
    >
      <div
        className="hm-group__head"
        style={{
          background: `${meta.color}1a`,
          borderBottom: `1px solid ${meta.color}40`,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: '0.4rem',
          }}
        >
          <Icon
            size={12}
            strokeWidth={2.5}
            color={meta.color}
          />
          <span
            className="hm-group__title"
            style={{ color: meta.color }}
          >
            {meta.label.toUpperCase().slice(0, 7)}
          </span>
        </div>

        <span
          className="hm-group__pct"
          style={{ color: meta.color, opacity: 0.8 }}
        >
          {roleGlobalPct.toFixed(1)}%
        </span>
      </div>

      <div className="hm-group__content" ref={contentRef}>
        {sortedAssets.map((asset) => (
          <HeatTile
            key={asset.id || asset.symbol || asset.name}
            asset={asset}
            roleColor={meta.color}
            isSmallBlock={isSmallBlock}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers de futuros ─────────────────────────────────────

function getPositionSide(asset = {}) {
  return (
    asset.positionSide ??
    asset.sourceMeta?.positionSide ??
    null
  );
}

function getNotionalUSD(asset = {}) {
  return firstFiniteNumber(
    asset.notionalUSD,
    asset.sourceMeta?.notionalUSD,
    asset.marketValueUSD,
    asset.valueUSD,
  );
}

function getLeverage(asset = {}) {
  return firstFiniteNumber(
    asset.leverage,
    asset.sourceMeta?.leverage,
  );
}

function getLiquidationDistancePct(asset = {}) {
  return firstFiniteNumber(
    asset.liquidationDistancePct,
    asset.sourceMeta?.liquidationDistancePct,
  );
}

/**
 * isFuturesAsset — versión corregida *
 * Solo retorna true si:
 * 1. type === 'futures' (Binance USD-M / Bybit linear)
 * 2. positionSide es LONG o SHORT (nunca spot/stablecoins)
 * 3. groupKey === 'binance_usdm' o 'bybit' con notional > 0
 *
 * NO usa `source === 'binance'` porque Binance tiene spot + futuros.
 */
function isFuturesAsset(asset = {}) {
  // 1. Verificación directa por type
  if (asset.type === 'futures') {
    return true;
  }

  // 2. Verificación por positionSide
  const positionSide = getPositionSide(asset);

  if (positionSide === 'LONG' || positionSide === 'SHORT') {
    return true;
  }

  // 3. Verificación por groupKey de derivados reales
  const groupKey = String(asset.groupKey ?? '').toLowerCase();
  const source = String(asset.source ?? '').toLowerCase();

  const isDerivativesGroup =
    groupKey === 'binance_usdm' ||
    groupKey === 'bybit' ||
    source === 'bybit';

  if (isDerivativesGroup) {
    const notionalUSD = getNotionalUSD(asset);

    if (notionalUSD !== null && notionalUSD > 0) {
      return true;
    }
  }

  return false;
}

function getExchangeLabel(asset = {}) {
  const source = String(
    asset.source ?? asset.groupKey ?? '',
  ).toLowerCase();

  if (source.includes('bybit')) return 'Bybit';
  if (source.includes('binance')) return 'Binance';

  return source.toUpperCase() || 'EX';
}

// ─── FuturesTile ────────────────────────────────────────────

function FuturesTile({ asset }) {
  const [hover, setHover] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const tileRef = useRef(null);

  const positionSide = getPositionSide(asset) || 'LONG';
  const isShort = positionSide === 'SHORT';

  const notionalUSD = getNotionalUSD(asset);
  const pnlUSD = getUnrealizedPnlUSD(asset);
  const pnlPct = getUnrealizedPnlPct(asset);
  const leverage = getLeverage(asset);
  const liquidationDistancePct =
    getLiquidationDistancePct(asset);

  const isPositivePnl = pnlUSD !== null && pnlUSD >= 0;

  const bg = isPositivePnl
    ? 'rgba(16,185,129,0.22)'
    : pnlUSD !== null
      ? 'rgba(244,63,94,0.22)'
      : 'rgba(168,85,247,0.18)';

  const sideColor = isShort ? '#f43f5e' : '#10b981';
  const sideLabel = isShort ? 'SHORT' : 'LONG';

  const onMouseEnter = useCallback(() => {
    if (tileRef.current) {
      setAnchorRect(tileRef.current.getBoundingClientRect());
    }

    setHover(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHover(false);
    setAnchorRect(null);
  }, []);

  const rawTicker =
    String(asset.symbol || asset.name || '')
      .replace(/USDT$|USD$/, '')
      .slice(0, 8) || '?';

  const exchangeLabel = getExchangeLabel(asset);

  return (
    <div
      ref={tileRef}
      className="hm-futures-tile"
      style={{
        background: bg,
        border: `1px solid ${sideColor}55`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="hm-futures-tile__top">
        <div className="hm-futures-tile__icon-wrap">
          <AssetIcon asset={asset} size={14} />
        </div>

        <div className="hm-futures-tile__symbol-group">
          <span className="hm-futures-tile__symbol">
            {rawTicker}
          </span>
          <span className="hm-futures-tile__exchange">
            {exchangeLabel}
          </span>
        </div>

        <span
          className="hm-futures-tile__side"
          style={{ color: sideColor }}
        >
          {sideLabel}
        </span>
      </div>

      <div className="hm-futures-tile__metrics">
        {notionalUSD !== null && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">
              Notional
            </span>
            <span className="hm-futures-tile__val">
              {fmt(notionalUSD, 2)}
            </span>
          </div>
        )}

        {pnlUSD !== null && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">P&L</span>
            <span
              className="hm-futures-tile__val"
              style={{
                color: isPositivePnl ? '#10b981' : '#f43f5e',
              }}
            >
              {fmt(pnlUSD, 2)}
              {pnlPct !== null && ` (${fmtPct(pnlPct)})`}
            </span>
          </div>
        )}

        {leverage !== null && leverage > 1 && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">Lev</span>
            <span className="hm-futures-tile__val">
              {leverage}x
            </span>
          </div>
        )}

        {liquidationDistancePct !== null && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">
              Liq. dist.
            </span>
            <span
              className="hm-futures-tile__val"
              style={{
                color:
                  liquidationDistancePct < 10
                    ? '#f43f5e'
                    : liquidationDistancePct < 20
                      ? '#facc15'
                      : '#10b981',
              }}
            >
              {liquidationDistancePct.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {hover && anchorRect && (
        <TooltipPortal
          asset={asset}
          anchorRect={anchorRect}
          performance={{
            quantity: getQuantity(asset),
            entryPrice: getEntryPrice(asset),
            marketPrice: getMarketPrice(asset),
            costBasisUSD: getCostBasisUSD(asset),
            marketValueUSD: notionalUSD,
            pnlUSD,
            pnlPct,
            dailyChangePct: null,
            quantityDifference: null,
            isPartial: false,
          }}
        />
      )}
    </div>
  );
}

// ─── FuturesBlock ───────────────────────────────────────────

function FuturesBlock({ assets }) {
  if (!assets.length) return null;

  const totalNotional = assets.reduce(
    (sum, asset) => sum + (getNotionalUSD(asset) ?? 0),
    0,
  );

  const totalPnl = assets.reduce(
    (sum, asset) => sum + (getUnrealizedPnlUSD(asset) ?? 0),
    0,
  );

  const shortCount = assets.filter(
    (asset) => getPositionSide(asset) === 'SHORT',
  ).length;

  const longCount = assets.length - shortCount;

  return (
    <div className="hm-futures">
      <div className="hm-futures__head">
        <span className="hm-futures__title">
          Futuros · Derivados
        </span>

        <div className="hm-futures__stats">
          {longCount > 0 && (
            <span className="hm-futures__stat hm-futures__stat--long">
              {longCount} LONG
            </span>
          )}

          {shortCount > 0 && (
            <span className="hm-futures__stat hm-futures__stat--short">
              {shortCount} SHORT
            </span>
          )}

          <span className="hm-futures__stat">
            Notional {fmt(totalNotional, 2)}
          </span>

          <span
            className={`hm-futures__stat ${
              totalPnl >= 0
                ? 'hm-futures__stat--up'
                : 'hm-futures__stat--down'
            }`}
          >
            P&L {fmt(totalPnl, 2)}
          </span>
        </div>
      </div>

      <div className="hm-futures__grid">
        {assets.map((asset) => (
          <FuturesTile
            key={
              asset.id ||
              `${asset.source || asset.groupKey}-${asset.symbol}-${asset.positionSide ?? ''}`
            }
            asset={asset}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────

export default function MarketHeatmap({
  assets = [],
  futuresAssets = [],
}) {
  const gridRef = useRef(null);

  const investableAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (isFuturesAsset(asset)) return false;

        const role = getRole(asset);
        const valueUSD =
          firstFiniteNumber(
            asset.marketValueUSD,
            asset.market_value_usd,
            asset.valueUSD,
          ) ?? 0;

        return (
          role !== 'reserve' &&
          role !== 'patrimony' &&
          !asset.locked &&
          valueUSD > 1
        );
      }),
    [assets],
  );

  useEffect(() => {
    if (!gridRef.current) return;

    animate(
      gridRef.current.querySelectorAll('.hm-group'),
      {
        opacity: [0, 1],
        y: [16, 0],
        scale: [0.96, 1],
        duration: 380,
        delay: stagger(55, { from: 'first' }),
        ease: 'outExpo',
      },
    );
  }, [investableAssets.length]);

  if (!investableAssets.length && !futuresAssets.length) {
    return null;
  }

  const totalValueUSD = investableAssets.reduce(
    (sum, asset) =>
      sum +
      (firstFiniteNumber(
        asset.marketValueUSD,
        asset.market_value_usd,
        asset.valueUSD,
      ) ?? 0),
    0,
  );

  const enrichedAssets = investableAssets.map((asset) => {
    const valueUSD =
      firstFiniteNumber(
        asset.marketValueUSD,
        asset.market_value_usd,
        asset.valueUSD,
      ) ?? 0;

    return {
      ...asset,
      valueUSD,
      weightPct:
        totalValueUSD > 0
          ? (valueUSD / totalValueUSD) * 100
          : 0,
    };
  });

  const byRole = {};

  for (const asset of enrichedAssets) {
    const role = getRole(asset);

    if (!byRole[role]) {
      byRole[role] = { assets: [], total: 0 };
    }

    byRole[role].assets.push(asset);
    byRole[role].total += asset.valueUSD;
  }

  const sortedRoles = Object.entries(byRole)
    .sort(([, left], [, right]) => right.total - left.total)
    .map(([key, data]) => ({ key, ...data }));

  // ═══════════════════════════════════════════════════════════
  // Distribución: roles grandes en 3 filas balanceadas,
  // roles chicos (< 5%) en una fila dedicada al final
  // ═══════════════════════════════════════════════════════════

  const SMALL_ROLE_THRESHOLD_PCT = 5;

  const bigRoles = sortedRoles.filter((role) => {
    const pct =
      totalValueUSD > 0
        ? (role.total / totalValueUSD) * 100
        : 0;

    return pct >= SMALL_ROLE_THRESHOLD_PCT;
  });

  const smallRoles = sortedRoles.filter((role) => {
    const pct =
      totalValueUSD > 0
        ? (role.total / totalValueUSD) * 100
        : 0;

    return pct < SMALL_ROLE_THRESHOLD_PCT;
  });

  const rows = [
    { total: 0, roles: [] },
    { total: 0, roles: [] },
    { total: 0, roles: [] },
  ];

  for (const role of bigRoles) {
    const targetRow = rows.reduce(
      (smallest, current) =>
        current.total < smallest.total ? current : smallest,
      rows[0],
    );

    targetRow.roles.push(role);
    targetRow.total += role.total;
  }

  // Fila dedicada para roles chicos (van al final)
  if (smallRoles.length > 0) {
    rows.push({
      total: smallRoles.reduce(
        (sum, role) => sum + role.total,
        0,
      ),
      roles: smallRoles,
      isSmallRolesRow: true,
    });
  }

  for (const row of rows) {
    row.roles.sort((left, right) => right.total - left.total);
  }

  rows.sort((left, right) => {
    // La fila de roles chicos va al final
    if (left.isSmallRolesRow && !right.isSmallRolesRow) return 1;
    if (right.isSmallRolesRow && !left.isSmallRolesRow) return -1;
    return right.total - left.total;
  });

  // ── Performance stats ──

  const performanceStats = enrichedAssets.reduce(
    (stats, asset) => {
      const pnlPct = getPerformance(asset).pnlPct;

      if (pnlPct === null) stats.noData += 1;
      else if (pnlPct >= 0) stats.up += 1;
      else stats.down += 1;

      return stats;
    },
    { up: 0, down: 0, noData: 0 },
  );

  return (
    <div className="hm-container">
      <div className="hm-header">
        <span className="hm-title">
          Mapa de calor · Portafolio
        </span>

        <div className="hm-counts">
          {performanceStats.down > 0 && (
            <span className="hm-count red">
              ▼ {performanceStats.down}
            </span>
          )}

          {performanceStats.noData > 0 && (
            <span className="hm-count neutral">
              ― {performanceStats.noData}
            </span>
          )}

          {performanceStats.up > 0 && (
            <span className="hm-count green">
              ▲ {performanceStats.up}
            </span>
          )}
        </div>
      </div>

      <div className="hm-grid" ref={gridRef}>
        {rows.map((row, index) => {
          if (row.total <= 0) return null;

          return (
            <div key={`row-${index}`} className="hm-row">
              {row.roles.map((role) => (
                <RoleBlock
                  key={role.key}
                  role={role.key}
                  assets={role.assets}
                  roleTotalValueUSD={role.total}
                  totalValueUSD={totalValueUSD}
                  equalWidth={row.isSmallRolesRow === true}
                />
              ))}
            </div>
          );
        })}
      </div>

      {futuresAssets.length > 0 && (
        <FuturesBlock assets={futuresAssets} />
      )}
    </div>
  );
}