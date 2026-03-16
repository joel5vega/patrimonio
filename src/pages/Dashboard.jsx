import { TrendingUp, TrendingDown, Bell, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TransactionItem from '../components/TransactionItem';
import SummaryCard from '../components/SummaryCard';

const Dashboard = () => {
  const { totalValue, totalPnl, transactions } = useApp();
  const navigate = useNavigate();
  const isPositive = totalPnl >= 0;
  const usdValue = (totalValue / 6.96).toFixed(0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pt-2">
        <div>
          <p className="text-white/40 text-sm">Bienvenido</p>
          <h1 className="text-xl font-bold">PatrimonioApp</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/bank-import')} className="bg-brand-card p-2 rounded-xl border border-white/10 text-brand-teal">
            <Mail size={20} />
          </button>
          <button className="bg-brand-card p-2 rounded-xl border border-white/10 text-white/60">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 rounded-3xl shadow-xl shadow-teal-900/40">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Patrimonio Total</p>
        <h2 className="text-4xl font-black mb-1">Bs {totalValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</h2>
        <p className="text-white/60 text-sm mb-4">≈ ${parseInt(usdValue).toLocaleString()} USD</p>
        <div className={`flex items-center gap-2 text-sm font-semibold w-fit px-3 py-1 rounded-full bg-black/20`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{isPositive ? '+' : ''}Bs {totalPnl.toLocaleString('es-BO', { minimumFractionDigits: 2 })} P&L total</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Activos" value="Bs 52,150" color="text-emerald-400" />
        <SummaryCard label="Pasivos" value="-Bs 6,870" color="text-rose-400" />
      </div>

      {/* Recent */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-base">Actividad Reciente</h3>
          <button onClick={() => navigate('/transactions')} className="text-brand-teal text-sm font-semibold">Ver todas</button>
        </div>
        <div className="space-y-2">
          {transactions.slice(0, 3).map((tx) => (
            <TransactionItem key={tx.id} {...tx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
