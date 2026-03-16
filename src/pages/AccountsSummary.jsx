import { ArrowLeft, Landmark, TrendingUp, Wallet, Plus, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const accountIcons = {
  bank: Landmark,
  crypto: TrendingUp,
  cash: Wallet,
};

const AccountsSummary = () => {
  const navigate = useNavigate();
  const { accounts } = useApp();

  const totalAssets = accounts.sections
    .filter((s) => !s.isLiability)
    .reduce((sum, s) => sum + s.totalBOB, 0);

  const totalLiabilities = accounts.sections
    .filter((s) => s.isLiability)
    .reduce((sum, s) => sum + s.totalBOB, 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <button onClick={() => navigate(-1)} className="bg-brand-card p-2 rounded-xl border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Mis Cuentas</h1>
        <div className="ml-auto flex gap-2">
          <button className="bg-brand-card p-2 rounded-xl border border-white/10"><Edit2 size={16} className="text-white/40" /></button>
          <button className="bg-brand-card p-2 rounded-xl border border-white/10"><Plus size={16} className="text-brand-teal" /></button>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-brand-card rounded-3xl p-5 border border-white/5 mb-6">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Activos</p>
            <p className="font-mono font-bold text-emerald-400 text-sm">
              Bs {totalAssets.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Pasivos</p>
            <p className="font-mono font-bold text-rose-400 text-sm">
              -Bs {totalLiabilities.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Neto</p>
            <p className="font-mono font-bold text-brand-teal text-sm">
              Bs {netWorth.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {accounts.sections.map((section, i) => {
          const Icon = accountIcons[section.iconType] || Landmark;
          return (
            <div key={i}>
              <div className="flex justify-between items-end mb-3 pb-2 border-b border-white/5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{section.title}</p>
                <p className={`font-mono font-bold text-sm ${section.isLiability ? 'text-rose-400' : 'text-brand-teal'}`}>
                  {section.isLiability ? '-' : ''}Bs {section.totalBOB.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-3">
                {section.items.map((item, j) => (
                  <div key={j} className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-card p-2 rounded-xl border border-white/5">
                        <Icon size={16} className="text-white/40" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.currency && (
                          <p className="text-[10px] text-white/30">{item.currency}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-bold ${item.isLiability ? 'text-rose-400' : 'text-white'}`}>
                        {item.displayValue}
                      </p>
                      {item.valueBOB && (
                        <p className="text-[10px] text-white/30">
                          Bs {item.valueBOB.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountsSummary;
