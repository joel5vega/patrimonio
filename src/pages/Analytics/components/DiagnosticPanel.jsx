import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import styles from '../Analytics.module.css';

const ICONS = {
  warning: AlertTriangle,
  positive: CheckCircle2,
  neutral: Info,
};

export default function DiagnosticPanel({ signals, unknownCount, transferCount }) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Señales del período</h2>
          <p className={styles.sectionHint}>Observaciones calculadas a partir de los movimientos registrados</p>
        </div>
      </div>

      <div className={styles.signalList}>
        {(signals || []).map((signal, index) => {
          const Icon = ICONS[signal.type] || Info;
          return (
            <div className={`${styles.signal} ${styles[`signal_${signal.type}`]}`} key={`${signal.title}-${index}`}>
              <Icon size={15} />
              <div>
                <strong>{signal.title}</strong>
                <p>{signal.text}</p>
              </div>
            </div>
          );
        })}

        {!signals?.length && (
          <div className={styles.emptyState}>No hay señales relevantes para este período.</div>
        )}

        {(unknownCount > 0 || transferCount > 0) && (
          <div className={styles.dataQuality}>
            <strong>Calidad del dato</strong>
            <span>
              {transferCount} transferencias excluidas
              {unknownCount > 0 ? ` · ${unknownCount} movimientos sin clasificación` : ''}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
