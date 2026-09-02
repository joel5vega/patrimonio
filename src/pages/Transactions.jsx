// pages/Transactions.jsx
import { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useTransactions, TX_CATEGORIES } from '../hooks/useTransactions';
import { isInPeriod } from '../utils/filterByPeriod';
import {
  TransactionCard,
  PeriodFilter,
  TYPE_META,
} from '../components/transactions/TransactionParts';
import { TransactionForm } from '../components/transactions/TransactionsModal';
import {
  parseLocal,
  todayLocal,
  toDateInputValue,
} from '../utils/dateUtils';
import s from './Transactions.module.css';

const PERIODS = [
  { label: 'Todo', value: null },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Año', value: 'year' },
];

const DEFAULT_CAT = {
  expense: 'viveres',
  income: 'salario',
  transfer: 'other',
};

const emptyForm = () => ({
  type: 'expense',
  amount: '',
  category: DEFAULT_CAT.expense,
  date: todayLocal(),
  concept: '',
  note: '',
  currency: 'USD',
});

const categoryParent = (category) =>
  TX_CATEGORIES.find((item) => item.value === category)?.parent || 'otros';

const createdTime = (value) => {
  if (value?.toDate) return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();

  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export default function Transactions() {
  const {
    transactions = [],
    addTransaction,
    updateTransaction,
    removeTransaction,
  } = useTransactions();

  const [period, setPeriod] = useState(null);
  const [type, setType] = useState(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.log('[Transactions] registros recibidos:', transactions.length);
    logTransactionDates(transactions.slice(0, 10), 'transactions-preview');
  }, [transactions.length]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (tx) => {
    const date = toDateInputValue(
      tx.date || tx.createdAt,
      tx.date || todayLocal()
    );

    console.log('[Transactions] editando fecha:', {
      id: tx.id,
      originalDate: tx.date,
      createdAt: tx.createdAt,
      inputDate: date,
    });

    setEditingId(tx.id);
    setForm({
      type: tx.type || 'expense',
      amount: String(Math.abs(Number(tx.amount || 0))),
      category: tx.category || DEFAULT_CAT[tx.type] || 'other',
      date,
      concept: tx.concept || tx.title || '',
      note: tx.note || '',
      currency: tx.currency || 'USD',
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

    if (
      !form.date ||
      !concept ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
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
      currency: form.currency || 'USD',
    };

    console.log('[Transactions] guardando:', payload);
    console.time('[Transactions] save');
    setSaving(true);

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await addTransaction(payload);
      }

      // No usar closeForm() porque saving aún es true.
      setIsFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (error) {
      console.error('Error guardando transacción:', error);
    } finally {
      setSaving(false);
      console.timeEnd('[Transactions] save');
    }
  };

  const handleDelete = async (tx) => {
    const confirmed = window.confirm(
      `¿Eliminar "${tx.concept || tx.title || 'este movimiento'}"?`
    );

    if (!confirmed) return;

    try {
      await removeTransaction(tx.id);
    } catch (error) {
      console.error('Error eliminando transacción:', error);
    }
  };

  const visibleTransactions = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return transactions
      .filter((tx) => isInPeriod(tx.date || tx.createdAt, period))
      .filter((tx) => !type || tx.type === type)
      .filter((tx) => {
        if (!needle) return true;

        return [tx.concept, tx.title, tx.note, tx.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        const dateA = parseLocal(a.date || a.createdAt);
        const dateB = parseLocal(b.date || b.createdAt);

        const timeA = Number.isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = Number.isNaN(dateB.getTime()) ? 0 : dateB.getTime();

        if (timeB !== timeA) return timeB - timeA;

        return createdTime(b.createdAt) - createdTime(a.createdAt);
      });
  }, [transactions, period, type, search]);

  const summary = useMemo(
    () =>
      visibleTransactions.reduce(
        (result, tx) => {
          const amount = Math.abs(Number(tx.amount || 0));

          if (tx.type === 'income') result.income += amount;
          if (tx.type === 'expense') result.expense += amount;

          result.count += 1;
          return result;
        },
        { income: 0, expense: 0, count: 0 }
      ),
    [visibleTransactions]
  );

  const clearFilters = () => {
    setPeriod(null);
    setType(null);
    setSearch('');
  };

  return (
    <section className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Movimientos</h1>

        <button
          type="button"
          className={s.filterButton}
          onClick={clearFilters}
          aria-label="Limpiar filtros"
        >
          <Filter size={18} />
        </button>
      </header>

      <PeriodFilter value={period} onChange={setPeriod} periods={PERIODS} />

      <div className={s.summaryRow}>
        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Gastos</span>
          <span className={s.summaryExpense}>
            $ {summary.expense.toFixed(2)}
          </span>
        </div>

        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Ingresos</span>
          <span className={s.summaryIncome}>
            $ {summary.income.toFixed(2)}
          </span>
        </div>

        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Registros</span>
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

      <div className={s.searchWrap}>
        <Search size={16} className={s.searchIcon} />

        <input
          className={s.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar movimientos…"
        />

        {search && (
          <button
            type="button"
            className={s.searchClear}
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className={s.list}>
        {visibleTransactions.length ? (
          visibleTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              tx={tx}
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

      <button
        type="button"
        className={s.fab}
        onClick={openCreate}
        aria-label="Agregar movimiento"
      >
        <Plus size={24} />
      </button>

      {isFormOpen && (
        <div
          className={s.fsOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? 'Editar movimiento' : 'Nuevo movimiento'}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
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
      )}
    </section>
  );
}