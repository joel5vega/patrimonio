// src/features/portfolio/hooks/useETFExposure.js

import { useEffect, useMemo, useState } from 'react';

/**
 * Hook para obtener exposición de ETFs.
 *
 * Estrategia:
 * 1. Intenta cargar /data/etf-exposure.json (generado por script)
 * 2. Si falla, no hace fallback (no hay hardcoded en frontend)
 *
 * @param {Array<{ symbol: string, type: string }>} assets - Lista de activos
 */
export function useETFExposure(assets = []) {
  const etfSymbols = useMemo(
    () =>
      [
        ...new Set(
          assets
            .filter((asset) => asset?.type === 'etf')
            .map((asset) => asset?.symbol)
            .filter(Boolean),
        ),
      ],
    [assets],
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
        // ✅ FIX: usar BASE_URL en vez de "/" hardcodeado
        const baseUrl = import.meta.env.BASE_URL || '/';
        const url = `${baseUrl}data/etf-exposure.json`.replace(
          /\/+/g,
          '/',
        );
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        const json = await response.json();
        const etfs = json?.etfs ?? {};
        const lastUpdated = json?.lastUpdated ?? null;

        // Filtrar solo los ETFs del portfolio
        const filteredData = {};

        for (const symbol of etfSymbols) {
          if (etfs[symbol]) {
            filteredData[symbol] = etfs[symbol];
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
        console.warn(
          'No se pudo cargar etf-exposure.json:',
          error.message,
        );

        if (!cancelled) {
          setState({
            data: {},
            loading: false,
            error: error.message,
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