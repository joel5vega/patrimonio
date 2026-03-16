import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const RiskMetrics = () => {
  const navigate = useNavigate();
  const { riskData, loadingRisk } = useApp();

  if (loadingRisk) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white/40 text-sm">
      Calculando riesgo...
    </div>
  );

  const hhiPct = Math.min(riskData.hhi * 100, 100);
  const riskColor = riskData.riskScore < 33 ? 'text-emerald-400' : riskData.riskScore < 66 ? 'text-yellow-400' : 'text-rose-400';
  const riskLabel = riskData.riskScore < 33 ? 'Low Risk' : riskData.riskScore < 66 ? 'Medium Risk' : 'High Risk';
  const riskBg = riskData.riskScore < 33 ? 'bg-emerald-500/10 text-emerald-400' : riskData.riskScore < 66 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-rose-500/10 text-rose-400';

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button onClick={() => navigate(-1)} className="bg-brand-card p-2 rounded-xl border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Portfolio Risk</h1>
          <p className="text-brand-teal text-[10px] font-medium uppercase tracking-wider">Análisis en tiempo real</p>
        </div>
        <Info size={20} className="ml-auto text-white/30" />
      </div>

      {/* Exposición */}
      <section className="mb-6">
        <p className="text-brand-teal text-[10px] font-bold uppercase tracking-widest mb-3">Exposición Efectiva</p>
        <div className="bg-brand-card p-5 rounded-3xl border border-white/5 space-y-4">
          <div>
            <p className="text-xs text-white/40 mb-1">Total Spot USD</p>
            <p className="text-3xl font-black font-mono">${riskData.totalSpotUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-white/30 mt-0.5">≈ Bs {(riskData.totalSpotUSD * 6.96).toLocaleString('es-BO', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-white/40 mb-1">🔒 Capital Reservado (Órdenes activas)</p>
            <p className="text-2xl font-bold font-mono">${riskData.reservedCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </section>

      {/* HHI */}
      <section className="mb-6">
        <p className="text-brand-teal text-[10px] font-bold uppercase tracking-widest mb-3">Métricas de Riesgo</p>
        <div className="space-y-4">
          <div className="bg-brand-card p-5 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-semibold">Concentración (HHI)</p>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${riskBg}`}>{riskLabel}</span>
            </div>
            <p className="text-5xl font-black text-center mb-5">{riskData.hhi.toFixed(3)}</p>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${hhiPct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] font-bold text-white/30 uppercase">
              <span>Diversificado</span>
              <span>Concentrado</span>
            </div>
          </div>

          <div className="bg-brand-card p-5 rounded-3xl border border-white/5">
            <p className="text-xs font-semibold mb-3">Composite Risk Score</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className={`text-5xl font-black ${riskColor}`}>{riskData.riskScore}</span>
              <span className="text-white/20 font-bold">/ 100</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1,2,3,4,5].map(i => {
                const filled = i <= Math.ceil(riskData.riskScore / 20);
                return <div key={i} className={`h-1.5 rounded-full ${filled ? 'bg-brand-teal' : 'bg-white/5'}`} />;
              })}
            </div>
            <p className="text-[10px] italic text-white/30 mt-3 text-center">
              Top 3 concentración: {riskData.top3Concentration}%
            </p>
          </div>
        </div>
      </section>

      {/* Over-exposed */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <p className="text-brand-teal text-[10px] font-bold uppercase tracking-widest">Sobre-Exposición</p>
          <span className="bg-rose-500/10 text-rose-400 text-[9px] font-black px-2 py-1 rounded-full uppercase">Umbral &gt; 70%</span>
        </div>
        <div className="space-y-2">
          {riskData.overExposed.length === 0 ? (
            <div className="bg-brand-card p-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400"><CheckCircle2 size={20} /></div>
              <p className="text-xs font-medium">Ningún activo supera el umbral de seguridad</p>
            </div>
          ) : (
            riskData.overExposed.map((asset, i) => (
              <div key={i} className="bg-brand-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400"><AlertTriangle size={20} /></div>
                  <p className="font-bold">{asset.asset}</p>
                </div>
                <p className="font-black text-rose-400">{asset.weight}%</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default RiskMetrics;
