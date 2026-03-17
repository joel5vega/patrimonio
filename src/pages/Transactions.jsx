import { useState } from 'react';
import { Filter, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useTransactions, TX_CATEGORIES,TX_GROUPS  } from '../hooks/useTransactions';

const FILTERS = [
  { label: 'Todos',         value: null        },
  { label: 'Compra',        value: 'buy'       },
  { label: 'Venta',         value: 'sell'      },
  { label: 'Dividendo',     value: 'dividend'  },
  { label: 'Transferencia', value: 'transfer'  },
  { label: 'Ingreso',       value: 'income'    },
  { label: 'Gasto',         value: 'expense'   },
];

const categoryMeta = (value) =>
  TX_CATEGORIES.find((c) => c.value === value) ?? { label: value, color: 'text-white/50' };

// ─── Fila editable ────────────────────────────────────────
const TxRow = ({ tx, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ concept: tx.concept || tx.title || '', category: tx.category || 'other', note: tx.note || '' });

  const save = async () => {
    await onSave(tx.id, form);
    setEditing(false);
  };

  const meta = categoryMeta(tx.category);

  return (
    <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-2">
      {/* Fila principal */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-white/10 focus:outline-none focus:border-brand-teal"
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
              placeholder="Concepto..."
            />
          ) : (
            <p className="font-semibold text-sm truncate">{tx.concept || tx.title || '—'}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/30">{tx.date}</span>
            {!editing && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 ${meta.color}`}>
                {meta.label}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
            {tx.type === 'expense' ? '-' : '+'}{tx.currency === 'BOB' ? 'Bs' : '$'}{Math.abs(tx.amount).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Edición expandida */}
      {editing && (
        <div className="space-y-2 pt-1">
          <select
            className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {TX_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Nota opcional..."
          />
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-1">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white">
              <X size={14} />
            </button>
            <button onClick={save} className="p-1.5 rounded-lg bg-brand-teal/20 text-brand-teal hover:bg-brand-teal/30">
              <Check size={14} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onDelete(tx.id)} className="p-1.5 rounded-lg bg-white/5 text-white/20 hover:text-rose-400">
              <Trash2 size={14} />
            </button>
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-brand-teal">
              <Pencil size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Modal nueva transacción ──────────────────────────────
const NewTxModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    concept: '', amount: '', currency: 'USD',
    type: 'expense', category: 'viveres',
    date: new Date().toISOString().slice(0, 10), note: '',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.concept || !form.amount) return;
    await onAdd({ ...form, title: form.concept });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div className="bg-[#111] rounded-t-3xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Nueva Transacción</h2>

        <input className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
          placeholder="Concepto *" value={form.concept} onChange={(e) => set('concept', e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <input className="bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
            placeholder="Monto *" type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          <select className="bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
            value={form.currency} onChange={(e) => set('currency', e.target.value)}>
            <option value="USD">USD $</option>
            <option value="BOB">BOB Bs</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select className="bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
            value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="expense">💸 Gasto</option>
            <option value="income">💵 Ingreso</option>
            <option value="transfer">↔️ Transferencia</option>
          </select>

          {/* ← Select agrupado con TX_GROUPS */}
          <select className="bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
            value={form.category} onChange={(e) => set('category', e.target.value)}>
            {TX_GROUPS.map((g) => (
              <optgroup key={g.value} label={g.label}>
                {TX_CATEGORIES
                  .filter((c) => c.parent === g.value)
                  .map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        <input className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
          type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />

        <input className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-brand-teal"
          placeholder="Nota opcional" value={form.note} onChange={(e) => set('note', e.target.value)} />

        <button onClick={submit}
          className="w-full bg-brand-teal text-black font-bold py-3 rounded-xl active:scale-95 transition-transform">
          Guardar
        </button>
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────
const Transactions = () => {
  const { transactions, addTransaction, updateTransaction, removeTransaction } = useTransactions();
  const [activeFilter, setActiveFilter] = useState(null);
  const [showModal, setShowModal]       = useState(false);

  const filtered = transactions.filter((tx) =>
    activeFilter === null ? true : tx.category === activeFilter
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <Filter size={20} className="text-white/40" />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button key={f.label} onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeFilter === f.value
                ? 'bg-brand-teal text-black'
                : 'bg-brand-card text-white/50 border border-white/10'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-8 text-sm">Sin movimientos</p>
        )}
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

      <button onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 bg-brand-teal text-black p-4 rounded-2xl shadow-2xl shadow-teal-900/50 active:scale-95 transition-transform">
        <Plus size={26} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Transactions;
