import { useApp } from '../context/AppContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = {
  BTC: 'bg-orange-500', ETH: 'bg-indigo-500', SOL: 'bg-purple-500',
  BNB: 'bg-yellow-500', XRP: 'bg-blue-400', USDT: 'bg-blue-200',
};

const TypeBadge = ({ type }) => (
  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
    type === 'crypto' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
  }`}>{type === 'crypto' ? 'Crypto' : 'ETF'}</span>
);

const PieSVG = ({ data, size = 130 }) => {
  const total = data.reduce((s, d) => s + d.valueUSD, 0);
  if (total === 0) return null;
  let cumAngle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2, r = size / 2 - 8, ri = r * 0.52;
  const slices = data.map((d) => {
    const angle = (d.valueUSD / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle), y2 = cy + r * Math.sin(cumAngle);
    const xi1 = cx + ri * Math.cos(cumAngle), yi1 = cy + ri * Math.sin(cumAngle);
    const xi2 = cx + ri * Math.cos(cumAngle - angle), yi2 = cy + ri * Math.sin(cumAngle - angle);
    const large = angle > Math.PI ? 1 : 0;
    return {
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${large} 0 ${xi2} ${yi2} Z`,
      color: d.color,
    };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
    </svg>
  );
};

const Portfolio = () => {
  const {
    cryptoAssets, inversionPositions,
    totalCryptoUSD, totalInversionUSD,
    pieData, binanceSnap, loading, totalInversionPnl,
  } = useApp();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const bs            = binanceSnap?.snapshot || {};
  const totalUSD      = totalCryptoUSD + totalInversionUSD;
  const reservedBUY   = bs.reservedCapitalUSD ?? 0;   // USDT en órdenes BUY
  const pendingSELL   = bs.pendingSellUSD ?? 0;        // crypto en órdenes SELL
  const grossExposure = bs.grossExposureUSD ?? 0;      // spot + BUY
  const riskScore     = bs.riskMetrics?.riskScore ?? 0;
  const riskColor     = riskScore >= 70 ? 'text-rose-400' : riskScore >= 40 ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Mi Portafolio</h1>

      {/* ── Donut ─────────────────────────────────────── */}
      <div className="bg-brand-card rounded-3xl border border-white/5 p-5">
        <p className="text-xs font-bold text-white/40 uppercase mb-4">Distribución por tipo</p>
        <div className="flex items-center gap-5">
          <PieSVG data={pieData} size={130} />
          <div className="flex-1 space-y-3">
            {pieData.map((d) => (
              <div key={d.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-semibold">{d.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${d.valueUSD.toFixed(0)}</p>
                  <p className="text-[10px] text-white/40">{((d.valueUSD / totalUSD) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10 flex justify-between items-end">
              <p className="text-xs text-white/40">Total USD</p>
              <p className="text-lg font-black">${totalUSD.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Binance exposición desglosada ─────────────── */}
      <div className="bg-brand-card rounded-3xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Binance · Exposición</p>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/5 ${riskColor}`}>
            Riesgo {riskScore}/100
          </span>
        </div>

        {/* Barra de composición */}
        <div className="mb-4">
          <div className="flex rounded-full overflow-hidden h-2.5 mb-2">
            <div className="bg-orange-500" style={{ width: `${(totalCryptoUSD / grossExposure) * 100}%` }} />
            <div className="bg-yellow-400" style={{ width: `${(reservedBUY / grossExposure) * 100}%` }} />
            <div className="bg-blue-400"   style={{ width: `${(pendingSELL / grossExposure) * 100}%` }} />
          </div>
          <div className="flex gap-3 text-[10px] text-white/50">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"/>Spot</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>Órd. BUY</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Órd. SELL</span>
          </div>
        </div>

        {/* Tabla de valores */}
        <div className="space-y-0">
          {[
            { label: 'Saldo líquido spot',        value: `$${totalCryptoUSD.toFixed(2)}`,  sub: 'Tu dinero disponible',           color: 'text-white' },
            { label: '+ Capital en órdenes BUY',  value: `$${reservedBUY.toFixed(2)}`,     sub: 'USDT comprometido en compras',   color: 'text-yellow-400' },
            { label: '+ Crypto en órdenes SELL',  value: `$${pendingSELL.toFixed(2)}`,     sub: 'Valor de crypto en ventas',      color: 'text-blue-400' },
            { label: '= Exposición total',        value: `$${grossExposure.toFixed(2)}`,   sub: 'Si todas las órdenes se ejecutan', color: 'text-emerald-400', bold: true },
          ].map((row) => (
            <div key={row.label} className={`flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 ${row.bold ? 'pt-3' : ''}`}>
              <div>
                <p className={`text-xs font-semibold ${row.bold ? 'text-white font-bold' : 'text-white/70'}`}>{row.label}</p>
                <p className="text-[10px] text-white/30">{row.sub}</p>
              </div>
              <p className={`text-sm font-bold ${row.color}`}>{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/40 mb-0.5">HHI</p>
            <p className="text-sm font-bold">{(bs.riskMetrics?.herfindahlIndex ?? 0).toFixed(4)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/40 mb-0.5">Top 3 conc.</p>
            <p className={`text-sm font-bold ${(bs.riskMetrics?.top3ConcentrationPct ?? 0) > 80 ? 'text-rose-400' : 'text-white'}`}>
              {(bs.riskMetrics?.top3ConcentrationPct ?? 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Crypto assets ─────────────────────────────── */}
      {cryptoAssets.filter((a) => a.netExposureUSD > 0 || a.pendingBuyUSD > 0).length > 0 && (
        <div>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">
            Crypto · Binance <span className="text-white/30 font-normal ml-1">${totalCryptoUSD.toFixed(2)} spot</span>
          </p>
          <div className="space-y-2">
            {cryptoAssets.filter((a) => a.netExposureUSD > 0 || a.pendingBuyUSD > 0).map((a) => {
              const totalExposure = a.netExposureUSD + (a.pendingBuyUSD ?? 0);
              return (
                <div key={a.id} className="bg-brand-card rounded-2xl border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${COLORS[a.symbol] || 'bg-gray-600'} flex items-center justify-center text-white font-black text-xs`}>
                        {a.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-bold">{a.symbol}</p>
                        <TypeBadge type="crypto" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Bs {(totalExposure * 6.96).toFixed(0)}</p>
                      <p className="text-xs text-white/40">${totalExposure.toFixed(2)}</p>
                      <p className="text-[10px] text-white/30">{a.weightPct.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Desglose spot + orden */}
                  {a.pendingBuyUSD > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-xl p-2 text-center">
                        <p className="text-[9px] text-white/40 mb-0.5">Spot</p>
                        <p className="text-xs font-bold text-orange-400">${a.netExposureUSD.toFixed(2)}</p>
                      </div>
                      <div className="bg-yellow-400/10 rounded-xl p-2 text-center">
                        <p className="text-[9px] text-yellow-400/70 mb-0.5">Orden BUY</p>
                        <p className="text-xs font-bold text-yellow-400">+${a.pendingBuyUSD.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ETF positions ─────────────────────────────── */}
      {inversionPositions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              ETFs · Admirals <span className="text-white/30 font-normal ml-1">${totalInversionUSD.toFixed(2)}</span>
            </p>
            <span className={`text-xs font-bold ${totalInversionPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              P&L: ${totalInversionPnl.toFixed(2)}
            </span>
          </div>
          <div className="space-y-2">
            {inversionPositions.map((p) => (
              <div key={p.id} className="bg-brand-card rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-[10px]">
                    {p.symbol.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-bold">{p.symbol}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <TypeBadge type="etf" />
                      <span className="text-[10px] text-white/40">{p.quantity}u · ${p.currentPrice}</span>
                    </div>
                    {p.tp > 0 && <p className="text-[9px] text-emerald-400/60 mt-0.5">TP ${p.tp}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">Bs {(p.valueUSD * 6.96).toFixed(0)}</p>
                  <p className="text-xs text-white/40">${p.valueUSD.toFixed(2)}</p>
                  <div className={`flex items-center justify-end gap-0.5 text-xs font-bold ${p.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.unrealizedPL >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    ${p.unrealizedPL?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
