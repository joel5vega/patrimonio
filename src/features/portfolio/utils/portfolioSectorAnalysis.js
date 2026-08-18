// utils/portfolioSectorAnalysis.js

/**
 * Construye exposición sectorial con look-through de ETFs.
 * 
 * @param {Array} assets - Activos del portfolio
 * @param {Record<string, Object>} etfExposure - Datos de exposición de ETFs
 * @param {number} investableUSD - Total de activos invertibles
 * @returns {Array<{ sector: string, valueUSD: number, pct: number, directValueUSD: number, lookThroughValueUSD: number, sources: string[] }>}
 */
export function buildPortfolioSectorExposure(assets, etfExposure, investableUSD) {
  const sectorValues = {};
  const sectorDetails = {};

  for (const asset of assets) {
    const assetValue = Number(asset.valueUSD || 0);

    if (assetValue <= 0) continue;
    if (asset.classification?.isInvestable === false) continue;

    const etfData = etfExposure[asset.symbol];

    // Si es ETF y tenemos datos de composición con sectores
    if (asset.type === 'etf' && etfData?.sectors?.length > 0) {
      for (const sectorData of etfData.sectors) {
        const sectorValue = assetValue * (Number(sectorData.weightPct || 0) / 100);

        if (!sectorValues[sectorData.sector]) {
          sectorValues[sectorData.sector] = 0;
          sectorDetails[sectorData.sector] = {
            directValueUSD: 0,
            lookThroughValueUSD: 0,
            sources: new Set(),
          };
        }

        sectorValues[sectorData.sector] += sectorValue;
        sectorDetails[sectorData.sector].lookThroughValueUSD += sectorValue;
        sectorDetails[sectorData.sector].sources.add(asset.symbol);
      }
      continue;
    }

    // Si es ETF de bonos (sin sectores, solo bondCategories)
    if (asset.type === 'etf' && etfData?.bondCategories) {
      // Para bonos, podrías crear categorías especiales o tratar como "renta_fija"
      const sector = 'renta_fija';

      if (!sectorValues[sector]) {
        sectorValues[sector] = 0;
        sectorDetails[sector] = {
          directValueUSD: 0,
          lookThroughValueUSD: 0,
          sources: new Set(),
        };
      }

      sectorValues[sector] += assetValue;
      sectorDetails[sector].directValueUSD += assetValue;
      sectorDetails[sector].sources.add(asset.symbol);
      continue;
    }

    // Si es ETF pero no tenemos datos de composición, usar sector directo
    if (asset.type === 'etf') {
      const sector = asset.classification?.sector || 'otros';

      if (!sectorValues[sector]) {
        sectorValues[sector] = 0;
        sectorDetails[sector] = {
          directValueUSD: 0,
          lookThroughValueUSD: 0,
          sources: new Set(),
        };
      }

      sectorValues[sector] += assetValue;
      sectorDetails[sector].directValueUSD += assetValue;
      sectorDetails[sector].sources.add(asset.symbol);
      continue;
    }

    // Activos individuales, crypto, etc.
    const sector = asset.classification?.sector || 'otros';

    if (!sectorValues[sector]) {
      sectorValues[sector] = 0;
      sectorDetails[sector] = {
        directValueUSD: 0,
        lookThroughValueUSD: 0,
        sources: new Set(),
      };
    }

    sectorValues[sector] += assetValue;
    sectorDetails[sector].directValueUSD += assetValue;
    sectorDetails[sector].sources.add(asset.symbol);
  }

  return Object.entries(sectorValues)
    .map(([sector, valueUSD]) => {
      const details = sectorDetails[sector];
      return {
        sector,
        valueUSD: Math.round(valueUSD * 100) / 100,
        pct: investableUSD > 0 ? (valueUSD / investableUSD) * 100 : 0,
        directValueUSD: Math.round(details.directValueUSD * 100) / 100,
        lookThroughValueUSD: Math.round(details.lookThroughValueUSD * 100) / 100,
        sources: Array.from(details.sources),
      };
    })
    .sort((a, b) => b.valueUSD - a.valueUSD);
}