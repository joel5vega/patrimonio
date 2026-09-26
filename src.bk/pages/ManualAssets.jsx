import {useMemo, useRef, useState} from 'react';
import {
  BarChart2,
  Bitcoin,
  Check,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import Papa from 'papaparse';
import {useApp} from '../context/AppContext';
import {useQuantfury} from '../hooks/useQuantfury';
import './ManualAssets.css';

const getTodayLocal = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const TYPE_CONFIG = {
  stock: {
    label: 'Acciones / ETFs',
    short: 'STOCK',
    color: '#7dd3fc',
    icon: TrendingUp,
  },
  crypto: {
    label: 'Criptomonedas',
    short: 'CRYPTO',
    color: '#fcd34d',
    icon: Bitcoin,
  },
  future: {
    label: 'Futuros',
    short: 'FUTURO',
    color: '#c4b5fd',
    icon: BarChart2,
  },
  manual: {
    label: 'Manual',
    short: 'MANUAL',
    color: '#cbd5e1',
    icon: Wallet,
  },
};

const TRADING_TYPES = ['stock', 'crypto', 'future'];
const TYPE_ORDER = ['stock', 'crypto', 'future'];
const CURRENCIES = ['USD', 'BOB'];

const EMPTY_ASSET = () => ({
  name: '',
  type: 'manual',
  currency: 'USD',
  amount: '',
  note: '',
  since: getTodayLocal(),
});

const normalizeCurrency = (value) => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (normalized === 'USD' || normalized === '$') {
    return 'USD';
  }

  if (
    ['BOB', 'BS', 'BOLIVIANO', 'BOLIVIANOS']
      .includes(normalized)
  ) {
    return 'BOB';
  }

  return null;
};

const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return Number.NaN;
  }

  return Number.parseFloat(
    String(value)
      .replace(/,/g, '')
      .trim(),
  );
};

const parseCsvDate = (value) => {
  const text = String(value ?? '').trim();

  if (!text) {
    return getTodayLocal();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const match = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
  );

  if (match) {
    const [, day, month, year] = match;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return getTodayLocal();
};

const isQuantfuryAsset = (asset) => {
  const note = String(asset?.note || '').toLowerCase();

  return (
    asset?.source === 'quantfury' ||
    note.includes('quantfury')
  );
};

const toUSD = (asset, bobRate) => {
  const amount = Number(asset.amount ?? 0);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (asset.currency === 'BOB') {
    return bobRate > 0
      ? amount / bobRate
      : 0;
  }

  return amount;
};

const formatMoney = (amount, currency = 'USD') => {
  const value = Number(amount ?? 0);

  return `${currency === 'BOB' ? 'Bs' : '$'} ${value.toLocaleString(
    'es-BO',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
};

function TypeBadge({type}) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.manual;

  return (
    <span
      className="manual-type-badge"
      style={{
        color: config.color,
      }}
    >
      {config.short}
    </span>
  );
}

function TypeSelector({value, onChange}) {
  return (
    <div
      className="manual-type-tabs"
      role="tablist"
      aria-label="Tipo de activo"
    >
      {Object.keys(TYPE_CONFIG).map((type) => (
        <button
          key={type}
          type="button"
          role="tab"
          aria-selected={value === type}
          className={value === type ? 'is-active' : ''}
          onClick={() => onChange(type)}
        >
          {TYPE_CONFIG[type].short}
        </button>
      ))}
    </div>
  );
}

function CurrencyToggle({value, onChange}) {
  return (
    <div
      className="manual-currency-toggle"
      role="group"
      aria-label="Moneda"
    >
      {CURRENCIES.map((currency) => (
        <button
          key={currency}
          type="button"
          className={
            value === currency
              ? 'is-active'
              : ''
          }
          onClick={() => onChange(currency)}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}

function AssetForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  bobRate,
}) {
  const update = (field, nextValue) => {
    onChange((previous) => ({
      ...previous,
      [field]: nextValue,
    }));
  };

  const amount = parseAmount(value.amount);

  const preview = Number.isFinite(amount) && amount >= 0
    ? value.currency === 'BOB'
      ? `≈ $ ${(amount / bobRate).toFixed(2)} USD`
      : `≈ Bs ${(amount * bobRate).toFixed(2)}`
    : '';

  return (
    <form
      className="manual-form"
      onSubmit={onSubmit}
    >
      <label className="manual-field">
        <span>Nombre del activo</span>

        <input
          type="text"
          value={value.name}
          onChange={(event) => {
            update('name', event.target.value);
          }}
          placeholder="Ej. Caja de ahorros"
          required
        />
      </label>

      <div className="manual-field">
        <span>Tipo de activo</span>

        <TypeSelector
          value={value.type}
          onChange={(type) => {
            update('type', type);
          }}
        />
      </div>

      <div className="manual-amount-row">
        <label className="manual-field manual-amount-field">
          <span>Saldo</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={value.amount}
            onChange={(event) => {
              update('amount', event.target.value);
            }}
            placeholder="0.00"
            required
          />
        </label>

        <div className="manual-field manual-currency-field">
          <span>Moneda</span>

          <CurrencyToggle
            value={value.currency}
            onChange={(currency) => {
              update('currency', currency);
            }}
          />
        </div>
      </div>

      {preview && (
        <p className="manual-preview">
          {preview}
        </p>
      )}

      <label className="manual-field">
        <span>
          Nota <small>(opcional)</small>
        </span>

        <input
          type="text"
          value={value.note}
          onChange={(event) => {
            update('note', event.target.value);
          }}
          placeholder="Descripción o referencia"
        />
      </label>

      <label className="manual-field">
        <span>Fecha de adquisición</span>

        <input
          type="date"
          value={value.since || ''}
          onChange={(event) => {
            update('since', event.target.value);
          }}
          max={getTodayLocal()}
        />
      </label>

      <div className="manual-form-actions">
        {onCancel && (
          <button
            type="button"
            className="manual-button manual-button--secondary"
            onClick={onCancel}
          >
            <X size={16} />
            Cancelar
          </button>
        )}

        <button
          type="submit"
          className="manual-button manual-button--primary"
        >
          <Check size={16} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function AssetRow({
  asset,
  bobRate,
  onEdit,
  onRemove,
  readOnly = false,
}) {
  const config = TYPE_CONFIG[asset.type] ?? TYPE_CONFIG.manual;
  const valueUSD = toUSD(asset, bobRate);

  return (
    <div className="manual-asset-row">
      <span
        className="manual-asset-dot"
        style={{
          background: config.color,
        }}
      />

      <div className="manual-asset-info">
        <div className="manual-asset-name-line">
          <strong>{asset.name}</strong>

          <TypeBadge type={asset.type} />
        </div>

        <small>
          {asset.since ? `desde ${asset.since}` : ''}

          {asset.note ? ` · ${asset.note}` : ''}
        </small>
      </div>

      <div className="manual-asset-values">
        <strong>
          {formatMoney(
            asset.amount,
            asset.currency,
          )}
        </strong>

        <small>{formatMoney(valueUSD, 'USD')}</small>
      </div>

      {!readOnly && (
        <div className="manual-asset-actions">
          <button
            type="button"
            onClick={() => onEdit(asset)}
            aria-label={`Editar ${asset.name}`}
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => onRemove(asset)}
            aria-label={`Eliminar ${asset.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function CollapsibleGroup({
  title,
  assets,
  bobRate,
  total,
  onEdit,
  onRemove,
  accent = '#2dd4bf',
  readOnly = false,
}) {
  const [open, setOpen] = useState(true);
  const config = TYPE_CONFIG[assets[0]?.type] ?? TYPE_CONFIG.manual;
  const Icon = config.icon;

  return (
    <section className="manual-group">
      <button
        type="button"
        className="manual-group__header"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span
          className="manual-group__icon"
          style={{
            color: accent,
          }}
        >
          <Icon size={16} />
        </span>

        <span className="manual-group__title">
          <strong>{title}</strong>

          <small>
            {assets.length}{' '}
            {assets.length === 1
              ? 'activo'
              : 'activos'}
          </small>
        </span>

        <span className="manual-group__total">
          $ {total.toFixed(2)}
        </span>

        {open
          ? <ChevronDown size={16} />
          : <ChevronRight size={16} />}
      </button>

      <div className="manual-progress">
        <span
          style={{
            width: '100%',
            background: accent,
          }}
        />
      </div>

      {open && (
        <div className="manual-group__list">
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              bobRate={bobRate}
              onEdit={onEdit}
              onRemove={onRemove}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function QuantfuryGroup({assets, bobRate}) {
  const [open, setOpen] = useState(true);

  const groups = TYPE_ORDER
    .map((type) => ({
      type,
      assets: assets.filter(
        (asset) => asset.type === type,
      ),
    }))
    .filter((group) => group.assets.length > 0);

  const total = assets.reduce(
    (sum, asset) => sum + toUSD(asset, bobRate),
    0,
  );

  return (
    <section className="manual-group manual-group--quantfury">
      <button
        type="button"
        className="manual-group__header"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className="manual-group__icon">
          <BarChart2 size={16} />
        </span>

        <span className="manual-group__title">
          <strong>Quantfury</strong>

          <small>
            {assets.length}{' '}
            {assets.length === 1
              ? 'posición'
              : 'posiciones'}
          </small>
        </span>

        <span className="manual-group__total">
          $ {total.toFixed(2)}
        </span>

        {open
          ? <ChevronDown size={16} />
          : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="manual-group__nested">
          {groups.map((group) => (
            <CollapsibleGroup
              key={group.type}
              title={TYPE_CONFIG[group.type].label}
              assets={group.assets}
              bobRate={bobRate}
              total={group.assets.reduce(
                (sum, asset) => sum + toUSD(asset, bobRate),
                0,
              )}
              onEdit={() => {}}
              onRemove={() => {}}
              accent={TYPE_CONFIG[group.type].color}
              readOnly
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Modal({title, children, onClose}) {
  return (
    <div
      className="manual-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="manual-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="manual-modal__header">
          <div>
            <span className="manual-modal__eyebrow">
              Activos manuales
            </span>

            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="manual-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

export default function ManualAssets() {
  const {
    manualAssets = [],
    totalManualUSD = 0,
    bobRate = 0,
    addAsset,
    removeAsset,
    updateAsset,
    replaceImportedAssetsBulk,
  } = useApp();

  const {
    processing: quantfuryProcessing,
    error: quantfuryError,
    lastImportResult,
    processPdf,
  } = useQuantfury();

  const [form, setForm] = useState(EMPTY_ASSET);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const [importMessage, setImportMessage] = useState('');
  const [showQuantfuryModal, setShowQuantfuryModal] = useState(false);
  const [quantfuryEquity, setQuantfuryEquity] = useState('');

  const [saving, setSaving] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const quantfuryAssets = useMemo(
    () => manualAssets.filter(isQuantfuryAsset),
    [manualAssets],
  );

  const manualOnlyAssets = useMemo(
    () => manualAssets.filter(
      (asset) => !isQuantfuryAsset(asset),
    ),
    [manualAssets],
  );

  const manualOnlyTotal = useMemo(
    () => manualOnlyAssets.reduce(
      (sum, asset) => sum + toUSD(asset, bobRate),
      0,
    ),
    [manualOnlyAssets, bobRate],
  );

  const saveEdit = async () => {
    if (!editData?.id || !editData.name.trim()) {
      return;
    }

    const amount = parseAmount(editData.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    setSaving(true);

    try {
      await updateAsset(editData.id, {
        name: editData.name.trim(),
        type: editData.type || 'manual',
        currency: normalizeCurrency(editData.currency) || 'USD',
        amount,
        note: editData.note?.trim() || '',
        since: editData.since || getTodayLocal(),
      });

      setEditData(null);
    } catch (error) {
      console.error('Error actualizando activo:', error);

      setImportMessage(
        `Error al actualizar: ${error.message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async (event) => {
    event.preventDefault();

    const amount = parseAmount(form.amount);

    if (
      !form.name.trim() ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return;
    }

    setSaving(true);

    try {
      await addAsset({
        name: form.name.trim(),
        type: form.type || 'manual',
        currency: normalizeCurrency(form.currency) || 'USD',
        amount,
        note: form.note.trim(),
        since: form.since || getTodayLocal(),
      });

      setForm(EMPTY_ASSET());
      setShowForm(false);
    } catch (error) {
      console.error('Error agregando activo:', error);

      setImportMessage(
        `Error al agregar: ${error.message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (asset) => {
    if (!window.confirm(`¿Eliminar el activo "${asset.name}"?`)) {
      return;
    }

    try {
      await removeAsset(asset.id);
    } catch (error) {
      console.error('Error eliminando activo:', error);

      setImportMessage(
        `Error al eliminar: ${error.message}`,
      );
    }
  };

  const openEdit = (asset) => {
    setEditData({
      id: asset.id,
      name: asset.name || '',
      type: asset.type || 'manual',
      currency: asset.currency || 'USD',
      amount: asset.amount ?? '',
      note: asset.note || '',
      since: asset.since || getTodayLocal(),
    });
  };

  const handleCsv = (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    setIsImportingCsv(true);
    setImportMessage('Procesando CSV…');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: async ({data, errors}) => {
        try {
          if (errors?.length) {
            throw new Error('El CSV tiene errores de lectura.');
          }

          if (!data?.length) {
            throw new Error('El archivo está vacío.');
          }

          const rows = data
            .map((row) => {
              const name = String(row.name || '').trim();
              const currency = normalizeCurrency(row.currency);
              const amount = parseAmount(row.amount);

              const rawType = String(
                row.assettype || row.type || 'manual',
              )
                .trim()
                .toLowerCase();

              const type = Object.keys(TYPE_CONFIG)
                .includes(rawType)
                ? rawType
                : 'manual';

              if (
                !name ||
                !currency ||
                !Number.isFinite(amount) ||
                amount < 0
              ) {
                return null;
              }

              return {
                name,
                type,
                currency,
                amount,
                note: String(row.note || '').trim(),
                since: parseCsvDate(row.since),
              };
            })
            .filter(Boolean);

          if (!rows.length) {
            throw new Error(
              'No se encontraron filas válidas.',
            );
          }

          await replaceImportedAssetsBulk(rows, 'csv');

          setImportMessage(
            `Importación completada: ${rows.length} activos.`,
          );
        } catch (error) {
          console.error('Error importando CSV:', error);

          setImportMessage(
            `Error al importar: ${error.message}`,
          );
        } finally {
          setIsImportingCsv(false);
        }
      },

      error: (error) => {
        console.error('Error leyendo CSV:', error);

        setImportMessage(
          `Error al leer CSV: ${error.message}`,
        );

        setIsImportingCsv(false);
      },
    });
  };

  const handleQuantfury = async () => {
    const file = pdfInputRef.current?.files?.[0];
    const equity = parseAmount(quantfuryEquity);

    if (!file) {
      setImportMessage('Selecciona un PDF.');
      return;
    }

    if (!Number.isFinite(equity) || equity <= 0) {
      setImportMessage('Ingresa un Equity válido.');
      return;
    }

    setImportMessage('Procesando PDF de Quantfury en backend…');

    try {
      const result = await processPdf({
        file,
        equity,
      });

      const historyCount = result.history_count ?? 0;
      const positionCount = result.position_count ?? 0;

      setImportMessage(
        result.duplicate
          ? 'Este PDF ya estaba importado. No se duplicaron operaciones.'
          : `Importación completada: ${historyCount} operaciones históricas y ${positionCount} posiciones actuales.`,
      );

      setShowQuantfuryModal(false);
    } catch (error) {
      console.error('Error procesando Quantfury:', error);

      setImportMessage(
        `Error al procesar Quantfury: ${error.message}`,
      );
    } finally {
      setQuantfuryEquity('');

      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const isBusy = (
    saving ||
    isImportingCsv ||
    quantfuryProcessing
  );

  return (
    <main className="manual-page">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleCsv}
        hidden
      />

      <header className="manual-page__header">
        <div>
          <p className="manual-page__eyebrow">
            Patrimonio
          </p>

          <h1>Activos manuales</h1>
        </div>

        <div className="manual-page__actions">
          <button
            type="button"
            className="manual-button manual-button--secondary"
            onClick={() => {
              setShowQuantfuryModal(true);
            }}
            disabled={isBusy}
          >
            <FileText size={16} />
            Quantfury
          </button>

          <button
            type="button"
            className="manual-button manual-button--secondary"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            disabled={isBusy}
          >
            <FileSpreadsheet size={16} />
            CSV
          </button>

          <button
            type="button"
            className="manual-button manual-button--primary"
            onClick={() => {
              setShowForm((current) => !current);
            }}
            disabled={isBusy}
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>
      </header>

      {importMessage && (
        <div
          className={`manual-message ${
            importMessage.toLowerCase().includes('error')
              ? 'is-error'
              : ''
          }`}
          role="status"
        >
          {importMessage}
        </div>
      )}

      <section className="manual-total-card">
        <div>
          <span>Tipo de cambio</span>

          <strong>
            1 USD = Bs {Number(bobRate || 0).toFixed(2)}
          </strong>
        </div>

        <div className="manual-total-card__value">
          <span>Total portafolio</span>

          <strong>
            $ {Number(totalManualUSD || 0).toFixed(2)}
          </strong>

          <small>
            Bs {(
              Number(totalManualUSD || 0) *
              Number(bobRate || 0)
            ).toFixed(2)}
          </small>
        </div>
      </section>

      {showForm && (
        <section className="manual-create-card">
          <div className="manual-create-card__header">
            <h2>Nuevo activo</h2>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
              }}
              aria-label="Cerrar"
              disabled={saving}
            >
              <X size={18} />
            </button>
          </div>

          <AssetForm
            value={form}
            onChange={setForm}
            onSubmit={saveNew}
            onCancel={() => {
              setShowForm(false);
            }}
            submitLabel={
              saving
                ? 'Guardando…'
                : 'Guardar'
            }
            bobRate={bobRate}
          />
        </section>
      )}

      {manualAssets.length === 0 ? (
        <div className="manual-empty">
          <Wallet size={40} />

          <p>No hay activos manuales aún.</p>
        </div>
      ) : (
        <div className="manual-groups">
          {quantfuryAssets.length > 0 && (
            <QuantfuryGroup
              assets={quantfuryAssets}
              bobRate={bobRate}
            />
          )}

          {manualOnlyAssets.length > 0 && (
            <CollapsibleGroup
              title="Activos manuales"
              assets={manualOnlyAssets}
              bobRate={bobRate}
              total={manualOnlyTotal}
              onEdit={openEdit}
              onRemove={handleRemove}
            />
          )}
        </div>
      )}

      {showQuantfuryModal && (
        <Modal
          title="Importar PDF Quantfury"
          onClose={() => {
            if (!quantfuryProcessing) {
              setShowQuantfuryModal(false);
            }
          }}
        >
          <div className="manual-modal__body">
            <p className="manual-modal__description">
              Sube el informe de historial de trading e indica
              el equity real de la cuenta. El backend actualizará
              el snapshot actual y guardará las operaciones
              históricas para análisis posterior.
            </p>

            <label className="manual-field">
              <span>Equity real USD</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={quantfuryEquity}
                onChange={(event) => {
                  setQuantfuryEquity(event.target.value);
                }}
                placeholder="Ej. 323.50"
                disabled={quantfuryProcessing}
              />
            </label>

            <label className="manual-field">
              <span>Archivo PDF</span>

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                disabled={quantfuryProcessing}
              />
            </label>

            {quantfuryError && (
              <p
                className="manual-message is-error"
                role="alert"
              >
                {quantfuryError.message}
              </p>
            )}

            {lastImportResult && (
              <div className="manual-quantfury-result">
                <span>
                  Historial: {lastImportResult.history_count ?? 0}
                </span>

                <span>
                  Posiciones: {lastImportResult.position_count ?? 0}
                </span>

                <span>
                  P/L: {formatMoney(
                    lastImportResult.summary?.realized_pnl ?? 0,
                  )}
                </span>
              </div>
            )}

            <div className="manual-form-actions">
              <button
                type="button"
                className="manual-button manual-button--secondary"
                onClick={() => {
                  setShowQuantfuryModal(false);
                }}
                disabled={quantfuryProcessing}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="manual-button manual-button--primary"
                onClick={handleQuantfury}
                disabled={quantfuryProcessing}
              >
                {quantfuryProcessing
                  ? 'Procesando…'
                  : 'Procesar PDF'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editData && (
        <Modal
          title="Editar activo"
          onClose={() => {
            if (!saving) {
              setEditData(null);
            }
          }}
        >
          <div className="manual-modal__body">
            <AssetForm
              value={editData}
              onChange={setEditData}
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit();
              }}
              onCancel={() => {
                setEditData(null);
              }}
              submitLabel={
                saving
                  ? 'Guardando…'
                  : 'Guardar cambios'
              }
              bobRate={bobRate}
            />
          </div>
        </Modal>
      )}
    </main>
  );
}