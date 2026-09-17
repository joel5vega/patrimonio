import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Layers3,
  Cpu,
  HeartPulse,
  Shield,
  ShoppingCart,
  ShoppingBag,
  Landmark,
  Fuel,
  Leaf,
  Mountain,
  Building2,
  FileText,
  TrendingUp,
  Link2,
  Layers,
  Repeat,
  DollarSign,
  CreditCard,
  Rocket,
  Gem,
  Pickaxe,
  Wallet,
  Flag,
  Globe,
  Sparkles,
  PieChart,
  BriefcaseBusiness,
  Factory,
  Radio,
  Zap,
  BadgeDollarSign,
} from 'lucide-react';

const SECTOR_ICONS = {
  tecnologia: Cpu,
  salud: HeartPulse,
  defensa: Shield,
  consumo_basico: ShoppingCart,
  consumo_discrecional: ShoppingBag,
  finanzas: Landmark,
  energia: Fuel,
  energia_renovable: Leaf,
  materiales: Mountain,
  industria: Factory,
  inmobiliario: Building2,
  inmobiliario_cotizado: Building2,
  servicios_publicos: Zap,
  comunicacion: Radio,
  bonos_gobierno: FileText,
  bonos_inflacion: TrendingUp,
  renta_fija: BriefcaseBusiness,
  crypto_l1: Link2,
  crypto_l2: Layers,
  crypto_defi: Repeat,
  crypto_stablecoin: DollarSign,
  crypto_pagos: CreditCard,
  crypto_meme: Rocket,
  metales_preciosos: Gem,
  mineria: Pickaxe,
  efectivo_global: Wallet,
  diversificado_eeuu: Flag,
  diversificado_global: Globe,
  emergentes: Sparkles,
  dividendos_value: PieChart,
  otros: Layers3,
  stablecoin_yield: BadgeDollarSign,
};

const SECTOR_LABELS = {
  tecnologia: 'Tecnología',
  salud: 'Salud',
  defensa: 'Defensa',
  consumo_basico: 'Consumo básico',
  consumo_discrecional: 'Consumo discrecional',
  finanzas: 'Finanzas',
  energia: 'Energía',
  energia_renovable: 'Energía renovable',
  materiales: 'Materiales',
  industria: 'Industria',
  inmobiliario: 'Inmobiliario',
  inmobiliario_cotizado: 'Inmobiliario cotizado',
  servicios_publicos: 'Servicios públicos',
  comunicacion: 'Comunicación',
  bonos_gobierno: 'Bonos gobierno',
  bonos_inflacion: 'Bonos inflación',
  renta_fija: 'Renta fija',
  crypto_l1: 'Crypto L1',
  crypto_l2: 'Crypto L2',
  crypto_defi: 'Crypto DeFi',
  crypto_stablecoin: 'Stablecoins',
  crypto_pagos: 'Crypto pagos',
  crypto_meme: 'Crypto meme',
  metales_preciosos: 'Metales preciosos',
  mineria: 'Minería',
  efectivo_global: 'Efectivo global',
  diversificado_eeuu: 'Diversificado EE. UU.',
  diversificado_global: 'Diversificado global',
  emergentes: 'Mercados emergentes',
  dividendos_value: 'Dividendos / value',
  otros: 'Otros',
  stablecoin_yield: 'Stablecoins con rendimiento',
};

const SECTOR_COLORS = [
  '#22d3ee', '#60a5fa', '#34d399', '#facc15',
  '#fb7185', '#a78bfa', '#fb923c', '#2dd4bf',
  '#f472b6', '#94a3b8', '#818cf8', '#4ade80',
];

const VISIBLE_LIMIT = 8;

const formatSector = (sector) =>
  SECTOR_LABELS[sector] || String(sector || 'otros').replaceAll('_', ' ');

const formatUSD = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const formatPct = (value) => `${Number(value || 0).toFixed(1)}%`;

function normalizeSectorData(sectorAnalysis) {
  const sectors = Array.isArray(sectorAnalysis)
    ? sectorAnalysis
    : sectorAnalysis?.sectors || [];

  return sectors
    .map((sector) => ({
      ...sector,
      sector: sector.sector || sector.key || 'otros',
      valueUSD: Number(sector.valueUSD || sector.value || 0),
      pct: Number(sector.pct || sector.weightPct || 0),
      sources: Array.isArray(sector.sources) ? sector.sources : [],
    }))
    .filter((sector) => sector.valueUSD > 0 || sector.pct > 0)
    .sort((a, b) => b.valueUSD - a.valueUSD);
}

function getColor(index) {
  return SECTOR_COLORS[index % SECTOR_COLORS.length];
}

function SectorDonut({ sectors, activeIndex, onHover }) {
  const size = 172;
  const center = size / 2;
  const radius = 59;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  const total = sectors.reduce((sum, s) => sum + Math.max(0, s.pct), 0) || 1;
  let offset = 0;

  return (
    <div className="portfolio-donut-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="portfolio-donut-svg"
        style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}
        role="img"
        aria-label="Distribución de la cartera por sector"
      >
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="rgba(51,65,85,0.35)" strokeWidth={strokeWidth}
        />
        {sectors.map((sector, index) => {
          const segment = (Math.max(0, sector.pct) / total) * circumference;
          const gap = sectors.length > 1 ? 2 : 0;
          const visibleSegment = Math.max(0, segment - gap);
          const currentOffset = offset;
          offset += segment;

          return (
            <circle
              key={`${sector.sector}-${index}`}
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={getColor(index)}
              strokeWidth={activeIndex === index ? strokeWidth + 5 : strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${visibleSegment} ${circumference - visibleSegment}`}
              strokeDashoffset={-currentOffset}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.28}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}

function SectorLegendCard({ sector, color, index, activeIndex, onHover, onSelect }) {
  const Icon = SECTOR_ICONS[sector.sector] || Layers3;
  const isActive = activeIndex === index;
  const isLookThrough = Number(sector.lookThroughValueUSD || 0) > 0;

  return (
    <button
      type="button"
      className={`portfolio-legend-card sector-legend-row${isActive ? ' active' : ''}`}
      style={{ '--sector-color': color }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(index)}
      aria-pressed={isActive}
    >
      <span className="portfolio-legend-top">
        <span
          className="portfolio-legend-icon"
          style={{ color, backgroundColor: `${color}18`, borderColor: `${color}35` }}
        >
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <span className="portfolio-legend-label">{formatSector(sector.sector)}</span>
        <span className="sector-legend-pct">{formatPct(sector.pct)}</span>
      </span>
      <span className="portfolio-legend-bottom">
        <span className="portfolio-legend-value">{formatUSD(sector.valueUSD)}</span>
        {isLookThrough && <span className="sector-legend-tag">ETF look-through</span>}
      </span>
    </button>
  );
}

function SectorDetail({ sector }) {
  if (!sector) return null;

  const direct = Number(sector.directValueUSD || 0);
  const lookThrough = Number(sector.lookThroughValueUSD || 0);
  const sources = sector.sources || [];

  return (
    <div className="sector-detail">
      <div className="sector-detail-head">
        <div>
          <p className="sector-detail-name">{formatSector(sector.sector)}</p>
          <p className="sector-detail-sub">{formatPct(sector.pct)} de los activos invertibles</p>
        </div>
        <p className="sector-detail-value">{formatUSD(sector.valueUSD)}</p>
      </div>

      {(direct > 0 || lookThrough > 0) && (
        <div className="v3-metrics-grid" style={{ marginBottom: 0 }}>
          <div className="v3-metric-card">
            <span className="v3-metric-label">Directo</span>
            <span className="v3-metric-value muted">{formatUSD(direct)}</span>
          </div>
          <div className="v3-metric-card">
            <span className="v3-metric-label">Por ETFs</span>
            <span className="v3-metric-value" style={{ color: '#22d3ee' }}>{formatUSD(lookThrough)}</span>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="sector-detail-sources">
          {sources.map((source) => (
            <span key={source} className="v3-mini-badge">{source}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioSectorMap({ sectorAnalysis, className = '' }) {
  const sectors = useMemo(() => normalizeSectorData(sectorAnalysis), [sectorAnalysis]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const mainSectors = sectors.slice(0, VISIBLE_LIMIT);
  const extraSectors = sectors.slice(VISIBLE_LIMIT);
  const selectedSector = selectedIndex === null ? null : sectors[selectedIndex];
  const totalUSD = sectors.reduce((sum, s) => sum + s.valueUSD, 0);
  const dominantSector = sectors[0];

  if (!sectors.length) {
    return (
      <section className={`portfolio-card ${className}`}>
        <div className="portfolio-section-head">
          <div>
            <span className="portfolio-eyebrow">Análisis de concentración</span>
            <span className="v3-section-title">Distribución por sector</span>
          </div>
        </div>
        <p style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
          No hay datos sectoriales disponibles.
        </p>
      </section>
    );
  }

  return (
    <section className={`portfolio-card ${className}`}>
      <div className="portfolio-section-head">
        <div>
          <span className="portfolio-eyebrow">Análisis de concentración</span>
          <span className="v3-section-title">Distribución por sector</span>
        </div>
        {dominantSector && (
          <span className="portfolio-risk-badge">
            Principal: {formatSector(dominantSector.sector)} {formatPct(dominantSector.pct)}
          </span>
        )}
      </div>

      <div className="portfolio-hero-grid">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SectorDonut sectors={sectors} activeIndex={activeIndex} onHover={setActiveIndex} />
          <p className="portfolio-stat-label" style={{ marginTop: '0.5rem' }}>
            {formatUSD(totalUSD)} invertidos
          </p>
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="portfolio-legend-grid">
            {mainSectors.map((sector, index) => (
              <SectorLegendCard
                key={`${sector.sector}-${index}`}
                sector={sector}
                index={index}
                color={getColor(index)}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onSelect={setSelectedIndex}
              />
            ))}
          </div>

          {extraSectors.length > 0 && (
            <>
              <button
                type="button"
                className="portfolio-legend-toggle"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                <span className="portfolio-legend-toggle__count">{extraSectors.length}</span>
                {expanded ? 'Ver menos sectores' : 'Ver todos los sectores'}
                <ChevronDown
                  size={14}
                  className={`portfolio-legend-toggle__chevron${expanded ? ' open' : ''}`}
                />
              </button>

              <div className={`portfolio-legend-collapsible${expanded ? ' open' : ''}`}>
                <div className="portfolio-legend-grid">
                  {extraSectors.map((sector, i) => {
                    const index = VISIBLE_LIMIT + i;
                    return (
                      <SectorLegendCard
                        key={`${sector.sector}-${index}`}
                        sector={sector}
                        index={index}
                        color={getColor(index)}
                        activeIndex={activeIndex}
                        onHover={setActiveIndex}
                        onSelect={setSelectedIndex}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <SectorDetail sector={selectedSector} />
        </div>
      </div>
    </section>
  );
}