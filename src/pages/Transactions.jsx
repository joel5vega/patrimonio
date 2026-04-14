// pages/Transactions.jsx
import { useState } from 'react';
import { Filter, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useTransactions, TX_CATEGORIES, TX_GROUPS } from '../hooks/useTransactions';
import { isInPeriod } from '../utils/filterByPeriod';
import s from './Transactions.module.css';

// ─── Helpers de fecha/hora ────────────────────────────────
const toJsDate = (createdAt, dateStr) => {
  // Prioriza createdAt (Firestore Timestamp) por tener hora exacta
  if (createdAt?.toDate) return createdAt.toDate();
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d)) return d;
  }
  // Fallback: parsear dateStr como local (evita offset UTC)
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatDateFull = (createdAt, dateStr) => {
  const d = toJsDate(createdAt, dateStr);
  if (!d) return '—';
  const day = DAYS[d.getDay()];
  const month = MONTHS[d.getMonth()];
  return `${day} ${d.getDate()} ${month} ${d.getFullYear()}`;
};

const formatTime = (createdAt) => {
  if (!createdAt) return null;
  const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const toDateInputValue = (createdAt, dateStr) => {
  const d = toJsDate(createdAt, dateStr);
  if (!d) return dateStr ?? '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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

// ─── Dropdown de categorías (full‑screen picker) ──────────
const CategoryDropdown = ({ value, onChange, grouped = false }) => {
  const [open, setOpen] = useState(false);
  const selected = TX_CATEGORIES.find((c) => c.value === value);

  const handleSelect = (val) => { onChange(val); setOpen(false); };

  return (
    <>
      <div className={s.dropdown}>
        <button type="button" className={s.dropdownTrigger} onClick={() => setOpen(true)}>
          <span>{selected ? `${selected.emoji ?? ''} ${selected.label}` : 'Categoría'}</span>
          <span className={s.dropdownArrow}>▾</span>
        </button>
      </div>

      {open && (
        <div className={s.fsOverlay} onClick={() => setOpen(false)}>
          <div className={s.fsSheet} onClick={(e) => e.stopPropagation()}>
            <div className={s.fsHeader}>
              <h2 className={s.fsTitle}>Elegir categoría</h2>
              <button type="button" className={s.btnClose} onClick={() => setOpen(false)}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className={s.fsBody}>
              {grouped ? (
                TX_GROUPS.map((g) => (
                  <div key={g.value} className={s.fsGroupBlock}>
                    <p className={s.fsGroupLabel}>{g.label}</p>
                    {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`${s.fsItem} ${c.value === value ? s.fsItemActive : ''}`}
                        onClick={() => handleSelect(c.value)}
                      >
                        <span className={s.fsItemEmoji}>{c.emoji}</span>
                        <span className={s.fsItemLabel}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                TX_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`${s.fsItem} ${c.value === value ? s.fsItemActive : ''}`}
                    onClick={() => handleSelect(c.value)}
                  >
                    <span className={s.fsItemEmoji}>{c.emoji}</span>
                    <span className={s.fsItemLabel}>{c.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Dropdown filtro por categoría ───────────────────────
const FilterDropdown = ({ value, onChange, open, setOpen }) => {
  const selected = TX_CATEGORIES.find((c) => c.value === value);
  const handleSelect = (val) => { onChange(val); setOpen(false); };

  return (
    <div className={s.dropdown} style={{ flex: 1 }}>
      <button type="button" className={s.dropdownTrigger} onClick={() => setOpen((o) => !o)}>
        <span>{selected ? `${selected.emoji ?? ''} ${selected.label}` : '🗂 Todas las categorías'}</span>
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

// ─── Modal de edición completa ────────────────────────────
const EditTxModal = ({ tx, onClose, onSave }) => {
  const [form, setForm] = useState({
    concept:  tx.concept || tx.title || '',
    amount:   String(tx.amount ?? ''),
    currency: tx.currency || 'BOB',
    type:     tx.type || 'expense',
    category: tx.category || 'other',
    date:     toDateInputValue(tx.createdAt, tx.date),
    targetOwner: tx.targetOwner || '', 
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const isValid = form.concept.trim() && Number(form.amount) > 0;

  const submit = async () => {
    if (!isValid) return;
    const parent = TX_CATEGORIES.find((c) => c.value === form.category)?.parent ?? 'otros';
    await onSave(tx.id, {
      ...form,
      amount: Number(form.amount),
      title: form.concept,
      parentCategory: parent,
    });
    onClose();
  };

  return (
    <div className={s.fsOverlay} onClick={onClose}>
      <div className={s.fsSheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.fsHeader}>
          <h2 className={s.fsTitle}>Editar Transacción</h2>
          <button type="button" className={s.btnClose} onClick={onClose}>
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

          <label className={s.labelModal}>Destinatario</label>
<input
  className={s.inputModal}
  placeholder="Nombre del destinatario..."
  value={form.targetOwner}
  onChange={(e) => set('targetOwner', e.target.value)}
/>
        </div>

        <div className={s.fsFooter}>
          <button className={s.btnSubmit} onClick={submit} disabled={!isValid}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Fila de transacción ──────────────────────────────────
const TxRow = ({ tx, onSave, onDelete }) => {
  const [editOpen, setEditOpen] = useState(false);

  const meta      = categoryMeta(tx.category);
  const symbol    = tx.currency === 'BOB' ? 'Bs' : '$';
  const isExpense = tx.type === 'expense';
  const timeStr   = formatTime(tx.createdAt);
  const dateStr   = formatDateFull(tx.createdAt, tx.date);

  return (
    <>
      <div className={s.card}>
        <div className={s.cardTop}>
          <div className={s.cardLeft}>
            <div>
              <p className={s.concept}>{tx.concept || tx.title || '—'}</p>
              <div className={s.meta}>
                <span className={`${s.badge} ${meta.color}`}>
                  {meta.emoji ?? ''} {meta.label}
                </span>
                <span className={s.date}>
                  {dateStr}
                  {timeStr && <span className={s.time}> · {timeStr}</span>}
                </span>
              </div>
            </div>
          </div>

          <p className={isExpense ? s.amountExpense : s.amountIncome}>
            {isExpense ? '-' : '+'}
            {symbol}
            {Math.abs(Number(tx.amount)).toFixed(2)}
          </p>
        </div>

        <div className={s.actions}>
          <button className={`${s.btnIcon} ${s.btnDelete}`} onClick={() => onDelete(tx.id)}>
            <Trash2 size={14} />
          </button>
          <button className={`${s.btnIcon} ${s.btnEdit}`} onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {editOpen && (
        <EditTxModal
          tx={tx}
          onClose={() => setEditOpen(false)}
          onSave={onSave}
        />
      )}
    </>
  );
};

// ─── Modal nueva transacción ──────────────────────────────
const NewTxModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    concept: '',
    amount: '',
    currency: 'BOB',
    type: 'expense',
    category: 'viveres',
    date: new Date().toISOString().slice(0, 10),
  targetOwner: '',  
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const isValid = form.concept.trim() && Number(form.amount) > 0;

  const submit = async () => {
    if (!isValid) return;
    const parent = TX_CATEGORIES.find((c) => c.value === form.category)?.parent ?? 'otros';
    await onAdd({ ...form, amount: Number(form.amount), title: form.concept, parentCategory: parent });
    onClose();
  };

  return (
    <div className={s.fsOverlay} onClick={onClose}>
      <div className={s.fsSheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.fsHeader}>
          <h2 className={s.fsTitle}>Nueva Transacción</h2>
          <button type="button" className={s.btnClose} onClick={onClose}>
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

       <label className={s.labelModal}>Destinatario</label>
<input
  className={s.inputModal}
  placeholder="Ej: CONDORI TICONA JHON ZACARIAS"
  value={form.targetOwner}
  onChange={(e) => set('targetOwner', e.target.value)}
/>
        </div>

        <div className={s.fsFooter}>
          <button className={s.btnSubmit} onClick={submit} disabled={!isValid}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
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

  // Ordenar por createdAt DESC (hora exacta), fallback a date string
  const sorted = [...transactions].sort((a, b) => {
    const aDate = toJsDate(a.createdAt, a.date) ?? new Date(0);
    const bDate = toJsDate(b.createdAt, b.date) ?? new Date(0);
    return bDate - aDate;
  });

  const filtered = sorted.filter((tx) => {
    const matchesCategory = activeFilter === null || tx.category === activeFilter;
    const matchesPeriod   = isInPeriod(tx.date, activePeriod);
    const term            = search.trim().toLowerCase();
    const matchesSearch   =
      !term ||
      (tx.concept || tx.title || '').toLowerCase().includes(term) ||
      (tx.note || '').toLowerCase().includes(term);
    return matchesCategory && matchesPeriod && matchesSearch;
  });

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
          <button className={s.clearFilter} onClick={() => setActiveFilter(null)}>
            <X size={12} /> Todos
          </button>
        )}
      </div>

      <div className={s.list}>
        {filtered.length === 0 && <p className={s.empty}>Sin movimientos</p>}
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