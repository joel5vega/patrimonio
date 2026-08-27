import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePortfolioData } from '../features/portfolio/hooks/usePortfolioData';
import { usePortfolioExport } from '../features/portfolio/hooks/usePortfolioExport';
import PortfolioHeader from '../features/portfolio/components/PortfolioHeader';
import PortfolioProfileSelector from '../features/portfolio/components/PortfolioProfileSelector';
import PortfolioHeatmap from '../features/portfolio/components/PortfolioHeatmap';
import PortfolioAllocation from '../features/portfolio/components/PortfolioAllocation';
import PortfolioDecisionSupport from '../features/portfolio/components/PortfolioDecisionSupport';
import PortfolioAssets from '../features/portfolio/components/PortfolioAssets';
import PortfolioSecondaryDetails from '../features/portfolio/components/PortfolioSecondaryDetails';
import PortfolioSectorMap from '../features/portfolio/components/PortfolioSectorMap';
import '../features/portfolio/styles/portfolio.css';

export default function Portfolio() {
  const app = useApp();

  const [investorProfile, setInvestorProfile] = useState('moderado');
  // const portfolio = usePortfolioData({ ...app, investorProfile });
  const {
  loading,
  todayPortfolioAnalysis,
  todayPortfolioV3,
} = useApp();

const portfolio = usePortfolioData({
  loading,
  todayPortfolioAnalysis,
  todayPortfolioV3,
});
  const exporter = usePortfolioExport(portfolio.aiReport);

  if (portfolio.loading) {
    return (
      <main className="portfolio-page">
        <div className="portfolio-loading">Cargando análisis…</div>
      </main>
    );
  }

  return (
    <main className="portfolio-page">
      <PortfolioHeader
        profile={portfolio.profile}
        generatedAt={portfolio.generatedAt}
        bobRate={portfolio.bobRate}
        onCopy={exporter.copy}
        onDownload={exporter.download}
        copied={exporter.copied}
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