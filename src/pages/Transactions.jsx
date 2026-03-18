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

// ─── Dropdown de categorías (formulario) ──────────────────
const CategoryDropdown = ({ value, onChange, grouped = false }) => {
  const [open, setOpen] = useState(false);
  const selected = TX_CATEGORIES.find((c) => c.value === value);

  const handleSelect = (val) => { onChange(val); setOpen(false); };

  return (
    <div className={s.dropdown}>
      <button type="button" className={s.dropdownTrigger} onClick={() => setOpen((o) => !o)}>
        <span>{selected ? `${selected.emoji ?? ''} ${selected.label}` : 'Categoría'}</span>
        <span className={s.dropdownArrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={s.dropdownMenu}>
          {grouped
            ? TX_GROUPS.map((g) => (
                <div key={g.value}>
                  <p className={s.dropdownGroup}>{g.label}</p>
                  {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => (
                    <button key={c.value} type="button"
                      className={`${s.dropdownItem} ${c.value === value ? s.dropdownItemActive : ''}`}
                      onClick={() => handleSelect(c.value)}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              ))
            : TX_CATEGORIES.map((c) => (
                <button key={c.value} type="button"
                  className={`${s.dropdownItem} ${c.value === value ? s.dropdownItemActive : ''}`}
                  onClick={() => handleSelect(c.value)}>
                  {c.emoji} {c.label}
                </button>
              ))}
        </div>
      )}
    </div>
  );
};

// ─── Dropdown de filtro por categoría ────────────────────
const FilterDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = TX_CATEGORIES.find((c) => c.value === value);

  const handleSelect = (val) => { onChange(val); setOpen(false); };

  return (
    <div className={s.dropdown} style={{ flex: 1 }}>
      <button type="button" className={s.dropdownTrigger} onClick={() => setOpen((o) => !o)}>
        <span>
          {selected ? `${selected.emoji ?? ''} ${selected.label}` : '🗂 Todas las categorías'}
        </span>
        <span className={s.dropdownArrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={s.dropdownMenu}>
          <button type="button"
            className={`${s.dropdownItem} ${value === null ? s.dropdownItemActive : ''}`}
            onClick={() => handleSelect(null)}>
            🗂 Todas las categorías
          </button>

          <hr className={s.dropdownDivider} />

          {TX_GROUPS.map((g) => (
            <div key={g.value}>
              <p className={s.dropdownGroup}>{g.label}</p>
              {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => (
                <button key={c.value} type="button"
                  className={`${s.dropdownItem} ${c.value === value ? s.dropdownItemActive : ''}`}
                  onClick={() => handleSelect(c.value)}>
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
    const parent = TX_CATEGORIES.find(c => c.value === form.category)?.parent ?? 'otros';
    await onSave(tx.id, { ...form, parentCategory: parent }); setEditing(false); };
  const meta      = categoryMeta(tx.category);
  const symbol    = tx.currency === 'BOB' ? 'Bs' : '$';
  const isExpense = tx.type === 'expense';

  return (
    <div className={s.card}>
      <div className={s.cardTop}>
        <div className={s.cardLeft}>
          {editing ? (
            <input className={s.input} value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
              placeholder="Concepto..." />
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
          {isExpense ? '-' : '+'}{symbol}{Math.abs(Number(tx.amount)).toFixed(2)}
        </p>
      </div>

      {editing && (
        <div className={s.editFields}>
          <input className={s.input} value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
            placeholder="Concepto..." />
          <CategoryDropdown
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
          />
          <input className={s.input} value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Nota opcional..." />
        </div>
      )}

      <div className={s.actions}>
        {editing ? (
          <>
            <button className={`${s.btnIcon} ${s.btnCancel}`} onClick={() => setEditing(false)}>
              <X size={14} />
            </button>
            <button className={`${s.btnIcon} ${s.btnSave}`} onClick={save}>
              <Check size={14} />
            </button>
          </>
        ) : (
          <>
            <button className={`${s.btnIcon} ${s.btnDelete}`} onClick={() => onDelete(tx.id)}>
              <Trash2 size={14} />
            </button>
            <button className={`${s.btnIcon} ${s.btnEdit}`} onClick={() => setEditing(true)}>
              <Pencil size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Modal nueva transacción ──────────────────────────────
const NewTxModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    concept: '', amount: '', currency: 'USD',
    type: 'expense', category: 'viveres',
    date: new Date().toISOString().slice(0, 10), note: '',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.concept || !form.amount) return;
    const parent = TX_CATEGORIES.find(c => c.value === form.category)?.parent ?? 'otros';
    await onAdd({ ...form, title: form.concept, parentCategory: parent });
    onClose();
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.modalTitle}>Nueva Transacción</h2>

        <input className={s.inputModal} placeholder="Concepto *"
          value={form.concept} onChange={(e) => set('concept', e.target.value)} />

        <div className={s.gridTwo}>
          <input className={s.inputModal} placeholder="Monto *" type="number"
            value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          <select className={s.inputModal} value={form.currency}
            onChange={(e) => set('currency', e.target.value)}>
            <option value="USD">USD $</option>
            <option value="BOB">BOB Bs</option>
          </select>
        </div>

        <div className={s.gridTwo}>
          <select className={s.inputModal} value={form.type}
            onChange={(e) => set('type', e.target.value)}>
            <option value="expense">💸 Gasto</option>
            <option value="income">💵 Ingreso</option>
            <option value="transfer">↔️ Transferencia</option>
          </select>

          <select className={s.inputModal} value={form.category}
            onChange={(e) => set('category', e.target.value)}>
            {TX_GROUPS.map((g) => (
              <optgroup key={g.value} label={g.label}>
                {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <input className={s.inputModal} type="date"
          value={form.date} onChange={(e) => set('date', e.target.value)} />

        <input className={s.inputModal} placeholder="Nota opcional"
          value={form.note} onChange={(e) => set('note', e.target.value)} />

        <button className={s.btnSubmit} onClick={submit}>Guardar</button>
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────
const Transactions = () => {
  const { transactions, addTransaction, updateTransaction, removeTransaction } = useTransactions();
  const [activeFilter, setActiveFilter] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [showModal, setShowModal]       = useState(false);

  const filtered = transactions.filter((tx) =>
    (activeFilter === null || tx.category === activeFilter) &&
    isInPeriod(tx.date, activePeriod)
  );

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Movimientos</h1>
        <Filter size={20} className={s.filterIcon} />
      </div>

      {/* Chips de período */}
      <PeriodFilter value={activePeriod} onChange={setActivePeriod} />

      {/* Dropdown de categoría */}
      <div className={s.filterRow}>
        <FilterDropdown value={activeFilter} onChange={setActiveFilter} />
        {activeFilter !== null && (
          <button className={s.clearFilter} onClick={() => setActiveFilter(null)}>
            <X size={12} /> Todos
          </button>
        )}
      </div>

      <div className={s.list}>
        {filtered.length === 0 && <p className={s.empty}>Sin movimientos</p>}
        {filtered.map((tx) => (
          <TxRow key={tx.id} tx={tx} onSave={updateTransaction} onDelete={removeTransaction} />
        ))}
      </div>

      {showModal && <NewTxModal onClose={() => setShowModal(false)} onAdd={addTransaction} />}

      <button className={s.fab} onClick={() => setShowModal(true)}>
        <Plus size={26} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Transactions;