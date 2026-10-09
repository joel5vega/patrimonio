import React, { useState } from 'react';
import {
  SI_SLUGS,
  SI_COLORS,
  resolveIconLucide,
  getIconSymbol,
} from './assetMeta';

const US_FLAG_SYMBOLS = new Set([
  'VOO', 'SPY', 'IVV', 'VTI', 'QQQ', 'QQQM', 'DIA', 'IWM',
]);

// Dominios para logos reales (DeBounce – reemplazo de Clearbit)
const LOGO_DOMAINS = {
  // Plataformas
  BYBIT: 'bybit.com',
  AIRTM: 'airtm.com',
  DEEL: 'deel.com',
  BINANCE: 'binance.com',

  // Acciones individuales
  AMZN: 'amazon.com',
  MSFT: 'microsoft.com',
  MELI: 'mercadolibre.com',
  ASML: 'asml.com',
  TSM: 'tsmc.com',
  '0700': 'tencent.com',
  HD: 'homedepot.com',
  'BRK.B': 'berkshirehathaway.com',
  SCHW: 'schwab.com',
  JPM: 'jpmorganchase.com',
  // ... resto de acciones
  BCH: 'bitcoincash.org',
HYPE: 'hyperliquid.xyz',
// ── LOGO_DOMAINS (DeBounce / logo CDN) ──
TXN: 'ti.com',
QCOM: 'qualcomm.com',
PG: 'pg.com',
KO: 'coca-cola.com',
CVX: 'chevron.com',
COP: 'conocophillips.com',
MRK: 'merck.com',
UNH: 'unitedhealthgroup.com',
AMGN: 'amgen.com',
VZ: 'verizon.com',
HD: 'homedepot.com',
ABT: 'abbott.com',
PEP: 'pepsico.com',
BMY: 'bms.com',
ACN: 'accenture.com',
MO: 'altria.com',
ADP: 'adp.com',
LMT: 'lockheedmartin.com',
BX: 'blackstone.com',
EOG: 'eogresources.com',
CMCSA: 'comcast.com',
SLB: 'slb.com',
UPS: 'ups.com',
TGT: 'target.com',
FAST: 'fastenal.com',
};

export default function AssetIcon({ asset, size = 16 }) {
  const iconSymbol = getIconSymbol(asset || {});
  const [stage, setStage] = useState(0); // 0 = SI, 1 = Clearbit, 2 = Lucide
  const fallback = resolveIconLucide(asset || { symbol: iconSymbol });

  // 1. Bandera USA para ETFs core
  if (US_FLAG_SYMBOLS.has(iconSymbol) && stage === 0) {
    return (
      <img
        src="https://flagcdn.com/w40/us.png"
        alt="USA"
        width={size}
        height={Math.round(size * 0.75)}
        style={{ borderRadius: 2, display: 'block', flexShrink: 0, objectFit: 'cover' }}
        onError={() => setStage(2)}
      />
    );
  }

  // 2. Simple Icons (solo los que existen)
  const slug = SI_SLUGS[iconSymbol];
  const color = SI_COLORS[iconSymbol];

  if (slug && stage === 0) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(color || '#ffffff').replace('#', '')}`}
        alt={iconSymbol}
        width={size}
        height={size}
        style={{ borderRadius: 3, display: 'block', flexShrink: 0, objectFit: 'contain' }}
        onError={() => setStage(1)}
      />
    );
  }

  // 3. DeBounce (logos reales – reemplazo de Clearbit)
  const domain = LOGO_DOMAINS[iconSymbol];
  if (domain && stage <= 1) {
    return (
      <img
        src={`https://logo.debounce.com/${domain}`}
        alt={iconSymbol}
        width={size}
        height={size}
        style={{
          borderRadius: 3,
          display: 'block',
          flexShrink: 0,
          objectFit: 'contain',
          background: 'transparent',
        }}
        onError={() => setStage(2)}
      />
    );
  }

  // 4. Fallback Lucide
  const Icon = fallback.Icon;
  return (
    <Icon
      size={size}
      color={fallback.color}
      strokeWidth={2}
      style={{ flexShrink: 0 }}
    />
  );
}