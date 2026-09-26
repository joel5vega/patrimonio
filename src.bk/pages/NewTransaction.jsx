import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPES = ['Compra', 'Venta', 'Transferencia', 'Dividendo'];

const NewTransaction = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [form, setForm] = useState({ 
    type: 'Compra', 
    asset: '', 
    quantity: '', 
    price: '', 
    currency: 'BOB',
    date: new Date().toISOString().split('T')[0],
    note: '' 
  });
  const priceRef = useRef(null);

  useEffect(() => {
    if (isOpen) priceRef.current?.focus();
  }, [isOpen]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.asset || !form.quantity || !form.price) return;
    // TODO: guardar en Firestore via Cloud Function
    navigate(-1);
  };

  const closeModal = () => setIsOpen(false);

  if (!isOpen) navigate(-1);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40" 
        onClick={closeModal}
      />
      
      {/* Modal Full Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-md bg-brand-dark rounded-2xl p-6 space-y-5 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button 
              onClick={closeModal} 
              className="bg-brand-card p-2 rounded-xl border border-white/10"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">New Transacción</h1>
            <button 
              onClick={closeModal}
              className="bg-brand-card p-2 rounded-xl border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
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
                      form.type === t 
                        ? 'bg-brand-teal text-black border-brand-teal' 
                        : 'bg-brand-card text-white/50 border-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Activo / Símbolo', name: 'asset', placeholder: 'BTC, VOO, TSLA...' },
              { label: 'Cantidad', name: 'quantity', placeholder: '0.5', type: 'number', step: '0.0001' },
              { 
                label: 'Precio', 
                name: 'price', 
                placeholder: '68500', 
                type: 'number', 
                step: '0.01',
                ref: priceRef
              },
              { label: 'Fecha', name: 'date', type: 'date' },
              { label: 'Nota', name: 'note', placeholder: 'Opcional...' },
            ].map(({ label, name, placeholder, type = 'text', step, ref }) => (
              <div key={name}>
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">{label}</label>
                <input
                  ref={ref}
                  type={type}
                  name={name}
                  value={form[name]}
                  step={step}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 px-4 text-sm focus:border-brand-teal outline-none transition-colors"
                />
              </div>
            ))}

            {/* Currency display */}
            <div className="pt-2 text-right">
              <span className="text-sm text-white/50">BOB</span>
            </div>

            <button
              type="submit"
              disabled={!form.asset || !form.quantity || !form.price}
              className="w-full bg-brand-teal text-black py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={20} strokeWidth={3} />
              Guardar Transacción
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default NewTransaction;