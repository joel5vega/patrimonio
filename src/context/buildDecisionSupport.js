// src/context/decisionSupport/buildDecisionSupport.js

const ALERT_DEFINITIONS = {
  underCore: {
    severity: 'warning',
    title: 'Exposición core por debajo del objetivo',
    category: 'Asignación',
  },
  overCash: {
    severity: 'warning',
    title: 'Efectivo por encima del máximo permitido',
    category: 'Liquidez',
  },
  overSpeculative: {
    severity: 'critical',
    title: 'Exposición especulativa excedida',
    category: 'Riesgo',
  },
  excessTrading: {
    severity: 'warning',
    title: 'Capital de trading sobre el límite',
    category: 'Trading',
  },
  excessTradingNotional: {
    severity: 'critical',
    title: 'Exposición nocional de trading excedida',
    category: 'Trading',
  },
  lowCash: {
    severity: 'critical',
    title: 'Liquidez por debajo del mínimo',
    category: 'Liquidez',
  },
  lowDiversification: {
    severity: 'warning',
    title: 'Diversificación insuficiente',
    category: 'Riesgo',
  },
  highRisk: {
    severity: 'critical',
    title: 'Riesgo agregado elevado',
    category: 'Riesgo',
  },
  noPrivateEquity: {
    severity: 'info',
    title: 'Sin exposición a private equity',
    category: 'Asignación',
  },
};

const CATEGORY_SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export function buildAlerts(alerts = {}) {
  if (!alerts || typeof alerts !== 'object') {
    return { items: [] };
  }

  const items = Object.entries(ALERT_DEFINITIONS)
    .filter(([key]) => alerts[key] === true)
    .map(([key, def]) => ({
      key,
      severity: def.severity,
      title: def.title,
      category: def.category,
    }))
    .sort(
      (a, b) =>
        CATEGORY_SEVERITY_ORDER[a.severity] -
        CATEGORY_SEVERITY_ORDER[b.severity],
    );

  return { items };
}

export function buildRecommendation(item, source) {
  return {
    asset: item.asset,
    action: item.action,
    amountUSD: item.amountUSD,
    reason: item.reason,
    role: item.role,
    strategy: item.strategy,
    critical: item.critical ?? false,
    priorityScore: item.priorityScore ?? 0,
    fundingSource: item.fundingSource ?? null,
    source,
  };
}

export function buildRecommendations(rebalancePlan = {}) {
  const monthly = Array.isArray(rebalancePlan.monthly)
    ? rebalancePlan.monthly.map((item) =>
        buildRecommendation(item, 'monthly'),
      )
    : [];

  const lumpSum = Array.isArray(rebalancePlan.lumpSum)
    ? rebalancePlan.lumpSum.map((item) =>
        buildRecommendation(item, 'lumpSum'),
      )
    : [];

  // Fallback: si monthly está vacío pero hay actions, usarlas.
  if (monthly.length === 0 && Array.isArray(rebalancePlan.actions)) {
    rebalancePlan.actions
      .filter((a) => a.fundingSource === 'monthly_contribution')
      .forEach((a) => monthly.push(buildRecommendation(a, 'monthly')));
  }

  return { monthly, lumpSum };
}

export function buildDecisionSupport(portfolioV3 = {}) {
  return {
    alerts: buildAlerts(portfolioV3.alerts),
    recommendations: buildRecommendations(portfolioV3.rebalancePlan),
    meta: {
      generatedAt: portfolioV3.generatedAt ?? null,
      monthlyUSD: portfolioV3.rebalancePlan?.monthlyUSD ?? 0,
      opportunityCount: portfolioV3.rebalancePlan?.opportunityCount ?? 0,
      selectedFundingSource:
        portfolioV3.rebalancePlan?.selectedFundingSource ?? null,
    },
  };
}