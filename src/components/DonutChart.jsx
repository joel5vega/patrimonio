// components/DonutChart.jsx
// SVG donut with centre total + YTD pill + legend grid
import React from 'react';

/**
 * Props:
 *   total     {string}   – "$142,504"
 *   ytd       {string}   – "+2.4% YTD"
 *   segments  {Array}    – [{ label, color, valueUSD, pct, deg }]
 *                          deg = arc degrees (0-360)
 */
export default function DonutChart({ total, ytd, segments = [] }) {
  // Build conic-gradient string from segments
  let cursor = 0;
  const stops = segments.map(s => {
    const start = cursor;
    const end = cursor + s.deg;
    cursor = end;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <section className="q-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* ── Donut ── */}
      <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ring via conic-gradient + mask */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: `conic-gradient(${stops})`,
          WebkitMask: 'radial-gradient(transparent 68%, black 69%)',
          mask:        'radial-gradient(transparent 68%, black 69%)',
        }} />

        {/* Centre text */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <p className="q-eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.22em', marginBottom: 4 }}>
            Total Assets
          </p>
          <p className="q-mono" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            {total}
          </p>
          {/* YTD pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 8, padding: '0.25rem 0.75rem',
            background: 'rgba(16,185,129,.10)',
            border: '1px solid rgba(16,185,129,.20)',
            borderRadius: 999,
          }}>
            <span className="material-symbols-outlined"
              style={{ fontSize: 14, color: '#34d399', fontVariationSettings: "'FILL' 1" }}>
              trending_up
            </span>
            <span className="q-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>
              {ytd}
            </span>
          </div>
        </div>
      </div>

      {/* ── Legend grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem', width: '100%', marginTop: '2rem',
      }}>
        {segments.map(s => (
          <div key={s.label} style={{
            padding: '0.75rem', borderRadius: '1rem',
            background: 'rgba(2,6,23,.50)',
            border: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 6, height: 12, borderRadius: 999, background: s.color, flexShrink: 0 }} />
              <span className="q-eyebrow" style={{ fontSize: '0.62rem', letterSpacing: '0.16em' }}>
                {s.label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="q-mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                {s.valueUSD}
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>{s.pct}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
