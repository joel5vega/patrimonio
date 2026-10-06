// src/features/portfolio/components/heatmap/HoldingLogo.jsx
//
// Logo de una empresa. Si la imagen falla (ticker sin logo), muestra iniciales.
import React, { useState } from 'react';

export default function HoldingLogo({ symbol, logoUrl, size = 16 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (!logoUrl || failed) {
    return (
      <span className="hm-hold-logo hm-hold-logo--fallback" style={{ ...style, fontSize: size * 0.45 }}>
        {String(symbol ?? '?').slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      className="hm-hold-logo"
      style={style}
      src={logoUrl}
      alt={symbol}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
