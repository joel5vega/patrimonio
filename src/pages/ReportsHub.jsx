import { useState } from 'react';
import { Sparkles, FileText, BarChart2, RefreshCw, Search, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TABS = ['Mañana', 'Ideas', 'Standouts'];
const TAB_TYPES = ['market', 'ideas', 'standouts'];

const iconMap = {
  market: Sparkles,
  ideas: FileText,
  standouts: BarChart2,
};

const ReportsHub = () => {
  const { reports, loadingReports, refreshReports } = useApp();
  const [activeTab, setActiveTab] = useState(0);

  const filtered = reports.filter((r) => r.type === TAB_TYPES[activeTab]);

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-2xl font-bold">Reportes IA</h1>
        <Search size={20} className="text-white/40" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === i ? 'bg-brand-teal text-black' : 'bg-brand-card text-white/40 border border-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loadingReports ? (
        <div className="text-center text-white/30 py-16 text-sm">Generando reportes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm">Sin reportes disponibles</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const Icon = iconMap[report.type] || Sparkles;
            return (
              <div key={report.id} className="bg-brand-card p-5 rounded-3xl border border-white/5 relative active:scale-[0.98] transition-transform">
                {report.unread && (
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-brand-teal rounded-full shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                )}
                <div className="flex gap-4 mb-3">
                  <div className="bg-brand-teal/10 p-3 rounded-2xl text-brand-teal shrink-0">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold">{report.title}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-white/30" />
                      <p className="text-[10px] font-bold text-white/30 uppercase">{report.date}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed line-clamp-3">{report.summary}</p>
                {report.assets && report.assets.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {report.assets.map((a) => (
                      <span key={a} className="bg-white/5 text-white/50 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={refreshReports}
        className="fixed bottom-24 right-4 bg-brand-teal text-black p-4 rounded-2xl shadow-2xl shadow-teal-900/50 active:scale-95 transition-transform"
      >
        <RefreshCw size={22} />
      </button>
    </div>
  );
};

export default ReportsHub;
