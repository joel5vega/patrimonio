import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
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

const HIGH_CONTRAST_COLORS = [
  '#f97316',
  '#10b981',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#facc15',
  '#06b6d4',
  '#f43f5e',
  '#8b5cf6',
  '#14b8a6',
  '#84cc16',
  '#eab308',
];

const TABS = ['Todos', 'Crypto', 'ETFs', 'Manual'];

const formatUSD = (value = 0, digits = 0) => `$${Number(value || 0).toFixed(digits)}`;
const formatBOB = (value = 0, rate = 6.96, digits = 0) =>
  `Bs ${Number((value || 0) * rate).toFixed(digits)}`;

const isQuantfuryAsset = (asset) =>
  String(asset?.note || '').toLowerCase().includes('[quantfury]') ||
  String(asset?.type || '').toLowerCase() === 'stock';

const getAssetBadge = (asset) => {
  if (isQuantfuryAsset(asset)) {
    return {
      label: 'QUANTFURY',
      className: 'portfolio-chip portfolio-chip-stock',
    };
  }

  if (String(asset?.type || '').toLowerCase() === 'crypto') {
    return {
      label: 'CRYPTO',
      className: 'portfolio-chip portfolio-chip-crypto',
    };
  }

  return {
    label: 'MANUAL',
    className: 'portfolio-chip',
  };
};

const TypeIcon = ({ type, symbol }) => {
  const iconMap = {
    crypto: CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT,
    etf: 'show_chart',
    manual: 'savings',
    stock: 'monitoring',
    stable: 'attach_money',
  };

  return (
    <span className="material-symbols-outlined text-[20px] text-primary">
      {iconMap[type] || 'account_balance'}
    </span>
  );
};

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
  const MIN_PCT = 1.2;
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

        {slices.filter((slice) => slice.pct >= MIN_PCT).map((slice, index) => {
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
    binanceSnap,
    loading,
    bobRate,
  } = useApp();

  const [activeTab, setActiveTab] = useState('Todos');
  const [visibleGroups, setVisibleGroups] = useState({});
  const [copied, setCopied] = useState(false);

  const bs = binanceSnap?.snapshot || {};
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

  const groupDefinitions = useMemo(() => {
    const base = [
      { groupKey: 'crypto', label: 'Crypto', color: HIGH_CONTRAST_COLORS[0], type: 'crypto' },
      { groupKey: 'stable', label: 'Cash', color: HIGH_CONTRAST_COLORS[1], type: 'stable' },
      { groupKey: 'etf', label: 'ETFs', color: HIGH_CONTRAST_COLORS[2], type: 'etf' },
    ];

    const quantfuryAssets = (manualAssets ?? []).filter(isQuantfuryAsset);
    const manualOnlyAssets = (manualAssets ?? []).filter((a) => !isQuantfuryAsset(a));

    const quantfuryGroup =
      quantfuryAssets.length > 0
        ? [
            {
              groupKey: 'quantfury',
              label: 'Quantfury',
              color: HIGH_CONTRAST_COLORS[3],
              type: 'stock',
            },
          ]
        : [];

    const manualGroups = manualOnlyAssets.map((a, idx) => ({
      groupKey: `manual-${a.id}`,
      label: a.name,
      color: HIGH_CONTRAST_COLORS[(idx + 4) % HIGH_CONTRAST_COLORS.length],
      type: 'manual',
      rawId: a.id,
    }));

    return [...base, ...quantfuryGroup, ...manualGroups];
  }, [manualAssets]);

  useEffect(() => {
    setVisibleGroups((prev) => {
      const next = {};
      groupDefinitions.forEach((group) => {
        next[group.groupKey] = prev[group.groupKey] ?? true;
      });
      return next;
    });
  }, [groupDefinitions]);

  const pieData = useMemo(() => {
    const cryptoValue = volatileAssets.reduce((sum, a) => sum + (a.netExposureUSD + (a.pendingBuyUSD ?? 0)), 0);
    const stableValue = stableAssets.reduce((sum, a) => sum + a.netExposureUSD, 0);
    const etfValue = inversionPositions.reduce((sum, p) => sum + (p.valueUSD ?? 0), 0);

    const baseItems = [
      { groupKey: 'crypto', label: 'Crypto', valueUSD: cryptoValue, color: HIGH_CONTRAST_COLORS[0], type: 'crypto' },
      { groupKey: 'stable', label: 'USDT (Cash)', valueUSD: stableValue, color: HIGH_CONTRAST_COLORS[1], type: 'stable' },
      { groupKey: 'etf', label: 'ETFs', valueUSD: etfValue, color: HIGH_CONTRAST_COLORS[2], type: 'etf' },
    ].filter((item) => item.valueUSD > 0);

    const quantfuryAssets = (manualAssets ?? []).filter(isQuantfuryAsset);
    const manualOnlyAssets = (manualAssets ?? []).filter((a) => !isQuantfuryAsset(a));

    const quantfuryValue = quantfuryAssets.reduce((sum, a) => sum + (a.valueUSD ?? 0), 0);

    const quantfuryItem =
      quantfuryValue > 0
        ? [
            {
              groupKey: 'quantfury',
              label: 'Quantfury',
              valueUSD: quantfuryValue,
              color: HIGH_CONTRAST_COLORS[3],
              type: 'stock',
            },
          ]
        : [];

    const manualItems = manualOnlyAssets
      .map((a, idx) => ({
        groupKey: `manual-${a.id}`,
        label: a.name,
        valueUSD: a.valueUSD ?? 0,
        color: HIGH_CONTRAST_COLORS[(idx + 4) % HIGH_CONTRAST_COLORS.length],
        type: 'manual',
        rawId: a.id,
      }))
      .filter((item) => item.valueUSD > 0);

    return [...baseItems, ...quantfuryItem, ...manualItems];
  }, [volatileAssets, stableAssets, inversionPositions, manualAssets]);

  const visiblePieData = useMemo(
    () => pieData.filter((item) => visibleGroups[item.groupKey] !== false),
    [pieData, visibleGroups]
  );

  const totalUSD = useMemo(
    () => visiblePieData.reduce((sum, item) => sum + item.valueUSD, 0),
    [visiblePieData]
  );

  const visibleGroupSet = useMemo(
    () => new Set(visiblePieData.map((item) => item.groupKey)),
    [visiblePieData]
  );

  const allAssets = useMemo(
    () => [
      ...volatileAssets.map((a) => ({
        id: `crypto-${a.symbol}`,
        groupKey: 'crypto',
        type: 'crypto',
        symbol: a.symbol,
        name: a.symbol,
        subtitle: `${a.quantity?.toFixed(4) ?? 0} ${a.symbol}`,
        price: a.currentPrice,
        valueUSD: a.netExposureUSD + (a.pendingBuyUSD ?? 0),
        pnl: null,
        pnlPct: null,
        weightPct: null,
        extra: a.pendingBuyUSD > 0 ? `+${formatUSD(a.pendingBuyUSD, 2)} orden` : null,
      })),
      ...stableAssets.map((a) => ({
        id: `stable-${a.symbol}`,
        groupKey: 'stable',
        type: 'stable',
        symbol: a.symbol,
        name: `${a.symbol} (Cash)`,
        subtitle: `${a.quantity?.toFixed(2) ?? 0} ${a.symbol}`,
        price: 1,
        valueUSD: a.netExposureUSD,
        pnl: null,
        pnlPct: null,
        weightPct: null,
        extra: null,
      })),
      ...inversionPositions.map((p) => ({
        id: `etf-${p.id}`,
        groupKey: 'etf',
        type: 'etf',
        symbol: p.symbol,
        name: p.symbol,
        subtitle: `${p.quantity} u · ${formatUSD(p.currentPrice, 2)}`,
        price: p.currentPrice,
        valueUSD: p.valueUSD,
        pnl: p.unrealizedPL,
        pnlPct: p.avgBuyPrice > 0 ? ((p.currentPrice - p.avgBuyPrice) / p.avgBuyPrice) * 100 : null,
        weightPct: null,
        extra: p.tp > 0 ? `TP ${formatUSD(p.tp, 2)}` : null,
      })),
      ...(manualAssets ?? []).map((a) => ({
        id: `manual-${a.id}`,
        rawId: a.id,
        groupKey: isQuantfuryAsset(a) ? 'quantfury' : `manual-${a.id}`,
        type: isQuantfuryAsset(a) ? 'stock' : (a.type || 'manual'),
        symbol: a.name?.slice(0, 3).toUpperCase() || 'MAN',
        name: a.name,
        subtitle: a.note || (a.currency === 'BOB' ? `Bs ${a.amount?.toFixed(2)}` : formatUSD(a.amount, 2)),
        price: null,
        valueUSD: a.valueUSD,
        pnl: null,
        pnlPct: null,
        weightPct: null,
        extra: a.since ? `Desde ${a.since}` : null,
      })),
    ].filter((asset) => visibleGroupSet.has(asset.groupKey)),
    [volatileAssets, stableAssets, inversionPositions, manualAssets, visibleGroupSet]
  );

  const tabFilter = {
    Todos: () => true,
    Crypto: (a) => a.type === 'crypto' || a.type === 'stable',
    ETFs: (a) => a.type === 'etf',
    Manual: (a) => a.type === 'manual' || a.type === 'stock',
  };

  const filtered = allAssets
    .filter(tabFilter[activeTab])
    .sort((a, b) => (b.valueUSD ?? 0) - (a.valueUSD ?? 0));

  const toggleGroup = (groupKey) => {
    setVisibleGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const visibleManualTotalUSD = visiblePieData
    .filter((item) => item.type === 'manual' || item.type === 'stock')
    .reduce((sum, item) => sum + item.valueUSD, 0);

  const portfolioMetrics = useMemo(() => {
    const byGroup = visiblePieData.map((item) => ({
      label: item.label,
      type: item.type,
      valueUSD: Number(item.valueUSD || 0),
      weightPct: totalUSD > 0 ? Number(((item.valueUSD / totalUSD) * 100).toFixed(2)) : 0,
    }));

    const top3 = [...byGroup]
      .sort((a, b) => b.valueUSD - a.valueUSD)
      .slice(0, 3);

    const top3Pct = top3.reduce((sum, item) => sum + item.weightPct, 0);

    const hhi = byGroup.reduce((sum, item) => {
      const w = item.weightPct / 100;
      return sum + w * w;
    }, 0);

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        totalUSD: Number(totalUSD.toFixed(2)),
        totalBOB: Number((totalUSD * bobRate).toFixed(2)),
        cryptoUSD: Number(totalCryptoUSD.toFixed(2)),
        etfUSD: Number(totalInversionUSD.toFixed(2)),
        manualUSD: Number(totalManualUSD.toFixed(2)),
      },
      risk: {
        binanceRiskScore: riskScore,
        top3ConcentrationPct: Number(top3Pct.toFixed(2)),
        hhi: Number(hhi.toFixed(4)),
        reservedBUY: Number(reservedBUY.toFixed(2)),
        pendingSELL: Number(pendingSELL.toFixed(2)),
        grossExposure: Number(grossExposure.toFixed(2)),
      },
      groups: byGroup,
      visibleAssets: filtered.map((a) => ({
        name: a.name,
        type: a.type,
        valueUSD: Number((a.valueUSD || 0).toFixed(2)),
        subtitle: a.subtitle,
        extra: a.extra || null,
        quantfury: a.groupKey === 'quantfury',
      })),
    };
  }, [
    visiblePieData,
    totalUSD,
    bobRate,
    totalCryptoUSD,
    totalInversionUSD,
    totalManualUSD,
    riskScore,
    reservedBUY,
    pendingSELL,
    grossExposure,
    filtered,
  ]);

  const handleCopyMetrics = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(portfolioMetrics, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('clipboard error', e);
    }
  };

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

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="portfolio-rate-pill">
              <span className="portfolio-rate-dot" />
              <span>Bs {bobRate.toFixed(2)} / USD</span>
            </div>

            <button
              type="button"
              onClick={handleCopyMetrics}
              className="portfolio-copy-btn"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar métricas'}</span>
            </button>
          </div>
        </div>

        <div className="portfolio-group-toggles">
          {groupDefinitions.map((group) => {
            const active = visibleGroups[group.groupKey] !== false;
            return (
              <button
                key={group.groupKey}
                type="button"
                onClick={() => toggleGroup(group.groupKey)}
                className={`portfolio-toggle-chip ${active ? 'active' : ''}`}
              >
                <span
                  className="portfolio-toggle-chip__dot"
                  style={{ backgroundColor: group.color }}
                />
                <span className="portfolio-toggle-chip__label">{group.label}</span>
                {active ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            );
          })}
        </div>

        <div className="portfolio-overview-grid">
          <div className="portfolio-chart-panel">
            <DonutChart data={visiblePieData} totalUSD={totalUSD} />
          </div>

          <div className="portfolio-summary-panel">
            <div className="portfolio-summary-grid">
              <StatCard label="Total visible" value={formatUSD(totalUSD, 0)} tone="text-white" />
              <StatCard
                label="Crypto"
                value={formatUSD(
                  visiblePieData
                    .filter((i) => i.type === 'crypto' || i.type === 'stable')
                    .reduce((s, i) => s + i.valueUSD, 0),
                  0
                )}
                tone="text-orange-400"
              />
              <StatCard
                label="ETFs"
                value={formatUSD(
                  visiblePieData
                    .filter((i) => i.type === 'etf')
                    .reduce((s, i) => s + i.valueUSD, 0),
                  0
                )}
                tone="text-blue-400"
              />
              <StatCard
                label="Manual"
                value={formatUSD(visibleManualTotalUSD, 0)}
                tone="text-violet-400"
              />
            </div>

            <div className="portfolio-legend-grid">
              {visiblePieData.map((d, i) => (
                <div key={`pie-leg-${i}`} className="portfolio-legend-card">
                  <div className="portfolio-legend-top">
                    <span
                      className="portfolio-legend-dot"
                      style={{ backgroundColor: d.color }}
                    />
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

      {visibleGroups.crypto !== false && totalCryptoUSD > 0 && (
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
                <div
                  className="portfolio-riskbar-segment spot"
                  style={{ width: `${(totalCryptoUSD / grossExposure) * 100}%` }}
                />
                <div
                  className="portfolio-riskbar-segment buy"
                  style={{ width: `${(reservedBUY / grossExposure) * 100}%` }}
                />
                <div
                  className="portfolio-riskbar-segment sell"
                  style={{ width: `${(pendingSELL / grossExposure) * 100}%` }}
                />
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
            <StatCard
              label="HHI"
              value={(bs.riskMetrics?.herfindahlIndex ?? 0).toFixed(4)}
              tone="text-white"
            />
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

        {filtered.length === 0 && (
          <p className="portfolio-empty">Sin activos visibles en esta categoría</p>
        )}

        {filtered.map((a) => (
          <article key={a.id} className="portfolio-asset-card">
            <div className="portfolio-asset-main">
              <div className="portfolio-asset-icon">
                <TypeIcon type={a.type} symbol={a.symbol} />
              </div>

              <div className="portfolio-asset-copy">
                <div className="portfolio-asset-title-row">
                  <p className="portfolio-asset-title">{a.name}</p>
                  {(() => {
                    if (a.type === 'manual' || a.type === 'stock') {
                      const badge = getAssetBadge(a);
                      return <span className={badge.className}>{badge.label}</span>;
                    }
                    return null;
                  })()}
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