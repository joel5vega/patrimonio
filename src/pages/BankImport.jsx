import { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const BankImport = () => {
  const { bankEmails, importBankEmail } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');

  const filtered = bankEmails.filter((e) => (tab === 'pending' ? !e.imported : e.imported));

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 space-y-5 max-w-md mx-auto pb-10">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="bg-brand-card p-2 rounded-xl border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Importar del Banco</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-brand-card rounded-2xl p-1 border border-white/5">
        {['pending', 'imported'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-brand-teal text-black' : 'text-white/40'
            }`}
          >
            {t === 'pending' ? 'Pendientes' : 'Importados'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-10 text-sm">
            {tab === 'pending' ? 'No hay correos pendientes' : 'Ningún correo importado aún'}
          </p>
        )}
        {filtered.map((email) => (
          <div key={email.id} className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full">
                  {email.type}
                </span>
                <p className="font-semibold mt-1">{email.concept}</p>
                <p className="text-xs text-white/40">{email.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-400">{email.amount}</p>
                <div className={`flex items-center gap-1 text-[10px] mt-1 justify-end ${email.status === 'Success' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {email.status === 'Success' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  <span>{email.status}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-white/40 border-t border-white/5 pt-2 space-y-1">
              <p>De: <span className="text-white/70">{email.owner}</span></p>
              <p>Para: <span className="text-white/70">{email.targetOwner}</span></p>
              <p>Ref: <span className="text-white/70">{email.reference}</span></p>
            </div>

            {!email.imported && (
              <button
                onClick={() => importBankEmail(email.id)}
                className="w-full bg-brand-teal/10 text-brand-teal border border-brand-teal/30 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Download size={16} />
                Importar Transacción
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankImport;
