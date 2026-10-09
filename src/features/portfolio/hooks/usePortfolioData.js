import { useState, useMemo } from 'react';

// ─── PERFILES OFICIALES DEL BACKEND ─────────────────────────
const PORTFOLIO_TARGETS = {
  core: 40,
  growth: 25,
  defensive: 18,
  liquidity: 14,
  speculative: 3,
};

const INVESTOR_PROFILES = {
  defensivo: {
    label: 'Defensivo',
    description: 'Preservar capital.',
    targets: {
      core: 45,
      growth: 10,
      defensive: 25,
      liquidity: 15,
      speculative: 1,
      trading: 1,
    },
    tradingInTargets: true,
  },
  moderado: {
    label: 'Moderado',
    description: 'Balance entre crecimiento y protección.',
    targets: PORTFOLIO_TARGETS,
    tradingInTargets: false,
  },
  moderado_agresivo: {
    label: 'Moderado-Agresivo',
    description: 'Crecimiento a largo plazo en core + growth, defensivos reales y liquidez estratégica.',
    targets: {
      core: 40,
      growth: 25,
      defensive: 18,
      liquidity: 14,
      speculative: 3,
    },
    tradingInTargets: false,
  },
  crecimiento: {
    label: 'Crecimiento',
    description: 'Maximizar rendimiento.',
    targets: {
      core: 30,
      growth: 35,
      defensive: 12,
      liquidity: 10,
      speculative: 6,
      trading: 7,
    },
    tradingInTargets: true,
  },
  agresivo: {
    label: 'Agresivo',
    description: 'Alta exposición a crecimiento y activos de riesgo.',
    targets: {
      core: 20,
      growth: 40,
      defensive: 8,
      liquidity: 7,
      speculative: 15,
      trading: 10,
    },
    tradingInTargets: true,
  },
  personalizado: {
    label: 'Personalizado',
    description: 'Ajuste manual.',
    targets: null,
    tradingInTargets: false,
  },
};

export function usePortfolioData({
  loading: appLoading,
  todayPortfolioAnalysis,
  todayPortfolioV3,
  manualAssets,
  investorProfile = 'moderado',
  futuresMonitoring = null,
}) {
  const [activeTab, setActiveTab] = useState('all');
  const portfolio = useMemo(() => {
    const v3Data = todayPortfolioV3 || {};
    console.log(v3Data.heatmapAssets.length);
    const analysisData = todayPortfolioAnalysis || {};

    const valuation = v3Data.snapshot?.valuation || analysisData.snapshot?.valuation || {};
    const bobRate = valuation.bobRate || 11.95;
    const generatedAt = v3Data.snapshot?.generatedAt || analysisData.snapshot?.generatedAt || new Date().toISOString();

    const heatmapAssets = v3Data.heatmapAssets || v3Data.assets || [];

    const rolesMap = v3Data.portfolio?.byRole || {};
    const rolesUSDMap = v3Data.portfolio?.byRoleUSD || {};

    // --- CORRECCIÓN TARGETS: Prioridad al perfil seleccionado en el frontend ---
    const profileConfig = INVESTOR_PROFILES[investorProfile] || INVESTOR_PROFILES.moderado;
    
    let effectiveTargets = PORTFOLIO_TARGETS;
    if (investorProfile === 'personalizado') {
      effectiveTargets = v3Data.activeTargets || rolesMap;
    } else if (profileConfig && profileConfig.targets) {
      effectiveTargets = profileConfig.targets;
    } else if (v3Data.activeTargets) {
      effectiveTargets = v3Data.activeTargets;
    }

    const allRoles = new Set([...Object.keys(rolesMap), ...Object.keys(effectiveTargets)]);
    
    const allocation = Array.from(allRoles).map((roleKey) => ({
      role: roleKey,
      name: roleKey,
      currentPct: rolesMap[roleKey] || 0,
      currentUSD: rolesUSDMap[roleKey] || 0,
      targetPct: effectiveTargets[roleKey] || 0,
    }));

    const summary = v3Data.summary || {
      investableUSD: v3Data.totals?.investableUSD || 0,
      totalUSD: v3Data.totals?.totalUSD || 0,
      cashUSD: v3Data.portfolio?.investableCashUSD || 0,
    };

    const sectorAnalysis = v3Data.sectorAnalysis?.sectors || [];

    // --- Búsqueda exhaustiva del historicalAnalysis ---
    const rawWindows = 
      analysisData.historicalAnalysis?.windows || 
      analysisData.windows || 
      v3Data.windows || 
      {};

    const mapWindowData = (winData) => {
      if (!winData || Object.keys(winData).length === 0) {
        return {
          available: false,
          performance: {
            cashFlowAdjustedChangeUSD: 0,
            netPerformancePct: 0,
            marketChangeUSD: 0,
            marketChangePct: 0,
            startFinancialUSD: 0,
            endFinancialUSD: 0,
          },
          cashFlows: { netFlowsUSD: 0, depositsUSD: 0, withdrawalsUSD: 0 },
          exchangeRate: null
        };
      }
      
      return {
        available: winData.available ?? true,
        performance: {
          cashFlowAdjustedChangeUSD: 
            winData.performance?.cashFlowAdjustedChangeUSD ?? 
            winData.changeUSD ?? 
            0,
          netPerformancePct: 
            winData.performance?.netPerformancePct ?? 
            winData.netPerformancePct ?? 
            0,
          marketChangeUSD: winData.performance?.marketChangeUSD ?? 0,
          marketChangePct: winData.performance?.marketChangePct ?? 0,
          startFinancialUSD: winData.performance?.startFinancialUSD ?? 0,
          endFinancialUSD: winData.performance?.endFinancialUSD ?? 0,
        },
        cashFlows: winData.cashFlows || { netFlowsUSD: 0, depositsUSD: 0, withdrawalsUSD: 0 },
        exchangeRate: winData.exchangeRate || null
      };
    };

    const historicalContext = {
      available: true,
      windows: {
        '1D': mapWindowData(rawWindows['1D']),
        '7D': mapWindowData(rawWindows['7D']),
        '30D': mapWindowData(rawWindows['30D']),
        '90D': mapWindowData(rawWindows['90D']),
      },
    };

    const performance = v3Data.performance || analysisData.performance || {
      ...historicalContext,
    };

    const decisionSupport = v3Data.decisionSupport || {
      backendRecommendations: analysisData.decisionContext?.backendRecommendations || [],
      backendAssessment: analysisData.decisionContext?.backendAssessment || {},
    };

    const reserves = v3Data.reserves || {};
    const patrimony = v3Data.patrimony || {};
    const exposureBySource = v3Data.exposureBySource || [];

    const rawAiReport = v3Data.aiReport || analysisData.aiReport || analysisData.decisionContext || v3Data.decisionSupport;
    let aiReport = {};

    if (typeof rawAiReport === 'string') {
      try {
        aiReport = JSON.parse(rawAiReport);
      } catch (e) {
        aiReport = { message: rawAiReport };
      }
    } else if (rawAiReport && typeof rawAiReport === 'object' && Object.keys(rawAiReport).length > 0) {
      aiReport = rawAiReport;
    } else {
      aiReport = {
        generatedAt,
        summary,
        allocation,
        status: "synchronized"
      };
    }
    return {
      generatedAt,
      bobRate,
      summary,
      historicalContext,
      performance,
      heatmapAssets,
      allocation,
      targets: effectiveTargets, // <-- Ya cambia dinámicamente según el perfil seleccionado
      sectorAnalysis,
      decisionSupport,
      filters: {
        activeTab,
        setActiveTab,
      },
      reserves,
      patrimony,
      exposureBySource,
      aiReport,
      futuresMonitoring, // <-- Agregamos el objeto completo de monitoreo de futuros
    };
  }, [todayPortfolioV3, todayPortfolioAnalysis, manualAssets, investorProfile, activeTab]);
  return {
    loading: appLoading,
    ...portfolio,
  };
}