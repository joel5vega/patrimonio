import { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronUp, Layers3,
  Cpu, HeartPulse, Shield, ShoppingCart, ShoppingBag, Landmark,
  Fuel, Leaf, Mountain, Building2, FileText, TrendingUp,
  Link2, Layers, Repeat, DollarSign, CreditCard, Rocket,
  Gem, Pickaxe, Wallet, Flag, Globe, Sparkles, PieChart,
} from 'lucide-react';

// Un icono por sector: da reconocimiento visual instantáneo sin leer el texto.
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
  inmobiliario_cotizado: Building2,
  bonos_gobierno: FileText,
  bonos_inflacion: TrendingUp,
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
  inmobiliario_cotizado: 'Inmobiliario cotizado',
  bonos_gobierno: 'Bonos gobierno',
  bonos_inflacion: 'Bonos inflación',
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
};

const SECTOR_COLORS = [
  '#22d3ee', '#60a5fa', '#34d399', '#facc15', '#fb7185',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f472b6', '#94a3b8',
];

const formatSector = (sector) => (
  SECTOR_LABELS[sector] || String(sector || 'otros').replaceAll('_', ' ')
);

const formatUSD = (value) => Number(value || 0).toLocaleString(undefined, {
  maximumFractionDigits: 0,
});

// --- Datos: normaliza el input a una forma predecible ---------------------

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
    }))
    .filter((sector) => sector.valueUSD > 0 || sector.pct > 0)
    .sort((a, b) => b.valueUSD - a.valueUSD);
}

// --- Donut: gráfico SVG simple, sin librerías externas ---------------------

function SectorDonut({ sectors, activeIndex, onHover }) {
  const size = 140;
  const radius = 56;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribución por sector">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={strokeWidth} />
        {sectors.map((sector, index) => {
          const fraction = Math.max(sector.pct, 0) / 100;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const dashoffset = -offsetAcc;
          offsetAcc += dash;
          const isActive = activeIndex === index;

          return (
            <circle
              key={sector.sector}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={SECTOR_COLORS[index % SECTOR_COLORS.length]}
              strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={dashoffset}
              opacity={activeIndex == null || isActive ? 1 : 0.35}
              style={{ transition: 'all 150ms ease', cursor: 'pointer' }}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </g>
      <text x="50%" y="47%" textAnchor="middle" fontSize="20" fontWeight="700" fill="#e2e8f0">
        {sectors.length}
      </text>
      <text x="50%" y="63%" textAnchor="middle" fontSize="10" fill="#94a3b8">
        sectores
      </text>
    </svg>
  );
}

// --- Fila de leyenda: icono + nombre + % + valor, una sola línea ----------

function SectorLegendRow({ sector, color, isActive, onHover }) {
  const Icon = SECTOR_ICONS[sector.sector] || Layers3;

  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 1,
        padding: '8px 4px',
        opacity: isActive === false ? 0.4 : 1,
        transition: 'opacity 150ms ease',
        cursor: 'default',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 999, flexShrink: 0,
        background: `${color}22`,
      }}>
        <Icon size={15} color={color} />
      </span>

      <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0' }}>
        {formatSector(sector.sector)}
      </span>

      <span style={{ textAlign: 'right' }}>
        <strong style={{ display: 'block', fontSize: 13, color: '#f8fafc' }}>
          {sector.pct.toFixed(1)}%
        </strong>
        <small style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>
          {formatUSD(sector.valueUSD)} USD
        </small>
      </span>
    </div>
  );
}

// --- Componente principal ---------------------------------------------------

export default function PortfolioSectorMap({
  sectorAnalysis,
  title = 'Distribución por sector',
  eyebrow = 'Análisis de concentración',
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(null);

  const sectors = useMemo(() => normalizeSectorData(sectorAnalysis), [sectorAnalysis]);
  const dominantSector = sectors[0];

  return (
    <section className="portfolio-card portfolio-sector-card">
      <button
        type="button"
        className="portfolio-sector-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>
          <span className="portfolio-eyebrow">{eyebrow}</span>
          <span className="portfolio-sector-title">{title}</span>
        </span>

        <span className="portfolio-sector-trigger-right">
          {dominantSector && (
            <span className="portfolio-sector-dominant-badge">
              {formatSector(dominantSector.sector)} {dominantSector.pct.toFixed(1)}%
            </span>
          )}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="portfolio-sector-content">
          {!sectors.length ? (
            <div className="portfolio-empty">
              <Layers3 size={16} />
              No hay sectores clasificados.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <div style={{ flexShrink: 0 }}>
                <SectorDonut sectors={sectors} activeIndex={activeIndex} onHover={setActiveIndex} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {sectors.map((sector, index) => (
                  <SectorLegendRow
                    key={sector.sector}
                    sector={sector}
                    color={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                    isActive={activeIndex == null ? null : activeIndex === index}
                    onHover={(hovering) => setActiveIndex(hovering ? index : null)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
