// src/features/portfolio/hooks/usePortfolioData.js
//
// Capa de lectura del portafolio. El backend (buildPortfolioV3) ya entrega
// construidos sectorAnalysis (look-through) y heatmapAssets, así que aquí
// solo se SELECCIONA lo que cada componente necesita:
//
//   análisis + manuales → assets → { futuros, reservas, patrimonio, filtros }
//   portfolioV3         → { resumen, riesgo, asignación, sectores, heatmap }
//
// Ya no se descarga etf-exposure.json ni se hace look-through en el navegador.

import { useMemo } from 'react';

import { usePortfolioFilters } from './usePortfolioFilters';
import { DEFAULT_INVESTOR_PROFILE, INVESTOR_PROFILES } from '../constants/portfolioRules';

import { buildAllocationRows } from './portfolioData/allocationRows';
import { normalizeDecisionSupport } from './portfolioData/decisionSupport';
import { extractFuturesAssets } from './portfolioData/futuresAssets';
import { attachLiveMetrics } from './portfolioData/heatmapTiles';
import { mergeAnalysisWithManual } from './portfolioData/mergeAssets';
import { isReserveAsset } from './portfolioData/normalizeAsset';
import { getAssetValueUSD, safeNumber } from './portfolioData/numbers';

const EMPTY_SECTORS = { sectors: [] };

// ── Selectores sobre el análisis ────────────────────────────

function selectSummary(portfolioV3) {
  const totals = portfolioV3?.totals ?? {};
  return {
    totalUSD: safeNumber(totals.totalUSD),
    investableUSD: safeNumber(totals.investableUSD),
    reserveUSD: safeNumber(totals.reserveUSD),
    patrimonyUSD: safeNumber(totals.patrimonyUSD),
  };
}

function selectAllocationInputs(analysis, portfolioV3, investorProfile) {
  const aiReport = analysis?.aiReport;
  const portfolio = portfolioV3?.portfolio;
  const allocationAnalysis = aiReport?.allocationAnalysis ?? portfolioV3?.allocationAnalysis ?? {};

  const backendTargets =
    allocationAnalysis.targets ??
    aiReport?.targets ??
    portfolioV3?.activeTargets ??
    portfolioV3?.targets ??
    {};

  const profileTargets = INVESTOR_PROFILES[investorProfile || DEFAULT_INVESTOR_PROFILE]?.targets;

  return {
    allocationAnalysis,
    byRole: allocationAnalysis.byRole ?? portfolio?.byRole ?? {},
    byRoleUSD:
      aiReport?.totalsByRoleUSD ?? portfolio?.byRoleUSD ?? portfolio?.totalsByRoleUSD ?? {},
    byAssetClass: allocationAnalysis.byAssetClass ?? portfolio?.byAssetClass ?? {},
    bySubClass: allocationAnalysis.bySubClass ?? portfolio?.bySubClass ?? {},
    targets: profileTargets && typeof profileTargets === 'object' ? profileTargets : backendTargets,
  };
}

function selectFx(analysis) {
  const fx = analysis?.provenance?.fx ?? {};
  const bobRate = safeNumber(fx.rateBOBPerUSD ?? analysis?.aiReport?.snapshot?.bobRate, null);

  return {
    bobRate,
    fx: {
      rateBOBPerUSD: bobRate,
      rateUSDPerBOB: bobRate > 0 ? 1 / bobRate : null,
      source: fx.source ?? null,
      status: fx.status ?? 'unknown',
      providerUpdatedAt: fx.providerUpdatedAt ?? null,
    },
  };
}

/** Valor invertible por plataforma (Binance, Wallbit, …). */
function computeExposureBySource(assets) {
  const bySource = {};

  for (const asset of assets) {
    const investable =
      asset.role !== 'reserve' &&
      asset.role !== 'patrimony' &&
      asset.classification?.isInvestable !== false;
    const value = getAssetValueUSD(asset);
    if (!investable || value <= 0) continue;

    const source = asset.source ?? asset.groupKey ?? 'unknown';
    bySource[source] = (bySource[source] ?? 0) + value;
  }

  return Object.fromEntries(
    Object.entries(bySource).map(([source, value]) => [source, Number(value.toFixed(2))]),
  );
}

// ── Hook ────────────────────────────────────────────────────

export function usePortfolioData({
  loading = false,
  todayPortfolioAnalysis = null,
  todayPortfolioV3 = null,
  manualAssets = [],
  investorProfile = DEFAULT_INVESTOR_PROFILE,
} = {}) {
  const analysis = todayPortfolioAnalysis ?? null;
  const portfolioV3 = analysis?.portfolioV3 ?? todayPortfolioV3 ?? null;

  // Activos: análisis del backend + manuales vivos
  const assets = useMemo(
    () => mergeAnalysisWithManual(portfolioV3?.assets, manualAssets),
    [portfolioV3, manualAssets],
  );
  const futuresAssets = useMemo(
    () => extractFuturesAssets(assets, analysis?.operationalRisk),
    [assets, analysis],
  );
  const filters = usePortfolioFilters(assets);
  const exposureBySource = useMemo(() => computeExposureBySource(assets), [assets]);

  // Datos ya construidos por el backend
  const heatmapAssets = useMemo(
    () =>
      portfolioV3?.heatmapAssets
        ? attachLiveMetrics(portfolioV3.heatmapAssets, assets)
        : filters?.investableAssets ?? [],
    [portfolioV3, assets, filters?.investableAssets],
  );
  const sectorAnalysis =
    portfolioV3?.sectorAnalysis ?? analysis?.aiReport?.sectorAnalysis ?? EMPTY_SECTORS;

  const summary = selectSummary(portfolioV3);
  const allocationInputs = useMemo(
    () => selectAllocationInputs(analysis, portfolioV3, investorProfile),
    [analysis, portfolioV3, investorProfile],
  );
  const allocationRows = useMemo(
    () => buildAllocationRows({ ...allocationInputs, assets }),
    [allocationInputs, assets],
  );

  const decisionSupport = useMemo(
    () => normalizeDecisionSupport(analysis, portfolioV3),
    [analysis, portfolioV3],
  );

  const { bobRate, fx } = selectFx(analysis);
  const { byRole, byRoleUSD, byAssetClass, bySubClass, targets } = allocationInputs;
  // console.log('heatmapAssets', heatmapAssets);
  // console.log('sectorAnalysis', sectorAnalysis);
  return {
    loading,
    analysis,
    portfolioV3,
    aiReport: analysis?.aiReport ?? null,
    historicalAnalysis: analysis?.historicalAnalysis ?? null,
    historicalContext:
      analysis?.aiReport?.historicalContext ??
      portfolioV3?.historicalContext ??
      analysis?.historicalContext ??
      null,
    dataQuality: analysis?.dataQuality ?? null,
    provenance: analysis?.provenance ?? null,
    operationalRisk: analysis?.operationalRisk ?? null,
    generatedAt:
      analysis?.asOfDate ??
      analysis?.date ??
      analysis?.aiReport?.snapshot?.asOfDate ??
      null,

    bobRate,
    fx,
    summary,
    risk: analysis?.aiReport?.riskAssessment ?? portfolioV3?.risk ?? {},

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
    heatmapAssets,
    futuresAssets,

    assets,
    filteredAssets: filters?.filteredAssets ?? assets,
    filters,

    reserves: assets.filter(isReserveAsset),
    patrimony: assets.filter((asset) => asset.role === 'patrimony'),
    exposureBySource,
  };
}