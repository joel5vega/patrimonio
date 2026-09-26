import { Activity, CheckCircle2, Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatPct, formatUSD } from '../utils/portfolioFormatters';

function Metric({ label, value, sub, tone = '' }) {
  return (
    <article className={`portfolio-summary-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

export default function PortfolioSummary({ summary, risk }) {
  return (
    <section className="portfolio-card portfolio-summary">
      <div className="portfolio-section-head">
        <div>
          <span className="portfolio-eyebrow">Estado</span>
          <h2 className="portfolio-section-title">Resumen</h2>
        </div>
        <Activity size={18} className="portfolio-section-icon" />
      </div>

      <div className="portfolio-summary-grid">
        <Metric label="Patrimonio" value={formatUSD(summary?.totalNetWorthUSD)} sub={`${formatPct(summary?.physicalPatrimonyPctOfNetWorth)} físico`} />
        <Metric label="Invertible" value={formatUSD(summary?.investableAssetsUSD)} sub={`${formatPct(summary?.investablePctOfNetWorth)} del total`} tone="positive" />
        <Metric label="Reservas" value={formatUSD(summary?.reservesUSD)} sub={`${formatPct(summary?.reservesPctOfFinancialAssets)} de finanzas`} tone="reserve" />
        <Metric label="Riesgo" value={risk?.portfolioRisk == null ? '—' : Number(risk.portfolioRisk).toFixed(2)} sub="1–5" tone="risk" />
        <Metric label="Retorno" value={risk?.expectedReturnPct == null ? '—' : formatPct(risk.expectedReturnPct)} sub="estimado" tone="yield" />
      </div>

      <div className="portfolio-summary-note">
        <CheckCircle2 size={14} />
        Resumen compacto. El detalle está en rebalanceo, heat map y activos.
      </div>
    </section>
  );
}