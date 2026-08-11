// pages/Transactions.jsx
import { useState, useMemo, useEffect } from 'react';
import { Filter, Plus, Pencil, Trash2, X, Search, TrendingUp, TrendingDown, ArrowLeftRight, Check } from 'lucide-react';
import { useTransactions, TX_CATEGORIES, TX_GROUPS } from '../hooks/useTransactions';
import { isInPeriod } from '../utils/filterByPeriod';
import s from './Transactions.module.css';

// ── Fecha local (fix UTC offset) ──────────────────────────
const todayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// ── Helpers de fecha ──────────────────────────────────────
const toJsDate = (createdAt, dateStr) => {
  if (createdAt?.toDate) return createdAt.toDate();
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
};

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatDateFull = (createdAt, dateStr) => {
  const d = toJsDate(createdAt, dateStr);
  if (!d) return '—';
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

// ── Meta helpers ──────────────────────────────────────────
const categoryMeta = (value) =>
  TX_CATEGORIES.find((c) => c.value === value) ?? { label: value, emoji: '📦', color: '' };

const TYPE_META = {
  expense:  { label: 'Gasto',         icon: TrendingDown,   colorHex: '#f43f5e', bgHex: 'rgba(244,63,94,0.12)'   },
  income:   { label: 'Ingreso',       icon: TrendingUp,     colorHex: '#10b981', bgHex: 'rgba(16,185,129,0.12)'  },
  transfer: { label: 'Transferencia', icon: ArrowLeftRight, colorHex: '#3b82f6', bgHex: 'rgba(59,130,246,0.12)'  },
};

// Grupos de gasto (excluye ingresos)
const INCOME_GROUPS   = ['ingresos'];
const EXPENSE_GROUPS = TX_GROUPS
  .map((g) => g.value)
  .filter((gValue) => !INCOME_GROUPS.includes(gValue));


// Categoría por defecto según tipo
const DEFAULT_CAT = { expense: 'viveres', income: 'salario', transfer: 'other' };

// ── Períodos ──────────────────────────────────────────────
const PERIODS = [
  { label: 'Todo',      value: null      },
  { label: 'Semana',    value: 'week'    },
  { label: 'Mes',       value: 'month'   },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Año',       value: 'year'    },
];

const PeriodFilter = ({ value, onChange }) => (
  <div className={s.periodFilter}>
    {PERIODS.map((p) => (
      <button key={p.label} type="button"
        className={`${s.periodBtn} ${value === p.value ? s.periodBtnActive : ''}`}
        onClick={() => onChange(p.value)}>
        {p.label}
      </button>
    ))}
  </div>
);

// ── CategoryDropdown ──────────────────────────────────────
const CategoryDropdown = ({ value, onChange, filterGroups }) => {
  const [open, setOpen] = useState(false);
  const selected        = TX_CATEGORIES.find((c) => c.value === value);
  const handleSelect    = (val) => { onChange(val); setOpen(false); };

  const visibleGroups = filterGroups
    ? TX_GROUPS.filter(g => filterGroups.includes(g.value))
    : TX_GROUPS;

  return (
    <>
      <button type="button" className={s.dropdownTrigger} onClick={() => setOpen(true)}>
        <span>{selected ? `${selected.emoji} ${selected.label}` : 'Categoría'}</span>
        <span className={s.dropdownArrow}>▾</span>
      </button>

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
              {visibleGroups.map((g) => (
                <div key={g.value} className={s.fsGroupBlock}>
                  <p className={s.fsGroupLabel}>{g.label}</p>
                  {TX_CATEGORIES.filter((c) => c.parent === g.value).map((c) => (
                    <button key={c.value} type="button"
                      className={`${s.fsItem} ${c.value === value ? s.fsItemActive : ''}`}
                      onClick={() => handleSelect(c.value)}>
                      <span className={s.fsItemEmoji}>{c.emoji}</span>
                      <span className={s.fsItemLabel}>{c.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── FilterDropdown (filtro de lista) ─────────────────────
const FilterDropdown = ({ value, onChange, open, setOpen }) => {
  const selected     = TX_CATEGORIES.find((c) => c.value === value);
  const handleSelect = (val) => { onChange(val); setOpen(false); };

  return (
    <div className={s.dropdown} style={{ flex: 1 }}>
      <button type="button" className={s.dropdownTrigger} onClick={() => setOpen((o) => !o)}>
        <span>{selected ? `${selected.emoji} ${selected.label}` : '🗂 Todas las categorías'}</span>
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

// ── TxFormFields (compartido New + Edit) ──────────────────
const TxFormFields = ({ form, set }) => {
  const handleTypeChange = (newType) => {
    set('type', newType);
    set('category', DEFAULT_CAT[newType] || 'other');
  };

  return (
    <div className={s.fsBody}>
      {/* Tipo — tabs visuales mejorados */}
      <div className={s.typeTabs}>
        {Object.entries(TYPE_META).map(([key, meta]) => {
          const Icon   = meta.icon;
          const active = form.type === key;
          return (
            <button key={key} type="button"
              onClick={() => handleTypeChange(key)}
              className={s.typeTab}
              style={active ? {
                background:   meta.bgHex,
                borderColor:  meta.colorHex + '66',
                color:        meta.colorHex,
                boxShadow:    `0 0 12px ${meta.colorHex}22`,
              } : {}}>
              <Icon size={14} strokeWidth={2.5} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Concepto */}
      <label className={s.labelModal}>Concepto *</label>
      <input className={s.inputModal}
        placeholder="Ej: Supermercado, salario mayo..."
        value={form.concept}
        onChange={(e) => set('concept', e.target.value)}
      />

      {/* Monto + Moneda */}
      <div className={s.gridTwo}>
        <div>
          <label className={s.labelModal}>Monto *</label>
          <input className={s.inputModal}
            placeholder="0.00" type="number" inputMode="decimal"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        </div>
        <div>
          <label className={s.labelModal}>Moneda</label>
          <select className={s.inputModal} value={form.currency}
            onChange={(e) => set('currency', e.target.value)}>
            <option value="BOB">BOB Bs</option>
            <option value="USD">USD $</option>
          </select>
        </div>
      </div>

      {/* Categoría — filtrada por tipo */}
      {form.type !== 'transfer' && (
        <>
          <label className={s.labelModal}>Categoría</label>
          <CategoryDropdown
            value={form.category}
            onChange={(val) => set('category', val)}
            filterGroups={form.type === 'income' ? INCOME_GROUPS : EXPENSE_GROUPS}
          />
        </>
      )}

      {/* Fecha */}
      <label className={s.labelModal}>Fecha</label>
      <input className={`${s.inputModal} [color-scheme:dark]`}
        type="date"
        value={form.date}
        max={todayLocal()}
        onChange={(e) => set('date', e.target.value)}
      />

      {/* Destinatario / Origen */}
      <label className={s.labelModal}>
        {form.type === 'income' ? 'Origen' : 'Destinatario'}
        <span className={s.labelOptional}> (opcional)</span>
      </label>
      <input className={s.inputModal}
        placeholder={form.type === 'income' ? 'Ej: Empresa S.R.L.' : 'Ej: CONDORI TICONA JHON'}
        value={form.targetOwner}
        onChange={(e) => set('targetOwner', e.target.value)}
      />

      {/* Nota */}
      <label className={s.labelModal}>
        Nota <span className={s.labelOptional}>(opcional)</span>
      </label>
      <input className={s.inputModal}
        placeholder="Detalle adicional..."
        value={form.note ?? ''}
        onChange={(e) => set('note', e.target.value)}
      />
    </div>
  );
};

// ── Modal nueva transacción (Optimizado) ──────────────────
const NewTxModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    concept: '',
    amount: '',
    currency: 'BOB',
    type: 'expense',
    category: DEFAULT_CAT.expense,
    date: todayLocal(),
    targetOwner: '',
    note: '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isValid = form.concept.trim() !== '' && Number(form.amount) > 0;

  // Mantener categoría válida si cambia el tipo
  useEffect(() => {
    if (form.type === 'transfer') {
      set('category', 'other');
    } else {
      const validGroups = form.type === 'income' ? INCOME_GROUPS : EXPENSE_GROUPS;
      const currentCat = TX_CATEGORIES.find((c) => c.value === form.category);
      if (!currentCat || !validGroups.includes(currentCat.parent)) {
        set('category', DEFAULT_CAT[form.type] || 'other');
      }
    }
  }, [form.type]);

  const submit = async () => {
    if (!isValid) return;

    const parent = form.type === 'transfer' 
      ? 'transfer' 
      : (TX_CATEGORIES.find((c) => c.value === form.category)?.parent ?? 'otros');

    await onAdd({
      concept: form.concept.trim(),
      title: form.concept.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      type: form.type,
      category: form.type === 'transfer' ? 'other' : form.category,
      parentCategory: parent,
      date: form.date,
      createdAt: new Date(),
      targetOwner: form.targetOwner.trim(),
      note: form.note.trim(),
    });

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
        <TxFormFields form={form} set={set} />
        <div className={s.fsFooter}>
          <button className={s.btnSubmit} onClick={submit} disabled={!isValid}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal editar transacción ──────────────────────────────
const EditTxModal = ({ tx, onClose, onSave }) => {
  const [form, setForm] = useState({
    concept:     tx.concept || tx.title || '',
    amount:      String(tx.amount ?? ''),
    currency:    tx.currency    || 'BOB',
    type:        tx.type        || 'expense',
    category:    tx.category    || 'other',
    date:        toDateInputValue(tx.createdAt, tx.date),
    targetOwner: tx.targetOwner || '',
    note:        tx.note        || '',
  });
  const set     = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isValid = form.concept.trim() !== '' && Number(form.amount) > 0;

  const submit = async () => {
    if (!isValid) return;
    const parent = form.type === 'transfer' 
      ? 'transfer' 
      : (TX_CATEGORIES.find((c) => c.value === form.category)?.parent ?? 'otros');

    await onSave(tx.id, {
      ...form,
      concept: form.concept.trim(),
      title:   form.concept.trim(),
      amount:  Number(form.amount),
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
        <TxFormFields form={form} set={set} />
        <div className={s.fsFooter}>
          <button className={s.btnSubmit} onClick={submit} disabled={!isValid}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// ── TxRow ─────────────────────────────────────────────────
const TxRow = ({ tx, onSave, onDelete }) => {
  const [editOpen,   setEditOpen]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const meta     = categoryMeta(tx.category);
  const typeMeta = TYPE_META[tx.type] || TYPE_META.expense;
  const Icon     = typeMeta.icon;
  const symbol   = tx.currency === 'BOB' ? 'Bs' : '$';
  const timeStr  = formatTime(tx.createdAt);
  const dateStr  = formatDateFull(tx.createdAt, tx.date);
  const isExp    = tx.type === 'expense';
  const isInc    = tx.type === 'income';

  return (
    <>
      <div className={s.card}>
        <div className={s.cardStripe} style={{ background: typeMeta.colorHex }} />

        <div className={s.cardTop}>
          <div className={s.typeIconWrap} style={{ background: typeMeta.bgHex }}>
            <Icon size={14} style={{ color: typeMeta.colorHex }} />
          </div>

          <div className={s.cardInfo}>
            <p className={s.concept}>{tx.concept || tx.title || '—'}</p>
            <div className={s.meta}>
              <span className={s.badge}>{meta.emoji} {meta.label}</span>
              {tx.targetOwner && (
                <span className={s.targetOwner}>
                  {isInc ? '← ' : '→ '}{tx.targetOwner}
                </span>
              )}
              <span className={s.date}>
                {dateStr}
                {timeStr && <span className={s.time}> · {timeStr}</span>}
              </span>
            </div>
            {tx.note && <p className={s.note}>📝 {tx.note}</p>}
          </div>

          <div className={s.cardRight}>
            <p className={s.amount} style={{ color: typeMeta.colorHex }}>
              {isExp ? '−' : isInc ? '+' : ''}
              {symbol} {Math.abs(Number(tx.amount)).toLocaleString('es-BO', {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
              })}
            </p>

            <div className={s.actions}>
              {confirmDel ? (
                <>
                  <button className={`${s.btnIcon} ${s.btnDelete}`}
                    title="Confirmar eliminación"
                    onClick={() => onDelete(tx.id)}>
                    <Check size={14} />
                  </button>
                  <button className={s.btnIcon} title="Cancelar"
                    onClick={() => setConfirmDel(false)}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button className={`${s.btnIcon} ${s.btnDelete}`}
                    title="Eliminar"
                    onClick={() => setConfirmDel(true)}>
                    <Trash2 size={14} />
                  </button>
                  <button className={`${s.btnIcon} ${s.btnEdit}`}
                    title="Editar"
                    onClick={() => setEditOpen(true)}>
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditTxModal tx={tx} onClose={() => setEditOpen(false)} onSave={onSave} />
      )}
    </>
  );
};

// ── Página principal ──────────────────────────────────────
const Transactions = () => {
  const { transactions, addTransaction, updateTransaction, removeTransaction } = useTransactions();

  const [activeFilter, setActiveFilter] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [typeFilter,   setTypeFilter]   = useState(null);

  // Ordenar por fecha desc
  const sorted = useMemo(() =>
    [...transactions].sort((a, b) => {
      const aD = toJsDate(a.createdAt, a.date) ?? new Date(0);
      const bD = toJsDate(b.createdAt, b.date) ?? new Date(0);
      return bD - aD;
    }), [transactions]);

  // Filtrar
  const filtered = useMemo(() => sorted.filter((tx) => {
    if (activeFilter !== null && tx.category !== activeFilter) return false;
    if (typeFilter   !== null && tx.type     !== typeFilter)   return false;
    if (!isInPeriod(tx.date, activePeriod))                    return false;
    const term = search.trim().toLowerCase();
    if (term && !(tx.concept || tx.title || '').toLowerCase().includes(term)
             && !(tx.note    || '').toLowerCase().includes(term))           return false;
    return true;
  }), [sorted, activeFilter, typeFilter, activePeriod, search]);

  // Totales del filtrado
  const totals = useMemo(() => ({
    exp: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0),
    inc: filtered.filter(t => t.type === 'income').reduce((s,  t) => s + Number(t.amount || 0), 0),
    count: filtered.length,
  }), [filtered]);

  const hasActiveFilters = activeFilter !== null || typeFilter !== null || search.trim() || activePeriod !== null;

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>Movimientos</h1>
        <button type="button" className={s.filterButton}
          onClick={() => setFilterOpen((o) => !o)}>
          <Filter size={18} />
          {hasActiveFilters && <span className={s.filterDot} />}
        </button>
      </div>

      {/* Período */}
      <PeriodFilter value={activePeriod} onChange={setActivePeriod} />

      {/* Mini resumen del filtrado */}
      <div className={s.summaryRow}>
        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Gastos</span>
          <span className={s.summaryExpense}>
            Bs {totals.exp.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Ingresos</span>
          <span className={s.summaryIncome}>
            Bs {totals.inc.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className={s.summaryChip}>
          <span className={s.summaryLabel}>Movimientos</span>
          <span className={s.summaryCount}>{totals.count}</span>
        </div>
      </div>

      {/* Filtro por tipo */}
      <div className={s.typeFilterRow}>
        {[
          { key: null,       label: 'Todos'   },
          { key: 'expense',  label: '💸 Gastos'  },
          { key: 'income',   label: '💵 Ingresos' },
          { key: 'transfer', label: '↔️ Transf.'  },
        ].map(({ key, label }) => (
          <button key={String(key)} type="button"
            onClick={() => setTypeFilter(key)}
            className={`${s.typeFilterBtn} ${typeFilter === key ? s.typeFilterBtnActive : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className={s.searchRow}>
        <div className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} />
          <input className={s.searchInput}
            placeholder="Buscar concepto o nota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={s.searchClear} onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className={s.filterRow}>
        <FilterDropdown
          value={activeFilter} onChange={setActiveFilter}
          open={filterOpen} setOpen={setFilterOpen}
        />
        {activeFilter !== null && (
          <button className={s.clearFilter} onClick={() => setActiveFilter(null)}>
            <X size={12} /> Todos
          </button>
        )}
      </div>

      {/* Lista */}
      <div className={s.list}>
        {filtered.length === 0 ? (
          <div className={s.emptyState}>
            <p className={s.emptyIcon}>🔍</p>
            <p className={s.empty}>Sin movimientos</p>
            {hasActiveFilters && (
              <button className={s.clearAllFilters} onClick={() => {
                setActiveFilter(null);
                setTypeFilter(null);
                setSearch('');
                setActivePeriod(null);
              }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filtered.map((tx) => (
            <TxRow key={tx.id} tx={tx} onSave={updateTransaction} onDelete={removeTransaction} />
          ))
        )}
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