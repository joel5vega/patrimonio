// components/transactions/TransactionsModal.jsx
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { TX_CATEGORIES, TX_GROUPS } from '../../hooks/useTransactions';
import s from '../../pages/Transactions.module.css';

export function CategoryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = TX_CATEGORIES.find((item) => item.value === value) || {
    label: 'Seleccionar categoría',
    emoji: '📦',
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className={s.dropdown}>
      <button
        type="button"
        className={s.dropdownTrigger}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{selected.emoji} {selected.label}</span>
        <ChevronDown
          size={16}
          className={`${s.dropdownArrow} ${open ? s.dropdownArrowOpen : ''}`}
        />
      </button>

      {open && (
        <div className={s.dropdownMenu} role="listbox">
          {TX_GROUPS.map((group) => {
            const categories = TX_CATEGORIES.filter(
              (item) => item.parent === group.value
            );

            if (!categories.length) return null;

            return (
              <div key={group.value} className={s.dropdownGroupBlock}>
                <div className={s.dropdownGroup}>{group.label}</div>
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    role="option"
                    aria-selected={value === category.value}
                    className={`${s.dropdownItem} ${value === category.value ? s.dropdownItemActive : ''}`}
                    onClick={() => {
                      onChange(category.value);
                      setOpen(false);
                    }}
                  >
                    {category.emoji} {category.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TransactionForm({
  form,
  setForm,
  typeMeta,
  editing,
  onSubmit,
  onCancel,
  saving,
}) {
  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.typeTabs} role="tablist">
        {Object.entries(typeMeta).map(([type, meta]) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={form.type === type}
            className={`${s.typeTab} ${form.type === type ? s.typeTabActive : ''}`}
            onClick={() => update('type', type)}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.labelModal}>Fecha</span>
          <input
            className={s.inputModal}
            type="date"
            value={form.date || ''}
            onChange={(event) => update('date', event.target.value)}
            required
          />
        </label>

        <label className={s.field}>
          <span className={s.labelModal}>Monto</span>
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
      </div>

      <label className={s.field}>
        <span className={s.labelModal}>Concepto</span>
        <input
          className={s.inputModal}
          type="text"
          value={form.concept || ''}
          onChange={(event) => update('concept', event.target.value)}
          required
        />
      </label>

      <label className={s.field}>
        <span className={s.labelModal}>Categoría</span>
        <CategoryDropdown
          value={form.category}
          onChange={(value) => update('category', value)}
        />
      </label>

      <label className={s.field}>
        <span className={s.labelModal}>
          Nota <small className={s.labelOptional}>(opcional)</small>
        </span>
        <textarea
          className={`${s.inputModal} ${s.textarea}`}
          value={form.note || ''}
          onChange={(event) => update('note', event.target.value)}
          rows={3}
        />
      </label>

      <div className={s.formActions}>
        <button type="button" className={s.cancelButton} onClick={onCancel} disabled={saving}>
          <X size={16} /> Cancelar
        </button>
        <button type="submit" className={s.btnSubmit} disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  );
}