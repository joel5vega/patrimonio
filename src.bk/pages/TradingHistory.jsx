import {useMemo, useState} from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Filter,
  Medal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {useQuantfury} from '../hooks/useQuantfury';
import './TradingHistory.css';

function formatUsd(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatNumber(value, decimals = 2) {
  const number = Number(value || 0);

  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pnlClass(value) {
  const pnl = Number(value || 0);

  if (pnl > 0) return 'positive';
  if (pnl < 0) return 'negative';

  return 'neutral';
}

function PnlValue({value}) {
  if (value === null || value === undefined) {
    return <span className="trading-pnl neutral">—</span>;
  }

  const pnl = Number(value);

  return (
    <span className={`trading-pnl ${pnlClass(pnl)}`}>
      {pnl > 0 ? '+' : ''}
      {formatUsd(pnl)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = 'default',
}) {
  return (
    <article className={`trading-metric trading-metric--${tone}`}>
      <span>{label}</span>

      <strong>{value}</strong>

      {helper && <small>{helper}</small>}
    </article>
  );
}

function SummaryPanel({analytics}) {
  const isPositive = Number(analytics.realizedPnl || 0) >= 0;

  return (
    <section className="trading-summary">
      <div className="trading-summary__headline">
        <div>
          <p className="trading-page__eyebrow">
            Quantfury · Histórico
          </p>

          <h1>Historial de trading</h1>

          <p>
            Métricas calculadas por el backend a partir de
            los informes PDF importados.
          </p>
        </div>

        <div
          className={`trading-summary__pnl ${
            isPositive
              ? 'positive'
              : 'negative'
          }`}
        >
          <span>P/L realizado</span>

          <strong>
            {Number(analytics.realizedPnl || 0) > 0
              ? '+'
              : ''}
            {formatUsd(analytics.realizedPnl)}
          </strong>

          <small>
            {analytics.equityReal > 0
              ? `${formatNumber(
                Number(analytics.realizedPnl || 0) /
                  analytics.equityReal *
                  100,
                2,
              )}% sobre equity reportado`
              : 'Sin equity de referencia'}
          </small>
        </div>
      </div>

      <div className="trading-metrics-grid">
        <MetricCard
          label="Operaciones"
          value={formatNumber(analytics.historyRows, 0)}
          helper="Filas históricas procesadas"
        />

        <MetricCard
          label="Cierres"
          value={formatNumber(
            analytics.closing_legs ||
            analytics.closingLegs ||
            0,
            0,
          )}
          helper="Reducciones y cierres"
        />

        <MetricCard
          label="Tasa de acierto"
          value={
            analytics.winRate === null ||
            analytics.winRate === undefined
              ? '—'
              : `${formatNumber(analytics.winRate)}%`
          }
          helper="Cierres positivos / decididos"
          tone={
            Number(analytics.winRate || 0) >= 50
              ? 'positive'
              : 'negative'
          }
        />

        <MetricCard
          label="Profit factor"
          value={
            analytics.profitFactor === null ||
            analytics.profitFactor === undefined
              ? '—'
              : formatNumber(analytics.profitFactor, 2)
          }
          helper="Ganancia bruta / pérdida bruta"
          tone={
            Number(analytics.profitFactor || 0) >= 1
              ? 'positive'
              : 'negative'
          }
        />

        <MetricCard
          label="Ganancia bruta"
          value={formatUsd(
            analytics.gross_profit ??
            analytics.grossProfit ??
            0,
          )}
        />

        <MetricCard
          label="Pérdida bruta"
          value={formatUsd(
            analytics.gross_loss ??
            analytics.grossLoss ??
            0,
          )}
          tone="negative"
        />

        <MetricCard
          label="Nocional operado"
          value={formatUsd(
            analytics.total_notional_usd ??
            analytics.totalNotionalUsd ??
            0,
          )}
        />

        <MetricCard
          label="Posiciones actuales"
          value={formatNumber(
            analytics.openPositionsCount,
            0,
          )}
          helper="Snapshot más reciente"
        />
      </div>
    </section>
  );
}

function SymbolTable({items, title, emptyText}) {
  return (
    <section className="trading-card">
      <header className="trading-card__header">
        <h2>{title}</h2>
      </header>

      {!items.length ? (
        <p className="trading-empty-text">{emptyText}</p>
      ) : (
        <div className="trading-table-wrap">
          <table className="trading-table">
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Tipo</th>
                <th>Filas</th>
                <th>Nocional</th>
                <th>P/L</th>
                <th>Win rate</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.symbol}>
                  <td>
                    <strong>{item.symbol}</strong>
                  </td>

                  <td>{item.asset_type || item.assetType || '—'}</td>

                  <td>{item.rows || item.trades || 0}</td>

                  <td>
                    {formatUsd(
                      item.notional_usd ??
                      item.total_notional ??
                      0,
                    )}
                  </td>

                  <td>
                    <PnlValue
                      value={
                        item.realized_pnl ??
                        item.realizedPnl
                      }
                    />
                  </td>

                  <td>
                    {item.win_rate === null ||
                    item.win_rate === undefined
                      ? '—'
                      : `${formatNumber(item.win_rate)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function TradingHistory() {
  const {
    history,
    analytics,
    imports,
    loading,
    error,
  } = useQuantfury();

  const [symbolFilter, setSymbolFilter] = useState('ALL');
  const [assetTypeFilter, setAssetTypeFilter] = useState('ALL');
  const [onlyClosing, setOnlyClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const symbols = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          history
            .map((row) => row.symbol)
            .filter(Boolean),
        ),
      ).sort(),
    ],
    [history],
  );

  const assetTypes = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          history
            .map((row) => row.asset_type)
            .filter(Boolean),
        ),
      ).sort(),
    ],
    [history],
  );

  const filteredHistory = useMemo(
    () => history.filter((row) => {
      if (
        symbolFilter !== 'ALL' &&
        row.symbol !== symbolFilter
      ) {
        return false;
      }

      if (
        assetTypeFilter !== 'ALL' &&
        row.asset_type !== assetTypeFilter
      ) {
        return false;
      }

      if (onlyClosing && !row.is_closing_leg) {
        return false;
      }

      return true;
    }),
    [
      history,
      symbolFilter,
      assetTypeFilter,
      onlyClosing,
    ],
  );

  const topWinners = analytics.topWinnersSymbols ||
    analytics.top_winners_symbols ||
    [];

  const topLosers = analytics.topLosersSymbols ||
    analytics.top_losers_symbols ||
    [];

  const bySymbol = analytics.bySymbol ||
    analytics.by_symbol ||
    [];

  if (loading) {
    return (
      <main className="trading-page">
        <p>Cargando historial Quantfury…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="trading-page">
        <h1>Historial de trading</h1>

        <p
          className="trading-error"
          role="alert"
        >
          No se pudo cargar Quantfury: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="trading-page">
      <SummaryPanel analytics={analytics} />

      <section className="trading-card">
        <header className="trading-card__header">
          <div>
            <h2>Operaciones importadas</h2>

            <p>
              Mostrando {filteredHistory.length} de{' '}
              {history.length} filas cargadas.
            </p>
          </div>

          <button
            type="button"
            className="trading-toggle-button"
            onClick={() => {
              setShowDetails((current) => !current);
            }}
          >
            {showDetails
              ? <ChevronUp size={16} />
              : <ChevronDown size={16} />}

            {showDetails
              ? 'Ocultar tabla'
              : 'Ver tabla'}
          </button>
        </header>

        <div className="trading-filters">
          <label>
            <Filter size={15} />
            Símbolo

            <select
              value={symbolFilter}
              onChange={(event) => {
                setSymbolFilter(event.target.value);
              }}
            >
              {symbols.map((symbol) => (
                <option
                  key={symbol}
                  value={symbol}
                >
                  {symbol === 'ALL'
                    ? 'Todos'
                    : symbol}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo

            <select
              value={assetTypeFilter}
              onChange={(event) => {
                setAssetTypeFilter(event.target.value);
              }}
            >
              {assetTypes.map((assetType) => (
                <option
                  key={assetType}
                  value={assetType}
                >
                  {assetType === 'ALL'
                    ? 'Todos'
                    : assetType}
                </option>
              ))}
            </select>
          </label>

          <label className="trading-checkbox">
            <input
              type="checkbox"
              checked={onlyClosing}
              onChange={(event) => {
                setOnlyClosing(event.target.checked);
              }}
            />

            Solo cierres/reducciones
          </label>
        </div>

        {showDetails && (
          <div className="trading-table-wrap">
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora UTC</th>
                  <th>Símbolo</th>
                  <th>Tipo</th>
                  <th>Operación</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Valor</th>
                  <th>P/L</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>

                    <td>{row.time}</td>

                    <td>
                      <strong>{row.symbol}</strong>
                    </td>

                    <td>{row.asset_type}</td>

                    <td>
                      {row.side} · {row.subaction}
                    </td>

                    <td>
                      {formatNumber(row.price, 4)}
                    </td>

                    <td>
                      {formatNumber(row.quantity, 6)}
                    </td>

                    <td>
                      {formatUsd(row.value_usd)}
                    </td>

                    <td>
                      <PnlValue
                        value={row.realized_pnl}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="trading-insights-grid">
        <SymbolTable
          title="Mejores símbolos"
          items={topWinners}
          emptyText="Aún no hay resultados positivos calculados."
        />

        <SymbolTable
          title="Símbolos con pérdidas"
          items={topLosers}
          emptyText="Aún no hay resultados negativos calculados."
        />
      </section>

      <SymbolTable
        title="Desempeño por símbolo"
        items={bySymbol}
        emptyText="Importa un informe PDF para generar métricas."
      />

      <section className="trading-card">
        <header className="trading-card__header">
          <h2>Importaciones</h2>
        </header>

        {!imports.length ? (
          <p className="trading-empty-text">
            Aún no existen importaciones registradas.
          </p>
        ) : (
          <div className="trading-import-list">
            {imports.map((item) => {
              const summary = item.summary || {};

              return (
                <article
                  className="trading-import-item"
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.file_name ||
                        item.fileName ||
                        item.id}
                    </strong>

                    <small>
                      {item.import_id || item.id}
                    </small>
                  </div>

                  <div>
                    <span>Operaciones</span>

                    <strong>
                      {summary.history_rows ??
                        item.historyCount ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>P/L</span>

                    <PnlValue
                      value={summary.realized_pnl}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}