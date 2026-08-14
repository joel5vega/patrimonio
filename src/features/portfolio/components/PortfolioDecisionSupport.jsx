import { AlertTriangle, CheckCircle2, CircleAlert, ListChecks } from 'lucide-react';
import { STATUS_COLORS } from '../constants/portfolioColors';
import { formatUSD } from '../utils/portfolioFormatters';

const iconFor = (severity) => {
  if (severity === 'critical') return CircleAlert;
  if (severity === 'warning') return AlertTriangle;
  return CheckCircle2;
};

export default function PortfolioDecisionSupport({ decisionSupport }) {
  const alerts = decisionSupport?.alerts?.items || [];
  const recommendations = [
    ...(decisionSupport?.recommendations?.monthly || []).map((item) => ({ ...item, source: 'mensual' })),
    ...(decisionSupport?.recommendations?.lumpSum || []).map((item) => ({ ...item, source: 'capital disponible' })),
  ];

  return (
    <section className="portfolio-card portfolio-decisions">
      <div className="portfolio-section-head">
        <div>
          <span className="portfolio-eyebrow">Decisiones</span>
          <h2 className="portfolio-section-title">Alertas y acciones</h2>
        </div>
        <ListChecks size={18} className="portfolio-section-icon" />
      </div>

      <div className="portfolio-decision-content">
        {alerts.length > 0 ? (
          <div className="portfolio-alert-list">
            {alerts.map((alert) => {
              const Icon = iconFor(alert.severity);
              return (
                <article className={`portfolio-alert ${alert.severity}`} key={alert.key}>
                  <Icon size={16} style={{ color: STATUS_COLORS[alert.severity] }} />
                  <div>
                    <strong>{alert.title}</strong>
                    <small>{alert.category}</small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="portfolio-empty-state">
            <CheckCircle2 size={16} /> Todo en orden.
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="portfolio-recommendation-list">
            <span className="portfolio-subsection-label">Recomendaciones</span>
            {recommendations.map((item, index) => (
              <article className="portfolio-recommendation" key={`${item.asset}-${index}`}>
                <div>
                  <strong>{item.action} · {item.asset}</strong>
                  <small>{item.reason || item.source}</small>
                </div>
                <b>{formatUSD(item.amountUSD)}</b>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}