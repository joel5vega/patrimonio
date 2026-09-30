import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TX_GROUPS } from '../../../hooks/useTransactions';
import { GROUP_HEX } from '../../../features/transactions/constants/groupPalette';
import { fmtDate } from '../dateHelpers';
import styles from '../Analytics.module.css';

const money = (v) =>
  `Bs ${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

function labelFor(key) {
  return TX_GROUPS?.find((group) => group.value === key)?.label || key;
}

function txAmount(tx) {
  const value = Number(tx?.__amount ?? tx?.amount ?? 0);
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

function txConcept(tx) {
  return (
    tx?.concept ||
    tx?.title ||
    tx?.note ||
    tx?.description ||
    'Sin concepto'
  );
}

function txDate(tx) {
  return tx?.date || tx?.createdAt || tx?.__date || null;
}

export default function CategoryBreakdown({
  byGroup = [],
  byCategory = [],
  totalExp = 0,
  activeGroup,
  setActiveGroup,
  expenses = [],
}) {
  const [activeCategory, setActiveCategory] = useState(null);

  const visibleGroups = useMemo(() => {
    if (byGroup.length <= 6) return byGroup;
    const top = byGroup.slice(0, 5);
    const rest = byGroup.slice(5).reduce(
      (acc, item) => ({
        key: 'otros_agrupados',
        total: acc.total + item.total,
        count: acc.count + (item.count || 0),
      }),
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
        const color =
          item.key === 'otros_agrupados'
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

  const groupTotal =
    byGroup.find((g) => g.key === activeGroup)?.total || totalExp || 1;

  // Transacciones de la categoría abierta (solo consumo del período)
  const categoryTxs = useMemo(() => {
    if (!activeCategory) return [];
    return expenses
      .filter((tx) => (tx.category || 'other') === activeCategory)
      .slice()
      .sort((a, b) => {
        const da = new Date(txDate(a) || 0).getTime();
        const db = new Date(txDate(b) || 0).getTime();
        return db - da;
      });
  }, [expenses, activeCategory]);

  const handleGroupClick = (key) => {
    if (key === 'otros_agrupados') return;
    const next = activeGroup === key ? null : key;
    setActiveGroup(next);
    setActiveCategory(null);
  };

  const handleCategoryClick = (key) => {
    setActiveCategory((current) => (current === key ? null : key));
  };

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Estructura del gasto</h2>
          <p className={styles.sectionHint}>
            Pulsa un grupo → categoría → ver cada movimiento
          </p>
        </div>
        {activeGroup && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setActiveGroup(null);
              setActiveCategory(null);
            }}
          >
            Ver todo
          </button>
        )}
      </div>

      {byGroup.length === 0 ? (
        <div className={styles.emptyState}>Sin gastos de consumo registrados.</div>
      ) : (
        <div className={styles.categoryLayout}>
          <div
            className={styles.donut}
            style={{ background: `conic-gradient(${gradient})` }}
          >
            <div className={styles.donutHole}>
              <span>Gasto</span>
              <strong>{money(totalExp)}</strong>
            </div>
          </div>

          <div className={styles.groupList}>
            {visibleGroups.map((item) => {
              const pct = (item.total / topTotal) * 100;
              const active = activeGroup === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.groupItem} ${
                    active ? styles.groupItemActive : ''
                  }`}
                  onClick={() => handleGroupClick(item.key)}
                  disabled={item.key === 'otros_agrupados'}
                >
                  <span
                    className={styles.groupDot}
                    style={{
                      background:
                        item.key === 'otros_agrupados'
                          ? 'rgba(255,255,255,.25)'
                          : GROUP_HEX[item.key] || '#5e5d59',
                    }}
                  />
                  <span className={styles.groupName}>
                    {item.key === 'otros_agrupados'
                      ? 'Otros'
                      : labelFor(item.key)}
                  </span>
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
            const pct = groupTotal > 0 ? (item.total / groupTotal) * 100 : 0;
            const open = activeCategory === item.key;

            return (
              <div key={item.key} className={styles.categoryBlock}>
                <button
                  type="button"
                  className={`${styles.categoryDetailRow} ${
                    open ? styles.categoryDetailRowOpen : ''
                  }`}
                  onClick={() => handleCategoryClick(item.key)}
                >
                  <span className={styles.categoryDetailLabel}>
                    {open ? (
                      <ChevronDown size={14} className={styles.categoryChevron} />
                    ) : (
                      <ChevronRight size={14} className={styles.categoryChevron} />
                    )}
                    {item.emoji} {item.label}
                    <small className={styles.categoryTxCount}>
                      {item.count != null
                        ? `${item.count} mov.`
                        : ''}
                    </small>
                  </span>
                  <div className={styles.categoryDetailBar}>
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: GROUP_HEX[activeGroup] || '#5e5d59',
                      }}
                    />
                  </div>
                  <small>{pct.toFixed(0)}%</small>
                  <strong>{money(item.total)}</strong>
                </button>

                {open && (
                  <div className={styles.txList}>
                    {categoryTxs.length === 0 ? (
                      <p className={styles.txEmpty}>
                        No hay movimientos en esta categoría para el período.
                      </p>
                    ) : (
                      <>
                        <div className={styles.txListHead}>
                          <span>Concepto</span>
                          <span>Fecha</span>
                          <span>Monto</span>
                        </div>
                        {categoryTxs.map((tx) => (
                          <div
                            key={tx.id || `${txConcept(tx)}-${txDate(tx)}-${txAmount(tx)}`}
                            className={styles.txRow}
                          >
                            <span className={styles.txConcept} title={txConcept(tx)}>
                              {txConcept(tx)}
                            </span>
                            <span className={styles.txDate}>
                              {fmtDate(txDate(tx))}
                            </span>
                            <span className={styles.txAmount}>
                              {money(txAmount(tx))}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}