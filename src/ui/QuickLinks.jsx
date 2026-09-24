// src/ui/QuickLinks.jsx
//
// Accesos rápidos a pantallas que existen pero NO viven en el tab bar
// principal (Riesgo, Activos Manuales, Trading). Pensado para usarse desde
// el Dashboard. Totalmente Tailwind + tokens — sin CSS propio.
import { useNavigate } from 'react-router-dom';

function QuickLinkCard({ to, icon: Icon, label, accent = 'brand-teal' }) {
  const navigate = useNavigate();
  const accentVar = `var(--color-${accent})`;

  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-1 min-w-[110px] flex-col items-center gap-2 rounded-lg
                 bg-brand-card border border-white/5 px-3 py-4
                 hover:border-white/15 active:scale-[0.98] transition"
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${accentVar} 18%, transparent)` }}
      >
        <Icon size={18} style={{ color: accentVar }} />
      </span>
      <span className="text-xs text-muted-light">{label}</span>
    </button>
  );
}

export default function QuickLinks({ items }) {
  if (!items?.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map((item) => (
        <QuickLinkCard key={item.to} {...item} />
      ))}
    </div>
  );
}
