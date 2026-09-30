// Motor puro de Analytics.
// No hace IO ni depende de React: recibe transacciones y devuelve métricas.

// Categorías / grupos que se tratan como aportes de capital (no gasto de consumo).
// Alineado con TX_CATEGORIES: ahorro, fondo_emergencia, inversion → parent finanzas.
const INVESTMENT_CATEGORY_KEYS = new Set([
  'inversion',
  'inversiones',
  'ahorro',
  'fondo_emergencia',
  'fondo_reserva',
  'buy',
  'sell',
  'construccion',
]);

const INVESTMENT_PARENT_KEYS = new Set([
  'finanzas',
  'ahorro_e_inversiones',
  'ahorroeinversiones',
]);

const INVESTMENT_WORDS = [
  'inversion',
  'inversiones',
  'ahorro',
  'fondo_emergencia',
  'fondo_reserva',
  'invest',
  'investment',
  'aporteinversion',
  'aportecartera',
  'aporte_cartera',
];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function amount(tx) {
  const value = Number(tx?.amount);
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

function isInvestmentLike(tx, categoryMeta) {
  const explicit = normalize(
    tx?.flowType || tx?.transactionClass || tx?.subtype || tx?.purpose,
  );

  if (
    [
      'investment',
      'invest',
      'contribution',
      'investment_contribution',
      'saving',
      'savings',
    ].includes(explicit)
  ) {
    return true;
  }

  const category = normalize(tx?.category ?? categoryMeta?.value);
  const parent = normalize(
    tx?.parentCategory ?? tx?.group ?? categoryMeta?.parent,
  );

  if (INVESTMENT_CATEGORY_KEYS.has(category)) return true;
  if (INVESTMENT_PARENT_KEYS.has(parent)) return true;

  const candidates = [category, parent, normalize(tx?.group)].filter(Boolean);

  return candidates.some((value) =>
    INVESTMENT_WORDS.some(
      (word) => value === word || value.includes(word),
    ),
  );
}

export function classifyTransaction(tx, categoryMeta = null) {
  const rawType = normalize(tx?.type);
  if (rawType === 'transfer') return 'transfer';
  if (rawType === 'investment' || rawType === 'contribution') return 'investment';
  if (rawType === 'income') return 'income';
  if (rawType === 'expense') {
    return isInvestmentLike(tx, categoryMeta) ? 'investment' : 'expense';
  }
  return 'unknown';
}

export function classifyTransactions(transactions = [], categoryMap = new Map()) {
  return transactions.map((tx) => ({
    ...tx,
    __amount: amount(tx),
    __flow: classifyTransaction(tx, categoryMap.get(tx?.category)),
  }));
}

export function splitFlows(transactions = []) {
  return {
    income: transactions.filter((tx) => tx.__flow === 'income'),
    expenses: transactions.filter((tx) => tx.__flow === 'expense'),
    investments: transactions.filter((tx) => tx.__flow === 'investment'),
    transfers: transactions.filter((tx) => tx.__flow === 'transfer'),
    unknown: transactions.filter((tx) => tx.__flow === 'unknown'),
  };
}

export function sum(transactions = []) {
  return transactions.reduce((total, tx) => total + (tx.__amount ?? amount(tx)), 0);
}

export function median(values = []) {
  const clean = values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!clean.length) return 0;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2
    ? clean[middle]
    : (clean[middle - 1] + clean[middle]) / 2;
}

export function mean(values = []) {
  const clean = values.map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}

export function percent(value, total) {
  return total > 0 ? (value / total) * 100 : null;
}

export function changePercent(current, previous) {
  if (previous === 0) {
    if (current === 0) return null;
    return null; // evitar mostrar +∞ como una variación útil
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function summarizeFlows(transactions = []) {
  const flows = splitFlows(transactions);
  const income = sum(flows.income);
  const expenses = sum(flows.expenses);
  const investments = sum(flows.investments);
  const outflows = expenses + investments;
  const netCashflow = income - outflows;

  // Ahorro = ingreso que no se consumió; incluye inversión.
  const savingsRate = percent(income - expenses, income);
  const investmentRate = percent(investments, income);
  const retentionRate = percent(netCashflow, income);
  const expenseRate = percent(expenses, income);

  return {
    incomeTransactions: flows.income,
    expenseTransactions: flows.expenses,
    investmentTransactions: flows.investments,
    transferTransactions: flows.transfers,
    unknownTransactions: flows.unknown,
    income,
    expenses,
    investments,
    outflows,
    netCashflow,
    savingsRate,
    investmentRate,
    retentionRate,
    expenseRate,
    transactionCount: transactions.length,
    expenseTransactionCount: flows.expenses.length,
    investmentTransactionCount: flows.investments.length,
    incomeTransactionCount: flows.income.length,
    transferCount: flows.transfers.length,
    unknownCount: flows.unknown.length,
  };
}

export function groupExpenses(expenses = [], TX_CATEGORIES = []) {
  const categoryMap = new Map(TX_CATEGORIES.map((item) => [item.value, item]));
  const map = new Map();

  for (const tx of expenses) {
    const meta = categoryMap.get(tx.category);
    const key = tx.parentCategory || meta?.parent || tx.group || 'otros';
    const current = map.get(key) || {
      key,
      total: 0,
      count: 0,
      categories: new Set(),
    };
    current.total += tx.__amount ?? amount(tx);
    current.count += 1;
    if (tx.category) current.categories.add(tx.category);
    map.set(key, current);
  }

  return [...map.values()]
    .map((item) => ({
      ...item,
      categories: [...item.categories],
    }))
    .sort((a, b) => b.total - a.total);
}

export function groupCategories(expenses = [], TX_CATEGORIES = []) {
  const categoryMap = new Map(TX_CATEGORIES.map((item) => [item.value, item]));

  const map = new Map();
  for (const tx of expenses) {
    const key = tx.category || 'other';
    const meta = categoryMap.get(key);
    const current = map.get(key) || {
      key,
      label: meta?.label || key,
      emoji: meta?.emoji || '',
      parent: tx.parentCategory || meta?.parent || tx.group || 'otros',
      total: 0,
      count: 0,
    };
    current.total += tx.__amount ?? amount(tx);
    current.count += 1;
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function monthlyTrend(transactions = [], start, end, getMonthsBetween, fmtMonth) {
  const months = getMonthsBetween(start, end);
  return months.map((monthStart) => {
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
      23, 59, 59, 999,
    );
    const txs = transactions.filter((tx) => {
      const d = tx.__date;
      return d && d >= monthStart && d <= monthEnd;
    });
    const summary = summarizeFlows(txs);
    return {
      key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      label: fmtMonth(monthStart),
      ...summary,
    };
  });
}

export function behaviorMetrics(expenses = [], groupedCategories = [], trend = []) {
  const values = expenses.map((tx) => tx.__amount ?? amount(tx));
  const monthlyExpenses = trend.map((m) => m.expenses);

  const avgTransaction = mean(values);
  const medianTransaction = median(values);
  const avgMonthly = mean(monthlyExpenses);
  const medianMonthly = median(monthlyExpenses);
  const variance =
    values.length > 1
      ? mean(values.map((v) => (v - avgTransaction) ** 2))
      : 0;
  const stdDev = Math.sqrt(variance);
  const largest = Math.max(...values, 0);

  const top3 = groupedCategories.slice(0, 3).reduce((s, item) => s + item.total, 0);
  const top5 = groupedCategories.slice(0, 5).reduce((s, item) => s + item.total, 0);
  const total = sum(expenses);

  return {
    transactionCount: expenses.length,
    avgTransaction,
    medianTransaction,
    largestTransaction: largest,
    avgMonthly,
    medianMonthly,
    transactionStdDev: stdDev,
    transactionCv: avgTransaction > 0 ? stdDev / avgTransaction : null,
    topCategoryPct: groupedCategories[0] ? percent(groupedCategories[0].total, total) : null,
    top3Pct: percent(top3, total),
    top5Pct: percent(top5, total),
  };
}

export function topExpenses(expenses = []) {
  const total = sum(expenses);
  return [...expenses]
    .sort((a, b) => b.__amount - a.__amount)
    .slice(0, 5)
    .map((tx) => ({
      ...tx,
      total: tx.__amount,
      pct: percent(tx.__amount, total),
    }));
}

export function buildSignals({
  current,
  previous,
  trend = [],
  behavior,
}) {
  const signals = [];

  if (current.income === 0 && current.expenses > 0) {
    signals.push({
      type: 'warning',
      title: 'Déficit del período',
      text: 'No hay ingresos registrados para cubrir los gastos del período seleccionado.',
    });
  }

  if (current.income > 0 && current.netCashflow < 0) {
    signals.push({
      type: 'warning',
      title: 'Flujo neto negativo',
      text: `Los egresos totales superan los ingresos en Bs ${Math.abs(current.netCashflow).toLocaleString('es-BO', { maximumFractionDigits: 0 })}.`,
    });
  }

  if (current.income > 0 && current.savingsRate != null) {
    signals.push({
      type: current.savingsRate >= 20 ? 'positive' : 'neutral',
      title: 'Tasa de ahorro',
      text: `El ${current.savingsRate.toFixed(1)}% de los ingresos no se destinó a consumo.`,
    });
  }

  if (current.income > 0 && current.investments > 0) {
    signals.push({
      type: 'positive',
      title: 'Capital invertido',
      text: `Se registraron Bs ${current.investments.toLocaleString('es-BO', { maximumFractionDigits: 0 })} como aportes de inversión.`,
    });
  }

  if (behavior?.top3Pct != null && behavior.top3Pct >= 60) {
    signals.push({
      type: 'neutral',
      title: 'Concentración',
      text: `Las tres categorías principales concentran ${behavior.top3Pct.toFixed(0)}% del gasto.`,
    });
  }

  if (previous && current.expenses > 0 && previous.expenses > 0) {
    const change = changePercent(current.expenses, previous.expenses);
    if (change != null && Math.abs(change) >= 10) {
      signals.push({
        type: change > 0 ? 'warning' : 'positive',
        title: change > 0 ? 'Gasto al alza' : 'Gasto a la baja',
        text: `${change > 0 ? 'Los gastos aumentaron' : 'Los gastos disminuyeron'} ${Math.abs(change).toFixed(1)}% frente al período anterior.`,
      });
    }
  }

  if (trend.length >= 2) {
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    if (last.expenses > 0 && prev.expenses > 0) {
      const change = changePercent(last.expenses, prev.expenses);
      if (change != null && Math.abs(change) >= 25) {
        signals.push({
          type: change > 0 ? 'warning' : 'neutral',
          title: 'Variación mensual relevante',
          text: `El último mes cambió ${Math.abs(change).toFixed(0)}% respecto al anterior.`,
        });
      }
    }
  }

  return signals.slice(0, 6);
}