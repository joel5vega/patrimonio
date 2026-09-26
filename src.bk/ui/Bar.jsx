// src/ui/Bar.jsx
export default function Bar({ pct, color = 'bg-brand-teal', warn = false }) {
  return (
    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${warn ? 'bg-rose-500' : color}`}
        style={{ width: `${Math.min(pct || 0, 100)}%` }}
      />
    </div>
  );
}
