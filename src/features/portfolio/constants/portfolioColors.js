export const ROLE_COLORS = {
  core: '#3b82f6',
  growth: '#10b981',
  defensive: '#facc15',
  liquidity: '#06b6d4',
  yield: '#14b8a6',
  speculative: '#f43f5e',
  trading: '#a855f7',
  reserve: '#94a3b8',
  patrimony: '#f97316',
};

export const  SECTOR_LABELS = {
  tecnologia: 'Tecnología',
  salud: 'Salud',
  defensa: 'Defensa',
  consumo_basico: 'Consumo básico',
  consumo_discrecional: 'Consumo discrecional',
  finanzas: 'Finanzas',
  energia: 'Energía',
  energia_renovable: 'Energía renovable',
  materiales: 'Materiales',
  inmobiliario_cotizado: 'Inmobiliario cotizado',
  bonos_gobierno: 'Bonos gobierno',
  bonos_inflacion: 'Bonos inflación',
  crypto_l1: 'Crypto L1',
  crypto_l2: 'Crypto L2',
  crypto_defi: 'Crypto DeFi',
  crypto_stablecoin: 'Stablecoins',
  crypto_pagos: 'Crypto pagos',
  crypto_meme: 'Crypto meme',
  metales_preciosos: 'Metales preciosos',
  mineria: 'Minería',
  efectivo_global: 'Efectivo global',
  diversificado_eeuu: 'Diversificado EE. UU.',
  diversificado_global: 'Diversificado global',
  emergentes: 'Mercados emergentes',
  dividendos_value: 'Dividendos / value',
  otros: 'Otros',
};

export const SECTOR_COLORS = [
  '#22d3ee',
  '#60a5fa',
  '#34d399',
  '#facc15',
  '#fb7185',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#f472b6',
  '#94a3b8',
];

export const labelSector = (sector) =>
  SECTOR_LABELS[sector] || String(sector).replaceAll('_', ' ');

export const SOURCE_COLORS = {
  binance: '#f97316',
  admirals: '#3b82f6',
  quantfury: '#a855f7',
  manual: '#14b8a6',
};

export const STATUS_COLORS = {
  good: '#10b981',
  warning: '#facc15',
  critical: '#f43f5e',
  info: '#60a5fa',
};
