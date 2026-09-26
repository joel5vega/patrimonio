import { getAssetSource, toNumber } from './portfolioFormatters';

export const isExcludedAsset = (asset = {}) => {
  const role = asset.classification?.role;
  return role === 'reserve' || role === 'patrimony';
};

export const isInvestableAsset = (asset = {}) =>
  asset.classification?.isInvestable !== false && !isExcludedAsset(asset);

export const selectInvestableAssets = (assets = []) =>
  assets.filter(isInvestableAsset);

export const selectExcludedAssets = (assets = []) =>
  assets.filter(isExcludedAsset);

export const selectPatrimonyAssets = (assets = []) =>
  assets.filter((asset) => asset.classification?.role === 'patrimony');

export const selectReserveAssets = (assets = []) =>
  assets.filter((asset) => asset.classification?.role === 'reserve');

export const selectAssetsByTab = (assets = [], tab = 'all') => {
  if (tab === 'all') return assets;
  if (tab === 'crypto') {
    return assets.filter(
      (asset) => asset.type === 'crypto' || asset.classification?.subClass === 'crypto',
    );
  }
  if (tab === 'etf') return assets.filter((asset) => asset.type === 'etf');
  if (tab === 'trading') {
    return assets.filter((asset) => asset.classification?.role === 'trading');
  }
  if (tab === 'yield') {
    return assets.filter((asset) => asset.classification?.role === 'yield');
  }
  return assets;
};

export const sortAssetsByValue = (assets = []) =>
  [...assets].sort((a, b) => toNumber(b.valueUSD) - toNumber(a.valueUSD));

export const buildSourceExposure = (assets = []) =>
  assets.reduce((result, asset) => {
    const source = getAssetSource(asset);
    result[source] = (result[source] || 0) + toNumber(asset.valueUSD);
    return result;
  }, {});

export const buildRoleTotals = (assets = []) =>
  assets.reduce((result, asset) => {
    const role = asset.classification?.role || 'unclassified';
    result[role] = (result[role] || 0) + toNumber(asset.valueUSD);
    return result;
  }, {});

export const buildGroupDefinitions = (assets = []) => {
  const groups = new Map();

  assets.forEach((asset) => {
    const key = asset.groupKey || getAssetSource(asset);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: asset.groupLabel || key,
        type: asset.type,
        count: 0,
        valueUSD: 0,
      });
    }

    const group = groups.get(key);
    group.count += 1;
    group.valueUSD += toNumber(asset.valueUSD);
  });

  return [...groups.values()].sort((a, b) => b.valueUSD - a.valueUSD);
};