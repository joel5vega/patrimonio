import { Building2, LockKeyhole, Server } from 'lucide-react';
import { formatUSD } from '../utils/portfolioFormatters';

function AssetGroup({ title, icon: Icon, assets, tone }) {
  if (!assets?.length) return null;

  return (
    <article className={`portfolio-secondary-group ${tone || ''}`}>
      <header>
        <Icon size={16} />
        <strong>{title}</strong>
        <span>{assets.length}</span>
      </header>
      <div>
        {assets.map((asset) => (
          <p key={asset.id}>
            <span>{asset.name || asset.symbol}</span>
            <b>{formatUSD(asset.valueUSD)}</b>
          </p>
        ))}
      </div>
    </article>
  );
}

export default function PortfolioSecondaryDetails({ reserves, patrimony, exposureBySource }) {
  const rows = Object.entries(exposureBySource || {});

  return (
    <section className="portfolio-secondary-grid">
      <AssetGroup title="Reservas" icon={LockKeyhole} assets={reserves} tone="reserve" />
      <AssetGroup title="Patrimonio" icon={Building2} assets={patrimony} tone="patrimony" />
      <article className="portfolio-secondary-group">
        <header><Server size={16} /><strong>Fuentes</strong></header>
        <div>
          {rows.map(([source, value]) => (
            <p key={source}><span>{source}</span><b>{formatUSD(value)}</b></p>
          ))}
        </div>
      </article>
    </section>
  );
}