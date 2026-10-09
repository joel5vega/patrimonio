import {
  Bitcoin, TrendingUp, BarChart2, Landmark, Layers, RefreshCw, ShieldCheck, Zap,
  Dices, Droplets, Building2, Briefcase, DollarSign, Cpu, HeartPulse, Lock, Shield,
  CreditCard, Flame, Sun, ShoppingBag, ShoppingCart, Droplet, Signal, Globe2, Gem,
  Box, Smartphone, Wallet, Banknote, CircleDollarSign, Car, Ship, TrainFront,
  Link2, Smile
} from 'lucide-react';

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
  // Crypto
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
  BCH: 'bitcoincash',
  // Tech que SÍ existen en Simple Icons
  NVDA: 'nvidia',
  AAPL: 'apple',
  GOOGL: 'google',
  GOOG: 'google',
  META: 'meta',
  AMD: 'amd',
  INTC: 'intel',
  CSCO: 'cisco',
  AVGO: 'broadcom',
  NFLX: 'netflix',
  TSLA: 'tesla',
  SSNLF: 'samsung',

  // Finanzas / pagos que SÍ existen
  V: 'visa',
  MA: 'mastercard',
  KO: 'cocacola',
  CAT: 'caterpillar',
  '9988': 'alibabadotcom',

  // Otros
  GE: 'generalelectric',
  TXN: 'texasinstruments',
QCOM: 'qualcomm',
PG: 'procterandgamble',   // a veces 'pg'
KO: 'cocacola',
CVX: null,                // no hay slug fiable → DeBounce
COP: null,
MRK: null,
UNH: null,
AMGN: null,
VZ: 'verizon',
HD: 'homedepot',
ABT: null,
PEP: 'pepsi',
BMY: null,
ACN: 'accenture',
MO: null,
ADP: null,
LMT: null,
BX: null,
EOG: null,
CMCSA: 'comcast',
SLB: null,
UPS: 'ups',
TGT: 'target',
FAST: null,
};

export const SI_COLORS = {
  // Crypto
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
  BCH: '#0ac18e',
HYPE: '#97fce4',
  // Tech
  NVDA: '#76b900',
  AAPL: '#a2aaad',
  MSFT: '#00a4ef',
  AMZN: '#ff9900',
  GOOGL: '#4285f4',
  GOOG: '#4285f4',
  META: '#0866ff',
  AVGO: '#cc092f',
  AMD: '#ed1c24',
  INTC: '#0071c5',
  CSCO: '#1ba0d7',
  TSM: '#e31837',
  ASML: '#0a5cff',
  DELL: '#007db8',
  PLTR: '#000000',
  PANW: '#fa582d',
  NFLX: '#e50914',
  TSLA: '#cc0000',

  // Finanzas
  JPM: '#117aca',
  V: '#1a1f71',
  MA: '#eb001b',
  BAC: '#e31837',
  WFC: '#d71e28',
  GS: '#7399c6',
  SCHW: '#00a0df',
  'BRK.B': '#1e3a5f',
  HSBA: '#db0011',
  RY: '#003da5',
  TD: '#34b233',
  SAN: '#ec0000',

  // Salud
  LLY: '#d52b1e',
  JNJ: '#d51900',
  UNH: '#002677',
  MRK: '#0093d0',
  ABBV: '#071d49',
  AZN: '#003087',
  NOVN: '#0460a9',
  ROG: '#0066cc',

  // Consumo
  WMT: '#0071ce',
  COST: '#e31837',
  KO: '#f40009',
  PG: '#003da5',
  HD: '#f96302',
  MELI: '#ffe600',
  '9988': '#ff6a00',
  '0700': '#00a4e4',

  // Energía / Industria
  XOM: '#ed1c24',
  CVX: '#0033a0',
  SHEL: '#fbce07',
  CAT: '#ffcd11',
  GE: '#3b73b9',
  RTX: '#00205b',
  BHP: '#e31323',
  SIE: '#009999',

  // Otros
  SSNLF: '#1428a0',
  '000660': '#00a0e9',
  '7203': '#eb0a1e',

  // Plataformas
  AIRTM: '#00C2A8',
  DEEL: '#FF5C35',
  // ── SI_COLORS (opcional) ──
TXN: '#cc0000',
QCOM: '#3253dc',
PG: '#003da5',
KO: '#f40009',
VZ: '#cd040b',
HD: '#f96302',
PEP: '#e32934',
ACN: '#a100ff',
CMCSA: '#000000',
UPS: '#351c15',
TGT: '#cc0000',
};

// ─── Lucide por símbolo (fallback) ─────────────────────────

const SYMBOL_LUCIDE = {
  // ─── ETFs core (concepto, no emisor) ───────────────────────
VOO:  { Icon: BarChart2,  color: '#10b981' },  // S&P 500 / US large-cap
VTI:  { Icon: BarChart2,  color: '#34d399' },  // Total US market
SPY:  { Icon: BarChart2,  color: '#10b981' },
IVV:  { Icon: BarChart2,  color: '#10b981' },

VXUS: { Icon: Globe2,     color: '#3b82f6' },  // International ex-US
VWO:  { Icon: Globe2,     color: '#6366f1' },  // Emerging markets
VT:   { Icon: Globe2,     color: '#06b6d4' },  // Total World
EMXC: { Icon: Globe2,     color: '#818cf8' },
MCHI: { Icon: Globe2,     color: '#f43f5e' },  // China (rojo)

QQQ:  { Icon: Cpu,        color: '#5a9fff' },  // Tech/Nasdaq
QQQM: { Icon: Cpu,        color: '#5a9fff' },

SCHD: { Icon: TrendingUp, color: '#facc15' },  // Dividendos
VFMF: { Icon: TrendingUp, color: '#f59e0b' },  // Multifactor
AVUV: { Icon: TrendingUp, color: '#f59e0b' },  // Small value

// Metales – mismos icono, color distinto
IAU:  { Icon: Gem,        color: '#eab308' },  // Oro
GLD:  { Icon: Gem,        color: '#eab308' },
SLV:  { Icon: Gem,        color: '#94a3b8' },  // Plata (slate)

// Bonos / liquidez
BND:  { Icon: Lock,       color: '#facc15' },
TIP:  { Icon: Shield,     color: '#facc15' },
SGOV: { Icon: DollarSign, color: '#38bdf8' },
VNQ:  { Icon: Building2,  color: '#f97316' },

  // Tech (fallback por si Simple Icons falla)
  NVDA: { Icon: Cpu, color: '#76c442' },
  AAPL: { Icon: Smartphone, color: '#a4a19b' },
  MSFT: { Icon: Cpu, color: '#5a9fff' },
  AMZN: { Icon: ShoppingBag, color: '#ff9900' },
  GOOGL: { Icon: Globe2, color: '#4285f4' },
  GOOG: { Icon: Globe2, color: '#4285f4' },
  META: { Icon: Signal, color: '#0866ff' },
  AVGO: { Icon: Cpu, color: '#cc0000' },
  MU: { Icon: Cpu, color: '#5a9fff' },
  AMD: { Icon: Cpu, color: '#ed1c24' },
  TSM: { Icon: Cpu, color: '#e31837' },
  ASML: { Icon: Cpu, color: '#00a6e0' },
  SSNLF: { Icon: Smartphone, color: '#1428a0' },
  '000660': { Icon: Cpu, color: '#00a0e9' },
  INTC: { Icon: Cpu, color: '#0071c5' },
  CSCO: { Icon: Cpu, color: '#1ba0d7' },
  PLTR: { Icon: Cpu, color: '#000000' },
  LRCX: { Icon: Cpu, color: '#00a0e3' },
  AMAT: { Icon: Cpu, color: '#1a1a1a' },
  PANW: { Icon: Shield, color: '#fa582d' },
  DELL: { Icon: Cpu, color: '#007db8' },
  INFY: { Icon: Cpu, color: '#0096e1' },
  LITE: { Icon: Cpu, color: '#5a9fff' },

  // Finanzas
  JPM: { Icon: Landmark, color: '#117aca' },
  'BRK.B': { Icon: Landmark, color: '#1e3a5f' },
  V: { Icon: CreditCard, color: '#1a1f71' },
  MA: { Icon: CreditCard, color: '#eb001b' },
  BAC: { Icon: Landmark, color: '#e31837' },
  WFC: { Icon: Landmark, color: '#d71e28' },
  GS: { Icon: Landmark, color: '#7399c6' },
  SCHW: { Icon: Landmark, color: '#0078d7' },
  HSBA: { Icon: Landmark, color: '#db0011' },
  RY: { Icon: Landmark, color: '#003da5' },
  TD: { Icon: Landmark, color: '#34b233' },
  '8306': { Icon: Landmark, color: '#e60012' },
  CBA: { Icon: Landmark, color: '#ffcc00' },
  SAN: { Icon: Landmark, color: '#ec0000' },
  HDB: { Icon: Landmark, color: '#ed1c24' },
  IBN: { Icon: Landmark, color: '#e87511' },
  TRV: { Icon: Shield, color: '#004b87' },

  // Salud
  LLY: { Icon: HeartPulse, color: '#d52b1e' },
  JNJ: { Icon: HeartPulse, color: '#d51900' },
  ABBV: { Icon: HeartPulse, color: '#071d49' },
  MRK: { Icon: HeartPulse, color: '#0093d0' },
  UNH: { Icon: HeartPulse, color: '#002677' },
  ROG: { Icon: HeartPulse, color: '#0066cc' },
  NOVN: { Icon: HeartPulse, color: '#0460a9' },
  AZN: { Icon: HeartPulse, color: '#003087' },
  BMY: { Icon: HeartPulse, color: '#cc0000' },
  ZTS: { Icon: HeartPulse, color: '#3b82f6' },
  MRNA: { Icon: HeartPulse, color: '#fb7185' },

  // Consumo básico
  WMT: { Icon: ShoppingCart, color: '#0071ce' },
  COST: { Icon: ShoppingCart, color: '#e31837' },
  KO: { Icon: ShoppingCart, color: '#f40009' },
  PG: { Icon: ShoppingCart, color: '#003da5' },
  PM: { Icon: ShoppingCart, color: '#4a1c6b' },
  NESN: { Icon: ShoppingCart, color: '#1e3a8a' },
  HSY: { Icon: ShoppingCart, color: '#744f2c' },
  MO: { Icon: ShoppingCart, color: '#0078d7' },

  // Consumo discrecional
  TSLA: { Icon: Car, color: '#cc0000' },
  HD: { Icon: ShoppingBag, color: '#f96302' },
  MELI: { Icon: ShoppingBag, color: '#00b1ea' },
  '9988': { Icon: ShoppingBag, color: '#ff6a00' },
  '7203': { Icon: Car, color: '#eb0a1e' },
  FIVE: { Icon: ShoppingBag, color: '#0078d7' },
  M: { Icon: ShoppingBag, color: '#cc0000' },
  LEA: { Icon: Car, color: '#00529b' },

  // Energía
  XOM: { Icon: Droplet, color: '#ed1c24' },
  CVX: { Icon: Droplet, color: '#0033a0' },
  SHEL: { Icon: Droplet, color: '#fbce07' },
  VLO: { Icon: Droplet, color: '#00529b' },
  COP: { Icon: Droplet, color: '#00529b' },
  EOG: { Icon: Droplet, color: '#164194' },
  MPC: { Icon: Droplet, color: '#00529b' },
  SM: { Icon: Droplet, color: '#0078d7' },
  CRC: { Icon: Droplet, color: '#00529b' },
  MGY: { Icon: Droplet, color: '#0078d7' },
  NEM: { Icon: Gem, color: '#b8860b' },

  // Industria / Materiales
  CAT: { Icon: Box, color: '#ffcd11' },
  GE: { Icon: Box, color: '#3b73b9' },
  RTX: { Icon: Box, color: '#00205b' },
  SIE: { Icon: Box, color: '#009999' },
  BHP: { Icon: Gem, color: '#e31323' },
  MATX: { Icon: Ship, color: '#00529b' },
  GATX: { Icon: TrainFront, color: '#00529b' },

  // Comunicación
  NFLX: { Icon: Signal, color: '#e50914' },
  '0700': { Icon: Signal, color: '#00a4e4' },
  VSAT: { Icon: Signal, color: '#0066cc' },

  // Liquidez / plataformas
  AIRTM: { Icon: Wallet, color: '#00C2A8' },
  DEEL: { Icon: Banknote, color: '#FF5C35' },
  BINANCE: { Icon: CircleDollarSign, color: '#F0B90B' },
  BYBIT: { Icon: Zap, color: '#F7A600' },

  // Crypto
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
  DAI: { Icon: DollarSign, color: '#f5ac37' },
};

// ─── Meta de sectores ──────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────

/**
 * Detecta plataforma.
 * Orden: source/groupKey ANTES que classification.platform
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
    const s = String(raw || '').trim().toLowerCase();
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
 */
export function getDisplayLabel(asset = {}) {
  const symbol = String(asset.symbol || '').trim().toUpperCase().split('/')[0];
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

  if (isStable && (platform === 'binance' || platform === 'bybit')) {
    return PLATFORM_LABEL[platform];
  }

  if (symbol) return symbol;
  if (name) return name;
  return '—';
}

/**
 * Clave limpia para SI_SLUGS / SYMBOL_LUCIDE.
 * - Quita sufijos de exchange
 * - Aplica aliases
 */
export function getIconSymbol(asset = {}) {
  let symbol = String(asset.symbol || '')
    .trim()
    .toUpperCase()
    .split('/')[0];

  const name = String(asset.name || '').trim().toUpperCase();
  const platform = resolvePlatformKey(asset);

  // Plataformas especiales
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

  // Stablecoin → logo de la plataforma
  const isStable =
    asset.type === 'stablecoin' ||
    ['USDT', 'USDC', 'BUSD', 'FDUSD', 'DAI', 'TUSD'].includes(symbol);

  if (isStable && platform === 'binance') return 'BINANCE';
  if (isStable && platform === 'bybit') return 'BYBIT';

  // Quitar sufijos de exchange
  const exchangeSuffixes = [
    '.KS', '.HK', '.SW', '.L', '.TO', '.T', '.AX', '.DE', '.MC',
    '.PA', '.MI', '.AS', '.OL', '.ST', '.CO', '.HE', '.WA', '.BR',
  ];
  for (const suffix of exchangeSuffixes) {
    if (symbol.endsWith(suffix)) {
      symbol = symbol.slice(0, -suffix.length);
      break;
    }
  }

  // Aliases
  const ALIASES = {
    '2330': 'TSM',
    '005930': 'SSNLF',
    '000660': '000660',
    '0700': '0700',
    '9988': '9988',
    'BRK.B': 'BRK.B',
    BRKB: 'BRK.B',
    ROG: 'ROG',
    NESN: 'NESN',
    HSBA: 'HSBA',
    NOVN: 'NOVN',
    SHEL: 'SHEL',
    AZN: 'AZN',
    SIE: 'SIE',
    BHP: 'BHP',
    CBA: 'CBA',
    SAN: 'SAN',
    '7203': '7203',
    TD: 'TD',
    RY: 'RY',
  };

  if (ALIASES[symbol]) symbol = ALIASES[symbol];

  return symbol || name || '';
}

export function resolveIconLucide(asset = {}) {
  const iconSymbol = getIconSymbol(asset);

  if (SYMBOL_LUCIDE[iconSymbol]) {
    return SYMBOL_LUCIDE[iconSymbol];
  }

  // Importaciones dinámicas de getRole / getSector si las tienes en otro archivo
  // Por ahora devolvemos fallback genérico si no existen
  const sector = asset.classification?.sector || asset.sector;
  const role = asset.classification?.role || asset.role;
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

// ─── Colores de tile ───────────────────────────────────────

export function tileBg(pnlPct, asset) {
  if (pnlPct !== null && pnlPct !== undefined) {
    if (pnlPct >= 5) return 'rgba(5,150,105,0.82)';
    if (pnlPct >= 2) return 'rgba(16,185,129,0.60)';
    if (pnlPct >= 0) return 'rgba(16,185,129,0.32)';
    if (pnlPct >= -2) return 'rgba(244,63,94,0.32)';
    if (pnlPct >= -5) return 'rgba(244,63,94,0.58)';
    return 'rgba(225,29,72,0.80)';
  }

  const sector = asset.classification?.sector || asset.sector;

  if (sector && SECTOR_META[sector]) {
    return SECTOR_META[sector].bg;
  }

  const role = asset.classification?.role || asset.role;

  if (role === 'trading') return 'rgba(168,85,247,0.15)';
  if (role === 'speculative') return 'rgba(244,63,94,0.15)';
  if (role === 'liquidity') return 'rgba(56,189,248,0.18)';

  return 'rgba(30,41,59,0.70)';
}