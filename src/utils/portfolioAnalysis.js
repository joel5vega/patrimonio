//src/utils/portfolioAnalysis.js
// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const ASSET_RULES = {
  // Core
  VOO:  { role: 'core',        assetClass: 'equity',       horizon: 'long',      riskLevel: 2 },
  SPY:  { role: 'core',        assetClass: 'equity',       horizon: 'long',      riskLevel: 2 },
 
  // Growth
  QQQM: { role: 'growth',      assetClass: 'equity',       horizon: 'long',      riskLevel: 3 },
  
  VXUS: { role: 'growth',      assetClass: 'equity',       horizon: 'long',      riskLevel: 3 },
  VWO:  { role: 'growth',      assetClass: 'equity',       horizon: 'long',      riskLevel: 3 },
  EMXC: { role: 'growth',      assetClass: 'equity',       horizon: 'long',      riskLevel: 3 },
  BTC:  { role: 'growth',      assetClass: 'crypto',       horizon: 'long',      riskLevel: 3 },
  ETH:  { role: 'growth',      assetClass: 'crypto',       horizon: 'long',      riskLevel: 3 },
  // Defensive
  IAU:  { role: 'defensive',   assetClass: 'commodity',    horizon: 'long',      riskLevel: 1 },
  GLD:  { role: 'defensive',   assetClass: 'commodity',    horizon: 'long',      riskLevel: 1 },
  BND:  { role: 'defensive',   assetClass: 'fixed_income', horizon: 'long',      riskLevel: 2 },
  TIP:  { role: 'defensive',   assetClass: 'fixed_income', horizon: 'long',      riskLevel: 2 },
  VNQ:  { role: 'defensive',   assetClass: 'real_estate',  horizon: 'long',      riskLevel: 2 },
   SCHD: { role: 'defensive', assetClass: 'equity',       horizon: 'long',      riskLevel: 2 },
  // Speculative
  SOL:  { role: 'speculative', assetClass: 'crypto',       horizon: 'medium',    riskLevel: 4 },
  AVAX: { role: 'speculative', assetClass: 'crypto',       horizon: 'medium',    riskLevel: 4 },
  ADA:  { role: 'speculative', assetClass: 'crypto',       horizon: 'medium',    riskLevel: 5 },
  XRP:  { role: 'speculative', assetClass: 'crypto',       horizon: 'medium',    riskLevel: 5 },
  // Liquidity / Stables
  SGOV: { role: 'liquidity',   assetClass: 'cash',         horizon: 'short',     riskLevel: 1 },
  USDT: { role: 'liquidity',   assetClass: 'cash',         horizon: 'short',     riskLevel: 1 },
  USDC: { role: 'liquidity',   assetClass: 'cash',         horizon: 'short',     riskLevel: 1 },
  BUSD: { role: 'liquidity',   assetClass: 'cash',         horizon: 'short',     riskLevel: 1 },
  DAI:  { role: 'liquidity',   assetClass: 'cash',         horizon: 'short',     riskLevel: 1 },
  FDUSD:{ role: 'liquidity',   assetClass: 'cash',         horizon: 'short',     riskLevel: 1 },
};

// Activos manuales — rol 'patrimony' = excluido del análisis de portafolio
const MANUAL_RULES = {
  'AirTM':            { role: 'yield',     assetClass: 'cash_equivalent', horizon: 'short',     riskLevel: 2 },
  'SAFI':             { role: 'defensive',  isLocked: true,   assetClass: 'cash_equivalent', horizon: 'short',     riskLevel: 2 },
  'Ahorro $':         { role: 'defensive', isLocked: true,assetClass: 'cash',            horizon: 'short',     riskLevel: 1 },
  'Ahorro Bs':        { role: 'liquidity', assetClass: 'cash',            horizon: 'short',     riskLevel: 1 },
  'Ahorro en Bs':     { role: 'liquidity', assetClass: 'cash',            horizon: 'short',     riskLevel: 1 },
  'terreno achacachi':{ role: 'patrimony', assetClass: 'real_asset',      horizon: 'very_long', riskLevel: 2 },
};

const RETURN_ASSUMPTIONS = {
  equity:          0.08,
  crypto:          0.12,
  fixed_income:    0.03,
  cash:            0.02,
  cash_equivalent: 0.05,
  commodity:       0.04,
  real_asset:      0.04,
  real_estate:     0.05,
};

const THRESHOLDS = {
  minCashPct:        15,
  maxCashPct:        40,
  maxSpeculativePct: 10,
  coreMinPct:        20,
  maxTradingPct:     25,
};

// Targets del portafolio INVERTIBLE (suman 100%)
export const PORTFOLIO_TARGETS = {
  core:        30,
  growth:      20,
  defensive:   15,
  liquidity:   10,
  yield:       15,
  speculative: 10,
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function classifyAsset(name, type, groupKey, symbol) {
  const symKey  = (symbol || '').toUpperCase().trim();
  const nameKey = (name   || '').toUpperCase().trim();
  if (symKey  && ASSET_RULES[symKey])  return ASSET_RULES[symKey];
  if (nameKey && ASSET_RULES[nameKey]) return ASSET_RULES[nameKey];

  const manualKey = Object.keys(MANUAL_RULES).find(
    k => k.toLowerCase() === (name || '').toLowerCase()
  );
  if (manualKey) return MANUAL_RULES[manualKey];

  if (type === 'stock')  return groupKey === 'quantfury'
    ? { role: 'trading',  assetClass: 'equity', horizon: 'short', riskLevel: 4 }
    : { role: 'growth',   assetClass: 'equity', horizon: 'long',  riskLevel: 3 };
  if (type === 'etf')    return { role: 'growth',    assetClass: 'equity', horizon: 'long',  riskLevel: 3 };
  if (type === 'crypto') return { role: 'growth',    assetClass: 'crypto', horizon: 'long',  riskLevel: 4 };
  return                        { role: 'liquidity', assetClass: 'cash',   horizon: 'short', riskLevel: 2 };
}

function buildStrategy(role, name, { speculativePct, cashPct }) {
  const strategies = {
    core:       { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    growth:     { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    defensive:  { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    liquidity:  { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    yield:      { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    speculative:{ accumulate: false, hold: false, reduce: speculativePct > THRESHOLDS.maxSpeculativePct, useForTrading: false },
    trading:    { accumulate: false, hold: false, reduce: false, useForTrading: true  },
    patrimony:  { accumulate: false, hold: true,  reduce: false, useForTrading: false },
  };
  let strat = strategies[role] || strategies.liquidity;
  if (role === 'liquidity' && cashPct > THRESHOLDS.maxCashPct) strat = { ...strat, reduce: true };
  if (String(name).toLowerCase().includes('safi'))             strat = { ...strat, reduce: true };
  return strat;
}

// ─────────────────────────────────────────────────────────────
// REBALANCEADOR
// ─────────────────────────────────────────────────────────────

function buildRebalancePlan({ assets, byRolePct, investableUSD }) {
  const deficits = Object.entries(PORTFOLIO_TARGETS)
    .map(([role, target]) => ({
      role, target,
      current: byRolePct[role] || 0,
      diff: target - (byRolePct[role] || 0),
    }))
    .filter(d => d.diff > 0)
    .sort((a, b) => b.diff - a.diff);

  let remainingCash = assets
    .filter(a => a.classification.assetClass === 'cash')
    .reduce((s, a) => s + a.valueUSD, 0);

  const assetsByRole = assets.reduce((acc, a) => {
    const r = a.classification.role;
    (acc[r] = acc[r] || []).push(a);
    return acc;
  }, {});

  const actions = [];
  for (const d of deficits) {
    if (remainingCash <= 0) break;
    const invest = Math.min((d.diff / 100) * investableUSD, remainingCash);
    if (invest < 50) continue;
    const candidates = (assetsByRole[d.role] || []).sort((a, b) => a.weightPct - b.weightPct);
    if (!candidates.length) continue;
    actions.push({
      action:    'BUY',
      asset:     candidates[0].symbol || candidates[0].name,
      amountUSD: Number(invest.toFixed(2)),
      reason:    `${d.role} underweight (${d.current.toFixed(1)}% → ${d.target}%)`,
    });
    remainingCash -= invest;
  }
  return { remainingCash: Number(remainingCash.toFixed(2)), actions };
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export function buildPortfolioV3(input) {
  const {
    allAssets     = [],
    totalUSD      = 0,
    reservedBUY   = 0,
    pendingSELL   = 0,
    grossExposure = 0,
  } = input;

  // Enriquecer con clasificación y peso sobre el total bruto
  const enriched = allAssets.map(a => {
    const cls    = classifyAsset(a.name, a.type, a.groupKey, a.symbol);
    const weight = totalUSD > 0 ? (a.valueUSD / totalUSD) * 100 : 0;
    return { ...a, valueUSD: Number((a.valueUSD || 0).toFixed(2)), weightPct: Number(weight.toFixed(2)), classification: cls };
  });

  // Separar patrimonio del portafolio
  const patrimonyAssets = enriched.filter(a => a.classification.role === 'patrimony');
  const portfolioAssets = enriched.filter(a => a.classification.role !== 'patrimony');
  const patrimonyUSD    = patrimonyAssets.reduce((s, a) => s + a.valueUSD, 0);
  const investableUSD   = totalUSD - patrimonyUSD;

  // Distribución por rol (solo portafolio invertible)
  const byRole = {};
  portfolioAssets.forEach(a => { byRole[a.classification.role] = (byRole[a.classification.role] || 0) + a.valueUSD; });

  const byRolePct = {};
  Object.entries(byRole).forEach(([r, v]) => {
    byRolePct[r] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  // Distribución por asset class (solo portafolio invertible)
  const byClass = {};
  portfolioAssets.forEach(a => { byClass[a.classification.assetClass] = (byClass[a.classification.assetClass] || 0) + a.valueUSD; });

  const byClassPct = {};
  Object.entries(byClass).forEach(([k, v]) => {
    byClassPct[k] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  const speculativePct = byRolePct.speculative || 0;
  const tradingPct     = byRolePct.trading      || 0;
  const corePct        = byRolePct.core         || 0;
  const cashPct        = byClassPct.cash        || 0;

  // Añadir estrategia a todos los activos
  const assets = enriched.map(a => ({
    ...a,
    strategy: buildStrategy(a.classification.role, a.name, { speculativePct, cashPct }),
  }));

  // Métricas de riesgo (solo portafolio invertible)
  const portfolioRisk = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * a.classification.riskLevel;
  }, 0);

  const expectedReturn = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * (RETURN_ASSUMPTIONS[a.classification.assetClass] || 0.05);
  }, 0);

  const cashDrag = (cashPct / 100) * (expectedReturn - 0.02);

  const hhi = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * w;
  }, 0);

  // Patrimonio: desglose por clase
  const patrimonyByClass = patrimonyAssets.reduce((acc, a) => {
    acc[a.classification.assetClass] = (acc[a.classification.assetClass] || 0) + a.valueUSD;
    return acc;
  }, {});

  const alerts = {
    lowCash:            cashPct        < THRESHOLDS.minCashPct,
    overCash:           cashPct        > THRESHOLDS.maxCashPct,
    underCore:          corePct        < THRESHOLDS.coreMinPct,
    overSpeculative:    speculativePct > THRESHOLDS.maxSpeculativePct,
    excessTrading:      tradingPct     > THRESHOLDS.maxTradingPct,
    highRisk:           portfolioRisk  > 3.5,
    lowDiversification: hhi            > 0.25,
  };

  const rules = [];
  if (alerts.underCore)       rules.push('UNDER CORE → comprar SPY');
  if (alerts.overCash)        rules.push('EXCESS CASH → invertir progresivamente');
  if (alerts.overSpeculative) rules.push('REDUCE ALTCOINS');
  if (alerts.highRisk)        rules.push('REDUCIR RIESGO global');
  if (!rules.length)          rules.push('Portfolio balanceado \u2713');

  const rebalance = buildRebalancePlan({ assets: portfolioAssets, byRolePct, investableUSD });

  return {
    generatedAt: new Date().toISOString(),
    totals:      { totalUSD, investableUSD, patrimonyUSD },
    portfolio:   { byRole: byRolePct, byAssetClass: byClassPct },
    patrimony:   { totalUSD: patrimonyUSD, byClass: patrimonyByClass, assets: patrimonyAssets },
    risk:        {
      portfolioRisk:  Number(portfolioRisk.toFixed(2)),
      expectedReturn: Number((expectedReturn * 100).toFixed(2)),
      cashDrag:       Number(cashDrag.toFixed(4)),
      hhi:            Number(hhi.toFixed(4)),
    },
    trading:        { reservedBUY, pendingSELL, grossExposure },
    alerts,
    ruleEvaluation: rules,
    rebalancePlan:  rebalance,
    assets,
  };
}