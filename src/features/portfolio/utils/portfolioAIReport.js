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
 
} from '../utils/portfolioAnalysis';
import { INVESTOR_PROFILES, PORTFOLIO_TARGETS,
  DEFAULT_INVESTOR_PROFILE,INCLUDED_ROLES,EXCLUDED_ROLES,REBALANCING_METHOD,INVESTOR_HORIZON,INVESTOR_OBJECTIVE,RECONCILIATION_TOLERANCE_USD
,MAX_RECOMMENDATIONS,TRANSACTION_POLICY,rolePriority } from '../constants/portfolioRules.js'

import {safeObject,safeArray,normalizeText,normalizeSymbol,toFiniteNumber,containsInvalidNumber} from './portfolioHelpers.js'



// ─── TARGETS ──────────────────────────────────────────────────

function resolveTargets(
  analysis,
  investorProfile,
) {
  const analysisTargets =
    safeObject(
      analysis?.activeTargets,
    );


  if (
    Object.keys(
      analysisTargets,
    ).length > 0
  ) {
    return analysisTargets;
  }


  return (
    INVESTOR_PROFILES[
      investorProfile
    ]?.targets ||
    PORTFOLIO_TARGETS
  );
}


// ─── SOURCE RESOLUTION ────────────────────────────────────────

function resolveAssetSource(asset) {
  const explicitSource =
    normalizeText(
      asset?.groupKey ||
      asset?.source ||
      asset?.broker ||
      asset?.platform,
    );


  // manual no debe impedir
  // inferencias posteriores.
  if (
    explicitSource &&
    explicitSource !== 'manual'
  ) {
    return explicitSource;
  }


  const note =
    normalizeText(
      asset?.note,
    );

  const symbol =
    normalizeSymbol(
      asset?.symbol,
    ).toUpperCase();

  const type =
    normalizeText(
      asset?.type,
    );


  if (
    note.includes(
      'quantfury',
    )
  ) {
    return 'quantfury';
  }


  if (
    note.includes(
      'binance',
    )
  ) {
    return 'binance';
  }


  if (
    note.includes(
      'admirals',
    )
  ) {
    return 'admirals';
  }


  if (
    type === 'crypto' &&
    [
      'BTC',
      'ETH',
      'SOL',
      'ADA',
      'HBAR',
      'USDT',
      'XRP',
    ].includes(symbol)
  ) {
    return 'binance';
  }


  if (
    type === 'etf' &&
    [
      'BND',
      'EMXC',
      'IAU',
      'VOO',
      'VXUS',
    ].includes(symbol)
  ) {
    return 'admirals';
  }


  if (
    type === 'stock' &&
    [
      'CEG',
      'MELI',
      'SLV',
    ].includes(symbol)
  ) {
    return 'quantfury';
  }


  return 'manual';
}


// ─── SOURCE EXPOSURE ──────────────────────────────────────────

function calculateSourceExposure(
  assets,
) {
  return assets.reduce(
    (acc, asset) => {
      const source =
        resolveAssetSource(
          asset,
        );

      acc[source] =
        round(
          (
            acc[source] || 0
          ) +
          toNumber(
            asset?.valueUSD,
          ),
          2,
        );

      return acc;
    },
    {},
  );
}


// ─── ALLOCATION ANALYSIS ──────────────────────────────────────

export function buildAllocationAnalysis(
  analysis,
  investorProfile =
    DEFAULT_INVESTOR_PROFILE,
) {
  const portfolio =
    safeObject(
      analysis?.portfolio,
    );

  const byRole =
    safeObject(
      portfolio.byRole,
    );

  const targets =
    resolveTargets(
      analysis,
      investorProfile,
    );

  const rows =
    buildTargetAnalysis(
      byRole,
      targets,
    );


  return {
    byRole:
      Object.fromEntries(
        rows.map(
          (row) => [
            row.role,
            row,
          ],
        ),
      ),

    rows,

    roleRows:
      rows,

    byAssetClass:
      safeObject(
        portfolio.byAssetClass,
      ),

    bySubClass:
      safeObject(
        portfolio.bySubClass,
      ),

    targets,
  };
}


// ─── ALERTS ───────────────────────────────────────────────────

function buildAlerts(
  analysis,
  allocation,
) {
  const source =
    safeObject(
      analysis?.alerts,
    );


  const definitions = [
    [
      'underCore',
      'allocation',
      'warning',
      'Core por debajo del objetivo',
    ],

    [
      'lowCash',
      'liquidity',
      'critical',
      'Liquidez insuficiente',
    ],

    [
      'overCash',
      'liquidity',
      'warning',
      'Exceso de efectivo',
    ],

    [
      'overSpeculative',
      'risk',
      'critical',
      'Exposición especulativa elevada',
    ],

    [
      'excessTrading',
      'risk',
      'warning',
      'Exposición de trading elevada',
    ],

    [
      'highRisk',
      'risk',
      'critical',
      'Riesgo global elevado',
    ],

    [
      'lowDiversification',
      'diversification',
      'warning',
      'Diversificación insuficiente',
    ],

    [
      'noPrivateEquity',
      'availability',
      'info',
      'No hay private equity disponible',
    ],
  ];


  const items =
    definitions
      .filter(
        ([key]) =>
          Boolean(
            source[key],
          ),
      )
      .map(
        ([
          key,
          category,
          severity,
          title,
        ]) => ({
          key,

          category,

          severity,

          title,

          allocation:
            allocation
              ?.byRole?.[key] ||
            null,
        }),
      );


  return {
    items,

    summary: {
      active:
        items.length,

      critical:
        items.filter(
          (item) =>
            item.severity ===
            'critical',
        ).length,

      warning:
        items.filter(
          (item) =>
            item.severity ===
            'warning',
        ).length,

      info:
        items.filter(
          (item) =>
            item.severity ===
            'info',
        ).length,
    },
  };
}


// ─────────────────────────────────────────────────────────────
// RECOMENDACIONES
// ─────────────────────────────────────────────────────────────
// - valida;
// - ordena;
// - limita a 2;
// - presenta.
// ─────────────────────────────────────────────────────────────

function buildRecommendations(
  analysis,
  alerts,
) {
  const plan =
    safeObject(
      analysis?.rebalancePlan,
    );


  const monthly =
    safeArray(
      plan.monthly,
    );


  const lumpSum =
    safeArray(
      plan.lumpSum,
    );


  const rankedMonthly =
    monthly
      .filter(
        (item) =>
          Number(
            item?.amountUSD || 0,
          ) >=
          TRANSACTION_POLICY
            .minOpportunityUSD,
      )
      .sort(
        (a, b) =>
          Number(
            b?.priorityScore ||
            0,
          ) -
          Number(
            a?.priorityScore ||
            0,
          ),
      )
      .slice(
        0,
        MAX_RECOMMENDATIONS,
      );


  const rankedLumpSum =
    lumpSum
      .filter(
        (item) =>
          Number(
            item?.amountUSD || 0,
          ) >=
          TRANSACTION_POLICY
            .minOpportunityUSD,
      )
      .sort(
        (a, b) =>
          Number(
            b?.priorityScore ||
            0,
          ) -
          Number(
            a?.priorityScore ||
            0,
          ),
      )
      .slice(
        0,
        MAX_RECOMMENDATIONS,
      );


  const opportunityCount =
    rankedMonthly.length;


  return {
    strategy:
      REBALANCING_METHOD,

    priority:
      alerts?.summary?.critical >
      0
        ? 'resolve_critical_alerts'
        : rankedMonthly.length
          ? 'monthly_rebalance'
          : 'monitor',

    monthly:
      rankedMonthly,

    lumpSum:
      rankedLumpSum,

    opportunityCount,

    transactionPolicy:
      TRANSACTION_POLICY,
  };
}


// ─── FINANCIAL STATE ──────────────────────────────────────────

function buildFinancialState(
  analysis,
) {
  const totals =
    safeObject(
      analysis?.totals,
    );


  const totalNetWorthUSD =
    toNumber(
      totals.totalUSD,
    );


  const investableAssetsUSD =
    toNumber(
      totals.investableUSD,
    );


  const reservesUSD =
    toNumber(
      totals.reserveUSD,
    );


  const physicalPatrimonyUSD =
    toNumber(
      totals.patrimonyUSD,
    );


  const financialAssetsUSD =
    investableAssetsUSD +
    reservesUSD;


  return {
    totalNetWorthUSD:
      round(
        totalNetWorthUSD,
        2,
      ),

    financialAssetsUSD:
      round(
        financialAssetsUSD,
        2,
      ),

    investableAssetsUSD:
      round(
        investableAssetsUSD,
        2,
      ),

    reservesUSD:
      round(
        reservesUSD,
        2,
      ),

    physicalPatrimonyUSD:
      round(
        physicalPatrimonyUSD,
        2,
      ),

    nonInvestableAssetsUSD:
      round(
        reservesUSD +
        physicalPatrimonyUSD,
        2,
      ),

    investablePctOfNetWorth:
      totalNetWorthUSD > 0
        ? round(
            (
              investableAssetsUSD /
              totalNetWorthUSD
            ) * 100,
            4,
          )
        : 0,

    reservesPctOfFinancialAssets:
      financialAssetsUSD > 0
        ? round(
            (
              reservesUSD /
              financialAssetsUSD
            ) * 100,
            4,
          )
        : 0,

    physicalPatrimonyPctOfNetWorth:
      totalNetWorthUSD > 0
        ? round(
            (
              physicalPatrimonyUSD /
              totalNetWorthUSD
            ) * 100,
            4,
          )
        : 0,
  };
}


// ─── RISK ─────────────────────────────────────────────────────

function buildRiskAssessment(
  analysis,
) {
  const risk =
    safeObject(
      analysis?.risk,
    );


  return {
    portfolioRisk:
      risk.portfolioRisk ??
      null,

    expectedReturnPct:
      risk.expectedReturn ??
      null,

    concentrationHHI:
      risk.hhi ??
      null,

    cashDragPct:
      risk.cashDrag ??
      null,

    methodology:
      risk.methodology ||
      'weighted_asset_class_assumptions',

    expectedReturnIsGuaranteed:
      false,

    limitations:
      Array.isArray(
        risk.limitations,
      )
        ? risk.limitations
        : [
            'No incluye correlaciones históricas.',
            'No incluye volatilidad histórica completa.',
            'El retorno esperado es una estimación.',
          ],
  };
}

// ─── NORMALIZACIÓN DE SECTORES ────────────────────────────────

function normalizeSectorAnalysis(
  value,
) {
  if (
    Array.isArray(value)
  ) {
    const sectors = value;


    return {
      methodology:
        'look_through_etf_and_direct_asset_classification',

      sectors,

      dominantSector:
        sectors[0] ||
        null,

      totalSectorUSD:
        round(
          sectors.reduce(
            (
              sum,
              sector,
            ) =>
              sum +
              toNumber(
                sector?.valueUSD,
              ),
            0,
          ),
          2,
        ),

      reconciliation:
        null,
    };
  }


  if (
    value &&
    typeof value ===
      'object'
  ) {
    const sectors =
      safeArray(
        value.sectors,
      );


    return {
      ...value,

      sectors,

      dominantSector:
        value.dominantSector ||
        sectors[0] ||
        null,

      totalSectorUSD:
        value.totalSectorUSD !=
        null
          ? toNumber(
              value.totalSectorUSD,
            )
          : round(
              sectors.reduce(
                (
                  sum,
                  sector,
                ) =>
                  sum +
                  toNumber(
                    sector?.valueUSD,
                  ),
                0,
              ),
              2,
            ),
    };
  }


  return {
    methodology:
      'unavailable',

    sectors: [],

    dominantSector:
      null,

    totalSectorUSD:
      0,

    reconciliation:
      null,
  };
}


// ─── INTEGRIDAD ───────────────────────────────────────────────

function buildIntegrityChecks(
  analysis,
  assets,
  sectorAnalysis,
) {
  const totals =
    safeObject(
      analysis?.totals,
    );


  const investableAssets =
    assets.filter(
      (asset) =>
        ![
          'reserve',
          'patrimony',
        ].includes(
          asset?.classification
            ?.role,
        ),
    );


  const calculatedInvestable =
    investableAssets.reduce(
      (sum, asset) =>
        sum +
        toNumber(
          asset?.valueUSD,
        ),
      0,
    );


  const declaredInvestable =
    toNumber(
      totals.investableUSD,
    );


  const difference =
    Math.abs(
      calculatedInvestable -
      declaredInvestable,
    );


  const sectorReconciliation =
    sectorAnalysis
      ?.reconciliation;


  const sectorDifference =
    toNumber(
      sectorReconciliation
        ?.differenceUSD,
    );


  return {
    totalsAvailable:
      Boolean(
        analysis?.totals,
      ),

    assetsAvailable:
      Array.isArray(
        analysis?.assets,
      ),

    classificationAvailable:
      assets.every(
        (asset) =>
          Boolean(
            asset?.classification,
          ),
      ),

    strategyAvailable:
      assets.every(
        (asset) =>
          Boolean(
            asset?.strategy,
          ),
      ),

    sectorAnalysisAvailable:
      sectorAnalysis
        .sectors.length >
      0,

    noInvalidNumericValues:
      !containsInvalidNumber(
        analysis,
      ),

    investableAssetsReconcile:
      difference <=
      RECONCILIATION_TOLERANCE_USD,

    sectorReconciliation:
      sectorReconciliation
        ? {
            ...sectorReconciliation,

            matches:
              Math.abs(
                sectorDifference,
              ) <=
              RECONCILIATION_TOLERANCE_USD,
          }
        : null,
  };
}


// ─── REPORTE PRINCIPAL ────────────────────────────────────────

export function buildPortfolioAIReport({
  analysis,
  investorProfile =
    DEFAULT_INVESTOR_PROFILE,
  bobRate = null,
  sources = [],
} = {}) {
  const safeAnalysis =
    safeObject(
      analysis,
    );


  const assets =
    normalizeAssets(
      safeAnalysis,
    );


  const analysisForReport = {
    ...safeAnalysis,
    assets,
  };


  const allocationAnalysis =
    buildAllocationAnalysis(
      analysisForReport,
      investorProfile,
    );


  const alerts =
    buildAlerts(
      analysisForReport,
      allocationAnalysis,
    );


  const patrimonyAssets =
    selectPatrimonyAssets(
      assets,
    );


  const reserveAssets =
    selectReserveAssets(
      assets,
    );


  const computedReserveTotalUSD =
    reserveAssets.reduce(
      (sum, asset) =>
        sum +
        toNumber(
          asset?.valueUSD,
        ),
      0,
    );


  const computedPatrimonyTotalUSD =
    patrimonyAssets.reduce(
      (sum, asset) =>
        sum +
        toNumber(
          asset?.valueUSD,
        ),
      0,
    );


  const recommendations =
    buildRecommendations(
      analysisForReport,
      alerts,
    );


  const targets =
    allocationAnalysis.targets;


  const sectorAnalysis =
    normalizeSectorAnalysis(
      analysisForReport
        .sectorAnalysis,
    );


  const generatedAt =
    analysisForReport.generatedAt ||
    new Date().toISOString();


  return {
    schema: {
      name:
        'personal_portfolio_analysis',

      version:
        '5.3',

      language:
        'es',

      currency:
        'USD',

      calculationBasis:
        'current_market_value',
    },


    snapshot: {
      generatedAt,

      asOfDate:
        generatedAt.slice(
          0,
          10,
        ),

      sources,

      bobRate,
    },


    investorContext: {
      profile:
        investorProfile,

      monthlyContributionUSD:
        analysisForReport
          ?.rebalancePlan
          ?.monthlyUSD ??
        null,

      horizon:
        INVESTOR_HORIZON,

      objective:
        INVESTOR_OBJECTIVE,
    },


    financialState:
      buildFinancialState(
        analysisForReport,
      ),


    investmentUniverse: {
      includedRoles:
        INCLUDED_ROLES,

      excludedRoles:
        EXCLUDED_ROLES,

      rebalancingMethod:
        REBALANCING_METHOD,

      lockedAssetsExcluded:
        true,
    },


    allocationAnalysis,


    riskAssessment:
      buildRiskAssessment(
        analysisForReport,
      ),


    decisionSupport: {
      priority:
        alerts.summary.critical >
        0
          ? 'resolve_critical_alerts'
          : recommendations
              .monthly.length
            ? 'monthly_rebalance'
            : 'monitor',

      alerts,

      rules:
        safeArray(
          analysisForReport
            .ruleEvaluation,
        ),

      recommendations,
    },


    excludedAssets: {
      reserves: {
        totalUSD:
          round(
            analysisForReport
              ?.reserves
              ?.totalUSD !=
              null
              ? toNumber(
                  analysisForReport
                    .reserves
                    .totalUSD,
                )
              : computedReserveTotalUSD,
            2,
          ),

        assets:
          reserveAssets,
      },


      patrimony: {
        totalUSD:
          round(
            analysisForReport
              ?.patrimony
              ?.totalUSD !=
              null
              ? toNumber(
                  analysisForReport
                    .patrimony
                    .totalUSD,
                )
              : computedPatrimonyTotalUSD,
            2,
          ),

        assets:
          patrimonyAssets,
      },
    },


    exposureBySource:
      calculateSourceExposure(
        assets,
      ),


    totalsByRoleUSD:
      buildRoleTotals(
        assets,
      ),


    targets,


    sectorAnalysis,


    assets,


    integrityChecks:
      buildIntegrityChecks(
        analysisForReport,
        assets,
        sectorAnalysis,
      ),
  };
}