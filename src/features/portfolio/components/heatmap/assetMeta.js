import {
  Bitcoin, TrendingUp, BarChart2, Landmark, Layers, RefreshCw, ShieldCheck, Zap,
  Dices, Droplets, Building2, Briefcase, DollarSign, Cpu, HeartPulse, Lock, Shield,
  CreditCard, Flame, Sun, ShoppingBag, ShoppingCart, Droplet, Signal, Globe2, Gem,
  Box, Smartphone,
} from 'lucide-react';
import { getRole, getSector } from './assetGetters';

// ─── Meta de roles ──────────────────────────────────────────

export const ROLE_META = {
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

export const SI_SLUGS = {
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

export const SI_COLORS = {
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

export const SECTOR_META = {
  diversificado_eeuu: { Icon: BarChart2, color: '#10b981', bg: 'rgba(16,185,129,0.18)' },
  diversificado_global: { Icon: Globe2, color: '#2b7fff', bg: 'rgba(6,182,212,0.18)' },
  emergentes: { Icon: Globe2, color: '#2b7fff', bg: 'rgba(59,130,246,0.15)' },
  tecnologia: { Icon: Cpu, color: '#5a9fff', bg: 'rgba(96,165,250,0.18)' },
  salud: { Icon: HeartPulse, color: '#fb7185', bg: 'rgba(251,113,133,0.18)' },
  defensa: { Icon: Shield, color: '#a4a19b', bg: 'rgba(100,116,139,0.18)' },
  finanzas: { Icon: Landmark, color: '#2b7fff', bg: 'rgba(59,130,246,0.18)' },
  energia: { Icon: Droplet, color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
  energia_renovable: { Icon: Sun, color: '#84cc16', bg: 'rgba(132,204,22,0.18)' },
  consumo_basico: { Icon: ShoppingCart, color: '#2b7fff', bg: 'rgba(20,184,166,0.18)' },
  consumo_discrecional: { Icon: ShoppingBag, color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)' },
  materiales: { Icon: Box, color: '#d946ef', bg: 'rgba(217,70,239,0.18)' },
  telecomunicaciones: { Icon: Signal, color: '#2b7fff', bg: 'rgba(59,130,246,0.18)' },
  inmobiliario_cotizado: { Icon: Building2, color: '#f97316', bg: 'rgba(249,115,22,0.18)' },
  metales_preciosos: { Icon: Gem, color: '#eab308', bg: 'rgba(234,179,8,0.18)' },
  bonos_gobierno: { Icon: Lock, color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  bonos_inflacion: { Icon: Shield, color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  efectivo_global: { Icon: DollarSign, color: '#2b7fff', bg: 'rgba(6,182,212,0.12)' },
  stablecoin_yield: { Icon: Zap, color: '#2b7fff', bg: 'rgba(20,184,166,0.18)' },
  crypto_l1: { Icon: Layers, color: '#a855f7', bg: 'rgba(168,85,247,0.18)' },
  crypto_l2: { Icon: Layers, color: '#d946ef', bg: 'rgba(217,70,239,0.18)' },
  crypto_defi: { Icon: Zap, color: '#2b7fff', bg: 'rgba(20,184,166,0.18)' },
  crypto_pagos: { Icon: CreditCard, color: '#2b7fff', bg: 'rgba(59,130,246,0.18)' },
  crypto_meme: { Icon: Flame, color: '#f43f5e', bg: 'rgba(244,63,94,0.18)' },
  crypto_stablecoin: { Icon: DollarSign, color: '#2b7fff', bg: 'rgba(34,211,238,0.18)' },
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

export function resolveIconLucide(asset = {}) {
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

// ─── Colores de tile ────────────────────────────────────────

export function tileBg(pnlPct, asset) {
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

