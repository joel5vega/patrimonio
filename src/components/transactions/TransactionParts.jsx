import {
  ArrowLeftRight,
  ChevronDown,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { TX_CATEGORIES, TX_GROUPS } from '../../hooks/useTransactions';
import { formatDateFull, formatTime } from '../../utils/dateUtils';
import s from '../../pages/Transactions.module.css';

export const TYPE_META = {
  expense: {
    label: 'Gasto',
    icon: TrendingDown,
    colorHex: '#fb7185',
    bgHex: 'rgba(251, 113, 133, 0.14)',
  },
  income: {
    label: 'Ingreso',
    icon: TrendingUp,
    colorHex: '#34d399',
    bgHex: 'rgba(52, 211, 153, 0.14)',
  },
  transfer: {
    label: 'Transferencia',
    icon: ArrowLeftRight,
    colorHex: '#60a5fa',
    bgHex: 'rgba(96, 165, 250, 0.14)',
  },
};

export const categoryMeta = (value) =>
  TX_CATEGORIES.find((category) => category.value === value) || {
    label: value || 'Otro',
    emoji: '📦',
    parent: 'otros',
  };

export function PeriodFilter({ value, onChange, periods }) {
  return (
    <div className={s.periodFilter} role="group" aria-label="Período">
      {periods.map((period) => (
        <button
          key={period.label}
          type="button"
          className={`${s.periodBtn} ${
            value === period.value ? s.periodBtnActive : ''
          }`}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

export function CategoryFilter({ value, onChange }) {
  return (
    <label className={s.categoryFilter}>
      <span className={s.srOnly}>Filtrar por categoría</span>
      <select
        className={s.categorySelect}
        value={value || ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Todas las categorías</option>

        {TX_GROUPS.map((group) => {
          const categories = TX_CATEGORIES.filter(
            (category) => category.parent === group.value
          );

          return (
            <optgroup key={group.value} label={group.label}>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.emoji} {category.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      <ChevronDown size={15} className={s.categorySelectIcon} />
    </label>
  );
}

export function TransactionCard({ tx, onEdit, onDelete }) {
  const meta = TYPE_META[tx.type] || TYPE_META.expense;
  const Icon = meta.icon;
  const category = categoryMeta(tx.category);
  const amount = Math.abs(Number(tx.amount || 0));
  const currency = tx.currency || 'USD';

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
            <span className={s.badge}>
              {category.emoji} {category.label}
            </span>
            <span className={s.date}>{formatDateFull(tx.date || tx.createdAt)}</span>
          </div>

          {tx.note ? <div className={s.note}>{tx.note}</div> : null}
        </div>
      </div>

      <div className={s.cardRight}>
        <div className={s.amount} style={{ color: meta.colorHex }}>
          {currency}{' '}
          {amount.toLocaleString('es-BO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>

        <div className={s.actions}>
          <button
            type="button"
            className={`${s.btnIcon} ${s.btnEdit}`}
            onClick={() => onEdit(tx)}
            aria-label="Editar movimiento"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            className={`${s.btnIcon} ${s.btnDelete}`}
            onClick={() => onDelete(tx)}
            aria-label="Eliminar movimiento"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}