import { useState,useEffect } from 'react';

import { useApp } from '../context/AppContext';
import { usePortfolioData } from '../features/portfolio/hooks/usePortfolioData';
import { usePortfolioExport } from '../features/portfolio/hooks/usePortfolioExport';
import { usePortfolioQuotes } from '../features/portfolio/hooks/usePortfolioQuotes';

import PortfolioHeader from '../features/portfolio/components/PortfolioHeader';
import PortfolioProfileSelector from '../features/portfolio/components/PortfolioProfileSelector';
import PortfolioHeatmap from '../features/portfolio/components/PortfolioHeatmap';
import PortfolioAllocation from '../features/portfolio/components/PortfolioAllocation';
import PortfolioDecisionSupport from '../features/portfolio/components/PortfolioDecisionSupport';
import PortfolioAssets from '../features/portfolio/components/PortfolioAssets';
import PortfolioSecondaryDetails from '../features/portfolio/components/PortfolioSecondaryDetails';
import PortfolioSectorMap from '../features/portfolio/components/PortfolioSectorMap';
import { refreshBinanceSnapshot } from '../lib/binanceSnapshotClient';
import '../features/portfolio/styles/portfolio.css';

export default function Portfolio() {
  const {
    loading,
    todayPortfolioAnalysis,
    todayPortfolioV3,
    refreshMarketQuotes,
    refreshAll,
    manualAssets,
    cryptoAssets
  } = useApp();

  const [investorProfile, setInvestorProfile] =
    useState('moderado');


  const portfolio = usePortfolioData({
    loading,
    todayPortfolioAnalysis,
    todayPortfolioV3,
    manualAssets,
  });

  const exporter = usePortfolioExport(
    portfolio.aiReport,
  );

  const {
    refreshingQuotes,
    quoteMessage,
    quoteError,
    refreshPortfolioPrices,
  } = usePortfolioQuotes({
    loading,
    refreshMarketQuotes,
    refreshBinanceSnapshot,
    refreshAll,
  });

  if (portfolio.loading) {
    return (
      <main className="portfolio-page">
        <div className="portfolio-loading">
          Cargando análisis…
        </div>
      </main>
    );
  }

  return (
    <main className="portfolio-page">
      <PortfolioHeader
        profile={investorProfile}
        generatedAt={portfolio.generatedAt}
        bobRate={portfolio.bobRate}
        onCopy={exporter.copy}
        onDownload={exporter.download}
        copied={exporter.copied}
        onRefreshQuotes={refreshPortfolioPrices}
        refreshingQuotes={refreshingQuotes}
        quoteMessage={quoteMessage}
        quoteError={quoteError}
      />

      <PortfolioHeatmap
        assets={portfolio.heatmapAssets}
        bobRate={portfolio.bobRate}
      />

      <PortfolioProfileSelector
        value={investorProfile}
        onChange={setInvestorProfile}
      />

      <PortfolioAllocation
        allocation={portfolio.allocation}
        targets={portfolio.targets}
      />

      <PortfolioSectorMap
        sectorAnalysis={portfolio.sectorAnalysis}
      />

      <PortfolioDecisionSupport
        decisionSupport={portfolio.decisionSupport}
      />

      <PortfolioAssets
        assets={portfolio.heatmapAssets}
        filters={portfolio.filters}
        activeTab={portfolio.filters.activeTab}
        onTabChange={portfolio.filters.setActiveTab}
        bobRate={portfolio.bobRate}
      />

      <PortfolioSecondaryDetails
        reserves={portfolio.reserves}
        patrimony={portfolio.patrimony}
        exposureBySource={portfolio.exposureBySource}
      />
    </main>
  );
}