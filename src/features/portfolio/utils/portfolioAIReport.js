import {
  buildRoleTotals,
  selectPatrimonyAssets,
  selectReserveAssets,
} from './portfolioSelectors';

import {
  round,
  toNumber,
} from './portfolioFormatters';

import {
  buildTargetAnalysis,
  INVESTOR_PROFILES,
  PORTFOLIO_TARGETS,
} from '../utils/portfolioAnalysis';

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────

const DEFAULT_INVESTOR_PROFILE = 'moderado';

const INCLUDED_ROLES = [
  'core',
  'growth',
  'defensive',
  'liquidity',
  'yield',
  'speculative',
  'trading',
];

const EXCLUDED_ROLES = [
  'reserve',
  'patrimony',
];

const REBALANCING_METHOD = 'contributions_first';
const INVESTOR_HORIZON = 'medium_long';
const INVESTOR_OBJECTIVE = 'wealth_accumulation';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Obtiene los targets efectivos.
 * Prioridad: 1. analysis.activeTargets | 2. perfil del inversor | 3. PORTFOLIO_TARGETS
 */
function resolveTargets(analysis, investorProfile) {
  const analysisTargets = safeObject(analysis?.activeTargets);

  if (Object.keys(analysisTargets).length > 0) {
    return analysisTargets;
  }

  const profile = INVESTOR_PROFILES[investorProfile];

  if (profile?.targets && typeof profile.targets === 'object') {
    return profile.targets;
  }

  return PORTFOLIO_TARGETS;
}

/**
 * Calcula la exposición por fuente/plataforma de manera dinámica e inmune a errores de mapeo.
 */
function calculateSourceExposure(assets) {
  return assets.reduce((acc, asset) => {
    // Determinar la clave de origen dando prioridad a groupKey, source, broker o platform
    const rawSource =
      asset?.groupKey ||
      asset?.source ||
      asset?.broker ||
      asset?.platform ||
      'manual';

    const sourceKey = String(rawSource).toLowerCase().trim();
    const value = toNumber(asset?.valueUSD);

    acc[sourceKey] = round((acc[sourceKey] || 0) + value, 2);
    return acc;
  }, {});
}

// ─────────────────────────────────────────────────────────────
// ALLOCATION
// ─────────────────────────────────────────────────────────────

export function buildAllocationAnalysis(
  analysis,
  investorProfile = DEFAULT_INVESTOR_PROFILE,
) {
  const portfolio = safeObject(analysis?.portfolio);
  const byRole = safeObject(portfolio.byRole);
  const byAssetClass = safeObject(portfolio.byAssetClass);
  const bySubClass = safeObject(portfolio.bySubClass);

  const targets = resolveTargets(analysis, investorProfile);
  const targetRows = buildTargetAnalysis(byRole, targets);

  return {
    byRole: Object.fromEntries(
      targetRows.map((row) => [row.role, row]),
    ),
    rows: targetRows,
    // Conservado por retrocompatibilidad con la interfaz
    roleRows: targetRows,
    byAssetClass,
    bySubClass,
    targets,
  };
}

// ─────────────────────────────────────────────────────────────
// ALERTAS
// ─────────────────────────────────────────────────────────────

function buildAlerts(analysis, allocation) {
  const source = safeObject(analysis?.alerts);

  const definitions = [
    ['underCore', 'allocation', 'warning', 'Core por debajo del objetivo'],
    ['lowCash', 'liquidity', 'critical', 'Liquidez insuficiente'],
    ['overCash', 'liquidity', 'warning', 'Exceso de efectivo'],
    ['overSpeculative', 'risk', 'critical', 'Exposición especulativa elevada'],
    ['excessTrading', 'risk', 'warning', 'Exposición de trading elevada'],
    ['highRisk', 'risk', 'critical', 'Riesgo global elevado'],
    ['lowDiversification', 'diversification', 'warning', 'Diversificación insuficiente'],
    ['noPrivateEquity', 'availability', 'info', 'No hay private equity disponible'],
  ];

  const items = definitions
    .filter(([key]) => Boolean(source[key]))
    .map(([key, category, severity, title]) => ({
      key,
      category,
      severity,
      title,
      allocation: allocation?.byRole?.[key] || null,
    }));

  return {
    items,
    summary: {
      active: items.length,
      critical: items.filter((item) => item.severity === 'critical').length,
      warning: items.filter((item) => item.severity === 'warning').length,
      info: items.filter((item) => item.severity === 'info').length,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// RECOMENDACIONES
// ─────────────────────────────────────────────────────────────

function buildRecommendations(analysis, alerts) {
  const plan = safeObject(analysis?.rebalancePlan);
  const monthly = safeArray(plan.monthly);
  const lumpSum = safeArray(plan.lumpSum);
  const hasCriticalAlert = alerts?.summary?.critical > 0;

  return {
    strategy: REBALANCING_METHOD,
    priority: hasCriticalAlert
      ? 'resolve_critical_alerts'
      : monthly.length
        ? 'monthly_rebalance'
        : 'monitor',
    monthly,
    lumpSum,
  };
}

// ─────────────────────────────────────────────────────────────
// ESTADO FINANCIERO
// ─────────────────────────────────────────────────────────────

function buildFinancialState(analysis) {
  const totals = safeObject(analysis?.totals);

  const totalNetWorthUSD = toNumber(totals.totalUSD);
  const investableAssetsUSD = toNumber(totals.investableUSD);
  const reservesUSD = toNumber(totals.reserveUSD);
  const physicalPatrimonyUSD = toNumber(totals.patrimonyUSD);

  const financialAssetsUSD = investableAssetsUSD + reservesUSD;

  return {
    totalNetWorthUSD: round(totalNetWorthUSD, 2),
    financialAssetsUSD: round(financialAssetsUSD, 2),
    investableAssetsUSD: round(investableAssetsUSD, 2),
    reservesUSD: round(reservesUSD, 2),
    physicalPatrimonyUSD: round(physicalPatrimonyUSD, 2),
    nonInvestableAssetsUSD: round(reservesUSD + physicalPatrimonyUSD, 2),

    investablePctOfNetWorth:
      totalNetWorthUSD > 0
        ? round((investableAssetsUSD / totalNetWorthUSD) * 100, 4)
        : 0,

    reservesPctOfFinancialAssets:
      financialAssetsUSD > 0
        ? round((reservesUSD / financialAssetsUSD) * 100, 4)
        : 0,

    physicalPatrimonyPctOfNetWorth:
      totalNetWorthUSD > 0
        ? round((physicalPatrimonyUSD / totalNetWorthUSD) * 100, 4)
        : 0,
  };
}

// ─────────────────────────────────────────────────────────────
// RIESGO
// ─────────────────────────────────────────────────────────────

function buildRiskAssessment(analysis) {
  const risk = safeObject(analysis?.risk);

  return {
    portfolioRisk: risk.portfolioRisk ?? null,
    expectedReturnPct: risk.expectedReturn ?? null,
    concentrationHHI: risk.hhi ?? null,
    cashDragPct: risk.cashDrag ?? null,
    methodology: risk.methodology || 'weighted_asset_class_assumptions',
    expectedReturnIsGuaranteed: false,
    limitations: Array.isArray(risk.limitations)
      ? risk.limitations
      : [
          'No incluye correlaciones históricas.',
          'No incluye volatilidad histórica completa.',
          'El retorno esperado es una estimación.',
        ],
  };
}

// ─────────────────────────────────────────────────────────────
// INTEGRIDAD
// ─────────────────────────────────────────────────────────────

function containsInvalidNumber(value) {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.some(containsInvalidNumber);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(containsInvalidNumber);
  }

  return false;
}

function buildIntegrityChecks(analysis) {
  const assets = safeArray(analysis?.assets);
  const totals = safeObject(analysis?.totals);

  const investableAssets = assets.filter((asset) => {
    const role = asset?.classification?.role;
    return role !== 'reserve' && role !== 'patrimony';
  });

  const calculatedInvestable = investableAssets.reduce(
    (sum, asset) => sum + toNumber(asset?.valueUSD),
    0,
  );

  const declaredInvestable = toNumber(totals.investableUSD);

  return {
    totalsAvailable: Boolean(analysis?.totals),
    assetsAvailable: Array.isArray(analysis?.assets),
    classificationAvailable: assets.every((asset) =>
      Boolean(asset?.classification),
    ),
    strategyAvailable: assets.every((asset) => Boolean(asset?.strategy)),
    noInvalidNumericValues: !containsInvalidNumber(analysis),
    investableAssetsReconcile:
      Math.abs(calculatedInvestable - declaredInvestable) < 0.01,
  };
}

// ─────────────────────────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────────────────────────

export function buildPortfolioAIReport({
  analysis,
  investorProfile = DEFAULT_INVESTOR_PROFILE,
  bobRate = null,
  sources = [],
} = {}) {
  const safeAnalysis = safeObject(analysis);

  const allocationAnalysis = buildAllocationAnalysis(
    safeAnalysis,
    investorProfile,
  );

  const alerts = buildAlerts(safeAnalysis, allocationAnalysis);
  const assets = safeArray(safeAnalysis.assets);

  const patrimonyAssets = selectPatrimonyAssets(assets);
  const reserveAssets = selectReserveAssets(assets);

  // Cálculo dinámico directo sobre los arreglos filtrados para evitar valores en 0
  const computedReserveTotalUSD = reserveAssets.reduce(
    (sum, asset) => sum + toNumber(asset?.valueUSD),
    0,
  );

  const computedPatrimonyTotalUSD = patrimonyAssets.reduce(
    (sum, asset) => sum + toNumber(asset?.valueUSD),
    0,
  );

  const recommendations = buildRecommendations(safeAnalysis, alerts);
  const targets = allocationAnalysis.targets;

  const generatedAt =
    safeAnalysis.generatedAt || new Date().toISOString();

  return {
    schema: {
      name: 'personal_portfolio_analysis',
      version: '5.1',
      language: 'es',
      currency: 'USD',
      calculationBasis: 'current_market_value',
    },

    snapshot: {
      generatedAt,
      asOfDate: generatedAt?.slice(0, 10) || null,
      sources,
      bobRate,
    },

    investorContext: {
      profile: investorProfile,
      monthlyContributionUSD:
        safeAnalysis?.rebalancePlan?.monthlyUSD ?? null,
      horizon: INVESTOR_HORIZON,
      objective: INVESTOR_OBJECTIVE,
    },

    financialState: buildFinancialState(safeAnalysis),

    investmentUniverse: {
      includedRoles: INCLUDED_ROLES,
      excludedRoles: EXCLUDED_ROLES,
      rebalancingMethod: REBALANCING_METHOD,
      lockedAssetsExcluded: true,
    },

    allocationAnalysis,

    riskAssessment: buildRiskAssessment(safeAnalysis),

    decisionSupport: {
      priority:
        alerts.summary.critical > 0
          ? 'resolve_critical_alerts'
          : 'rebalance_underweights',
      alerts,
      rules: safeArray(safeAnalysis.ruleEvaluation),
      recommendations,
    },

    excludedAssets: {
      reserves: {
        totalUSD: round(
          safeAnalysis?.reserves?.totalUSD != null
            ? toNumber(safeAnalysis.reserves.totalUSD)
            : computedReserveTotalUSD,
          2,
        ),
        assets: reserveAssets,
      },
      patrimony: {
        totalUSD: round(
          safeAnalysis?.patrimony?.totalUSD != null
            ? toNumber(safeAnalysis.patrimony.totalUSD)
            : computedPatrimonyTotalUSD,
          2,
        ),
        assets: patrimonyAssets,
      },
    },

    // Agrupación de exposición calculada localmente con total precisión
    exposureBySource: calculateSourceExposure(assets),

    totalsByRoleUSD: buildRoleTotals(assets),

    targets,

    sectorAnalysis: safeAnalysis?.sectorAnalysis || null,

    assets,

    integrityChecks: buildIntegrityChecks(safeAnalysis),
  };
}