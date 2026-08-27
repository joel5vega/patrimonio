import { useApp } from "../context/AppContext";

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export default function BackendPortfolioSummary() {
  const {
    todayPortfolioAnalysis: analysis,
    todayPortfolioMeta: meta,
  } = useApp();

  if (!analysis) {
    return (
      <section>
        <h2>Análisis de portafolio</h2>
        <p>
          Aún no hay un análisis procesado por el backend.
        </p>
      </section>
    );
  }

  if (analysis.status !== "ready") {
    return (
      <section>
        <h2>Análisis de portafolio</h2>
        <p>
          Estado: {analysis.status}
        </p>
      </section>
    );
  }

  const portfolio = analysis.portfolioV3 ?? {};
  const totals = portfolio.totals ?? {};
  const byRole = portfolio.portfolio?.byRole ?? {};
  const alerts = portfolio.alerts ?? [];

  return (
    <section>
      <header>
        <p>Última actualización: {meta?.date} {meta?.time}</p>
        <h2>Portafolio</h2>
      </header>

      <div>
        <article>
          <small>Total financiero</small>
          <strong>
            {formatUSD(totals.totalUSD)}
          </strong>
        </article>

        <article>
          <small>Invertible</small>
          <strong>
            {formatUSD(totals.investableUSD)}
          </strong>
        </article>

        <article>
          <small>Reserva</small>
          <strong>
            {formatUSD(totals.reserveUSD)}
          </strong>
        </article>
      </div>

      <h3>Distribución por rol</h3>

      {Object.entries(byRole).map(
        ([role, percentage]) => (
          <div key={role}>
            <span>{role}</span>
            <strong>
              {formatPercent(percentage)}
            </strong>
          </div>
        ),
      )}

      {alerts.length > 0 && (
        <>
          <h3>Alertas</h3>

          {alerts.map((alert, index) => (
            <p key={`${alert.code}-${index}`}>
              {alert.message ?? alert.title ?? alert.code}
            </p>
          ))}
        </>
      )}
    </section>
  );
}