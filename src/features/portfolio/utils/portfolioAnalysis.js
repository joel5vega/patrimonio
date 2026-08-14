// ─────────────────────────────────────────────────────────────
// portfolioAnalysis.js — versión refactorizada
// Perfil: inversor boliviano, mediano/largo plazo
// Plataformas: Binance, Quantfury, AirTM DeFi
// ─────────────────────────────────────────────────────────────

// ─── CLASIFICACIÓN DE ACTIVOS ─────────────────────────────────
// sector: clasificación por industria/sector económico

const ASSET_RULES = {
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
    sector: 'energia_renovable',
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
};

export const MANUAL_RULES = {
  airtm: {
    role: 'yield',
    assetClass: 'efectivo',
    subClass: 'cash_equivalent',
    horizon: 'short',
    riskLevel: 2,
    isLocked: false,
    isInvestable: true,
    isDeFi: true,
    aprPct: 8,
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

export const RETURN_ASSUMPTIONS = {
  renta_variable: 0.08,
  alternativos: 0.10,
  inmobiliario: 0.05,
  private_equity: 0.12,
  renta_fija: 0.03,
  efectivo: 0.03,
};

export const THRESHOLDS = {
  minCashPct: 5,
  cashRetentionPct: 7,
  maxCashPct: 25,
  maxSpeculativePct: 3,
  coreMinPct: 30,
  maxTradingPct: 7,
};

export const PORTFOLIO_TARGETS = {
  core: 35,
  growth: 20,
  defensive: 17,
  liquidity: 5,
  yield: 15,
  speculative: 3,
  trading: 5,
};

// Alias de compatibilidad con la nueva arquitectura.
export const PORTFOLIOTARGETS = PORTFOLIO_TARGETS;

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
      core: 25,
      growth: 35,
      defensive: 8,
      liquidity: 5,
      yield: 12,
      speculative: 8,
      trading: 7,
    },
  },
  agresivo: {
    label: 'Agresivo',
    description: 'Alta exposición a crypto y growth.',
    targets: {
      core: 15,
      growth: 35,
      defensive: 5,
      liquidity: 5,
      yield: 10,
      speculative: 20,
      trading: 10,
    },
  },
  personalizado: {
    label: 'Personalizado',
    description: 'Ajuste manual.',
    targets: null,
  },
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeAssetKey(symbol, name) {
  const raw = String(symbol || name || '')
    .toUpperCase()
    .trim();

  return raw
    .split('/')[0]
    .split('-')[0]
    .split(' ')[0]
    .trim();
}

function normalizeType(type) {
  return normalizeText(type);
}

function normalizeGroupKey(groupKey) {
  return normalizeText(groupKey);
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function classifyAsset(name, type, groupKey, symbol) {
  const normalizedName = normalizeText(name);
  const normalizedType = normalizeType(type);
  const normalizedGroup = normalizeGroupKey(groupKey);

  // Las reglas manuales tienen prioridad sobre las reglas por símbolo.
  // Esto evita que patrimonio físico o reservas caigan en un fallback invertible.
  const manual = MANUAL_RULES[normalizedName];

  if (manual) {
    return {
      ...manual,
      role: manual.role || 'reserve',
      isInvestable: manual.isInvestable ?? false,
      classificationSource: 'manual_rules',
    };
  }

  const key = normalizeAssetKey(symbol, name);
  const rule = ASSET_RULES[key];

  if (rule) {
    return {
      ...rule,
      isInvestable: rule.isInvestable ?? true,
      classificationSource: 'asset_rules',
    };
  }

  if (normalizedType === 'stock' && normalizedGroup === 'quantfury') {
    return {
      role: 'trading',
      assetClass: 'renta_variable',
      subClass: 'acciones_individuales',
      sector: 'otros',
      horizon: 'short',
      riskLevel: 4,
      isInvestable: true,
      classificationSource: 'quantfury_fallback',
    };
  }

  if (normalizedType === 'crypto') {
    return {
      role: 'growth',
      assetClass: 'alternativos',
      subClass: 'crypto',
      sector: 'crypto_l1',
      horizon: 'long',
      riskLevel: 4,
      isInvestable: true,
      classificationSource: 'crypto_fallback',
    };
  }

  if (normalizedType === 'etf') {
    return {
      role: 'growth',
      assetClass: 'renta_variable',
      subClass: 'fondos_eeuu',
      sector: 'otros',
      horizon: 'long',
      riskLevel: 3,
      isInvestable: true,
      classificationSource: 'etf_fallback',
    };
  }

  return {
    role: 'unclassified',
    assetClass: 'unclassified',
    subClass: 'unclassified',
    sector: 'otros',
    horizon: 'unknown',
    riskLevel: 0,
    isInvestable: true,
    classificationSource: 'fallback',
  };
}

function buildStrategy(role, context) {
  const strategies = {
    core: {
      accumulate: true,
      hold: true,
      reduce: false,
      useForTrading: false,
    },

    growth: {
      accumulate: true,
      hold: true,
      reduce: false,
      useForTrading: false,
    },

    defensive: {
      accumulate: false,
      hold: true,
      reduce: false,
      useForTrading: false,
    },

    liquidity: {
      accumulate: false,
      hold: true,
      reduce: false,
      useForTrading: false,
    },

    yield: {
      accumulate: true,
      hold: true,
      reduce: false,
      useForTrading: false,
    },

    speculative: {
      accumulate: false,
      hold: false,
      reduce: false,
      useForTrading: false,
    },

    trading: {
      accumulate: false,
      hold: false,
      reduce: false,
      useForTrading: true,
    },

    reserve: {
      accumulate: false,
      hold: true,
      reduce: false,
      useForTrading: false,
    },

    patrimony: {
      accumulate: false,
      hold: true,
      reduce: false,
      useForTrading: false,
    },
  };

  const strategy = {
    ...(strategies[role] || strategies.liquidity),
  };

  if (role === 'liquidity') {
    strategy.reduce =
      context.cashPct > THRESHOLDS.maxCashPct;
  }

  if (role === 'speculative') {
    strategy.reduce =
      context.speculativePct > context.activeTargets.speculative;
  }

  if (role === 'trading') {
    strategy.reduce =
      context.tradingPct > context.activeTargets.trading;
  }

  return strategy;
}

function normalizeTargets(targets) {
  const source =
    targets && typeof targets === 'object'
      ? targets
      : PORTFOLIO_TARGETS;

  return Object.fromEntries(
    Object.entries(source)
      .filter(
        ([role, target]) =>
          role &&
          Number.isFinite(Number(target)),
      )
      .map(([role, target]) => [
        role,
        Math.max(0, Number(target)),
      ]),
  );
}

function getAssetValue(asset) {
  return Math.max(
    0,
    toFiniteNumber(asset?.valueUSD),
  );
}

function groupByValue(assets, key) {
  return assets.reduce((result, asset) => {
    const group =
      asset.classification?.[key] ||
      'unclassified';

    result[group] =
      (result[group] || 0) +
      getAssetValue(asset);

    return result;
  }, {});
}

function percentageMap(values, denominator) {
  if (denominator <= 0) {
    return Object.fromEntries(
      Object.keys(values).map((key) => [
        key,
        0,
      ]),
    );
  }

  return Object.fromEntries(
    Object.entries(values).map(
      ([key, value]) => [
        key,
        round(
          (value / denominator) * 100,
          4,
        ),
      ],
    ),
  );
}

function buildRebalancePlan({
  portfolioAssets,
  byRolePct,
  investableUSD,
  monthlyUSD,
  investableCashUSD,
  activeTargets,
}) {
  const deficits = Object.entries(activeTargets)
    .map(([role, target]) => {
      const current =
        toFiniteNumber(
          byRolePct[role],
        );

      return {
        role,
        target: Number(target),
        current,
        diff:
          Number(target) - current,
      };
    })
    .filter(
      ({ diff }) => diff > 0,
    )
    .sort(
      (a, b) => b.diff - a.diff,
    );

  const totalDeficit = deficits.reduce(
    (sum, item) =>
      sum + item.diff,
    0,
  );

  if (totalDeficit <= 0) {
    return {
      remainingCash: round(
        Math.max(
          0,
          investableUSD *
            (THRESHOLDS.cashRetentionPct /
              100),
        ),
      ),
      deployableCash: 0,
      monthlyUSD: round(
        Math.max(
          0,
          monthlyUSD,
        ),
      ),
      monthly: [],
      lumpSum: [],
      actions: [],
    };
  }

  const assetsByRole =
    portfolioAssets.reduce(
      (result, asset) => {
        const role =
          asset.classification?.role ||
          'unclassified';

        (result[role] ||= []).push(
          asset,
        );

        return result;
      },
      {},
    );

  const candidateForRole = (role) => {
    return (
      assetsByRole[role] || []
    )
      .filter(
        (asset) =>
          asset.classification
            ?.isInvestable !== false &&
          getAssetValue(asset) > 0,
      )
      .sort(
        (a, b) =>
          getAssetValue(a) -
          getAssetValue(b),
      )[0];
  };

  const createActions = (
    budget,
    minimumAmount,
    fundingSource,
  ) => {
    const safeBudget = Math.max(
      0,
      toFiniteNumber(budget),
    );

    const actions = [];
    let allocated = 0;

    if (safeBudget <= 0) {
      return actions;
    }

    for (const deficit of deficits) {
      const candidate =
        candidateForRole(
          deficit.role,
        );

      if (!candidate) {
        continue;
      }

      const proportionalAmount =
        (deficit.diff /
          totalDeficit) *
        safeBudget;

      const amount = Math.min(
        proportionalAmount,
        safeBudget - allocated,
      );

      if (
        amount < minimumAmount
      ) {
        continue;
      }

      actions.push({
        action: 'BUY',
        asset:
          candidate.symbol ||
          candidate.name,
        role: deficit.role,
        amountUSD: round(amount),
        reason: `${deficit.role} underweight`,
        currentPct: round(
          deficit.current,
          4,
        ),
        targetPct: round(
          deficit.target,
          4,
        ),
        differencePct: round(
          deficit.diff,
          4,
        ),
        fundingSource,
      });

      allocated += amount;

      if (
        allocated >=
        safeBudget
      ) {
        break;
      }
    }

    return actions;
  };

  const monthlyAmount =
    Math.max(
      0,
      toFiniteNumber(
        monthlyUSD,
      ),
    );

  const monthly =
    createActions(
      monthlyAmount,
      15,
      'monthly_contribution',
    );

  const minimumCash =
    Math.max(
      0,
      investableUSD *
        (THRESHOLDS.cashRetentionPct /
          100),
    );

  const deployableCash =
    Math.max(
      0,
      investableCashUSD -
        minimumCash,
    );

  const lumpSum =
    deployableCash >= 100
      ? createActions(
          deployableCash,
          50,
          'available_cash',
        )
      : [];

  return {
    remainingCash:
      round(minimumCash),

    deployableCash:
      round(deployableCash),

    monthlyUSD:
      round(monthlyAmount),

    monthly,

    lumpSum,

    actions:
      lumpSum.length
        ? lumpSum
        : monthly,
  };
}

function buildSectorAnalysisInternal(
  investableAssets,
  investableUSD,
) {
  const sectorValues = {};
  const sectorAssets = {};

  for (const asset of investableAssets) {
    const valueUSD =
      getAssetValue(asset);

    if (valueUSD <= 0) {
      continue;
    }

    const sector =
      asset.classification
        ?.sector ||
      'otros';

    sectorValues[sector] =
      (sectorValues[sector] ||
        0) + valueUSD;

    (
      sectorAssets[sector] ||= []
    ).push(asset);
  }

  const sectors = Object.entries(
    sectorValues,
  )
    .map(
      ([sector, valueUSD]) => ({
        sector,

        valueUSD:
          round(valueUSD),

        pct:
          investableUSD > 0
            ? round(
                (valueUSD /
                  investableUSD) *
                  100,
                4,
              )
            : 0,

        assets:
          sectorAssets[sector]
            .slice()
            .sort(
              (a, b) =>
                getAssetValue(b) -
                getAssetValue(a),
            )
            .map((asset) => ({
              symbol:
                asset.symbol ||
                asset.name,

              name: asset.name,

              valueUSD:
                round(
                  getAssetValue(
                    asset,
                  ),
                ),

              pct:
                valueUSD > 0
                  ? round(
                      (getAssetValue(
                        asset,
                      ) /
                        valueUSD) *
                        100,
                      4,
                    )
                  : 0,
            })),
      }),
    )
    .sort(
      (a, b) =>
        b.valueUSD -
        a.valueUSD,
    );

  return {
    sectors,

    dominantSector:
      sectors[0] || null,

    totalSectorUSD:
      round(
        sectors.reduce(
          (sum, sector) =>
            sum +
            sector.valueUSD,
          0,
        ),
      ),
  };
}

export function buildPortfolioV3({
  allAssets = [],
  totalUSD = 0,
  reservedBUY = 0,
  pendingSELL = 0,
  grossExposure = 0,
  monthlyUSD = 190,
  customTargets = null,
} = {}) {
  const sourceAssets =
    Array.isArray(allAssets)
      ? allAssets
      : [];

  const calculatedTotalUSD =
    sourceAssets.reduce(
      (sum, asset) =>
        sum +
        getAssetValue(asset),
      0,
    );

  const suppliedTotalUSD =
    toFiniteNumber(
      totalUSD,
    );

  const effectiveTotalUSD =
    suppliedTotalUSD > 0
      ? suppliedTotalUSD
      : calculatedTotalUSD;

  const activeTargets =
    normalizeTargets(
      customTargets,
    );

  const enriched =
    sourceAssets.map(
      (asset) => {
        const classification =
          classifyAsset(
            asset?.name,
            asset?.type,
            asset?.groupKey,
            asset?.symbol,
          );

        const valueUSD =
          round(
            getAssetValue(asset),
          );

        return {
          ...asset,

          valueUSD,

          weightPct:
            effectiveTotalUSD > 0
              ? round(
                  (valueUSD /
                    effectiveTotalUSD) *
                    100,
                )
              : 0,

          classification,
        };
      },
    );

  const patrimonyAssets =
    enriched.filter(
      (asset) =>
        asset.classification
          .role ===
        'patrimony',
    );

  const reserveAssets =
    enriched.filter(
      (asset) =>
        asset.classification
          .role ===
        'reserve',
    );

  const portfolioAssets =
    enriched.filter(
      (asset) =>
        ![
          'patrimony',
          'reserve',
        ].includes(
          asset.classification
            .role,
        ),
    );

  const patrimonyUSD =
    patrimonyAssets.reduce(
      (sum, asset) =>
        sum +
        getAssetValue(asset),
      0,
    );

  const reserveUSD =
    reserveAssets.reduce(
      (sum, asset) =>
        sum +
        getAssetValue(asset),
      0,
    );

  // El universo de inversión se define por rol,
  // no por una resta dependiente del total suministrado.
  const investableUSD =
    portfolioAssets.reduce(
      (sum, asset) =>
        sum +
        getAssetValue(asset),
      0,
    );

  const byRoleUSD =
    groupByValue(
      portfolioAssets,
      'role',
    );

  const byAssetClassUSD =
    groupByValue(
      portfolioAssets,
      'assetClass',
    );

  const bySubClassUSD =
    portfolioAssets.reduce(
      (result, asset) => {
        const assetClass =
          asset.classification
            ?.assetClass ||
          'unclassified';

        const subClass =
          asset.classification
            ?.subClass ||
          'other';

        const key =
          `${assetClass}__${subClass}`;

        result[key] =
          (result[key] || 0) +
          getAssetValue(asset);

        return result;
      },
      {},
    );

  // Liquidez operativa:
  // USDT/USDC/SGOV cuentan como liquidez.
  // AirTM queda como yield, no como cash operativo.
  const investableCashUSD =
    portfolioAssets
      .filter(
        (asset) =>
          asset.classification
            ?.assetClass ===
            'efectivo' &&
          asset.classification
            ?.role ===
            'liquidity' &&
          asset.classification
            ?.isInvestable !==
            false &&
          !asset.classification
            ?.isDeFi,
      )
      .reduce(
        (sum, asset) =>
          sum +
          getAssetValue(asset),
        0,
      );

  const byRole =
    percentageMap(
      byRoleUSD,
      investableUSD,
    );

  const byAssetClass =
    percentageMap(
      byAssetClassUSD,
      investableUSD,
    );

  const bySubClass =
    percentageMap(
      bySubClassUSD,
      investableUSD,
    );

  const cashPct =
    investableUSD > 0
      ? (investableCashUSD /
          investableUSD) *
        100
      : 0;

  const speculativePct =
    byRole.speculative || 0;

  const tradingPct =
    byRole.trading || 0;

  const corePct =
    byRole.core || 0;

  const assets =
    enriched.map(
      (asset) => ({
        ...asset,

        strategy:
          buildStrategy(
            asset.classification
              .role,
            {
              cashPct,
              speculativePct,
              tradingPct,
              activeTargets,
            },
          ),
      }),
    );

  const portfolioRisk =
    portfolioAssets.reduce(
      (sum, asset) => {
        const weight =
          investableUSD > 0
            ? getAssetValue(
                asset,
              ) /
              investableUSD
            : 0;

        return (
          sum +
          weight *
            toFiniteNumber(
              asset
                .classification
                ?.riskLevel,
            )
        );
      },
      0,
    );

  const expectedReturn =
    portfolioAssets.reduce(
      (sum, asset) => {
        const weight =
          investableUSD > 0
            ? getAssetValue(
                asset,
              ) /
              investableUSD
            : 0;

        const returnRate =
          asset.classification
            ?.isDeFi &&
          Number.isFinite(
            Number(
              asset
                .classification
                ?.aprPct,
            ),
          )
            ? Number(
                asset
                  .classification
                  .aprPct,
              ) / 100
            : RETURN_ASSUMPTIONS[
                asset.classification
                  ?.assetClass
              ] ?? 0.05;

        return (
          sum +
          weight *
            returnRate
        );
      },
      0,
    );

  const hhi =
    portfolioAssets.reduce(
      (sum, asset) => {
        const weight =
          investableUSD > 0
            ? getAssetValue(
                asset,
              ) /
              investableUSD
            : 0;

        return (
          sum +
          weight * weight
        );
      },
      0,
    );

  const hasLocalPE =
    enriched.some(
      (asset) =>
        asset.classification
          ?.isLocalPrivateEquity,
    );

  const alerts = {
    lowCash:
      cashPct <
      THRESHOLDS.minCashPct,

    overCash:
      cashPct >
      THRESHOLDS.maxCashPct,

    underCore:
      corePct <
      (activeTargets.core ??
        THRESHOLDS.coreMinPct),

    overSpeculative:
      speculativePct >
      (activeTargets.speculative ??
        THRESHOLDS.maxSpeculativePct),

    excessTrading:
      tradingPct >
      (activeTargets.trading ??
        THRESHOLDS.maxTradingPct),

    highRisk:
      portfolioRisk >
      3.5,

    lowDiversification:
      hhi > 0.25,

    noPrivateEquity:
      !hasLocalPE &&
      !(
        byAssetClass
          .private_equity >
        0
      ),
  };

  const ruleEvaluation = [];

  if (alerts.underCore) {
    ruleEvaluation.push(
      'UNDER CORE → comprar un activo core este mes',
    );
  }

  if (alerts.lowCash) {
    ruleEvaluation.push(
      'LOW CASH → priorizar liquidez operativa',
    );
  }

  if (alerts.overCash) {
    ruleEvaluation.push(
      'EXCESS CASH → desplegar efectivo progresivamente',
    );
  }

  if (alerts.overSpeculative) {
    ruleEvaluation.push(
      `REDUCE ALTCOINS → mantener bajo el ${activeTargets.speculative}%`,
    );
  }

  if (alerts.excessTrading) {
    ruleEvaluation.push(
      `REDUCE TRADING → mantener bajo el ${activeTargets.trading}%`,
    );
  }

  if (alerts.highRisk) {
    ruleEvaluation.push(
      'REDUCIR RIESGO → priorizar core y defensive',
    );
  }

  if (alerts.noPrivateEquity) {
    ruleEvaluation.push(
      'SIN PRIVATE EQUITY → considerar alternativas compatibles',
    );
  }

  if (!ruleEvaluation.length) {
    ruleEvaluation.push(
      'Portfolio balanceado',
    );
  }

  const rebalancePlan =
    buildRebalancePlan({
      portfolioAssets,
      byRolePct: byRole,
      investableUSD,
      monthlyUSD,
      investableCashUSD,
      activeTargets,
    });

  // Ahora forma parte directamente del análisis principal.
  const sectorAnalysis =
    buildSectorAnalysisInternal(
      portfolioAssets,
      investableUSD,
    );

  const totalsByRoleUSD = {
    ...byRoleUSD,
    reserve: reserveUSD,
    patrimony: patrimonyUSD,
  };

  return {
    generatedAt:
      new Date().toISOString(),

    totals: {
      totalUSD:
        round(
          effectiveTotalUSD,
        ),

      investableUSD:
        round(
          investableUSD,
        ),

      reserveUSD:
        round(
          reserveUSD,
        ),

      patrimonyUSD:
        round(
          patrimonyUSD,
        ),

      nonInvestableUSD:
        round(
          reserveUSD +
            patrimonyUSD,
        ),
    },

    portfolio: {
      byRole,

      byAssetClass,

      bySubClass,

      investableCashUSD:
        round(
          investableCashUSD,
        ),

      totalsByRoleUSD,
    },

    patrimony: {
      totalUSD:
        round(
          patrimonyUSD,
        ),

      byClass:
        groupByValue(
          patrimonyAssets,
          'assetClass',
        ),

      assets:
        patrimonyAssets,
    },

    reserves: {
      totalUSD:
        round(
          reserveUSD,
        ),

      assets:
        reserveAssets,

      note:
        'Activos no invertibles y bloqueados.',
    },

    risk: {
      portfolioRisk:
        round(
          portfolioRisk,
          2,
        ),

      expectedReturn:
        round(
          expectedReturn * 100,
          2,
        ),

      cashDrag:
        round(
          (cashPct / 100) *
            Math.max(
              0,
              expectedReturn -
                0.02,
            ),
          4,
        ),

      hhi:
        round(
          hhi,
          4,
        ),

      methodology:
        'weighted_asset_class_assumptions',

      expectedReturnIsGuaranteed:
        false,

      limitations: [
        'No incluye correlaciones históricas.',
        'No incluye volatilidad histórica completa.',
        'El retorno esperado es una estimación.',
      ],
    },

    trading: {
      reservedBUY:
        round(
          toFiniteNumber(
            reservedBUY,
          ),
        ),

      pendingSELL:
        round(
          toFiniteNumber(
            pendingSELL,
          ),
        ),

      grossExposure:
        round(
          toFiniteNumber(
            grossExposure,
          ),
        ),
    },

    alerts,

    ruleEvaluation,

    rebalancePlan,

    sectorAnalysis,

    assets,

    activeTargets,
  };
}

// ─── TARGET ANALYSIS ───────────────────────────────────────────

export function buildTargetAnalysis(
  byRole = {},
  activeTargets = {},
) {
  return Object.entries(
    activeTargets,
  ).map(
    ([role, target]) => {
      const current =
        Number(
          byRole[role] || 0,
        );

      const goal =
        Number(target || 0);

      const difference =
        current - goal;

      const upperBound =
        role === 'speculative' ||
        role === 'trading';

      let status = 'ok';

      if (upperBound) {
        if (
          current >
          goal + 2
        ) {
          status = 'critical';
        } else if (
          current > goal
        ) {
          status = 'warning';
        }
      } else if (
        current <
        goal - 3
      ) {
        status = 'critical';
      } else if (
        current < goal
      ) {
        status = 'warning';
      }

      const action =
        status === 'ok'
          ? 'Mantener'
          : upperBound
            ? `Reducir ${Math.abs(
                difference,
              ).toFixed(1)}%`
            : `Aumentar ${(
                goal - current
              ).toFixed(1)}%`;

      return {
        role,

        currentPct:
          current,

        targetPct:
          goal,

        differencePct:
          difference,

        status,

        action,

        upperBound,
      };
    },
  );
}

// ─── INVESTABLE ASSETS ─────────────────────────────────────────

export function getInvestableAssets(
  assets = [],
) {
  return assets.filter(
    (asset) => {
      const role =
        asset
          .classification
          ?.role;

      return (
        role !== 'reserve' &&
        role !== 'patrimony'
      );
    },
  );
}

// ─── SECTOR ANALYSIS ───────────────────────────────────────────

export function buildSectorAnalysis(
  allAssets = [],
  totalUSD = 0,
) {
  const investableAssets =
    getInvestableAssets(
      Array.isArray(
        allAssets,
      )
        ? allAssets
        : [],
    );

  return buildSectorAnalysisInternal(
    investableAssets,
    Math.max(
      0,
      toFiniteNumber(
        totalUSD,
      ),
    ),
  );
}