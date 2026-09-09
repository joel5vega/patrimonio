import { useMemo } from "react";
import { usePortfolioFilters } from "./usePortfolioFilters";

const EMPTY_PLAN = {
  monthly: [],
  lumpSum: [],
  actions: [],
  monthlyUSD: 0,
  deployableCash: 0,
  remainingCash: 0,
  opportunityCount: 0,
};

function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function getAssetRole(asset) {
  return (
    asset?.classification?.role ??
    asset?.role ??
    "unclassified"
  );
}

function getQuantity(asset) {
  return firstFiniteNumber(
    asset?.quantity,
    asset?.net_qty,
    asset?.netQty,
    asset?.sourceMeta?.quantity,
    asset?.sourceMeta?.balances?.total,
  );
}

function getEntryPrice(asset) {
  return firstFiniteNumber(
    asset?.entryPrice,
    asset?.entry_price,
    asset?.avgEntryPrice,
    asset?.avg_entry_price,
    asset?.sourceMeta?.entryPrice,
    asset?.sourceMeta?.entry_price,
    asset?.sourceMeta?.avgEntryPrice,
    asset?.sourceMeta?.avg_entry_price,
  );
}

function getMarketPrice(asset) {
  return firstFiniteNumber(
    asset?.marketPrice,
    asset?.market_price,
    asset?.priceUSD,
    asset?.price_usd,
    asset?.markPrice,
    asset?.mark_price,
    asset?.sourceMeta?.marketPrice,
    asset?.sourceMeta?.market_price,
    asset?.sourceMeta?.priceUSD,
    asset?.sourceMeta?.price_usd,
    asset?.sourceMeta?.markPrice,
    asset?.sourceMeta?.mark_price,
  );
}

function getCostBasis(asset) {
  return firstFiniteNumber(
    asset?.costBasisUSD,
    asset?.cost_basis_usd,
    asset?.sourceMeta?.costBasisUSD,
    asset?.sourceMeta?.cost_basis_usd,
  );
}

function getRealizedPnl(asset) {
  return firstFiniteNumber(
    asset?.realizedPnlUSD,
    asset?.realized_pnl_usd,
    asset?.sourceMeta?.realizedPnlUSD,
    asset?.sourceMeta?.realized_pnl_usd,
  );
}

function getUnrealizedPnl(asset) {
  return firstFiniteNumber(
    asset?.unrealizedPnlUSD,
    asset?.unrealized_pnl_usd,
    asset?.pnlUSD,
    asset?.sourceMeta?.unrealizedPnlUSD,
    asset?.sourceMeta?.unrealized_pnl_usd,
  );
}

function getUnrealizedPnlPct(asset) {
  return firstFiniteNumber(
    asset?.unrealizedPnlPct,
    asset?.unrealized_pnl_pct,
    asset?.pnlPct,
    asset?.sourceMeta?.unrealizedPnlPct,
    asset?.sourceMeta?.unrealized_pnl_pct,
  );
}

function normalizeAsset(asset = {}, index = 0) {
  const quantity = getQuantity(asset);
  const entryPrice = getEntryPrice(asset);
  const marketPrice = getMarketPrice(asset);
  const explicitCostBasis = getCostBasis(asset);
  const explicitUnrealizedPnl = getUnrealizedPnl(asset);
  const explicitUnrealizedPnlPct = getUnrealizedPnlPct(asset);

  const costBasisUSD =
    explicitCostBasis ??
    (quantity !== null && entryPrice !== null
      ? quantity * entryPrice
      : null);

  const marketValueUSD =
    quantity !== null && marketPrice !== null
      ? quantity * marketPrice
      : null;

  const unrealizedPnlUSD =
    explicitUnrealizedPnl ??
    (marketValueUSD !== null && costBasisUSD !== null
      ? marketValueUSD - costBasisUSD
      : null);

  const unrealizedPnlPct =
    explicitUnrealizedPnlPct ??
    (unrealizedPnlUSD !== null && costBasisUSD !== null && costBasisUSD > 0
      ? (unrealizedPnlUSD / costBasisUSD) * 100
      : null);

  const rawValueUSD = safeNumber(asset.valueUSD, 0);
  const valueUSD =
    marketValueUSD !== null
      ? marketValueUSD
      : rawValueUSD > 0
        ? rawValueUSD
        : costBasisUSD ?? 0;

  return {
    ...asset,
    id:
      asset.id ??
      `${asset.source ?? asset.groupKey ?? "asset"}-${
        asset.symbol ?? asset.name ?? index
      }`,
    name: asset.name ?? asset.symbol ?? "Activo",
    symbol: asset.symbol ?? asset.name ?? "—",
    source: asset.source ?? asset.groupKey ?? "unknown",
    role: getAssetRole(asset),
    type: asset.type ?? "unknown",

    // Contrato normalizado común para UI, heatmap y tooltips.
    quantity,
    entryPrice,
    marketPrice,
    costBasisUSD,
    marketValueUSD,
    unrealizedPnlUSD,
    unrealizedPnlPct,
    realizedPnlUSD: getRealizedPnl(asset),

    // Compatibilidad con los componentes existentes.
    valueUSD: safeNumber(valueUSD),
    weightPct: safeNumber(asset.weightPct ?? asset.weight),
    pnlUSD: unrealizedPnlUSD,
    pnlPct: unrealizedPnlPct,

    sourceMeta: {
      ...(asset.sourceMeta ?? {}),
      quantity,
      entryPrice,
      marketPrice,
      costBasisUSD,
      marketValueUSD,
      unrealizedPnlUSD,
      unrealizedPnlPct,
      realizedPnlUSD: getRealizedPnl(asset),
      entryPriceSource:
        asset.entryPriceSource ??
        asset.entry_price_source ??
        asset.sourceMeta?.entryPriceSource ??
        asset.sourceMeta?.entry_price_source ??
        null,
      entryPriceMethod:
        asset.entryPriceMethod ??
        asset.entry_price_method ??
        asset.sourceMeta?.entryPriceMethod ??
        asset.sourceMeta?.entry_price_method ??
        null,
      valuationStatus:
        asset.valuationStatus ??
        asset.valuation_status ??
        asset.sourceMeta?.valuationStatus ??
        asset.sourceMeta?.valuation_status ??
        null,
    },
  };
}

function normalizeActions(actions, maxActions) {
  if (!Array.isArray(actions)) return [];

  return actions
    .filter(Boolean)
    .slice(0, maxActions);
}

function normalizeDecisionSupport(analysis, portfolioV3) {
  const decisionSupport =
    analysis?.aiReport?.decisionSupport ?? {};

  const backendPlan =
    decisionSupport.recommendations ??
    portfolioV3?.rebalancePlan ??
    analysis?.rebalancePlan ??
    EMPTY_PLAN;

  const policy =
    backendPlan.transactionPolicy ??
    decisionSupport.transactionPolicy ??
    {};

  const maxActions = Math.max(
    1,
    safeNumber(
      policy.maxMonthlyOpportunities,
      2,
    ),
  );

  const monthly = normalizeActions(
    backendPlan.monthly,
    maxActions,
  );

  const lumpSum = normalizeActions(
    backendPlan.lumpSum,
    maxActions,
  );

  const backendActions = normalizeActions(
    backendPlan.actions,
    maxActions,
  );

  const actions = backendActions.length
    ? backendActions
    : monthly.length
      ? monthly
      : lumpSum;

  return {
    ...decisionSupport,
    recommendations: {
      ...backendPlan,
      monthly,
      lumpSum,
      actions,
      opportunityCount: actions.length,
      transactionPolicy: {
        ...policy,
        maxMonthlyOpportunities: maxActions,
      },
    },
    rebalancePlan: {
      ...backendPlan,
      monthly,
      lumpSum,
      actions,
      opportunityCount: actions.length,
      transactionPolicy: {
        ...policy,
        maxMonthlyOpportunities: maxActions,
      },
    },
  };
}

export function usePortfolioData({
  loading = false,
  todayPortfolioAnalysis = null,
  todayPortfolioV3 = null,
  manualAssets = [],
} = {}) {
  const analysis = todayPortfolioAnalysis ?? null;

  const portfolioV3 =
    analysis?.portfolioV3 ??
    todayPortfolioV3 ??
    null;

 const assets = useMemo(() => {
  const analyzedAssets = Array.isArray(
    portfolioV3?.assets,
  )
    ? portfolioV3.assets
    : [];

  const normalizedManualAssets = Array.isArray(
    manualAssets,
  )
    ? manualAssets.map(normalizeAsset)
    : [];

  const manualById = new Map(
    normalizedManualAssets.map((asset) => [
      asset.id,
      asset,
    ]),
  );

  const manualBySourceAndSymbol = new Map(
    normalizedManualAssets.map((asset) => [
      `${asset.source}:${asset.symbol}`,
      asset,
    ]),
  );

  const mergedAssets = analyzedAssets.map(
    (analyzedAsset) => {
      const normalizedAnalysis = normalizeAsset(
        analyzedAsset,
      );

      const matchingManualAsset =
        manualById.get(normalizedAnalysis.id) ??
        manualBySourceAndSymbol.get(
          `${normalizedAnalysis.source}:${normalizedAnalysis.symbol}`,
        );

      if (
        normalizedAnalysis.source === 'quantfury' &&
        matchingManualAsset
      ) {
        return normalizeAsset({
          ...normalizedAnalysis,
          ...matchingManualAsset,

          // Conserva classification/strategy del análisis
          // cuando el asset manual no los tenga.
          classification:
            matchingManualAsset.classification ??
            normalizedAnalysis.classification,

          strategy:
            matchingManualAsset.strategy ??
            normalizedAnalysis.strategy,

          sourceMeta: {
            ...normalizedAnalysis.sourceMeta,
            ...matchingManualAsset.sourceMeta,
          },

          // Quantfury: prioriza el dato normalizado del snapshot.
          valueUSD:
            matchingManualAsset.marketValueUSD ??
            matchingManualAsset.costBasisUSD ??
            matchingManualAsset.valueUSD ??
            normalizedAnalysis.valueUSD,
        });
      }

      return normalizedAnalysis;
    },
  );

  const analyzedKeys = new Set(
    mergedAssets.map(
      (asset) => `${asset.source}:${asset.symbol}`,
    ),
  );

  const missingManualAssets =
    normalizedManualAssets.filter(
      (asset) =>
        !analyzedKeys.has(
          `${asset.source}:${asset.symbol}`,
        ),
    );

  return [
    ...mergedAssets,
    ...missingManualAssets,
  ];
}, [portfolioV3, manualAssets]);

  const filters = usePortfolioFilters(assets);
  const totals = portfolioV3?.totals ?? {};

  const summary = {
    totalUSD: safeNumber(totals.totalUSD),
    investableUSD: safeNumber(totals.investableUSD),
    reserveUSD: safeNumber(totals.reserveUSD),
    patrimonyUSD: safeNumber(totals.patrimonyUSD),
  };

  const allocationAnalysis =
    analysis?.aiReport?.allocationAnalysis ??
    portfolioV3?.allocationAnalysis ??
    {};

  const byRole =
    allocationAnalysis.byRole ??
    portfolioV3?.portfolio?.byRole ??
    {};

  const byRoleUSD =
    analysis?.aiReport?.totalsByRoleUSD ??
    portfolioV3?.portfolio?.byRoleUSD ??
    portfolioV3?.portfolio?.totalsByRoleUSD ??
    {};

  const byAssetClass =
    allocationAnalysis.byAssetClass ??
    portfolioV3?.portfolio?.byAssetClass ??
    {};

  const bySubClass =
    allocationAnalysis.bySubClass ??
    portfolioV3?.portfolio?.bySubClass ??
    {};

  const targets =
    allocationAnalysis.targets ??
    analysis?.aiReport?.targets ??
    portfolioV3?.activeTargets ??
    portfolioV3?.targets ??
    {};

  const sourceRows =
    Array.isArray(allocationAnalysis.roleRows)
      ? allocationAnalysis.roleRows
      : Array.isArray(allocationAnalysis.rows)
        ? allocationAnalysis.rows
        : [];

  const allocationRows = sourceRows.length
    ? sourceRows.map((row) => {
        const role = row.role ?? row.key;

        return {
          ...row,
          key: role,
          role,
          label: row.label ?? role,
          current: safeNumber(row.current ?? row.currentPct),
          currentPct: safeNumber(row.currentPct ?? row.current),
          currentUSD: safeNumber(byRoleUSD[role]),
          target: safeNumber(row.target ?? row.targetPct ?? targets[role], null),
          targetPct: safeNumber(row.targetPct ?? row.target ?? targets[role], null),
          difference: safeNumber(row.difference ?? row.differencePct, null),
          differencePct: safeNumber(row.differencePct ?? row.difference, null),
          assets: assets.filter((asset) => asset.role === role),
        };
      })
    : Object.entries(byRole).map(([role, value]) => ({
        key: role,
        role,
        label: role,
        current: safeNumber(value),
        currentPct: safeNumber(value),
        currentUSD: safeNumber(byRoleUSD[role]),
        target: safeNumber(targets[role], null),
        targetPct: safeNumber(targets[role], null),
        difference: null,
        differencePct: null,
        status: "unknown",
        action: null,
        assets: assets.filter((asset) => asset.role === role),
      }));

  const sectorAnalysis =
    analysis?.aiReport?.sectorAnalysis ??
    portfolioV3?.sectorAnalysis ??
    analysis?.sectorAnalysis ??
    { sectors: [] };

  const decisionSupport = normalizeDecisionSupport(analysis, portfolioV3);

  const fx = analysis?.provenance?.fx ?? {};
  const bobRate = safeNumber(
    fx.rateBOBPerUSD ?? analysis?.aiReport?.snapshot?.bobRate,
    null,
  );
console.table(
  assets
    .filter((asset) => asset.source === 'quantfury')
    .map((asset) => ({
      symbol: asset.symbol,
      quantity: asset.quantity,
      entryPrice: asset.entryPrice,
      sourceMetaEntryPrice: asset.sourceMeta?.entryPrice,
      costBasisUSD: asset.costBasisUSD,
      valueUSD: asset.valueUSD,
    })),
);
  return {
    loading,
    analysis,
    portfolioV3,
    aiReport: analysis?.aiReport ?? null,
    historicalAnalysis: analysis?.historicalAnalysis ?? null,
    dataQuality: analysis?.dataQuality ?? null,
    provenance: analysis?.provenance ?? null,
    operationalRisk: analysis?.operationalRisk ?? null,
    generatedAt:
      analysis?.asOfDate ??
      analysis?.date ??
      analysis?.aiReport?.snapshot?.asOfDate ??
      null,
    bobRate,
    fx: {
      rateBOBPerUSD: bobRate,
      rateUSDPerBOB: bobRate > 0 ? 1 / bobRate : null,
      source: fx.source ?? null,
      status: fx.status ?? "unknown",
      providerUpdatedAt: fx.providerUpdatedAt ?? null,
    },
    summary,
    risk:
      analysis?.aiReport?.riskAssessment ??
      portfolioV3?.risk ??
      {},
    allocation: {
      rows: allocationRows,
      roles: allocationRows,
      roleRows: allocationRows,
      data: allocationRows,
      byRole,
      byRoleUSD,
      byAssetClass,
      bySubClass,
      targets,
      sectors: sectorAnalysis.sectors ?? [],
    },
    targets,
    decisionSupport,
    rebalance: decisionSupport.rebalancePlan,
    sectorAnalysis,
    heatmapAssets: filters?.investableAssets ?? assets,
    filteredAssets: filters?.filteredAssets ?? assets,
    assets,
    filters,
    reserves: assets.filter((asset) => asset.role === "reserve"),
    patrimony: assets.filter((asset) => asset.role === "patrimony"),
  };
}