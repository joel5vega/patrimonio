import { useState } from 'react';
import { X } from 'lucide-react';
import { TX_CATEGORIES, TX_GROUPS } from '../../hooks/useTransactions';
import s from '../../pages/Transactions.module.css';

export function TransactionForm({
  form,
  setForm,
  typeMeta,
  editing,
  onSubmit,
  onCancel,
  saving,
}) {
  const [showNote, setShowNote] = useState(Boolean(form.note));

  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.typeTabs} role="tablist" aria-label="Tipo de movimiento">
        {Object.entries(typeMeta).map(([type, meta]) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={form.type === type}
            className={`${s.typeTab} ${
              form.type === type ? s.typeTabActive : ''
            }`}
            onClick={() => update('type', type)}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.labelModal}>Monto</span>
          <input
            className={s.inputModal}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => update('amount', event.target.value)}
            placeholder="0.00"
            required
            autoFocus
          />
        </label>

        <label className={s.field}>
          <span className={s.labelModal}>Moneda</span>
          <select
            className={s.inputModal}
            value={form.currency}
            onChange={(event) => update('currency', event.target.value)}
          >
            <option value="BOB">BOB</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>

      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.labelModal}>Fecha</span>
          <input
            className={s.inputModal}
            type="date"
            value={form.date}
            onChange={(event) => update('date', event.target.value)}
            required
          />
        </label>

        <label className={s.field}>
          <span className={s.labelModal}>Categoría</span>
          <select
            className={s.inputModal}
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            required
          >
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
        </label>
      </div>

      <label className={s.field}>
        <span className={s.labelModal}>Concepto</span>
        <input
          className={s.inputModal}
          type="text"
          value={form.concept}
          onChange={(event) => update('concept', event.target.value)}
          placeholder="Ej. Compras del mercado"
          required
        />
      </label>

      {showNote ? (
        <label className={s.field}>
          <span className={s.labelModal}>Nota</span>
          <textarea
            className={`${s.inputModal} ${s.textarea}`}
            value={form.note}
            onChange={(event) => update('note', event.target.value)}
            placeholder="Detalle opcional"
            rows="2"
          />
        </label>
      ) : (
        <button
          type="button"
          className={s.addNoteButton}
          onClick={() => setShowNote(true)}
        >
          + Añadir nota
        </button>
      )}

      <div className={s.formActions}>
        <button
          type="button"
          className={s.cancelButton}
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} />
          Cancelar
        </button>

        <button type="submit" className={s.btnSubmit} disabled={saving}>
          {saving
            ? 'Guardando…'
            : editing
              ? 'Guardar cambios'
              : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  );
}