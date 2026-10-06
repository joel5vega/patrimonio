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
    if (!anchorRect || !tooltipRef.current) {
      return;
    }

    const tooltipRect =
      tooltipRef.current.getBoundingClientRect();

    const gap = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = anchorRect.top - tooltipRect.height - gap;

    if (top < 8) {
      top = anchorRect.bottom + gap;
    }

    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    let left =
      anchorRect.left +
      anchorRect.width / 2 -
      tooltipRect.width / 2;

    left = Math.max(
      8,
      Math.min(
        left,
        viewportWidth - tooltipRect.width - 8,
      ),
    );

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

  // El backend adjunta `asset.lookThrough` con { topHoldings, expenseRatio, etf, … }.
// Normalizamos aquí para que el resto del tooltip no cambie.
const lookThrough = asset?.lookThrough ?? null;
const topHoldings = Array.isArray(lookThrough?.topHoldings)
  ? lookThrough.topHoldings.slice(0, 5)
  : [];
const topHoldingsWeight = topHoldings.reduce(
  (sum, h) => sum + (Number(h.etfWeightPct ?? h.weightPct) || 0),
  0,
);
const expenseRatio = Number(lookThrough?.expenseRatio);
const hasExpense =
  Number.isFinite(expenseRatio) && expenseRatio > 0;

  const style = position
    ? {
        top: position.top,
        left: position.left,
        opacity: 1,
      }
    : { top: -9999, left: -9999, opacity: 0 };

  const pnlLabel = fmtPct(performance.pnlPct);

  return ReactDOM.createPortal(
    <div ref={tooltipRef} className="hm-tooltip" style={style}>
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
          <div className="hm-tooltip__name">{asset.name}</div>

          {asset.symbol && asset.symbol !== asset.name && (
            <div className="hm-tooltip__symbol">
              {asset.symbol}
            </div>
          )}
        </div>
      </div>

      <div className="hm-tooltip__div" />

      <div className="hm-tooltip__rows">
        <div className="hm-tooltip__row">
          <span className="hm-tooltip__lbl">Valor</span>
          <span className="hm-tooltip__val">
            {fmt(
              performance.marketValueUSD ?? asset.valueUSD,
              2,
            )}
          </span>
        </div>

        {asset.weightPct !== null &&
          asset.weightPct !== undefined && (
            <div className="hm-tooltip__row">
              <span className="hm-tooltip__lbl">Peso global</span>
              <span className="hm-tooltip__val">
                {Number(asset.weightPct).toFixed(1)}%
              </span>
            </div>
          )}

        {performance.quantity !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Cantidad</span>
            <span className="hm-tooltip__val">
              {performance.quantity.toLocaleString('en-US', {
                maximumFractionDigits: 8,
              })}
            </span>
          </div>
        )}

        {performance.entryPrice !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Entrada</span>
            <span className="hm-tooltip__val">
              {fmt(performance.entryPrice, 2)}
            </span>
          </div>
        )}

        {performance.marketPrice !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Actual</span>
            <span className="hm-tooltip__val">
              {fmt(performance.marketPrice, 2)}
            </span>
          </div>
        )}

        {performance.costBasisUSD !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Costo</span>
            <span className="hm-tooltip__val">
              {fmt(performance.costBasisUSD, 2)}
            </span>
          </div>
        )}

        {performance.pnlUSD !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">P&L USD</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.pnlUSD >= 0 ? 'up' : 'down'
              }`}
            >
              {fmt(performance.pnlUSD, 2)}
            </span>
          </div>
        )}

        {pnlLabel && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">P&L %</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.pnlPct >= 0 ? 'up' : 'down'
              }`}
            >
              {pnlLabel}
            </span>
          </div>
        )}

        {performance.dailyChangePct !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Hoy</span>
            <span
              className={`hm-tooltip__pnl ${
                performance.dailyChangePct >= 0
                  ? 'up'
                  : 'down'
              }`}
            >
              {fmtPct(performance.dailyChangePct)}
            </span>
          </div>
        )}

        {performance.isPartial && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">Entrada</span>
            <span
              className="hm-tooltip__val"
              style={{ color: '#facc15' }}
            >
              Parcial
            </span>
          </div>
        )}

        {isDeFi && aprPct !== null && (
          <div className="hm-tooltip__row">
            <span className="hm-tooltip__lbl">APR</span>
            <span
              className="hm-tooltip__val"
              style={{ color: '#2b7fff' }}
            >
              <Zap
                size={10}
                style={{
                  marginRight: 3,
                  verticalAlign: 'middle',
                }}
              />
              {aprPct}%
            </span>
          </div>
        )}
      </div>

     {topHoldings.length > 0 && (
  <div className="tooltip-holdings">
    <div className="tooltip-section-title">
      Principales posiciones
    </div>

    {topHoldings.map((holding) => (
  <div
    key={holding.symbol}
    className="tooltip-holding"
  >
    <AssetIcon
      asset={{
        symbol: holding.symbol,
        name: holding.name,
        type: 'stock',
        sector: holding.sector,
      }}
      size={18}
    />

    <span className="tooltip-holding__name">
      {holding.symbol}
    </span>

    <span className="tooltip-holding__weight">
      {Number(holding.etfWeightPct ?? holding.weightPct ?? 0).toFixed(2)}%
    </span>
  </div>
))}

    <div className="tooltip-holdings-total">
      Top 5: {topHoldingsWeight.toFixed(1)}%
    </div>
  </div>
)}

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
            <span style={{ margin: '0 4px', opacity: 0.3 }}>
              |
            </span>
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
