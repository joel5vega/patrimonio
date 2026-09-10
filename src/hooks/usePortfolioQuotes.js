// src/features/portfolio/hooks/usePortfolioQuotes.js
import { useCallback, useEffect, useRef, useState } from "react";

export function usePortfolioQuotes({
  loading = false,
  refreshMarketQuotes,
  refreshBinanceSnapshot,
  refreshAll,
} = {}) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const automaticRefreshStartedRef = useRef(false);

  const refreshQuotes = useCallback(
    async ({ force = false, includeBinance = false } = {}) => {
      if (refreshing) {
        return {
          ok: false,
          message: "Ya se está ejecutando una actualización.",
        };
      }

      if (
        typeof refreshMarketQuotes !== "function" &&
        !(includeBinance && typeof refreshBinanceSnapshot === "function")
      ) {
        const nextError = "La actualización de cotizaciones no está disponible.";
        setError(nextError);
        return { ok: false, message: nextError };
      }

      setRefreshing(true);
      setMessage("");
      setError("");

      try {
        const tasks = [];

        // Quotes Quantfury: al abrir, respeta el TTL; con botón se fuerza.
        if (typeof refreshMarketQuotes === "function") {
          tasks.push(
            refreshMarketQuotes({ force }),
          );
        }

        // Snapshot Binance: se invoca solo desde el botón manual.
        if (
          includeBinance &&
          typeof refreshBinanceSnapshot === "function"
        ) {
          tasks.push(
            refreshBinanceSnapshot(),
          );
        }

        const settled = await Promise.allSettled(tasks);
        const failures = settled.filter(
          (result) => result.status === "rejected",
        );

        if (failures.length) {
          throw failures[0].reason;
        }

        const results = settled.map(
          (result) => result.value,
        );

        const marketResult = results.find(
          (result) => Object.prototype.hasOwnProperty.call(result || {}, "refreshed"),
        );

        if (marketResult?.ok === false) {
          throw new Error(
            marketResult.message ||
              "No se pudieron actualizar las cotizaciones.",
          );
        }

        // Recarga snapshots/análisis una vez terminado todo el refresh.
        if (typeof refreshAll === "function") {
          await refreshAll();
        }

        const refreshedQuotes = Number(
          marketResult?.refreshed || 0,
        );

        const nextMessage = includeBinance
          ? "Binance y cotizaciones de mercado actualizados."
          : refreshedQuotes > 0
            ? `${refreshedQuotes} cotización(es) actualizada(s).`
            : "Cotizaciones verificadas.";

        setMessage(nextMessage);

        console.log("[Portfolio quotes] Refresh exitoso", {
          force,
          includeBinance,
          results,
        });

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

        console.error(
          "[Portfolio quotes] Error actualizando:",
          refreshError,
        );

        setError(nextError);
        return { ok: false, message: nextError };
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

  useEffect(() => {
    if (loading || automaticRefreshStartedRef.current) {
      return;
    }

    automaticRefreshStartedRef.current = true;

    // Al montar: solamente Quantfury y con TTL.
    // No forzar Binance automáticamente para no gastar API calls.
    refreshQuotes({
      force: false,
      includeBinance: false,
    });
  }, [loading, refreshQuotes]);

  return {
    refreshingQuotes: refreshing,
    quoteMessage: message,
    quoteError: error,

    // Botón principal: Binance + Quantfury; fuerza el TTL de quotes.
    refreshPortfolioPrices: () =>
      refreshQuotes({
        force: true,
        includeBinance: true,
      }),

    // Opcional si luego quieres un botón dedicado solo a Quantfury.
    refreshQuotesNow: () =>
      refreshQuotes({
        force: true,
        includeBinance: false,
      }),
  };
}