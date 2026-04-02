import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Wallet,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import Papa from 'papaparse';

const today = new Date().toISOString().split('T')[0];
const EMPTY = { name: '', type: 'manual',currency: 'USD', amount: '', note: '', since: today };

const ManualAssets = () => {
  const {
    manualAssets,
    totalManualUSD,
    addAsset,
    removeAsset,
    updateAsset,replaceImportedAssetsBulk,
    BOB_PER_USD,
  } = useApp();

  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || isNaN(parseFloat(form.amount))) return;

    await addAsset({
      ...form,
        type: form.type || 'manual',
      amount: parseFloat(form.amount),
      since: form.since || today,
    });

    setForm(EMPTY);
    setShowForm(false);
  };

  const handleEdit = async (id) => {
    if (!editData.name?.trim() || !editData.amount || isNaN(parseFloat(editData.amount))) return;

    await updateAsset(id, {
      name: editData.name,
        type: editData.type || 'manual',
      currency: editData.currency,
      amount: parseFloat(editData.amount),
      note: editData.note || '',
      since: editData.since || today,
    });

    setEditId(null);
  };

  const preview = (amount, currency) => {
    const n = parseFloat(amount);
    if (!n || isNaN(n)) return null;

    return currency === 'BOB'
      ? `≈ $${(n / BOB_PER_USD).toFixed(2)} USD`
      : `≈ Bs ${(n * BOB_PER_USD).toFixed(2)}`;
  };

  const normalizeCurrency = (value) => {
    const v = String(value || '').trim().toUpperCase();
    if (v === 'USD' || v === '$') return 'USD';
    if (v === 'BOB' || v === 'BS' || v === 'BOLIVIANOS' || v === 'BOLIVIANO') return 'BOB';
    return null;
  };

  const parseAmount = (value) => {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/,/g, '').trim();
    return parseFloat(cleaned);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsImporting(true);
  setImportMsg('');

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async ({ data, errors }) => {
      try {
        if (errors?.length) {
          setImportMsg('El CSV tiene errores de lectura.');
          setIsImporting(false);
          return;
        }

        if (!Array.isArray(data) || data.length === 0) {
          setImportMsg('El archivo está vacío.');
          setIsImporting(false);
          return;
        }

        const requiredColumns = ['name', 'currency', 'amount'];
        const headers = Object.keys(data[0] || {});
        const missing = requiredColumns.filter((col) => !headers.includes(col));

        if (missing.length) {
          setImportMsg(`Faltan columnas requeridas: ${missing.join(', ')}`);
          setIsImporting(false);
          return;
        }

        const rows = data
          .map((row) => {
            const name = String(row.name || '').trim();
            const currency = normalizeCurrency(row.currency);
            const amount = parseAmount(row.amount);
            const note = String(row.note || '').trim();
            const type = String(row.type || 'stock').trim().toLowerCase();
            const since = String(row.since || '').trim() || today;

            if (!name || !currency || isNaN(amount) || amount <= 0) return null;

            return {
              name,
              type,
              currency,
              amount,
              note,
              since,
            };
          })
          .filter(Boolean);

        const skipped = data.length - rows.length;

        await replaceImportedAssetsBulk(rows, 'quantfury');

        setImportMsg(
          `Importación completada. Nuevos: ${rows.length}. Omitidos: ${skipped}. Se reemplazaron posiciones anteriores de Quantfury.`
        );
      } catch (err) {
        console.error(err);
        setImportMsg('No se pudo importar el archivo.');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    },
    error: () => {
      setImportMsg('Error al procesar el archivo.');
      setIsImporting(false);
      e.target.value = '';
    },
  });
};

  const DateField = ({ value, onChange }) => (
    <div className="space-y-1">
      <label className="text-[10px] text-white/30 uppercase tracking-wider pl-1">
        Fecha de adquisición
      </label>
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-teal text-white"
      />
    </div>
  );
const getTypeBadge = (type) => {
  const t = String(type || 'manual').toLowerCase();

  if (t === 'stock') {
    return {
      label: 'STOCK',
      className: 'bg-sky-500/15 text-sky-300 border border-sky-400/20',
    };
  }

  if (t === 'crypto') {
    return {
      label: 'CRYPTO',
      className: 'bg-amber-500/15 text-amber-300 border border-amber-400/20',
    };
  }

  return {
    label: 'MANUAL',
    className: 'bg-white/5 text-white/50 border border-white/10',
  };
};
  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportFile}
        className="hidden"
      />

      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-black">Activos Manuales</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {isImporting ? <FileSpreadsheet size={16} /> : <Upload size={16} />}
            {isImporting ? 'Importando...' : 'Importar CSV'}
          </button>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-brand-teal text-black font-bold text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="bg-brand-card rounded-2xl border border-white/5 px-4 py-3">
          <p className="text-sm text-white/70">{importMsg}</p>
          <p className="text-[11px] text-white/35 mt-1">
            Formato esperado: name, currency, amount, note, since
          </p>
        </div>
      )}

      <div className="bg-brand-card rounded-2xl border border-white/5 p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-white/40 uppercase font-bold mb-0.5">Tipo de cambio oficial</p>
          <p className="font-bold">1 USD = Bs {BOB_PER_USD}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">Total</p>
          <p className="text-xl font-black text-emerald-400">${totalManualUSD.toFixed(2)}</p>
          <p className="text-xs text-white/40">Bs {(totalManualUSD * BOB_PER_USD).toFixed(2)}</p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-brand-card rounded-3xl border border-brand-teal/30 p-5 space-y-3"
        >
          <p className="font-bold text-brand-teal text-sm">Nuevo activo</p>

          <input
            type="text"
            placeholder="Nombre (ej: AirTM, Caja de ahorros, Efectivo)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-teal"
          />

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-white/40 text-sm">
                {form.currency === 'BOB' ? 'Bs' : '$'}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
              {['USD', 'BOB'].map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setForm({ ...form, currency: cur })}
                  className={`px-4 text-xs font-bold transition-all ${
                    form.currency === cur
                      ? 'bg-brand-teal text-black'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {preview(form.amount, form.currency) && (
            <p className="text-xs text-white/40 pl-1">{preview(form.amount, form.currency)}</p>
          )}

          <input
            type="text"
            placeholder="Nota (opcional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-teal"
          />

          <DateField
            value={form.since}
            onChange={(v) => setForm({ ...form, since: v })}
          />

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-brand-teal text-black font-bold py-2.5 rounded-xl text-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 bg-white/5 rounded-xl text-sm text-white/60"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {manualAssets.length === 0 ? (
        <div className="text-center py-14 text-white/30">
          <Wallet size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin activos manuales aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {manualAssets.map((a) => (
            <div key={a.id} className="bg-brand-card rounded-2xl border border-white/5 p-4">
              {editId === a.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-teal"
                  />

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-2.5 text-white/40 text-sm">
                        {editData.currency === 'BOB' ? 'Bs' : '$'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.amount}
                        onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-teal"
                      />
                    </div>

                    <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                      {['USD', 'BOB'].map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setEditData({ ...editData, currency: cur })}
                          className={`px-3 text-xs font-bold ${
                            editData.currency === cur
                              ? 'bg-brand-teal text-black'
                              : 'text-white/50'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>

                  {preview(editData.amount, editData.currency) && (
                    <p className="text-xs text-white/40 pl-1">
                      {preview(editData.amount, editData.currency)}
                    </p>
                  )}

                  <input
                    type="text"
                    placeholder="Nota (opcional)"
                    value={editData.note || ''}
                    onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-teal"
                  />

                  <DateField
                    value={editData.since || today}
                    onChange={(v) => setEditData({ ...editData, since: v })}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(a.id)}
                      className="flex-1 bg-brand-teal text-black font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Guardar
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-4 bg-white/5 rounded-xl text-sm text-white/60"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black text-sm shrink-0">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{a.name}</p>
                      <p className="text-[10px] text-white/30">
                        {a.since ? `desde ${a.since}` : ''}
                        {a.note ? ` · ${a.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {a.currency === 'BOB'
                          ? `Bs ${a.amount.toFixed(2)}`
                          : `$${a.amount.toFixed(2)}`}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {a.currency === 'BOB'
                          ? `≈ $${a.valueUSD.toFixed(2)}`
                          : `≈ Bs ${a.valueBOB.toFixed(2)}`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setEditId(a.id);
                          setEditData({
                            name: a.name,
                            type: a.type || 'manual',
                            currency: a.currency,
                            amount: a.amount,
                            note: a.note || '',
                            since: a.since || today,
                          });
                        }}
                        className="text-white/20 hover:text-brand-teal transition-colors"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => removeAsset(a.id)}
                        className="text-white/20 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManualAssets;