// src/pages/Budget.jsx
import { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTransactions, TX_GROUPS, TX_CATEGORIES } from '../hooks/useTransactions';
import { useBudget } from '../hooks/useBudget';
import {
  CheckCircle, AlertTriangle, Edit2, X, Save,
  ChevronDown,
} from 'lucide-react';
import { parseLocal } from '../utils/filterByPeriod';
import { animate, stagger } from 'animejs';

// ── Montos por defecto para subcategorías ─────────────────────
const DEFAULT_SUBCAT_BUDGETS = {
  alquiler: 1300,
  comunicaciones: 500, // Ajustado
  viveres: 600,
  transporte: 324,     // Ajustado
  ahorro: 4000,
  utiles: 100,
  ropa: 200,
  cremas: 200,
  salidas: 300,
  hogar: 2800,
};

// ── Colores ───────────────────────────────────────────────────
const GROUP_COLORS = {
  hogar: 'bg-blue-500', familia: 'bg-pink-500',
  desarrollo: 'bg-purple-500', fe: 'bg-yellow-500',
  inversiones: 'bg-emerald-500', otros: 'bg-white/30',
};
const GROUP_TEXT = {
  hogar: 'text-blue-400', familia: 'text-pink-400',
  desarrollo: 'text-purple-400', fe: 'text-yellow-400',
  inversiones: 'text-emerald-400', otros: 'text-white/40',
};
const GROUP_HEX = {
  hogar: '#3b82f6', familia: '#ec4899', desarrollo: '#a855f7',
  fe: '#eab308', inversiones: '#10b981', otros: 'rgba(255,255,255,0.3)',
};
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Helper para matchear grupo de subcategoría ───────────────
function matchesGroup(cat, groupKey) {
  return (
    cat.parentCategory === groupKey ||
    cat.group === groupKey ||
    cat.parent === groupKey
  );
}

// ── Helpers de fecha y gastos ────────────────────────────────
function getSpentInMonth(transactions, group, year, month) {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0, 23, 59, 59);
  return transactions
    .filter(tx => tx.type === 'expense' && (tx.parentCategory || tx.group || 'otros') === group)
    .filter(tx => { const d = parseLocal(tx.date); return d >= start && d <= end; })
    .reduce((s, tx) => s + tx.amount, 0);
}

function getTxsInMonth(transactions, group, year, month) {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0, 23, 59, 59);
  return transactions
    .filter(tx => tx.type === 'expense' && (tx.parentCategory || tx.group || 'otros') === group)
    .filter(tx => { const d = parseLocal(tx.date); return d >= start && d <= end; })
    .sort((a, b) => b.amount - a.amount);
}

function getGlobalMonthDetail(transactions, groups, groupBudgetsMap, year, month) {
  return groups.map(({ value: key, label }) => {
    const budget = groupBudgetsMap[key] || 0;
    const spent  = getSpentInMonth(transactions, key, year, month);
    const ok     = budget > 0 ? spent <= budget : null;
    const pct    = budget > 0 ? (spent / budget) * 100 : 0;
    return { key, label, budget, spent, ok, pct };
  });
}

function getMonthlyAvg(transactions, group, months = 3) {
  const now = new Date();
  const totals = Array.from({ length: months }, (_, i) =>
    getSpentInMonth(transactions, group, now.getFullYear(), now.getMonth() - i)
  );
  return totals.reduce((a, b) => a + b, 0) / months;
}

function getBudgetHistory(transactions, group, budget, months = 5) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const idx   = now.getMonth() - (months - i);
    const year  = now.getFullYear() + Math.floor(idx / 12);
    const month = ((idx % 12) + 12) % 12;
    const spent = getSpentInMonth(transactions, group, year, month);
    const ok    = budget > 0 ? spent <= budget : null;
    return { label: MONTHS_ES[month], year, month, spent, budget, ok, pct: budget > 0 ? (spent / budget) * 100 : 0 };
  });
}

// ── Bar ───────────────────────────────────────────────────────
const Bar = ({ pct, color, warn }) => (
  <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-500 ${warn ? 'bg-rose-500' : color}`}
      style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
);

// ── Modal detalle de un mes ───────────────────────────────────
const MonthDetailModal = ({ data, onClose }) => {
  const { label, year, month, groupKey, groupLabel, budget, spent, ok, hex, transactions } = data;
  const sheetRef = useRef(null);

  const txs = useMemo(() => getTxsInMonth(transactions, groupKey, year, month), [transactions, groupKey, year, month]);
  const byCategory = useMemo(() => {
    const map = {};
    txs.forEach(tx => {
      const key = tx.category || 'other';
      map[key]  = (map[key] || 0) + tx.amount;
    });
    return Object.entries(map)
      .map(([key, total]) => {
        const meta = TX_CATEGORIES.find(c => c.value === key);
        return { key, total, label: meta?.label || key, emoji: meta?.emoji || '📦' };
      })
      .sort((a, b) => b.total - a.total);
  }, [txs]);

  useEffect(() => {
    if (!sheetRef.current) return;
    animate(sheetRef.current, { translateY: ['100%', '0%'], opacity: [0, 1], duration: 320, ease: 'outExpo' });
    if (sheetRef.current.querySelectorAll('.detail-row').length)
      animate(sheetRef.current.querySelectorAll('.detail-row'), {
        opacity: [0, 1], translateX: [-12, 0], duration: 250, delay: stagger(40), ease: 'outExpo',
      });
  }, []);

  const handleClose = () => {
    if (!sheetRef.current) { onClose(); return; }
    animate(sheetRef.current, { translateY: ['0%', '100%'], opacity: [1, 0], duration: 220, ease: 'inExpo' });
    setTimeout(onClose, 220);
  };

  const diff   = budget > 0 ? budget - spent : null;
  const pct    = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = budget > 0 && spent > budget;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}>
      <div ref={sheetRef} onClick={e => e.stopPropagation()}
        className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl"
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', opacity: 0 }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-2 pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem',
                borderRadius: '999px', background: hex + '22', color: hex, border: `1px solid ${hex}44` }}>
                {label} {year}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                background: ok === null ? 'rgba(255,255,255,0.05)' : ok ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                color: ok === null ? 'rgba(255,255,255,0.3)' : ok ? '#34d399' : '#fb7185',
                border: `1px solid ${ok === null ? 'rgba(255,255,255,0.1)' : ok ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              }}>
                {ok === null ? 'Sin budget' : ok ? '✓ Cumplido' : '✗ Excedido'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{groupLabel}</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/70">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 space-y-5 pb-8">
          <div className="grid grid-cols-3 gap-2">
            {[
              { lbl: 'Gastado',      val: `Bs ${spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`,   color: isOver ? 'text-rose-400' : 'text-white' },
              { lbl: 'Budget',       val: budget > 0 ? `Bs ${budget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}` : '—', color: 'text-white/60' },
              { lbl: diff !== null ? (isOver ? 'Exceso' : 'Restó') : 'Transacc.',
                val: diff !== null
                  ? `Bs ${Math.abs(diff).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
                  : `${txs.length}`,
                color: diff !== null ? (isOver ? 'text-rose-400' : 'text-emerald-400') : 'text-white/60' },
            ].map(({ lbl, val, color }) => (
              <div key={lbl} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-[9px] text-white/30 mb-1 uppercase tracking-wide">{lbl}</p>
                <p className={`text-sm font-bold font-mono ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          {budget > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-white/30">
                <span>0</span>
                <span className={pct > 100 ? 'text-rose-400 font-bold' : ''}>{pct.toFixed(0)}%</span>
                <span>Bs {budget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#f43f5e' : hex }} />
              </div>
            </div>
          )}

          {byCategory.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide">Por categoría</p>
              {byCategory.map(({ key, total, label: catLabel, emoji }) => (
                <div key={key} className="detail-row space-y-1" style={{ opacity: 0 }}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/70">{emoji} {catLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-[10px]">
                        {spent > 0 ? ((total / spent) * 100).toFixed(0) : 0}%
                      </span>
                      <span className="text-white/80 font-semibold font-mono">
                        Bs {total.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(total / (byCategory[0]?.total || 1)) * 100}%`, background: hex + 'cc' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Modal detalle global de un mes ────────────────────────────
const GlobalMonthDetailModal = ({ data, onClose }) => {
  const { label, year, month, groups, groupBudgetsMap, transactions } = data;
  const sheetRef  = useRef(null);
  const [selected, setSelected] = useState(null);

  const detail = useMemo(
    () => getGlobalMonthDetail(transactions, groups, groupBudgetsMap, year, month),
    [transactions, groups, groupBudgetsMap, year, month]
  );

  const passed = detail.filter(d => d.ok === true).length;
  const failed = detail.filter(d => d.ok === false).length;
  const total  = detail.filter(d => d.ok !== null).length;

  useEffect(() => {
    if (!sheetRef.current) return;
    animate(sheetRef.current, { translateY: ['100%', '0%'], opacity: [0, 1], duration: 320, ease: 'outExpo' });
    animate(sheetRef.current.querySelectorAll('.gm-row'), {
      opacity: [0, 1], translateX: [-10, 0], duration: 250, delay: stagger(50), ease: 'outExpo',
    });
  }, []);

  const handleClose = () => {
    animate(sheetRef.current, { translateY: ['0%', '100%'], opacity: [1, 0], duration: 220, ease: 'inExpo' });
    setTimeout(onClose, 220);
  };

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}>
        <div ref={sheetRef} onClick={e => e.stopPropagation()}
          className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', opacity: 0 }}>

          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pt-2 pb-4 flex justify-between items-start">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide font-bold mb-0.5">Cumplimiento global</p>
              <h2 className="text-xl font-bold">{label} {year}</h2>
              <div className="flex gap-1.5 mt-1.5">
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem',
                  borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                  ✓ {passed} cumplidos
                </span>
                {failed > 0 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem',
                    borderRadius: '999px', background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}>
                    ✗ {failed} excedidos
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/70">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 space-y-3 pb-8">
            {total > 0 && (
              <div className="bg-white/5 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Grupos con budget</span>
                  <span className="font-bold font-mono">{passed}/{total}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(passed / total) * 100}%`, background: passed === total ? '#10b981' : passed > 0 ? '#eab308' : '#f43f5e' }} />
                </div>
              </div>
            )}

            {detail.map(({ key, label: gLabel, budget, spent, ok, pct }) => {
              const hex    = GROUP_HEX[key] || 'rgba(255,255,255,0.3)';
              const isOver = ok === false;
              const diff   = budget > 0 ? budget - spent : null;

              return (
                <div key={key} className="gm-row" style={{ opacity: 0 }}>
                  <button
                    type="button"
                    onClick={() => setSelected({ groupKey: key, groupLabel: gLabel, budget, spent, ok, hex, label, year, month, transactions })}
                    className="w-full bg-white/5 rounded-2xl p-3.5 space-y-2.5 text-left hover:bg-white/8 transition-colors active:scale-[0.98]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hex }} />
                        <span className="text-sm font-bold" style={{ color: hex }}>{gLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ok !== null && (
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 800,
                            padding: '0.1rem 0.45rem', borderRadius: '999px',
                            background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                            color: ok ? '#34d399' : '#fb7185',
                            border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                          }}>
                            {ok ? '✓ Cumplido' : '✗ Excedido'}
                          </span>
                        )}
                      </div>
                    </div>

                    {budget > 0 && (
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#f43f5e' : hex }} />
                      </div>
                    )}

                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">
                        Bs {spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                        {budget > 0 && <span className="text-white/20"> / {budget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>}
                      </span>
                      {diff !== null && (
                        <span style={{ color: isOver ? '#fb7185' : '#34d399' }} className="font-semibold font-mono">
                          {isOver ? `+${(spent - budget).toLocaleString('es-BO', { maximumFractionDigits: 0 })}` : `-${diff.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <MonthDetailModal data={selected} onClose={() => setSelected(null)} />
      )}
    </>,
    document.body
  );
};

// ── BudgetHistory (barras) ────────────────────────────────────
const BudgetHistory = ({ history, hex, transactions, groupKey, groupLabel, budget }) => {
  const ref = useRef(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current.querySelectorAll('.hist-bar'), {
      scaleY: [0, 1], opacity: [0, 1],
      duration: 400, delay: stagger(60), ease: 'outExpo',
    });
  }, []);

  const maxSpent = Math.max(...history.map(h => Math.max(h.spent, h.budget || 0)), 1);

  return (
    <>
      <div ref={ref} className="pt-3 border-t border-white/5 space-y-2">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide">
          Historial — toca un mes para ver detalles
        </p>

        <div className="flex items-end gap-1.5 h-16">
          {history.map((h, i) => (
            <button key={i} type="button"
              onClick={() => setModal({ ...h, groupKey, groupLabel, budget, hex, transactions })}
              className="flex-1 flex flex-col items-center gap-1 h-full hover:opacity-80 active:scale-95 transition-all">
              <div className="flex-1 w-full flex items-end relative">
                {h.budget > 0 && (
                  <div className="absolute w-full border-t border-dashed border-white/20"
                    style={{ bottom: `${(h.budget / maxSpent) * 100}%` }} />
                )}
                <div className="hist-bar w-full rounded-t-sm origin-bottom"
                  style={{
                    height: `${Math.max((h.spent / maxSpent) * 100, h.spent > 0 ? 4 : 0)}%`,
                    background: h.ok === null ? 'rgba(255,255,255,0.15)' : h.ok ? hex + 'cc' : '#f43f5e',
                  }} />
              </div>
              <span className="text-[8px] text-white/30 leading-none">{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      {modal && (
        <MonthDetailModal data={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
};

// ── BudgetCard ────────────────────────────────────────────────
const BudgetCard = ({ groupKey, label, transactions, subcategories, budgets, weeklySpent, monthlySpent, onSave }) => {
  const [editing, setEditing]   = useState(false);
  const [showHist, setShowHist] = useState(false);

  // Mapeo temporal de inputs por subcategoría al editar
  const [inputs, setInputs] = useState({});
  const [singleInput, setSingleInput] = useState('');

  // Gastos actuales por subcategoría en el mes en curso
  const subcatSpentMap = useMemo(() => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const map   = {};

    transactions
      .filter(tx => tx.type === 'expense' && (tx.parentCategory || tx.group || 'otros') === groupKey)
      .forEach(tx => {
        const d = parseLocal(tx.date);
        if (d >= start && d <= end) {
          const cat = tx.category || 'otros';
          map[cat] = (map[cat] || 0) + tx.amount;
        }
      });
    return map;
  }, [transactions, groupKey]);

  // Calcular presupuesto total del grupo
  const groupBudget = useMemo(() => {
    if (subcategories.length === 0) return Number(budgets[groupKey] || 0);
    return subcategories.reduce((acc, cat) => {
      const val = budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || 0);
      return acc + Number(val);
    }, 0);
  }, [subcategories, budgets, groupKey]);

  const avg    = getMonthlyAvg(transactions, groupKey, 3);
  const spent  = monthlySpent;
  const pct    = groupBudget > 0 ? (spent / groupBudget) * 100 : 0;
  const isOver = groupBudget > 0 && spent > groupBudget;
  const hex    = GROUP_HEX[groupKey] || 'rgba(255,255,255,0.3)';

  const history = useMemo(
    () => getBudgetHistory(transactions, groupKey, groupBudget, 5),
    [transactions, groupKey, groupBudget]
  );

  const metCount  = history.filter(h => h.ok === true).length;
  const missCount = history.filter(h => h.ok === false).length;

  const handleStartEdit = () => {
    if (subcategories.length > 0) {
      const initialInputs = {};
      subcategories.forEach(cat => {
        initialInputs[cat.value] = budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || '');
      });
      setInputs(initialInputs);
    } else {
      setSingleInput(budgets[groupKey] || '');
    }
    setEditing(true);
  };

 
const handleSave = () => {
    if (subcategories.length > 0) {
      const newBudgets = {};
      subcategories.forEach(cat => {
        if (inputs[cat.value] !== undefined) {
          newBudgets[cat.value] = Number(inputs[cat.value] || 0);
        }
      });
      onSave(newBudgets); // Guarda todas las subcategorías en un solo lote
    } else {
      onSave(groupKey, singleInput);
    }
    setEditing(false);
  };
  return (
    <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
      {/* Título y Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${GROUP_TEXT[groupKey] || 'text-white/60'}`}>{label}</span>
          {groupBudget > 0 && (
            <div className="flex items-center gap-0.5">
              {metCount > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '0.1rem 0.35rem',
                  borderRadius: '999px', background: hex + '22', color: hex, border: `1px solid ${hex}44`,
                  fontFamily: 'JetBrains Mono,monospace' }}>✓ {metCount}</span>
              )}
              {missCount > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '0.1rem 0.35rem',
                  borderRadius: '999px', background: 'rgba(244,63,94,0.12)', color: '#fb7185',
                  border: '1px solid rgba(244,63,94,0.3)', fontFamily: 'JetBrains Mono,monospace' }}>
                  ✗ {missCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isOver ? <AlertTriangle size={13} className="text-rose-400" />
            : groupBudget > 0 ? <CheckCircle size={13} className="text-emerald-400" /> : null}
          <button onClick={() => editing ? setEditing(false) : handleStartEdit()}
            className="p-1 rounded-lg bg-white/5 text-white/40 hover:text-white/70 transition-colors">
            {editing ? <X size={12} /> : <Edit2 size={12} />}
          </button>
        </div>
      </div>

      {/* Panel de Edición */}
      {editing && (
        <div className="bg-white/5 rounded-xl p-3 space-y-2 border border-white/10">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide">
            {subcategories.length > 0 ? 'Ajustar subcategorías' : 'Ajustar Presupuesto Total'}
          </p>

          {subcategories.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {subcategories.map(cat => (
                <div key={cat.value} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/70 flex items-center gap-1.5">
                    <span>{cat.emoji || '📦'}</span> {cat.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-white/40 text-[10px]">Bs</span>
                    <input
                      type="number"
                      value={inputs[cat.value] ?? ''}
                      onChange={e => setInputs({ ...inputs, [cat.value]: e.target.value })}
                      className="w-20 bg-white/10 rounded-lg px-2 py-1 text-xs text-white text-right outline-none focus:ring-1 focus:ring-brand-teal/50"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/70">Monto total grupo</span>
              <div className="flex items-center gap-1">
                <span className="text-white/40 text-[10px]">Bs</span>
                <input
                  type="number"
                  value={singleInput}
                  onChange={e => setSingleInput(e.target.value)}
                  className="w-24 bg-white/10 rounded-lg px-2 py-1 text-xs text-white text-right outline-none focus:ring-1 focus:ring-brand-teal/50"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-white/5">
            <span className="text-xs text-white/50">
              Total: <strong className="text-white font-mono">
                Bs {subcategories.length > 0
                  ? Object.values(inputs).reduce((a, b) => a + Number(b || 0), 0)
                  : Number(singleInput || 0)}
              </strong>
            </span>
            <button
              onClick={handleSave}
              className="bg-brand-teal text-black px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
              <Save size={12} /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Barra de Progreso */}
      <div className="flex items-center gap-2">
        <Bar pct={groupBudget > 0 ? pct : 0} color={GROUP_COLORS[groupKey] || 'bg-white/20'} warn={isOver} />
        <span className={`text-xs font-bold min-w-[36px] text-right ${isOver ? 'text-rose-400' : 'text-white/50'}`}>
          {groupBudget > 0 ? `${pct.toFixed(0)}%` : '—'}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-1 text-[10px] text-white/40">
        <div>
          <p>Este mes</p>
          <p className="text-white/70 font-semibold font-mono">
            Bs {spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p>Presupuesto</p>
          <p className="text-white/70 font-semibold font-mono">
            Bs {groupBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p>Promedio 3M</p>
          <p className={`font-semibold font-mono ${avg > (groupBudget || Infinity) ? 'text-rose-400' : 'text-white/70'}`}>
            Bs {avg.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Detalle subcategorías (Modo Lectura con Progreso de Gastos) */}
      {!editing && subcategories.length > 0 && (
        <div className="pt-2 space-y-2 border-t border-white/5">
          {subcategories.map(cat => {
            const subcatBudget = Number(budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || 0));
            const subcatSpent  = subcatSpentMap[cat.value] || 0;
            if (!subcatBudget && !subcatSpent) return null;

            const catPct    = subcatBudget > 0 ? (subcatSpent / subcatBudget) * 100 : 0;
            const isCatOver = subcatBudget > 0 && subcatSpent > subcatBudget;

            return (
              <div key={cat.value} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <span>{cat.emoji || '•'}</span> {cat.label}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={`font-semibold ${isCatOver ? 'text-rose-400' : 'text-white/80'}`}>
                      Bs {subcatSpent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-white/30 text-[10px]">
                      / Bs {subcatBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {subcatBudget > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(catPct, 100)}%`,
                          background: isCatOver ? '#f43f5e' : hex,
                        }} />
                    </div>
                    <span className={`text-[9px] font-bold font-mono min-w-[28px] text-right ${isCatOver ? 'text-rose-400' : 'text-white/30'}`}>
                      {catPct.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Estado + toggle historial */}
      {groupBudget > 0 && (
        <div className="flex justify-between items-center pt-1">
          <p className={`text-[10px] font-semibold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isOver
              ? `⚠ Excedido por Bs ${(spent - groupBudget).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
              : `✓ Restan Bs ${(groupBudget - spent).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
          </p>
          <button onClick={() => setShowHist(v => !v)}
            className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors">
            Historial
            <ChevronDown size={11} className={`transition-transform duration-200 ${showHist ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Historial */}
      {showHist && groupBudget > 0 && (
        <BudgetHistory
          history={history} hex={hex}
          transactions={transactions}
          groupKey={groupKey} groupLabel={label} budget={groupBudget}
        />
      )}
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────
export default function Budget() {
  const { transactions }                 = useTransactions();
  const { budgets, saveBudget, loading } = useBudget();
  const [globalModal, setGlobalModal]    = useState(null);

  const groups = TX_GROUPS.filter(g => g.value !== 'ingresos');

  // Mapear presupuestos totales calculados por grupo
  const groupBudgetsMap = useMemo(() => {
    const map = {};
    groups.forEach(g => {
      const subcats = TX_CATEGORIES.filter(c => matchesGroup(c, g.value));
      if (subcats.length > 0) {
        map[g.value] = subcats.reduce((acc, cat) => {
          const val = budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || 0);
          return acc + Number(val);
        }, 0);
      } else {
        map[g.value] = Number(budgets[g.value] || 0);
      }
    });
    return map;
  }, [groups, budgets]);

  const monthlyByGroup = useMemo(() => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const map   = {};
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      const d = parseLocal(tx.date);
      if (d >= start && d <= end) {
        const key = tx.parentCategory || tx.group || 'otros';
        map[key]  = (map[key] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions]);

  const weeklyByGroup = useMemo(() => {
    const now   = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    const map   = {};
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      const d = parseLocal(tx.date);
      if (d >= start) {
        const key = tx.parentCategory || tx.group || 'otros';
        map[key]  = (map[key] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions]);

  const totalBudget = Object.values(groupBudgetsMap).reduce((a, b) => a + b, 0);
  const totalSpentM = Object.values(monthlyByGroup).reduce((a, b) => a + b, 0);
  const totalSpentW = Object.values(weeklyByGroup).reduce((a, b) => a + b, 0);
  const overallPct  = totalBudget > 0 ? (totalSpentM / totalBudget) * 100 : 0;

  // Historial global últimos 5 meses
  const globalHistory = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const idx   = now.getMonth() - (4 - i);
      const year  = now.getFullYear() + Math.floor(idx / 12);
      const month = ((idx % 12) + 12) % 12;
      const results = groups.map(({ value: key }) => {
        const budget = groupBudgetsMap[key] || 0;
        const spent  = getSpentInMonth(transactions, key, year, month);
        return budget > 0 ? spent <= budget : null;
      }).filter(r => r !== null);
      const passed = results.filter(Boolean).length;
      const total  = results.length;
      return { label: MONTHS_ES[month], year, month, passed, total, allGood: total > 0 && passed === total };
    });
  }, [transactions, groupBudgetsMap, groups]);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-white/40 text-sm animate-pulse">Cargando presupuesto...</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">

      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Presupuesto</h1>
        <p className="text-white/40 text-xs mt-0.5">
          {new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Resumen global */}
      <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
        <div className="flex justify-between text-xs text-white/50">
          <span>Gastado este mes</span>
          <span>
            <span className={overallPct > 100 ? 'text-rose-400 font-bold' : 'text-white/70'}>
              Bs {totalSpentM.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </span>
            {totalBudget > 0 && (
              <span className="text-white/30"> / Bs {totalBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
            )}
          </span>
        </div>
        <Bar pct={overallPct} color="bg-teal-500" warn={overallPct > 100} />
        <div className="flex justify-between text-[10px] text-white/30">
          <span>Semana: Bs {totalSpentW.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
          {totalBudget > 0 && <span>{overallPct.toFixed(0)}% del presupuesto total</span>}
        </div>

        {/* Historial global clickeable */}
        {totalBudget > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide mb-2">
              Cumplimiento global — toca para ver detalle
            </p>
            <div className="flex gap-2">
              {globalHistory.map((h, i) => (
                <button key={i} type="button"
                  onClick={() => setGlobalModal({ ...h, groups, groupBudgetsMap, transactions })}
                  className="flex-1 flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition-all"
                  style={{
                    padding: '0.4rem 0.2rem', borderRadius: '0.75rem',
                    background: h.total === 0 ? 'rgba(255,255,255,0.03)'
                      : h.allGood ? 'rgba(16,185,129,0.08)'
                      : h.passed > 0 ? 'rgba(234,179,8,0.08)' : 'rgba(244,63,94,0.08)',
                    border: `1px solid ${h.total === 0 ? 'rgba(255,255,255,0.05)'
                      : h.allGood ? 'rgba(16,185,129,0.2)'
                      : h.passed > 0 ? 'rgba(234,179,8,0.2)' : 'rgba(244,63,94,0.2)'}`,
                  }}>
                  <span style={{ fontSize: '1rem', filter: h.total === 0 ? 'grayscale(1) opacity(0.3)' : undefined }}>
                    {h.total === 0 ? '○' : h.allGood ? '✅' : h.passed > 0 ? '⚠️' : '❌'}
                  </span>
                  <span className="text-[8px] text-white/30">{h.label}</span>
                  {h.total > 0 && (
                    <span className="text-[8px] font-mono font-bold" style={{
                      color: h.allGood ? '#10b981' : h.passed > 0 ? '#eab308' : '#f43f5e',
                    }}>
                      {h.passed}/{h.total}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cards por grupo */}
      <div className="space-y-3">
        {groups.map(({ value: key, label }) => {
          const groupSubcats = TX_CATEGORIES.filter(c => matchesGroup(c, key));
          return (
            <BudgetCard key={key} groupKey={key} label={label}
              transactions={transactions}
              subcategories={groupSubcats}
              budgets={budgets}
              monthlySpent={monthlyByGroup[key] || 0}
              weeklySpent={weeklyByGroup[key] || 0}
              onSave={saveBudget}
            />
          );
        })}
      </div>

      {/* Modal global */}
      {globalModal && (
        <GlobalMonthDetailModal data={globalModal} onClose={() => setGlobalModal(null)} />
      )}
    </div>
  );
}