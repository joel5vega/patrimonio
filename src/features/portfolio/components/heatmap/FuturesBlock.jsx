import React, { useCallback, useRef, useState } from 'react';
import { fmt, fmtPct } from './format';
import {
  getPositionSide,
  getNotionalUSD,
  getLeverage,
  getLiquidationDistancePct,
  getQuantity,
  getEntryPrice,
  getMarketPrice,
  getCostBasisUSD,
  getUnrealizedPnlUSD,
  getUnrealizedPnlPct,
} from './assetGetters';
import AssetIcon from './AssetIcon';
import TooltipPortal from './TooltipPortal';

function FuturesTile({ asset }) {
  const [hover, setHover] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const tileRef = useRef(null);

  const isShort = (getPositionSide(asset) || 'LONG') === 'SHORT';
  const notional = getNotionalUSD(asset);
  const pnl = getUnrealizedPnlUSD(asset);
  const pnlPct = getUnrealizedPnlPct(asset);
  const liq = getLiquidationDistancePct(asset);
  const lev = getLeverage(asset);

  const up = pnl != null && pnl >= 0;
  const liqDanger = liq != null && liq < 15;

  const ticker = String(asset.symbol || asset.name || '')
    .replace(/[-_/]?(USDT|USD|PERP|BUSD)$/i, '')
    .toUpperCase()
    .slice(0, 6) || '?';

  const iconAsset = { ...asset, symbol: ticker, type: 'crypto' };

  const onEnter = useCallback(() => {
    if (tileRef.current) setAnchorRect(tileRef.current.getBoundingClientRect());
    setHover(true);
  }, []);

  const onLeave = useCallback(() => {
    setHover(false);
    setAnchorRect(null);
  }, []);

  return (
    <div
      ref={tileRef}
      className="hm-futures-tile"
      style={{
        background: up ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)',
        border: `1px solid ${liqDanger ? '#f43f5e88' : up ? '#10b98144' : '#f43f5e44'}`,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Línea 1: icono · ticker · SHORT/LONG */}
      <div className="hm-futures-tile__top">
        <AssetIcon asset={iconAsset} size={14} />
        <span className="hm-futures-tile__symbol">{ticker}</span>
        <span
          className="hm-futures-tile__side"
          style={{ color: isShort ? '#f43f5e' : '#10b981' }}
        >
          {isShort ? 'S' : 'L'}
          {lev > 1 ? ` ${lev}x` : ''}
        </span>
      </div>

      {/* Línea 2: P&L */}
      {pnl != null && (
        <div
          className="hm-futures-tile__pnl"
          style={{ color: up ? '#10b981' : '#f43f5e' }}
        >
          {fmt(pnl, 2)}
          {pnlPct != null && (
            <span className="hm-futures-tile__pnl-pct">{fmtPct(pnlPct)}</span>
          )}
        </div>
      )}

      {/* Línea 3: notional · liq */}
      <div className="hm-futures-tile__foot">
        {notional != null && (
          <span className="hm-futures-tile__notional">{fmt(notional, 0)}</span>
        )}
        {liq != null && (
          <span
            className="hm-futures-tile__liq"
            style={{ color: liqDanger ? '#f43f5e' : 'rgba(255,255,255,0.45)' }}
          >
            liq {liq.toFixed(0)}%
          </span>
        )}
      </div>

      {hover && anchorRect && (
        <TooltipPortal
          asset={iconAsset}
          anchorRect={anchorRect}
          performance={{
            quantity: getQuantity(asset),
            entryPrice: getEntryPrice(asset),
            marketPrice: getMarketPrice(asset),
            costBasisUSD: getCostBasisUSD(asset),
            marketValueUSD: notional,
            pnlUSD: pnl,
            pnlPct,
            dailyChangePct: null,
            isPartial: false,
          }}
        />
      )}
    </div>
  );
}

export default function FuturesBlock({ assets }) {
  if (!assets?.length) return null;

  const totalNotional = assets.reduce((s, a) => s + (getNotionalUSD(a) ?? 0), 0);
  const totalPnl = assets.reduce((s, a) => s + (getUnrealizedPnlUSD(a) ?? 0), 0);
  const shorts = assets.filter((a) => getPositionSide(a) === 'SHORT').length;

  return (
    <div className="hm-futures">
      <div className="hm-futures__head">
        <span className="hm-futures__title">Futuros</span>
        <span className="hm-futures__stats">
          {assets.length - shorts > 0 && `${assets.length - shorts}L `}
          {shorts > 0 && `${shorts}S · `}
          {fmt(totalNotional, 0)}
          <span style={{ color: totalPnl >= 0 ? '#10b981' : '#f43f5e', marginLeft: 8 }}>
            {fmt(totalPnl, 2)}
          </span>
        </span>
      </div>

      <div className="hm-futures__grid">
        {assets.map((asset) => (
          <FuturesTile
            key={asset.id || `${asset.symbol}-${asset.positionSide}`}
            asset={asset}
          />
        ))}
      </div>
    </div>
  );
}