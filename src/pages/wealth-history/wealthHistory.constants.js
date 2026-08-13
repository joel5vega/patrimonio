export const PERIODS = [
  { key: '1W', label: '1S', days: 7 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
  { key: '1Y', label: '1A', days: 365 },
  { key: 'ALL', label: 'Todo', days: 9999 },
];

export const VIEW_MODES = [
  { key: 'summary', label: 'Resumen' },
  { key: 'allocation', label: 'Composición' },
  { key: 'history', label: 'Evolución' },
];

export const FIXED_TYPES = [
  { key: 'total', label: 'Total financiero', field: 'totalPortfolioUSD', color: '#14b8a6', icon: 'wallet' },
  { key: 'crypto', label: 'Crypto', field: 'cryptoUSD', color: '#f97316', icon: 'coins' },
  { key: 'etfs', label: 'ETFs', field: 'inversionUSD', color: '#3b82f6', icon: 'chart' },
];

export const SPECIAL_TODO = { key: 'todo_full', label: 'Total + ahorro Bs', color: '#22c55e', icon: 'layers' };

export const ROLE_TYPES = [
  { key: 'role_trading', label: 'Trading', color: '#ec4899', icon: 'activity' },
  { key: 'role_yield', label: 'Yield', color: '#a855f7', icon: 'percent' },
  { key: 'role_reserve', label: 'Reservas', color: '#facc15', icon: 'shield' },
  // Patrimonio permanece disponible como serie individual.
  { key: 'role_patrimony', label: 'Patrimonio', color: '#06b6d4', icon: 'landmark' },
];

export const MANUAL_PALETTE = ['#a855f7', '#ec4899', '#facc15', '#10b981'];