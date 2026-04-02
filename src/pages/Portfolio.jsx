import { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Portfolio.css';

const STABLES = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD'];

const CRYPTO_ICONS = {
  BTC: 'currency_bitcoin',
  ETH: 'token',
  SOL: 'sunny',
  BNB: 'toll',
  XRP: 'water_drop',
  ADA: 'hexagon',
  LINK: 'link',
  DEFAULT: 'generating_tokens',
};

const TABS = ['Todos', 'Crypto', 'ETFs', 'Manual'];

const TypeIcon = ({ type, symbol }) => {
  const iconMap = {
    crypto: CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT,
    etf: 'show_chart',
    manual: 'savings',
    stable: 'attach_money',
  };

  return (
    <span className="material-symbols-outlined text-[20px] text-primary">
      {iconMap[type] || 'account_balance'}
    </span>
  );
};

const formatUSD = (value = 0, digits = 0) => `$${Number(value || 0).toFixed(digits)}`;
const formatBOB = (value = 0, rate = 6.96, digits = 0) => `Bs ${Number((value || 0) * rate).toFixed(digits)}`;

const DonutChart = ({ data, totalUSD }) => {
  const safeData = (data || []).filter((d) => Number(d.valueUSD) > 0);
  if (!safeData.length) return null;

  const total = safeData.reduce((sum, item) => sum + item.valueUSD, 0);
  if (total <= 0) return null;

  const SIZE = 260;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 92;
  const RI = 60;
  const LABEL_R = 118;
  const MOBILE_MIN_LABEL_PCT = 1.5;
  const DESKTOP_MIN_LABEL_PCT = 2.5;
  const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const minPct = isSmallScreen ? MOBILE_MIN_LABEL_PCT : DESKTOP_MIN_LABEL_PCT;

  let cumAngle = -Math.PI / 2;

  const slices = safeData.map((d) => {
    const angle = (d.valueUSD / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const midAngle = startAngle + angle / 2;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const xi1 = CX + RI * Math.cos(cumAngle);
    const yi1 = CY + RI * Math.sin(cumAngle);
    const xi2 = CX + RI * Math.cos(startAngle);
    const yi2 = CY + RI * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const pct = (d.valueUSD / total) * 100;

    return {
      ...d,
      pct,
      midAngle,
      path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${RI} ${RI} 0 ${large} 0 ${xi2} ${yi2} Z`,
      lx: CX + LABEL_R * Math.cos(midAngle),
      ly: CY + LABEL_R * Math.sin(midAngle),
      lsx: CX + (R + 4) * Math.cos(midAngle),
      lsy: CY + (R + 4) * Math.sin(midAngle),
      lex: CX + (LABEL_R - 10) * Math.cos(midAngle),
      ley: CY + (LABEL_R - 10) * Math.sin(midAngle),
    };
  });

  return (
    <div className="portfolio-donut-wrap">
      <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="portfolio-donut-svg">
        {slices.map((slice, index) => (
          <path
            key={`slice-${index}`}
            d={slice.path}
            fill={slice.color}
            stroke="rgba(10,18,17,0.95)"
            strokeWidth="2"
            opacity="0.95"
          />
        ))}

        {slices.filter((slice) => slice.pct >= minPct).map((slice, index) => {
          const anchor = Math.cos(slice.midAngle) >= 0 ? 'start' : 'end';
          return (
            <g key={`label-${index}`} className="portfolio-donut-label">
              <line
                x1={slice.lsx}
                y1={slice.lsy}
                x2={slice.lex}
                y2={slice.ley}
                stroke={slice.color}
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text
                x={slice.lx}
                y={slice.ly - 4}
                textAnchor={anchor}
                fill={slice.color}
                fontSize="9"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                {slice.label}
              </text>
              <text
                x={slice.lx}
                y={slice.ly + 8}
                textAnchor={anchor}
                fill="rgba(148,163,184,0.95)"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
              >
                {slice.pct.toFixed(1)}%
              </text>
            </g>
          );
        })}

        <text
          x={CX}
          y={CY - 12}
          textAnchor="middle"
          fill="rgba(148,163,184,0.92)"
          fontSize="9"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          letterSpacing="1.5"
        >
          TOTAL USD
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fill="white"
          fontSize="22"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          {formatUSD(totalUSD, 0)}
        </text>
      </svg>
    </div>
  );
};

const StatCard = ({ label, value, tone = 'default' }) => (
  <div className="portfolio-stat-card">
    <p className="portfolio-stat-label">{label}</p>
    <p className={`portfolio-stat-value ${tone}`}>{value}</p>
  </div>
);

const Portfolio = () => {
  const {
    cryptoAssets,
    inversionPositions,
    manualAssets,
    totalCryptoUSD,
    totalInversionUSD,
    totalManualUSD,
    pieData,
    binanceSnap,
    loading,
    bobRate,
  } = useApp();

  const [activeTab, setActiveTab] = useState('Todos');

  const bs = binanceSnap?.snapshot || {};
  const totalUSD = totalCryptoUSD + totalInversionUSD + (totalManualUSD ?? 0);
  const reservedBUY = bs.reservedCapitalUSD ?? 0;
  const pendingSELL = bs.pendingSellUSD ?? 0;
  const grossExposure = bs.grossExposureUSD ?? 0;
  const riskScore = bs.riskMetrics?.riskScore ?? 0;
  const riskColor =
    riskScore >= 70 ? 'text-rose-400' : riskScore >= 40 ? 'text-yellow-400' : 'text-emerald-400';

  const stableAssets = useMemo(
    () => cryptoAssets.filter((a) => STABLES.includes(a.symbol) && a.netExposureUSD > 0),
    [cryptoAssets]
  );

  const volatileAssets = useMemo(
    () => cryptoAssets.filter((a) => !STABLES.includes(a.symbol) && (a.netExposureUSD > 0 || a.pendingBuyUSD > 0)),
    [cryptoAssets]
  );

  const allAssets = useMemo(
    () => [
      ...volatileAssets.map((a) => ({
        id: `crypto-${a.symbol}`,
        type: 'crypto',
        symbol: a.symbol,
        name: a.symbol,
        subtitle: `${a.quantity?.toFixed(4) ?? 0} ${a.symbol}`,
        price: a.currentPrice,
        valueUSD: a.netExposureUSD + (a.pendingBuyUSD ?? 0),
        pnl: null,
        pnlPct: null,
        weightPct: a.weightPct,
        extra: a.pendingBuyUSD > 0 ? `+${formatUSD(a.pendingBuyUSD, 2)} orden` : null,
      })),
      ...stableAssets.map((a) => ({
        id: `stable-${a.symbol}`,
        type: 'stable',
        symbol: a.symbol,
        name: `${a.symbol} (Cash)`,
        subtitle: `${a.quantity?.toFixed(2) ?? 0} ${a.symbol}`,
        price: 1,
        valueUSD: a.netExposureUSD,
        pnl: null,
        pnlPct: null,
        weightPct: a.weightPct,
        extra: null,
      })),
      ...inversionPositions.map((p) => ({
        id: `etf-${p.id}`,
        type: 'etf',
        symbol: p.symbol,
        name: p.symbol,
        subtitle: `${p.quantity} u · ${formatUSD(p.currentPrice, 2)}`,
        price: p.currentPrice,
        valueUSD: p.valueUSD,
        pnl: p.unrealizedPL,
        pnlPct: p.avgBuyPrice > 0 ? ((p.currentPrice - p.avgBuyPrice) / p.avgBuyPrice) * 100 : null,
        weightPct: p.weightPct,
        extra: p.tp > 0 ? `TP ${formatUSD(p.tp, 2)}` : null,
      })),
      ...(manualAssets ?? []).map((a) => ({
        id: `manual-${a.id}`,
        type: 'manual',
        symbol: a.name?.slice(0, 3).toUpperCase() || 'MAN',
        name: a.name,
        subtitle:
          a.note ||
          (a.currency === 'BOB' ? `Bs ${a.amount?.toFixed(2)}` : `${formatUSD(a.amount, 2)}`),
        price: null,
        valueUSD: a.valueUSD,
        pnl: null,
        pnlPct: null,
        weightPct: null,
        extra: a.since ? `Desde ${a.since}` : null,
      })),
    ],
    [volatileAssets, stableAssets, inversionPositions, manualAssets]
  );

  const tabFilter = {
    Todos: () => true,
    Crypto: (a) => a.type === 'crypto' || a.type === 'stable',
    ETFs: (a) => a.type === 'etf',
    Manual: (a) => a.type === 'manual',
  };

  const filtered = allAssets
    .filter(tabFilter[activeTab])
    .sort((a, b) => (b.valueUSD ?? 0) - (a.valueUSD ?? 0));

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="portfolio-spinner" />
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <section className="portfolio-card portfolio-hero-card">
        <div className="portfolio-section-head">
          <div>
            <p className="portfolio-eyebrow">Distribución</p>
            <h1 className="portfolio-title">Vista general del portafolio</h1>
          </div>
          <div className="portfolio-rate-pill">
            <span className="portfolio-rate-dot" />
            <span>Bs {bobRate.toFixed(2)} / USD</span>
          </div>
        </div>

        <div className="portfolio-overview-grid">
          <div className="portfolio-chart-panel">
            <DonutChart data={pieData} totalUSD={totalUSD} />
          </div>

          <div className="portfolio-summary-panel">
            <div className="portfolio-summary-grid">
              <StatCard label="Total" value={formatUSD(totalUSD, 0)} tone="text-white" />
              <StatCard label="Crypto" value={formatUSD(totalCryptoUSD, 0)} tone="text-orange-400" />
              <StatCard label="ETFs" value={formatUSD(totalInversionUSD, 0)} tone="text-blue-400" />
              <StatCard label="Manual" value={formatUSD(totalManualUSD ?? 0, 0)} tone="text-violet-400" />
            </div>

            <div className="portfolio-legend-grid">
              {(pieData || []).filter((d) => Number(d.valueUSD) > 0).map((d, i) => (
                <div key={`pie-leg-${i}`} className="portfolio-legend-card">
                  <div className="portfolio-legend-top">
                    <span className="portfolio-legend-dot" style={{ backgroundColor: d.color }} />
                    <span className="portfolio-legend-label">{d.label}</span>
                  </div>
                  <div className="portfolio-legend-bottom">
                    <span className="portfolio-legend-value">{formatUSD(d.valueUSD, 0)}</span>
                    <span className="portfolio-legend-pct">
                      {totalUSD > 0 ? ((d.valueUSD / totalUSD) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {totalCryptoUSD > 0 && (
        <section className="portfolio-card">
          <div className="portfolio-section-head compact">
            <div>
              <p className="portfolio-eyebrow portfolio-eyebrow-warn">Binance · Exposición</p>
              <h2 className="portfolio-subtitle">Riesgo y concentración</h2>
            </div>
            <span className={`portfolio-risk-badge ${riskColor}`}>Riesgo {riskScore}/100</span>
          </div>

          {grossExposure > 0 && (
            <>
              <div className="portfolio-riskbar">
                <div className="portfolio-riskbar-segment spot" style={{ width: `${(totalCryptoUSD / grossExposure) * 100}%` }} />
                <div className="portfolio-riskbar-segment buy" style={{ width: `${(reservedBUY / grossExposure) * 100}%` }} />
                <div className="portfolio-riskbar-segment sell" style={{ width: `${(pendingSELL / grossExposure) * 100}%` }} />
              </div>

              <div className="portfolio-risk-legend">
                <span><i className="spot" />Spot</span>
                <span><i className="buy" />Ord. BUY</span>
                <span><i className="sell" />Ord. SELL</span>
              </div>
            </>
          )}

          <div className="portfolio-stats-grid four">
            <StatCard label="Spot" value={formatUSD(totalCryptoUSD, 2)} tone="text-white" />
            <StatCard label="Ord. BUY" value={formatUSD(reservedBUY, 2)} tone="text-yellow-400" />
            <StatCard label="Ord. SELL" value={formatUSD(pendingSELL, 2)} tone="text-blue-400" />
            <StatCard label="Exposición" value={formatUSD(grossExposure, 2)} tone="text-emerald-400" />
          </div>

          <div className="portfolio-stats-grid two">
            <StatCard label="HHI" value={(bs.riskMetrics?.herfindahlIndex ?? 0).toFixed(4)} tone="text-white" />
            <StatCard
              label="Top 3 conc."
              value={`${(bs.riskMetrics?.top3ConcentrationPct ?? 0).toFixed(1)}%`}
              tone={(bs.riskMetrics?.top3ConcentrationPct ?? 0) > 80 ? 'text-rose-400' : 'text-white'}
            />
          </div>
        </section>
      )}

      <section className="portfolio-tabs-wrap">
        <div className="portfolio-tabs-scroll">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`portfolio-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="portfolio-assets">
        <div className="portfolio-assets-head desktop-only">
          <span className="col-span-2">Activo</span>
          <span className="text-right">Valor</span>
          <span className="text-right">P&amp;L</span>
        </div>

        {filtered.length === 0 && <p className="portfolio-empty">Sin activos en esta categoría</p>}

        {filtered.map((a) => (
          <article key={a.id} className="portfolio-asset-card">
            <div className="portfolio-asset-main">
              <div className="portfolio-asset-icon">
                <TypeIcon type={a.type} symbol={a.symbol} />
              </div>

              <div className="portfolio-asset-copy">
                <div className="portfolio-asset-title-row">
                  <p className="portfolio-asset-title">{a.name}</p>
                  {a.weightPct != null && <span className="portfolio-chip">{a.weightPct.toFixed(1)}%</span>}
                </div>
                <p className="portfolio-asset-subtitle">{a.subtitle}</p>
                {a.extra && <p className="portfolio-asset-extra">{a.extra}</p>}
              </div>
            </div>

            <div className="portfolio-asset-metrics">
              <div className="portfolio-metric-block">
                <p className="portfolio-metric-label">Valor</p>
                <p className="portfolio-metric-value">{formatUSD(a.valueUSD, 0)}</p>
                <p className="portfolio-metric-subvalue">{formatBOB(a.valueUSD, bobRate, 0)}</p>
              </div>

              <div className="portfolio-metric-block align-end">
                <p className="portfolio-metric-label">P&amp;L</p>
                {a.pnl != null ? (
                  <>
                    <div className={`portfolio-pnl ${a.pnl >= 0 ? 'up' : 'down'}`}>
                      {a.pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{formatUSD(Math.abs(a.pnl), 2)}</span>
                    </div>
                    {a.pnlPct != null && (
                      <p className={`portfolio-pnl-pct ${a.pnl >= 0 ? 'up' : 'down'}`}>
                        {a.pnl >= 0 ? '+' : ''}
                        {a.pnlPct.toFixed(1)}%
                      </p>
                    )}
                  </>
                ) : (
                  <p className="portfolio-metric-empty">—</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Portfolio;