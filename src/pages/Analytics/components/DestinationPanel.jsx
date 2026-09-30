import styles from '../Analytics.module.css';

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

export default function DestinationPanel({ current }) {
  const income = current.income || 0;
  const expensePct = income > 0 ? (current.expenses / income) * 100 : 0;
  const investmentPct = income > 0 ? (current.investments / income) * 100 : 0;
  const retainedPct = income > 0 ? (current.netCashflow / income) * 100 : 0;

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Destino del dinero</h2>
          <p className={styles.sectionHint}>
            Cómo se distribuyeron los ingresos del período
          </p>
        </div>
      </div>

      {income <= 0 ? (
        <div className={styles.emptyState}>No hay ingresos registrados en este período.</div>
      ) : (
        <>
          <div className={styles.allocationTrack} aria-label="Distribución de ingresos">
            <div style={{ width: `${Math.min(Math.max(expensePct, 0), 100)}%` }} className={styles.allocExpense} />
            <div style={{ width: `${Math.min(Math.max(investmentPct, 0), 100)}%` }} className={styles.allocInvestment} />
          </div>

          <div className={styles.allocationGrid}>
            <div>
              <span className={styles.allocDot + ' ' + styles.allocExpenseDot} />
              <p>Consumo</p>
              <strong>{money(current.expenses)}</strong>
              <small>{expensePct.toFixed(1)}%</small>
            </div>
            <div>
              <span className={styles.allocDot + ' ' + styles.allocInvestmentDot} />
              <p>Inversión</p>
              <strong>{money(current.investments)}</strong>
              <small>{investmentPct.toFixed(1)}%</small>
            </div>
            <div>
              <span className={styles.allocDot + ' ' + styles.allocRetainedDot} />
              <p>Flujo restante</p>
              <strong>{money(current.netCashflow)}</strong>
              <small>{retainedPct.toFixed(1)}%</small>
            </div>
          </div>

          {current.netCashflow < 0 && (
            <p className={styles.warningText}>
              El período termina con un déficit después de consumo e inversión.
            </p>
          )}
        </>
      )}
    </section>
  );
}
