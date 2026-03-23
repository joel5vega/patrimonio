// pages/Transactions.jsx
import { useState } from 'react';
import { Filter, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useTransactions, TX_CATEGORIES, TX_GROUPS } from '../hooks/useTransactions';
import { formatDate } from '../utils/formatDate';
import { isInPeriod } from '../utils/filterByPeriod';
import s from './Transactions.module.css';

// ─── Meta helpers ─────────────────────────────────────────
const categoryMeta = (value) =>
  TX_CATEGORIES.find((c) => c.value === value) ?? { label: value, color: '' };

// ─── Filtro de período ────────────────────────────────────
const PERIODS = [
  { label: 'Todo',      value: null },
  { label: 'Semana',    value: 'week' },
  { label: 'Mes',       value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Año',       value: 'year' },
];

const PeriodFilter = ({ value, onChange }) => (
  <div className={s.periodFilter}>
    {PERIODS.map((p) => (
      <button
        key={p.label}
        type="button"
        className={`${s.periodBtn} ${value === p.value ? s.periodBtnActive : ''}`}
        onClick={() => onChange(p.value)}
      >
        {p.label}
      </button>
    ))}
  </div>
);

// ─── Dropdown de categorías (full‑screen picker) ──────────────
const CategoryDropdown = ({ value, onChange, grouped = false }) => {
  const [open, setOpen] = useState(false);
  const selected = TX_CATEGORIES.find((c) => c.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger pill */}
      <div className={s.dropdown}>
        <button
          type="button"
          className={s.dropdownTrigger}
          onClick={() => setOpen(true)}
        >
          <span>
            {selected ? `${selected.emoji ?? ''} ${selected.label}` : 'Categoría'}
          </span>
          <span className={s.dropdownArrow}>▾</span>
        </button>
      </div>

      {/* Full‑screen picker */}
      {open && (
        <div className={s.fsOverlay} onClick={() => setOpen(false)}>
          <div
            className={s.fsSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={s.fsHeader}>
              <h2 className={s.fsTitle}>Elegir categoría</h2>
              <button
                type="button"
                className={s.btnClose}
                onClick={() => setOpen(false)}
                aria-label="Cerrar selector"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className={s.fsBody}>
              {grouped ? (
                TX_GROUPS.map((g) => (
                  <div key={g.value} className={s.fsGroupBlock}>
                    <p className={s.fsGroupLabel}>{g.label}</p>
                    {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => {
                      const active = c.value === value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          className={`${s.fsItem} ${active ? s.fsItemActive : ''}`}
                          onClick={() => handleSelect(c.value)}
                        >
                          <span className={s.fsItemEmoji}>{c.emoji}</span>
                          <span className={s.fsItemLabel}>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                TX_CATEGORIES.map((c) => {
                  const active = c.value === value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      className={`${s.fsItem} ${active ? s.fsItemActive : ''}`}
                      onClick={() => handleSelect(c.value)}
                    >
                      <span className={s.fsItemEmoji}>{c.emoji}</span>
                      <span className={s.fsItemLabel}>{c.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Dropdown de filtro por categoría (usa botón Filtro) ────────────────────
const FilterDropdown = ({ value, onChange, open, setOpen }) => {
  const selected = TX_CATEGORIES.find((c) => c.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={s.dropdown} style={{ flex: 1 }}>
      <button
        type="button"
        className={s.dropdownTrigger}
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          {selected
            ? `${selected.emoji ?? ''} ${selected.label}`
            : '🗂 Todas las categorías'}
        </span>
        <span className={s.dropdownArrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={s.dropdownMenu}>
          <button
            type="button"
            className={`${s.dropdownItem} ${value === null ? s.dropdownItemActive : ''}`}
            onClick={() => handleSelect(null)}
          >
            🗂 Todas las categorías
          </button>

          <hr className={s.dropdownDivider} />

          {TX_GROUPS.map((g) => (
            <div key={g.value}>
              <p className={s.dropdownGroup}>{g.label}</p>
              {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${s.dropdownItem} ${c.value === value ? s.dropdownItemActive : ''}`}
                  onClick={() => handleSelect(c.value)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Fila editable ────────────────────────────────────────
const TxRow = ({ tx, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    concept:  tx.concept || tx.title || '',
    category: tx.category || 'other',
    note:     tx.note || '',
  });

  const save = async () => {
    const parent =
      TX_CATEGORIES.find((c) => c.value === form.category)?.parent ?? 'otros';
    await onSave(tx.id, { ...form, parentCategory: parent });
    setEditing(false);
  };

  const meta      = categoryMeta(tx.category);
  const symbol    = tx.currency === 'BOB' ? 'Bs' : '$';
  const isExpense = tx.type === 'expense';

  return (
    <div className={s.card}>
      <div className={s.cardTop}>
        <div className={s.cardLeft}>
          {editing ? (
            <input
              className={s.input}
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
              placeholder="Concepto..."
            />
          ) : (
            <p className={s.concept}>{tx.concept || tx.title || '—'}</p>
          )}
          <div className={s.meta}>
            <span className={`${s.badge} ${meta.color}`}>
              {meta.emoji ?? ''} {meta.label}
            </span>
            <span className={s.date}>{formatDate(tx.date)}</span>
          </div>
        </div>

        <p className={isExpense ? s.amountExpense : s.amountIncome}>
          {isExpense ? '-' : '+'}
          {symbol}
          {Math.abs(Number(tx.amount)).toFixed(2)}
        </p>
      </div>

      {editing && (
        <div className={s.editFields}>
          <input
            className={s.input}
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
            placeholder="Concepto..."
          />
          <CategoryDropdown
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
            grouped
          />
          <input
            className={s.input}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Nota opcional..."
          />
        </div>
      )}

      <div className={s.actions}>
        {editing ? (
          <>
            <button
              className={`${s.btnIcon} ${s.btnCancel}`}
              onClick={() => setEditing(false)}
            >
              <X size={14} />
            </button>
            <button className={`${s.btnIcon} ${s.btnSave}`} onClick={save}>
              <Check size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              className={`${s.btnIcon} ${s.btnDelete}`}
              onClick={() => onDelete(tx.id)}
            >
              <Trash2 size={14} />
            </button>
            <button
              className={`${s.btnIcon} ${s.btnEdit}`}
              onClick={() => setEditing(true)}
            >
              <Pencil size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Modal nueva transacción (full‑screen) ────────────────────────────────
const NewTxModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    concept: '',
    amount: '',
    currency: 'BOB',
    type: 'expense',
    category: 'viveres',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const isValid = form.concept.trim() && Number(form.amount) > 0;

  const submit = async () => {
    if (!isValid) return;
    const parent =
      TX_CATEGORIES.find((c) => c.value === form.category)?.parent ?? 'otros';
    await onAdd({ ...form, title: form.concept, parentCategory: parent });
    onClose();
  };

  return (
    <div className={s.fsOverlay} onClick={onClose}>
      <div
        className={s.fsSheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.fsHeader}>
          <h2 className={s.fsTitle}>Nueva Transacción</h2>
          <button
            type="button"
            className={s.btnClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className={s.fsBody}>
          <label className={s.labelModal}>Concepto *</label>
          <input
            className={s.inputModal}
            placeholder="Ej: Supermercado, alquiler..."
            value={form.concept}
            onChange={(e) => set('concept', e.target.value)}
          />

          <div className={s.gridTwo}>
            <div>
              <label className={s.labelModal}>Monto *</label>
              <input
                className={s.inputModal}
                placeholder="0.00"
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
            </div>
            <div>
              <label className={s.labelModal}>Moneda</label>
              <select
                className={s.inputModal}
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              >
                <option value="BOB">BOB Bs</option>
                <option value="USD">USD $</option>
              </select>
            </div>
          </div>

          <div className={s.gridTwo}>
            <div>
              <label className={s.labelModal}>Tipo</label>
              <select
                className={s.inputModal}
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
              >
                <option value="expense">💸 Gasto</option>
                <option value="income">💵 Ingreso</option>
                <option value="transfer">↔️ Transferencia</option>
              </select>
            </div>
            <div>
              <label className={s.labelModal}>Categoría</label>
              <CategoryDropdown
                value={form.category}
                onChange={(val) => set('category', val)}
                grouped
              />
            </div>
          </div>

          <label className={s.labelModal}>Fecha</label>
          <input
            className={s.inputModal}
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />

          <label className={s.labelModal}>Nota opcional</label>
          <input
            className={s.inputModal}
            placeholder="Nota opcional"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
          />
        </div>

        <div className={s.fsFooter}>
          <button
            className={s.btnSubmit}
            onClick={submit}
            disabled={!isValid}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
// Excel → Date (si no es Excel, intenta ISO normal)
const excelSerialToDate = (value) => {
  if (value == null) return null;

  const num = Number(value);
  if (!Number.isNaN(num)) {
    const base = new Date(1899, 11, 30); // 1899-12-30
    const ms = num * 24 * 60 * 60 * 1000;
    return new Date(base.getTime() + ms);
  }

  // ya viene como "2024-05-19"
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseDate = (d) => {
  const dt = excelSerialToDate(d);
  return dt ? dt.getTime() : 0;
};
// ─── Página principal ─────────────────────────────────────
const Transactions = () => {
  const { transactions, addTransaction, updateTransaction, removeTransaction } =
    useTransactions();
  const [activeFilter, setActiveFilter] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // ordenar por fecha DESC y luego filtrar + buscar
  const sorted = [...transactions].sort(
    (a, b) => parseDate(b.date) - parseDate(a.date)
    
  ); 

  const filtered = sorted.filter((tx) => {
    const matchesCategory = activeFilter === null || tx.category === activeFilter;
    const matchesPeriod = isInPeriod(tx.date, activePeriod);
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (tx.concept || tx.title || '').toLowerCase().includes(term) ||
      (tx.note || '').toLowerCase().includes(term);
    return matchesCategory && matchesPeriod && matchesSearch;
  }); // [web:84][web:90]

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Movimientos</h1>
        <button
          type="button"
          className={s.filterButton}
          onClick={() => setFilterOpen((o) => !o)}
        >
          <Filter size={18} />
        </button>
      </div>

      <PeriodFilter value={activePeriod} onChange={setActivePeriod} />

      <div className={s.searchRow}>
        <input
          className={s.searchInput}
          placeholder="Buscar por concepto o nota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={s.filterRow}>
        <FilterDropdown
          value={activeFilter}
          onChange={setActiveFilter}
          open={filterOpen}
          setOpen={setFilterOpen}
        />
        {activeFilter !== null && (
          <button
            className={s.clearFilter}
            onClick={() => setActiveFilter(null)}
          >
            <X size={12} /> Todos
          </button>
        )}
      </div>

      <div className={s.list}>
        {filtered.length === 0 && (
          <p className={s.empty}>Sin movimientos</p>
        )}
        {filtered.map((tx) => (
          <TxRow
            key={tx.id}
            tx={tx}
            onSave={updateTransaction}
            onDelete={removeTransaction}
          />
        ))}
      </div>

      {showModal && (
        <NewTxModal onClose={() => setShowModal(false)} onAdd={addTransaction} />
      )}

      <button className={s.fab} onClick={() => setShowModal(true)}>
        <Plus size={26} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Transactions;