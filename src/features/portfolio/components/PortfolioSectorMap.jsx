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

/* ─── Parámetros configurables ─────────────────────────────────────────── */

/** Máximo de sectores visibles antes del “Ver más”. */
export const DEFAULT_VISIBLE_LIMIT = 8;

/** Paleta de colores del donut / legend (cíclica). */
export const DEFAULT_SECTOR_COLORS = [
  '#22d3ee',
  '#60a5fa',
  '#34d399',
  '#facc15',
  '#fb7185',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#f472b6',
  '#94a3b8',
  '#818cf8',
  '#4ade80',
];

/** Iconos por clave de sector. */
export const SECTOR_ICONS = {
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

/** Etiquetas legibles (corregidas / completas). */
export const SECTOR_LABELS = {
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
  emergentes: 'Emergentes',
  dividendos_value: 'Dividendos / value',
  otros: 'Otros',
  stablecoin_yield: 'Stablecoin yield',
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const formatSector = (sector, labels = SECTOR_LABELS) =>
  labels[sector] || String(sector || 'otros').replaceAll('_', ' ');

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
    .map((sector) => {
      const sources = Array.isArray(sector.sources) ? sector.sources : [];
      const count = Number(
        sector.count ?? sector.positions ?? sector.n ?? sources.length ?? 0
      );

      return {
        ...sector,
        sector: sector.sector || sector.key || 'otros',
        valueUSD: Number(sector.valueUSD || sector.value || 0),
        pct: Number(sector.pct || sector.weightPct || 0),
        sources,
        count,
      };
    })
    .filter((sector) => sector.valueUSD > 0 || sector.pct > 0)
    .sort((a, b) => b.valueUSD - a.valueUSD);
}

function getColor(index, palette = DEFAULT_SECTOR_COLORS) {
  return palette[index % palette.length];
}

/* ─── Donut ────────────────────────────────────────────────────────────── */

function SectorDonut({
  sectors,
  activeIndex,
  onHover,
  totalUSD,
  colors = DEFAULT_SECTOR_COLORS,
  size = 200,
  radius = 68,
  strokeWidth = 26,
  gap = 3,
}) {
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const totalPct =
    sectors.reduce((sum, s) => sum + Math.max(0, s.pct), 0) || 1;

  let offset = 0;

  const activeSector = activeIndex !== null ? sectors[activeIndex] : null;
  const ActiveIcon = activeSector
    ? SECTOR_ICONS[activeSector.sector] || Layers3
    : null;
  const activeColor =
    activeIndex !== null ? getColor(activeIndex, colors) : null;

  return (
    <div
      className="sector-donut"
      style={{
        '--donut-size': `${size}px`,
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="sector-donut__svg"
        role="img"
        aria-label="Distribución de la cartera por sector"
      >
        <circle
          className="sector-donut__track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />

        {sectors.map((sector, index) => {
          const segment =
            (Math.max(0, sector.pct) / totalPct) * circumference;
          const visibleSegment = Math.max(
            0,
            segment - (sectors.length > 1 ? gap : 0)
          );
          const currentOffset = offset;
          offset += segment;

          const isActive = activeIndex === index;
          const isDimmed = activeIndex !== null && !isActive;

          return (
            <circle
              key={`${sector.sector}-${index}`}
              className={`sector-donut__segment${isActive ? ' is-active' : ''}${isDimmed ? ' is-dimmed' : ''}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={getColor(index, colors)}
              strokeWidth={isActive ? strokeWidth + 6 : strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${visibleSegment} ${circumference - visibleSegment}`}
              strokeDashoffset={-currentOffset}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </svg>

      <div className="sector-donut__center">
        {activeSector ? (
          <>
            <div
              className="sector-donut__icon"
              style={{
                '--sector-color': activeColor,
              }}
            >
              <ActiveIcon size={18} strokeWidth={1.8} />
            </div>
            <p className="sector-donut__name">
              {formatSector(activeSector.sector)}
            </p>
            <p className="sector-donut__pct">
              {formatPct(activeSector.pct)}
            </p>
            <p className="sector-donut__usd">
              {formatUSD(activeSector.valueUSD)}
            </p>
          </>
        ) : (
          <>
            <p className="sector-donut__eyebrow">Total</p>
            <p className="sector-donut__total">{formatUSD(totalUSD)}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Legend card ──────────────────────────────────────────────────────── */

function SectorLegendCard({
  sector,
  color,
  index,
  activeIndex,
  onHover,
  onSelect,
  labels,
}) {
  const Icon = SECTOR_ICONS[sector.sector] || Layers3;
  const isActive = activeIndex === index;
  const isLookThrough = Number(sector.lookThroughValueUSD || 0) > 0;
  const hasPositions = sector.count > 0;

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
          style={{
            color,
            backgroundColor: `${color}18`,
            borderColor: `${color}35`,
          }}
        >
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <span className="portfolio-legend-label">
          {formatSector(sector.sector, labels)}
        </span>
        <span className="sector-legend-pct">{formatPct(sector.pct)}</span>
      </span>

      <span className="portfolio-legend-bottom">
        <span className="portfolio-legend-value">
          {formatUSD(sector.valueUSD)}
        </span>
        {hasPositions && (
          <span className="sector-legend-count">{sector.count} pos.</span>
        )}
        {isLookThrough && (
          <span className="sector-legend-tag">ETF 🔎</span>
        )}
      </span>
    </button>
  );
}

/* ─── Detail panel ─────────────────────────────────────────────────────── */

function SectorDetail({ sector, labels }) {
  if (!sector) return null;

  const direct = Number(sector.directValueUSD || 0);
  const lookThrough = Number(sector.lookThroughValueUSD || 0);
  const sources = sector.sources || [];
  const count = sector.count || 0;

  return (
    <div className="sector-detail">
      <div className="sector-detail-head">
        <div>
          <p className="sector-detail-name">
            {formatSector(sector.sector, labels)}
          </p>
          <p className="sector-detail-sub">
            {formatPct(sector.pct)} de los activos invertibles
            {count > 0 &&
              ` · ${count} ${count === 1 ? 'posición' : 'posiciones'}`}
          </p>
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
            <span className="v3-metric-value sector-detail-lookthrough">
              {formatUSD(lookThrough)}
            </span>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="sector-detail-sources">
          {sources.map((source) => (
            <span key={source} className="v3-mini-badge">
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal ─────────────────────────────────────────────── */

/**
 * Mapa de distribución por sector (donut + legend + detalle).
 *
 * @param {object}   props
 * @param {object|array} props.sectorAnalysis  - array o { sectors: [...] }
 * @param {number}   [props.visibleLimit]      - sectores antes de “Ver más”
 * @param {string[]} [props.colors]            - paleta del donut/legend
 * @param {object}   [props.labels]            - override de etiquetas
 * @param {number}   [props.donutSize]         - tamaño del SVG
 * @param {number}   [props.donutRadius]
 * @param {number}   [props.donutStroke]
 * @param {string}   [props.className]
 */
export default function PortfolioSectorMap({
  sectorAnalysis,
  visibleLimit = DEFAULT_VISIBLE_LIMIT,
  colors = DEFAULT_SECTOR_COLORS,
  labels = SECTOR_LABELS,
  donutSize = 200,
  donutRadius = 68,
  donutStroke = 26,
  className = '',
}) {
  const sectors = useMemo(
    () => normalizeSectorData(sectorAnalysis),
    [sectorAnalysis]
  );
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const mainSectors = sectors.slice(0, visibleLimit);
  const extraSectors = sectors.slice(visibleLimit);
  const selectedSector =
    selectedIndex === null ? null : sectors[selectedIndex];
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
        <p className="sector-map-empty">
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
            Principal: {formatSector(dominantSector.sector, labels)}{' '}
            {formatPct(dominantSector.pct)}
          </span>
        )}
      </div>

      <div className="portfolio-hero-grid">
        <div className="sector-donut-col">
          <SectorDonut
            sectors={sectors}
            activeIndex={activeIndex}
            onHover={setActiveIndex}
            totalUSD={totalUSD}
            colors={colors}
            size={donutSize}
            radius={donutRadius}
            strokeWidth={donutStroke}
          />
          <p className="portfolio-stat-label sector-donut-caption">
            {formatUSD(totalUSD)} invertidos
          </p>
        </div>

        <div className="sector-legend-col">
          <div className="portfolio-legend-grid">
            {mainSectors.map((sector, index) => (
              <SectorLegendCard
                key={`${sector.sector}-${index}`}
                sector={sector}
                index={index}
                color={getColor(index, colors)}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onSelect={setSelectedIndex}
                labels={labels}
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
                <span className="portfolio-legend-toggle__count">
                  {extraSectors.length}
                </span>
                {expanded ? 'Ver menos sectores' : 'Ver todos los sectores'}
                <ChevronDown
                  size={14}
                  className={`portfolio-legend-toggle__chevron${expanded ? ' open' : ''}`}
                />
              </button>

              <div
                className={`portfolio-legend-collapsible${expanded ? ' open' : ''}`}
              >
                <div className="portfolio-legend-grid">
                  {extraSectors.map((sector, i) => {
                    const index = visibleLimit + i;
                    return (
                      <SectorLegendCard
                        key={`${sector.sector}-${index}`}
                        sector={sector}
                        index={index}
                        color={getColor(index, colors)}
                        activeIndex={activeIndex}
                        onHover={setActiveIndex}
                        onSelect={setSelectedIndex}
                        labels={labels}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <SectorDetail sector={selectedSector} labels={labels} />
        </div>
      </div>
    </section>
  );
}