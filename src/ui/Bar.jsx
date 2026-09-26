// src/ui/Bar.jsx
export default function Bar({ pct, color = 'bg-[#2b7fff]', warn = false }) {
  return (
    <div className="flex-1 h-2.5 bg-[#1f1f1f]/5 rounded overflow-hidden">
      <div
        className={`h-full rounded transition-all duration-500 ${warn ? 'bg-rose-500' : color}`}
        style={{ width: `${Math.min(pct || 0, 100)}%` }}
      />
    </div>
  );
}
