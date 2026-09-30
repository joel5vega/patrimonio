import styles from '../Analytics.module.css';

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

function Metric({ label, value, hint }) {
  return (
    <div className={styles.behaviorMetric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export default function BehaviorPanel({ behavior, concentration }) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Comportamiento</h2>
          <p className={styles.sectionHint}>Frecuencia, tamaño y concentración del gasto</p>
        </div>
      </div>

      <div className={styles.behaviorGrid}>
        <Metric label="Movimientos" value={behavior.transactionCount} hint="egresos de consumo" />
        <Metric label="Promedio" value={money(behavior.avgTransaction)} hint="por movimiento" />
        <Metric label="Mediana" value={money(behavior.medianTransaction)} hint="por movimiento" />
        <Metric label="Mayor gasto" value={money(behavior.largestTransaction)} />
        <Metric label="Top 3" value={concentration.top3 == null ? '—' : `${concentration.top3.toFixed(0)}%`} hint="del gasto" />
        <Metric label="Top 5" value={concentration.top5 == null ? '—' : `${concentration.top5.toFixed(0)}%`} hint="del gasto" />
      </div>
    </section>
  );
}
