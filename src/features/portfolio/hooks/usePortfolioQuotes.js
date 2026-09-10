// src/features/portfolio/hooks/usePortfolioQuotes.js
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export function usePortfolioQuotes({
  loading = false,
  refreshMarketQuotes,
  refreshBinanceSnapshot,
  refreshAll,
} = {}) {
  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const automaticRefreshStartedRef =
    useRef(false);

  const refreshQuotes = useCallback(
    async ({
      force = false,
      includeBinance = false,
    } = {}) => {
      console.log(
        '[Portfolio quotes] refreshQuotes iniciado',
        {
          force,
          includeBinance,
          hasMarketRefresh:
            typeof refreshMarketQuotes === 'function',
          hasBinanceRefresh:
            typeof refreshBinanceSnapshot === 'function',
          hasRefreshAll:
            typeof refreshAll === 'function',
        },
      );

      if (refreshing) {
        console.warn(
          '[Portfolio quotes] Ya existe un refresh en progreso',
        );

        return {
          ok: false,
          message:
            'Ya se está ejecutando una actualización.',
        };
      }

      const canRefreshMarket =
        typeof refreshMarketQuotes === 'function';

      const canRefreshBinance =
        includeBinance &&
        typeof refreshBinanceSnapshot === 'function';

      if (!canRefreshMarket && !canRefreshBinance) {
        const nextError =
          'No hay ninguna función de actualización disponible.';

        console.error(
          '[Portfolio quotes] Funciones no disponibles',
          {
            canRefreshMarket,
            canRefreshBinance,
          },
        );

        setError(nextError);

        return {
          ok: false,
          message: nextError,
        };
      }

      setRefreshing(true);
      setMessage('');
      setError('');

      try {
        const tasks = [];

        if (canRefreshMarket) {
          console.log(
            '[Portfolio quotes] Iniciando Quantfury',
          );

          tasks.push(
            refreshMarketQuotes({
              force,
            }).then((result) => {
              console.log(
                '[Portfolio quotes] Quantfury terminó',
                result,
              );

              if (result?.ok === false) {
                throw new Error(
                  result.message ||
                    'Falló la actualización de Quantfury.',
                );
              }

              return {
                source: 'quantfury',
                result,
              };
            }),
          );
        }

        if (canRefreshBinance) {
          console.log(
            '[Portfolio quotes] Iniciando Binance snapshot',
          );

          tasks.push(
            refreshBinanceSnapshot().then((result) => {
              console.log(
                '[Portfolio quotes] Binance terminó',
                result,
              );

              if (result?.ok === false) {
                throw new Error(
                  result.error ||
                    result.message ||
                    'Falló el snapshot de Binance.',
                );
              }

              return {
                source: 'binance',
                result,
              };
            }),
          );
        }

        console.log(
          '[Portfolio quotes] Tareas iniciadas:',
          tasks.length,
        );

        const results = await Promise.all(tasks);

        console.log(
          '[Portfolio quotes] Todas las tareas terminaron',
          results,
        );

        if (typeof refreshAll === 'function') {
          console.log(
            '[Portfolio quotes] Ejecutando refreshAll',
          );

          await refreshAll();

          console.log(
            '[Portfolio quotes] refreshAll terminó',
          );
        }

        const nextMessage = includeBinance
          ? 'Binance y cotizaciones actualizados.'
          : 'Cotizaciones verificadas.';

        setMessage(nextMessage);

        return {
          ok: true,
          force,
          includeBinance,
          results,
        };
      } catch (refreshError) {
        console.error(
          '[Portfolio quotes] Error actualizando',
          {
            code: refreshError?.code,
            message: refreshError?.message,
            details: refreshError?.details,
            stack: refreshError?.stack,
          },
        );

        const nextError =
          refreshError?.message ||
          'No se pudieron actualizar los datos de mercado.';

        setError(nextError);

        return {
          ok: false,
          message: nextError,
        };
      } finally {
        console.log(
          '[Portfolio quotes] Finalizando refresh',
        );

        setRefreshing(false);
      }
    },
    [
      refreshAll,
      refreshBinanceSnapshot,
      refreshMarketQuotes,
      refreshing,
    ],
  );

  useEffect(() => {
    if (
      loading ||
      automaticRefreshStartedRef.current
    ) {
      return;
    }

    automaticRefreshStartedRef.current = true;

    // Al abrir la página solo se consultan quotes de Quantfury.
    // Binance se ejecuta únicamente con el botón manual.
    refreshQuotes({
      force: false,
      includeBinance: false,
    }).catch((error) => {
      console.error(
        '[Portfolio quotes] Error automático',
        error,
      );
    });
  }, [loading, refreshQuotes]);

  return {
    refreshingQuotes: refreshing,
    quoteMessage: message,
    quoteError: error,

    // Esta es la función que Portfolio.jsx ya está usando.
    refreshPortfolioPrices: () =>
      refreshQuotes({
        force: true,
        includeBinance: true,
      }),

    // Opcional: solo Quantfury.
    refreshQuotesNow: () =>
      refreshQuotes({
        force: true,
        includeBinance: false,
      }),
  };
}