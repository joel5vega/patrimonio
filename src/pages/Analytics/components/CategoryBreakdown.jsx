import { useMemo } from 'react';
import { TX_GROUPS } from '../../../hooks/useTransactions';
import { GROUP_HEX } from '../../../features/transactions/constants/groupPalette';
import styles from '../Analytics.module.css';

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

function labelFor(key) {
  return TX_GROUPS?.find((group) => group.value === key)?.label || key;
}

export default function CategoryBreakdown({
  byGroup,
  byCategory,
  totalExp,
  activeGroup,
  setActiveGroup,
}) {
  const visibleGroups = useMemo(() => {
    if (byGroup.length <= 6) return byGroup;
    const top = byGroup.slice(0, 5);
    const rest = byGroup.slice(5).reduce(
      (acc, item) => ({ key: 'otros_agrupados', total: acc.total + item.total, count: acc.count + item.count }),
      { key: 'otros_agrupados', total: 0, count: 0 },
    );
    return [...top, rest];
  }, [byGroup]);

  const topTotal = visibleGroups.reduce((s, item) => s + item.total, 0) || 1;
  const gradient = useMemo(() => {
    let cursor = 0;
    return visibleGroups
      .map((item) => {
        const next = cursor + (item.total / topTotal) * 360;
        const color = item.key === 'otros_agrupados'
          ? 'rgba(255,255,255,0.18)'
          : GROUP_HEX[item.key] || '#5e5d59';
        const part = `${color} ${cursor}deg ${next}deg`;
        cursor = next;
        return part;
      })
      .join(', ');
  }, [visibleGroups, topTotal]);

  const activeCategories = activeGroup
    ? byCategory.filter((item) => item.parent === activeGroup)
    : [];

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Estructura del gasto</h2>
          <p className={styles.sectionHint}>Top 5 grupos + resto · pulsa un grupo para ver categorías</p>
        </div>
        {activeGroup && (
          <button className={styles.clearButton} onClick={() => setActiveGroup(null)}>
            Ver todo
          </button>
        )}
      </div>

      {byGroup.length === 0 ? (
        <div className={styles.emptyState}>Sin gastos de consumo registrados.</div>
      ) : (
        <div className={styles.categoryLayout}>
          <div className={styles.donut} style={{ background: `conic-gradient(${gradient})` }}>
            <div className={styles.donutHole}>
              <span>Gasto</span>
              <strong>{money(totalExp)}</strong>
            </div>
          </div>

          <div className={styles.groupList}>
            {visibleGroups.map((item) => {
              const active = activeGroup === item.key;
              const pct = totalExp > 0 ? (item.total / totalExp) * 100 : 0;
              return (
                <button
                  key={item.key}
                  className={`${styles.groupItem} ${active ? styles.groupItemActive : ''}`}
                  onClick={() => item.key !== 'otros_agrupados' && setActiveGroup(active ? null : item.key)}
                  disabled={item.key === 'otros_agrupados'}
                >
                  <span
                    className={styles.groupDot}
                    style={{ background: item.key === 'otros_agrupados' ? 'rgba(255,255,255,.25)' : GROUP_HEX[item.key] || '#5e5d59' }}
                  />
                  <span className={styles.groupName}>{item.key === 'otros_agrupados' ? 'Otros' : labelFor(item.key)}</span>
                  <span className={styles.groupPct}>{pct.toFixed(0)}%</span>
                  <strong>{money(item.total)}</strong>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeGroup && activeCategories.length > 0 && (
        <div className={styles.categoryDetails}>
          <p className={styles.subsectionLabel}>{labelFor(activeGroup)}</p>
          {activeCategories.map((item) => {
            const pct = byGroup.find((g) => g.key === activeGroup)?.total
              ? (item.total / byGroup.find((g) => g.key === activeGroup).total) * 100
              : 0;
            return (
              <div key={item.key} className={styles.categoryDetailRow}>
                <span>{item.emoji} {item.label}</span>
                <div className={styles.categoryDetailBar}>
                  <div style={{ width: `${pct}%`, background: GROUP_HEX[activeGroup] || '#5e5d59' }} />
                </div>
                <small>{pct.toFixed(0)}%</small>
                <strong>{money(item.total)}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
