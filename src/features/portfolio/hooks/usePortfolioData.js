// src/features/portfolio/hooks/usePortfolioData.js
import { useMemo ,useEffect} from "react";
import { usePortfolioFilters } from "./usePortfolioFilters";
import {
  INVESTOR_PROFILES,
  DEFAULT_INVESTOR_PROFILE,
} from "../constants/portfolioRules";

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

function getPositiveNumber(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return null;
}

function getEntryPrice(asset) {
  return getPositiveNumber(
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
  return getPositiveNumber(
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
    asset?.pnl_usd,
    asset?.sourceMeta?.unrealizedPnlUSD,
    asset?.sourceMeta?.unrealized_pnl_usd,
    asset?.sourceMeta?.pnlUSD,
    asset?.sourceMeta?.pnl_usd,
  );
}

function getUnrealizedPnlPct(asset) {
  return firstFiniteNumber(
    asset?.unrealizedPnlPct,
    asset?.unrealized_pnl_pct,
    asset?.pnlPct,
    asset?.pnl_pct,
    asset?.changePct,
    asset?.change_pct,
    asset?.sourceMeta?.unrealizedPnlPct,
    asset?.sourceMeta?.unrealized_pnl_pct,
    asset?.sourceMeta?.pnlPct,
    asset?.sourceMeta?.pnl_pct,
    asset?.sourceMeta?.changePct,
    asset?.sourceMeta?.change_pct,
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
    (unrealizedPnlUSD !== null &&
    costBasisUSD !== null &&
    costBasisUSD > 0
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

    // Contrato normalizado común.
    quantity,
    entryPrice,
    marketPrice,
    costBasisUSD,
    marketValueUSD,
    unrealizedPnlUSD,
    unrealizedPnlPct,
    realizedPnlUSD: getRealizedPnl(asset),

    // Compatibilidad con componentes existentes.
    valueUSD: safeNumber(valueUSD),
    weightPct: safeNumber(asset.weightPct ?? asset.weight),
    pnlUSD: unrealizedPnlUSD,
    pnlPct: unrealizedPnlPct,
    changePct: firstFiniteNumber(
      asset?.changePct,
      asset?.change_pct,
      asset?.sourceMeta?.changePct,
      asset?.sourceMeta?.change_pct,
    ),
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

  return actions.filter(Boolean).slice(0, maxActions);
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
    safeNumber(policy.maxMonthlyOpportunities, 2),
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

// ─── Helpers para futuros ────────────────────────────────────

const DERIVATIVES_SOURCES = new Set([
  "binance",
  "bybit",
  "binance_usdm",
  "binanceusdm",
]);

function isDerivativesExchange(asset = {}) {
  const source = String(
    asset.source ?? asset.groupKey ?? "",
  ).toLowerCase();

  return DERIVATIVES_SOURCES.has(source);
}

function getPositionSide(asset = {}) {
  return (
    asset.positionSide ??
    asset.sourceMeta?.positionSide ??
    null
  );
}

function isFuturesAsset(asset = {}) {
  if (!isDerivativesExchange(asset)) return false;

  const positionSide = getPositionSide(asset);

  const hasNotional = Boolean(
    asset.notionalUSD ??
      asset.sourceMeta?.notionalUSD,
  );

  return (
    asset.type === "futures" ||
    Boolean(positionSide) ||
    hasNotional
  );
}

function futuresDedupeKey(asset = {}) {
  return [
    asset.source ?? asset.groupKey ?? "unknown",
    asset.symbol ?? asset.name ?? "unknown",
    asset.positionSide ?? "",
    asset.quantity ?? "",
    asset.entryPrice ?? "",
  ].join(":");
}

// ─── Hook ────────────────────────────────────────────────────

export function usePortfolioData({
  loading = false,
  todayPortfolioAnalysis = null,
  todayPortfolioV3 = null,
  manualAssets = [],
  investorProfile = DEFAULT_INVESTOR_PROFILE,
} = {}) {
  
  const analysis = todayPortfolioAnalysis ?? null;

  const portfolioV3 =
    analysis?.portfolioV3 ??
    todayPortfolioV3 ??
    null;

  // 1. Assets normalizados (spot + Quantfury + manuales)
  const assets = useMemo(() => {
    const analyzedAssets = Array.isArray(portfolioV3?.assets)
      ? portfolioV3.assets
      : [];

    const normalizedManualAssets = Array.isArray(manualAssets)
      ? manualAssets.map(normalizeAsset)
      : [];

    const manualById = new Map(
      normalizedManualAssets.map((asset) => [asset.id, asset]),
    );

    const manualBySourceAndSymbol = new Map(
      normalizedManualAssets.map((asset) => [
        `${asset.source}:${asset.symbol}`,
        asset,
      ]),
    );

    const mergedAssets = analyzedAssets.map((analyzedAsset) => {
      const normalizedAnalysis = normalizeAsset(analyzedAsset);

      const matchingManualAsset =
        manualById.get(normalizedAnalysis.id) ??
        manualBySourceAndSymbol.get(
          `${normalizedAnalysis.source}:${normalizedAnalysis.symbol}`,
        );

      if (
        normalizedAnalysis.source === "quantfury" &&
        matchingManualAsset
      ) {
        return normalizeAsset({
          ...normalizedAnalysis,
          ...matchingManualAsset,
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
          valueUSD:
            matchingManualAsset.marketValueUSD ??
            matchingManualAsset.costBasisUSD ??
            matchingManualAsset.valueUSD ??
            normalizedAnalysis.valueUSD,
        });
      }

      return normalizedAnalysis;
    });

    const analyzedKeys = new Set(
      mergedAssets.map(
        (asset) => `${asset.source}:${asset.symbol}`,
      ),
    );

    const missingManualAssets = normalizedManualAssets.filter(
      (asset) =>
        !analyzedKeys.has(`${asset.source}:${asset.symbol}`),
    );

    return [...mergedAssets, ...missingManualAssets];
  }, [portfolioV3, manualAssets]);

  // 2. Futuros (portfolioV3 + operationalRisk para SHORTs con valueUSD=0)
  const futuresAssets = useMemo(() => {
    // 2a. Del portfolioV3.assets
    const fromPortfolio = assets.filter(isFuturesAsset);

    // 2b. Del operationalRisk (incluye SHORTs con valueUSD=0)
    const operationalRisk =
      analysis?.operationalRisk ?? {};

    const binanceShorts =
      operationalRisk?.binance?.usdMFutures?.shortPositions ?? [];

    const binanceLongs =
      operationalRisk?.binance?.usdMFutures?.longPositions ?? [];

    const bybitShorts =
      operationalRisk?.bybit?.futures?.shortPositions ?? [];

    const bybitLongs =
      operationalRisk?.bybit?.futures?.longPositions ?? [];

    const fromOperationalRisk = [
      ...binanceShorts.map((position) => ({
        ...position,
        source: position.source ?? "binance",
        groupKey: position.groupKey ?? "binance_usdm",
      })),
      ...binanceLongs.map((position) => ({
        ...position,
        source: position.source ?? "binance",
        groupKey: position.groupKey ?? "binance_usdm",
      })),
      ...bybitShorts.map((position) => ({
        ...position,
        source: position.source ?? "bybit",
        groupKey: position.groupKey ?? "bybit",
      })),
      ...bybitLongs.map((position) => ({
        ...position,
        source: position.source ?? "bybit",
        groupKey: position.groupKey ?? "bybit",
      })),
    ].map((position) =>
      normalizeAsset({
        ...position,
        id:
          position.id ??
          `${position.source}-${position.symbol}-${position.positionSide ?? ""}`,
      }),
    );

    // 2c. Merge sin duplicados
    const seen = new Set();
    const merged = [];

    for (const asset of [
      ...fromPortfolio,
      ...fromOperationalRisk,
    ]) {
      const key = futuresDedupeKey(asset);

      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(asset);
    }

    return merged;
  }, [assets, analysis]);

  // 3. Filtros (aplicados sobre assets, no futuros)
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

  const backendTargets =
    allocationAnalysis.targets ??
    analysis?.aiReport?.targets ??
    portfolioV3?.activeTargets ??
    portfolioV3?.targets ??
    {};

  const profileKey =
    investorProfile || DEFAULT_INVESTOR_PROFILE;

  const profileTargets =
    INVESTOR_PROFILES[profileKey]?.targets ?? null;

  const targets =
    profileTargets && typeof profileTargets === "object"
      ? profileTargets
      : backendTargets;

  const sourceRows = Array.isArray(allocationAnalysis.roleRows)
    ? allocationAnalysis.roleRows
    : Array.isArray(allocationAnalysis.rows)
      ? allocationAnalysis.rows
      : [];

  function statusFromDiff(diff) {
    const abs = Math.abs(safeNumber(diff, 0));
    if (abs >= 5) return "critical";
    if (abs >= 1) return "warning";
    return "ok";
  }

  const allocationRows = sourceRows.length
    ? sourceRows.map((row) => {
        const role = row.role ?? row.key;
        const currentPct = safeNumber(
          row.currentPct ?? row.current,
        );
        const targetPct = safeNumber(
          targets[role] ?? row.targetPct ?? row.target,
          null,
        );
        const differencePct =
          targetPct === null || targetPct === undefined
            ? null
            : currentPct - targetPct;

        return {
          ...row,
          key: role,
          role,
          label: row.label ?? role,
          current: currentPct,
          currentPct,
          currentUSD: safeNumber(
            row.currentUSD ?? byRoleUSD[role],
          ),
          target: targetPct,
          targetPct,
          difference: differencePct,
          differencePct,
          status:
            differencePct === null
              ? "unknown"
              : statusFromDiff(differencePct),
          assets: assets.filter(
            (asset) => asset.role === role,
          ),
        };
      })
    : Object.entries(byRole).map(([role, value]) => {
        const currentPct = safeNumber(value);
        const targetPct = safeNumber(targets[role], null);
        const differencePct =
          targetPct === null || targetPct === undefined
            ? null
            : currentPct - targetPct;

        return {
          key: role,
          role,
          label: role,
          current: currentPct,
          currentPct,
          currentUSD: safeNumber(byRoleUSD[role]),
          target: targetPct,
          targetPct,
          difference: differencePct,
          differencePct,
          status:
            differencePct === null
              ? "unknown"
              : statusFromDiff(differencePct),
          action: null,
          assets: assets.filter(
            (asset) => asset.role === role,
          ),
        };
      });

  const sectorAnalysis =
    analysis?.aiReport?.sectorAnalysis ??
    portfolioV3?.sectorAnalysis ??
    analysis?.sectorAnalysis ??
    { sectors: [] };

  const decisionSupport = normalizeDecisionSupport(
    analysis,
    portfolioV3,
  );

  const historicalContext =
    analysis?.aiReport?.historicalContext ??
    portfolioV3?.historicalContext ??
    analysis?.historicalContext ??
    null;

  const fx = analysis?.provenance?.fx ?? {};
  const bobRate = safeNumber(
    fx.rateBOBPerUSD ??
      analysis?.aiReport?.snapshot?.bobRate,
    null,
  );


//   useEffect(() => {
//   console.log('usePortfolioData.assets:', assets.length);
//   console.log('hasUSDT:', assets.some(a => a.symbol === 'USDT'));
//   console.log('hasXRP:', assets.some(a => a.symbol === 'XRP'));
//   console.log('USDT raw:', assets.find(a => a.symbol === 'USDT'));
// }, [assets]);
  return {
    loading,
    analysis,
    portfolioV3,
    aiReport: analysis?.aiReport ?? null,
    historicalAnalysis:
      analysis?.historicalAnalysis ?? null,
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
    historicalContext,

    // Assets y derivados
    assets,
    futuresAssets,
    heatmapAssets: filters?.investableAssets ?? assets,
    filteredAssets: filters?.filteredAssets ?? assets,

    filters,

    reserves: assets.filter(
      (asset) => asset.role === "reserve",
    ),
    patrimony: assets.filter(
      (asset) => asset.role === "patrimony",
    ),
  };
}