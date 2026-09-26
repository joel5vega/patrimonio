export const ROLE_COLORS = {
  core: '#2b7fff',
  growth: '#5a9fff',
  defensive: '#a4a19b',
  liquidity: '#eeeeee',
  yield: '#2b7fff',
  speculative: '#e05a68',
  trading: '#5a9fff',
  reserve: '#5e5d59',
  patrimony: '#eeeeee',
};

export const SECTOR_LABELS = {
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
  '#2b7fff',
  '#5a9fff',
  '#a4a19b',
  '#eeeeee',
  '#5e5d59',
  '#1a365d',
  '#323232',
  '#e05a68',
  '#c9a227',
  '#4b4b4b',
];

export const labelSector = (sector) =>
  SECTOR_LABELS[sector] || String(sector).replaceAll('_', ' ');

export const SOURCE_COLORS = {
  binance: '#c9a227',
  admirals: '#2b7fff',
  quantfury: '#5a9fff',
  manual: '#a4a19b',
};

export const STATUS_COLORS = {
  good: '#2b7fff',
  warning: '#c9a227',
  critical: '#e05a68',
  info: '#2b7fff',
};
