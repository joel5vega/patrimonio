import {
  Bitcoin, TrendingUp, BarChart2, Landmark, Layers, RefreshCw, ShieldCheck, Zap,
  Dices, Droplets, Building2, Briefcase, DollarSign, Cpu, HeartPulse, Lock, Shield,
  CreditCard, Flame, Sun, ShoppingBag, ShoppingCart, Droplet, Signal, Globe2, Gem,
  Box, Smartphone, Wallet, Banknote, CircleDollarSign, Car, Ship, TrainFront,
  Link2, Smile
} from 'lucide-react';
import { getRole, getSector } from './assetGetters';

// ─── Meta de roles ──────────────────────────────────────────

export const ROLE_META = {
  core: { color: '#2b7fff', Icon: Landmark, label: 'Core' },
  growth: { color: '#10b981', Icon: TrendingUp, label: 'Growth' },
  defensive: { color: '#facc15', Icon: ShieldCheck, label: 'Defense' },
  liquidity: { color: '#38bdf8', Icon: Droplets, label: 'Liq' },
  yield: { color: '#2b7fff', Icon: Zap, label: 'Yield' },
  speculative: { color: '#f43f5e', Icon: Dices, label: 'Spec' },
  trading: { color: '#a855f7', Icon: RefreshCw, label: 'Trade' },
  reserve: { color: '#a4a19b', Icon: Briefcase, label: 'Reserve' },
  patrimony: { color: '#f97316', Icon: Building2, label: 'Patrimony' },
  unclassified: { color: '#a4a19b', Icon: Briefcase, label: 'Other' },
};

// ─── Iconos por símbolo (Simple Icons CDN) ─────────────────

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
  BINANCE: 'binance',
  // bybit: no existe en simpleicons CDN → Lucide fallback
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
  BINANCE: '#F0B90B',
  BYBIT: '#F7A600',
  AIRTM: '#00C2A8',
  DEEL: '#FF5C35',
};

// ─── Lucide por símbolo (ETFs, stocks, liquidez) ───────────

const SYMBOL_LUCIDE = {
  // ─── ETFs ────────────────────────────────────────────────────
  VOO: { Icon: BarChart2, color: '#10b981' },
  SPY: { Icon: BarChart2, color: '#10b981' },
  IVV: { Icon: BarChart2, color: '#10b981' },
  VTI: { Icon: BarChart2, color: '#34d399' },
  QQQM: { Icon: Cpu, color: '#5a9fff' },
  QQQ: { Icon: Cpu, color: '#5a9fff' },
  VXUS: { Icon: Globe2, color: '#2b7fff' },
  VWO: { Icon: Globe2, color: '#2b7fff' },
  VT: { Icon: Globe2, color: '#06b6d4' },
  SCHD: { Icon: TrendingUp, color: '#facc15' },
  VFMF: { Icon: TrendingUp, color: '#f59e0b' },
  AVUV: { Icon: TrendingUp, color: '#f59e0b' },
  EMXC: { Icon: Globe2, color: '#2b7fff' },
  MCHI: { Icon: Globe2, color: '#2b7fff' },
  EMBJ: { Icon: Globe2, color: '#2b7fff' },
  IAU: { Icon: Gem, color: '#eab308' },
  GLD: { Icon: Gem, color: '#eab308' },
  BND: { Icon: Lock, color: '#facc15' },
  TIP: { Icon: Shield, color: '#facc15' },
  VNQ: { Icon: Building2, color: '#f97316' },
  SGOV: { Icon: DollarSign, color: '#2b7fff' },
  SLV: { Icon: Gem, color: '#eab308' },

  // ─── Tecnología ─────────────────────────────────────────────
  NVDA: { Icon: Cpu, color: '#76c442' },
  AAPL: { Icon: Smartphone, color: '#a4a19b' },
  MSFT: { Icon: Cpu, color: '#5a9fff' },
  AMZN: { Icon: ShoppingBag, color: '#ff9900' },
  GOOGL: { Icon: Globe2, color: '#4285f4' },
  GOOG: { Icon: Globe2, color: '#4285f4' },
  META: { Icon: Signal, color: '#0866ff' },
  AVGO: { Icon: Cpu, color: '#cc0000' },
  MU: { Icon: Cpu, color: '#5a9fff' },
  DELL: { Icon: Cpu, color: '#007db8' },
  TSM: { Icon: Cpu, color: '#e31837' },
  ASML: { Icon: Cpu, color: '#00a6e0' },
  SSNLF: { Icon: Smartphone, color: '#1428a0' },
  INFY: { Icon: Cpu, color: '#0096e1' },
  LITE: { Icon: Cpu, color: '#5a9fff' },

  // ─── Finanzas ───────────────────────────────────────────────
  JPM: { Icon: Landmark, color: '#117aca' },
  HDB: { Icon: Landmark, color: '#ed1c24' },
  IBN: { Icon: Landmark, color: '#e87511' },
  TRV: { Icon: Shield, color: '#004b87' },
  SCHW: { Icon: Landmark, color: '#0078d7' },

  // ─── Salud ──────────────────────────────────────────────────
  ROG: { Icon: HeartPulse, color: '#0066cc' },
  BMY: { Icon: HeartPulse, color: '#cc0000' },
  MRNA: { Icon: HeartPulse, color: '#fb7185' },
  ZTS: { Icon: HeartPulse, color: '#3b82f6' },

  // ─── Consumo básico ─────────────────────────────────────────
  NESN: { Icon: ShoppingCart, color: '#1e3a8a' },
  NESTLE: { Icon: ShoppingCart, color: '#1e3a8a' },
  HSY: { Icon: ShoppingCart, color: '#744f2c' },
  MO: { Icon: ShoppingCart, color: '#0078d7' },

  // ─── Consumo discrecional ───────────────────────────────────
  MELI: { Icon: ShoppingBag, color: '#00b1ea' },
  FIVE: { Icon: ShoppingBag, color: '#0078d7' },
  M: { Icon: ShoppingBag, color: '#cc0000' },
  LEA: { Icon: Car, color: '#00529b' },

  // ─── Energía ────────────────────────────────────────────────
  VLO: { Icon: Droplet, color: '#00529b' },
  COP: { Icon: Droplet, color: '#00529b' },
  EOG: { Icon: Droplet, color: '#164194' },
  MPC: { Icon: Droplet, color: '#00529b' },
  NEM: { Icon: Gem, color: '#b8860b' },
  SM: { Icon: Droplet, color: '#0078d7' },
  CRC: { Icon: Droplet, color: '#00529b' },
  MGY: { Icon: Droplet, color: '#0078d7' },

  // ─── Materiales ─────────────────────────────────────────────
  // (NEM ya está en energía/metales preciosos)

  // ─── Telecomunicaciones ─────────────────────────────────────
  VSAT: { Icon: Signal, color: '#0066cc' },

  // ─── Industria ──────────────────────────────────────────────
  MATX: { Icon: Ship, color: '#00529b' },
  GATX: { Icon: TrainFront, color: '#00529b' },

  // ─── Liquidez / plataformas ─────────────────────────────────
  AIRTM: { Icon: Wallet, color: '#00C2A8' },
  DEEL: { Icon: Banknote, color: '#FF5C35' },
  BINANCE: { Icon: CircleDollarSign, color: '#F0B90B' },
  BYBIT: { Icon: Zap, color: '#F7A600' },

  // ─── Crypto ─────────────────────────────────────────────────
  BTC: { Icon: Bitcoin, color: '#f7931a' },
  ETH: { Icon: Gem, color: '#627eea' },
  SOL: { Icon: Zap, color: '#9945ff' },
  BNB: { Icon: CircleDollarSign, color: '#f3ba2f' },
  XRP: { Icon: TrendingUp, color: '#346aa9' },
  ADA: { Icon: Gem, color: '#0033ad' },
  AVAX: { Icon: Zap, color: '#e84142' },
  DOT: { Icon: Layers, color: '#e6007a' },
  MATIC: { Icon: Layers, color: '#8247e5' },
  UNI: { Icon: RefreshCw, color: '#ff007a' },
  AAVE: { Icon: TrendingUp, color: '#b6509e' },
  LINK: { Icon: Link2, color: '#2a5ada' },
  DOGE: { Icon: Smile, color: '#c2a633' },
  USDT: { Icon: DollarSign, color: '#26a17b' },
  USDC: { Icon: DollarSign, color: '#2775ca' },
  DAI: { Icon: DollarSign, color: '#f5ac37' }
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

const PLATFORM_LABEL = {
  binance: 'Binance',
  bybit: 'Bybit',
  airtm: 'AirTM',
  deel: 'Deel',
  quantfury: 'Quantfury',
  admirals: 'Admirals',
  manual: 'Manual',
};

/**
 * Detecta plataforma.
 * Orden: source/groupKey ANTES que classification.platform
 * (Bybit USDT tiene classification.platform erróneo = "binance").
 */
export function resolvePlatformKey(asset = {}) {
  const candidates = [
    asset.source,
    asset.groupKey,
    asset.platform,
    asset.classification?.platform,
    asset.sourceMeta?.platform,
    asset.symbol,
    asset.name,
  ];

  for (const raw of candidates) {
    const s = String(raw || '')
      .trim()
      .toLowerCase();
    if (!s) continue;
    if (s.includes('binance')) return 'binance';
    if (s.includes('bybit')) return 'bybit';
    if (s.includes('airtm') || s.includes('air tm')) return 'airtm';
    if (s.includes('deel')) return 'deel';
    if (s.includes('quantfury')) return 'quantfury';
    if (s.includes('admirals')) return 'admirals';
  }

  return null;
}

/**
 * Label del tile en el heatmap.
 * - AirTM / Deel → nombre legible
 * - USDT binance/bybit → "USDT · Binance" / "USDT · Bybit"
 */
export function getDisplayLabel(asset = {}) {
  const symbol = String(asset.symbol || '')
    .trim()
    .toUpperCase()
    .split('/')[0];
  const name = String(asset.name || '').trim();
  const nameUpper = name.toUpperCase();
  const platform = resolvePlatformKey(asset);

  if (
    symbol === 'AIRTM' ||
    nameUpper === 'AIRTM' ||
    nameUpper.includes('AIRTM') ||
    platform === 'airtm'
  ) {
    return 'AirTM';
  }

  if (
    symbol === 'DEEL' ||
    nameUpper === 'DEEL' ||
    nameUpper.includes('DEEL') ||
    platform === 'deel'
  ) {
    return 'Deel';
  }

  const isStable =
    asset.type === 'stablecoin' ||
    ['USDT', 'USDC', 'BUSD', 'FDUSD', 'DAI', 'TUSD'].includes(symbol);

  // Stablecoin en exchange: solo el nombre de la plataforma (sin "USDT ·")
  if (isStable && (platform === 'binance' || platform === 'bybit')) {
    return PLATFORM_LABEL[platform];
  }

  if (symbol) return symbol;
  if (name) return name;
  return '—';
}

/**
 * Clave para SI_SLUGS / SYMBOL_LUCIDE.
 * AirTM/Deel se mapean aunque source sea "manual".
 */
export function getIconSymbol(asset = {}) {
  const symbol = String(asset.symbol || '')
    .trim()
    .toUpperCase()
    .split('/')[0];
  const name = String(asset.name || '')
    .trim()
    .toUpperCase();
  const platform = resolvePlatformKey(asset);

  if (
    symbol === 'AIRTM' ||
    name === 'AIRTM' ||
    name.includes('AIRTM') ||
    platform === 'airtm'
  ) {
    return 'AIRTM';
  }

  if (
    symbol === 'DEEL' ||
    name === 'DEEL' ||
    name.includes('DEEL') ||
    platform === 'deel'
  ) {
    return 'DEEL';
  }

  // Stablecoin en exchange → logo de la plataforma (no Tether)
  const isStable =
    asset.type === 'stablecoin' ||
    ['USDT', 'USDC', 'BUSD', 'FDUSD', 'DAI', 'TUSD'].includes(symbol);

  if (isStable && platform === 'binance') return 'BINANCE';
  if (isStable && platform === 'bybit') return 'BYBIT';

  return symbol || name || '';
}

export function resolveIconLucide(asset = {}) {
  const iconSymbol = getIconSymbol(asset);

  if (SYMBOL_LUCIDE[iconSymbol]) {
    return SYMBOL_LUCIDE[iconSymbol];
  }

  const sector = getSector(asset);
  const role = getRole(asset);
  const type = asset.type;

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
  if (role === 'liquidity') return 'rgba(56,189,248,0.18)';

  return 'rgba(30,41,59,0.70)';
}