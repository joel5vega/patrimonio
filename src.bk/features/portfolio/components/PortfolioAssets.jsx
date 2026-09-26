import { useMemo } from 'react';
import { LockKeyhole } from 'lucide-react';
import { PORTFOLIO_TABS } from '../constants/portfolioTabs';
import PortfolioAssetCard from './PortfolioAssetCard';

export default function PortfolioAssets({ assets = [], activeTab, onTabChange, filters, bobRate }) {
  const visibleAssets = useMemo(() => filters?.filteredAssets || assets, [filters?.filteredAssets, assets]);

  return (
    <section className="portfolio-card portfolio-assets-section">
      <div className="portfolio-section-head">
        <div>
          <span className="portfolio-eyebrow">Activos</span>
          <h2 className="portfolio-section-title">Detalle invertible</h2>
        </div>
        <LockKeyhole size={17} className="portfolio-section-icon" />
      </div>

      <div className="portfolio-tabs">
        {PORTFOLIO_TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="portfolio-assets-list">
        {visibleAssets.length ? visibleAssets.map((asset) => (
          <PortfolioAssetCard key={asset.id} asset={asset} bobRate={bobRate} />
        )) : (
          <p className="portfolio-empty-state">Sin activos visibles.</p>
        )}
      </div>
    </section>
  );
}