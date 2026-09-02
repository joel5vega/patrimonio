// components/transactions/TransactionParts.jsx
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { TX_CATEGORIES, TX_GROUPS } from '../../hooks/useTransactions';
import { formatDateFull, formatTime } from '../../utils/dateUtils';
import s from '../../pages/Transactions.module.css';

export const TYPE_META = {
  expense: {
    label: 'Gasto',
    icon: TrendingDown,
    colorHex: '#f43f5e',
    bgHex: 'rgba(244,63,94,0.12)',
  },
  income: {
    label: 'Ingreso',
    icon: TrendingUp,
    colorHex: '#10b981',
    bgHex: 'rgba(16,185,129,0.12)',
  },
  transfer: {
    label: 'Transferencia',
    icon: ArrowLeftRight,
    colorHex: '#3b82f6',
    bgHex: 'rgba(59,130,246,0.12)',
  },
};

export const categoryMeta = (value) =>
  TX_CATEGORIES.find((category) => category.value === value) || {
    label: value || 'Otro',
    emoji: '📦',
  };

export function PeriodFilter({ value, onChange, periods }) {
  return (
    <div className={s.periodFilter} role="group" aria-label="Período">
      {periods.map((period) => (
        <button
          key={period.label}
          type="button"
          className={`${s.periodBtn} ${value === period.value ? s.periodBtnActive : ''}`}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

export function TransactionCard({ tx, onEdit, onDelete, currencySymbol = '$' }) {
  const meta = TYPE_META[tx.type] || TYPE_META.expense;
  const Icon = meta.icon;
  const category = categoryMeta(tx.category);
  const amount = Math.abs(Number(tx.amount || 0));
  const sign = tx.type === 'expense' ? '−' : tx.type === 'income' ? '+' : '';

  return (
    <article className={s.card}>
      <span className={s.cardStripe} style={{ background: meta.colorHex }} />
      <div className={s.cardTop}>
        <span
          className={s.typeIconWrap}
          style={{ background: meta.bgHex, color: meta.colorHex }}
        >
          <Icon size={16} />
        </span>

        <div className={s.cardInfo}>
          <div className={s.concept}>{tx.concept || tx.title || 'Sin concepto'}</div>
          <div className={s.meta}>
            <span className={s.badge}>{category.emoji} {category.label}</span>
            <span className={s.date}>{formatDateFull(tx.date || tx.createdAt)}</span>
            {formatTime(tx.createdAt) && (
              <span className={s.time}>{formatTime(tx.createdAt)}</span>
            )}
          </div>
          {tx.note && <div className={s.note}>{tx.note}</div>}
        </div>
      </div>

      <div className={s.cardRight}>
        <div className={s.amount} style={{ color: meta.colorHex }}>
          {sign} {currencySymbol} {amount.toLocaleString('es-BO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={s.actions}>
          <button type="button" className={`${s.btnIcon} ${s.btnEdit}`} onClick={() => onEdit(tx)} aria-label="Editar">
            <Pencil size={14} />
          </button>
          <button type="button" className={`${s.btnIcon} ${s.btnDelete}`} onClick={() => onDelete(tx)} aria-label="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function CategoryDropdown({ value, onChange }) {
  const selected = categoryMeta(value);

  return (
    <div className={s.dropdown}>
      <button type="button" className={s.dropdownTrigger}>
        <span>{selected.emoji} {selected.label}</span>
        <ChevronDown size={15} className={s.dropdownArrow} />
      </button>
      <div className={s.dropdownMenu}>
        {TX_GROUPS.map((group) => {
          const categories = TX_CATEGORIES.filter((item) => item.parent === group.value);
          if (!categories.length) return null;

          return (
            <div key={group.value}>
              <div className={s.dropdownGroup}>{group.label}</div>
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={`${s.dropdownItem} ${value === category.value ? s.dropdownItemActive : ''}`}
                  onClick={() => onChange(category.value)}
                >
                  {category.emoji} {category.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TransactionForm({ form, setForm, editing, onSubmit, onCancel, saving }) {
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.typeTabs}>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <button
            key={type}
            type="button"
            className={`${s.typeTab} ${form.type === type ? s.typeTabActive : ''}`}
            onClick={() => update('type', type)}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <label className={s.labelModal}>
        Fecha
        <input
          className={s.inputModal}
          type="date"
          value={form.date || ''}
          onChange={(event) => update('date', event.target.value)}
          required
        />
      </label>

      <label className={s.labelModal}>
        Monto
        <input
          className={s.inputModal}
          type="number"
          min="0"
          step="0.01"
          value={form.amount || ''}
          onChange={(event) => update('amount', event.target.value)}
          required
        />
      </label>

      <label className={s.labelModal}>
        Concepto
        <input
          className={s.inputModal}
          type="text"
          value={form.concept || ''}
          onChange={(event) => update('concept', event.target.value)}
          required
        />
      </label>

      <label className={s.labelModal}>
        Categoría
        <CategoryDropdown value={form.category} onChange={(value) => update('category', value)} />
      </label>

      <label className={s.labelModal}>
        Nota <span className={s.labelOptional}>(opcional)</span>
        <textarea
          className={`${s.inputModal} ${s.textarea}`}
          value={form.note || ''}
          onChange={(event) => update('note', event.target.value)}
          rows="3"
        />
      </label>

      <div className={s.formActions}>
        <button type="button" className={`${s.btnIcon} ${s.btnCancel}`} onClick={onCancel}>
          <X size={16} /> Cancelar
        </button>
        <button type="submit" className={s.btnSubmit} disabled={saving}>
          {editing ? <Check size={16} /> : null}
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  );
}