//src/utils/portfolioAnalysis.js
// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const ASSET_RULES = {
  SPY:  { role: 'core', assetClass: 'equity', horizon: 'long', riskLevel: 2 },
  SCHD: { role: 'core', assetClass: 'equity', horizon: 'long', riskLevel: 2 },

  QQQM: { role: 'growth', assetClass: 'equity', horizon: 'long', riskLevel: 3 },
  VXUS: { role: 'growth', assetClass: 'equity', horizon: 'long', riskLevel: 3 },
  VWO:  { role: 'growth', assetClass: 'equity', horizon: 'long', riskLevel: 3 },
  EMXC: { role: 'growth', assetClass: 'equity', horizon: 'long', riskLevel: 3 },

  IAU:  { role: 'defensive', assetClass: 'commodity', horizon: 'long', riskLevel: 1 },
  GLD:  { role: 'defensive', assetClass: 'commodity', horizon: 'long', riskLevel: 1 },
  BND:  { role: 'defensive', assetClass: 'fixed_income', horizon: 'long', riskLevel: 2 },
  TIP:  { role: 'defensive', assetClass: 'fixed_income', horizon: 'long', riskLevel: 2 },
  VNQ:  { role: 'defensive', assetClass: 'real_estate',  horizon: 'long', riskLevel: 2 },

  BTC:  { role: 'growth', assetClass: 'crypto', horizon: 'long', riskLevel: 4 },
  ETH:  { role: 'growth', assetClass: 'crypto', horizon: 'long', riskLevel: 4 },

  SOL:  { role: 'speculative', assetClass: 'crypto', horizon: 'medium', riskLevel: 4 },
  AVAX: { role: 'speculative', assetClass: 'crypto', horizon: 'medium', riskLevel: 4 },
  ADA:  { role: 'speculative', assetClass: 'crypto', horizon: 'medium', riskLevel: 5 },
  XRP:  { role: 'speculative', assetClass: 'crypto', horizon: 'medium', riskLevel: 5 },

  SGOV: { role: 'liquidity', assetClass: 'cash', horizon: 'short', riskLevel: 1 },
  USDT: { role: 'liquidity', assetClass: 'cash', horizon: 'short', riskLevel: 1 },
  USDC: { role: 'liquidity', assetClass: 'cash', horizon: 'short', riskLevel: 1 },
};

const MANUAL_RULES = {
  'AirTM':            { role: 'yield',          assetClass: 'cash_equivalent', horizon: 'short',     riskLevel: 2 },
  'SAFI':             { role: 'yield',          assetClass: 'cash_equivalent', horizon: 'short',     riskLevel: 2 },
  'Ahorro $':         { role: 'liquidity',      assetClass: 'cash',            horizon: 'short',     riskLevel: 1 },
  'Ahorro Bs':        { role: 'non_investable', assetClass: 'cash',            horizon: 'short',     riskLevel: 1 },
  'Ahorro en Bs':     { role: 'non_investable', assetClass: 'cash',            horizon: 'short',     riskLevel: 1 },
  'terreno achacachi':{ role: 'alternative',    assetClass: 'real_asset',      horizon: 'very_long', riskLevel: 3 },
};

const RETURN_ASSUMPTIONS = {
  equity:          0.08,
  crypto:          0.12,
  fixed_income:    0.03,
  cash:            0.02,
  cash_equivalent: 0.05,
  commodity:       0.04,
  real_asset:      0.06,
  real_estate:     0.05,
};

const THRESHOLDS = {
  minCashPct:       15,
  maxCashPct:       40,
  maxSpeculativePct: 10,
  coreMinPct:       20,
  maxTradingPct:    25,
};

// 🎯 TARGETS DE REBALANCEO — deben sumar 100%
const TARGETS = {
  core:        30, // SPY + SCHD
  growth:      20, // QQQM + VXUS/EMXC + BTC + ETH
  defensive:   15, // IAU + BND + TIP + VNQ
  liquidity:   15, // USDT/USDC o SGOV
  alternative: 10, // Terreno + otros activos reales
  speculative: 10, // ADA + XRP + SOL + AVAX
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// FIX: recibe symbol como argumento adicional
function classifyAsset(name, type, groupKey, symbol) {
  // FIX: usar symbol primero (más confiable para crypto/ETF)
  const key = (symbol || name || '').toUpperCase().trim();

  if (ASSET_RULES[key]) return ASSET_RULES[key];

  // fallback por name también
  const keyByName = (name || '').toUpperCase().trim();
  if (ASSET_RULES[keyByName]) return ASSET_RULES[keyByName];

  const manual = Object.keys(MANUAL_RULES).find(
    (k) => k.toLowerCase() === name?.toLowerCase()
  );
  if (manual) return MANUAL_RULES[manual];

  if (type === 'stock') {
    return groupKey === 'quantfury'
      ? { role: 'trading', assetClass: 'equity', horizon: 'short', riskLevel: 4 }
      : { role: 'growth',  assetClass: 'equity', horizon: 'long',  riskLevel: 3 };
  }
  if (type === 'etf')    return { role: 'growth',    assetClass: 'equity', horizon: 'long',  riskLevel: 3 };
  if (type === 'crypto') return { role: 'growth',    assetClass: 'crypto', horizon: 'long',  riskLevel: 4 };

  return { role: 'liquidity', assetClass: 'cash', horizon: 'short', riskLevel: 2 };
}

function buildStrategy(role, name, context) {
  const { speculativePct, cashPct } = context;

  const base = {
    core:          { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    growth:        { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    defensive:     { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    liquidity:     { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    yield:         { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    speculative:   { accumulate: false, hold: false, reduce: speculativePct > THRESHOLDS.maxSpeculativePct, useForTrading: false },
    trading:       { accumulate: false, hold: false, reduce: false, useForTrading: true  },
    non_investable:{ accumulate: false, hold: true,  reduce: false, useForTrading: false },
    alternative:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
  };

  let strat = base[role] || base.liquidity;

  if (role === 'liquidity' && cashPct > THRESHOLDS.maxCashPct) {
    strat = { ...strat, reduce: true };
  }
  if (String(name).toLowerCase().includes('safi')) {
    strat = { ...strat, reduce: true };
  }

  return strat;
}

// ─────────────────────────────────────────────────────────────
// REBALANCEADOR
// ─────────────────────────────────────────────────────────────

// FIX: la función recibe un objeto, llamar con { assets, byRolePct, investableUSD }
function buildRebalancePlan({ assets, byRolePct, investableUSD }) {
  const deviations = [];

  Object.entries(TARGETS).forEach(([role, target]) => {
    const current = byRolePct[role] || 0;
    deviations.push({ role, diff: target - current, current, target });
  });

  const deficits = deviations
    .filter(d => d.diff > 0)
    .sort((a, b) => b.diff - a.diff);

  const cashAssets = assets.filter(a => a.classification.assetClass === 'cash');
  let remainingCash = cashAssets.reduce((s, a) => s + a.valueUSD, 0);

  const assetsByRole = {};
  assets.forEach(a => {
    const r = a.classification.role;
    if (!assetsByRole[r]) assetsByRole[r] = [];
    assetsByRole[r].push(a);
  });

  const actions = [];

  for (const d of deficits) {
    if (remainingCash <= 0) break;

    const needed  = (d.diff / 100) * investableUSD;
    const invest  = Math.min(needed, remainingCash);
    if (invest < 50) continue;

    const candidates = assetsByRole[d.role] || [];
    if (!candidates.length) continue;

    const selected = candidates.sort((a, b) => a.weightPct - b.weightPct)[0];

    actions.push({
      action:    'BUY',
      asset:     selected.symbol || selected.name,
      amountUSD: Number(invest.toFixed(2)),
      reason:    `${d.role} underweight (${d.current.toFixed(1)}% → ${d.target}%)`,
    });

    remainingCash -= invest;
  }

  return {
    remainingCash: Number(remainingCash.toFixed(2)),
    actions,
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export function buildPortfolioV3(input) {
  const {
    allAssets    = [],
    totalUSD     = 0,
    reservedBUY  = 0,
    pendingSELL  = 0,
    grossExposure = 0,
  } = input;

  const enriched = allAssets.map(a => {
    // FIX: pasar symbol a classifyAsset
    const cls    = classifyAsset(a.name, a.type, a.groupKey, a.symbol);
    const weight = totalUSD > 0 ? (a.valueUSD / totalUSD) * 100 : 0;

    return {
      ...a,
      valueUSD:  Number((a.valueUSD || 0).toFixed(2)),
      weightPct: Number(weight.toFixed(2)),
      classification: cls,
    };
  });

  const nonInvestableUSD = enriched
    .filter(a => a.classification.role === 'non_investable')
    .reduce((s, a) => s + a.valueUSD, 0);

  const investableUSD = totalUSD - nonInvestableUSD;

  // byRole en USD
  const byRole = {};
  enriched.forEach(a => {
    const r = a.classification.role;
    byRole[r] = (byRole[r] || 0) + a.valueUSD;
  });

  // byRolePct — sobre investableUSD (excluye non_investable)
  const byRolePct = {};
  Object.entries(byRole).forEach(([r, v]) => {
    if (r === 'non_investable') return;
    byRolePct[r] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  // byClass en USD
  const byClass = {};
  enriched.forEach(a => {
    const c = a.classification.assetClass;
    byClass[c] = (byClass[c] || 0) + a.valueUSD;
  });

  // FIX: byClassPct también sobre investableUSD para coherencia con byRolePct
  const byClassPct = {};
  Object.entries(byClass).forEach(([k, v]) => {
    byClassPct[k] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  const speculativePct = byRolePct.speculative || 0;
  const tradingPct     = byRolePct.trading      || 0;
  const corePct        = byRolePct.core         || 0;
  const cashPct        = byClassPct.cash        || 0;

  const assets = enriched.map(a => ({
    ...a,
    strategy: buildStrategy(a.classification.role, a.name, { speculativePct, cashPct }),
  }));

  const portfolioRisk = enriched.reduce((sum, a) =>
    sum + (a.weightPct / 100) * a.classification.riskLevel, 0);

  const expectedReturn = enriched.reduce((sum, a) => {
    const r = RETURN_ASSUMPTIONS[a.classification.assetClass] || 0.05;
    return sum + (a.weightPct / 100) * r;
  }, 0);

  // FIX: cashDrag fórmula correcta (cashPct es 0-100, expectedReturn es decimal)
  const cashDrag = (cashPct / 100) * (expectedReturn - 0.02);

  const hhi = enriched.reduce((sum, a) => {
    const w = a.weightPct / 100;
    return sum + w * w;
  }, 0);

  const alerts = {
    lowCash:          cashPct        < THRESHOLDS.minCashPct,
    overCash:         cashPct        > THRESHOLDS.maxCashPct,
    underCore:        corePct        < THRESHOLDS.coreMinPct,
    overSpeculative:  speculativePct > THRESHOLDS.maxSpeculativePct,
    excessTrading:    tradingPct     > THRESHOLDS.maxTradingPct,
    highRisk:         portfolioRisk  > 3.5,
    lowDiversification: hhi          > 0.25,
  };

  const rules = [];
  if (alerts.underCore)       rules.push('UNDER CORE → comprar SPY');
  if (alerts.overCash)        rules.push('EXCESS CASH → invertir progresivamente');
  if (alerts.overSpeculative) rules.push('REDUCE ALTCOINS');
  if (alerts.highRisk)        rules.push('REDUCIR RIESGO');
  if (!rules.length)          rules.push('Portfolio balanceado ✓');

  // FIX: llamar buildRebalancePlan con objeto
  const rebalance = buildRebalancePlan({ assets, byRolePct, investableUSD });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalUSD,
      investableUSD,
      nonInvestableUSD,
    },
    allocation: {
      byRole:       byRolePct,
      byAssetClass: byClassPct,
    },
    risk: {
      portfolioRisk:  Number(portfolioRisk.toFixed(2)),
      expectedReturn: Number((expectedReturn * 100).toFixed(2)),
      cashDrag:       Number(cashDrag.toFixed(4)),
      hhi:            Number(hhi.toFixed(4)),
    },
    trading: {
      reservedBUY,
      pendingSELL,
      grossExposure,
    },
    alerts,
    ruleEvaluation: rules,
    rebalancePlan:  rebalance,
    assets,
  };
}
