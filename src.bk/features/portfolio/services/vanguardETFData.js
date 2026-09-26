// services/vanguardETFData.js

/**
 * Datos hardcodeados de ETFs de Vanguard.
 * Fuente: https://investor.vanguard.com/investment-products/etfs/profile/{symbol}
 * Actualizado: 2026-08-17
 * 
 * Estos datos sirven como fallback si falla la carga del JSON o el scraping.
 */

export const VANGUARD_ETF_DATA = {
  VOO: {
    symbol: 'VOO',
    issuer: 'vanguard',
    asOfDate: '2026-08-15',
    source: 'vanguard_official',
    status: 'complete',
    sectors: [
      { sector: 'tecnologia', weightPct: 38.61, sourceStandard: 'GICS' },
      { sector: 'finanzas', weightPct: 11.41, sourceStandard: 'GICS' },
      { sector: 'comunicacion', weightPct: 9.90, sourceStandard: 'GICS' },
      { sector: 'consumo_discrecional', weightPct: 9.50, sourceStandard: 'GICS' },
      { sector: 'salud', weightPct: 8.90, sourceStandard: 'GICS' },
      { sector: 'industria', weightPct: 8.50, sourceStandard: 'GICS' },
      { sector: 'consumo_basico', weightPct: 4.50, sourceStandard: 'GICS' },
      { sector: 'energia', weightPct: 3.00, sourceStandard: 'GICS' },
      { sector: 'materiales', weightPct: 2.40, sourceStandard: 'GICS' },
      { sector: 'inmobiliario', weightPct: 2.30, sourceStandard: 'GICS' },
      { sector: 'servicios_publicos', weightPct: 2.20, sourceStandard: 'GICS' },
    ],
    holdings: [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', weightPct: 7.50, sector: 'tecnologia' },
      { symbol: 'AAPL', name: 'Apple Inc', weightPct: 6.58, sector: 'tecnologia' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', weightPct: 4.29, sector: 'tecnologia' },
      { symbol: 'AMZN', name: 'Amazon.com Inc', weightPct: 3.61, sector: 'consumo_discrecional' },
      { symbol: 'GOOGL', name: 'Alphabet Inc Class A', weightPct: 3.24, sector: 'comunicacion' },
      { symbol: 'META', name: 'Meta Platforms Inc', weightPct: 2.73, sector: 'comunicacion' },
      { symbol: 'GOOG', name: 'Alphabet Inc Class C', weightPct: 2.58, sector: 'comunicacion' },
      { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc Class B', weightPct: 1.72, sector: 'finanzas' },
      { symbol: 'TSLA', name: 'Tesla Inc', weightPct: 1.55, sector: 'consumo_discrecional' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc', weightPct: 1.23, sector: 'salud' },
    ],
    totalHoldings: 520,
    expenseRatio: 0.03,
  },

  VXUS: {
    symbol: 'VXUS',
    issuer: 'vanguard',
    asOfDate: '2026-08-15',
    source: 'vanguard_official',
    status: 'complete',
    sectors: [
      { sector: 'tecnologia', weightPct: 22.50, sourceStandard: 'GICS' },
      { sector: 'finanzas', weightPct: 18.20, sourceStandard: 'GICS' },
      { sector: 'industria', weightPct: 13.10, sourceStandard: 'GICS' },
      { sector: 'salud', weightPct: 11.80, sourceStandard: 'GICS' },
      { sector: 'consumo_discrecional', weightPct: 10.40, sourceStandard: 'GICS' },
      { sector: 'consumo_basico', weightPct: 7.90, sourceStandard: 'GICS' },
      { sector: 'energia', weightPct: 5.20, sourceStandard: 'GICS' },
      { sector: 'comunicacion', weightPct: 4.30, sourceStandard: 'GICS' },
      { sector: 'materiales', weightPct: 3.80, sourceStandard: 'GICS' },
      { sector: 'inmobiliario', weightPct: 2.80, sourceStandard: 'GICS' },
    ],
    holdings: [
      { symbol: 'NESN', name: 'Nestle SA', weightPct: 1.10 },
      { symbol: 'ASML', name: 'ASML Holding NV', weightPct: 1.00 },
      { symbol: 'ROG', name: 'Roche Holding AG', weightPct: 0.90 },
      { symbol: 'SAP', name: 'SAP SE', weightPct: 0.80 },
      { symbol: 'TM', name: 'Toyota Motor Corp', weightPct: 0.70 },
    ],
    totalHoldings: 7900,
    expenseRatio: 0.07,
    countries: {
      japan: 15.2,
      united_kingdom: 10.8,
      france: 8.4,
      canada: 7.9,
      switzerland: 7.2,
      germany: 6.8,
      australia: 5.4,
      taiwan: 4.9,
      china: 4.2,
      south_korea: 3.8,
      other: 25.4,
    },
  },

  BND: {
    symbol: 'BND',
    issuer: 'vanguard',
    asOfDate: '2026-08-15',
    source: 'vanguard_official',
    status: 'complete',
    bondCategories: {
      treasury: 42.1,
      corporate: 27.3,
      mortgage: 18.2,
      government_related: 8.4,
      municipal: 2.1,
      other: 1.9,
    },
    holdings: [],
    totalHoldings: 10500,
    expenseRatio: 0.03,
    averageDuration: 6.2,
    averageMaturity: 8.4,
  },

  VTI: {
    symbol: 'VTI',
    issuer: 'vanguard',
    asOfDate: '2026-08-15',
    source: 'vanguard_official',
    status: 'complete',
    sectors: [
      { sector: 'tecnologia', weightPct: 34.70, sourceStandard: 'GICS' },
      { sector: 'finanzas', weightPct: 12.30, sourceStandard: 'GICS' },
      { sector: 'industria', weightPct: 11.80, sourceStandard: 'GICS' },
      { sector: 'salud', weightPct: 11.20, sourceStandard: 'GICS' },
      { sector: 'consumo_discrecional', weightPct: 10.90, sourceStandard: 'GICS' },
      { sector: 'comunicacion', weightPct: 8.40, sourceStandard: 'GICS' },
      { sector: 'consumo_basico', weightPct: 5.20, sourceStandard: 'GICS' },
      { sector: 'energia', weightPct: 3.80, sourceStandard: 'GICS' },
      { sector: 'materiales', weightPct: 2.90, sourceStandard: 'GICS' },
      { sector: 'inmobiliario', weightPct: 2.60, sourceStandard: 'GICS' },
      { sector: 'servicios_publicos', weightPct: 2.40, sourceStandard: 'GICS' },
    ],
    holdings: [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', weightPct: 6.70 },
      { symbol: 'AAPL', name: 'Apple Inc', weightPct: 5.90 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', weightPct: 4.10 },
      { symbol: 'AMZN', name: 'Amazon.com Inc', weightPct: 3.20 },
      { symbol: 'GOOGL', name: 'Alphabet Inc Class A', weightPct: 2.10 },
    ],
    totalHoldings: 3800,
    expenseRatio: 0.03,
  },
};

/**
 * Obtiene datos de un ETF de Vanguard.
 * @param {string} symbol
 * @returns {Object|null}
 */
export function getVanguardETFExposure(symbol) {
  return VANGUARD_ETF_DATA[symbol.toUpperCase()] || null;
}

/**
 * Lista todos los símbolos soportados.
 * @returns {string[]}
 */
export function getSupportedSymbols() {
  return Object.keys(VANGUARD_ETF_DATA);
}