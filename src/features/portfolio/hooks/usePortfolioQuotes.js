// src/features/portfolio/hooks/usePortfolioQuotes.js

import {
  useCallback,
  useState,
} from "react";

function normalizeResult(
  result,
  fallbackMessage,
) {
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
  refreshWallbitSnapshot,
  refreshAll,
} = {}) {
  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const refreshQuotes = useCallback(
    async ({
      force = false,
      includeBinance = false,
      includeBybit = false,
      includeWallbit = false,
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

      const canRefreshWallbit =
        includeWallbit &&
        typeof refreshWallbitSnapshot === "function";

      if (
        !canRefreshMarket &&
        !canRefreshBinance &&
        !canRefreshBybit &&
        !canRefreshWallbit
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

        if (canRefreshBinance) {
          sources.push("Binance");

          tasks.push(
            Promise.resolve(
              refreshBinanceSnapshot({
                slot: "manual",
              }),
            ).then((result) => ({
              source: "binance",
              result: normalizeResult(
                result,
                "Falló el snapshot de Binance.",
              ),
            })),
          );
        }

        if (canRefreshBybit) {
          sources.push("Bybit");

          tasks.push(
            Promise.resolve(
              refreshBybitSnapshot({
                slot: "manual",
              }),
            ).then((result) => ({
              source: "bybit",
              result: normalizeResult(
                result,
                "Falló el snapshot de Bybit.",
              ),
            })),
          );
        }

        if (canRefreshWallbit) {
          sources.push("Wallbit");

          tasks.push(
            Promise.resolve(
              refreshWallbitSnapshot({
                slot: "manual",
              }),
            ).then((result) => ({
              source: "wallbit",
              result: normalizeResult(
                result,
                "Falló el snapshot de Wallbit.",
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
          includeWallbit,
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
      refreshWallbitSnapshot,
      refreshing,
    ],
  );

  const refreshPortfolioPrices = useCallback(
    () =>
      refreshQuotes({
        force: true,
        includeBinance: true,
        includeBybit: true,
        includeWallbit: true,
      }),
    [refreshQuotes],
  );

  const refreshQuotesNow = useCallback(
    () =>
      refreshQuotes({
        force: true,
        includeBinance: false,
        includeBybit: false,
        includeWallbit: false,
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