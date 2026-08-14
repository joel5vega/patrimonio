import { useMemo, useState } from 'react';
import { selectAssetsByTab, selectInvestableAssets, sortAssetsByValue } from '../utils/portfolioSelectors';

export function usePortfolioFilters(assets = []) {
  const [activeTab, setActiveTab] = useState('all');
  const [visibleGroups, setVisibleGroups] = useState({});

  const investableAssets = useMemo(
    () => selectInvestableAssets(assets),
    [assets],
  );

  const filteredAssets = useMemo(
    () => sortAssetsByValue(selectAssetsByTab(investableAssets, activeTab))
      .filter((asset) => visibleGroups[asset.groupKey] !== false),
    [investableAssets, activeTab, visibleGroups],
  );

  const toggleGroup = (groupKey) => {
    setVisibleGroups((current) => ({
      ...current,
      [groupKey]: current[groupKey] === false,
    }));
  };

  return {
    activeTab,
    setActiveTab,
    visibleGroups,
    setVisibleGroups,
    filteredAssets,
    investableAssets,
    toggleGroup,
  };
}