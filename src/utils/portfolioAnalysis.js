// ─────────────────────────────────────────────────────────────
// portfolioAnalysis.js  — v4 (perfil boliviano)
// Perfil: inversor boliviano, mediano/largo plazo, ~$287 USD/mes
// Plataformas: Binance, Quantfury, AirTM DeFi (8% APR)
// ─────────────────────────────────────────────────────────────

// ─── CLASIFICACIÓN DE ACTIVOS ─────────────────────────────────

const ASSET_RULES = {
  VOO:   { role: 'core',        assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2 },
  SPY:   { role: 'core',        assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2 },
  QQQM:  { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 3 },
  VXUS:  { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_internacionales', horizon: 'long',   riskLevel: 3 },
  VWO:   { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_internacionales', horizon: 'long',   riskLevel: 3 },
  EMXC:  { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_internacionales', horizon: 'long',   riskLevel: 3 },
  SCHD:  { role: 'defensive',   assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2 },
  BTC:   { role: 'growth',      assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'long',   riskLevel: 3 },
  ETH:   { role: 'growth',      assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'long',   riskLevel: 3 },
  IAU:   { role: 'defensive',   assetClass: 'alternativos',   subClass: 'metales',                horizon: 'long',   riskLevel: 1 },
  GLD:   { role: 'defensive',   assetClass: 'alternativos',   subClass: 'metales',                horizon: 'long',   riskLevel: 1 },
  BND:   { role: 'defensive',   assetClass: 'renta_fija',     subClass: 'fondos_bonos',           horizon: 'long',   riskLevel: 2 },
  TIP:   { role: 'defensive',   assetClass: 'renta_fija',     subClass: 'bonos_gobierno',         horizon: 'long',   riskLevel: 2 },
  VNQ:   { role: 'defensive',   assetClass: 'inmobiliario',   subClass: 'reit',                   horizon: 'long',   riskLevel: 2 },
  SOL:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4 },
  AVAX:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4 },
  ADA:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 5 },
  XRP:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 5 },
  SGOV:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash_equivalent',        horizon: 'short',  riskLevel: 1 },
  USDT:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1 },
  USDC:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1 },
  BUSD:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1 },
  DAI:   { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1 },
  FDUSD: { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1 },
};

// Claves en lowercase para lookup case-insensitive.
// Flags:
//   isInvestable: false       → excluido del denominador investableUSD y del rebalanceo
//   isLocked: true            → muestra candado en UI
//   isLocalPrivateEquity:true → apaga alerta noPrivateEquity (SAFI = PE local boliviano)
//   isDeFi + aprPct           → retorno real conocido, sobreescribe RETURN_ASSUMPTIONS
export const MANUAL_RULES = {
  'airtm': {
    role:                'yield',
    assetClass:          'efectivo',
    subClass:            'cash_equivalent',
    horizon:             'short',
    riskLevel:           2,
    isLocked:            false,
    isInvestable:        true,
    isDeFi:              true,   // posición DeFi real
    aprPct:              8,      // 8% APR confirmado por el usuario
  },
  'safi': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_local',
    horizon:             'medium',
    riskLevel:           2,
    isLocked:            true,
    isInvestable:        false,
    isLocalPrivateEquity: true,  // SAFI = private equity local → apaga alerta
  },
  'ahorro $': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_fisico',
    horizon:             'medium',
    riskLevel:           1,
    isLocked:            true,
    isInvestable:        false,
  },
  // FIX: Ahorro en Bs es para evento futuro → reserve (no liquidity)
  'ahorro en bs': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_local',
    horizon:             'medium',
    riskLevel:           1,
    isLocked:            true,
    isInvestable:        false,
  },
  'ahorro bs': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_local',
    horizon:             'medium',
    riskLevel:           1,
    isLocked:            true,
    isInvestable:        false,
  },
  't ach':       { role: 'patrimony', assetClass: 'inmobiliario', subClass: 'propiedad_fisica', horizon: 'very_long', riskLevel: 2 },
  't sas':       { role: 'patrimony', assetClass: 'inmobiliario', subClass: 'propiedad_fisica', horizon: 'very_long', riskLevel: 2 },
  't achacachi': { role: 'patrimony', assetClass: 'inmobiliario', subClass: 'propiedad_fisica', horizon: 'very_long', riskLevel: 2 },
};

// ─── SUPUESTOS DE RETORNO ─────────────────────────────────────
// AirTM DeFi usa aprPct directamente (sobreescrito en buildPortfolioV3)
const RETURN_ASSUMPTIONS = {
  renta_variable:  0.08,
  alternativos:    0.10,
  inmobiliario:    0.05,
  private_equity:  0.12,
  renta_fija:      0.03,
  efectivo:        0.03,
  cash_equivalent: 0.03,  // genérico; DeFi sobreescribe por activo
  equity:          0.08,
  crypto:          0.12,
  fixed_income:    0.03,
  cash:            0.02,
  commodity:       0.04,
  real_asset:      0.04,
  real_estate:     0.05,
};

// ─── THRESHOLDS ───────────────────────────────────────────────
// Ajustados para perfil boliviano, mediano/largo plazo
const THRESHOLDS = {
  minCashPct:        10,  // mínimo operativo (USDT + AirTM)
  maxCashPct:        35,
  maxSpeculativePct:  5,  // altcoins — cap duro bajo
  coreMinPct:        30,  // ancla en index funds
  maxTradingPct:     12,  // Quantfury — cap duro
};

// ─── TARGETS POR ROL ─────────────────────────────────────────
// % sobre portafolio INVERTIBLE (excluye reserve + patrimony).
// Perfil: boliviano, largo plazo, trading controlado, DeFi yield como pilar.
export const PORTFOLIO_TARGETS = {
  core:        30,  // VOO / SPY
  growth:      25,  // QQQM, BTC, ETH, VXUS
  defensive:   10,  // IAU, BND
  liquidity:    5,  // USDT operativo mínimo
  yield:       15,  // AirTM DeFi 8% — pilar de ingreso pasivo
  speculative:  5,  // altcoins — cap duro
  trading:      10,  // Quantfury — cap duro
};

// ─── HELPERS ─────────────────────────────────────────────────

function classifyAsset(name, type, groupKey, symbol) {
  const symKey = (symbol || '').toUpperCase().trim();
  if (symKey && ASSET_RULES[symKey]) return ASSET_RULES[symKey];

  const nameLower = (name || '').toLowerCase().trim();
  if (nameLower && MANUAL_RULES[nameLower]) return MANUAL_RULES[nameLower];

  if (type === 'stock') return groupKey === 'quantfury'
    ? { role: 'trading',  assetClass: 'renta_variable', subClass: 'acciones_individuales', horizon: 'short', riskLevel: 4 }
    : { role: 'growth',   assetClass: 'renta_variable', subClass: 'acciones_individuales', horizon: 'long',  riskLevel: 3 };
  if (type === 'etf')    return { role: 'growth',    assetClass: 'renta_variable', subClass: 'fondos_eeuu', horizon: 'long',  riskLevel: 3 };
  if (type === 'crypto') return { role: 'growth',    assetClass: 'alternativos',   subClass: 'crypto',      horizon: 'long',  riskLevel: 4 };
  return                        { role: 'liquidity', assetClass: 'efectivo',       subClass: 'cash',        horizon: 'short', riskLevel: 2 };
}

function buildStrategy(role, _name, { speculativePct, cashPct, tradingPct }) {
  const base = {
    core:        { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    growth:      { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    defensive:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    liquidity:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    yield:       { accumulate: true,  hold: true,  reduce: false, useForTrading: false }, // acumular DeFi
    speculative: { accumulate: false, hold: false, reduce: false, useForTrading: false },
    trading:     { accumulate: false, hold: false, reduce: false, useForTrading: true  },
    reserve:     { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    patrimony:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
  };

  const strat = { ...(base[role] || base.liquidity) };
  if (role === 'liquidity')   strat.reduce = cashPct        > THRESHOLDS.maxCashPct;
  if (role === 'speculative') strat.reduce = speculativePct > THRESHOLDS.maxSpeculativePct;
  if (role === 'trading')     strat.reduce = tradingPct     > THRESHOLDS.maxTradingPct;

  return strat;
}

// ─── PLAN DE REBALANCEO ───────────────────────────────────────
// Genera dos planes:
//   monthly  → qué comprar este mes con el ingreso disponible (~$287)
//   lumpSum  → cash deployable por encima del mínimo operativo
function buildRebalancePlan({ portfolioAssets, byRolePct, investableUSD, monthlyUSD }) {
  const deficits = Object.entries(PORTFOLIO_TARGETS)
    .map(([role, target]) => ({
      role, target,
      current: byRolePct[role] || 0,
      diff:    target - (byRolePct[role] || 0),
    }))
    .filter(d => d.diff > 0)
    .sort((a, b) => b.diff - a.diff);

  const totalDeficit = deficits.reduce((s, d) => s + d.diff, 0) || 1;

  const assetsByRole = portfolioAssets.reduce((acc, a) => {
    (acc[a.classification.role] = acc[a.classification.role] || []).push(a);
    return acc;
  }, {});

  // ── Plan mensual: distribuye el ingreso mensual proporcionalmente al déficit ──
  const monthlyActions = [];
  let monthlyBudget = monthlyUSD;

  for (const d of deficits) {
    if (monthlyBudget <= 0) break;
    const share  = (d.diff / totalDeficit) * monthlyUSD;
    const invest = Math.min(share, monthlyBudget);
    if (invest < 15) continue;

    const candidates = (assetsByRole[d.role] || [])
      .filter(a => a.classification.isInvestable !== false)
      .sort((a, b) => a.weightPct - b.weightPct);
    if (!candidates.length) continue;

    monthlyActions.push({
      action:        'BUY',
      asset:         candidates[0].symbol || candidates[0].name,
      amountUSD:     Number(invest.toFixed(2)),
      reason:        `${d.role} underweight (${d.current.toFixed(1)}% → ${d.target}%)`,
      // Estimación de meses para alcanzar el target a este ritmo
      monthsToTarget: invest > 0
        ? Math.ceil((d.diff / 100 * investableUSD) / invest)
        : null,
    });
    monthlyBudget -= invest;
  }

  // ── Plan lump-sum: efectivo deployable por encima del mínimo operativo ──
  const investableCashUSD = portfolioAssets
    .filter(a =>
      a.classification.assetClass === 'efectivo' &&
      a.classification.isInvestable !== false
    )
    .reduce((s, a) => s + a.valueUSD, 0);

  const minOperativeCash = investableUSD * (THRESHOLDS.minCashPct / 100);
  const deployableCash   = Math.max(0, investableCashUSD - minOperativeCash);
  const lumpSumActions   = [];

  if (deployableCash > 100) {
    let budget = deployableCash;
    for (const d of deficits) {
      if (budget <= 0) break;
      const share  = (d.diff / totalDeficit) * deployableCash;
      const invest = Math.min(share, budget);
      if (invest < 50) continue;

      const candidates = (assetsByRole[d.role] || [])
        .filter(a => a.classification.isInvestable !== false)
        .sort((a, b) => a.weightPct - b.weightPct);
      if (!candidates.length) continue;

      lumpSumActions.push({
        action:    'BUY',
        asset:     candidates[0].symbol || candidates[0].name,
        amountUSD: Number(invest.toFixed(2)),
        reason:    `${d.role} underweight — deploy cash disponible`,
      });
      budget -= invest;
    }
  }

  return {
    remainingCash: Number(minOperativeCash.toFixed(2)),
    deployableCash: Number(deployableCash.toFixed(2)),
    monthlyUSD,
    monthly:  monthlyActions,   // plan mensual con ingreso nuevo
    lumpSum:  lumpSumActions,   // plan con cash excedente existente
    actions:  lumpSumActions.length > 0 ? lumpSumActions : monthlyActions, // retrocompatibilidad Dashboard
  };
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────

export function buildPortfolioV3(input) {
  const {
    allAssets     = [],
    totalUSD      = 0,
    reservedBUY   = 0,
    pendingSELL   = 0,
    grossExposure = 0,
    monthlyUSD    = 287,  // 2000 Bs / 6.96 — configurable desde AppContext
  } = input;

  // 1. Enriquecer
  const enriched = allAssets.map(a => {
    const cls    = classifyAsset(a.name, a.type, a.groupKey, a.symbol);
    const weight = totalUSD > 0 ? (a.valueUSD / totalUSD) * 100 : 0;
    return {
      ...a,
      valueUSD:       Number((a.valueUSD || 0).toFixed(2)),
      weightPct:      Number(weight.toFixed(2)),
      classification: cls,
    };
  });

  // 2. Separar capas
  const patrimonyAssets = enriched.filter(a => a.classification.role === 'patrimony');
  const reserveAssets   = enriched.filter(a => a.classification.role === 'reserve');
  const portfolioAssets = enriched.filter(a =>
    a.classification.role !== 'patrimony' &&
    a.classification.role !== 'reserve'
  );

  const patrimonyUSD  = patrimonyAssets.reduce((s, a) => s + a.valueUSD, 0);
  const reserveUSD    = reserveAssets.reduce((s, a) => s + a.valueUSD, 0);
  const investableUSD = totalUSD - patrimonyUSD - reserveUSD;

  // 3. Distribuciones (% sobre investableUSD)
  const byRoleUSD = {};
  portfolioAssets.forEach(a => {
    byRoleUSD[a.classification.role] = (byRoleUSD[a.classification.role] || 0) + a.valueUSD;
  });
  const byRolePct = {};
  Object.entries(byRoleUSD).forEach(([r, v]) => {
    byRolePct[r] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  const byClassUSD = {};
  portfolioAssets.forEach(a => {
    byClassUSD[a.classification.assetClass] = (byClassUSD[a.classification.assetClass] || 0) + a.valueUSD;
  });
  const byClassPct = {};
  Object.entries(byClassUSD).forEach(([k, v]) => {
    byClassPct[k] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  const bySubClassUSD = {};
  portfolioAssets.forEach(a => {
    const key = `${a.classification.assetClass}__${a.classification.subClass || 'otros'}`;
    bySubClassUSD[key] = (bySubClassUSD[key] || 0) + a.valueUSD;
  });
  const bySubClassPct = {};
  Object.entries(bySubClassUSD).forEach(([k, v]) => {
    bySubClassPct[k] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  // 4. Cash operativo (solo efectivo investable)
  const investableCashUSD = portfolioAssets
    .filter(a =>
      a.classification.assetClass === 'efectivo' &&
      a.classification.isInvestable !== false
    )
    .reduce((s, a) => s + a.valueUSD, 0);

  const speculativePct = byRolePct.speculative || 0;
  const tradingPct     = byRolePct.trading      || 0;
  const corePct        = byRolePct.core         || 0;
  const cashPct        = investableUSD > 0 ? (investableCashUSD / investableUSD) * 100 : 0;

  // 5. Estrategias
  const assets = enriched.map(a => ({
    ...a,
    strategy: buildStrategy(a.classification.role, a.name, { speculativePct, cashPct, tradingPct }),
  }));

  // 6. Métricas — AirTM DeFi usa aprPct real
  const portfolioRisk = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * a.classification.riskLevel;
  }, 0);

  const expectedReturn = portfolioAssets.reduce((sum, a) => {
    const w   = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    const ret = (a.classification.isDeFi && a.classification.aprPct)
      ? a.classification.aprPct / 100
      : (RETURN_ASSUMPTIONS[a.classification.assetClass] || 0.05);
    return sum + w * ret;
  }, 0);

  const cashDrag = (cashPct / 100) * Math.max(0, expectedReturn - 0.02);

  const hhi = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * w;
  }, 0);

  // 7. Alertas
  const hasLocalPE = enriched.some(a => a.classification.isLocalPrivateEquity);
  const alerts = {
    lowCash:            cashPct        < THRESHOLDS.minCashPct,
    overCash:           cashPct        > THRESHOLDS.maxCashPct,
    underCore:          corePct        < THRESHOLDS.coreMinPct,
    overSpeculative:    speculativePct > THRESHOLDS.maxSpeculativePct,
    excessTrading:      tradingPct     > THRESHOLDS.maxTradingPct,
    highRisk:           portfolioRisk  > 3.5,
    lowDiversification: hhi            > 0.25,
    noPrivateEquity:    !hasLocalPE && !(byClassPct['private_equity'] > 0),
  };

  // 8. Reglas
  const rules = [];
  if (alerts.underCore)       rules.push('UNDER CORE → comprar VOO este mes');
  if (alerts.overCash)        rules.push('EXCESS CASH → desplegar en core/growth progresivamente');
  if (alerts.overSpeculative) rules.push('REDUCE ALTCOINS → mantener bajo el 5%');
  if (alerts.excessTrading)   rules.push('REDUCE TRADING → más del 12% en Quantfury');
  if (alerts.highRisk)        rules.push('REDUCIR RIESGO global → rotar a core/defensive');
  if (alerts.noPrivateEquity) rules.push('SIN PRIVATE EQUITY → considerar fondos SAFI o participación directa');
  if (!rules.length)          rules.push('Portfolio balanceado ✓');

  // 9. Rebalanceo
  const rebalance = buildRebalancePlan({ portfolioAssets, byRolePct, investableUSD, monthlyUSD });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalUSD,
      investableUSD,
      patrimonyUSD,
      reserveUSD,           // nuevo: reservas separadas del invertible
    },
    portfolio: {
      byRole:       byRolePct,
      byAssetClass: byClassPct,
      bySubClass:   bySubClassPct,
    },
    patrimony: {
      totalUSD:  patrimonyUSD,
      byClass:   patrimonyAssets.reduce((acc, a) => {
        acc[a.classification.assetClass] = (acc[a.classification.assetClass] || 0) + a.valueUSD;
        return acc;
      }, {}),
      assets: patrimonyAssets,
    },
    reserves: {
      totalUSD: reserveUSD,
      assets:   reserveAssets,
      note:     'No invertibles en bolsa. Se mantienen hasta cambio de condiciones.',
    },
    risk: {
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
