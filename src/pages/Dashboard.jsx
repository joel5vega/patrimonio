// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Plus,
  ArrowUpRight, ArrowDownRight, FileText, BarChart2,
  ChevronDown, ChevronUp, Calendar, History,
  Wallet, PieChart, Zap, Target, BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';
import { useIdeas } from '../hooks/useIdeas';
import { useStandouts } from '../hooks/useStandouts';
import { animate, stagger } from 'animejs';
import './Dashboard.css';

// ── Helpers de fecha ──────────────────────────────────────
const excelSerialToDate = (value) => {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isNaN(num)) {
    const base = new Date(1899, 11, 30);
    return new Date(base.getTime() + num * 86400000);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseDateMs = (d) => {
  const dt = excelSerialToDate(d);
  return dt ? dt.getTime() : 0;
};

const isTodayRecord = (recordDate) => {
  if (!recordDate) return false;
  const today  = new Date();
  const str1   = today.toISOString().slice(0, 10);
  const str2   = str1.replace(/-/g, '.');
  if (typeof recordDate === 'string')
    return recordDate.startsWith(str1) || recordDate.startsWith(str2);
  const d = excelSerialToDate(recordDate);
  if (!d || isNaN(d.getTime())) return false;
  return d.getDate() === today.getDate()
    && d.getMonth()  === today.getMonth()
    && d.getFullYear() === today.getFullYear();
};

// ── Versículos ────────────────────────────────────────────
const VERSICULOS = [
  { text: 'La riqueza lograda de la noche a la mañana pronto desaparece; pero la que es fruto del arduo trabajo aumenta con el tiempo.', ref: 'Proverbios 13:11 NTV' },
  { text: 'La bendición del Señor trae riquezas que no vienen acompañadas de tristezas.', ref: 'Proverbios 10:22 NTV' },
  { text: 'Las ganancias de los justos realzan sus vidas, pero la gente malvada derrocha su dinero en el pecado.', ref: 'Proverbios 10:16 NTV' },
  { text: 'Los sabios tienen riquezas y lujos, pero los necios gastan todo lo que consiguen.', ref: 'Proverbios 21:20 NTV' },
  { text: 'Honra al Señor con tus riquezas y con los primeros frutos de tus cosechas.', ref: 'Proverbios 3:9 NTV' },
  { text: 'Más vale tener poco, con temor del Señor, que muchas riquezas con grandes angustias.', ref: 'Proverbios 15:16 NTV' },
  { text: 'Vale más la buena fama que las muchas riquezas.', ref: 'Proverbios 22:1 NTV' },
  { text: 'Manténganse libres del amor al dinero y conténtense con lo que tienen.', ref: 'Hebreos 13:5 NTV' },
  { text: '«Así es, el que almacena riquezas terrenales pero no es rico en su relación con Dios es un necio».', ref: 'Lucas 12:21 NTV' },
  { text: 'Donde esté su tesoro, allí estarán también los deseos de su corazón.', ref: 'Lucas 12:34 NTV' },
  { text: 'El que ama el dinero no se saciará de dinero. También esto es vanidad.', ref: 'Eclesiastés 5:10 NTV' },
  { text: '¿Por qué gastan dinero en lo que no es pan, y su salario en lo que no sacia?', ref: 'Isaías 55:2 NTV' },
];

// ── BibleVerse ────────────────────────────────────────────
const BibleVerse = () => {
  const [idx,     setIdx]     = useState(() => Math.floor(Math.random() * VERSICULOS.length));
  const [phase,   setPhase]   = useState('visible'); // 'visible' | 'out' | 'in'
  const cardRef   = useRef(null);
  const quoteRef  = useRef(null);

  // Animación de entrada inicial
  useEffect(() => {
    if (!cardRef.current) return;
    animate(cardRef.current, {
      opacity: [0, 1], translateY: [-16, 0], scale: [0.97, 1],
      duration: 700, ease: 'outExpo',
    });
  }, []);

  // Rotación cada 30s
  useEffect(() => {
    const timer = setInterval(() => {
      // Salida
      if (cardRef.current) {
        animate(cardRef.current, {
          opacity: [1, 0], translateY: [0, -10], scale: [1, 0.97],
          duration: 350, ease: 'inExpo',
        });
      }
      setTimeout(() => {
        setIdx(prev => {
          let next;
          do { next = Math.floor(Math.random() * VERSICULOS.length); } while (next === prev);
          return next;
        });
        // Entrada
        setTimeout(() => {
          if (cardRef.current) {
            animate(cardRef.current, {
              opacity: [0, 1], translateY: [10, 0], scale: [0.97, 1],
              duration: 500, ease: 'outExpo',
            });
          }
        }, 50);
      }, 380);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const v = VERSICULOS[idx];

  return (
    <div ref={cardRef} className="db-verse-card" style={{ opacity: 0 }}>
      <div className="db-verse-icon-wrap">
        <BookOpen size={16} />
      </div>
      <blockquote className="db-verse-text">"{v.text}"</blockquote>
      <cite className="db-verse-ref">— {v.ref}</cite>
    </div>
  );
};

// ── Contador animado ──────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', decimals = 2, className = '' }) => {
  const ref     = useRef(null);
  const prevRef = useRef(0);
  const rafRef  = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to   = Number(value) || 0;
    prevRef.current = to;

    if (from === to) return;

    const duration  = 900;
    const startTime = performance.now();
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutExpo(progress);
      const current  = from + (to - from) * eased;

      if (ref.current) {
        ref.current.textContent =
          prefix +
          current
            .toFixed(decimals)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const formatted = (Number(value) || 0)
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}
    </span>
  );
};

// ── Mini Sparkline SVG ────────────────────────────────────
const Sparkline = ({ data = [], color = '#14b8a6', height = 36 }) => {
  if (data.length < 2) return null;
  const W = 80;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={height} className="db-sparkline">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── StatCard ──────────────────────────────────────────────
const StatCard = ({ label, value, prefix = '$', color, icon: Icon, trend, sparkData, delay = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1], translateY: [20, 0], scale: [0.95, 1],
      duration: 500, ease: 'outExpo', delay,
    });
  }, []);

  return (
    <div ref={ref} className="db-stat-card" style={{ opacity: 0 }}>
      <div className="db-stat-top">
        <div className="db-stat-icon" style={{ color }}>
          <Icon size={16} />
        </div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
      <p className="db-stat-label">{label}</p>
      <p className="db-stat-value" style={{ color }}>
        {prefix}{Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
      </p>
      {trend != null && (
        <div className={`db-stat-trend ${trend >= 0 ? 'db-stat-trend--up' : 'db-stat-trend--down'}`}>
          {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// ── QuickMetric ───────────────────────────────────────────
const QuickMetric = ({ label, value, sub, color = '#14b8a6' }) => (
  <div className="db-quick-metric">
    <p className="db-quick-label">{label}</p>
    <p className="db-quick-value" style={{ color }}>{value}</p>
    {sub && <p className="db-quick-sub">{sub}</p>}
  </div>
);

// ── TransactionItem ───────────────────────────────────────
const TransactionItem = ({ type, concept, title, dateLabel, amount, currency }) => {
  const isIncome = type === 'income';
  return (
    <div className={`db-tx-item ${isIncome ? 'db-tx-item--income' : 'db-tx-item--expense'}`}>
      <div className="db-tx-icon">
        {isIncome
          ? <ArrowUpRight size={16} strokeWidth={2.5} />
          : <ArrowDownRight size={16} strokeWidth={2.5} />}
      </div>
      <div className="db-tx-info">
        <p className="db-tx-concept">{concept || title || 'Transacción'}</p>
        <p className="db-tx-date">{dateLabel || '—'}</p>
      </div>
      <p className={`db-tx-amount ${isIncome ? 'db-tx-amount--income' : 'db-tx-amount--expense'}`}>
        {isIncome ? '+' : '-'}{currency === 'USD' ? '$' : 'Bs '}
        {Number(Math.abs(amount || 0)).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
};

// ── MarkdownCard ──────────────────────────────────────────
const MarkdownCard = ({ type, title, subtitle, markdown }) => {
  const [expanded, setExpanded] = useState(false);
  const config = {
    idea:     { label: 'Idea',     Icon: FileText, color: '#22d3ee' },
    standout: { label: 'Standout', Icon: BarChart2, color: '#a78bfa' },
  };
  const { label, Icon, color } = config[type] || config.idea;
  if (!markdown) return null;

  return (
    <div className="db-md-card">
      <div className="db-md-header">
        <span className="db-md-badge" style={{ color, borderColor: color + '44', background: color + '14' }}>
          <Icon size={11} strokeWidth={2.5} /> {label}
        </span>
        <h3 className="db-md-title">{title}</h3>
        <p className="db-md-subtitle">{subtitle}</p>
      </div>
      <div className={`db-md-body ${!expanded ? 'db-md-body--collapsed' : ''}`}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
        {!expanded && <div className="db-md-fade" />}
      </div>
      <button className="db-md-toggle" onClick={() => setExpanded(v => !v)}>
        {expanded ? <><ChevronUp size={13} /> Colapsar</> : <><ChevronDown size={13} /> Expandir</>}
      </button>
    </div>
  );
};

// ── SectionHeader ─────────────────────────────────────────
const SectionHeader = ({ title, action, onAction }) => (
  <div className="db-section-header">
    <h3 className="db-section-title">{title}</h3>
    {action && (
      <button className="db-section-action" onClick={onAction}>{action}</button>
    )}
  </div>
);

// ── Dashboard ─────────────────────────────────────────────
const Dashboard = () => {
  const {
    totalValue      = 0,
    totalPnl        = 0,
    transactions    = [],
    totalCryptoUSD  = 0,
    totalInversionUSD = 0,
    totalManualUSD  = 0,
    bobRate         = 6.96,
    loading         = false,
    monthlyReturn   = 0,
  } = useApp();

  const { ideas,     loading: loadingIdeas }     = useIdeas();
  const { standouts, loading: loadingStandouts } = useStandouts();

  const [timeFilter, setTimeFilter] = useState('today');
  const navigate = useNavigate();

  // Refs para animar secciones
  const heroRef    = useRef(null);
  const metricsRef = useRef(null);
  const txRef      = useRef(null);

  useEffect(() => {
    if (loading) return;
    // Hero
    if (heroRef.current) {
      animate(heroRef.current, {
        opacity: [0, 1], translateY: [-20, 0],
        duration: 600, ease: 'outExpo', delay: 100,
      });
    }
    // Métricas con stagger
    if (metricsRef.current) {
      animate(metricsRef.current.querySelectorAll('.db-stat-card'), {
        opacity: [0, 1], translateY: [24, 0], scale: [0.94, 1],
        duration: 500, ease: 'outExpo', delay: stagger(80, { start: 300 }),
      });
    }
  }, [loading]);

  // Animar transacciones al cambiar filtro
  useEffect(() => {
    if (!txRef.current) return;
    animate(txRef.current.querySelectorAll('.db-tx-item'), {
      opacity: [0, 1], translateX: [-12, 0],
      duration: 280, ease: 'outExpo', delay: stagger(40),
    });
  }, [timeFilter]);

  if (loading) return (
    <div className="db-loading">
      <div className="db-loading-spinner" />
    </div>
  );

  const isPositive = totalPnl >= 0;
  const usdValue   = bobRate > 0 ? totalValue / bobRate : 0;

  // Porcentaje de cada segmento sobre el total
  const totalUSD  = totalCryptoUSD + totalInversionUSD + (totalManualUSD ?? 0);
  const pctCrypto = totalUSD > 0 ? (totalCryptoUSD / totalUSD * 100) : 0;
  const pctEtf    = totalUSD > 0 ? (totalInversionUSD / totalUSD * 100) : 0;
  const pctManual = totalUSD > 0 ? ((totalManualUSD ?? 0) / totalUSD * 100) : 0;

  // Filtrado
  const filteredIdeas     = timeFilter === 'today'
    ? ideas.filter(i => isTodayRecord(i.date || i.createdAt))
    : ideas;
  const filteredStandouts = timeFilter === 'today'
    ? standouts.filter(s => isTodayRecord(s.date || s.createdAt))
    : standouts;

  const sortedTx = [...(transactions || [])].sort((a, b) => parseDateMs(b.date) - parseDateMs(a.date));
  const recent   = sortedTx
    .filter(tx => typeof tx.amount === 'number' && (timeFilter === 'history' || isTodayRecord(tx.date)))
    .slice(0, timeFilter === 'history' ? 20 : 10)
    .map(tx => {
      const d = excelSerialToDate(tx.date);
      const dateLabel = d
        ? d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      return { ...tx, dateLabel };
    });

  // Totales de ingresos/egresos del período visible
  const totalIncome  = recent.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const totalExpense = recent.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  return (
    <div className="db-page">

      {/* ── Versículo ── */}
      <div className="db-verse-wrap">
        <BibleVerse />
      </div>

      {/* ── Hero ── */}
      <div ref={heroRef} className="db-hero" style={{ opacity: 0 }}>
        <div className="db-hero-bg-glow" />

        <div className="db-hero-eyebrow">
          <Wallet size={13} />
          Patrimonio Total
        </div>

        <div className="db-hero-main">
          <div className="db-hero-bs">
            Bs <AnimatedNumber value={totalValue} prefix="" decimals={2} className="db-hero-bs-num" />
          </div>
          <div className="db-hero-usd">
            <AnimatedNumber value={usdValue} prefix="$" decimals={2} className="db-hero-usd-num" />
            <span className="db-hero-usd-label">USD</span>
            <span className="db-hero-rate">Bs {bobRate.toFixed(2)}/USD</span>
          </div>
        </div>

        {/* Barra de distribución */}
        <div className="db-hero-alloc">
          <div className="db-alloc-bar">
            <div className="db-alloc-seg db-alloc-seg--crypto"
              style={{ width: `${pctCrypto}%` }} />
            <div className="db-alloc-seg db-alloc-seg--etf"
              style={{ width: `${pctEtf}%` }} />
            <div className="db-alloc-seg db-alloc-seg--manual"
              style={{ width: `${pctManual}%` }} />
          </div>
          <div className="db-alloc-legend">
            <span className="db-alloc-dot db-alloc-dot--crypto" />
            <span className="db-alloc-lbl">Crypto {pctCrypto.toFixed(0)}%</span>
            <span className="db-alloc-dot db-alloc-dot--etf" />
            <span className="db-alloc-lbl">ETFs {pctEtf.toFixed(0)}%</span>
            <span className="db-alloc-dot db-alloc-dot--manual" />
            <span className="db-alloc-lbl">Manual {pctManual.toFixed(0)}%</span>
          </div>
        </div>

        {/* Badges P&L */}
        <div className="db-hero-badges">
          <div className={`db-badge ${isPositive ? 'db-badge--up' : 'db-badge--down'}`}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)} P&amp;L
          </div>
          <div className="db-badge db-badge--teal">
            <Zap size={13} />
            +{monthlyReturn}% este mes
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div ref={metricsRef} className="db-stats-grid">
        <StatCard
          label="Crypto"
          value={totalCryptoUSD}
          color="#f97316"
          icon={Activity}
          trend={null}
          delay={0}
        />
        <StatCard
          label="ETFs"
          value={totalInversionUSD}
          color="#3b82f6"
          icon={PieChart}
          trend={null}
          delay={80}
        />
        <StatCard
          label="Manual"
          value={totalManualUSD ?? 0}
          color="#10b981"
          icon={Target}
          trend={null}
          delay={160}
        />
      </div>

      {/* ── Resumen flujo del período ── */}
      <div className="db-flow-card">
        <p className="db-flow-title">
          <Calendar size={13} />
          Flujo — {timeFilter === 'today' ? 'Hoy' : 'Histórico'}
        </p>
        <div className="db-flow-row">
          <QuickMetric
            label="Ingresos"
            value={`Bs ${totalIncome.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
            color="#34d399"
          />
          <div className="db-flow-divider" />
          <QuickMetric
            label="Egresos"
            value={`Bs ${totalExpense.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
            color="#fb7185"
          />
          <div className="db-flow-divider" />
          <QuickMetric
            label="Balance"
            value={`Bs ${Math.abs(balance).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
            sub={balance >= 0 ? 'positivo' : 'negativo'}
            color={balance >= 0 ? '#34d399' : '#fb7185'}
          />
        </div>
        {/* Barra visual ingreso vs egreso */}
        {(totalIncome + totalExpense) > 0 && (
          <div className="db-flow-bar-wrap">
            <div className="db-flow-bar">
              <div className="db-flow-bar-income"
                style={{ width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Filtro de tiempo ── */}
      <div className="db-filter-bar">
        <button
          className={`db-filter-btn ${timeFilter === 'today' ? 'db-filter-btn--active' : ''}`}
          onClick={() => setTimeFilter('today')}
        >
          <Calendar size={13} strokeWidth={2.5} /> Hoy
        </button>
        <button
          className={`db-filter-btn ${timeFilter === 'history' ? 'db-filter-btn--active' : ''}`}
          onClick={() => setTimeFilter('history')}
        >
          <History size={13} strokeWidth={2.5} /> Histórico
        </button>
      </div>

      {/* ── Actividad reciente ── */}
      <div className="db-section">
        <SectionHeader
          title="Actividad Reciente"
          action="Ver todo"
          onAction={() => navigate('/transactions')}
        />
        <div ref={txRef} className="db-tx-list">
          {recent.length === 0 ? (
            <div className="db-empty">
              Sin actividad {timeFilter === 'today' ? 'hoy' : 'reciente'}
            </div>
          ) : (
            recent.map(tx => (
              <TransactionItem
                key={tx.id}
                type={tx.type}
                concept={tx.concept}
                title={tx.title}
                dateLabel={tx.dateLabel}
                amount={tx.amount}
                currency={tx.currency}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Ideas del día ── */}
      {!loadingIdeas && filteredIdeas.length > 0 && (
        <div className="db-section">
          <SectionHeader title="Ideas" />
          <div className="db-cards-list">
            {filteredIdeas.map((idea, i) => (
              <MarkdownCard
                key={idea.id ?? i}
                type="idea"
                title={idea.title || idea.symbol || 'Sin título'}
                subtitle={idea.subtitle || idea.ticker || ''}
                markdown={idea.markdown || idea.content || idea.notes}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Standouts ── */}
      {!loadingStandouts && filteredStandouts.length > 0 && (
        <div className="db-section">
          <SectionHeader title="Standouts" />
          <div className="db-cards-list">
            {filteredStandouts.map((s, i) => (
              <MarkdownCard
                key={s.id ?? i}
                type="standout"
                title={s.title || s.symbol || 'Sin título'}
                subtitle={s.subtitle || s.ticker || ''}
                markdown={s.markdown || s.content || s.notes}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Accesos rápidos ── */}
      <div className="db-section">
        <SectionHeader title="Accesos Rápidos" />
        <div className="db-shortcuts">
          {[
            { label: 'Portafolio',  icon: PieChart,   path: '/portfolio',    color: '#3b82f6' },
            { label: 'Historial',   icon: Activity,   path: '/wealth',       color: '#14b8a6' },
            { label: 'Análisis',    icon: BarChart2,  path: '/analytics',    color: '#a78bfa' },
            { label: 'Inversiones', icon: TrendingUp, path: '/investments',  color: '#f97316' },
          ].map(({ label, icon: Icon, path, color }) => (
            <button key={path} className="db-shortcut" onClick={() => navigate(path)}>
              <div className="db-shortcut-icon" style={{ color, background: color + '18', borderColor: color + '33' }}>
                <Icon size={20} />
              </div>
              <span className="db-shortcut-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        className="db-fab"
        onClick={() => navigate('/new-transaction')}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

    </div>
  );
};

export default Dashboard;