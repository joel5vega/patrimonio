import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TransactionItem = ({ title, subtitle, amount, type }) => {
  const isUp = type === 'up';
  return (
    <div className="bg-[#1f1f1f] p-4 rounded-lg flex items-center justify-between border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {isUp ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-[#eeeeee]/40">{subtitle}</p>
        </div>
      </div>
      <p className={`font-bold text-sm ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{amount}</p>
    </div>
  );
};

export default TransactionItem;
