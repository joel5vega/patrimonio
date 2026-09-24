// src/pages/Budget/useBudgetData.js
import { useMemo, useState } from 'react';
import { useTransactions, TX_GROUPS, TX_CATEGORIES } from '../../hooks/useTransactions';
import { useBudget } from '../../hooks/useBudget';
import { parseLocal } from '../../utils/filterByPeriod';
import { DEFAULT_SUBCAT_BUDGETS, MONTHS_ES, matchesGroup, getSpentInMonth } from './budgetHelpers';

export function useBudgetData() {
  const transactionRange = useMemo(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: null, enabled: true, loadRange: true };
  }, []);

  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions(transactionRange);
  const { budgets, saveBudget, loading: budgetsLoading } = useBudget();

  const loading = transactionsLoading || budgetsLoading;
  const error = transactionsError;

  const [globalModal, setGlobalModal] = useState(null);

  const groups = TX_GROUPS.filter((group) => group.value !== 'ingresos');

  const groupBudgetsMap = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      const subcats = TX_CATEGORIES.filter((c) => matchesGroup(c, g.value));
      if (subcats.length > 0) {
        map[g.value] = subcats.reduce((acc, cat) => {
          const val = budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || 0);
          return acc + Number(val);
        }, 0);
      } else {
        map[g.value] = Number(budgets[g.value] || 0);
      }
    });
    return map;
  }, [groups, budgets]);

  const monthlyByGroup = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const map = {};
    transactions.filter((tx) => tx.type === 'expense').forEach((tx) => {
      const d = parseLocal(tx.date);
      if (d >= start && d <= end) {
        const key = tx.parentCategory || tx.group || 'otros';
        map[key] = (map[key] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions]);

  const weeklyByGroup = useMemo(() => {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    const map = {};
    transactions.filter((tx) => tx.type === 'expense').forEach((tx) => {
      const d = parseLocal(tx.date);
      if (d >= start) {
        const key = tx.parentCategory || tx.group || 'otros';
        map[key] = (map[key] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions]);

  const totalBudget = Object.values(groupBudgetsMap).reduce((a, b) => a + b, 0);
  const totalSpentM = Object.values(monthlyByGroup).reduce((a, b) => a + b, 0);
  const totalSpentW = Object.values(weeklyByGroup).reduce((a, b) => a + b, 0);
  const overallPct = totalBudget > 0 ? (totalSpentM / totalBudget) * 100 : 0;

  const globalHistory = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const idx = now.getMonth() - (4 - i);
      const year = now.getFullYear() + Math.floor(idx / 12);
      const month = ((idx % 12) + 12) % 12;
      const results = groups
        .map(({ value: key }) => {
          const budget = groupBudgetsMap[key] || 0;
          const spent = getSpentInMonth(transactions, key, year, month);
          return budget > 0 ? spent <= budget : null;
        })
        .filter((r) => r !== null);
      const passed = results.filter(Boolean).length;
      const total = results.length;
      return { label: MONTHS_ES[month], year, month, passed, total, allGood: total > 0 && passed === total };
    });
  }, [transactions, groupBudgetsMap, groups]);

  return {
    loading, error,
    transactions, budgets, saveBudget,
    groups, groupBudgetsMap,
    monthlyByGroup, weeklyByGroup,
    totalBudget, totalSpentM, totalSpentW, overallPct,
    globalHistory,
    globalModal, setGlobalModal,
  };
}
