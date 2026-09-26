// utils/portfolioSectorAnalysis.js

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * factor) / factor;
}

function normalizeSymbol(value) {
  const symbol = String(value || '').trim();
  return symbol || null;
}

function getAssetSource(asset) {
  return normalizeSymbol(
    asset?.symbol ||
    asset?.name ||
    asset?.groupKey ||
    asset?.source ||
    'unknown',
  );
}

function ensureSector(sectorValues, sectorDetails, sector) {
  const key = String(sector || 'otros').trim() || 'otros';

  if (!sectorValues[key]) {
    sectorValues[key] = 0;
    sectorDetails[key] = {
      directValueUSD: 0,
      lookThroughValueUSD: 0,
      sources: new Set(),
      assets: [],
    };
  }

  return key;
}

function addDirectExposure({
  sectorValues,
  sectorDetails,
  sector,
  asset,
  assetValue,
}) {
  const key = ensureSector(sectorValues, sectorDetails, sector);
  const source = getAssetSource(asset);

  sectorValues[key] += assetValue;
  sectorDetails[key].directValueUSD += assetValue;
  sectorDetails[key].sources.add(source);
  sectorDetails[key].assets.push({
    symbol: asset?.symbol || asset?.name || null,
    name: asset?.name || asset?.symbol || null,
    valueUSD: round(assetValue),
    pct: 100,
    lookThroughWeight: null,
  });
}

function addLookThroughExposure({
  sectorValues,
  sectorDetails,
  sector,
  asset,
  assetValue,
  weightPct,
}) {
  const key = ensureSector(sectorValues, sectorDetails, sector);
  const source = getAssetSource(asset);
  const safeWeightPct = Math.max(0, toFiniteNumber(weightPct));
  const sectorValue = assetValue * (safeWeightPct / 100);

  if (sectorValue <= 0) return;

  sectorValues[key] += sectorValue;
  sectorDetails[key].lookThroughValueUSD += sectorValue;
  sectorDetails[key].sources.add(source);
  sectorDetails[key].assets.push({
    symbol: asset?.symbol || asset?.name || null,
    name: asset?.name || asset?.symbol || null,
    valueUSD: round(sectorValue),
    pct: safeWeightPct,
    lookThroughWeight: safeWeightPct,
  });
}

function normalizeEtfExposure(etfExposure) {
  return etfExposure && typeof etfExposure === 'object'
    ? etfExposure
    : {};
}

/**
 * Construye exposición sectorial con look-through de ETFs.
 *
 * La suma de los sectores se limita al valor real del activo.
 * Si los pesos del proveedor superan 100%, se normalizan.
 */
export function buildPortfolioSectorExposure(
  assets = [],
  etfExposure = {},
  investableUSD = 0,
) {
  const sourceAssets = Array.isArray(assets) ? assets : [];
  const exposure = normalizeEtfExposure(etfExposure);
  const sectorValues = {};
  const sectorDetails = {};
  const reconciliation = [];

  for (const asset of sourceAssets) {
    const assetValue = Math.max(0, toFiniteNumber(asset?.valueUSD));

    if (assetValue <= 0) continue;
    if (asset?.classification?.isInvestable === false) continue;

    const symbol = normalizeSymbol(asset?.symbol);
    const etfData = symbol ? exposure[symbol] : null;
    const etfSectors = Array.isArray(etfData?.sectors)
      ? etfData.sectors
      : [];

    if (asset?.type === 'etf' && etfSectors.length > 0) {
      const validSectors = etfSectors
        .map((item) => ({
          sector: item?.sector || 'otros',
          weightPct: Math.max(0, toFiniteNumber(item?.weightPct)),
        }))
        .filter((item) => item.weightPct > 0);

      const rawWeightTotal = validSectors.reduce(
        (sum, item) => sum + item.weightPct,
        0,
      );

      const normalizationFactor = rawWeightTotal > 100
        ? 100 / rawWeightTotal
        : 1;

      const appliedWeightTotal = validSectors.reduce(
        (sum, item) => sum + item.weightPct * normalizationFactor,
        0,
      );

      reconciliation.push({
        symbol,
        assetValueUSD: round(assetValue),
        sourceWeightPct: round(rawWeightTotal, 4),
        appliedWeightPct: round(appliedWeightTotal, 4),
        normalized: normalizationFactor !== 1,
      });

      for (const item of validSectors) {
        addLookThroughExposure({
          sectorValues,
          sectorDetails,
          sector: item.sector,
          asset,
          assetValue,
          weightPct: item.weightPct * normalizationFactor,
        });
      }

      continue;
    }

    if (asset?.type === 'etf' && etfData?.bondCategories) {
      addDirectExposure({
        sectorValues,
        sectorDetails,
        sector: 'renta_fija',
        asset,
        assetValue,
      });
      continue;
    }

    addDirectExposure({
      sectorValues,
      sectorDetails,
      sector: asset?.classification?.sector || 'otros',
      asset,
      assetValue,
    });
  }

  const safeInvestableUSD = Math.max(0, toFiniteNumber(investableUSD));
  const sectors = Object.entries(sectorValues)
    .map(([sector, rawValueUSD]) => {
      const details = sectorDetails[sector];
      const valueUSD = round(rawValueUSD);
      const sources = Array.from(details.sources).filter(Boolean);
      const assetsBySector = details.assets
        .filter((asset) => asset.symbol || asset.name)
        .map((asset) => ({
          ...asset,
          valueUSD: round(asset.valueUSD),
        }));

      return {
        sector,
        valueUSD,
        pct: safeInvestableUSD > 0
          ? round((valueUSD / safeInvestableUSD) * 100, 4)
          : 0,
        directValueUSD: round(details.directValueUSD),
        lookThroughValueUSD: round(details.lookThroughValueUSD),
        sources,
        assets: assetsBySector,
      };
    })
    .filter((sector) => sector.valueUSD > 0)
    .sort((a, b) => b.valueUSD - a.valueUSD);

  const totalSectorUSD = round(
    sectors.reduce((sum, sector) => sum + sector.valueUSD, 0),
  );

  const differenceUSD = round(totalSectorUSD - safeInvestableUSD);

  return {
    methodology: 'look_through_etf_and_direct_asset_classification',
    sectors,
    dominantSector: sectors[0] || null,
    totalSectorUSD,
    reconciliation: {
      investableUSD: round(safeInvestableUSD),
      totalSectorUSD,
      differenceUSD,
      matches: Math.abs(differenceUSD) < 0.01,
      etfs: reconciliation,
    },
  };
}