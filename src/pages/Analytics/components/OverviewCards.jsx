import styles from '../Analytics.module.css';

function money(value) {
  return `Bs ${Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;
}

function Delta({ current, previous, invert = false }) {
  if (previous == null || !Number.isFinite(Number(previous))) return null;
  if (Number(previous) === 0) return <span className={styles.deltaNeutral}>sin base</span>;

  const change = ((Number(current) - Number(previous)) / Math.abs(Number(previous))) * 100;
  const positive = invert ? change < 0 : change > 0;
  const negative = invert ? change > 0 : change < 0;
  const cls = positive ? styles.deltaPositive : negative ? styles.deltaNegative : styles.deltaNeutral;

  return (
    <span className={cls}>
      {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(0)}%
    </span>
  );
}

function Card({ label, value, hint, previous, invert = false, tone = 'neutral' }) {
  return (
    <div className={styles.metricCell}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={`${styles.metricValue} ${styles[`tone_${tone}`]}`}>
        {typeof value === 'number' ? money(value) : value}
      </p>
      {hint && <p className={styles.kpiHint}>{hint}</p>}
      {previous != null && (
        <div className={styles.metricDelta}>
          <Delta current={value} previous={previous} invert={invert} />
          <span className={styles.deltaLabel}>vs anterior</span>
        </div>
      )}
    </div>
  );
}

export default function OverviewCards({ current, previous }) {
  const balanceTone = current.netCashflow >= 0 ? 'income' : 'expense';

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Resumen del período</h2>
          <p className={styles.sectionHint}>Flujos registrados, sin transferencias internas</p>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <Card
          label="Ingresos"
          value={current.income}
          previous={previous?.income}
          tone="income"
        />
        <Card
          label="Consumo"
          value={current.expenses}
          previous={previous?.expenses}
          invert
          tone="expense"
        />
        <Card
          label="Inversión"
          value={current.investments}
          previous={previous?.investments}
          tone="investment"
        />
        <Card
          label="Flujo neto"
          value={current.netCashflow}
          previous={previous?.netCashflow}
          tone={balanceTone}
          hint="Ingresos − consumo − inversión"
        />
        <Card
          label="Tasa de ahorro"
          value={current.savingsRate == null ? '—' : `${current.savingsRate.toFixed(1)}%`}
          tone={current.savingsRate >= 20 ? 'income' : 'neutral'}
          hint="Ingresos no destinados a consumo"
        />
      </div>
    </section>
  );
}
