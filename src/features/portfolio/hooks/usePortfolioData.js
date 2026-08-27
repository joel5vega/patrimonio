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
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getAssetRole(asset) {
  return (
    asset?.classification?.role ??
    asset?.role ??
    "unclassified"
  );
}

function normalizeAsset(asset = {}, index = 0) {
  return {
    ...asset,
    id:
      asset.id ??
      `${asset.source ?? asset.groupKey ?? "asset"}-${
        asset.symbol ?? asset.name ?? index
      }`,
    name: asset.name ?? asset.symbol ?? "Activo",
    symbol: asset.symbol ?? asset.name ?? "—",
    valueUSD: safeNumber(asset.valueUSD),
    weightPct: safeNumber(
      asset.weightPct ?? asset.weight,
    ),
    role: getAssetRole(asset),
    source:
      asset.source ?? asset.groupKey ?? "unknown",
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
} = {}) {
  const analysis = todayPortfolioAnalysis ?? null;

  const portfolioV3 =
    analysis?.portfolioV3 ??
    todayPortfolioV3 ??
    null;

  const assets = useMemo(() => {
    const source = Array.isArray(
      portfolioV3?.assets,
    )
      ? portfolioV3.assets
      : [];

    return source.map(normalizeAsset);
  }, [portfolioV3]);

  const filters = usePortfolioFilters(assets);
  const totals = portfolioV3?.totals ?? {};

  const summary = {
    totalUSD: safeNumber(totals.totalUSD),
    investableUSD: safeNumber(
      totals.investableUSD,
    ),
    reserveUSD: safeNumber(totals.reserveUSD),
    patrimonyUSD: safeNumber(
      totals.patrimonyUSD,
    ),
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
          current: safeNumber(
            row.current ?? row.currentPct,
          ),
          currentPct: safeNumber(
            row.currentPct ?? row.current,
          ),
          currentUSD: safeNumber(
            byRoleUSD[role],
          ),
          target: safeNumber(
            row.target ?? row.targetPct ?? targets[role],
            null,
          ),
          targetPct: safeNumber(
            row.targetPct ?? row.target ?? targets[role],
            null,
          ),
          difference: safeNumber(
            row.difference ?? row.differencePct,
            null,
          ),
          differencePct: safeNumber(
            row.differencePct ?? row.difference,
            null,
          ),
          assets: assets.filter(
            (asset) => asset.role === role,
          ),
        };
      })
    : Object.entries(byRole).map(
        ([role, value]) => ({
          key: role,
          role,
          label: role,
          current: safeNumber(value),
          currentPct: safeNumber(value),
          currentUSD: safeNumber(
            byRoleUSD[role],
          ),
          target: safeNumber(
            targets[role],
            null,
          ),
          targetPct: safeNumber(
            targets[role],
            null,
          ),
          difference: null,
          differencePct: null,
          status: "unknown",
          action: null,
          assets: assets.filter(
            (asset) => asset.role === role,
          ),
        }),
      );

  const sectorAnalysis =
    analysis?.aiReport?.sectorAnalysis ??
    portfolioV3?.sectorAnalysis ??
    analysis?.sectorAnalysis ??
    { sectors: [] };

  const decisionSupport = normalizeDecisionSupport(
    analysis,
    portfolioV3,
  );

  const fx = analysis?.provenance?.fx ?? {};
  const bobRate = safeNumber(
    fx.rateBOBPerUSD ??
      analysis?.aiReport?.snapshot?.bobRate,
    null,
  );

  return {
    loading,
    analysis,
    portfolioV3,
    aiReport: analysis?.aiReport ?? null,
    historicalAnalysis:
      analysis?.historicalAnalysis ?? null,
    dataQuality:
      analysis?.dataQuality ?? null,
    provenance:
      analysis?.provenance ?? null,
    operationalRisk:
      analysis?.operationalRisk ?? null,
    generatedAt:
      analysis?.asOfDate ??
      analysis?.date ??
      analysis?.aiReport?.snapshot?.asOfDate ??
      null,
    bobRate,
    fx: {
      rateBOBPerUSD: bobRate,
      rateUSDPerBOB:
        bobRate > 0 ? 1 / bobRate : null,
      source: fx.source ?? null,
      status: fx.status ?? "unknown",
      providerUpdatedAt:
        fx.providerUpdatedAt ?? null,
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
    heatmapAssets:
      filters?.investableAssets ?? assets,
    filteredAssets:
      filters?.filteredAssets ?? assets,
    assets,
    filters,
    reserves: assets.filter(
      (asset) => asset.role === "reserve",
    ),
    patrimony: assets.filter(
      (asset) => asset.role === "patrimony",
    ),
  };
}