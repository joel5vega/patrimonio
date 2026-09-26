// components/RebalancePlan.jsx
// Plan de Rebalanceo – BUY/SELL action rows + available cash footer
import React from 'react';

const ACTION_STYLES = {
  BUY:  { color: '#34d399', bg: 'rgba(16,185,129,.10)',  border: 'rgba(16,185,129,.20)'  },
  SELL: { color: '#fb7185', bg: 'rgba(244,63,94,.10)',   border: 'rgba(244,63,94,.20)'   },
};

/**
 * Props:
 *   actions  {Array}  – [{ action:'BUY'|'SELL', name, reason, amount }]
 *   cash     {string} – "$12,400.00"
 *   onExecute {fn}
 */
export default function RebalancePlan({ actions = [], cash, onExecute }) {
  return (
    <section className="q-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid rgba(30,41,59,.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>
            rebase_edit
          </span>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>Plan de Rebalanceo</h3>
        </div>
        <button onClick={onExecute} className="q-badge q-badge--primary"
          style={{ cursor: 'pointer', border: '1px solid rgba(0,209,192,.20)', letterSpacing: '0.1em' }}>
          EJECUTAR
        </button>
      </div>

      {/* Action rows */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {actions.map((a, i) => {
          const s = ACTION_STYLES[a.action] || ACTION_STYLES.BUY;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(255,255,255,.02)',
              border: '1px solid var(--color-border)',
              borderRadius: '1rem', padding: '0.75rem',
            }}>
              <span style={{
                fontSize: '0.62rem', fontWeight: 900,
                color: s.color, background: s.bg,
                border: `1px solid ${s.border}`,
                padding: '0.18rem 0.55rem', borderRadius: 999,
                flexShrink: 0,
              }}>
                {a.action}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{a.name}</p>
                <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2 }}>{a.reason}</p>
              </div>
              <p className="q-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: s.color, flexShrink: 0 }}>
                {a.amount}
              </p>
            </div>
          );
        })}

        {/* Cash footer */}
        {cash && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: '0.65rem',
            borderTop: '1px solid rgba(255,255,255,.06)',
            marginTop: 4,
          }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>
              Caja disponible
            </span>
            <span className="q-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>
              {cash}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
