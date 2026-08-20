// ─── CLASIFICACIÓN DE ACTIVOS ─────────────────────────────────

export const ASSET_RULES = {
  VOO: {
    role: 'core',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 2,
    sector: 'diversificado_eeuu',
  },

  SPY: {
    role: 'core',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 2,
    sector: 'diversificado_eeuu',
  },

  VTI: {
    role: 'core',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 2,
    sector: 'diversificado_eeuu',
  },

  IVV: {
    role: 'core',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 2,
    sector: 'diversificado_eeuu',
  },

  QQQM: {
    role: 'growth',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  QQQ: {
    role: 'growth',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  VXUS: {
    role: 'growth',
    assetClass: 'renta_variable',
    subClass: 'fondos_internacionales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'diversificado_global',
  },

  VWO: {
    role: 'growth',
    assetClass: 'renta_variable',
    subClass: 'fondos_internacionales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'emergentes',
  },

  EMXC: {
    role: 'growth',
    assetClass: 'renta_variable',
    subClass: 'fondos_internacionales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'emergentes',
  },

  SCHD: {
    role: 'defensive',
    assetClass: 'renta_variable',
    subClass: 'fondos_eeuu',
    horizon: 'long',
    riskLevel: 2,
    sector: 'dividendos_value',
  },

  BND: {
    role: 'defensive',
    assetClass: 'renta_fija',
    subClass: 'fondos_bonos',
    horizon: 'long',
    riskLevel: 2,
    sector: 'bonos_gobierno',
  },

  TIP: {
    role: 'defensive',
    assetClass: 'renta_fija',
    subClass: 'bonos_gobierno',
    horizon: 'long',
    riskLevel: 2,
    sector: 'bonos_inflacion',
  },

  AGG: {
    role: 'defensive',
    assetClass: 'renta_fija',
    subClass: 'fondos_bonos',
    horizon: 'long',
    riskLevel: 2,
    sector: 'bonos_gobierno',
  },

  VNQ: {
    role: 'defensive',
    assetClass: 'inmobiliario',
    subClass: 'reit',
    horizon: 'long',
    riskLevel: 2,
    sector: 'inmobiliario_cotizado',
  },

  IAU: {
    role: 'defensive',
    assetClass: 'alternativos',
    subClass: 'metales',
    horizon: 'long',
    riskLevel: 1,
    sector: 'metales_preciosos',
  },

  GLD: {
    role: 'defensive',
    assetClass: 'alternativos',
    subClass: 'metales',
    horizon: 'long',
    riskLevel: 1,
    sector: 'metales_preciosos',
  },

  SLV: {
    role: 'defensive',
    assetClass: 'alternativos',
    subClass: 'metales',
    horizon: 'long',
    riskLevel: 2,
    sector: 'metales_preciosos',
  },

  GDX: {
    role: 'growth',
    assetClass: 'alternativos',
    subClass: 'metales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'mineria',
  },

  BTC: {
    role: 'growth',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'long',
    riskLevel: 3,
    sector: 'crypto_l1',
  },

  ETH: {
    role: 'growth',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'long',
    riskLevel: 3,
    sector: 'crypto_l1',
  },

  BNB: {
    role: 'growth',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'long',
    riskLevel: 3,
    sector: 'crypto_l1',
  },

  SOL: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_l1',
  },

  AVAX: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_l1',
  },

  ADA: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 5,
    sector: 'crypto_l1',
  },

  XRP: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 5,
    sector: 'crypto_pagos',
  },

  DOT: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_l1',
  },

  MATIC: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_l2',
  },

  LINK: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_defi',
  },

  UNI: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 5,
    sector: 'crypto_defi',
  },

  AAVE: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 5,
    sector: 'crypto_defi',
  },

  DOGE: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'short',
    riskLevel: 5,
    sector: 'crypto_meme',
  },

  SHIB: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'short',
    riskLevel: 5,
    sector: 'crypto_meme',
  },

  PEPE: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'short',
    riskLevel: 5,
    sector: 'crypto_meme',
  },

  HBAR: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_l1',
  },

  POL: {
    role: 'speculative',
    assetClass: 'alternativos',
    subClass: 'crypto',
    horizon: 'medium',
    riskLevel: 4,
    sector: 'crypto_l2',
  },

  SGOV: {
    role: 'liquidity',
    assetClass: 'efectivo',
    subClass: 'cash_equivalent',
    horizon: 'short',
    riskLevel: 1,
    sector: 'efectivo_global',
  },

  USDT: {
    role: 'liquidity',
    assetClass: 'efectivo',
    subClass: 'cash',
    horizon: 'short',
    riskLevel: 1,
    sector: 'crypto_stablecoin',
  },

  USDC: {
    role: 'liquidity',
    assetClass: 'efectivo',
    subClass: 'cash',
    horizon: 'short',
    riskLevel: 1,
    sector: 'crypto_stablecoin',
  },

  BUSD: {
    role: 'liquidity',
    assetClass: 'efectivo',
    subClass: 'cash',
    horizon: 'short',
    riskLevel: 1,
    sector: 'crypto_stablecoin',
  },

  DAI: {
    role: 'liquidity',
    assetClass: 'efectivo',
    subClass: 'cash',
    horizon: 'short',
    riskLevel: 1,
    sector: 'crypto_stablecoin',
  },

  FDUSD: {
    role: 'liquidity',
    assetClass: 'efectivo',
    subClass: 'cash',
    horizon: 'short',
    riskLevel: 1,
    sector: 'crypto_stablecoin',
  },

  CEG: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'energia',
  },

  MSFT: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  AAPL: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  GOOGL: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  GOOG: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  META: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  AMZN: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  NVDA: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 4,
    sector: 'tecnologia',
  },

  TSLA: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 4,
    sector: 'tecnologia',
  },

  AMD: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 4,
    sector: 'tecnologia',
  },

  INTC: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  CRM: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  ORCL: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'tecnologia',
  },

  JNJ: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 2,
    sector: 'salud',
  },

  PFE: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 2,
    sector: 'salud',
  },

  JPM: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'finanzas',
  },

  BAC: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 3,
    sector: 'finanzas',
  },

  XOM: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 2,
    sector: 'energia',
  },

  CVX: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 2,
    sector: 'energia',
  },

  KO: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 1,
    sector: 'consumo_basico',
  },

  PG: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 1,
    sector: 'consumo_basico',
  },

  VZ: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 2,
    sector: 'telecomunicaciones',
  },

  T: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 2,
    sector: 'telecomunicaciones',
  },

  MELI: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'short',
    riskLevel: 4,
    sector: 'consumo_discrecional',
  },

  FXI: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'fondos_internacionales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'emergentes',
  },

  MCHI: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'fondos_internacionales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'emergentes',
  },

  ECL: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'industria',
  },

  HSY: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'consumo_basico',
  },

  SCHW: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'finanzas',
  },

  ZTS: {
    role: 'trading',
    assetClass: 'renta_variable',
    subClass: 'acciones_individuales',
    horizon: 'long',
    riskLevel: 3,
    sector: 'salud',
  },

};


// ─── REGLAS MANUALES ───────────────────────────────────────────

export const MANUAL_RULES = {
  airtm: {
    role: 'yield',
    assetClass: 'efectivo',
    subClass: 'cash_equivalent',
    sector: 'stablecoin_yield',
    horizon: 'short',
    riskLevel: 2,
    isLocked: false,
    isInvestable: true,
    isDeFi: true,
    aprPct: 6,
  },

  safi: {
    role: 'reserve',
    assetClass: 'efectivo',
    subClass: 'cash_local',
    horizon: 'medium',
    riskLevel: 2,
    isLocked: true,
    isInvestable: false,
    isLocalPrivateEquity: true,
  },

  'ahorro $': {
    role: 'reserve',
    assetClass: 'efectivo',
    subClass: 'cash_fisico',
    horizon: 'medium',
    riskLevel: 1,
    isLocked: true,
    isInvestable: false,
  },

  'ahorro en bs': {
    role: 'reserve',
    assetClass: 'efectivo',
    subClass: 'cash_local',
    horizon: 'medium',
    riskLevel: 1,
    isLocked: true,
    isInvestable: false,
  },

  'ahorro bs': {
    role: 'reserve',
    assetClass: 'efectivo',
    subClass: 'cash_local',
    horizon: 'medium',
    riskLevel: 1,
    isLocked: true,
    isInvestable: false,
  },

  't ach': {
    role: 'patrimony',
    assetClass: 'inmobiliario',
    subClass: 'propiedad_fisica',
    horizon: 'very_long',
    riskLevel: 2,
    isInvestable: false,
  },

  't sas': {
    role: 'patrimony',
    assetClass: 'inmobiliario',
    subClass: 'propiedad_fisica',
    horizon: 'very_long',
    riskLevel: 2,
    isInvestable: false,
  },

  't achacachi': {
    role: 'patrimony',
    assetClass: 'inmobiliario',
    subClass: 'propiedad_fisica',
    horizon: 'very_long',
    riskLevel: 2,
    isInvestable: false,
  },
};
// ─── SUPUESTOS DE RETORNO ──────────────────────────────────────
export const RETURN_ASSUMPTIONS = {
  renta_variable: 0.08,
  alternativos: 0.10,
  inmobiliario: 0.05,
  private_equity: 0.12,
  renta_fija: 0.03,
  efectivo: 0.03,
};



// ─── POLÍTICA DE TRANSACCIONES ────────────────────────────────
//
// La comisión de USD 1 hace ineficiente dividir una aportación
// mensual pequeña entre demasiadas operaciones.
//

export const TRANSACTION_POLICY = {
  commissionUSD: 1,
  maxMonthlyOpportunities: 2,
  minOpportunityUSD: 50,
};


// ─── UMBRALES ─────────────────────────────────────────────────

export const THRESHOLDS = {
  minCashPct: 3,
  cashRetentionPct: 7,
  maxCashPct: 25,

  maxSpeculativePct: 3,
  coreMinPct: 30,
  maxTradingPct: 7,

  criticalUnderweightPct: 3,
};


// ─── OBJETIVOS DEL PORTFOLIO ──────────────────────────────────
//
// Estos son los objetivos usados en el snapshot actual.
//

export const PORTFOLIO_TARGETS = {
  core: 35,
  growth: 20,
  defensive: 17,
  liquidity: 4,
  yield: 15,
  speculative: 3,
  trading: 6,
};

export const PORTFOLIOTARGETS = PORTFOLIO_TARGETS;


// ─── PERFILES ─────────────────────────────────────────────────

export const INVESTOR_PROFILES = {
  defensivo: {
    label: 'Defensivo',
    description: 'Preservar capital.',
    targets: {
      core: 45,
      growth: 10,
      defensive: 25,
      liquidity: 8,
      yield: 10,
      speculative: 1,
      trading: 1,
    },
  },

  moderado: {
    label: 'Moderado',
    description: 'Balance entre crecimiento y protección.',
    targets: PORTFOLIO_TARGETS,
  },

  crecimiento: {
    label: 'Crecimiento',
    description: 'Maximizar rendimiento.',
    targets: {
      core: 30,
      growth: 30,
      defensive: 10,
      liquidity: 5,
      yield: 12,
      speculative: 6,
      trading: 7,
    },
  },

  agresivo: {
    label: 'Agresivo',
    description: 'Alta exposición a crecimiento y activos de riesgo.',
    targets: {
      core: 20,
      growth: 35,
      defensive: 5,
      liquidity: 5,
      yield: 10,
      speculative: 15,
      trading: 10,
    },
  },

  personalizado: {
    label: 'Personalizado',
    description: 'Ajuste manual.',
    targets: null,
  },
};


export  const rolePriority = {
    liquidity: 80,
    core: 90,
    yield: 70,
    growth: 60,
    defensive: 50,
    trading: 30,
    speculative: 20,
  };