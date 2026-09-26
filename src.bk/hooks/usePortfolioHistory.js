// usePortfolioHistory.js
// Consume chartHistory de AppContext y genera análisis de tendencias históricas.
// No modifica AppContext ni buildPortfolioV3.

import { useMemo } from 'react';

/**
 * Procesa el array chartHistory (snapshots diarios de Firestore) y retorna
 * métricas calculadas listas para graficar o mostrar en UI.
 *
 * Estructura de cada snapshot en chartHistory:
 * {
 *   date: '2026-06-05',
 *   cryptoUSD, inversionUSD, totalPortfolioUSD,
 *   manual_AirTM, manual_SAFI, manual_Ahorro, manual_AhorroBs,
 *   role_core, role_growth, role_defensive, role_liquidity,
 *   role_yield, role_speculative, role_trading
 * }
 */
export function usePortfolioHistory(chartHistory = []) {
  return useMemo(() => {
    if (!chartHistory.length) return null;

    // Ordenar por fecha ascendente
    const sorted = [...chartHistory]
      .filter(d => d?.date && d?.totalPortfolioUSD != null)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!sorted.length) return null;

    // ── Serie de patrimonio total ────────────────────────────
    const series = sorted.map(d => {
      const manualUSD =
        (d.manual_AirTM    ?? 0) +
        (d.manual_SAFI     ?? 0) +
        (d.manual_Ahorro   ?? 0);

      const investable = (d.role_core        ?? 0) +
                         (d.role_growth      ?? 0) +
                         (d.role_defensive   ?? 0) +
                         (d.role_liquidity   ?? 0) +
                         (d.role_yield       ?? 0) +
                         (d.role_speculative ?? 0) +
                         (d.role_trading     ?? 0);

      return {
        date:            d.date,
        totalUSD:        d.totalPortfolioUSD,
        cryptoUSD:       d.cryptoUSD       ?? 0,
        inversionUSD:    d.inversionUSD    ?? 0,
        manualUSD,
        investableUSD:   investable > 0 ? investable : null, // null si no hay role_* guardados
        // roles (en USD absoluto)
        role_core:        d.role_core        ?? null,
        role_growth:      d.role_growth      ?? null,
        role_defensive:   d.role_defensive   ?? null,
        role_liquidity:   d.role_liquidity   ?? null,
        role_yield:       d.role_yield       ?? null,
        role_speculative: d.role_speculative ?? null,
        role_trading:     d.role_trading     ?? null,
      };
    });

    // ── Retorno total del período ───────────────────────────
    const first = series[0];
    const last  = series[series.length - 1];
    const totalReturnUSD = last.totalUSD - first.totalUSD;
    const totalReturnPct = first.totalUSD > 0
      ? (totalReturnUSD / first.totalUSD) * 100
      : 0;

    // ── Retornos rodantes (30d, 90d) ────────────────────────
    const getNDaysAgo = (n) => {
      const ref = new Date(last.date);
      ref.setDate(ref.getDate() - n);
      return ref.toISOString().split('T')[0];
    };

    const findClosest = (targetDate) =>
      series.reduce((prev, curr) =>
        Math.abs(curr.date.localeCompare(targetDate)) <
        Math.abs(prev.date.localeCompare(targetDate)) ? curr : prev
      );

    const snap30  = findClosest(getNDaysAgo(30));
    const snap90  = findClosest(getNDaysAgo(90));
    const snap180 = findClosest(getNDaysAgo(180));

    const rollingReturn = (snapBase) => {
      if (!snapBase || snapBase.totalUSD === 0) return null;
      return Number(((last.totalUSD - snapBase.totalUSD) / snapBase.totalUSD * 100).toFixed(2));
    };

    // ── Drawdown máximo ─────────────────────────────────────
    let peak = series[0].totalUSD;
    let maxDrawdownPct = 0;
    series.forEach(d => {
      if (d.totalUSD > peak) peak = d.totalUSD;
      const dd = peak > 0 ? (d.totalUSD - peak) / peak * 100 : 0;
      if (dd < maxDrawdownPct) maxDrawdownPct = dd;
    });

    // ── Volatilidad semanal (std dev de cambios semanales) ──
    const weeklyChanges = [];
    for (let i = 7; i < series.length; i++) {
      const prev = series[i - 7];
      if (prev.totalUSD > 0) {
        weeklyChanges.push((series[i].totalUSD - prev.totalUSD) / prev.totalUSD * 100);
      }
    }
    const weeklyVolatility = weeklyChanges.length > 1
      ? (() => {
          const mean = weeklyChanges.reduce((s, v) => s + v, 0) / weeklyChanges.length;
          const variance = weeklyChanges.reduce((s, v) => s + (v - mean) ** 2, 0) / weeklyChanges.length;
          return Number(Math.sqrt(variance).toFixed(2));
        })()
      : null;

    // ── Días con portfolio >N alertas (si tienes role_* guardados) ──
    const daysUnderCore = series.filter(d => {
      if (d.role_core == null || d.investableUSD == null || d.investableUSD === 0) return false;
      return (d.role_core / d.investableUSD * 100) < 30;
    }).length;

    // ── Contribución por fuente al crecimiento ───────────────
    // (estimación: diferencia entre primer y último snapshot por fuente)
    const growthBySource = {
      crypto:    Number((last.cryptoUSD    - first.cryptoUSD).toFixed(2)),
      inversion: Number((last.inversionUSD - first.inversionUSD).toFixed(2)),
      manual:    Number((last.manualUSD    - first.manualUSD).toFixed(2)),
    };

    // ── Tendencia de composición (últimas 4 semanas) ─────────
    // Porcentaje de cada fuente al inicio vs fin del período disponible
    const compositionStart = first.totalUSD > 0 ? {
      cryptoPct:    Number((first.cryptoUSD    / first.totalUSD * 100).toFixed(1)),
      inversionPct: Number((first.inversionUSD / first.totalUSD * 100).toFixed(1)),
      manualPct:    Number((first.manualUSD    / first.totalUSD * 100).toFixed(1)),
    } : null;

    const compositionEnd = last.totalUSD > 0 ? {
      cryptoPct:    Number((last.cryptoUSD    / last.totalUSD * 100).toFixed(1)),
      inversionPct: Number((last.inversionUSD / last.totalUSD * 100).toFixed(1)),
      manualPct:    Number((last.manualUSD    / last.totalUSD * 100).toFixed(1)),
    } : null;

    // ── Mejor y peor semana ──────────────────────────────────
    let bestWeek  = { date: null, changePct: -Infinity };
    let worstWeek = { date: null, changePct:  Infinity };
    for (let i = 7; i < series.length; i++) {
      const prev = series[i - 7];
      if (prev.totalUSD > 0) {
        const pct = (series[i].totalUSD - prev.totalUSD) / prev.totalUSD * 100;
        if (pct > bestWeek.changePct)   bestWeek  = { date: series[i].date, changePct: Number(pct.toFixed(2)) };
        if (pct < worstWeek.changePct)  worstWeek = { date: series[i].date, changePct: Number(pct.toFixed(2)) };
      }
    }

    // ── CAGR estimado (si hay >1 año de datos) ───────────────
    const daysDiff = Math.max(1,
      (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)
    );
    const cagrPct = daysDiff >= 365 && first.totalUSD > 0
      ? Number(((Math.pow(last.totalUSD / first.totalUSD, 365 / daysDiff) - 1) * 100).toFixed(2))
      : null;

    return {
      series,                     // array completo para gráficas
      summary: {
        firstDate:          first.date,
        lastDate:           last.date,
        firstUSD:           Number(first.totalUSD.toFixed(2)),
        lastUSD:            Number(last.totalUSD.toFixed(2)),
        totalReturnUSD:     Number(totalReturnUSD.toFixed(2)),
        totalReturnPct:     Number(totalReturnPct.toFixed(2)),
        return30d:          rollingReturn(snap30),
        return90d:          rollingReturn(snap90),
        return180d:         rollingReturn(snap180),
        maxDrawdownPct:     Number(maxDrawdownPct.toFixed(2)),
        weeklyVolatility,
        cagrPct,
        daysDiff:           Math.round(daysDiff),
        daysTracked:        series.length,
        daysUnderCore,
      },
      growth: {
        bySource:       growthBySource,
        compositionStart,
        compositionEnd,
      },
      extremes: {
        bestWeek:  bestWeek.date  ? bestWeek  : null,
        worstWeek: worstWeek.date ? worstWeek : null,
        allTimePeakUSD: Number(peak.toFixed(2)),
      },
    };
  }, [chartHistory]);
}