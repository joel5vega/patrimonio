// src/pages/Budget/budgetHelpers.js
import { parseLocal } from '../../utils/filterByPeriod';

export const DEFAULT_SUBCAT_BUDGETS = {
  alquiler: 1300,
  comunicaciones: 500,
  viveres: 600,
  transporte: 324,
  ahorro: 4000,
  utiles: 100,
  ropa: 200,
  cremas: 200,
  salidas: 300,
  hogar: 2800,
};

export const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function matchesGroup(cat, groupKey) {
  return cat.parentCategory === groupKey || cat.group === groupKey || cat.parent === groupKey;
}

export function getSpentInMonth(transactions, group, year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return transactions
    .filter((tx) => tx.type === 'expense' && (tx.parentCategory || tx.group || 'otros') === group)
    .filter((tx) => { const d = parseLocal(tx.date); return d >= start && d <= end; })
    .reduce((s, tx) => s + tx.amount, 0);
}

export function getTxsInMonth(transactions, group, year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return transactions
    .filter((tx) => tx.type === 'expense' && (tx.parentCategory || tx.group || 'otros') === group)
    .filter((tx) => { const d = parseLocal(tx.date); return d >= start && d <= end; })
    .sort((a, b) => b.amount - a.amount);
}

export function getGlobalMonthDetail(transactions, groups, groupBudgetsMap, year, month) {
  return groups.map(({ value: key, label }) => {
    const budget = groupBudgetsMap[key] || 0;
    const spent = getSpentInMonth(transactions, key, year, month);
    const ok = budget > 0 ? spent <= budget : null;
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    return { key, label, budget, spent, ok, pct };
  });
}

export function getMonthlyAvg(transactions, group, months = 3) {
  const now = new Date();
  const totals = Array.from({ length: months }, (_, i) =>
    getSpentInMonth(transactions, group, now.getFullYear(), now.getMonth() - i));
  return totals.reduce((a, b) => a + b, 0) / months;
}

export function getBudgetHistory(transactions, group, budget, months = 5) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const idx = now.getMonth() - (months - i);
    const year = now.getFullYear() + Math.floor(idx / 12);
    const month = ((idx % 12) + 12) % 12;
    const spent = getSpentInMonth(transactions, group, year, month);
    const ok = budget > 0 ? spent <= budget : null;
    return { label: MONTHS_ES[month], year, month, spent, budget, ok, pct: budget > 0 ? (spent / budget) * 100 : 0 };
  });
}
