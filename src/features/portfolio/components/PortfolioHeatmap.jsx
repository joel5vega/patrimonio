import MarketHeatmap from '../../../components/MarketHeatmap';

export default function PortfolioHeatmap({ assets = [], bobRate }) {
  return (
    <section className="portfolio-card portfolio-heatmap-section">
      <div className="portfolio-heatmap-content">
        <MarketHeatmap assets={assets} bobRate={bobRate} />
      </div>
    </section>
  );
}