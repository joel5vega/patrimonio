// components/QuantHeader.jsx — Altitude dark sticky header
import React from 'react';

export default function QuantHeader({ investable, metrics = [], onMore }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--color-obsidian)',
        borderBottom: '1px solid var(--color-graphite-card)',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'var(--color-graphite-card)',
              border: '1px solid var(--color-iron-peak)',
              borderRadius: 4,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--color-bone)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}
            >
              analytics
            </span>
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-libre-baskerville)',
                fontSize: 15,
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--color-bone)',
              }}
            >
              Análisis Quant
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-fira-code)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-fog)',
              }}
            >
              V3.4.2 ENGINE ACTIVE
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                margin: 0,
                marginBottom: 2,
                fontFamily: 'var(--font-inter)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-fog)',
              }}
            >
              Invertible
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-fira-code)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-voltage-blue)',
              }}
            >
              {investable}
            </p>
          </div>
          <button
            onClick={onMore}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-fog)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              more_vert
            </span>
          </button>
        </div>
      </div>

      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'auto',
          borderTop: '1px solid var(--color-graphite-card)',
          background: 'var(--color-graphite-card)',
          padding: '10px 16px',
          gap: 24,
          alignItems: 'center',
        }}
      >
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-fog)',
              }}
            >
              {m.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-fira-code)',
                fontSize: 13,
                fontWeight: 600,
                color: m.color || 'var(--color-bone)',
              }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}
