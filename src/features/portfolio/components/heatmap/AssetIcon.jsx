import React, { useState } from 'react';
import { SI_SLUGS, SI_COLORS, resolveIconLucide } from './assetMeta';

export default function AssetIcon({ asset, size = 16 }) {
  const symbol = String(asset.symbol || '')
    .toUpperCase()
    .split('/')[0];

  const slug = SI_SLUGS[symbol];
  const color = SI_COLORS[symbol];
  const [failed, setFailed] = useState(false);
  const fallback = resolveIconLucide(asset);

  if (slug && !failed) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(
          color || '#1f1f1f'
        ).replace('#', '')}`}
        alt={symbol}
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

