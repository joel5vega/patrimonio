import { useState } from 'react';

import { useApp } from '../context/AppContext';
import { usePortfolioData } from '../features/portfolio/hooks/usePortfolioData';
import { usePortfolioExport } from '../features/portfolio/hooks/usePortfolioExport';
import { usePortfolioQuotes } from '../features/portfolio/hooks/usePortfolioQuotes';

import PortfolioHeader from '../features/portfolio/components/PortfolioHeader';
import PortfolioHeatmap from '../features/portfolio/components/PortfolioHeatmap';
import PortfolioAllocation from '../features/portfolio/components/PortfolioAllocation';
import PortfolioDecisionSupport from '../features/portfolio/components/PortfolioDecisionSupport';
import PortfolioSectorMap from '../features/portfolio/components/PortfolioSectorMap';
import PortfolioPerformance from '../features/portfolio/components/PortfolioPerformance';

import { refreshBinanceSnapshot } from '../lib/binanceSnapshotClient';
import { refreshBybitSnapshot } from '../lib/bybitSnapshotClient';

import '../features/portfolio/styles/portfolio.css';
import PatrimonioLoader from '../components/PatrimonioLoader';
import { refreshWallbitSnapshot } from '../lib/wallbitSnapshotClient';

const HAS_BYBIT = import.meta.env.VITE_HAS_BYBIT === 'true';
export default function Portfolio() {
  const {
    loading,
    todayPortfolioAnalysis,
    todayPortfolioV3,
    refreshMarketQuotes,
    refreshAll,
    futuresMonitoring,
    decisionSupport,
  } = useApp();
  const [investorProfile, setInvestorProfile] = useState('moderado-agresivo');

  // El hook recibe el perfil y recalcula targets y allocation de forma automatizada al cambiar
  const portfolio = usePortfolioData({
    loading,
    todayPortfolioAnalysis,
    todayPortfolioV3,
    investorProfile,
    futuresMonitoring,
    heatmapAssets: todayPortfolioV3?.heatmapAssets || todayPortfolioV3?.assets || [],
  });
  const exporter = usePortfolioExport(portfolio.aiReport);

  const {
    refreshingQuotes,
    quoteMessage,
    quoteError,
    refreshPortfolioPrices,
  } = usePortfolioQuotes({
    loading,
    refreshMarketQuotes,
    refreshBinanceSnapshot,
    refreshBybitSnapshot: HAS_BYBIT ? refreshBybitSnapshot : undefined,
    refreshWallbitSnapshot,
    refreshAll,
  });

  if (portfolio.loading) {
    return (
      <main className="portfolio-page">
        <div className="portfolio-loading">
         <PatrimonioLoader size="md" />
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
      futuresMonitoring={portfolio.futuresMonitoring}
      bobRate={portfolio.bobRate}
      historicalContext={portfolio.historicalContext}
      decisionSupport={decisionSupport}
    />
  <PortfolioAllocation
      allocation={portfolio.allocation}
      targets={portfolio.targets}
      investorProfile={investorProfile}
      onProfileChange={setInvestorProfile}
    />
    
    
<PortfolioSectorMap
  sectorAnalysis={portfolio.sectorAnalysis}
  totalInvertibleUSD={portfolio.summary.investableUSD}
/>




    </main>
  );
}