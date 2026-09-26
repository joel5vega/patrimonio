// src/pages/Dashboard/components/ActivityList.jsx
import { forwardRef } from 'react';
import { Calendar, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../../../ui/SectionHeader';

const TransactionItem = ({ type, concept, title, dateLabel, amount, currency }) => {
  const isIncome = type === 'income';
  return (
    <div className={`db-tx-item ${isIncome ? 'db-tx-item--income' : 'db-tx-item--expense'}`}>
      <div className="db-tx-icon">
        {isIncome ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownRight size={16} strokeWidth={2.5} />}
      </div>
      <div className="db-tx-info">
        <p className="db-tx-concept">{concept || title || 'Transacción'}</p>
        <p className="db-tx-date">{dateLabel || '—'}</p>
      </div>
      <p className={`db-tx-amount ${isIncome ? 'db-tx-amount--income' : 'db-tx-amount--expense'}`}>
        {isIncome ? '+' : '-'}{currency === 'USD' ? '$' : 'Bs '}
        {Number(Math.abs(amount || 0)).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
};

const ActivityList = forwardRef(function ActivityList(
  { timeFilter, setTimeFilter, recent, transactionsCount },
  ref,
) {
  const navigate = useNavigate();

  return (
    <>
      <div className="db-filter-bar">
        <button
          className={`db-filter-btn ${timeFilter === 'today' ? 'db-filter-btn--active' : ''}`}
          onClick={() => setTimeFilter('today')}
        >
          <Calendar size={13} strokeWidth={2.5} /> Hoy
        </button>
        <button
          className={`db-filter-btn ${timeFilter === 'history' ? 'db-filter-btn--active' : ''}`}
          onClick={() => setTimeFilter('history')}
        >
          <History size={13} strokeWidth={2.5} /> Histórico
        </button>
      </div>

      <div className="db-section">
        <SectionHeader
          title="Actividad Reciente"
          action="Ver todo"
          onAction={() => navigate('/transactions')}
        />
        <div ref={ref} className="db-tx-list">
          {recent.length === 0 ? (
            <div className="db-empty">
              {timeFilter === 'today' ? 'Sin actividad hoy' : 'Sin actividad reciente'}
              {timeFilter === 'today' && transactionsCount > 0 && (
                <button className="db-empty-hint" onClick={() => setTimeFilter('history')}>
                  Ver histórico ({transactionsCount} registros)
                </button>
              )}
            </div>
          ) : (
            recent.map((tx) => (
              <TransactionItem
                key={tx.id}
                type={tx.type}
                concept={tx.concept}
                title={tx.title}
                dateLabel={tx.dateLabel}
                amount={tx.amount}
                currency={tx.currency}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
});

export default ActivityList;
