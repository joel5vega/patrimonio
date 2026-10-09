import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Zap } from 'lucide-react';
import { animate } from 'animejs';
import { fmt, fmtPct } from './format';
import { getRole, getSector } from './assetGetters';
import { ROLE_META, resolveIconLucide } from './assetMeta';
import AssetIcon from './AssetIcon';

export default function TooltipPortal({
  asset,
  anchorRect,
  performance,
  etfData = null,
}) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchorRect.top - tooltipRect.height - gap;
    if (top < 8) top = anchorRect.bottom + gap;
    if (top + tooltipRect.height > vh - 8) {
      top = vh - tooltipRect.height - 8;
    }

    let left =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(8, Math.min(left, vw - tooltipRect.width - 8));

    setPosition({ top, left });

    animate(tooltipRef.current, {
      opacity: [0, 1],
      y: [6, 0],
      scale: [0.94, 1],
      duration: 130,
      ease: 'outSine',
    });
  }, [anchorRect]);

  const role = getRole(asset);
  const roleMeta = ROLE_META[role];
  const sector = getSector(asset);
  const isDeFi = asset.classification?.isDeFi;
  const aprPct = asset.classification?.aprPct;
  const { color } = resolveIconLucide(asset);

  const lookThrough = asset?.lookThrough ?? null;
  const topHoldings = Array.isArray(lookThrough?.topHoldings)
    ? lookThrough.topHoldings.slice(0, 5)
    : [];
  const topHoldingsWeight = topHoldings.reduce(
    (sum, h) => sum + (Number(h.etfWeightPct ?? h.weightPct) || 0),
    0,
  );

  const style = position
    ? { top: position.top, left: position.left, opacity: 1 }
    : { top: -9999, left: -9999, opacity: 0 };

  const hasEntry =
    performance.entryPrice != null && performance.marketPrice != null;
  const hasPnl = performance.pnlUSD != null || performance.pnlPct != null;

  return ReactDOM.createPortal(
    <div ref={tooltipRef} className="hm-tooltip" style={style}>
      {/* ── Header ── */}
      <div className="hm-tooltip__head">
        <div
          className="hm-tooltip__icon-wrap"
          style={{
            background: `${color}1a`,
            border: `1px solid ${color}40`,
          }}
        >
          <AssetIcon asset={asset} size={16} />
        </div>
        <div>
          <div className="hm-tooltip__name">
            {asset.symbol || asset.name}
          </div>
          {asset.symbol && asset.name && asset.symbol !== asset.name && (
            <div className="hm-tooltip__symbol">{asset.name}</div>
          )}
        </div>
      </div>

      <div className="hm-tooltip__div" />

      {/* ── Datos clave ── */}
      <div className="hm-tooltip__rows">
        {/* Valor */}
        <div className="hm-tooltip__row">
          <span className="hm-tooltip__lbl">Valor</span>
          <span className="hm-tooltip__val">
            {fmt(performance.marketValueUSD ?? asset.valueUSD, 2)}
          </span>
        </div>

        {/* Peso */}
        {asset.weightPct != null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Peso</span>
            <span className="hm-tooltip__val">
              {Number(asset.weightPct).toFixed(1)}%
            </span>
          </div>
        )}

        {/* P&L — una sola fila con ambos */}
        {hasPnl && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">P&L</span>
            <span
              className={`hm-tooltip__pnl ${
                (performance.pnlPct ?? performance.pnlUSD ?? 0) >= 0
                  ? 'up'
                  : 'down'
              }`}
            >
              {performance.pnlUSD != null && fmt(performance.pnlUSD, 2)}
              {performance.pnlUSD != null &&
                performance.pnlPct != null &&
                ' · '}
              {performance.pnlPct != null && fmtPct(performance.pnlPct)}
            </span>
          </div>
        )}

        {/* Entrada → Actual (compacto) */}
        {hasEntry && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Precio</span>
            <span className="hm-tooltip__val" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(performance.entryPrice, 2)}
              <span style={{ opacity: 0.4, margin: '0 4px' }}>→</span>
              {fmt(performance.marketPrice, 2)}
            </span>
          </div>
        )}

        {/* Hoy */}
        {performance.dailyChangePct != null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Hoy</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.dailyChangePct >= 0 ? 'up' : 'down'
              }`}
            >
              {fmtPct(performance.dailyChangePct)}
            </span>
          </div>
        )}

        {/* Entrada parcial */}
        {performance.isPartial && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Entrada</span>
            <span className="hm-tooltip__val" style={{ color: '#facc15' }}>
              Parcial
            </span>
          </div>
        )}

        {/* DeFi APR */}
        {isDeFi && aprPct != null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">APR</span>
            <span className="hm-tooltip__val" style={{ color: '#2b7fff' }}>
              <Zap size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              {aprPct}%
            </span>
          </div>
        )}
      </div>

      {/* ── Top holdings (solo ETFs) ── */}
      {topHoldings.length > 0 && (
        <div className="tooltip-holdings">
          <div className="tooltip-section-title">Top holdings</div>
          {topHoldings.map((h) => (
            <div key={h.symbol} className="tooltip-holding">
              <AssetIcon
                asset={{
                  symbol: h.symbol,
                  name: h.name,
                  type: 'stock',
                  sector: h.sector,
                }}
                size={14}
              />
              <span className="tooltip-holding__name">{h.symbol}</span>
              <span className="tooltip-holding__weight">
                {Number(h.etfWeightPct ?? h.weightPct ?? 0).toFixed(1)}%
              </span>
            </div>
          ))}
          <div className="tooltip-holdings-total">
            Top {topHoldings.length}: {topHoldingsWeight.toFixed(1)}%
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      {(roleMeta || sector) && (
        <div
          className="hm-tooltip__footer"
          style={{
            borderColor: roleMeta
              ? `${roleMeta.color}22`
              : 'rgba(255,255,255,0.1)',
          }}
        >
          {roleMeta && (
            <>
              <roleMeta.Icon
                size={10}
                color={roleMeta.color}
                style={{ marginRight: 5, flexShrink: 0 }}
              />
              <span
                className="hm-tooltip__role"
                style={{ color: roleMeta.color }}
              >
                {roleMeta.label}
              </span>
            </>
          )}
          {roleMeta && sector && (
            <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
          )}
          {sector && (
            <span className="hm-tooltip__sector">
              {sector.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}