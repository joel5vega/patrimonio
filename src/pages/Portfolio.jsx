import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const STABLES = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD'];

const CRYPTO_ICONS = {
  BTC: 'currency_bitcoin', ETH: 'token', SOL: 'sunny', BNB: 'toll',
  XRP: 'water_drop', ADA: 'hexagon', LINK: 'link', DEFAULT: 'generating_tokens',
};

const TypeIcon = ({ type, symbol }) => {
  const iconMap = {
    crypto: CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT,
    etf: 'show_chart',
    manual: 'savings',
    stable: 'attach_money',
  };
  return (
    <span className="material-symbols-outlined text-xl text-primary">
      {iconMap[type] || 'account_balance'}
    </span>
  );
};

// ─── Paleta de alto contraste ────────────────────────────
const HIGH_CONTRAST_COLORS = [
  '#f97316', // naranja   - Crypto
  '#10b981', // esmeralda - USDT/Cash
  '#3b82f6', // azul      - ETFs
  '#a855f7', // violeta   - Manual 1
  '#ec4899', // rosa      - Manual 2
  '#facc15', // amarillo  - Manual 3
  '#06b6d4', // cyan      - Manual 4
  '#f43f5e', // rojo      - extra
];

const DonutChart = ({ data, totalUSD }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.valueUSD, 0);
  if (total === 0) return null;

  const SIZE    = 220;
  const CX      = SIZE / 2;
  const CY      = SIZE / 2;
  const R       = 80;
  const RI      = 52;
  const LABEL_R = R + 22;
  const MIN_PCT = 4;

  let cumAngle = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle    = (d.valueUSD / total) * 2 * Math.PI;
    const midAngle = cumAngle + angle / 2;
    const x1  = CX + R  * Math.cos(cumAngle), y1  = CY + R  * Math.sin(cumAngle);
    cumAngle += angle;
    const x2  = CX + R  * Math.cos(cumAngle), y2  = CY + R  * Math.sin(cumAngle);
    const xi1 = CX + RI * Math.cos(cumAngle), yi1 = CY + RI * Math.sin(cumAngle);
    const xi2 = CX + RI * Math.cos(cumAngle - angle), yi2 = CY + RI * Math.sin(cumAngle - angle);
    const large = angle > Math.PI ? 1 : 0;
    return {
      path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${RI} ${RI} 0 ${large} 0 ${xi2} ${yi2} Z`,
      color: d.color, label: d.label,
      pct: ((d.valueUSD / total) * 100).toFixed(1),
      lx: CX + LABEL_R * Math.cos(midAngle),
      ly: CY + LABEL_R * Math.sin(midAngle),
      lsx: CX + (R + 4)          * Math.cos(midAngle),
      lsy: CY + (R + 4)          * Math.sin(midAngle),
      lex: CX + (LABEL_R - 8)    * Math.cos(midAngle),
      ley: CY + (LABEL_R - 8)    * Math.sin(midAngle),
      midAngle,
    };
  });

  return (
    <div className="flex items-center justify-center w-full">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        {slices.map((s, i) => (
          <path key={`s-${i}`} d={s.path} fill={s.color} opacity={0.95} stroke="#0a1211" strokeWidth={2} />
        ))}
        {slices.filter((s) => parseFloat(s.pct) >= MIN_PCT).map((s, i) => {
          const anchor = Math.cos(s.midAngle) > 0 ? 'start' : 'end';
          return (
            <g key={`l-${i}`}>
              <line x1={s.lsx} y1={s.lsy} x2={s.lex} y2={s.ley} stroke={s.color} strokeWidth={1} opacity={0.5} />
              <text x={s.lx} y={s.ly - 5} textAnchor={anchor} fill={s.color}
                fontSize={8} fontWeight="700" fontFamily="Inter, sans-serif">{s.label}</text>
              <text x={s.lx} y={s.ly + 5} textAnchor={anchor} fill="rgba(148,163,184,0.8)"
                fontSize={7.5} fontFamily="JetBrains Mono, monospace">{s.pct}%</text>
            </g>
          );
        })}
        <text x={CX} y={CY - 8} textAnchor="middle" fill="rgba(100,116,139,0.9)"
          fontSize={8} fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="1">TOTAL USD</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="white"
          fontSize={18} fontWeight="700" fontFamily="JetBrains Mono, monospace">${totalUSD.toFixed(0)}</text>
      </svg>
    </div>
  );
};

const TABS = ['Todos', 'Crypto', 'ETFs', 'Manual'];

const Portfolio = () => {
  const {
    cryptoAssets, inversionPositions, manualAssets,
    totalCryptoUSD, totalInversionUSD, totalManualUSD,
    pieData, binanceSnap, loading, totalInversionPnl,
  } = useApp();

  const [activeTab, setActiveTab] = useState('Todos');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const bs            = binanceSnap?.snapshot || {};
  const totalUSD      = totalCryptoUSD + totalInversionUSD + (totalManualUSD ?? 0);
  const reservedBUY   = bs.reservedCapitalUSD ?? 0;
  const pendingSELL   = bs.pendingSellUSD ?? 0;
  const grossExposure = bs.grossExposureUSD ?? 0;
  const riskScore     = bs.riskMetrics?.riskScore ?? 0;
  const riskColor     = riskScore >= 70 ? 'text-rose-400' : riskScore >= 40 ? 'text-yellow-400' : 'text-emerald-400';

  // Build unified asset list
  const stableAssets   = cryptoAssets.filter((a) => STABLES.includes(a.symbol) && a.netExposureUSD > 0);
  const volatileAssets = cryptoAssets.filter((a) => !STABLES.includes(a.symbol) && (a.netExposureUSD > 0 || a.pendingBuyUSD > 0));

  const allAssets = [
    ...volatileAssets.map((a) => ({
      id: `crypto-${a.symbol}`, type: 'crypto', symbol: a.symbol,
      name: a.symbol, subtitle: `${a.quantity?.toFixed(4) ?? 0} ${a.symbol}`,
      price: a.currentPrice, valueUSD: a.netExposureUSD + (a.pendingBuyUSD ?? 0),
      pnl: null, pnlPct: null, weightPct: a.weightPct,
      extra: a.pendingBuyUSD > 0 ? `+$${a.pendingBuyUSD.toFixed(2)} orden` : null,
    })),
    ...stableAssets.map((a) => ({
      id: `stable-${a.symbol}`, type: 'stable', symbol: a.symbol,
      name: `${a.symbol} (Cash)`, subtitle: `${a.quantity?.toFixed(2) ?? 0} ${a.symbol}`,
      price: 1, valueUSD: a.netExposureUSD,
      pnl: null, pnlPct: null, weightPct: a.weightPct, extra: null,
    })),
    ...inversionPositions.map((p) => ({
      id: `etf-${p.id}`, type: 'etf', symbol: p.symbol,
      name: p.symbol, subtitle: `${p.quantity} u · $${p.currentPrice}`,
      price: p.currentPrice, valueUSD: p.valueUSD,
      pnl: p.unrealizedPL, pnlPct: p.avgBuyPrice > 0 ? ((p.currentPrice - p.avgBuyPrice) / p.avgBuyPrice) * 100 : null,
      weightPct: p.weightPct, extra: p.tp > 0 ? `TP $${p.tp}` : null,
    })),
    ...(manualAssets ?? []).map((a) => ({
      id: `manual-${a.id}`, type: 'manual', symbol: a.name.slice(0, 3).toUpperCase(),
      name: a.name, subtitle: a.note || (a.currency === 'BOB' ? `Bs ${a.amount?.toFixed(2)}` : `$${a.amount?.toFixed(2)}`),
      price: null, valueUSD: a.valueUSD,
      pnl: null, pnlPct: null, weightPct: null, extra: null,
    })),
  ];

  const tabFilter = { Todos: () => true, Crypto: (a) => a.type === 'crypto' || a.type === 'stable', ETFs: (a) => a.type === 'etf', Manual: (a) => a.type === 'manual' };
  const filtered = allAssets
  .filter(tabFilter[activeTab])
  .sort((a, b) => (b.valueUSD ?? 0) - (a.valueUSD ?? 0));

  return (
    <div className="space-y-5">

      {/* ── Distribution Card ── */}
      <section className="bg-card-dark rounded-2xl border border-border-dark p-5 overflow-hidden">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5">Distribución</h3>
        <div className="flex flex-col items-center gap-6">
          <DonutChart data={pieData} totalUSD={totalUSD} />
          <div className="grid grid-cols-2 gap-2.5 w-full">
            {pieData.map((d, i) => (
              <button key={`pie-leg-${i}`}
                className="flex flex-col p-3 rounded-xl bg-background-dark/50 border border-border-dark hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate">{d.label}</span>
                </div>
                <div className="flex justify-between items-baseline gap-1">
                  <span className="font-mono text-sm font-semibold">${d.valueUSD.toFixed(0)}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{totalUSD > 0 ? ((d.valueUSD / totalUSD) * 100).toFixed(1) : 0}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Binance Risk Bar ── */}
      {totalCryptoUSD > 0 && (
        <section className="bg-card-dark rounded-2xl border border-border-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Binance · Exposición</p>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/5 ${riskColor}`}>
              Riesgo {riskScore}/100
            </span>
          </div>
          {grossExposure > 0 && (
            <>
              <div className="flex rounded-full overflow-hidden h-2 mb-2">
                <div className="bg-orange-500 transition-all" style={{ width: `${(totalCryptoUSD / grossExposure) * 100}%` }} />
                <div className="bg-yellow-400 transition-all" style={{ width: `${(reservedBUY / grossExposure) * 100}%` }} />
                <div className="bg-blue-400 transition-all"   style={{ width: `${(pendingSELL / grossExposure) * 100}%` }} />
              </div>
              <div className="flex gap-4 text-[10px] text-slate-500 mb-3">
                {[['bg-orange-500','Spot'],['bg-yellow-400','Ord. BUY'],['bg-blue-400','Ord. SELL']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${c} inline-block`}/>{l}
                  </span>
                ))}
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Spot',           value: `$${totalCryptoUSD.toFixed(2)}`, color: 'text-white' },
              { label: 'Ord. BUY',       value: `$${reservedBUY.toFixed(2)}`,    color: 'text-yellow-400' },
              { label: 'Ord. SELL',      value: `$${pendingSELL.toFixed(2)}`,     color: 'text-blue-400' },
              { label: 'Exposición',     value: `$${grossExposure.toFixed(2)}`,   color: 'text-emerald-400' },
            ].map((r) => (
              <div key={r.label} className="bg-background-dark/50 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-500 mb-0.5">{r.label}</p>
                <p className={`text-sm font-bold font-mono ${r.color}`}>{r.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-background-dark/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-500 mb-0.5">HHI</p>
              <p className="text-sm font-bold font-mono">{(bs.riskMetrics?.herfindahlIndex ?? 0).toFixed(4)}</p>
            </div>
            <div className="bg-background-dark/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-500 mb-0.5">Top 3 conc.</p>
              <p className={`text-sm font-bold font-mono ${(bs.riskMetrics?.top3ConcentrationPct ?? 0) > 80 ? 'text-rose-400' : 'text-white'}`}>
                {(bs.riskMetrics?.top3ConcentrationPct ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-5 overflow-x-auto no-scrollbar border-b border-border-dark">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 whitespace-nowrap font-bold text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-primary'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Asset List ── */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-4 px-4 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
          <span className="col-span-2">Activo</span>
          <span className="text-right">Valor</span>
          <span className="text-right">P&L</span>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">Sin activos en esta categoría</p>
        )}
        {filtered.map((a) => (
          <div key={a.id}
            className="bg-card-dark border border-border-dark rounded-xl p-4 grid grid-cols-4 items-center gap-2 hover:bg-card-dark/80 transition-all">
            {/* Col 1-2: Asset info */}
            <div className="col-span-2 flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-background-dark flex items-center justify-center shrink-0">
                <TypeIcon type={a.type} symbol={a.symbol} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{a.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{a.subtitle}</p>
                {a.extra && <p className="text-[9px] text-yellow-400/70 mt-0.5">{a.extra}</p>}
              </div>
            </div>
            {/* Col 3: Value */}
            <div className="text-right">
              <p className="font-mono text-sm font-semibold">${a.valueUSD.toFixed(0)}</p>
              <p className="text-[10px] text-slate-500">Bs {(a.valueUSD * 6.96).toFixed(0)}</p>
            </div>
            {/* Col 4: P&L */}
            <div className="text-right">
              {a.pnl != null ? (
                <>
                  <div className={`flex items-center justify-end gap-0.5 font-mono text-sm font-bold ${a.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {a.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    ${Math.abs(a.pnl).toFixed(2)}
                  </div>
                  {a.pnlPct != null && (
                    <p className={`text-[10px] font-mono ${a.pnl >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
                      {a.pnl >= 0 ? '+' : ''}{a.pnlPct.toFixed(1)}%
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-slate-600">—</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
