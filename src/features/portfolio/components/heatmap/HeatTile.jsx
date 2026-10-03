import React, { useCallback, useMemo, useRef, useState } from 'react';
import { fmtPct } from './format';
import { getPerformance } from './assetGetters';
import { tileBg, getDisplayLabel } from './assetMeta';
import AssetIcon from './AssetIcon';
import TooltipPortal from './TooltipPortal';

// Cuánta información cabe según el tamaño real del rectángulo.
// dot: solo color · xs: ticker · sm: ticker + P&L · md: + icono · lg: + peso
function getDensity(w, h) {
  if (w < 30 || h < 22) return 'dot';
  if (w < 52 || h < 38) return 'xs';
  if (w < 80 || h < 56) return 'sm';
  if (w < 120 || h < 80) return 'md';
  return 'lg';
}

export default function HeatTile({ rect, etfData }) {
  const { asset, x, y, w, h } = rect;
  const tileRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const performance = useMemo(() => getPerformance(asset), [asset]);
  const pnlPct = performance.pnlPct;
  const pctLabel = fmtPct(pnlPct);
  const density = getDensity(w, h);

  // Label legible: USDT · Binance / USDT · Bybit / AirTM / Deel / VOO …
  const ticker = getDisplayLabel(asset);

  const showEnter = useCallback(() => {
    if (tileRef.current) setAnchorRect(tileRef.current.getBoundingClientRect());
  }, []);
  const hideLeave = useCallback(() => setAnchorRect(null), []);

  // El texto crece con el tile (VOO grande, tiles chicos legibles).
  const fontSize = Math.max(9, Math.min(Math.min(w, h) / 5, 20));
  const iconSize = Math.round(Math.min(Math.max(fontSize * 1.4, 12), 28));

  return (
    <div
      ref={tileRef}
      className={`hm-tile hm-tile--${density}`}
      style={{ left: x, top: y, width: w, height: h, fontSize }}
      onMouseEnter={showEnter}
      onMouseLeave={hideLeave}
    >
      <div className="hm-tile__body" style={{ background: tileBg(pnlPct, asset) }}>
        {density === 'lg' && (
          <span className="hm-tile__weight">{asset.weightPct.toFixed(1)}%</span>
        )}

        {(density === 'md' || density === 'lg') && (
          <AssetIcon asset={asset} size={iconSize} />
        )}
        {density !== 'dot' && <span className="hm-tile__ticker">{ticker}</span>}
        {pctLabel && density !== 'dot' && density !== 'xs' && (
          <span className="hm-tile__change">{pctLabel}</span>
        )}
      </div>

      {anchorRect && (
        <TooltipPortal
          asset={asset}
          anchorRect={anchorRect}
          performance={performance}
          etfData={etfData}
        />
      )}
    </div>
  );
}