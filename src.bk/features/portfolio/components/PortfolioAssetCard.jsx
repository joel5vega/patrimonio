import { ArrowDownRight, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { ROLE_COLORS } from '../constants/portfolioColors';
import { PortfolioIcon } from '../constants/portfolioIcons';
import { formatUSD, getRoleLabel, toNumber } from '../utils/portfolioFormatters';

function PortfolioAssetCard({ asset = {}, bobRate = null }) {
  const classification = asset.classification || {};
  const role = classification.role || 'unclassified';
  const roleColor = ROLE_COLORS[role] || '#94a3b8';
  const pnl = asset.pnl;
  const positive = toNumber(pnl) >= 0;
  const icon = asset.type === 'crypto'
    ? 'bitcoin'
    : asset.type === 'etf'
      ? 'chart'
      : role === 'yield'
        ? 'yield'
        : 'briefcase';

  return (
    <article className="portfolio-asset-card">
      <div className="portfolio-asset-icon" style={{ color: roleColor }}>
        <PortfolioIcon name={icon} size={20} />
      </div>

      <div className="portfolio-asset-main">
        <div className="portfolio-asset-title-row">
          <strong>{asset.name || asset.symbol || 'Sin nombre'}</strong>
          <span style={{ color: roleColor, borderColor: `${roleColor}55` }}>
            {getRoleLabel(role)}
          </span>
          {classification.isLocked && <LockKeyhole size={12} />}
        </div>

        <small>{asset.subtitle || asset.symbol || '—'}</small>

        {classification.isDeFi && (
          <em>DeFi · APR {classification.aprPct ?? '—'}%</em>
        )}

        {asset.strategy?.reduce && (
          <em className="danger">Reducir posición</em>
        )}
      </div>

      <div className="portfolio-asset-values">
        <strong>{formatUSD(asset.valueUSD)}</strong>
        {bobRate && (
          <small>
            Bs {(toNumber(asset.valueUSD) * Number(bobRate)).toLocaleString('es-BO', {
              maximumFractionDigits: 0,
            })}
          </small>
        )}
        {pnl != null && (
          <span className={positive ? 'positive' : 'negative'}>
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {formatUSD(Math.abs(toNumber(pnl)))}
          </span>
        )}
      </div>
    </article>
  );
}

export default PortfolioAssetCard;