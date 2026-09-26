// src/ui/DeltaBadge.jsx
export default function DeltaBadge({ current, previous, invert = false }) {
  if (previous === null || previous === undefined || previous === 0) return null;

  const delta = ((current - previous) / previous) * 100;
  const isGood = invert ? delta < 0 : delta > 0;
  const abs = Math.abs(delta);

  if (abs < 1) {
    return (
      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(148,163,184,0.5)', fontFamily: 'JetBrains Mono,monospace' }}>
        —
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
        fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px',
        fontFamily: 'JetBrains Mono,monospace',
        background: isGood ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
        color: isGood ? 'var(--color-success-light)' : 'var(--color-danger-light)',
        whiteSpace: 'nowrap',
      }}
    >
      {delta > 0 ? '+' : ''}{abs.toFixed(1)}%
    </span>
  );
}
