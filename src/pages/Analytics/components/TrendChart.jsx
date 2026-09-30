import styles from '../Analytics.module.css';

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

export default function TrendChart({ trend }) {
  const max = Math.max(...trend.map((m) => Math.max(m.income, m.expenses, m.investments)), 1);

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Evolución mensual</h2>
          <p className={styles.sectionHint}>Últimos 12 meses · ingresos, consumo e inversión</p>
        </div>
      </div>

      <div className={styles.trendLegend}>
        <span><i className={styles.legendIncome} />Ingresos</span>
        <span><i className={styles.legendExpense} />Consumo</span>
        <span><i className={styles.legendInvestment} />Inversión</span>
      </div>

      <div className={styles.trendScroll}>
        <div className={styles.trendChart}>
          {trend.map((month) => (
            <div className={styles.monthColumn} key={month.key} title={`${month.label}: ${money(month.income)}`}>
              <div className={styles.monthBars}>
                <div
                  className={styles.barIncome}
                  style={{ height: `${(month.income / max) * 100}%` }}
                />
                <div
                  className={styles.barExpense}
                  style={{ height: `${(month.expenses / max) * 100}%` }}
                />
                <div
                  className={styles.barInvestment}
                  style={{ height: `${(month.investments / max) * 100}%` }}
                />
              </div>
              <span>{month.label}</span>
              <small className={month.netCashflow >= 0 ? styles.netPositive : styles.netNegative}>
                {month.netCashflow >= 0 ? '+' : '−'}{Math.abs(month.netCashflow).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
              </small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
