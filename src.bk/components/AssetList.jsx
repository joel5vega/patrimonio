// components/AssetList.jsx
// Lista completa de activos: tabs Todos/Crypto/ETFs/Manual
// filtra por visibleGroupSet y ordena por valor descendente
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const CRYPTO_ICONS = {
  BTC: 'currency_bitcoin', ETH: 'token', SOL: 'sunny',
  BNB: 'toll', XRP: 'water_drop', ADA: 'hexagon', LINK: 'link',
  DEFAULT: 'generating_tokens',
};
const ROLE_COLORS = {
  core: '#3b82f6', growth: '#10b981', defensive: '#facc15',
  liquidity: '#06b6d4', yield: '#14b8a6', speculative: '#f43f5e',
  trading: '#a855f7', patrimony: '#f97316',
};
const TABS = ['Todos', 'Crypto', 'ETFs', 'Manual'];
const fmt  = (v, d = 0) => '$' + Number(v ?? 0).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtB = (v, rate = 6.96) => 'Bs ' + Number((v ?? 0) * rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function TypeIcon({ type, symbol }) {
  const icons = {
    crypto: CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT,
    etf: 'show_chart', manual: 'savings', stock: 'monitoring',
    stable: 'attach_money', patrimony: 'home_work',
  };
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-primary)' }}>
      {icons[type] || 'savings'}
    </span>
  );
}

/**
 * Props:
 *   assets        {Array}   portfolioListAssets (sin patrimony)
 *   v3Assets      {Array}   v3.assets – para leer role y reduce
 *   visibleGroupSet {Set}   groupKeys visibles
 *   bobRate       {number}
 *   activeTab     {string}
 *   onTabChange   {fn}
 */
export default function AssetList({
  assets = [], v3Assets = [], visibleGroupSet, bobRate = 6.96,
  activeTab = 'Todos', onTabChange,
}) {
  const TAB_FILTER = {
    Todos:  () => true,
    Crypto: a => a.type === 'crypto' || a.type === 'stable',
    ETFs:   a => a.type === 'etf',
    Manual: a => a.type === 'manual' || a.type === 'stock',
  };

  const filtered = assets
    .filter(TAB_FILTER[activeTab] || (() => true))
    .filter(a => !visibleGroupSet || visibleGroupSet.has(a.groupKey))
    .sort((a, b) => (b.valueUSD ?? 0) - (a.valueUSD ?? 0));

  return (
    <div>
      {/* Tabs */}
      <div className="portfolio-tabs-wrap">
        <div className="portfolio-tabs-scroll">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={`portfolio-tab${activeTab === tab ? ' active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Asset cards */}
      <div className="portfolio-assets" style={{ marginTop: '0.75rem' }}>
        {/* Header — desktop only */}
        <div className="portfolio-assets-head desktop-only">
          <span className="col-span-2">Activo</span>
          <span style={{ textAlign: 'right' }}>Valor</span>
          <span style={{ textAlign: 'right' }}>P&amp;L</span>
        </div>

        {filtered.length === 0 && (
          <p className="portfolio-empty">Sin activos visibles</p>
        )}

        {filtered.map(a => {
          const v3a   = v3Assets.find(x => x.id === a.id);
          const role  = v3a?.classification?.role;
          const reduce = v3a?.strategy?.reduce;

          return (
            <article key={a.id} className="portfolio-asset-card">
              <div className="portfolio-asset-main">
                {/* Icon */}
                <div className="portfolio-asset-icon">
                  <TypeIcon type={a.type} symbol={a.symbol} />
                </div>

                {/* Copy */}
                <div className="portfolio-asset-copy">
                  <div className="portfolio-asset-title-row">
                    <p className="portfolio-asset-title">{a.name}</p>
                    {role && (
                      <span
                        className="portfolio-chip text-[9px] font-black uppercase tracking-wide"
                        style={{
                          color: ROLE_COLORS[role],
                          borderColor: ROLE_COLORS[role] + '33',
                          backgroundColor: ROLE_COLORS[role] + '11',
                        }}
                      >
                        {role}
                      </span>
                    )}
                  </div>
                  <p className="portfolio-asset-subtitle">{a.subtitle}</p>
                  {a.extra && <p className="portfolio-asset-extra">{a.extra}</p>}
                  {reduce && (
                    <p className="portfolio-asset-extra" style={{ color: '#fb7185' }}>
                      Reducir posición
                    </p>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="portfolio-asset-metrics">
                <div className="portfolio-metric-block">
                  <p className="portfolio-metric-label">Valor</p>
                  <p className="portfolio-metric-value">{fmt(a.valueUSD)}</p>
                  <p className="portfolio-metric-subvalue">{fmtB(a.valueUSD, bobRate)}</p>
                </div>

                <div className="portfolio-metric-block align-end">
                  <p className="portfolio-metric-label">P&amp;L</p>
                  {a.pnl != null ? (
                    <>
                      <div className={`portfolio-pnl ${a.pnl >= 0 ? 'up' : 'down'}`}>
                        {a.pnl >= 0
                          ? <ArrowUpRight   size={14} />
                          : <ArrowDownRight size={14} />}
                        <span>{fmt(Math.abs(a.pnl), 2)}</span>
                      </div>
                      {a.pnlPct != null && (
                        <p className={`portfolio-pnl-pct ${a.pnl >= 0 ? 'up' : 'down'}`}>
                          {a.pnl >= 0 ? '+' : ''}{a.pnlPct.toFixed(1)}%
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="portfolio-metric-empty">—</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
