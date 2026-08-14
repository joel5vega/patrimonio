import { useMemo } from 'react';
import {
  INVESTOR_PROFILES,
  PORTFOLIO_TARGETS,
  buildPortfolioV3,
  buildSectorAnalysis,
  buildTargetAnalysis,
} from '../utils/portfolioAnalysis';
import {
  buildPortfolioAIReport,
  buildAllocationAnalysis,
} from '../utils/portfolioAIReport';
import {
  buildGroupDefinitions,
  buildSourceExposure,
  selectPatrimonyAssets,
  selectReserveAssets,
} from '../utils/portfolioSelectors';
import { usePortfolioFilters } from './usePortfolioFilters';

const EMPTY_PLAN = {
  monthly: [],
  lumpSum: [],
  actions: [],
  monthlyUSD: 0,
  deployableCash: 0,
  remainingCash: 0,
};

function safeObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function buildAllocationCompatibility(analysis, targets) {
  const portfolio = analysis?.portfolio || {};
  const byRole = portfolio.byRole || {};
  const byAssetClass = portfolio.byAssetClass || {};
  const bySubClass = portfolio.bySubClass || {};
  const assets = analysis?.assets || [];

  const targetAnalysis = buildTargetAnalysis(byRole, targets);

  const rows = targetAnalysis.map((targetData) => ({
    ...targetData,
    key: targetData.role,
    label: targetData.role,
    current: Number(byRole[targetData.role] || 0),
    currentPct: Number(byRole[targetData.role] || 0),
    target: Number(targets?.[targetData.role] || 0),
    difference: targetData.differencePct,
    assets: assets.filter((asset) => asset.classification?.role === targetData.role),
  }));

  return {
    rows,
    roles: rows,
    roleRows: rows,
    data: rows,
    byRole,
    byAssetClass,
    bySubClass,
    sectors: analysis?.sectorAnalysis?.sectors || [],
  };
}

function buildDecisionSupportCompatibility(analysis, aiReport) {
  const ai = safeObject(aiReport?.decisionSupport);
  const alertsObj = analysis?.alerts || {};
  const plan = analysis?.rebalancePlan || EMPTY_PLAN;

  const ALERT_TITLES = {
    lowCash: 'Liquidez Baja',
    overCash: 'Exceso de Liquidez',
    underCore: 'Baja Exposición Core',
    overSpeculative: 'Exceso Especulativo',
    excessTrading: 'Exceso en Trading',
    highRisk: 'Riesgo Elevado',
    lowDiversification: 'Baja Diversificación',
    noPrivateEquity: 'Sin Private Equity',
  };

  const alertItems = Object.entries(alertsObj)
    .filter(([, active]) => Boolean(active))
    .map(([key]) => {
      const isCritical = ['lowCash', 'underCore', 'overSpeculative', 'highRisk'].includes(key);
      return {
        key,
        title: ALERT_TITLES[key] || key,
        category: 'Alerta de Portafolio',
        severity: isCritical ? 'critical' : 'warning',
      };
    });

  // SOLUCIÓN AL BUILD DECISSION: Estructurarlo de forma fija para que no devuelva arreglos vacíos por fallback
  return {
    ...ai,
    alerts: {
      items: alertItems,
    },
    recommendations: {
      monthly: plan.monthly || [],
      lumpSum: plan.lumpSum || [],
    },
    rebalancePlan: plan,
  };
}

export function usePortfolioData({
  cryptoAssets = [],
  inversionPositions = [],
  manualAssets = [],
  bobRate = null,
  loading = false,
  todayPortfolioV3 = null,
  investorProfile = 'moderado',
  customTargets = null,
} = {}) {
  const allAssets = useMemo(
    () => [...cryptoAssets, ...inversionPositions, ...manualAssets],
    [cryptoAssets, inversionPositions, manualAssets],
  );

  const totalUSD = useMemo(
    () => allAssets.reduce((sum, asset) => sum + Number(asset.valueUSD || 0), 0),
    [allAssets],
  );

  const activeTargets = useMemo(() => {
    if (investorProfile === 'personalizado') {
      return customTargets || PORTFOLIO_TARGETS;
    }
    return INVESTOR_PROFILES[investorProfile]?.targets || PORTFOLIO_TARGETS;
  }, [investorProfile, customTargets]);

  const analysis = useMemo(
    () => buildPortfolioV3({
      allAssets,
      totalUSD,
      monthlyUSD: bobRate ? Math.round(2000 / bobRate) : 173,
      customTargets: activeTargets,
    }),
    [allAssets, totalUSD, bobRate, activeTargets],
  );

  const legacyAllocation = useMemo(() => {
    try {
      return buildAllocationAnalysis(analysis) || {};
    } catch {
      return {};
    }
  }, [analysis]);

  const allocation = useMemo(
    () => ({
      ...legacyAllocation,
      ...buildAllocationCompatibility(analysis, activeTargets),
    }),
    [analysis, activeTargets, legacyAllocation],
  );

  // SOLUCIÓN A SECTORES 0.0%: Enviar 'investableUSD' para calcular porcentajes reales
  const sectorAnalysis = useMemo(
    () => analysis?.sectorAnalysis || buildSectorAnalysis(analysis?.assets || [], analysis?.totals?.investableUSD || 0),
    [analysis],
  );

  const aiReport = useMemo(() => {
    try {
      return buildPortfolioAIReport({
        analysis: todayPortfolioV3 || analysis,
        investorProfile,
        bobRate,
        sources: ['binance', 'admirals', 'quantfury', 'manual'],
      });
    } catch {
      return {
        snapshot: { generatedAt: new Date().toISOString() },
        financialState: {},
        riskAssessment: {},
        decisionSupport: {},
      };
    }
  }, [analysis, todayPortfolioV3, investorProfile, bobRate]);

  const analysisAssets = analysis?.assets || [];
  const filters = usePortfolioFilters(analysisAssets);

  const excludedAssets = useMemo(
    () => ({
      reserves: selectReserveAssets(analysisAssets),
      patrimony: selectPatrimonyAssets(analysisAssets),
    }),
    [analysisAssets],
  );

  const decisionSupport = useMemo(
    () => buildDecisionSupportCompatibility(analysis, aiReport),
    [analysis, aiReport],
  );

  const generatedAt = aiReport?.snapshot?.generatedAt || analysis?.generatedAt || new Date().toISOString();
  const summary = aiReport?.financialState || {
    totalUSD: analysis?.totals?.totalUSD || 0,
    investableUSD: analysis?.totals?.investableUSD || 0,
    reserveUSD: analysis?.totals?.reserveUSD || 0,
    patrimonyUSD: analysis?.totals?.patrimonyUSD || 0,
  };
  const risk = aiReport?.riskAssessment || analysis?.risk || {};
  const heatmapAssets = filters?.investableAssets || [];
  const filteredAssets = filters?.filteredAssets || heatmapAssets;

  return {
    loading,
    analysis,
    aiReport,
    profile: investorProfile,
    generatedAt,
    bobRate,
    summary,
    risk,
    allocation,
    targets: activeTargets,
    decisionSupport,
    rebalance: analysis?.rebalancePlan || EMPTY_PLAN,
    sectorAnalysis,
    groups: buildGroupDefinitions(heatmapAssets),
    heatmapAssets,
    filteredAssets,
    excludedAssets,
    reserves: excludedAssets.reserves,
    patrimony: excludedAssets.patrimony,
    exposureBySource: buildSourceExposure(analysisAssets),
    filters,
  };
}