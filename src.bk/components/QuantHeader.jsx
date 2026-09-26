// components/QuantHeader.jsx
// Sticky glass header: logo + metrics ticker
import React from 'react';

/**
 * Props:
 *   investable  {string}  – formatted cash string e.g. "$94,280.14"
 *   metrics     {Array}   – [{ label, value, color? }]
 *   onMore      {fn}
 */
export default function QuantHeader({ investable, metrics = [], onMore }) {
  return (
    <header className="q-header glass" style={{
      position: 'sticky', top: 0, zIndex: 40,
      borderBottom: '1px solid rgba(30,41,59,.50)',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        maxWidth: 960, margin: '0 auto',
        padding: '0.75rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36,
            background: 'rgba(0,209,192,.15)',
            border: '1px solid rgba(0,209,192,.20)',
            borderRadius: '0.75rem',
            display: 'grid', placeItems: 'center',
          }}>
            <span className="material-symbols-outlined"
              style={{ color: 'var(--color-primary)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
          </div>
          <div>
            <p style={{
              fontSize: '0.8rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#fff',
            }}>Análisis Quant</p>
            <p className="q-eyebrow" style={{ fontSize: '0.62rem', letterSpacing: '0.14em' }}>
              V3.4.2 ENGINE ACTIVE
            </p>
          </div>
        </div>

        {/* Right: investable + menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p className="q-eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.2em', marginBottom: 2 }}>
              Invertible
            </p>
            <p className="q-mono" style={{
              fontSize: '0.88rem', fontWeight: 700,
              color: 'var(--color-primary)',
            }}>
              {investable}
            </p>
          </div>
          <button onClick={onMore}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>more_vert</span>
          </button>
        </div>
      </div>

      {/* ── Metrics ticker ── */}
      <div className="no-scrollbar" style={{
        display: 'flex', overflowX: 'auto',
        borderTop: '1px solid rgba(30,41,59,.30)',
        background: 'rgba(15,23,42,.20)',
        padding: '0.6rem 1rem', gap: '1.5rem', alignItems: 'center',
      }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span className="q-eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.18em' }}>{m.label}</span>
            <span className="q-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: m.color || '#fff' }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}
