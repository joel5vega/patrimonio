// src/pages/Portfolio.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight,
  Eye, EyeOff, Copy, Check,
  ChevronDown, ChevronUp,
  ArrowRight, BarChart2,
  AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Portfolio.css';
import { buildPortfolioV3 } from '../utils/portfolioAnalysis';

const STABLES = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD'];

const CRYPTO_ICONS = {
  BTC: 'currency_bitcoin', ETH: 'token', SOL: 'sunny',
  BNB: 'toll', XRP: 'water_drop', ADA: 'hexagon',
  LINK: 'link', DEFAULT: 'generating_tokens',
};

const HIGH_CONTRAST_COLORS = [
  '#f97316','#10b981','#3b82f6','#a855f7',
  '#ec4899','#facc15','#06b6d4','#f43f5e',
  '#8b5cf6','#14b8a6','#84cc16','#eab308',
];

const ROLE_COLORS = {
  core:          '#3b82f6',
  growth:        '#10b981',
  defensive:     '#facc15',
  liquidity:     '#06b6d4',
  yield:         '#14b8a6',
  speculative:   '#f43f5e',
  trading:       '#a855f7',
  alternative:   '#f97316',
  non_investable:'#6b7280',
};

const ROLE_TARGETS = {
  core:        30, // SPY + SCHD
  growth:      20, // QQQM + VXUS/EMXC + BTC + ETH
  defensive:   15, // IAU + BND + TIP + VNQ
  liquidity:   15, // USDT/USDC o SGOV
  alternative: 10, // Terreno + otros activos reales
  speculative: 10, // ADA + XRP + SOL + AVAX
};

const TABS = ['Todos', 'Crypto', 'ETFs', 'Manual'];

const fmt  = (v = 0, d = 0) => `$${Number(v || 0).toFixed(d)}`;
const fmtB = (v = 0, rate = 6.96) => `Bs ${Number((v || 0) * rate).toFixed(0)}`;
const bar  = (pct, w = 16) => {
  const f = Math.round((Math.min(pct, 100) / 100) * w);
  return '█'.repeat(Math.max(0, f)) + '░'.repeat(Math.max(0, w - f));
};

const isQuantfury = (a) =>
  String(a?.note || '').toLowerCase().includes('[quantfury]') ||
  String(a?.type || '').toLowerCase() === 'stock';

const TypeIcon = ({ type, symbol }) => {
  const m = { crypto: CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT, etf: 'show_chart', manual: 'savings', stock: 'monitoring', stable: 'attach_money' };
  return <span className="material-symbols-outlined text-[20px] text-primary">{m[type] || 'account_balance'}</span>;
};

const StatCard = ({ label, value, tone = '' }) => (
  <div className="portfolio-stat-card">
    <p className="portfolio-stat-label">{label}</p>
    <p className={`portfolio-stat-value ${tone}`}>{value}</p>
  </div>
);

const AlertDot = ({ ok, warn }) =>
  ok  ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> :
  warn? <AlertTriangle size={13} className="text-yellow-400 shrink-0" /> :
        <XCircle      size={13} className="text-rose-400 shrink-0"   />;

const DonutChart = ({ data, totalUSD }) => {
  const safe = (data || []).filter(d => d.valueUSD > 0);
  if (!safe.length) return null;
  const total = totalUSD > 0 ? totalUSD : safe.reduce((s, d) => s + d.valueUSD, 0);
if (!total) return null;

  const S = 260, CX = 130, CY = 130, R = 90, RI = 58, LR = 116, MIN = 1.5;
  let cum = -Math.PI / 2;

  const slices = safe.map(d => {
    const a = (d.valueUSD / total) * 2 * Math.PI;
    const s = cum, mid = s + a / 2;
    cum += a;
    const large = a > Math.PI ? 1 : 0;
    const P = (r, θ) => [CX + r * Math.cos(θ), CY + r * Math.sin(θ)];
    const [x1,y1]=P(R,s),[x2,y2]=P(R,cum),[xi1,yi1]=P(RI,cum),[xi2,yi2]=P(RI,s);
    return {
      ...d,
      pct: (d.valueUSD / total) * 100,
      path: `M${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}L${xi1} ${yi1}A${RI} ${RI} 0 ${large} 0 ${xi2} ${yi2}Z`,
      lx: P(LR, mid)[0], ly: P(LR, mid)[1],
      lsx: P(R+3, mid)[0], lsy: P(R+3, mid)[1],
      lex: P(LR-9, mid)[0], ley: P(LR-9, mid)[1],
      mid,
    };
  });

  return (
    <div className="portfolio-donut-wrap">
      <svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`} className="portfolio-donut-svg">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="rgba(10,18,17,0.95)" strokeWidth="2" opacity="0.95" />
        ))}
        {slices.filter(s => s.pct >= MIN).map((s, i) => {
          const anchor = Math.cos(s.mid) >= 0 ? 'start' : 'end';
          return (
            <g key={i}>
              <line x1={s.lsx} y1={s.lsy} x2={s.lex} y2={s.ley} stroke={s.color} strokeWidth="1.5" opacity="0.6" />
              <text x={s.lx} y={s.ly-4}  textAnchor={anchor} fill={s.color}               fontSize="9"  fontWeight="700"  fontFamily="Inter,sans-serif">{s.label}</text>
              <text x={s.lx} y={s.ly+8}  textAnchor={anchor} fill="rgba(148,163,184,.9)"  fontSize="8"                   fontFamily="JetBrains Mono,monospace">{s.pct.toFixed(1)}%</text>
            </g>
          );
        })}
        <text x={CX} y={CY-12} textAnchor="middle" fill="rgba(148,163,184,.8)" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif" letterSpacing="1.5">TOTAL</text>
        <text x={CX} y={CY+14} textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono,monospace">{fmt(totalUSD)}</text>
      </svg>
    </div>
  );
};
const Section = ({ title, eyebrow, children, defaultOpen = false, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="portfolio-dash-section">
      <button type="button" onClick={() => setOpen(v => !v)} className="portfolio-dash-header">
        <div>
          {eyebrow && <p className="portfolio-eyebrow">{eyebrow}</p>}
          <p className="portfolio-subtitle">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {open ? <ChevronUp size={14} className="text-white/25" /> : <ChevronDown size={14} className="text-white/25" />}
        </div>
      </button>
      {open && <div className="portfolio-dash-body">{children}</div>}
    </div>
  );
};
const ROLE_COLORS_BG = {
  core:         'rgba(96,165,250,0.12)',
  growth:       'rgba(52,211,153,0.12)',
  defensive:    'rgba(250,204,21,0.12)',
  liquidity:    'rgba(34,211,238,0.12)',
  speculative:  'rgba(251,113,133,0.12)',
  trading:      'rgba(167,139,250,0.12)',
  yield:        'rgba(249,115,22,0.12)',
  alternative:  'rgba(148,163,184,0.10)',
  non_investable:'rgba(71,85,105,0.10)',
};

const Dashboard = ({ v3 }) => {
  if (!v3) return null;
  const { allocation, alerts, ruleEvaluation, rebalancePlan, assets, risk, totals, trading } = v3;
  const byRole  = allocation?.byRole  || {};
  const byClass = allocation?.byAssetClass || {};

  const alertList = [
    { key: 'underCore',          label: 'Core insuficiente',    critical: true  },
    { key: 'lowCash',            label: 'Liquidez baja',        critical: true  },
    { key: 'overCash',           label: 'Exceso de caja',       critical: false },
    { key: 'overSpeculative',    label: 'Sobre-especulativo',   critical: true  },
    { key: 'excessTrading',      label: 'Trading excesivo',     critical: false },
    { key: 'highRisk',           label: 'Riesgo alto',          critical: true  },
    { key: 'lowDiversification', label: 'Baja diversificación', critical: false },
  ];

  const fired    = alertList.filter(a => alerts?.[a.key]);
  const critical = fired.filter(a => a.critical).length;
  const warnings = fired.filter(a => !a.critical).length;

  const roleRows = Object.entries(byRole)
    .filter(([, p]) => p > 0)
    .sort((a, b) => b[1] - a[1]);

  const targetChecks = Object.entries(ROLE_TARGETS).map(([role, target]) => ({
    role, target,
    current: byRole[role] || 0,
    ok: role === 'speculative'
      ? (byRole[role] || 0) <= target
      : (byRole[role] || 0) >= target,
    dir: role === 'speculative' ? '≤' : '≥',
  }));

  const classRows = Object.entries(byClass)
    .filter(([, p]) => p > 0)
    .sort((a, b) => b[1] - a[1]);

  const byRoleMap = (assets || []).reduce((acc, a) => {
    const r = a.classification?.role || 'liquidity';
    (acc[r] = acc[r] || []).push(a);
    return acc;
  }, {});

  const flows = [];
  if (alerts?.underCore)       flows.push({ from: 'Nuevo efectivo', to: 'SPY / QQQM',   color: '#60a5fa' });
  if (alerts?.lowCash)         flows.push({ from: 'Especulativo',   to: 'USDT / Cash',  color: '#22d3ee' });
  if (alerts?.overCash)        flows.push({ from: 'Caja excedente', to: 'Core / Growth', color: '#34d399' });
  if (alerts?.overSpeculative) flows.push({ from: 'Altcoins',       to: 'Core',          color: '#60a5fa' });
  if (alerts?.excessTrading)   flows.push({ from: 'Trading exceso', to: 'Core',          color: '#60a5fa' });
  if (!flows.length)           flows.push({ from: 'Nuevo efectivo', to: 'Plan normal',   color: '#34d399' });

  const roleOrder = ['core','growth','defensive','liquidity','yield','speculative','trading','alternative','non_investable'];

  return (
    <div className="dash-grid">

      {/* ══ ROW 1: Status bar ══ */}
      <div className="dash-status-bar">
        <div className="dash-status-item">
          <span className="dash-status-label">Invertible</span>
          <span className="dash-status-value">{fmt(totals?.investableUSD)}</span>
        </div>
        <div className="dash-status-divider" />
        <div className="dash-status-item">
          <span className="dash-status-label">No-invertible</span>
          <span className="dash-status-value muted">{fmt(totals?.nonInvestableUSD)}</span>
        </div>
        <div className="dash-status-divider" />
        <div className="dash-status-item">
          <span className="dash-status-label">Riesgo medio</span>
          <span className="dash-status-value">{(risk?.portfolioRisk ?? 0).toFixed(2)}</span>
        </div>
        <div className="dash-status-divider" />
        <div className="dash-status-item">
          <span className="dash-status-label">Retorno est.</span>
          <span className="dash-status-value green">{(risk?.expectedReturn ?? 0).toFixed(1)}%</span>
        </div>
        <div className="dash-status-divider" />
        <div className="dash-status-item">
          <span className="dash-status-label">Alertas</span>
          <div className="dash-alert-pills">
            {critical > 0 && (
              <span className="dash-alert-pill critical">{critical} crítica{critical > 1 ? 's' : ''}</span>
            )}
            {warnings > 0 && (
              <span className="dash-alert-pill warn">{warnings} aviso{warnings > 1 ? 's' : ''}</span>
            )}
            {fired.length === 0 && (
              <span className="dash-alert-pill ok">Todo OK</span>
            )}
          </div>
        </div>
      </div>

      {/* ══ ROW 2: Allocation + Targets (2 col) ══ */}
      <div className="dash-two-col">

        {/* Distribución por rol */}
        <Section eyebrow="Motor de reglas" title="Distribución por rol" defaultOpen>
          <div className="dash-role-list">
            {roleRows.map(([role, pct]) => {
              const color = ROLE_COLORS[role] || '#fff';
              return (
                <div key={role} className="dash-role-row">
                  <div className="dash-role-left">
                    <span className="dash-role-dot" style={{ background: color }} />
                    <span className="dash-role-name" style={{ color }}>{role}</span>
                  </div>
                  <div className="dash-role-bar-wrap">
                    <div className="dash-role-bar-track">
                      <div
                        className="dash-role-bar-fill"
                        style={{ width: `${Math.min(pct, 100)}%`, background: color, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                  <span className="dash-role-pct">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Objetivo vs actual */}
        <Section eyebrow="Rebalanceo" title="Objetivo vs actual">
          <div className="dash-target-list">
            {targetChecks.map(({ role, target, current, ok, dir }) => {
              const diff = current - target;
              const color = ROLE_COLORS[role] || '#fff';
              return (
                <div key={role} className="dash-target-row">
                  <div className="dash-target-head">
                    <div className="dash-role-left">
                      <span className="dash-role-dot" style={{ background: color }} />
                      <span className="dash-role-name" style={{ color }}>{role}</span>
                    </div>
                    <div className="dash-target-meta">
                      <span className="dash-target-goal">{dir}{target}%</span>
                      <span className="dash-target-current">{current.toFixed(1)}%</span>
                      {ok
                        ? <CheckCircle2 size={11} className="text-emerald-400" />
                        : <XCircle      size={11} className="text-rose-400"    />}
                    </div>
                  </div>
                  <div className="dash-target-track">
                    <div
                      className="dash-target-fill"
                      style={{
                        width: `${Math.min(current, 100)}%`,
                        background: ok ? color : '#f43f5e',
                        opacity: 0.75,
                      }}
                    />
                    <div className="dash-target-marker" style={{ left: `${Math.min(target, 100)}%` }} />
                  </div>
                  {!ok && (
                    <span className="dash-target-diff">
                      {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`} vs objetivo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

      </div>

      {/* ══ ROW 3: Alerts + Risk (2 col) ══ */}
      <div className="dash-two-col">

        {/* Panel de alertas */}
        <Section eyebrow="Sistema de alertas" title="Panel de alertas" defaultOpen={critical > 0}>
          <div className="dash-alert-list">
            {alertList.map(({ key, label, critical: isCrit }) => {
              const active = alerts?.[key];
              return (
                <div key={key} className={`dash-alert-row ${active ? (isCrit ? 'dash-alert-row--critical' : 'dash-alert-row--warn') : ''}`}>
                  <div className={`dash-alert-icon ${active ? (isCrit ? 'critical' : 'warn') : 'ok'}`}>
                    {active
                      ? isCrit ? <XCircle size={12} /> : <AlertTriangle size={12} />
                      : <CheckCircle2 size={12} />}
                  </div>
                  <span className="dash-alert-label">{label}</span>
                  {active && (
                    <span className={`dash-alert-badge ${isCrit ? 'critical' : 'warn'}`}>
                      {isCrit ? 'CRÍTICO' : 'AVISO'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Riesgo y métricas */}
        <Section eyebrow="Métricas cuantitativas" title="Riesgo y retorno">
          <div className="dash-metrics-grid">
            <div className="dash-metric-card">
              <span className="dash-metric-label">Riesgo medio</span>
              <span className="dash-metric-value">{(risk?.portfolioRisk ?? 0).toFixed(2)}</span>
            </div>
            <div className="dash-metric-card">
              <span className="dash-metric-label">Retorno est.</span>
              <span className="dash-metric-value green">{(risk?.expectedReturn ?? 0).toFixed(1)}%</span>
            </div>
            <div className="dash-metric-card">
              <span className="dash-metric-label">HHI</span>
              <span className={`dash-metric-value ${(risk?.hhi ?? 0) > 0.25 ? 'red' : ''}`}>
                {(risk?.hhi ?? 0).toFixed(4)}
              </span>
            </div>
            <div className="dash-metric-card">
              <span className="dash-metric-label">Cash drag</span>
              <span className="dash-metric-value muted">{(risk?.cashDrag ?? 0).toFixed(4)}</span>
            </div>
          </div>

          {/* Asset class breakdown */}
          <div className="dash-class-list">
            {classRows.map(([cls, pct]) => (
              <div key={cls} className="dash-class-row">
                <span className="dash-class-name">{cls}</span>
                <div className="dash-class-track">
                  <div className="dash-class-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <span className="dash-class-pct">{pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* ══ ROW 4: Rebalance + Flows (2 col, solo si hay plan) ══ */}
      {(rebalancePlan?.actions?.length > 0 || flows.length > 0) && (
        <div className="dash-two-col">

          {rebalancePlan?.actions?.length > 0 && (
            <Section eyebrow="Acciones sugeridas" title="Plan de rebalanceo">
              <div className="dash-plan-list">
                {rebalancePlan.actions.map((a, i) => (
                  <div key={i} className="dash-plan-row">
                    <span className="dash-plan-action">BUY</span>
                    <div className="dash-plan-body">
                      <span className="dash-plan-asset">{a.asset}</span>
                      <span className="dash-plan-reason">{a.reason}</span>
                    </div>
                    <span className="dash-plan-amount">{fmt(a.amountUSD, 2)}</span>
                  </div>
                ))}
              </div>
              <div className="dash-plan-footer">
                <span>Cash restante</span>
                <span>{fmt(rebalancePlan.remainingCash, 2)}</span>
              </div>
            </Section>
          )}

          <Section eyebrow="Flujo de capital" title="¿A dónde mover el dinero?">
            <div className="dash-flow-list">
              {flows.map((f, i) => (
                <div key={i} className="dash-flow-row">
                  <span className="dash-flow-from">{f.from}</span>
                  <div className="dash-flow-arrow">
                    <ArrowRight size={12} />
                  </div>
                  <span className="dash-flow-to" style={{ color: f.color }}>{f.to}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      )}

      {/* ══ ROW 5: Assets by role + Rules (2 col) ══ */}
      <div className="dash-two-col">

        <Section eyebrow="Clasificación" title="Activos por rol">
          <div className="dash-assets-list">
            {Object.entries(byRoleMap)
              .sort((a, b) => roleOrder.indexOf(a[0]) - roleOrder.indexOf(b[0]))
              .map(([role, list]) => {
                const color = ROLE_COLORS[role] || '#fff';
                const bg    = ROLE_COLORS_BG[role] || 'rgba(255,255,255,0.04)';
                return (
                  <div key={role} className="dash-role-group">
                    <div className="dash-role-group-head" style={{ background: bg }}>
                      <span className="dash-role-dot" style={{ background: color }} />
                      <span className="dash-role-group-label" style={{ color }}>{role}</span>
                      <span className="dash-role-group-count">{list.length}</span>
                    </div>
                    <div className="dash-role-group-items">
                      {list
                        .sort((a, b) => b.valueUSD - a.valueUSD)
                        .map((a, i) => (
                          <div key={i} className="dash-asset-row">
                            <span className="dash-asset-name">{a.name || a.symbol}</span>
                            <div className="dash-asset-right">
                              {a.strategy?.reduce && (
                                <span className="dash-asset-reduce">↓ reducir</span>
                              )}
                              <span className="dash-asset-value">{fmt(a.valueUSD, 0)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </Section>

        <Section eyebrow="Decisiones" title="Reglas disparadas">
          <ol className="dash-rules-list">
            {(ruleEvaluation || []).map((r, i) => (
              <li key={i} className="dash-rule-row">
                <span className="dash-rule-num">{i + 1}</span>
                <span className={`dash-rule-text ${r === 'Portfolio balanceado' ? 'ok' : ''}`}>{r}</span>
              </li>
            ))}
          </ol>
        </Section>

      </div>

    </div>
  );
};
const Portfolio = () => {
  const {
    cryptoAssets, inversionPositions, manualAssets,
    totalCryptoUSD, totalInversionUSD, totalManualUSD,
    binanceSnap, loading, bobRate,
  } = useApp();

  const [activeTab, setActiveTab]       = useState('Todos');
  const [visibleGroups, setVisibleGroups] = useState({});
  const [copied, setCopied]             = useState(false);
const [legendOpen, setLegendOpen] = useState(false);
  const bs            = binanceSnap?.snapshot || {};
  const reservedBUY   = bs.reservedCapitalUSD ?? 0;
  const pendingSELL   = bs.pendingSellUSD ?? 0;
  const grossExposure = bs.grossExposureUSD ?? 0;
  const riskScore     = bs.riskMetrics?.riskScore ?? 0;
  const riskColor     = riskScore >= 70 ? 'text-rose-400' : riskScore >= 40 ? 'text-yellow-400' : 'text-emerald-400';

  const stableAssets = useMemo(
    () => cryptoAssets.filter(a => STABLES.includes(a.symbol) && a.netExposureUSD > 0),
    [cryptoAssets]
  );
  const volatileAssets = useMemo(
    () => cryptoAssets.filter(a => !STABLES.includes(a.symbol) && (a.netExposureUSD > 0 || a.pendingBuyUSD > 0)),
    [cryptoAssets]
  );

  const groupDefinitions = useMemo(() => {
    const base = [
      { groupKey: 'crypto',  label: 'Crypto',    color: HIGH_CONTRAST_COLORS[0], type: 'crypto'  },
      { groupKey: 'stable',  label: 'Cash',       color: HIGH_CONTRAST_COLORS[1], type: 'stable'  },
      { groupKey: 'etf',     label: 'ETFs',       color: HIGH_CONTRAST_COLORS[2], type: 'etf'     },
    ];
    const qAssets  = (manualAssets ?? []).filter(isQuantfury);
    const mAssets  = (manualAssets ?? []).filter(a => !isQuantfury(a));
    const qGroup   = qAssets.length > 0
      ? [{ groupKey: 'quantfury', label: 'Quantfury', color: HIGH_CONTRAST_COLORS[3], type: 'stock' }]
      : [];
    const mGroups  = mAssets.map((a, idx) => ({
      groupKey: `manual-${a.id}`,
      label: a.name,
      color: HIGH_CONTRAST_COLORS[(idx + 4) % HIGH_CONTRAST_COLORS.length],
      type: 'manual',
      rawId: a.id,
    }));
    return [...base, ...qGroup, ...mGroups];
  }, [manualAssets]);

  useEffect(() => {
    setVisibleGroups(prev => {
      const next = {};
      groupDefinitions.forEach(g => { next[g.groupKey] = prev[g.groupKey] ?? true; });
      return next;
    });
  }, [groupDefinitions]);

  const pieData = useMemo(() => {
    const cryptoVal = volatileAssets.reduce((s, a) => s + a.netExposureUSD + (a.pendingBuyUSD ?? 0), 0);
    const stableVal = stableAssets.reduce((s, a) => s + a.netExposureUSD, 0);
    const etfVal    = inversionPositions.reduce((s, p) => s + (p.valueUSD ?? 0), 0);
    const base = [
      { groupKey: 'crypto',  label: 'Crypto',     valueUSD: cryptoVal, color: HIGH_CONTRAST_COLORS[0], type: 'crypto'  },
      { groupKey: 'stable',  label: 'USDT (Cash)', valueUSD: stableVal, color: HIGH_CONTRAST_COLORS[1], type: 'stable'  },
      { groupKey: 'etf',     label: 'ETFs',        valueUSD: etfVal,    color: HIGH_CONTRAST_COLORS[2], type: 'etf'     },
    ].filter(i => i.valueUSD > 0);
    const qAssets = (manualAssets ?? []).filter(isQuantfury);
    const mAssets = (manualAssets ?? []).filter(a => !isQuantfury(a));
    const qVal    = qAssets.reduce((s, a) => s + (a.valueUSD ?? 0), 0);
    const qItem   = qVal > 0 ? [{ groupKey: 'quantfury', label: 'Quantfury', valueUSD: qVal, color: HIGH_CONTRAST_COLORS[3], type: 'stock' }] : [];
    const mItems  = mAssets.map((a, idx) => ({
      groupKey: `manual-${a.id}`, label: a.name,
      valueUSD: a.valueUSD ?? 0,
      color: HIGH_CONTRAST_COLORS[(idx + 4) % HIGH_CONTRAST_COLORS.length],
      type: 'manual', rawId: a.id,
    })).filter(i => i.valueUSD > 0);
    return [...base, ...qItem, ...mItems];
  }, [volatileAssets, stableAssets, inversionPositions, manualAssets]);

  const visiblePieData = useMemo(
    () => pieData.filter(i => visibleGroups[i.groupKey] !== false),
    [pieData, visibleGroups]
  );
  const totalUSD = useMemo(() => visiblePieData.reduce((s, i) => s + i.valueUSD, 0), [visiblePieData]);
  const visibleGroupSet = useMemo(() => new Set(visiblePieData.map(i => i.groupKey)), [visiblePieData]);

  const allAssets = useMemo(() => [
    ...volatileAssets.map(a => ({
      id: `crypto-${a.symbol}`, groupKey: 'crypto', type: 'crypto',
      symbol: a.symbol, name: a.symbol,
      subtitle: `${a.quantity?.toFixed(4) ?? 0} ${a.symbol}`,
      price: a.currentPrice,
      valueUSD: a.netExposureUSD + (a.pendingBuyUSD ?? 0),
      pnl: null, pnlPct: null,
      extra: a.pendingBuyUSD > 0 ? `+${fmt(a.pendingBuyUSD, 2)} orden` : null,
    })),
    ...stableAssets.map(a => ({
      id: `stable-${a.symbol}`, groupKey: 'stable', type: 'stable',
      symbol: a.symbol, name: `${a.symbol} (Cash)`,
      subtitle: `${a.quantity?.toFixed(2) ?? 0} ${a.symbol}`,
      price: 1, valueUSD: a.netExposureUSD,
      pnl: null, pnlPct: null, extra: null,
    })),
    ...inversionPositions.map(p => ({
      id: `etf-${p.id}`, groupKey: 'etf', type: 'etf',
      symbol: p.symbol, name: p.symbol,
      subtitle: `${p.quantity} u · ${fmt(p.currentPrice, 2)}`,
      price: p.currentPrice, valueUSD: p.valueUSD,
      pnl: p.unrealizedPL,
      pnlPct: p.avgBuyPrice > 0 ? ((p.currentPrice - p.avgBuyPrice) / p.avgBuyPrice) * 100 : null,
      extra: p.tp > 0 ? `TP ${fmt(p.tp, 2)}` : null,
    })),
    ...(manualAssets ?? []).map(a => ({
      id: `manual-${a.id}`, rawId: a.id,
      groupKey: isQuantfury(a) ? 'quantfury' : `manual-${a.id}`,
      type: isQuantfury(a) ? 'stock' : (a.type || 'manual'),
      symbol: a.name?.slice(0, 4).toUpperCase() || 'MAN',
      name: a.name,
      subtitle: a.note || (a.currency === 'BOB' ? `Bs ${a.amount?.toFixed(2)}` : fmt(a.amount, 2)),
      price: null, valueUSD: a.valueUSD,
      pnl: null, pnlPct: null,
      extra: a.since ? `Desde ${a.since}` : null,
    })),
  ].filter(a => visibleGroupSet.has(a.groupKey)),
  [volatileAssets, stableAssets, inversionPositions, manualAssets, visibleGroupSet]);
    const v3 = useMemo(() => buildPortfolioV3({
    allAssets,
    totalUSD,
    reservedBUY,
    pendingSELL,
    grossExposure,
  }), [allAssets, totalUSD, reservedBUY, pendingSELL, grossExposure]);

  const tabFilter = {
    Todos:  () => true,
    Crypto: a => a.type === 'crypto' || a.type === 'stable',
    ETFs:   a => a.type === 'etf',
    Manual: a => a.type === 'manual' || a.type === 'stock',
  };

  const filtered = allAssets
    .filter(tabFilter[activeTab])
    .sort((a, b) => (b.valueUSD ?? 0) - (a.valueUSD ?? 0));

  const toggleGroup = (groupKey) =>
    setVisibleGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));

  const visibleManualUSD = visiblePieData
    .filter(i => i.type === 'manual' || i.type === 'stock')
    .reduce((s, i) => s + i.valueUSD, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(v3, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="portfolio-loading"><div className="portfolio-spinner" /></div>
  );

  return (
    <div className="portfolio-page">

{/* ── Hero ── */}
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
      <button type="button" onClick={handleCopy} className="portfolio-copy-btn">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'Copiado' : 'Copiar V3'}</span>
      </button>
    </div>
  </div>

  <div className="portfolio-group-toggles">
    {groupDefinitions.map(group => {
      const active = visibleGroups[group.groupKey] ?? true;
      return (
        <button key={group.groupKey} type="button"
          onClick={() => toggleGroup(group.groupKey)}
          className={`portfolio-toggle-chip ${active ? 'active' : ''}`}>
          <span className="portfolio-toggle-chip__dot" style={{ backgroundColor: group.color }} />
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
        <StatCard label="Total visible" value={fmt(totalUSD)}         tone="text-white"      />
        <StatCard label="Crypto"        value={fmt(visiblePieData.filter(i=>i.type==='crypto'||i.type==='stable').reduce((s,i)=>s+i.valueUSD,0))} tone="text-orange-400" />
        <StatCard label="ETFs"          value={fmt(visiblePieData.filter(i=>i.type==='etf').reduce((s,i)=>s+i.valueUSD,0))}    tone="text-blue-400"   />
        <StatCard label="Manual"        value={fmt(visibleManualUSD)} tone="text-violet-400" />
      </div>

      {/* ── Legend toggle ── */}
      <button
        type="button"
        onClick={() => setLegendOpen(prev => !prev)}
        className="portfolio-legend-toggle"
        aria-expanded={legendOpen}
      >
        <span>Desglose</span>
        <span className="portfolio-legend-toggle__count">{visiblePieData.length}</span>
        <ChevronDown size={14} className={`portfolio-legend-toggle__chevron ${legendOpen ? 'open' : ''}`} />
      </button>

      <div className={`portfolio-legend-collapsible ${legendOpen ? 'open' : ''}`}>
        <div className="portfolio-legend-grid">
          {visiblePieData.map((d, i) => (
            <div key={i} className="portfolio-legend-card">
              <div className="portfolio-legend-top">
                <span className="portfolio-legend-dot" style={{ backgroundColor: d.color }} />
                <span className="portfolio-legend-label">{d.label}</span>
              </div>
              <div className="portfolio-legend-bottom">
                <span className="portfolio-legend-value">{fmt(d.valueUSD)}</span>
                <span className="portfolio-legend-pct">{totalUSD > 0 ? ((d.valueUSD/totalUSD)*100).toFixed(1) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
</section>
 {/* ── Dashboard V3 ── */}
      <section className="portfolio-card">
        <div className="portfolio-section-head compact">
          <div>
            <p className="portfolio-eyebrow">Análisis automático</p>
            <h2 className="portfolio-subtitle">Dashboard V3</h2>
          </div>
          <BarChart2 size={16} className="text-white/20" />
        </div>
        <Dashboard v3={v3} />
      </section>
      {/* ── Binance risk ── */}
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
                <div className="portfolio-riskbar-segment spot" style={{ width: `${(totalCryptoUSD/grossExposure)*100}%` }} />
                <div className="portfolio-riskbar-segment buy"  style={{ width: `${(reservedBUY/grossExposure)*100}%`    }} />
                <div className="portfolio-riskbar-segment sell" style={{ width: `${(pendingSELL/grossExposure)*100}%`     }} />
              </div>
              <div className="portfolio-risk-legend">
                <span><i className="spot"/>Spot</span>
                <span><i className="buy"/>Ord. BUY</span>
                <span><i className="sell"/>Ord. SELL</span>
              </div>
            </>
          )}
          <div className="portfolio-stats-grid four">
            <StatCard label="Spot"       value={fmt(totalCryptoUSD, 2)} tone="text-white"      />
            <StatCard label="Ord. BUY"   value={fmt(reservedBUY, 2)}    tone="text-yellow-400" />
            <StatCard label="Ord. SELL"  value={fmt(pendingSELL, 2)}    tone="text-blue-400"   />
            <StatCard label="Exposición" value={fmt(grossExposure, 2)}  tone="text-emerald-400"/>
          </div>
          <div className="portfolio-stats-grid two">
            <StatCard label="HHI"       value={(bs.riskMetrics?.herfindahlIndex??0).toFixed(4)} tone="text-white" />
            <StatCard label="Top 3 conc." value={`${(bs.riskMetrics?.top3ConcentrationPct??0).toFixed(1)}%`}
              tone={(bs.riskMetrics?.top3ConcentrationPct??0)>80?'text-rose-400':'text-white'} />
          </div>
        </section>
      )}

     

      {/* ── Tabs ── */}
      <section className="portfolio-tabs-wrap">
        <div className="portfolio-tabs-scroll">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`portfolio-tab ${activeTab === tab ? 'active' : ''}`}>{tab}</button>
          ))}
        </div>
      </section>

      {/* ── Asset list ── */}
      <section className="portfolio-assets">
        <div className="portfolio-assets-head desktop-only">
          <span className="col-span-2">Activo</span>
          <span className="text-right">Valor</span>
          <span className="text-right">P&amp;L</span>
        </div>
        {filtered.length === 0 && <p className="portfolio-empty">Sin activos visibles</p>}
        {filtered.map(a => {
          const v3Asset = v3?.assets?.find(x => x.name === a.name || x.symbol === a.symbol);
          const role    = v3Asset?.classification?.role;
          const reduce  = v3Asset?.strategy?.reduce;
          return (
            <article key={a.id} className="portfolio-asset-card">
              <div className="portfolio-asset-main">
                <div className="portfolio-asset-icon">
                  <TypeIcon type={a.type} symbol={a.symbol} />
                </div>
                <div className="portfolio-asset-copy">
                  <div className="portfolio-asset-title-row">
                    <p className="portfolio-asset-title">{a.name}</p>
                    {role && (
                      <span className="portfolio-chip text-[9px] font-black uppercase tracking-wide"
                            style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + '33', backgroundColor: ROLE_COLORS[role] + '11' }}>
                        {role}
                      </span>
                    )}
                  </div>
                  <p className="portfolio-asset-subtitle">{a.subtitle}</p>
                  {a.extra && <p className="portfolio-asset-extra">{a.extra}</p>}
                  {reduce && <p className="portfolio-asset-extra text-rose-400">↓ Reducir posición</p>}
                </div>
              </div>
              <div className="portfolio-asset-metrics">
                <div className="portfolio-metric-block">
                  <p className="portfolio-metric-label">Valor</p>
                  <p className="portfolio-metric-value">{fmt(a.valueUSD)}</p>
                  <p className="portfolio-metric-subvalue">{fmtB(a.valueUSD, bobRate)}</p>
                </div>
                <div className="portfolio-metric-block align-end">
                  <p className="portfolio-metric-label">P&amp;L</p>
                  {a.pnl != null ? (
                    <>
                      <div className={`portfolio-pnl ${a.pnl >= 0 ? 'up' : 'down'}`}>
                        {a.pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{fmt(Math.abs(a.pnl), 2)}</span>
                      </div>
                      {a.pnlPct != null && (
                        <p className={`portfolio-pnl-pct ${a.pnl >= 0 ? 'up' : 'down'}`}>
                          {a.pnl >= 0 ? '+' : ''}{a.pnlPct.toFixed(1)}%
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="portfolio-metric-empty">—</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

    </div>
  );
};

export default Portfolio;