import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { animate, stagger } from "animejs";
import { useApp } from "../context/AppContext";
import "./WealthHistory.css";
import {
  FIXED_TYPES,
  PERIODS,
  ROLE_TYPES,
  SPECIAL_TODO
} from "./wealth-history/wealthHistory.constants";
import {
  buildSeries,
  classifyManualField,
  computeRolesFromRow,
  formatCompact,
  formatUSD,
  getManualTypes,
  hasBobRate,
  sortHistory
} from "./wealth-history/wealthHistory.helpers";
import {
  PeriodSelector,
  SeriesControls,
  ViewModeSelector
} from "./wealth-history/components/WealthHistoryControls";
import WealthHistoryChart from "./wealth-history/components/WealthHistoryChart";
import WealthHistoryComposition from "./wealth-history/components/WealthHistoryComposition";

export default function WealthHistory() {
  const {
    chartHistory = [],
    totalCryptoUSD = 0,
    totalInversionUSD = 0,
    manualAssets = [],
    loading,
    bobRate
  } = useApp();
  const bobRateAvailable = hasBobRate(bobRate);
  const headerRef = useRef(null);
  const controlRef = useRef(null);
  const [mode, setMode] = useState("summary");
  const [period, setPeriod] = useState("1M");
  const [hover, setHover] = useState(null);
  const [visible, setVisible] = useState({ total: true,todo_full:false });
  const manualTypes = useMemo(
    () => getManualTypes(manualAssets, bobRate),
    [manualAssets, bobRate]
  );
  const roles = useMemo(
    () =>
      manualTypes.reduce(
        (result, item) => {
          result[classifyManualField(item.field.replace("manual_", ""))] +=
            item.valueUSD;
          return result;
        },
        { trading: 0, yield: 0, reserve: 0, patrimony: 0 }
      ),
    [manualTypes]
  );
  const ahorroBs = manualTypes.find((item) => item.isAhorroBs)?.valueUSD || 0;
  const total =
    totalCryptoUSD +
    totalInversionUSD +
    manualTypes
      .filter(
        (item) =>
          !item.isAhorroBs &&
          classifyManualField(item.field.replace("manual_", "")) !== "patrimony"
      )
      .reduce((sum, item) => sum + item.valueUSD, 0);
  const displayTotal = total + ahorroBs;
  const financialTotalUSD = total;
const fullNetWorthUSD =
  financialTotalUSD +
  roles.patrimony;
  const types = useMemo(
    () => [SPECIAL_TODO, ...FIXED_TYPES, ...ROLE_TYPES, ...manualTypes],
    [manualTypes]
  );
  const values = useMemo(
    () => ({
      todo_full: displayTotal,
      total,
      crypto: totalCryptoUSD,
      etfs: totalInversionUSD,
      role_trading: roles.trading,
      role_yield: roles.yield,
      role_reserve: roles.reserve,
      role_patrimony: roles.patrimony,
      ...Object.fromEntries(
        manualTypes.map((item) => [item.key, item.valueUSD])
      )
    }),
    [displayTotal, total, totalCryptoUSD, totalInversionUSD, roles, manualTypes]
  );
  const seriesMap = useMemo(
    () =>
      buildSeries({
        history: chartHistory,
        days: PERIODS.find((item) => item.key === period)?.days || 30,
        manualTypes,
        bobRate
      }),
    [chartHistory, period, manualTypes, bobRate]
  );
  const activeSeries = types
    .filter((item) => visible[item.key])
    .map((item) => ({ ...item, data: seriesMap[item.key] || [] }))
    .filter((item) => item.data.length);
  const primary = activeSeries[0];
  const compositionRows = [
    {
      label: "Crypto",
      key: "crypto",
      valueUSD: totalCryptoUSD,
      color: "#f97316"
    },
    {
      label: "ETFs",
      key: "etfs",
      valueUSD: totalInversionUSD,
      color: "#3b82f6"
    },
    {
      label: "Reservas",
      key: "role_reserve",
      valueUSD: roles.reserve,
      color: "#facc15"
    },
    {
      label: "Yield",
      key: "role_yield",
      valueUSD: roles.yield,
      color: "#a855f7"
    },
    {
      label: "Trading",
      key: "role_trading",
      valueUSD: roles.trading,
      color: "#ec4899"
    }
  ];
  const previous = useMemo(() => {
    const row = sortHistory(chartHistory).at(-2);
    if (!row) return null;
    const computed = computeRolesFromRow(row, bobRate);
    return {
      total: Math.max(
        0,
        Number(row.totalPortfolioUSD || 0) - computed.patrimony
      ),
      crypto: row.cryptoUSD || 0,
      etfs: row.inversionUSD || 0,
      role_reserve: computed.reserve,
      role_yield: computed.yield,
      role_trading: computed.trading
    };
  }, [chartHistory, bobRate]);
  const delta = primary
    ? (primary.data.at(-1)?.v || 0) - (primary.data[0]?.v || 0)
    : 0;
  const liquidity = total ? ((roles.reserve + ahorroBs) / total) * 100 : 0;
  const status =
    liquidity >= 20
      ? { label: "Liquidez saludable", tone: "good", icon: CheckCircle2 }
      : {
          label: "Liquidez por debajo del objetivo",
          tone: "warning",
          icon: AlertTriangle
        };
  const StatusIcon = status.icon;
  useEffect(() => {
    if (headerRef.current)
      animate(headerRef.current, {
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 450
      });
    if (controlRef.current)
      animate(controlRef.current.querySelectorAll("button"), {
        opacity: [0, 1],
        translateY: [5, 0],
        delay: stagger(25),
        duration: 250
      });
  }, [loading]);
  const toggle = (key) =>
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  if (loading)
    return (
      <div className="wh-loading">
        <div className="wh-spinner" />
      </div>
    );
  const value =
    hover && primary?.data[hover.index]
      ? primary.data[hover.index].v
      : displayTotal;
  return (
    <main className="wh-page">
      <header ref={headerRef} className="wh-header">
        <div>
          <p className="wh-kicker">Panel financiero</p>
          <h1 className="wh-title">Patrimonio financiero</h1>
          <p className="wh-subtitle">
            El total excluye activos clasificados como patrimonio físico.
          </p>
        </div>
        <ViewModeSelector mode={mode} onChange={setMode} />
      </header>
      <section className="wh-top-grid">
        <section className="wh-hero">
          <div className="wh-hero-glow" />
          <p className="wh-hero-eyebrow">Total financiero</p>
          <p className="wh-hero-value">
            {formatUSD(value)} <span>USD</span>
          </p>
          <p className="wh-hero-bs">
            {bobRateAvailable
              ? `Bs ${(value * bobRate).toLocaleString("es-BO", { maximumFractionDigits: 0 })}`
              : "TC no disponible"}
          </p>
          {bobRateAvailable && (
            <p className="wh-hero-rate">
              TC: Bs {Number(bobRate).toFixed(2)} / USD
            </p>
          )}
          <div className={`wh-hero-delta ${delta >= 0 ? "is-up" : "is-down"}`}>
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {formatUSD(delta)} en el período
          </div>
          <div className="wh-hero-stats">
            <div>
              <small>Crypto</small>
              <strong>{formatCompact(totalCryptoUSD)}</strong>
            </div>
            <div>
              <small>ETFs</small>
              <strong>{formatCompact(totalInversionUSD)}</strong>
            </div>
            <div>
              <small>Liquidez</small>
              <strong>{liquidity.toFixed(1)}%</strong>
            </div>
          </div>
        </section>
        <section className="wh-chart-card">
          <PeriodSelector
            periods={PERIODS}
            selected={period}
            onChange={setPeriod}
          />
          {mode === "allocation" ? (
            <WealthHistoryComposition rows={compositionRows} total={total} />
          ) : (
            <>
              {activeSeries.length ? (
                <>
                  <div className="wh-chart-legend">
                    {activeSeries.map((item) => (
                      <span key={item.key}>
                        <i style={{ background: item.color }} />
                        {item.label} {formatCompact(item.data.at(-1)?.v)}
                      </span>
                    ))}
                  </div>
                  <WealthHistoryChart
                    series={activeSeries}
                    onHoverChange={setHover}
                  />
                </>
              ) : (
                <div className="wh-chart-empty">
                  <Activity size={28} />
                  <p>Selecciona una serie para comenzar</p>
                </div>
              )}
            </>
          )}
        </section>
      </section>
      <section ref={controlRef}>
        <SeriesControls
          types={types}
          values={values}
          visible={visible}
          onToggle={toggle}
        />
      </section>
      <section className="wh-analysis-grid">
        <article className={`wh-analysis-card ${status.tone}`}>
          <StatusIcon size={18} />
          <div>
            <p className="wh-section-label">Estado</p>
            <strong>{status.label}</strong>
            <small>
              Reserva y ahorro disponibles:{" "}
              {formatUSD(roles.reserve + ahorroBs)}
            </small>
          </div>
        </article>
        <article className="wh-analysis-card">
          <Activity size={18} />
          <div>
            <p className="wh-section-label">Lectura rápida</p>
            <strong>
              {compositionRows.sort((a, b) => b.valueUSD - a.valueUSD)[0]
                ?.label || "Sin datos"}{" "}
              lidera la composición
            </strong>
            <small>
              Período seleccionado:{" "}
              {PERIODS.find((item) => item.key === period)?.label}
            </small>
          </div>
        </article>
      </section>
    </main>
  );
}
