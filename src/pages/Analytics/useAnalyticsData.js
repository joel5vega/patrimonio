import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions, TX_CATEGORIES } from '../../hooks/useTransactions';
import {
  addMonths,
  endOfDay,
  endOfMonth,
  fmtMonth,
  formatQueryDate,
  getMonthsBetween,
  getPreviousRange,
  getStartDate,
  startOfDay,
  startOfMonth,
  toDate,
} from './dateHelpers';
import {
  behaviorMetrics,
  buildSignals,
  classifyTransactions,
  groupCategories,
  groupExpenses,
  monthlyTrend,
  summarizeFlows,
  topExpenses,
} from './analyticsEngine';

export const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1A', value: '1y' },
  { label: 'Todo', value: 'all' },
  { label: 'Fecha', value: 'custom' },
];

function rangeQuery(start, end, ready) {
  if (!ready) {
    return { from: null, to: null, enabled: false, loadRange: false };
  }

  // start/end nulos representa explícitamente "Todo".
  if (!start && !end) {
    return { from: null, to: null, enabled: true, loadRange: true };
  }

  if (!start) {
    return { from: null, to: null, enabled: false, loadRange: false };
  }

  return {
    from: formatQueryDate(start),
    to: end ? formatQueryDate(end) : null,
    enabled: true,
    loadRange: true,
  };
}

function enrichDates(transactions) {
  return transactions.map((tx) => ({ ...tx, __date: toDate(tx.date) }));
}

export function useAnalyticsData() {
  const auth = useAuth();
  const user = auth?.user;
  const authLoading = auth?.loading ?? true;
  const ready = !authLoading && Boolean(user?.uid);

  const [period, setPeriod] = useState('1m');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [now] = useState(() => new Date());

  const selectedRange = useMemo(() => {
    if (!ready) return { start: null, end: null, valid: false };

    if (period === 'custom') {
      const start = startOfDay(customStart);
      const end = endOfDay(customEnd);
      return {
        start,
        end,
        valid: Boolean(start && end && start <= end),
      };
    }

    const start = getStartDate(period, now);
    const end = period === 'all' ? null : endOfDay(now);

    return {
      start,
      end,
      valid: true,
    };
  }, [ready, period, customStart, customEnd, now]);

  const previousRange = useMemo(
    () => getPreviousRange(period, customStart, customEnd, now),
    [period, customStart, customEnd, now],
  );

  // La tendencia tiene una ventana fija de 12 meses. Esto evita que un filtro
  // de 7D/1M destruya el contexto histórico.
  const trendRange = useMemo(() => {
    if (!ready) return { start: null, end: null };
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfDay(now),
    };
  }, [ready, now]);

  const selectedQuery = useMemo(
    () => rangeQuery(selectedRange.start, selectedRange.end, ready && selectedRange.valid),
    [selectedRange, ready],
  );

  const trendQuery = useMemo(
    () => rangeQuery(trendRange.start, trendRange.end, ready),
    [trendRange, ready],
  );

  const previousQuery = useMemo(
    () =>
      rangeQuery(
        previousRange?.start,
        previousRange?.end,
        ready && Boolean(previousRange),
      ),
    [previousRange, ready],
  );

  const selectedResult = useTransactions(selectedQuery);
  const trendResult = useTransactions(trendQuery);
  const previousResult = useTransactions(previousQuery);

  const loading = selectedResult.loading || trendResult.loading || previousResult.loading;
  const error = selectedResult.error || trendResult.error || previousResult.error;

  const categoryMap = useMemo(
    () => new Map(TX_CATEGORIES.map((item) => [item.value, item])),
    [],
  );

  const selectedTransactions = useMemo(
    () => enrichDates(classifyTransactions(selectedResult.transactions || [], categoryMap)),
    [selectedResult.transactions, categoryMap],
  );

  const historicalTransactions = useMemo(
    () => enrichDates(classifyTransactions(trendResult.transactions || [], categoryMap)),
    [trendResult.transactions, categoryMap],
  );

  const previousTransactions = useMemo(
    () => enrichDates(classifyTransactions(previousResult.transactions || [], categoryMap)),
    [previousResult.transactions, categoryMap],
  );

  const current = useMemo(
    () => summarizeFlows(selectedTransactions),
    [selectedTransactions],
  );

  const previous = useMemo(
    () => (previousRange ? summarizeFlows(previousTransactions) : null),
    [previousTransactions, previousRange],
  );

  const trend = useMemo(
    () =>
      monthlyTrend(
        historicalTransactions,
        trendRange.start,
        trendRange.end,
        getMonthsBetween,
        fmtMonth,
      ),
    [historicalTransactions, trendRange],
  );

  const grouped = useMemo(
    () => groupExpenses(current.expenseTransactions, TX_CATEGORIES),
    [current.expenseTransactions],
  );

  const categories = useMemo(
    () => groupCategories(current.expenseTransactions, TX_CATEGORIES),
    [current.expenseTransactions],
  );

  const monthlySelected = useMemo(() => {
    if (!selectedRange.start || !selectedRange.end) return [];
    return monthlyTrend(
      selectedTransactions,
      startOfMonth(selectedRange.start),
      endOfMonth(selectedRange.end),
      getMonthsBetween,
      fmtMonth,
    );
  }, [selectedTransactions, selectedRange]);

  const behavior = useMemo(
    () => behaviorMetrics(current.expenseTransactions, categories, monthlySelected),
    [current.expenseTransactions, categories, monthlySelected],
  );

  const top = useMemo(
    () => topExpenses(current.expenseTransactions),
    [current.expenseTransactions],
  );

  const prevByGroup = useMemo(
    () => groupExpenses(previous?.expenseTransactions || [], TX_CATEGORIES),
    [previous],
  );

  const previousGroupMap = useMemo(
    () => Object.fromEntries(prevByGroup.map((item) => [item.key, item.total])),
    [prevByGroup],
  );

  const filteredCategories = useMemo(
    () =>
      activeGroup
        ? categories.filter((item) => item.parent === activeGroup)
        : categories,
    [categories, activeGroup],
  );

  const concentration = useMemo(
    () => ({
      top1: behavior.topCategoryPct,
      top3: behavior.top3Pct,
      top5: behavior.top5Pct,
    }),
    [behavior],
  );

  const signals = useMemo(
    () => buildSignals({ current, previous, trend, behavior }),
    [current, previous, trend, behavior],
  );

  const periodLabel = useMemo(() => {
    if (period === 'custom') {
      return selectedRange.valid && customStart && customEnd
        ? `${customStart.toLocaleDateString('es-BO')} → ${customEnd.toLocaleDateString('es-BO')}`
        : 'Selecciona un rango';
    }
    return PERIODS.find((item) => item.value === period)?.label || '';
  }, [period, customStart, customEnd, selectedRange.valid]);

  // Comparación de balance sin ocultar el signo real.
  const previousNet = previous?.netCashflow ?? null;

  return {
    authLoading,
    user,
    loading,
    error,

    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    periodLabel,

    activeGroup,
    setActiveGroup,

    current,
    previous,
    previousRange,
    previousNet,

    expenses: current.expenseTransactions,
    incomes: current.incomeTransactions,
    investments: current.investmentTransactions,
    transfers: current.transferTransactions,

    totalInc: current.income,
    totalExp: current.expenses,
    totalInvestment: current.investments,
    balance: current.netCashflow,
    savingsRate: current.savingsRate,

    prevTotalInc: previous?.income ?? null,
    prevTotalExp: previous?.expenses ?? null,
    prevTotalInvestment: previous?.investments ?? null,

    trend,
    monthlyTrend: trend,
    monthlySelected,

    byGroup: grouped,
    byCategory: categories,
    filteredByCategory: filteredCategories,
    maxGroup: grouped[0]?.total || 1,
    prevByGroup: previousGroupMap,

    behavior,
    topExpenses: top,
    concentration,
    signals,

    unknownCount: current.unknownCount,
    transferCount: current.transferCount,
  };
}
