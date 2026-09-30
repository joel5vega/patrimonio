import { Calendar, X } from 'lucide-react';
import { PERIODS } from '../useAnalyticsData';
import { fmtDate, toInputDate } from '../dateHelpers';
import styles from '../Analytics.module.css';

export default function PeriodControls({
  period,
  setPeriod,
  customStart,
  customEnd,
  setCustomStart,
  setCustomEnd,
}) {
  const applyPreset = (value) => {
    const now = new Date();

    if (value === 'current') {
      setCustomStart(new Date(now.getFullYear(), now.getMonth(), 1));
      setCustomEnd(now);
    }
    if (value === 'previous') {
      setCustomStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      setCustomEnd(new Date(now.getFullYear(), now.getMonth(), 0));
    }
    if (value === 'year') {
      setCustomStart(new Date(now.getFullYear(), 0, 1));
      setCustomEnd(now);
    }
    setPeriod('custom');
  };

  return (
    <section className={styles.controls}>
      <div className={styles.periodButtons}>
        {PERIODS.map((item) => (
          <button
            key={item.value}
            className={period === item.value ? styles.periodActive : styles.periodButton}
            onClick={() => setPeriod(item.value)}
          >
            {item.value === 'custom' && <Calendar size={12} />}
            {item.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className={styles.customPanel}>
          <div className={styles.customHeader}>
            <span><Calendar size={13} /> Rango personalizado</span>
            <button onClick={() => { setCustomStart(null); setCustomEnd(null); setPeriod('1m'); }} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>

          <div className={styles.dateGrid}>
            <label>
              Desde
              <input
                type="date"
                value={toInputDate(customStart)}
                max={toInputDate(customEnd || new Date())}
                onChange={(e) => setCustomStart(e.target.value ? new Date(`${e.target.value}T00:00:00`) : null)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={toInputDate(customEnd)}
                min={toInputDate(customStart)}
                max={toInputDate(new Date())}
                onChange={(e) => setCustomEnd(e.target.value ? new Date(`${e.target.value}T23:59:59`) : null)}
              />
            </label>
          </div>

          <div className={styles.presets}>
            <button onClick={() => applyPreset('current')}>Este mes</button>
            <button onClick={() => applyPreset('previous')}>Mes pasado</button>
            <button onClick={() => applyPreset('year')}>Este año</button>
          </div>

          {customStart && customEnd && (
            <p className={styles.rangeSummary}>{fmtDate(customStart)} → {fmtDate(customEnd)}</p>
          )}
        </div>
      )}
    </section>
  );
}
