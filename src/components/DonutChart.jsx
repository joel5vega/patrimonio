// components/DonutChart.jsx
import React from 'react';

/**
 * Props:
 *   total     {string}   – "$142,504"
 *   ytd       {string}   – "+2.4% YTD"  (puede ser negativo)
 *   segments  {Array}    – [{
 *     label, color, valueUSD, pct, deg,
 *     icon?: ReactNode,          // opcional
 *     positions?: number         // opcional → número de posiciones
 *   }]
 */
export default function DonutChart({ total, ytd, segments = [] }) {
  // ── Normalizar grados para que siempre sumen 360 ──
  const totalDeg = segments.reduce((sum, s) => sum + (s.deg || 0), 0) || 1;
  const normalized = segments.map(s => ({
    ...s,
    deg: ((s.deg || 0) / totalDeg) * 360,
  }));

  // ── Construir conic-gradient con pequeño gap ──
  const GAP = 1.8; // grados de separación entre segmentos
  let cursor = 0;
  const stops = normalized
    .map(s => {
      const usable = Math.max(0, s.deg - GAP);
      const start = cursor + GAP / 2;
      const end = start + usable;
      cursor += s.deg;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  const isPositiveYtd = !ytd?.trim().startsWith('-');

  return (
    <section
      className="q-card"
      style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ── Donut ── */}
      <div
        style={{
          position: 'relative',
          width: 260,
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Anillo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from -90deg, ${stops})`,
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 28px), #000 calc(100% - 27px))',
            mask:
              'radial-gradient(farthest-side, transparent calc(100% - 28px), #000 calc(100% - 27px))',
          }}
        />

        {/* Centro */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <p
            className="q-eyebrow"
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.22em',
              marginBottom: 4,
              color: '#94a3b8',
            }}
          >
            Total Assets
          </p>
          <p
            className="q-mono"
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {total}
          </p>

          {/* YTD pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 10,
              padding: '0.28rem 0.8rem',
              background: isPositiveYtd
                ? 'rgba(16,185,129,.12)'
                : 'rgba(239,68,68,.12)',
              border: `1px solid ${
                isPositiveYtd
                  ? 'rgba(16,185,129,.25)'
                  : 'rgba(239,68,68,.25)'
              }`,
              borderRadius: 999,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 14,
                color: isPositiveYtd ? '#34d399' : '#f87171',
                fontVariationSettings: "'FILL' 1",
              }}
            >
              {isPositiveYtd ? 'trending_up' : 'trending_down'}
            </span>
            <span
              className="q-mono"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isPositiveYtd ? '#34d399' : '#f87171',
              }}
            >
              {ytd}
            </span>
          </div>
        </div>
      </div>

      {/* ── Legend grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          width: '100%',
          marginTop: '2rem',
        }}
      >
        {normalized.map((s) => (
          <div
            key={s.label}
            style={{
              padding: '0.8rem 0.9rem',
              borderRadius: '1rem',
              background: 'rgba(2,6,23,.55)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* Fila superior: color + icono + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: s.color,
                  flexShrink: 0,
                  boxShadow: `0 0 0 3px ${s.color}22`,
                }}
              />
              {s.icon && (
                <span
                  style={{
                    display: 'flex',
                    color: s.color,
                    opacity: 0.9,
                  }}
                >
                  {s.icon}
                </span>
              )}
              <span
                className="q-eyebrow"
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.14em',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.label}
              </span>
            </div>

            {/* Fila inferior: valor + % + posiciones */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span
                className="q-mono"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {s.valueUSD}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.positions != null && s.positions > 0 && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#64748b',
                      background: 'rgba(148,163,184,.12)',
                      padding: '0.12rem 0.4rem',
                      borderRadius: 999,
                    }}
                  >
                    {s.positions} pos.
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#64748b',
                  }}
                >
                  {s.pct}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}