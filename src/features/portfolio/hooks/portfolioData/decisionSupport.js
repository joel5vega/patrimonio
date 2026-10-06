// src/features/portfolio/hooks/portfolioData/decisionSupport.js
//
// Limita las acciones de rebalanceo a la política de transacciones del backend
// y expone el mismo plan en `recommendations` y `rebalancePlan`.

import { safeNumber } from './numbers.js';

const EMPTY_PLAN = {
  monthly: [],
  lumpSum: [],
  actions: [],
  monthlyUSD: 0,
  deployableCash: 0,
  remainingCash: 0,
  opportunityCount: 0,
};

const limit = (list, max) => (Array.isArray(list) ? list.filter(Boolean).slice(0, max) : []);

export function normalizeDecisionSupport(analysis, portfolioV3) {
  const decisionSupport = analysis?.aiReport?.decisionSupport ?? {};

  const backendPlan =
    decisionSupport.recommendations ??
    portfolioV3?.rebalancePlan ??
    analysis?.rebalancePlan ??
    EMPTY_PLAN;

  const policy = backendPlan.transactionPolicy ?? decisionSupport.transactionPolicy ?? {};
  const maxActions = Math.max(1, safeNumber(policy.maxMonthlyOpportunities, 2));

  const monthly = limit(backendPlan.monthly, maxActions);
  const lumpSum = limit(backendPlan.lumpSum, maxActions);
  const backendActions = limit(backendPlan.actions, maxActions);
  const actions = backendActions.length ? backendActions : monthly.length ? monthly : lumpSum;

  const plan = {
    ...backendPlan,
    monthly,
    lumpSum,
    actions,
    opportunityCount: actions.length,
    transactionPolicy: { ...policy, maxMonthlyOpportunities: maxActions },
  };

  return { ...decisionSupport, recommendations: plan, rebalancePlan: plan };
}
