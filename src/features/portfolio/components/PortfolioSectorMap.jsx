import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
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
  Zap,BadgeDollarSign,
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
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const total = sectors.reduce((sum, sector) => sum + Math.max(0, sector.pct), 0) || 1;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="Distribución de la cartera por sector"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(51, 65, 85, 0.35)"
          strokeWidth={strokeWidth}
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
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={getColor(index)}
              strokeWidth={activeIndex === index ? strokeWidth + 5 : strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${visibleSegment} ${circumference - visibleSegment}`}
              strokeDashoffset={-currentOffset}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.28}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tracking-tight text-slate-100">
          {sectors.length}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          sectores
        </span>
      </div>
    </div>
  );
}

function SectorLegendRow({ sector, color, index, activeIndex, onHover, onSelect }) {
  const Icon = SECTOR_ICONS[sector.sector] || Layers3;
  const isActive = activeIndex === index;
  const isLookThrough = Number(sector.lookThroughValueUSD || 0) > 0;

  return (
    <button
      type="button"
      className={`group grid w-full grid-cols-[minmax(0,1fr)_70px_88px] items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 ${
        isActive
          ? 'bg-slate-800/90 shadow-[inset_3px_0_0_var(--sector-color)]'
          : 'hover:bg-slate-800/50'
      }`}
      style={{ '--sector-color': color }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(index)}
      aria-pressed={isActive}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            color,
            backgroundColor: `${color}18`,
            border: `1px solid ${color}35`,
          }}
        >
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 truncate text-xs font-medium text-slate-300 group-hover:text-slate-100">
          {formatSector(sector.sector)}
        </span>
      </span>

      <span className="text-right text-sm font-semibold tabular-nums text-slate-200">
        {formatPct(sector.pct)}
      </span>

      <span className="flex flex-col items-end">
        <span className="text-xs tabular-nums text-slate-400">
          {formatUSD(sector.valueUSD)}
        </span>
        {isLookThrough && (
          <span className="text-[9px] uppercase tracking-wide text-cyan-400/70">
            ETF look-through
          </span>
        )}
      </span>
    </button>
  );
}

function SectorDetails({ sector }) {
  if (!sector) return null;

  const sources = sector.sources || [];
  const direct = Number(sector.directValueUSD || 0);
  const lookThrough = Number(sector.lookThroughValueUSD || 0);

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-100">
            {formatSector(sector.sector)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatPct(sector.pct)} de los activos invertibles
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-200">
          {formatUSD(sector.valueUSD)}
        </p>
      </div>

      {(direct > 0 || lookThrough > 0) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-900/80 p-2">
            <p className="text-slate-500">Directo</p>
            <p className="mt-1 font-medium text-slate-300">{formatUSD(direct)}</p>
          </div>
          <div className="rounded-lg bg-cyan-950/20 p-2">
            <p className="text-cyan-400/70">Por ETFs</p>
            <p className="mt-1 font-medium text-cyan-200">{formatUSD(lookThrough)}</p>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sources.map((source) => (
            <span
              key={source}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-medium text-slate-400"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioSectorMap({ sectorAnalysis, className = '' }) {
  const sectors = useMemo(
    () => normalizeSectorData(sectorAnalysis),
    [sectorAnalysis]
  );
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const visibleSectors = expanded ? sectors : sectors.slice(0, 8);
  const selectedSector = selectedIndex === null ? null : sectors[selectedIndex];
  const totalUSD = sectors.reduce((sum, sector) => sum + sector.valueUSD, 0);
  const dominantSector = sectors[0];

  if (!sectors.length) {
    return (
      <section className={`rounded-2xl border border-slate-800 bg-slate-950/60 p-6 ${className}`}>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Análisis de concentración
        </p>
        <h2 className="mt-2 text-base font-semibold text-slate-100">
          Distribución por sector
        </h2>
        <p className="mt-8 text-sm text-slate-500">
          No hay datos sectoriales disponibles.
        </p>
      </section>
    );
  }

  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-800/80 bg-[#070d1c] shadow-2xl shadow-black/10 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Análisis de concentración
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100 sm:text-base">
            Distribución por sector
          </h2>
        </div>

        {dominantSector && (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold text-cyan-300">
            Principal: {formatSector(dominantSector.sector)} {formatPct(dominantSector.pct)}
          </span>
        )}
      </header>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center">
        <div className="flex flex-col items-center justify-center">
          <SectorDonut
            sectors={sectors}
            activeIndex={activeIndex}
            onHover={setActiveIndex}
          />
          <p className="mt-3 text-xs tabular-nums text-slate-500">
            {formatUSD(totalUSD)} invertidos
          </p>
        </div>

        <div className="min-w-0">
          <div className="space-y-0.5">
            {visibleSectors.map((sector, index) => (
              <SectorLegendRow
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

          {sectors.length > 8 && (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:bg-slate-800/50 hover:text-slate-200"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Ver menos sectores' : `Ver todos (${sectors.length})`}
            </button>
          )}

          <SectorDetails sector={selectedSector} />
        </div>
      </div>
    </section>
  );
}