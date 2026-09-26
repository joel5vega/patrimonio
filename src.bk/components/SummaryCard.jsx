const SummaryCard = ({ label, value, color = 'text-white' }) => (
  <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
    <p className={`text-[10px] uppercase font-bold tracking-wider ${color}`}>{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export default SummaryCard;
