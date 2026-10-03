import React, { useState } from 'react';
import {
  SI_SLUGS,
  SI_COLORS,
  resolveIconLucide,
  getIconSymbol,
} from './assetMeta';

/** ETFs / índices US → bandera de EE.UU. (flagcdn). */
const US_FLAG_SYMBOLS = new Set([
  'VOO',
  'SPY',
  'IVV',
  'VTI',
  'QQQ',
  'QQQM',
  'DIA',
  'IWM',
]);

/**
 * Icono del tile:
 * - VOO / SPY / … → bandera USA
 * - Simple Icons si hay slug (BTC, USDT, …)
 * - AirTM / Deel → Lucide vía getIconSymbol
 */
export default function AssetIcon({ asset, size = 16 }) {
  const iconSymbol = getIconSymbol(asset || {});
  const [failed, setFailed] = useState(false);
  const fallback = resolveIconLucide(asset || { symbol: iconSymbol });

  // Bandera USA para equity US core
  if (US_FLAG_SYMBOLS.has(iconSymbol) && !failed) {
    return (
      <img
        src={`https://flagcdn.com/w40/us.png`}
        alt="USA"
        width={size}
        height={Math.round(size * 0.75)}
        style={{
          borderRadius: 2,
          display: 'block',
          flexShrink: 0,
          objectFit: 'cover',
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  const slug = SI_SLUGS[iconSymbol];
  const color = SI_COLORS[iconSymbol];

  if (slug && !failed) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(
          color || '#1f1f1f'
        ).replace('#', '')}`}
        alt={iconSymbol}
        width={size}
        height={size}
        style={{
          borderRadius: 3,
          display: 'block',
          flexShrink: 0,
          objectFit: 'contain',
        }}
        onError={() => setFailed(true)}
      />
    );
  }

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