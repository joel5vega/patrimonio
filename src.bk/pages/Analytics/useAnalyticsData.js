// src/pages/Analytics/useAnalyticsData.js
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions, TX_CATEGORIES } from '../../hooks/useTransactions';
import {
  getStartDate, toDate, getMonthStart, getMonthEnd, getPreviousRange,
} from './dateHelpers';
import { getInsights } from './insights';

export const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1A', value: '1y' },
  { label: 'Todo', value: 'all' },
  { label: 'Fecha', value: 'custom' },
];

function formatQueryDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useAnalyticsData() {
  const auth = useAuth();
  const user = auth?.user;
  const authLoading = auth?.loading ?? true;

  const [activeGroup, setActiveGroup] = useState(null);
  const [period, setPeriod] = useState('1m');
  const [viewMode, setViewMode] = useState('groups');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  const transactionRange = useMemo(() => {
    if (authLoading || !user?.uid) {
      return { from: null, to: null, enabled: false, loadRange: false };
    }
    if (period === 'custom') {
      if (!customStart || !customEnd) {
        return { from: null, to: null, enabled: false, loadRange: false };
      }
      return {
        from: formatQueryDate(customStart),
        to: formatQueryDate(customEnd),
        enabled: true,
        loadRange: true,
      };
    }
    const start = getStartDate(period);
    const end = new Date();
    return {
      from: start ? formatQueryDate(start) : null,
      to: formatQueryDate(end),
      enabled: true,
      loadRange: true,
    };
  }, [authLoading, user?.uid, period, customStart, customEnd]);

  const { transactions, loading, error } = useTransactions(transactionRange);

  const filtered = useMemo(
    () => transactions.filter((tx) => tx.type !== 'transfer'),
    [transactions],
  );
  const expenses = useMemo(() => filtered.filter((tx) => tx.type === 'expense'), [filtered]);
  const incomes  = useMemo(() => filtered.filter((tx) => tx.type === 'income'),  [filtered]);

  const totalExp = useMemo(() => expenses.reduce((s, tx) => s + tx.amount, 0), [expenses]);
  const totalInc = useMemo(() => incomes.reduce((s, tx) => s + tx.amount, 0), [incomes]);
  const balance = totalInc - totalExp;
  const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

  const currentMonthExp = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((tx) => tx.type === 'expense' && toDate(tx.date) >= start)
      .reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  const currentMonthInc = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((tx) => tx.type === 'income' && toDate(tx.date) >= start)
      .reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const start = getMonthStart(5 - i);
      const end = getMonthEnd(5 - i);
      const label = start.toLocaleDateString('es-BO', { month: 'short' });
      const txs = transactions.filter((tx) => {
        if (tx.type === 'transfer') return false;
        const d = toDate(tx.date);
        return d && d >= start && d <= end;
      });
      return {
        label,
        exp: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        inc: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  const avgMonthlyExp = useMemo(() => {
    const last3 = monthlyTrend.slice(-3);
    return last3.reduce((s, m) => s + m.exp, 0) / 3;
  }, [monthlyTrend]);

  const projectedExp = useMemo(() => {
    if (period !== '1m') return null;
    const now = new Date();
    const day = now.getDate();
    if (day === 0) return null;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return (currentMonthExp / day) * daysInMonth;
  }, [currentMonthExp, period]);

  const byGroup = useMemo(() => {
    const map = {};
    for (const tx of expenses) {
      const key = tx.parentCategory || tx.group || 'otros';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map).map(([key, total]) => ({ key, total })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const tx of expenses) {
      const key = tx.category || 'other';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([key, total]) => {
        const meta = TX_CATEGORIES.find((c) => c.value === key);
        return { key, total, label: meta?.label || key, emoji: meta?.emoji || '', parent: meta?.parent || 'otros' };
      })
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const prevRange = useMemo(
    () => getPreviousRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const prevFiltered = useMemo(() => {
    if (!prevRange) return [];
    return transactions.filter((tx) => {
      if (tx.type === 'transfer') return false;
      const d = toDate(tx.date);
      return d && d >= prevRange.start && d <= prevRange.end;
    });
  }, [transactions, prevRange]);

  const prevExpenses = useMemo(() => prevFiltered.filter((tx) => tx.type === 'expense'), [prevFiltered]);
  const prevIncomes  = useMemo(() => prevFiltered.filter((tx) => tx.type === 'income'),  [prevFiltered]);
  const prevTotalExp = useMemo(() => prevExpenses.reduce((s, tx) => s + tx.amount, 0), [prevExpenses]);
  const prevTotalInc = useMemo(() => prevIncomes.reduce((s, tx) => s + tx.amount, 0), [prevIncomes]);

  const prevByGroup = useMemo(() => {
    const map = {};
    for (const tx of prevExpenses) {
      const key = tx.parentCategory || tx.group || 'otros';
      map[key] = (map[key] || 0) + tx.amount;
    }
    return map;
  }, [prevExpenses]);

  const maxGroup = byGroup[0]?.total || 1;
  const filteredByCategory = activeGroup ? byCategory.filter((c) => c.parent === activeGroup) : byCategory;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const monthBalance = currentMonthInc - currentMonthExp;
  const dailyBudget = monthBalance > 0 ? monthBalance / daysLeft : 0;

  const insights = useMemo(
    () => getInsights(savingsRate, byGroup, totalExp, monthlyTrend, expenses),
    [savingsRate, byGroup, totalExp, monthlyTrend, expenses],
  );

  const periodLabel = useMemo(() => {
    if (period === 'custom') {
      if (customStart && customEnd) return null; // se resuelve con fmtDate en el componente
      return 'Rango personalizado';
    }
    return PERIODS.find((p) => p.value === period)?.label || '';
  }, [period, customStart, customEnd]);

  return {
    authLoading, user, loading, error,
    activeGroup, setActiveGroup,
    period, setPeriod,
    viewMode, setViewMode,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    periodLabel,
    expenses, incomes, totalExp, totalInc, balance, savingsRate,
    currentMonthExp, currentMonthInc,
    monthlyTrend, avgMonthlyExp, projectedExp,
    byGroup, byCategory, maxGroup, filteredByCategory,
    prevRange, prevTotalExp, prevTotalInc, prevByGroup,
    daysLeft, dailyBudget, insights,
    now,
  };
}
