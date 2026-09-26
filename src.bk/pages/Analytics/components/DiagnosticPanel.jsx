// src/pages/Analytics/components/DiagnosticPanel.jsx
import { Lightbulb } from 'lucide-react';

export default function DiagnosticPanel({ insights }) {
  return (
    <div className="bg-brand-card rounded-2xl border border-white/5 p-4 space-y-3 analytics-card">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-yellow-400" />
        <h3 className="font-bold text-sm">Diagnóstico financiero</h3>
      </div>
      {insights.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="text-base leading-none">{tip.icon}</span>
          <p className={`${tip.color} leading-snug`}>{tip.msg}</p>
        </div>
      ))}
    </div>
  );
}
