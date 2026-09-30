import { TX_CATEGORIES } from '../../../hooks/useTransactions';
import { fmtDate } from '../dateHelpers';
import styles from '../Analytics.module.css';

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

export default function TopExpenses({ expenses }) {
  const top = [...expenses].sort((a, b) => b.__amount - a.__amount).slice(0, 5);
  const total = expenses.reduce((s, tx) => s + tx.__amount, 0);

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Movimientos relevantes</h2>
          <p className={styles.sectionHint}>Mayores egresos de consumo del período</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className={styles.emptyState}>Sin gastos de consumo.</div>
      ) : (
        <div className={styles.topList}>
          {top.map((tx) => {
            const meta = TX_CATEGORIES.find((item) => item.value === tx.category);
            const pct = total > 0 ? (tx.__amount / total) * 100 : 0;
            return (
              <div className={styles.topRow} key={tx.id || `${tx.date}-${tx.__amount}-${tx.concept}`}>
                <div className={styles.topIcon}>{meta?.emoji || '•'}</div>
                <div className={styles.topInfo}>
                  <strong>{tx.concept || tx.title || 'Gasto'}</strong>
                  <span>{fmtDate(tx.date)}{meta?.label ? ` · ${meta.label}` : ''}</span>
                </div>
                <div className={styles.topAmount}>
                  <strong>{money(tx.__amount)}</strong>
                  <span>{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
