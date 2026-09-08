import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  FilterX,
  LoaderCircle,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {downloadTransactionsPdf} from '../utils/transactionsPdf';
import {
  TX_CATEGORIES,
  TX_GROUPS,
  useTransactions,
} from '../hooks/useTransactions';
import {
  CategoryFilter,
  PeriodFilter,
  TransactionCard,
  TYPE_META,
} from '../components/transactions/TransactionParts';
import { TransactionForm } from '../components/transactions/TransactionsModal';
import { todayLocal, toDateInputValue } from '../utils/dateUtils';
import s from './Transactions.module.css';

const PERIODS = [
  { label: 'Todo', value: null },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Año', value: 'year' },
];

const DEFAULT_CATEGORY = {
  expense: 'viveres',
  income: 'salario',
  transfer: 'other',
};

const emptyForm = () => ({
  type: 'expense',
  amount: '',
  category: DEFAULT_CATEGORY.expense,
  date: todayLocal(),
  concept: '',
  note: '',
  currency: 'BOB',
});

const dateKey = (date) => {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return [
    local.getFullYear(),
    String(local.getMonth() + 1).padStart(2, '0'),
    String(local.getDate()).padStart(2, '0'),
  ].join('-');
};

const getPeriodRange = (period) => {
  if (!period) return { from: null, to: null };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = new Date(today);

  if (period === 'week') {
    const day = today.getDay();
    const distanceToMonday = day === 0 ? 6 : day - 1;
    from.setDate(today.getDate() - distanceToMonday);
  }

  if (period === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  if (period === 'quarter') {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    from = new Date(today.getFullYear(), quarterStartMonth, 1);
  }

  if (period === 'year') {
    from = new Date(today.getFullYear(), 0, 1);
  }

  return {
    from: dateKey(from),
    to: dateKey(today),
  };
};

const categoryParent = (category) =>
  TX_CATEGORIES.find((item) => item.value === category)?.parent || 'otros';

const categoryLabel = (category) =>
  TX_CATEGORIES.find((item) => item.value === category)?.label ||
  category ||
  'Otro';

const groupLabel = (group) =>
  TX_GROUPS.find((item) => item.value === group)?.label || 'Otros';

const typeLabel = (type) => TYPE_META[type]?.label || 'Movimiento';
const amountKey = (amount, currency) =>
  `${currency || 'USD'}::${Math.abs(Number(amount || 0)).toFixed(2)}`;

const buildCategorySummary = (transactions) => {
  const summary = new Map();

  transactions.forEach((transaction) => {
    if (transaction.type === 'transfer') return;

    const currency = transaction.currency || 'USD';
    const category = categoryLabel(transaction.category);
    const type = typeLabel(transaction.type);
    const amount = Math.abs(Number(transaction.amount || 0));
    const key = `${transaction.type}::${category}::${currency}`;

    const current = summary.get(key) || {
      type,
      category,
      currency,
      amount: 0,
    };

    current.amount += amount;
    summary.set(key, current);
  });

  return [...summary.values()].sort((a, b) => {
    const typeOrder = a.type.localeCompare(b.type, 'es');

    if (typeOrder !== 0) return typeOrder;

    return a.category.localeCompare(b.category, 'es');
  });
};
const buildTotals = (transactions) => {
  const totals = new Map();

  transactions.forEach((transaction) => {
    if (transaction.type !== 'income' && transaction.type !== 'expense') {
      return;
    }

    const currency = transaction.currency || 'USD';
    const key = amountKey(0, currency);
    const current = totals.get(key) || {
      currency,
      income: 0,
      expense: 0,
    };

    const amount = Math.abs(Number(transaction.amount || 0));

    if (transaction.type === 'income') current.income += amount;
    if (transaction.type === 'expense') current.expense += amount;

    totals.set(key, current);
  });

  return [...totals.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency, 'es')
  );
};

export default function Transactions() {
  const [period, setPeriod] = useState('week');
  const [type, setType] = useState(null);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const range = useMemo(() => getPeriodRange(period), [period]);

  const {
    transactions,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    addTransaction,
    updateTransaction,
    removeTransaction,
    getTransactionsForExport,
  } = useTransactions(range);

  useEffect(() => {
    document.body.classList.toggle('modal-open', isFormOpen);

    return () => document.body.classList.remove('modal-open');
  }, [isFormOpen]);

  const visibleTransactions = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();

    return transactions.filter((transaction) => {
      if (type && transaction.type !== type) return false;
      if (category && transaction.category !== category) return false;

      if (!needle) return true;

      const searchable = [
        transaction.concept,
        transaction.title,
        transaction.note,
        transaction.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();

      return searchable.includes(needle);
    });
  }, [transactions, type, category, search]);

  const summary = useMemo(
    () =>
      visibleTransactions.reduce(
        (result, transaction) => {
          const amount = Math.abs(Number(transaction.amount || 0));

          if (transaction.type === 'income') result.income += amount;
          if (transaction.type === 'expense') result.expense += amount;

          result.count += 1;
          return result;
        },
        { income: 0, expense: 0, count: 0 }
      ),
    [visibleTransactions]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (transaction) => {
    setEditingId(transaction.id);
    setForm({
      type: transaction.type || 'expense',
      amount: String(Math.abs(Number(transaction.amount || 0))),
      category:
        transaction.category ||
        DEFAULT_CATEGORY[transaction.type] ||
        DEFAULT_CATEGORY.expense,
      date: toDateInputValue(
        transaction.date || transaction.createdAt,
        transaction.date || todayLocal()
      ),
      concept: transaction.concept || transaction.title || '',
      note: transaction.note || '',
      currency: transaction.currency || 'BOB',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);
    const concept = form.concept.trim();

    if (!form.date || !concept || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const payload = {
      type: form.type,
      amount,
      category: form.category,
      parentCategory: categoryParent(form.category),
      date: form.date,
      concept,
      title: concept,
      note: form.note.trim(),
      currency: form.currency || 'BOB',
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await addTransaction(payload);
      }

      setIsFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (requestError) {
      console.error('Error guardando transacción:', requestError);
      window.alert('No se pudo guardar el movimiento. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (transaction) => {
    const concept = transaction.concept || transaction.title || 'este movimiento';

    if (!window.confirm(`¿Eliminar "${concept}"?`)) return;

    try {
      await removeTransaction(transaction.id);
    } catch (requestError) {
      console.error('Error eliminando transacción:', requestError);
      window.alert('No se pudo eliminar el movimiento.');
    }
  };

  const clearFilters = () => {
    setPeriod('week');
    setType(null);
    setCategory(null);
    setSearch('');
  };

  const hasActiveFilters = Boolean(
    type || category || search || period !== 'week'
  );

const handleExport = async () => {
  setExporting(true);

  try {
    const allForPeriod = await getTransactionsForExport();
    const needle = search.trim().toLocaleLowerCase();

    const filtered = allForPeriod.filter((transaction) => {
      if (type && transaction.type !== type) return false;
      if (category && transaction.category !== category) return false;

      if (!needle) return true;

      return [
        transaction.concept,
        transaction.title,
        transaction.note,
        transaction.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(needle);
    });

    if (!filtered.length) {
      window.alert('No hay movimientos para exportar con los filtros actuales.');
      return;
    }

    downloadTransactionsPdf({
      transactions: filtered,
      categories: TX_CATEGORIES,
      period,
      filename: `reporte-movimientos-${period || 'todo'}-${todayLocal()}.pdf`,
    });
  } catch (requestError) {
    console.error('Error exportando PDF:', requestError);
    window.alert('No se pudo generar el reporte PDF.');
  } finally {
    setExporting(false);
  }
};

  return (
    <section className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Movimientos</h1>
          <p className={s.subtitle}>Historial financiero</p>
        </div>

        <div className={s.headerActions}>
          <button
            type="button"
            className={s.iconButton}
            onClick={handleExport}
            disabled={exporting}
            aria-label="Descargar PDF"
            title="Descargar PDF"
          >
            {exporting ? (
              <LoaderCircle size={18} className={s.spin} />
            ) : (
              <Download size={18} />
            )}
          </button>

          <button
            type="button"
            className={s.iconButton}
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            aria-label="Restablecer filtros"
            title="Restablecer filtros"
          >
            <FilterX size={18} />
          </button>
        </div>
      </header>

      <PeriodFilter value={period} onChange={setPeriod} periods={PERIODS} />

      <div className={s.summaryRow}>
        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Gastos</span>
          <span className={s.summaryExpense}>
            {summary.expense.toFixed(2)}
          </span>
        </div>

        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Ingresos</span>
          <span className={s.summaryIncome}>
            {summary.income.toFixed(2)}
          </span>
        </div>

        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Mostrados</span>
          <span className={s.summaryCount}>{summary.count}</span>
        </div>
      </div>

      <div className={s.typeFilterRow}>
        {[
          ['all', 'Todos'],
          ['expense', 'Gastos'],
          ['income', 'Ingresos'],
          ['transfer', 'Transferencias'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`${s.typeFilterBtn} ${
              (!type && value === 'all') || type === value
                ? s.typeFilterBtnActive
                : ''
            }`}
            onClick={() => setType(value === 'all' ? null : value)}
          >
            {label}
          </button>
        ))}
      </div>

      <CategoryFilter value={category} onChange={setCategory} />

      <div className={s.searchWrap}>
        <Search size={16} className={s.searchIcon} />

        <input
          className={s.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar concepto o nota"
          type="search"
        />

        {search ? (
          <button
            type="button"
            className={s.searchClear}
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className={s.loadingState}>
          <LoaderCircle size={20} className={s.spin} />
          Cargando movimientos…
        </div>
      ) : null}

      {!loading && error ? <div className={s.errorState}>{error}</div> : null}

      {!loading && !error ? (
        <div className={s.list}>
          {visibleTransactions.length ? (
            visibleTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                tx={transaction}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>📭</div>
              <div className={s.empty}>No hay movimientos para estos filtros.</div>
            </div>
          )}
        </div>
      ) : null}

      {!loading && hasMore ? (
        <button
          type="button"
          className={s.loadMoreButton}
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <LoaderCircle size={17} className={s.spin} />
              Cargando…
            </>
          ) : (
            'Cargar 50 movimientos más'
          )}
        </button>
      ) : null}

      <button
        type="button"
        className={s.fab}
        onClick={openCreate}
        aria-label="Agregar movimiento"
      >
        <Plus size={24} />
      </button>

      {isFormOpen ? (
        <div
          className={s.fsOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? 'Editar movimiento' : 'Nuevo movimiento'}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <div className={s.fsSheet} onMouseDown={(event) => event.stopPropagation()}>
            <div className={s.fsHeader}>
              <span className={s.fsTitle}>
                {editingId ? 'Editar movimiento' : 'Nuevo movimiento'}
              </span>

              <button
                type="button"
                className={s.btnClose}
                onClick={closeForm}
                disabled={saving}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className={s.fsBody}>
              <TransactionForm
                form={form}
                setForm={setForm}
                typeMeta={TYPE_META}
                editing={Boolean(editingId)}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                saving={saving}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}