// src/features/portfolio/hooks/usePortfolioQuotes.js
import {
  useCallback,
  useState,
} from "react";

export function usePortfolioQuotes({
  refreshMarketQuotes,
  refreshBinanceSnapshot,
  refreshAll,
} = {}) {
  const [refreshing, setRefreshing] =
    useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshQuotes = useCallback(
    async ({
      force = false,
      includeBinance = false,
    } = {}) => {
      if (refreshing) {
        const nextMessage =
          "Ya se está ejecutando una actualización.";
        setMessage(nextMessage);

        return {
          ok: false,
          message: nextMessage,
        };
      }

      const canRefreshMarket =
        typeof refreshMarketQuotes === "function";

      const canRefreshBinance =
        includeBinance &&
        typeof refreshBinanceSnapshot === "function";

      if (!canRefreshMarket && !canRefreshBinance) {
        const nextError =
          "No hay ninguna función de actualización disponible.";
        setError(nextError);

        return {
          ok: false,
          message: nextError,
        };
      }

      setRefreshing(true);
      setMessage("");
      setError("");

      try {
        const tasks = [];

        if (canRefreshMarket) {
          tasks.push(
            Promise.resolve(
              refreshMarketQuotes({ force }),
            ).then((result) => {
              if (result?.ok === false) {
                throw new Error(
                  result.message ||
                    "Falló la actualización de cotizaciones.",
                );
              }

              return {
                source: "quantfury",
                result,
              };
            }),
          );
        }

        if (canRefreshBinance) {
          tasks.push(
            Promise.resolve(
              refreshBinanceSnapshot(),
            ).then((result) => {
              if (result?.ok === false) {
                throw new Error(
                  result.error ||
                    result.message ||
                    "Falló el snapshot de Binance.",
                );
              }

              return {
                source: "binance",
                result,
              };
            }),
          );
        }

        const results = await Promise.all(tasks);

        if (typeof refreshAll === "function") {
          await refreshAll();
        }

        const nextMessage = includeBinance
          ? "Binance y cotizaciones actualizados."
          : "Cotizaciones actualizadas.";

        setMessage(nextMessage);

        return {
          ok: true,
          force,
          includeBinance,
          results,
        };
      } catch (refreshError) {
        const nextError =
          refreshError?.message ||
          "No se pudieron actualizar los datos de mercado.";

        setError(nextError);

        return {
          ok: false,
          message: nextError,
        };
      } finally {
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

  const refreshPortfolioPrices = useCallback(
    () =>
      refreshQuotes({
        force: true,
        includeBinance: true,
      }),
    [refreshQuotes],
  );

  const refreshQuotesNow = useCallback(
    () =>
      refreshQuotes({
        force: true,
        includeBinance: false,
      }),
    [refreshQuotes],
  );

  return {
    refreshingQuotes: refreshing,
    quoteMessage: message,
    quoteError: error,
    refreshPortfolioPrices,
    refreshQuotesNow,
  };
}