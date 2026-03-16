import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPES = ['Compra', 'Venta', 'Transferencia', 'Dividendo'];

const NewTransaction = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'Compra', asset: '', quantity: '', price: '', date: '', note: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: guardar en Firestore via Cloud Function
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 space-y-5 max-w-md mx-auto pb-10">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="bg-brand-card p-2 rounded-xl border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Nueva Transacción</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  form.type === t ? 'bg-brand-teal text-black border-brand-teal' : 'bg-brand-card text-white/50 border-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {[
          { label: 'Activo / Símbolo', name: 'asset', placeholder: 'BTC, VOO, TSLA...' },
          { label: 'Cantidad', name: 'quantity', placeholder: '0.5', type: 'number' },
          { label: 'Precio (USD)', name: 'price', placeholder: '68500', type: 'number' },
          { label: 'Fecha', name: 'date', type: 'date' },
          { label: 'Nota', name: 'note', placeholder: 'Opcional...' },
        ].map(({ label, name, placeholder, type = 'text' }) => (
          <div key={name}>
            <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">{label}</label>
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 px-4 text-sm focus:border-brand-teal outline-none transition-colors"
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-brand-teal text-black py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform mt-4"
        >
          <Check size={20} strokeWidth={3} />
          Guardar Transacción
        </button>
      </form>
    </div>
  );
};

export default NewTransaction;
