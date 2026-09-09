import {
  Download,
  FileJson,
  RefreshCw,
} from 'lucide-react';

import { formatDate } from '../utils/portfolioFormatters';

export default function PortfolioHeader({
  profile = 'moderado',
  generatedAt,
  bobRate,
  onCopy,
  onDownload,
  copied,

  onRefreshQuotes,
  refreshingQuotes = false,
  quoteMessage = '',
  quoteError = '',
}) {
  return (
    <header className="portfolio-header">
      <div>
        <span className="portfolio-eyebrow">
          Análisis automático
        </span>

        <h1 className="portfolio-title">
          Dashboard · Portafolio invertible
        </h1>

        <p className="portfolio-subtitle">
          {formatDate(generatedAt)} · {profile}
        </p>

        {quoteMessage && !quoteError && (
          <p className="portfolio-quote-status">
            {quoteMessage}
          </p>
        )}

        {quoteError && (
          <p className="portfolio-quote-error">
            {quoteError}
          </p>
        )}
      </div>

      <div className="portfolio-header-actions">
        <span className="portfolio-rate-pill">
          <span className="portfolio-rate-dot" />

          {bobRate
            ? `Bs ${Number(bobRate).toFixed(2)}`
            : 'TC n/d'}
        </span>

        <button
          type="button"
          className="portfolio-action-button"
          onClick={onRefreshQuotes}
          disabled={
            refreshingQuotes ||
            typeof onRefreshQuotes !== 'function'
          }
          title="Actualizar cotizaciones de mercado"
        >
          <RefreshCw
            size={14}
            className={
              refreshingQuotes
                ? 'portfolio-spin'
                : ''
            }
          />

          {refreshingQuotes
            ? 'Actualizando…'
            : 'Precios'}
        </button>

        <button
          type="button"
          className="portfolio-action-button"
          onClick={onCopy}
        >
          <FileJson size={14} />
          {copied ? 'Copiado' : 'JSON'}
        </button>

        <button
          type="button"
          className="portfolio-action-button"
          onClick={onDownload}
        >
          <Download size={14} />
          Descargar
        </button>
      </div>
    </header>
  );
}