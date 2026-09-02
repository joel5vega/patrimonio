// components/manual/ManualAssetModal.jsx
import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function ManualAssetModal({
  editData,
  setEditData,
  onClose,
  onSave,
  bobRate,
  preview,
  saving = false,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const update = (field, value) => {
    setEditData((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="manual-modal-overlay" role="dialog" aria-modal="true" aria-label="Editar activo">
      <section className="manual-modal" onClick={(event) => event.stopPropagation()}>
        <header className="manual-modal__header">
          <div>
            <p className="manual-modal__eyebrow">Editar activo</p>
            <h2 className="manual-modal__title">Actualiza los datos del activo</h2>
          </div>
          <button type="button" className="manual-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <form
          className="manual-modal__body"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <label className="manual-field">
            <span>Nombre del activo</span>
            <input
              value={editData.name || ''}
              onChange={(event) => update('name', event.target.value)}
              required
            />
          </label>

          <div className="manual-field">
            <span>Tipo</span>
            <div className="manual-type-tabs" role="tablist">
              {['manual', 'stock', 'crypto', 'future'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={editData.type === type ? 'is-active' : ''}
                  onClick={() => update('type', type)}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="manual-form-grid">
            <label className="manual-field">
              <span>Saldo</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editData.amount ?? ''}
                onChange={(event) => update('amount', event.target.value)}
                required
              />
            </label>

            <label className="manual-field">
              <span>Moneda</span>
              <select
                value={editData.currency || 'USD'}
                onChange={(event) => update('currency', event.target.value)}
              >
                <option value="USD">USD</option>
                <option value="BOB">BOB</option>
              </select>
            </label>
          </div>

          <div className="manual-preview">
            {preview(editData.amount, editData.currency)}
          </div>

          <label className="manual-field">
            <span>Nota</span>
            <input
              value={editData.note || ''}
              onChange={(event) => update('note', event.target.value)}
            />
          </label>

          <label className="manual-field">
            <span>Fecha de adquisición</span>
            <input
              type="date"
              value={editData.since || ''}
              onChange={(event) => update('since', event.target.value)}
            />
          </label>

          <p className="manual-rate">1 USD = Bs {bobRate}</p>

          <footer className="manual-modal__footer">
            <button type="button" className="manual-button manual-button--secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="manual-button manual-button--primary" disabled={saving}>
              <Check size={16} />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}