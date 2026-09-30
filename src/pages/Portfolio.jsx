import { useState } from 'react';

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
import PortfolioPerformance from '../features/portfolio/components/PortfolioPerformance';

import { refreshBinanceSnapshot } from '../lib/binanceSnapshotClient';
import { refreshBybitSnapshot } from '../lib/bybitSnapshotClient';

import '../features/portfolio/styles/portfolio.css';

// Flag: activa Bybit solo cuando esté configurado en backend
const HAS_BYBIT =
  import.meta.env.VITE_HAS_BYBIT === 'true';

export default function Portfolio() {
  const {
    loading,
    todayPortfolioAnalysis,
    todayPortfolioV3,
    refreshMarketQuotes,
    refreshAll,
    manualAssets,
    cryptoAssets,
  } = useApp();

  const [investorProfile, setInvestorProfile] =
    useState('moderado');

  const portfolio = usePortfolioData({
    loading,
    todayPortfolioAnalysis,
    todayPortfolioV3,
    manualAssets,
    investorProfile,
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
    refreshBybitSnapshot: HAS_BYBIT
      ? refreshBybitSnapshot
      : undefined,
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

      <PortfolioPerformance
        historicalContext={portfolio.historicalContext}
      />

      <PortfolioHeatmap
        assets={portfolio.assets}
        futuresAssets={portfolio.futuresAssets}
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