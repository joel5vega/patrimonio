import { Download, FileJson } from 'lucide-react';
import { formatDate } from '../utils/portfolioFormatters';

export default function PortfolioHeader({ profile = 'moderado', generatedAt, bobRate, onCopy, onDownload, copied }) {
  return (
    <header className="portfolio-header">
      <div>
        <span className="portfolio-eyebrow">Análisis automático</span>
        <h1 className="portfolio-title">Dashboard · Portafolio invertible</h1>
        <p className="portfolio-subtitle">
          {formatDate(generatedAt)} · {profile}
        </p>
      </div>

      <div className="portfolio-header-actions">
        <span className="portfolio-rate-pill">
          <span className="portfolio-rate-dot" />
          {bobRate ? `Bs ${Number(bobRate).toFixed(2)}` : 'TC n/d'}
        </span>

        <button type="button" className="portfolio-action-button" onClick={onCopy}>
          <FileJson size={14} />
          {copied ? 'Copiado' : 'JSON'}
        </button>

        <button type="button" className="portfolio-action-button" onClick={onDownload}>
          <Download size={14} />
          Descargar
        </button>
      </div>
    </header>
  );
}