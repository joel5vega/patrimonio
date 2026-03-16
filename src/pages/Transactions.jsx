import { useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TransactionItem from '../components/TransactionItem';

const FILTERS = ['Todos', 'Compra', 'Transferencia', 'Dividendo'];

const Transactions = () => {
  const { transactions } = useApp();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filtered = transactions.filter((tx) => {
    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Compra') return tx.category === 'buy';
    if (activeFilter === 'Transferencia') return tx.category === 'transfer';
    if (activeFilter === 'Dividendo') return tx.category === 'dividend';
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <Filter size={20} className="text-white/40" />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeFilter === f ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/50 border border-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((tx) => (
          <TransactionItem key={tx.id} {...tx} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-8 text-sm">Sin movimientos</p>
        )}
      </div>

      <button
        onClick={() => navigate('/new-transaction')}
        className="fixed bottom-24 right-4 bg-brand-teal text-black p-4 rounded-2xl shadow-2xl shadow-teal-900/50 active:scale-95 transition-transform"
      >
        <Plus size={26} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Transactions;
