// src/features/portfolio/hooks/portfolioData/heatmapTiles.js
//
// El backend entrega los tiles del heatmap, pero algunos activos (Quantfury)
// solo tienen su valor/P&L vivo en los activos manuales del frontend.
// Aquí se superpone ese dato normalizado a cada tile, conservando lo que el
// backend decidió: el rol del bloque y el `lookThrough` del ETF.

export function attachLiveMetrics(tiles = [], assets = []) {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return tiles.map((tile) => {
    const live = assetsById.get(tile.id);
    if (!live) return tile;

    return { ...live, role: tile.role, lookThrough: tile.lookThrough };
  });
}