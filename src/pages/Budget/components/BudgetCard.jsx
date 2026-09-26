// src/pages/Budget/components/BudgetCard.jsx
import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Edit2, X, Save, ChevronDown } from 'lucide-react';
import { GROUP_COLORS, GROUP_TEXT, GROUP_HEX } from '../../../features/transactions/constants/groupPalette';
import Bar from '../../../ui/Bar';
import { parseLocal } from '../../../utils/filterByPeriod';
import { DEFAULT_SUBCAT_BUDGETS, getMonthlyAvg, getBudgetHistory } from '../budgetHelpers';
import BudgetHistory from './BudgetHistory';

export default function BudgetCard({ groupKey, label, transactions, subcategories, budgets, weeklySpent, monthlySpent, onSave }) {
  const [editing, setEditing] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [inputs, setInputs] = useState({});
  const [singleInput, setSingleInput] = useState('');

  const subcatSpentMap = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const map = {};
    transactions
      .filter((tx) => tx.type === 'expense' && (tx.parentCategory || tx.group || 'otros') === groupKey)
      .forEach((tx) => {
        const d = parseLocal(tx.date);
        if (d >= start && d <= end) {
          const cat = tx.category || 'otros';
          map[cat] = (map[cat] || 0) + tx.amount;
        }
      });
    return map;
  }, [transactions, groupKey]);

  const groupBudget = useMemo(() => {
    if (subcategories.length === 0) return Number(budgets[groupKey] || 0);
    return subcategories.reduce((acc, cat) => {
      const val = budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || 0);
      return acc + Number(val);
    }, 0);
  }, [subcategories, budgets, groupKey]);

  const avg = getMonthlyAvg(transactions, groupKey, 3);
  const spent = monthlySpent;
  const pct = groupBudget > 0 ? (spent / groupBudget) * 100 : 0;
  const isOver = groupBudget > 0 && spent > groupBudget;
  const hex = GROUP_HEX[groupKey] || 'rgba(255,255,255,0.3)';

  const history = useMemo(() => getBudgetHistory(transactions, groupKey, groupBudget, 5), [transactions, groupKey, groupBudget]);
  const metCount = history.filter((h) => h.ok === true).length;
  const missCount = history.filter((h) => h.ok === false).length;

  const handleStartEdit = () => {
    if (subcategories.length > 0) {
      const initialInputs = {};
      subcategories.forEach((cat) => {
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
      subcategories.forEach((cat) => {
        if (inputs[cat.value] !== undefined) newBudgets[cat.value] = Number(inputs[cat.value] || 0);
      });
      onSave(newBudgets);
    } else {
      onSave(groupKey, singleInput);
    }
    setEditing(false);
  };

  return (
    <div className="bg-[#1f1f1f] rounded-lg border border-white/5 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${GROUP_TEXT[groupKey] || 'text-[#eeeeee]/60'}`}>{label}</span>
          {groupBudget > 0 && (
            <div className="flex items-center gap-0.5">
              {metCount > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '999px', background: hex + '22', color: hex, border: `1px solid ${hex}44`, fontFamily: 'JetBrains Mono,monospace' }}>
                  ✓ {metCount}
                </span>
              )}
              {missCount > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '999px', background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)', fontFamily: 'JetBrains Mono,monospace' }}>
                  ✗ {missCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isOver ? <AlertTriangle size={13} className="text-rose-400" /> : groupBudget > 0 ? <CheckCircle size={13} className="text-emerald-400" /> : null}
          <button onClick={() => (editing ? setEditing(false) : handleStartEdit())} className="p-1 rounded-lg bg-[#1f1f1f]/5 text-[#eeeeee]/40 hover:text-[#eeeeee]/70 transition-colors">
            {editing ? <X size={12} /> : <Edit2 size={12} />}
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-[#1f1f1f]/5 rounded-xl p-3 space-y-2 border border-[#262626]">
          <p className="text-[10px] text-[#eeeeee]/40 font-bold uppercase tracking-wide">
            {subcategories.length > 0 ? 'Ajustar subcategorías' : 'Ajustar Presupuesto Total'}
          </p>

          {subcategories.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {subcategories.map((cat) => (
                <div key={cat.value} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#eeeeee]/70 flex items-center gap-1.5"><span>{cat.emoji || '📦'}</span> {cat.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#eeeeee]/40 text-[10px]">Bs</span>
                    <input type="number" value={inputs[cat.value] ?? ''} onChange={(e) => setInputs({ ...inputs, [cat.value]: e.target.value })}
                      className="w-20 bg-[#1f1f1f]/10 rounded-lg px-2 py-1 text-xs text-[#eeeeee] text-right outline-none focus:ring-1 focus:ring-brand-teal/50" placeholder="0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#eeeeee]/70">Monto total grupo</span>
              <div className="flex items-center gap-1">
                <span className="text-[#eeeeee]/40 text-[10px]">Bs</span>
                <input type="number" value={singleInput} onChange={(e) => setSingleInput(e.target.value)}
                  className="w-24 bg-[#1f1f1f]/10 rounded-lg px-2 py-1 text-xs text-[#eeeeee] text-right outline-none focus:ring-1 focus:ring-brand-teal/50" placeholder="0" />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-white/5">
            <span className="text-xs text-[#eeeeee]/50">
              Total: <strong className="text-[#eeeeee] font-mono">
                Bs {subcategories.length > 0 ? Object.values(inputs).reduce((a, b) => a + Number(b || 0), 0) : Number(singleInput || 0)}
              </strong>
            </span>
            <button onClick={handleSave} className="bg-[#2b7fff] text-[#eeeeee] px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
              <Save size={12} /> Guardar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Bar pct={groupBudget > 0 ? pct : 0} color={GROUP_COLORS[groupKey] || 'bg-[#1f1f1f]/20'} warn={isOver} />
        <span className={`text-xs font-bold min-w-[36px] text-right ${isOver ? 'text-rose-400' : 'text-[#eeeeee]/50'}`}>
          {groupBudget > 0 ? `${pct.toFixed(0)}%` : '—'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px] text-[#eeeeee]/40">
        <div><p>Este mes</p><p className="text-[#eeeeee]/70 font-semibold font-mono">Bs {spent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</p></div>
        <div><p>Presupuesto</p><p className="text-[#eeeeee]/70 font-semibold font-mono">Bs {groupBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</p></div>
        <div><p>Promedio 3M</p><p className={`font-semibold font-mono ${avg > (groupBudget || Infinity) ? 'text-rose-400' : 'text-[#eeeeee]/70'}`}>Bs {avg.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</p></div>
      </div>

      {!editing && subcategories.length > 0 && (
        <div className="pt-2 space-y-2 border-t border-white/5">
          {subcategories.map((cat) => {
            const subcatBudget = Number(budgets[cat.value] !== undefined ? budgets[cat.value] : (DEFAULT_SUBCAT_BUDGETS[cat.value] || 0));
            const subcatSpent = subcatSpentMap[cat.value] || 0;
            if (!subcatBudget && !subcatSpent) return null;
            const catPct = subcatBudget > 0 ? (subcatSpent / subcatBudget) * 100 : 0;
            const isCatOver = subcatBudget > 0 && subcatSpent > subcatBudget;
            return (
              <div key={cat.value} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#eeeeee]/70"><span>{cat.emoji || '•'}</span> {cat.label}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={`font-semibold ${isCatOver ? 'text-rose-400' : 'text-[#eeeeee]/80'}`}>Bs {subcatSpent.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
                    <span className="text-[#eeeeee]/30 text-[10px]">/ Bs {subcatBudget.toLocaleString('es-BO', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                {subcatBudget > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#1f1f1f]/5 rounded overflow-hidden">
                      <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.min(catPct, 100)}%`, background: isCatOver ? '#f43f5e' : hex }} />
                    </div>
                    <span className={`text-[9px] font-bold font-mono min-w-[28px] text-right ${isCatOver ? 'text-rose-400' : 'text-[#eeeeee]/30'}`}>{catPct.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {groupBudget > 0 && (
        <div className="flex justify-between items-center pt-1">
          <p className={`text-[10px] font-semibold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isOver
              ? `⚠ Excedido por Bs ${(spent - groupBudget).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
              : `✓ Restan Bs ${(groupBudget - spent).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
          </p>
          <button onClick={() => setShowHist((v) => !v)} className="flex items-center gap-1 text-[10px] text-[#eeeeee]/30 hover:text-[#eeeeee]/60 transition-colors">
            Historial <ChevronDown size={11} className={`transition-transform duration-200 ${showHist ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {showHist && groupBudget > 0 && (
        <BudgetHistory history={history} hex={hex} transactions={transactions} groupKey={groupKey} groupLabel={label} budget={groupBudget} />
      )}
    </div>
  );
}
