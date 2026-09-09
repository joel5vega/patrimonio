import { useCallback, useEffect, useRef, useState } from 'react';

export function usePortfolioQuotes({
  loading = false,
  refreshMarketQuotes,
} = {}) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const automaticRefreshStartedRef = useRef(false);

  const refreshQuotes = useCallback(
    async ({ force = false } = {}) => {
      if (typeof refreshMarketQuotes !== 'function') {
        const nextError =
          'La actualización de cotizaciones no está disponible.';

        setError(nextError);

        return {
          ok: false,
          message: nextError,
        };
      }

      if (refreshing) {
        return {
          ok: false,
          message: 'Ya se están actualizando las cotizaciones.',
        };
      }

      setRefreshing(true);
      setMessage('');
      setError('');

      try {
        const result = await refreshMarketQuotes({
          force,
        });

        if (result?.ok === false) {
          throw new Error(
            result.message ||
              'No se pudieron actualizar las cotizaciones.',
          );
        }

        const refreshed = Number(result?.refreshed || 0);

        const nextMessage = refreshed > 0
          ? `${refreshed} precio(s) actualizado(s).`
          : 'Cotizaciones verificadas.';

        setMessage(nextMessage);

        console.log(
          '[Portfolio quotes] Refresh exitoso:',
          result,
        );

        return {
          ok: true,
          ...result,
        };
      } catch (refreshError) {
        const nextError =
          refreshError?.message ||
          'No se pudieron actualizar las cotizaciones.';

        console.error(
          '[Portfolio quotes] Error actualizando:',
          refreshError,
        );

        setError(nextError);

        return {
          ok: false,
          message: nextError,
        };
      } finally {
        setRefreshing(false);
      }
    },
    [refreshMarketQuotes, refreshing],
  );

  useEffect(() => {
    if (
      loading ||
      automaticRefreshStartedRef.current ||
      typeof refreshMarketQuotes !== 'function'
    ) {
      return;
    }

    automaticRefreshStartedRef.current = true;

    refreshQuotes({
      force: false,
    });
  }, [
    loading,
    refreshMarketQuotes,
    refreshQuotes,
  ]);

  return {
    refreshingQuotes: refreshing,
    quoteMessage: message,
    quoteError: error,

    // Botón manual: forzar actualización, aunque cache aún esté vigente.
    refreshQuotesNow: () =>
      refreshQuotes({
        force: true,
      }),
  };
}