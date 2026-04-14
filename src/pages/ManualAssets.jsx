import { useRef, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Trash2, Pencil, Check, X,
  Wallet, Upload, FileSpreadsheet,
  TrendingUp, Bitcoin, BarChart2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import Papa from 'papaparse';

const today = new Date().toISOString().split('T')[0];
const EMPTY = { name: '', type: 'manual', currency: 'USD', amount: '', note: '', since: today };

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalizeCurrency = (value) => {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'USD' || v === '$') return 'USD';
  if (['BOB', 'BS', 'BOLIVIANOS', 'BOLIVIANO'].includes(v)) return 'BOB';
  return null;
};

const parseAmount = (value) => {
  if (value == null) return NaN;
  return parseFloat(String(value).replace(/,/g, '').trim());
};

const toUSD = (a, BOB_PER_USD) =>
  a.currency === 'BOB' ? a.amount / BOB_PER_USD : a.amount;

// ─── Configuración de tipos ──────────────────────────────────────────────────

const TYPE_CONFIG = {
  stock:  { label: 'Acciones / ETFs', short: 'STOCK',  color: 'text-sky-300',    bar: 'bg-sky-400',    dot: 'bg-sky-400',    border: 'border-sky-400/20',  bg: 'bg-sky-500/10',    icon: TrendingUp },
  crypto: { label: 'Criptomonedas',   short: 'CRYPTO', color: 'text-amber-300',  bar: 'bg-amber-400',  dot: 'bg-amber-400',  border: 'border-amber-400/20',bg: 'bg-amber-500/10',  icon: Bitcoin    },
  future: { label: 'Futuros',         short: 'FUTURO', color: 'text-violet-300', bar: 'bg-violet-400', dot: 'bg-violet-400', border: 'border-violet-400/20',bg: 'bg-violet-500/10', icon: BarChart2  },
  manual: { label: 'Manual',          short: 'MANUAL', color: 'text-white/50',   bar: 'bg-white/30',   dot: 'bg-white/30',   border: 'border-white/10',    bg: 'bg-white/5',       icon: Wallet     },
};

// ─── Badge de tipo ──────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[String(type || 'manual').toLowerCase()] ?? TYPE_CONFIG.manual;
  return (
    <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.short}
    </span>
  );
};

// ─── Barra de progreso ──────────────────────────────────────────────────────

const ProgressBar = ({ pct, colorClass }) => (
  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  </div>
);

// ─── Selector de tipo ───────────────────────────────────────────────────────

const TypeSelector = ({ value, onChange }) => (
  <div className="flex rounded-xl overflow-hidden border border-white/10">
    {['manual', 'stock', 'crypto', 'future'].map((t) => (
      <button
        key={t}
        type="button"
        onClick={() => onChange(t)}
        className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${
          value === t ? 'bg-brand-teal text-black' : 'text-white/40 hover:text-white'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

// ─── Campo de fecha ─────────────────────────────────────────────────────────

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

// ─── Fila de activo individual ───────────────────────────────────────────────

const AssetRow = ({ a, pct, BOB_PER_USD, onEdit, onRemove }) => {
  const cfg = TYPE_CONFIG[String(a.type || 'manual').toLowerCase()] ?? TYPE_CONFIG.manual;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-white/3 transition-colors group">
      {/* Dot + nombre */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm truncate">{a.name}</p>
            <TypeBadge type={a.type} />
          </div>
          {(a.since || a.note) && (
            <p className="text-[10px] text-white/25 truncate">
              {a.since ? `desde ${a.since}` : ''}
              {a.note ? ` · ${a.note}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Monto + pct + acciones */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="font-bold text-sm">
            {a.currency === 'BOB' ? `Bs ${a.amount.toFixed(2)}` : `$${a.amount.toFixed(2)}`}
          </p>
          <p className="text-[10px] text-white/30">
            {a.currency === 'BOB'
              ? `≈ $${(a.amount / BOB_PER_USD).toFixed(2)}`
              : `≈ Bs ${(a.amount * BOB_PER_USD).toFixed(2)}`}
          </p>
          <p className={`text-[10px] font-bold ${cfg.color}`}>{pct.toFixed(1)}%</p>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-white/30 hover:text-brand-teal transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onRemove} className="text-white/30 hover:text-rose-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Grupo colapsable por tipo ───────────────────────────────────────────────

const TypeGroup = ({ type, assets, groupTotal, portfolioTotal, BOB_PER_USD, onEdit, onRemove }) => {
  const [open, setOpen] = useState(true);
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.manual;
  const Icon = cfg.icon;
  const pct = portfolioTotal > 0 ? (groupTotal / portfolioTotal) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden">
      {/* Cabecera del grupo */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
            <Icon size={13} />
          </div>
          <div className="text-left">
            <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-[10px] text-white/30">{assets.length} activo{assets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-black text-sm">${groupTotal.toFixed(2)}</p>
            <p className={`text-[10px] font-bold ${cfg.color}`}>{pct.toFixed(1)}%</p>
          </div>
          {open
            ? <ChevronDown size={14} className="text-white/30" />
            : <ChevronRight size={14} className="text-white/30" />
          }
        </div>
      </button>

      {/* Barra de progreso */}
      <div className="px-4 pb-1 bg-white/3">
        <ProgressBar pct={pct} colorClass={cfg.bar} />
      </div>

      {/* Lista de activos */}
      {open && (
        <div className="divide-y divide-white/3 bg-brand-card px-1">
          {assets.map((a) => {
            const usd = toUSD(a, BOB_PER_USD);
            const assetPct = portfolioTotal > 0 ? (usd / portfolioTotal) * 100 : 0;
            return (
              <AssetRow
                key={a.id}
                a={a}
                pct={assetPct}
                BOB_PER_USD={BOB_PER_USD}
                onEdit={() => onEdit(a)}
                onRemove={() => onRemove(a.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Grupo Quantfury (contenedor maestro colapsable) ─────────────────────────

const QuantfuryGroup = ({ assets, tradingTotal, portfolioTotal, BOB_PER_USD, onEdit, onRemove }) => {
  const [open, setOpen] = useState(true);
  const pct = portfolioTotal > 0 ? (tradingTotal / portfolioTotal) * 100 : 0;

  // Agrupar por tipo dentro de Quantfury
  const byType = useMemo(() => {
    const map = {};
    for (const a of assets) {
      const t = String(a.type || 'stock').toLowerCase();
      if (!map[t]) map[t] = [];
      map[t].push(a);
    }
    return map;
  }, [assets]);

  const typeOrder = ['stock', 'crypto', 'future'];

  return (
    <div className="rounded-2xl border border-brand-teal/20 overflow-hidden">
      {/* Cabecera Quantfury */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-brand-teal/5 hover:bg-brand-teal/8 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-teal/15 flex items-center justify-center text-brand-teal">
            <BarChart2 size={15} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-brand-teal">Quantfury</p>
            <p className="text-[10px] text-white/30">
              {assets.length} posicion{assets.length !== 1 ? 'es' : ''} · {Object.keys(byType).length} tipo{Object.keys(byType).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-black text-sm text-white">${tradingTotal.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-brand-teal">{pct.toFixed(1)}% del total</p>
          </div>
          {open
            ? <ChevronDown size={14} className="text-white/30" />
            : <ChevronRight size={14} className="text-white/30" />
          }
        </div>
      </button>

      {/* Barra teal */}
      <div className="px-4 pb-1 bg-brand-teal/5">
        <ProgressBar pct={pct} colorClass="bg-brand-teal" />
      </div>

      {/* Subgrupos por tipo */}
      {open && (
        <div className="p-3 space-y-2 bg-brand-card">
          {typeOrder
            .filter((t) => byType[t]?.length > 0)
            .map((t) => {
              const groupAssets = byType[t];
              const groupTotal = groupAssets.reduce((s, a) => s + toUSD(a, BOB_PER_USD), 0);
              return (
                <TypeGroup
                  key={t}
                  type={t}
                  assets={groupAssets}
                  groupTotal={groupTotal}
                  portfolioTotal={portfolioTotal}
                  BOB_PER_USD={BOB_PER_USD}
                  onEdit={onEdit}
                  onRemove={onRemove}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const ManualAssets = () => {
  const {
    manualAssets,
    totalManualUSD,
    addAsset,
    removeAsset,
    updateAsset,
    replaceImportedAssetsBulk,
    BOB_PER_USD,
  } = useApp();

  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  // ── Separar activos por origen ────────────────────────────────────────────
  const { quantfuryAssets, manualOnlyAssets, tradingTotal, manualOnlyTotal } = useMemo(() => {
    const trading = ['stock', 'crypto', 'future'];
    const qAssets = manualAssets.filter((a) => trading.includes(String(a.type || '').toLowerCase()));
    const mAssets = manualAssets.filter((a) => !trading.includes(String(a.type || '').toLowerCase()));
    return {
      quantfuryAssets:  qAssets,
      manualOnlyAssets: mAssets,
      tradingTotal:     qAssets.reduce((s, a) => s + toUSD(a, BOB_PER_USD), 0),
      manualOnlyTotal:  mAssets.reduce((s, a) => s + toUSD(a, BOB_PER_USD), 0),
    };
  }, [manualAssets, BOB_PER_USD]);

  // ── Edición ───────────────────────────────────────────────────────────────
  const startEdit = (a) => {
    setEditId(a.id);
    setEditData({ name: a.name, type: a.type || 'manual', currency: a.currency, amount: a.amount, note: a.note || '', since: a.since || today });
  };

  const handleEdit = async (id) => {
    if (!editData.name?.trim() || !editData.amount || isNaN(parseFloat(editData.amount))) return;
    await updateAsset(id, { ...editData, amount: parseFloat(editData.amount), since: editData.since || today });
    setEditId(null);
  };

  // ── Agregar ───────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || isNaN(parseFloat(form.amount))) return;
    await addAsset({ ...form, type: form.type || 'manual', amount: parseFloat(form.amount), since: form.since || today });
    setForm(EMPTY);
    setShowForm(false);
  };

  const preview = (amount, currency) => {
    const n = parseFloat(amount);
    if (!n || isNaN(n)) return null;
    return currency === 'BOB' ? `≈ $${(n / BOB_PER_USD).toFixed(2)} USD` : `≈ Bs ${(n * BOB_PER_USD).toFixed(2)}`;
  };

  // ── Importar CSV ──────────────────────────────────────────────────────────
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
          if (errors?.length) { setImportMsg('El CSV tiene errores de lectura.'); return; }
          if (!data?.length)  { setImportMsg('El archivo está vacío.'); return; }
          const headers = Object.keys(data[0] || {});
          const missing = ['name', 'currency', 'amount'].filter((c) => !headers.includes(c));
          if (missing.length) { setImportMsg(`Faltan columnas: ${missing.join(', ')}`); return; }

          const rows = data.map((row) => {
            const name     = String(row.name || '').trim();
            const currency = normalizeCurrency(row.currency);
            const amount   = parseAmount(row.amount);
            const note     = String(row.note || '').trim();
            const since    = String(row.since || '').trim() || today;
            const rawType  = String(row.asset_type || row.type || 'stock').trim().toLowerCase();
            const type     = ['stock', 'crypto', 'future'].includes(rawType) ? rawType : 'stock';
            if (!name || !currency || isNaN(amount) || amount <= 0) return null;
            return { name, type, currency, amount, note, since };
          }).filter(Boolean);

          const skipped = data.length - rows.length;
          const summary = rows.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
          await replaceImportedAssetsBulk(rows, 'quantfury');
          setImportMsg(`✅ ${Object.entries(summary).map(([t, n]) => `${n} ${t}`).join(', ')}. Omitidos: ${skipped}.`);
        } catch (err) {
          setImportMsg('No se pudo importar el archivo.');
        } finally {
          setIsImporting(false);
          e.target.value = '';
        }
      },
      error: () => { setImportMsg('Error al procesar el archivo.'); setIsImporting(false); e.target.value = ''; },
    });
  };

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />

      {/* ── Header ── */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-black">Activos Manuales</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
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

      {/* ── Mensaje importación ── */}
      {importMsg && (
        <div className="bg-brand-card rounded-2xl border border-white/5 px-4 py-3">
          <p className="text-sm text-white/70">{importMsg}</p>
          <p className="text-[11px] text-white/30 mt-1">Columnas: name, asset_type, currency, amount, note, since</p>
        </div>
      )}

      {/* ── Total general + tipo de cambio ── */}
      <div className="bg-brand-card rounded-2xl border border-white/5 p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-white/40 uppercase font-bold mb-0.5">Tipo de cambio</p>
          <p className="font-bold text-sm">1 USD = Bs {BOB_PER_USD}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 uppercase font-bold">Total portafolio</p>
          <p className="text-2xl font-black text-emerald-400">${totalManualUSD.toFixed(2)}</p>
          <p className="text-xs text-white/40">Bs {(totalManualUSD * BOB_PER_USD).toFixed(2)}</p>
        </div>
      </div>

      {/* ── Formulario nuevo activo ── */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-brand-card rounded-3xl border border-brand-teal/30 p-5 space-y-3">
          <p className="font-bold text-brand-teal text-sm">Nuevo activo</p>
          <input
            type="text"
            placeholder="Nombre (ej: AirTM, Caja de ahorros)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-teal"
          />
          <TypeSelector value={form.type} onChange={(t) => setForm({ ...form, type: t })} />
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-white/40 text-sm">{form.currency === 'BOB' ? 'Bs' : '$'}</span>
              <input
                type="number" step="0.01" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-teal"
              />
            </div>
            <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
              {['USD', 'BOB'].map((cur) => (
                <button key={cur} type="button" onClick={() => setForm({ ...form, currency: cur })}
                  className={`px-4 text-xs font-bold transition-all ${form.currency === cur ? 'bg-brand-teal text-black' : 'text-white/50 hover:text-white'}`}>
                  {cur}
                </button>
              ))}
            </div>
          </div>
          {preview(form.amount, form.currency) && <p className="text-xs text-white/40 pl-1">{preview(form.amount, form.currency)}</p>}
          <input type="text" placeholder="Nota (opcional)" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-teal"
          />
          <DateField value={form.since} onChange={(v) => setForm({ ...form, since: v })} />
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 bg-brand-teal text-black font-bold py-2.5 rounded-xl text-sm">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 bg-white/5 rounded-xl text-sm text-white/60">Cancelar</button>
          </div>
        </form>
      )}

      {/* ── Lista vacía ── */}
      {manualAssets.length === 0 && (
        <div className="text-center py-14 text-white/30">
          <Wallet size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin activos manuales aún</p>
        </div>
      )}

      {/* ── BLOQUE QUANTFURY (anidado) ── */}
      {quantfuryAssets.length > 0 && (
        <QuantfuryGroup
          assets={quantfuryAssets}
          tradingTotal={tradingTotal}
          portfolioTotal={totalManualUSD}
          BOB_PER_USD={BOB_PER_USD}
          onEdit={startEdit}
          onRemove={removeAsset}
        />
      )}

      {/* ── ACTIVOS MANUALES SUELTOS ── */}
      {manualOnlyAssets.length > 0 && (
        <TypeGroup
          type="manual"
          assets={manualOnlyAssets}
          groupTotal={manualOnlyTotal}
          portfolioTotal={totalManualUSD}
          BOB_PER_USD={BOB_PER_USD}
          onEdit={startEdit}
          onRemove={removeAsset}
        />
      )}

      {/* ── Modal de edición (overlay) ── */}
      {editId && (() => {
        const a = manualAssets.find((x) => x.id === editId);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setEditId(null); }}>
            <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl border border-white/10 p-5 space-y-3">
              <p className="font-bold text-brand-teal text-sm">Editar activo</p>
              <input type="text" value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              <TypeSelector value={editData.type || 'manual'} onChange={(t) => setEditData({ ...editData, type: t })} />
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-white/40 text-sm">{editData.currency === 'BOB' ? 'Bs' : '$'}</span>
                  <input type="number" step="0.01" value={editData.amount}
                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-teal"
                  />
                </div>
                <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                  {['USD', 'BOB'].map((cur) => (
                    <button key={cur} type="button" onClick={() => setEditData({ ...editData, currency: cur })}
                      className={`px-3 text-xs font-bold ${editData.currency === cur ? 'bg-brand-teal text-black' : 'text-white/50'}`}>
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
              {preview(editData.amount, editData.currency) && (
                <p className="text-xs text-white/40 pl-1">{preview(editData.amount, editData.currency)}</p>
              )}
              <input type="text" placeholder="Nota (opcional)" value={editData.note || ''}
                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              <DateField value={editData.since || today} onChange={(v) => setEditData({ ...editData, since: v })} />
              <div className="flex gap-2">
                <button onClick={() => handleEdit(editId)}
                  className="flex-1 bg-brand-teal text-black font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1">
                  <Check size={14} /> Guardar
                </button>
                <button onClick={() => setEditId(null)} className="px-4 bg-white/5 rounded-xl text-sm text-white/60">
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ManualAssets;