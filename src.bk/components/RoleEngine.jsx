// components/RoleEngine.jsx
// Motor de Reglas: distribución por rol con barras de progreso + marcador de objetivo
import React from 'react';

const STATUS_ICON = {
  ok:   { icon: 'check_circle', color: '#34d399' },
  warn: { icon: 'report',       color: 'var(--color-rose)' },
  over: { icon: 'cancel',       color: 'var(--color-rose)' },
};

/**
 * Props:
 *   roles  {Array}  – [{
 *     name, color,
 *     goal: string ("≥40%" | "≤10%"),
 *     goalPct: number,
 *     goalDir: 'min' | 'max',
 *     currentPct: number,
 *     diff: string,   // "+8.2% (Sobre-expuesto)" or null
 *     status: 'ok' | 'warn' | 'over',
 *   }]
 */
export default function RoleEngine({ roles = [] }) {
  return (
    <section className="q-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(30,41,59,.50)',
      }}>
        <div>
          <p className="q-eyebrow q-eyebrow--primary" style={{ fontSize: '0.62rem', marginBottom: 4 }}>Motor de Reglas</p>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>Distribución por Rol</h3>
        </div>
        <span className="material-symbols-outlined" style={{ color: '#475569' }}>expand_more</span>
      </div>

      {/* Role rows */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {roles.map(r => {
          const st = STATUS_ICON[r.status] || STATUS_ICON.ok;
          const goalLeft = `${r.goalPct}%`;
          return (
            <div key={r.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Label row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.06em' }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '-0.01em' }}>
                    Goal: {r.goal}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="q-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                    {r.currentPct}%
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: st.color, fontVariationSettings: "'FILL' 1" }}>
                    {st.icon}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="q-track">
                <div className="q-track__fill" style={{ width: `${Math.min(r.currentPct, 100)}%`, background: r.color, opacity: 0.85 }} />
                <div className="q-track__marker" style={{ left: goalLeft }} />
              </div>

              {/* Diff note */}
              {r.diff && (
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-rose)', marginTop: 2 }}>
                  {r.diff}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
