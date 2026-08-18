// hooks/useETFExposure.js

import { useEffect, useMemo, useState } from 'react';
import { getVanguardETFExposure } from '../services/vanguardETFData';

/**
 * Hook para obtener exposición de ETFs.
 * Intenta cargar desde /data/etf-exposure.json, y si falla usa datos hardcodeados.
 * 
 * @param {Array<{ symbol: string, type: string }>} assets - Lista de activos
 * @returns {{
 *   data: Record<string, any>,
 *   loading: boolean,
 *   error: Error | null,
 *   symbols: string[],
 *   lastUpdated: string | null
 * }}
 */
export function useETFExposure(assets = []) {
  const etfSymbols = useMemo(
    () =>
      [
        ...new Set(
          assets
            .filter((asset) => asset?.type === 'etf')
            .map((asset) => asset?.symbol)
            .filter(Boolean)
        ),
      ],
    [assets]
  );

  const [state, setState] = useState({
    data: {},
    loading: true,
    error: null,
    lastUpdated: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!etfSymbols.length) {
        setState({
          data: {},
          loading: false,
          error: null,
          lastUpdated: null,
        });
        return;
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      try {
        // Intentar cargar desde archivo JSON estático
        const response = await fetch('/data/etf-exposure.json');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const etfs = json.etfs || {};
        const lastUpdated = json.lastUpdated || null;

        // Filtrar solo los ETFs que tenemos en el portfolio
        const filteredData = {};
        
        for (const symbol of etfSymbols) {
          if (etfs[symbol]) {
            filteredData[symbol] = etfs[symbol];
          } else {
            // Fallback a datos hardcodeados si el ETF no está en el JSON
            const hardcoded = getVanguardETFExposure(symbol);
            if (hardcoded) {
              filteredData[symbol] = hardcoded;
            }
          }
        }

        if (!cancelled) {
          setState({
            data: filteredData,
            loading: false,
            error: null,
            lastUpdated,
          });
        }
      } catch (error) {
        console.warn('Error loading ETF exposure from JSON, using hardcoded data:', error);

        // Fallback: usar datos hardcodeados
        const fallbackData = {};
        
        for (const symbol of etfSymbols) {
          const hardcoded = getVanguardETFExposure(symbol);
          if (hardcoded) {
            fallbackData[symbol] = hardcoded;
          }
        }

        if (!cancelled) {
          setState({
            data: fallbackData,
            loading: false,
            error: null, // No exponer error al usuario si tenemos fallback
            lastUpdated: null,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [etfSymbols]);

  return {
    ...state,
    symbols: etfSymbols,
  };
}