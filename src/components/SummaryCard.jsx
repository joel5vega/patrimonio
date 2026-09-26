const SummaryCard = ({ label, value, color = 'text-[#eeeeee]' }) => (
  <div className="bg-[#1f1f1f] p-4 rounded-lg border border-white/5 flex flex-col gap-1">
    <p className={`text-[10px] uppercase font-bold tracking-wider ${color}`}>{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export default SummaryCard;
