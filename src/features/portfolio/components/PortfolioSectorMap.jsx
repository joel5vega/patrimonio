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
  '#60a5fa',
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
  stablecoin: DollarSign,
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
  crypto_stablecoin: 'Stablecoin',
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
  stablecoin: 'Stablecoin',
  otros: 'Otros',
};

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
  return SECTOR_LABELS[key] ?? String(sector ?? 'otros').replaceAll('_', ' ');
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
  const p = Array.isArray(palette) && palette.length ? palette : DEFAULT_SECTOR_COLORS;
  return p[index % p.length];
}

function normalizeSectorData(sectorAnalysis) {
  const raw = Array.isArray(sectorAnalysis)
    ? sectorAnalysis
    : sectorAnalysis?.sectors ?? [];

  return raw
    .map((s) => ({
      ...s,
      sector: normalizeSectorKey(s.sector ?? s.key ?? 'otros'),
      valueUSD: safeNumber(s.valueUSD ?? s.value ?? 0),
      pct: safeNumber(s.pct ?? s.weightPct ?? 0),
      count: safeNumber(s.count ?? s.positions ?? s.n ?? 0),
      sources: Array.isArray(s.sources) ? s.sources : [],
      assets: Array.isArray(s.assets) ? s.assets : [],
    }))
    .filter((s) => s.valueUSD > 0 || s.pct > 0)
    .sort((a, b) => b.valueUSD - a.valueUSD);
}

function groupHoldingsByCompany(sources = [], assets = [], sectorKey = 'otros') {
  const companies = new Map();

  for (const source of sources) {
    const sourceSymbol = String(source.symbol ?? '').trim().toUpperCase();
    if (!sourceSymbol) continue;

    const portfolioWeightPct = safeNumber(source.portfolioWeightPct ?? source.weightPct ?? 0);
    const sourceValueUSD = safeNumber(source.valueUSD ?? source.value ?? 0);
    const holdings = Array.isArray(source.holdings) ? source.holdings : [];

    for (const holding of holdings) {
      const symbol = String(holding.symbol ?? '').trim().toUpperCase();
      if (!symbol) continue;

      const etfWeightPct = safeNumber(
        holding.etfWeightPct ?? holding.weightPct ?? holding.weight ?? 0,
      );
      const effectiveWeightPct = safeNumber(
        holding.effectiveWeightPct,
        (portfolioWeightPct * etfWeightPct) / 100,
      );
      const effectiveValueUSD = safeNumber(
        holding.effectiveValueUSD,
        (sourceValueUSD * etfWeightPct) / 100,
      );

      if (!companies.has(symbol)) {
        companies.set(symbol, {
          symbol,
          name: holding.name ?? symbol,
          sector: normalizeSectorKey(holding.sector ?? sectorKey),
          totalEffectiveWeightPct: 0,
          totalEffectiveValueUSD: 0,
          sources: [],
          isDirect: false,
        });
      }

      const company = companies.get(symbol);
      company.totalEffectiveWeightPct += effectiveWeightPct;
      company.totalEffectiveValueUSD += effectiveValueUSD;
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

  for (const asset of assets) {
    const symbol = String(asset.symbol ?? '').trim().toUpperCase();
    if (!symbol) continue;

    const isDirect =
      asset.lookThroughWeight == null || asset.lookThroughWeight === undefined;
    if (!isDirect) continue;
    if (companies.has(symbol) && !companies.get(symbol).isDirect) continue;

    const valueUSD = safeNumber(asset.valueUSD ?? asset.value ?? 0);
    if (valueUSD <= 0) continue;

    if (!companies.has(symbol)) {
      companies.set(symbol, {
        symbol,
        name: asset.name ?? symbol,
        sector: normalizeSectorKey(sectorKey),
        totalEffectiveWeightPct: 0,
        totalEffectiveValueUSD: 0,
        sources: [],
        isDirect: true,
      });
    }

    const company = companies.get(symbol);
    company.isDirect = true;
    company.totalEffectiveValueUSD += valueUSD;
    company.sources.push({
      symbol,
      name: asset.name ?? symbol,
      etfWeightPct: 100,
      portfolioWeightPct: 0,
      effectiveWeightPct: 0,
      effectiveValueUSD: valueUSD,
    });
  }

  return [...companies.values()]
    .map((c) => ({
      ...c,
      sources: c.sources.sort((a, b) => b.effectiveWeightPct - a.effectiveWeightPct),
    }))
    .sort(
      (a, b) =>
        b.totalEffectiveValueUSD - a.totalEffectiveValueUSD ||
        b.totalEffectiveWeightPct - a.totalEffectiveWeightPct,
    );
}

function enrichSectors(sectors) {
  return sectors.map((s) => ({
    ...s,
    companies: groupHoldingsByCompany(s.sources, s.assets, s.sector),
  }));
}

/* ── Donut ── */
function SectorDonut({
  sectors,
  selectedIndex,
  hoveredIndex,
  onHoverChange,
  onSelect,
  colors,
  size = 180,
  radius = 58,
  strokeWidth = 24,
  gap = 2.5,
}) {
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const totalPct =
    sectors.reduce((sum, s) => sum + Math.max(0, safeNumber(s.pct)), 0) || 1;

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
        const dashArray = `${visibleDash} ${circumference - visibleDash}`;
        const dashOffset = -offset;
        offset += dash;

        const active = selectedIndex === index || hoveredIndex === index;
        const color = getColor(index, colors);

        return (
          <circle
            key={sector.sector}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={active ? strokeWidth + 2 : strokeWidth}
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

function DonutCenter({ displaySector, displayIndex, totalUSD, colors }) {
  const Icon = displaySector
    ? SECTOR_ICONS[displaySector.sector] ?? Layers3
    : Layers3;
  const iconColor = displaySector ? getColor(displayIndex, colors) : '#a4a19b';

  return (
    <div className="sector-donut__center">
      <Icon size={16} color={iconColor} strokeWidth={2} />
      <span className="sector-donut__label">
        {displaySector ? formatSector(displaySector.sector) : 'Total'}
      </span>
      <strong className="sector-donut__value">
        {displaySector ? formatPct(displaySector.pct) : formatUSD(totalUSD)}
      </strong>
      {displaySector && (
        <span className="sector-donut__usd">{formatUSD(displaySector.valueUSD)}</span>
      )}
    </div>
  );
}

/* ── Chip de empresa ── */
function CompanyChip({ company, sectorPct = 0, sectorValueUSD = 0 }) {
  const isDirect = Boolean(company.isDirect);

  const weightPct = isDirect
    ? sectorValueUSD > 0
      ? (company.totalEffectiveValueUSD / sectorValueUSD) * sectorPct
      : 0
    : company.totalEffectiveWeightPct;

  const etfs = isDirect
    ? []
    : company.sources
        .filter((s) => s.symbol !== company.symbol || s.etfWeightPct < 100)
        .slice(0, 3);

  return (
    <div className="sector-chip" title={company.name}>
      <div className="sector-chip__icon">
        <AssetIcon
          asset={{
            symbol: company.symbol,
            name: company.name,
            type: isDirect ? 'etf' : 'stock',
            sector: company.sector,
          }}
          size={18}
        />
      </div>

      <div className="sector-chip__info">
        <div className="sector-chip__row">
          <span className="sector-chip__symbol">{company.symbol}</span>
          <strong className="sector-chip__weight">{formatPct(weightPct, 2)}</strong>
        </div>
        <div className="sector-chip__row sector-chip__row--sub">
          <span className="sector-chip__usd">
            {formatUSD(company.totalEffectiveValueUSD)}
          </span>
          {etfs.length > 0 && (
            <span className="sector-chip__etfs">
              {etfs.map((s) => (
                <span key={s.symbol} className="sector-chip__etf">
                  {s.symbol}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectorDetails({ sector, index, colors }) {
  if (!sector) {
    return (
      <div className="sector-map__placeholder">
        <Layers3 size={16} />
        <span>Selecciona un sector</span>
      </div>
    );
  }

  const Icon = SECTOR_ICONS[sector.sector] ?? Layers3;
  const color = getColor(index, colors);
  const companies = Array.isArray(sector.companies) ? sector.companies : [];

  return (
    <div className="sector-details">
      <div className="sector-details__header">
        <Icon size={15} color={color} strokeWidth={2} />
        <h3 className="sector-details__title">{formatSector(sector.sector)}</h3>
        <span className="sector-details__meta">
          <b>{formatPct(sector.pct)}</b>
          <span>{formatUSD(sector.valueUSD)}</span>
          {sector.count > 0 && <span>{sector.count}</span>}
        </span>
      </div>

      {companies.length > 0 ? (
        <div className="sector-details__companies">
          {companies.slice(0, 12).map((c) => (
            <CompanyChip
              key={c.symbol}
              company={c}
              sectorPct={sector.pct}
              sectorValueUSD={sector.valueUSD}
            />
          ))}
          {companies.length > 12 && (
            <span className="sector-companies__more">+{companies.length - 12}</span>
          )}
        </div>
      ) : (
        <div className="sector-details__empty">Sin holdings</div>
      )}
    </div>
  );
}

/* ── Root ── */
export default function PortfolioSectorMap({
  sectorAnalysis,
  totalInvertibleUSD = 0,
  colors = DEFAULT_SECTOR_COLORS,
  visibleLimit = DEFAULT_VISIBLE_LIMIT,
}) {
  const [showAll, setShowAll] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const sectors = useMemo(
    () => enrichSectors(normalizeSectorData(sectorAnalysis)),
    [sectorAnalysis],
  );

  const totalUSD =
    safeNumber(totalInvertibleUSD) > 0
      ? safeNumber(totalInvertibleUSD)
      : sectors.reduce((sum, s) => sum + safeNumber(s.valueUSD), 0);

  const list = showAll ? sectors : sectors.slice(0, visibleLimit);
  const activeIdx = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeSector = activeIdx !== null ? sectors[activeIdx] ?? null : null;
  const selectedSector =
    selectedIndex !== null ? sectors[selectedIndex] ?? null : null;

  function selectSector(index) {
    setSelectedIndex((cur) => (cur === index ? null : index));
  }

  if (!sectors.length) {
    return (
      <section className="portfolio-sector-map">
        <div className="sector-map__empty">
          <Layers3 size={22} />
          <span>No hay datos sectoriales</span>
        </div>
      </section>
    );
  }

  return (
    <section className="portfolio-sector-map">
      <div className="sector-map__top">
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
            displaySector={activeSector}
            displayIndex={activeIdx}
            totalUSD={totalUSD}
            colors={colors}
          />
        </div>

        <div className="sector-map__legend">
          {list.map((sector) => {
            const idx = sectors.findIndex((s) => s.sector === sector.sector);
            const Icon = SECTOR_ICONS[sector.sector] ?? Layers3;
            const color = getColor(idx, colors);
            const isSelected = selectedIndex === idx;
            const isHovered = hoveredIndex === idx;

            return (
              <button
                key={sector.sector}
                type="button"
                className={[
                  'sector-legend-item',
                  isSelected && 'is-active',
                  isHovered && 'is-hovered',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => selectSector(idx)}
                aria-pressed={isSelected}
              >
                <span
                  className="sector-legend-item__dot"
                  style={{ background: color }}
                />
                <Icon size={13} color={color} />
                <span className="sector-legend-item__label">
                  {formatSector(sector.sector)}
                </span>
                <strong className="sector-legend-item__pct">
                  {formatPct(sector.pct)}
                </strong>
              </button>
            );
          })}

          {sectors.length > visibleLimit && (
            <button
              type="button"
              className="sector-map__toggle"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Ver menos' : `+${sectors.length - visibleLimit} más`}
              <ChevronDown
                size={13}
                className={showAll ? 'is-open' : undefined}
              />
            </button>
          )}
        </div>
      </div>

      {selectedSector && (
        <div className="sector-map__details">
          <SectorDetails
            sector={selectedSector}
            index={selectedIndex}
            colors={colors}
          />
        </div>
      )}
    </section>
  );
}