import React, { useCallback, useRef, useState } from 'react';
import { fmt, fmtPct } from './format';
import {
  getPositionSide, getNotionalUSD, getLeverage, getLiquidationDistancePct, getExchangeLabel,
  getQuantity, getEntryPrice, getMarketPrice, getCostBasisUSD, getUnrealizedPnlUSD, getUnrealizedPnlPct,
} from './assetGetters';
import AssetIcon from './AssetIcon';
import TooltipPortal from './TooltipPortal';

// ─── FuturesTile ────────────────────────────────────────────

function FuturesTile({ asset }) {
  const [hover, setHover] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const tileRef = useRef(null);

  const positionSide = getPositionSide(asset) || 'LONG';
  const isShort = positionSide === 'SHORT';

  const notionalUSD = getNotionalUSD(asset);
  const pnlUSD = getUnrealizedPnlUSD(asset);
  const pnlPct = getUnrealizedPnlPct(asset);
  const leverage = getLeverage(asset);
  const liquidationDistancePct =
    getLiquidationDistancePct(asset);

  const isPositivePnl = pnlUSD !== null && pnlUSD >= 0;

  const bg = isPositivePnl
    ? 'rgba(16,185,129,0.22)'
    : pnlUSD !== null
      ? 'rgba(244,63,94,0.22)'
      : 'rgba(168,85,247,0.18)';

  const sideColor = isShort ? '#f43f5e' : '#10b981';
  const sideLabel = isShort ? 'SHORT' : 'LONG';

  const onMouseEnter = useCallback(() => {
    if (tileRef.current) {
      setAnchorRect(tileRef.current.getBoundingClientRect());
    }

    setHover(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHover(false);
    setAnchorRect(null);
  }, []);

  const rawTicker =
    String(asset.symbol || asset.name || '')
      .replace(/USDT$|USD$/, '')
      .slice(0, 8) || '?';

  const exchangeLabel = getExchangeLabel(asset);

  return (
    <div
      ref={tileRef}
      className="hm-futures-tile"
      style={{
        background: bg,
        border: `1px solid ${sideColor}55`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="hm-futures-tile__top">
        <div className="hm-futures-tile__icon-wrap">
          <AssetIcon asset={asset} size={14} />
        </div>

        <div className="hm-futures-tile__symbol-group">
          <span className="hm-futures-tile__symbol">
            {rawTicker}
          </span>
          <span className="hm-futures-tile__exchange">
            {exchangeLabel}
          </span>
        </div>

        <span
          className="hm-futures-tile__side"
          style={{ color: sideColor }}
        >
          {sideLabel}
        </span>
      </div>

      <div className="hm-futures-tile__metrics">
        {notionalUSD !== null && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">
              Notional
            </span>
            <span className="hm-futures-tile__val">
              {fmt(notionalUSD, 2)}
            </span>
          </div>
        )}

        {pnlUSD !== null && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">P&L</span>
            <span
              className="hm-futures-tile__val"
              style={{
                color: isPositivePnl ? '#10b981' : '#f43f5e',
              }}
            >
              {fmt(pnlUSD, 2)}
              {pnlPct !== null && ` (${fmtPct(pnlPct)})`}
            </span>
          </div>
        )}

        {leverage !== null && leverage > 1 && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">Lev</span>
            <span className="hm-futures-tile__val">
              {leverage}x
            </span>
          </div>
        )}

        {liquidationDistancePct !== null && (
          <div className="hm-futures-tile__row">
            <span className="hm-futures-tile__lbl">
              Liq. dist.
            </span>
            <span
              className="hm-futures-tile__val"
              style={{
                color:
                  liquidationDistancePct < 10
                    ? '#f43f5e'
                    : liquidationDistancePct < 20
                      ? '#facc15'
                      : '#10b981',
              }}
            >
              {liquidationDistancePct.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {hover && anchorRect && (
        <TooltipPortal
          asset={asset}
          anchorRect={anchorRect}
          performance={{
            quantity: getQuantity(asset),
            entryPrice: getEntryPrice(asset),
            marketPrice: getMarketPrice(asset),
            costBasisUSD: getCostBasisUSD(asset),
            marketValueUSD: notionalUSD,
            pnlUSD,
            pnlPct,
            dailyChangePct: null,
            quantityDifference: null,
            isPartial: false,
          }}
        />
      )}
    </div>
  );
}

// ─── FuturesBlock ───────────────────────────────────────────

export default function FuturesBlock({ assets }) {
  if (!assets.length) return null;

  const totalNotional = assets.reduce(
    (sum, asset) => sum + (getNotionalUSD(asset) ?? 0),
    0,
  );

  const totalPnl = assets.reduce(
    (sum, asset) => sum + (getUnrealizedPnlUSD(asset) ?? 0),
    0,
  );

  const shortCount = assets.filter(
    (asset) => getPositionSide(asset) === 'SHORT',
  ).length;

  const longCount = assets.length - shortCount;

  return (
    <div className="hm-futures">
      <div className="hm-futures__head">
        <span className="hm-futures__title">
          Futuros · Derivados
        </span>

        <div className="hm-futures__stats">
          {longCount > 0 && (
            <span className="hm-futures__stat hm-futures__stat--long">
              {longCount} LONG
            </span>
          )}

          {shortCount > 0 && (
            <span className="hm-futures__stat hm-futures__stat--short">
              {shortCount} SHORT
            </span>
          )}

          <span className="hm-futures__stat">
            Notional {fmt(totalNotional, 2)}
          </span>

          <span
            className={`hm-futures__stat ${
              totalPnl >= 0
                ? 'hm-futures__stat--up'
                : 'hm-futures__stat--down'
            }`}
          >
            P&L {fmt(totalPnl, 2)}
          </span>
        </div>
      </div>

      <div className="hm-futures__grid">
        {assets.map((asset) => (
          <FuturesTile
            key={
              asset.id ||
              `${asset.source || asset.groupKey}-${asset.symbol}-${asset.positionSide ?? ''}`
            }
            asset={asset}
          />
        ))}
      </div>
    </div>
  );
}

