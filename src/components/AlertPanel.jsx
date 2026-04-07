// components/AlertPanel.jsx
// Panel de Alertas – critical & warning cards
import React from 'react';

const LEVEL_STYLES = {
  critical: {
    wrap:  { background: 'rgba(244,63,94,.05)',  border: '1px solid rgba(244,63,94,.20)'  },
    icon:  { background: 'rgba(244,63,94,.20)',  color: 'var(--color-rose)'                },
    badge: { background: 'var(--color-rose)',    color: 'var(--color-bg)'                  },
    label: 'Crítico',
  },
  warn: {
    wrap:  { background: 'rgba(234,179,8,.05)',  border: '1px solid rgba(234,179,8,.20)'  },
    icon:  { background: 'rgba(234,179,8,.20)',  color: 'var(--color-yellow)'              },
    badge: { background: 'var(--color-yellow)',  color: 'var(--color-bg)'                  },
    label: 'Aviso',
  },
};

const ICON = { critical: 'error', warn: 'warning' };

/**
 * Props:
 *   alerts  {Array}  – [{ id, level:'critical'|'warn', title, description }]
 */
export default function AlertPanel({ alerts = [] }) {
  const criticalCount = alerts.filter(a => a.level === 'critical').length;

  return (
    <section>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '0.75rem' }}>
        <span className="q-eyebrow" style={{ fontSize: '0.62rem', letterSpacing: '0.22em' }}>Panel de Alertas</span>
        {criticalCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-rose)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>priority_high</span>
            {criticalCount} CRÍTICA{criticalCount > 1 ? 'S' : ''}
          </span>
        )}
      </div>

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.map(a => {
          const s = LEVEL_STYLES[a.level] || LEVEL_STYLES.warn;
          return (
            <div key={a.id} style={{
              ...s.wrap, borderRadius: '1rem',
              padding: '1rem', display: 'flex', gap: '1rem',
            }}>
              {/* Icon */}
              <div style={{
                ...s.icon,
                width: 40, height: 40, borderRadius: '0.75rem',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {ICON[a.level]}
                </span>
              </div>
              {/* Body */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>{a.title}</p>
                  <span style={{
                    ...s.badge,
                    fontSize: '0.58rem', fontWeight: 900,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {s.label}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{a.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
