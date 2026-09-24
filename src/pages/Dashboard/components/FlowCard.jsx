// src/pages/Dashboard/components/FlowCard.jsx
import { Calendar } from 'lucide-react';

const QuickMetric = ({ label, value, sub, color = 'var(--color-brand-teal)' }) => (
  <div className="db-quick-metric">
    <p className="db-quick-label">{label}</p>
    <p className="db-quick-value" style={{ color }}>{value}</p>
    {sub && <p className="db-quick-sub">{sub}</p>}
  </div>
);

export default function FlowCard({ timeFilter, totalIncome, totalExpense, balance }) {
  const total = totalIncome + totalExpense;

  return (
    <div className="db-flow-card">
      <p className="db-flow-title">
        <Calendar size={13} />
        Flujo — {timeFilter === 'today' ? 'Hoy' : 'Histórico'}
      </p>
      <div className="db-flow-row">
        <QuickMetric
          label="Ingresos"
          value={`Bs ${totalIncome.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
          color="var(--color-success-light)"
        />
        <div className="db-flow-divider" />
        <QuickMetric
          label="Egresos"
          value={`Bs ${totalExpense.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
          color="var(--color-danger-light)"
        />
        <div className="db-flow-divider" />
        <QuickMetric
          label="Balance"
          value={`Bs ${Math.abs(balance).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
          sub={balance >= 0 ? 'positivo' : 'negativo'}
          color={balance >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)'}
        />
      </div>
      {total > 0 && (
        <div className="db-flow-bar-wrap">
          <div className="db-flow-bar">
            <div className="db-flow-bar-income" style={{ width: `${(totalIncome / total) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
