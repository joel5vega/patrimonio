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
import AssetIcon from './heatmap/AssetIcon';
import '../styles/PortfolioSectorMap.css';

export const DEFAULT_VISIBLE_LIMIT = 8;

export const DEFAULT_SECTOR_COLORS = [
  '#2b7fff',
  '#5a9fff',
  '#34d399',
  '#facc15',
  '#fb7185',
  '#a78bfa',
  '#fb923c',
  '#2b7fff',
  '#f472b6',
  '#a4a19b',
  '#818cf8',
  '#4ade80',
];

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
  metales_precios: Gem,
  metales_preciosos: Gem,
  mineria: Pickaxe,
  efectivo_global: Wallet,
  diversificado_eeuu: Flag,
  diversificado_global: Globe,
  emergentes: Sparkles,
  dividendos_value: PieChart,
  stablecoin_yield: BadgeDollarSign,
  otros: Layers3,
};

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
  metales_precios: 'Metales preciosos',
  metales_preciosos: 'Metales preciosos',
  mineria: 'Minería',
  efectivo_global: 'Efectivo global',
  diversificado_eeuu: 'Diversificado EE. UU.',
  diversificado_global: 'Diversificado global',
  emergentes: 'Emergentes',
  dividendos_value: 'Dividendos / value',
  stablecoin_yield: 'Stablecoin yield',
  otros: 'Otros',
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeSectorKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll(' ', '_')
    .replaceAll('-', '_');
}

function formatSector(sector) {
  const key = normalizeSectorKey(sector);

  return (
    SECTOR_LABELS[key] ??
    String(sector ?? 'otros').replaceAll('_', ' ')
  );
}

function formatUSD(value) {
  return safeNumber(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatPct(value, decimals = 1) {
  return `${safeNumber(value).toFixed(decimals)}%`;
}

function getColor(index, palette) {
  const safePalette = Array.isArray(palette) && palette.length
    ? palette
    : DEFAULT_SECTOR_COLORS;

  return safePalette[index % safePalette.length];
}

function normalizeSectorData(sectorAnalysis) {
  const rawSectors = Array.isArray(sectorAnalysis)
    ? sectorAnalysis
    : sectorAnalysis?.sectors ?? [];

  return rawSectors
    .map((sector) => ({
      ...sector,
      sector: normalizeSectorKey(
        sector.sector ??
        sector.key ??
        'otros',
      ),
      valueUSD: safeNumber(
        sector.valueUSD ??
        sector.value ??
        0,
      ),
      pct: safeNumber(
        sector.pct ??
        sector.weightPct ??
        0,
      ),
      count: safeNumber(
        sector.count ??
        sector.positions ??
        sector.n ??
        0,
      ),
      sources: Array.isArray(sector.sources)
        ? sector.sources
        : [],
    }))
    .filter(
      (sector) =>
        sector.valueUSD > 0 ||
        sector.pct > 0,
    )
    .sort((a, b) => b.valueUSD - a.valueUSD);
}

function groupHoldingsByCompany(sources = []) {
  const companies = new Map();

  for (const source of sources) {
    const sourceSymbol = String(source.symbol ?? '')
      .trim()
      .toUpperCase();

    if (!sourceSymbol) {
      continue;
    }

    const portfolioWeightPct = safeNumber(
      source.portfolioWeightPct ??
      source.weightPct ??
      0,
    );

    const sourceValueUSD = safeNumber(
      source.valueUSD ??
      source.value ??
      0,
    );

    const holdings = Array.isArray(source.holdings)
      ? source.holdings
      : [];

    for (const holding of holdings) {
      const symbol = String(holding.symbol ?? '')
        .trim()
        .toUpperCase();

      if (!symbol) {
        continue;
      }

      const etfWeightPct = safeNumber(
        holding.etfWeightPct ??
        holding.weightPct ??
        holding.weight ??
        0,
      );

      const effectiveWeightPct =
        portfolioWeightPct *
        etfWeightPct /
        100;

      const effectiveValueUSD =
        sourceValueUSD *
        etfWeightPct /
        100;

      if (!companies.has(symbol)) {
        companies.set(symbol, {
          symbol,
          name: holding.name ?? symbol,
          sector: normalizeSectorKey(
            holding.sector ?? 'otros',
          ),
          totalEffectiveWeightPct: 0,
          totalEffectiveValueUSD: 0,
          sources: [],
        });
      }

      const company = companies.get(symbol);

      company.totalEffectiveWeightPct +=
        effectiveWeightPct;

      company.totalEffectiveValueUSD +=
        effectiveValueUSD;

      company.sources.push({
        symbol: sourceSymbol,
        name: source.name ?? sourceSymbol,
        etfWeightPct,
        portfolioWeightPct,
        effectiveWeightPct,
        effectiveValueUSD,
      });
    }
  }

  return [...companies.values()]
    .map((company) => ({
      ...company,
      sources: company.sources.sort(
        (left, right) =>
          right.effectiveWeightPct -
          left.effectiveWeightPct,
      ),
    }))
    .sort(
      (left, right) =>
        right.totalEffectiveWeightPct -
        left.totalEffectiveWeightPct,
    );
}

function enrichSectors(sectors) {
  return sectors.map((sector) => ({
    ...sector,
    companies: groupHoldingsByCompany(sector.sources),
  }));
}

function SectorDonut({
  sectors,
  selectedIndex,
  hoveredIndex,
  onHoverChange,
  onSelect,
  colors,
  size = 244,
  radius = 78,
  strokeWidth = 34,
  gap = 3,
}) {
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const totalPct = sectors.reduce(
    (sum, sector) =>
      sum + Math.max(0, safeNumber(sector.pct)),
    0,
  ) || 1;

  let offset = 0;

  return (
    <svg
      className="sector-donut"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Distribución por sectores"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#262626"
        strokeWidth={strokeWidth}
      />

      {sectors.map((sector, index) => {
        const pct = Math.max(0, safeNumber(sector.pct));
        const dash = (pct / totalPct) * circumference;
        const visibleDash = Math.max(0, dash - gap);

        const dashArray = `${visibleDash} ${
          circumference - visibleDash
        }`;

        const dashOffset = -offset;

        offset += dash;

        const isSelected = selectedIndex === index;
        const isHovered = hoveredIndex === index;
        const color = getColor(index, colors);

        return (
          <circle
            key={sector.sector}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={
              isSelected || isHovered
                ? strokeWidth + 3
                : strokeWidth
            }
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${center} ${center})`}
            className="sector-donut__segment"
            onMouseEnter={() => onHoverChange(index)}
            onMouseLeave={() => onHoverChange(null)}
            onClick={() => onSelect(index)}
          />
        );
      })}
    </svg>
  );
}

function DonutCenter({
  displaySector,
  displayIndex,
  totalUSD,
  colors,
}) {
  const Icon = displaySector
    ? SECTOR_ICONS[displaySector.sector] ?? Layers3
    : Layers3;

  const iconColor = displaySector
    ? getColor(displayIndex, colors)
    : '#a4a19b';

  return (
    <div className="sector-donut__center">
      <Icon
        size={18}
        color={iconColor}
        strokeWidth={2}
      />

      <span className="sector-donut__label">
        {displaySector
          ? formatSector(displaySector.sector)
          : 'Total'}
      </span>

      <strong className="sector-donut__value">
        {displaySector
          ? formatPct(displaySector.pct)
          : formatUSD(totalUSD)}
      </strong>

      {displaySector && (
        <span className="sector-donut__usd">
          {formatUSD(displaySector.valueUSD)}
        </span>
      )}
    </div>
  );
}

function CompanyRow({ company }) {
  return (
    <div className="sector-company">
      <AssetIcon
        asset={{
          symbol: company.symbol,
          name: company.name,
          type: 'stock',
          sector: company.sector,
        }}
        size={18}
      />

      <div className="sector-company__main">
        <span className="sector-company__symbol">
          {company.symbol}
        </span>

        <span className="sector-company__name">
          {company.name}
        </span>

        <div className="sector-company__sources">
          {company.sources.map((source) => (
            <span
              key={`${company.symbol}-${source.symbol}`}
              className="sector-company__source"
              title={[
                `${source.symbol}:`,
                `${formatPct(source.etfWeightPct, 2)} dentro del ETF`,
                `${formatPct(source.effectiveWeightPct, 2)} efectivo en cartera`,
              ].join(' · ')}
            >
              {source.symbol} {formatPct(
                source.effectiveWeightPct,
                2,
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="sector-company__right">
        <strong className="sector-company__weight">
          {formatPct(
            company.totalEffectiveWeightPct,
            2,
          )}
        </strong>

        <span className="sector-company__value">
          {formatUSD(company.totalEffectiveValueUSD)}
        </span>
      </div>
    </div>
  );
}

function SectorDetails({
  sector,
  index,
  colors,
}) {
  if (!sector) {
    return (
      <div className="sector-map__placeholder">
        <Layers3 size={28} />
        <span>
          Pasa el cursor sobre un sector o selecciónalo para ver su composición.
        </span>
      </div>
    );
  }

  const Icon =
    SECTOR_ICONS[sector.sector] ??
    Layers3;

  const color = getColor(index, colors);
  const companies = Array.isArray(sector.companies)
    ? sector.companies
    : [];

  return (
    <div className="sector-details">
      <div className="sector-details__header">
        <Icon
          size={25}
          color={color}
        />

        <h3 className="sector-details__title">
          {formatSector(sector.sector)}
        </h3>
      </div>

      <div className="sector-details__summary">
        <strong className="sector-details__pct">
          {formatPct(sector.pct)}
        </strong>

        <span className="sector-details__usd">
          {formatUSD(sector.valueUSD)}
        </span>

        {sector.count > 0 && (
          <span className="sector-details__count">
            {sector.count}{' '}
            {sector.count === 1
              ? 'posición'
              : 'posiciones'}
          </span>
        )}
      </div>

      {companies.length > 0 ? (
        <div className="sector-details__companies">
          <div className="sector-companies__title">
            Principales empresas
          </div>

          {companies
            .slice(0, 8)
            .map((company) => (
              <CompanyRow
                key={company.symbol}
                company={company}
              />
            ))}

          {companies.length > 8 && (
            <div className="sector-companies__more">
              +{companies.length - 8} empresas más
            </div>
          )}
        </div>
      ) : (
        <div className="sector-details__no-companies">
          No hay holdings empresariales disponibles para este sector.
        </div>
      )}
    </div>
  );
}

export default function PortfolioSectorMap({
  sectorAnalysis,
  totalInvertibleUSD = 0,
  colors = DEFAULT_SECTOR_COLORS,
  visibleLimit = DEFAULT_VISIBLE_LIMIT,
}) {
  const [showAll, setShowAll] = useState(false);

  /*
   * selectedIndex controla el panel derecho.
   * Solo cambia por clic, no por hover.
   */
  const [selectedIndex, setSelectedIndex] = useState(null);

  /*
   * hoveredIndex solo controla resaltado visual.
   * Nunca hace que aparezca/desaparezca el contenido grande.
   */
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const sectors = useMemo(
    () => enrichSectors(
      normalizeSectorData(sectorAnalysis),
    ),
    [sectorAnalysis],
  );

  const totalUSD =
    safeNumber(totalInvertibleUSD) > 0
      ? safeNumber(totalInvertibleUSD)
      : sectors.reduce(
          (sum, sector) =>
            sum + safeNumber(sector.valueUSD),
          0,
        );

  const visibleSectors = showAll
    ? sectors
    : sectors.slice(0, visibleLimit);

  /*
   * El donut puede mostrar el sector bajo hover,
   * pero el panel de empresas se mantiene solo con selectedIndex.
   */
  const donutDisplayIndex =
    hoveredIndex !== null
      ? hoveredIndex
      : selectedIndex;

  const donutDisplaySector =
    donutDisplayIndex !== null
      ? sectors[donutDisplayIndex] ?? null
      : null;

  const selectedSector =
    selectedIndex !== null
      ? sectors[selectedIndex] ?? null
      : null;

  function selectSector(index) {
    setSelectedIndex((current) =>
      current === index
        ? null
        : index,
    );
  }

  if (!sectors.length) {
    return (
      <section className="portfolio-sector-map">
        <div className="sector-map__empty">
          <Layers3 size={30} />
          <span>No hay datos sectoriales disponibles.</span>

          {totalUSD > 0 && (
            <small>
              {formatUSD(totalUSD)} invertidos
            </small>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="portfolio-sector-map">
      <div className="sector-map__content">
        <div className="sector-map__donut-wrap">
          <SectorDonut
            sectors={sectors}
            selectedIndex={selectedIndex}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
            onSelect={selectSector}
            colors={colors}
          />

          <DonutCenter
            displaySector={donutDisplaySector}
            displayIndex={donutDisplayIndex}
            totalUSD={totalUSD}
            colors={colors}
          />
        </div>

        <div className="sector-map__details">
          <SectorDetails
            sector={selectedSector}
            index={selectedIndex}
            colors={colors}
          />
        </div>
      </div>

      {sectors.length > visibleLimit && (
        <button
          type="button"
          className="sector-map__toggle"
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? 'Ver menos' : 'Ver más'}

          <ChevronDown
            size={18}
            className={
              showAll
                ? 'sector-map__chevron sector-map__chevron--open'
                : 'sector-map__chevron'
            }
          />
        </button>
      )}

      <div className="sector-map__legend">
        {visibleSectors.map((sector) => {
          const sectorIndex = sectors.findIndex(
            (candidate) =>
              candidate.sector === sector.sector,
          );

          const Icon =
            SECTOR_ICONS[sector.sector] ??
            Layers3;

          const color = getColor(
            sectorIndex,
            colors,
          );

          const isSelected =
            selectedIndex === sectorIndex;

          const isHovered =
            hoveredIndex === sectorIndex;

          const className = [
            'sector-legend-item',
            isSelected
              ? 'sector-legend-item--active'
              : '',
            isHovered
              ? 'sector-legend-item--hovered'
              : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={sector.sector}
              type="button"
              className={className}
              onMouseEnter={() => setHoveredIndex(sectorIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(sectorIndex)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => selectSector(sectorIndex)}
              aria-pressed={isSelected}
              aria-label={`Ver detalle de ${formatSector(
                sector.sector,
              )}`}
            >
              <span
                className="sector-legend-item__dot"
                style={{ backgroundColor: color }}
              />

              <Icon
                size={20}
                color={color}
              />

              <span className="sector-legend-item__label">
                {formatSector(sector.sector)}
              </span>

              <strong className="sector-legend-item__pct">
                {formatPct(sector.pct)}
              </strong>

              <span className="sector-legend-item__usd">
                {formatUSD(sector.valueUSD)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}