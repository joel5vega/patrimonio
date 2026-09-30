// src/features/portfolio/hooks/usePortfolioQuotes.js
import {
  useCallback,
  useState,
} from "react";

function normalizeResult(result, fallbackMessage) {
  if (result?.ok === false) {
    throw new Error(
      result?.error ||
        result?.message ||
        fallbackMessage,
    );
  }

  return result ?? null;
}

export function usePortfolioQuotes({
  refreshMarketQuotes,
  refreshBinanceSnapshot,
  refreshBybitSnapshot,
  refreshAll,
} = {}) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshQuotes = useCallback(
    async ({
      force = false,
      includeBinance = false,
      includeBybit = false,
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

      const canRefreshBybit =
        includeBybit &&
        typeof refreshBybitSnapshot === "function";

      if (
        !canRefreshMarket &&
        !canRefreshBinance &&
        !canRefreshBybit
      ) {
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
        const sources = [];

        // 1. Quantfury / market quotes
        if (canRefreshMarket) {
          sources.push("cotizaciones");

          tasks.push(
            Promise.resolve(
              refreshMarketQuotes({ force }),
            ).then((result) => ({
              source: "quantfury",
              result: normalizeResult(
                result,
                "Falló la actualización de cotizaciones.",
              ),
            })),
          );
        }

        // 2. Binance
        if (canRefreshBinance) {
          sources.push("Binance");

          tasks.push(
            Promise.resolve(
              refreshBinanceSnapshot(),
            ).then((result) => ({
              source: "binance",
              result: normalizeResult(
                result,
                "Falló el snapshot de Binance.",
              ),
            })),
          );
        }

        // 3. Bybit
        if (canRefreshBybit) {
          sources.push("Bybit");

          tasks.push(
            Promise.resolve(
              refreshBybitSnapshot(),
            ).then((result) => ({
              source: "bybit",
              result: normalizeResult(
                result,
                "Falló el snapshot de Bybit.",
              ),
            })),
          );
        }

        const results = await Promise.all(tasks);

        if (typeof refreshAll === "function") {
          await refreshAll();
        }

        const nextMessage =
          sources.length > 0
            ? `${sources.join(" y ")} actualizados.`
            : "Datos actualizados.";

        setMessage(nextMessage);

        return {
          ok: true,
          force,
          includeBinance,
          includeBybit,
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
      refreshBybitSnapshot,
      refreshMarketQuotes,
      refreshing,
    ],
  );

  const refreshPortfolioPrices = useCallback(
    () =>
      refreshQuotes({
        force: true,
        includeBinance: true,
        includeBybit: true,
      }),
    [refreshQuotes],
  );

  const refreshQuotesNow = useCallback(
    () =>
      refreshQuotes({
        force: true,
        includeBinance: false,
        includeBybit: false,
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