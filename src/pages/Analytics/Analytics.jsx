import { RefreshCw } from 'lucide-react';
import { fmtDate } from './dateHelpers';
import { useAnalyticsData } from './useAnalyticsData';
import PeriodControls from './components/PeriodControls';
import OverviewCards from './components/OverviewCards';
import DestinationPanel from './components/DestinationPanel';
import TrendChart from './components/TrendChart';
import BehaviorPanel from './components/BehaviorPanel';
import CategoryBreakdown from './components/CategoryBreakdown';
import TopExpenses from './components/TopExpenses';
import DiagnosticPanel from './components/DiagnosticPanel';
import styles from './Analytics.module.css';

export default function Analytics() {
  const d = useAnalyticsData();

  if (d.authLoading) {
    return <div className={styles.centerMsg}>Verificando sesión…</div>;
  }

  if (!d.user) {
    return <div className={`${styles.centerMsg} ${styles.errorMsg}`}>No hay una sesión activa.</div>;
  }

  if (d.loading) {
    return <div className={styles.centerMsg}>Cargando análisis…</div>;
  }

  if (d.error) {
    return (
      <div className={`${styles.centerMsg} ${styles.errorMsg}`}>
        {String(d.error?.message || d.error)}
      </div>
    );
  }

  const hasCustomRange =
    d.period === 'custom' && d.customStart && d.customEnd;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Análisis financiero</h1>
          <p className={styles.subtitle}>
            {hasCustomRange
              ? `${fmtDate(d.customStart)} → ${fmtDate(d.customEnd)}`
              : `Período: ${d.periodLabel}`}
          </p>
        </div>

        <div className={styles.headerBadge}>
          <span>Movimientos</span>
          <strong>{d.current.transactionCount.toLocaleString('es-BO')}</strong>
        </div>
      </header>

      <div className={styles.stack}>
        <PeriodControls
          period={d.period}
          setPeriod={d.setPeriod}
          customStart={d.customStart}
          customEnd={d.customEnd}
          setCustomStart={d.setCustomStart}
          setCustomEnd={d.setCustomEnd}
        />

        <OverviewCards current={d.current} previous={d.previous} />

        <DestinationPanel current={d.current} />

        <TrendChart trend={d.trend} />

        <BehaviorPanel
          behavior={d.behavior}
          concentration={d.concentration}
        />

        <CategoryBreakdown
          byGroup={d.byGroup}
          byCategory={d.byCategory}
          totalExp={d.totalExp}
          activeGroup={d.activeGroup}
          setActiveGroup={d.setActiveGroup}
          expenses={d.expenses}
        />

        <TopExpenses expenses={d.expenses} />

        <DiagnosticPanel
          signals={d.signals}
          unknownCount={d.unknownCount}
          transferCount={d.transferCount}
        />
      </div>
    </main>
  );
}