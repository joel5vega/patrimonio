import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getQuantfuryImports,
  procesarQuantfuryPdf,
  subscribeQuantfuryAnalytics,
  subscribeQuantfuryHistory,
  subscribeQuantfurySnapshot,
} from '../lib/firebase';

function normalizeSummary(summary = {}) {
  return {
    ...summary,

    equityReal: Number(
      summary.equity_real ??
      summary.equityReal ??
      0,
    ),

    historyRows: Number(
      summary.history_rows ??
      summary.historyRows ??
      0,
    ),

    openPositionsCount: Number(
      summary.open_positions_count ??
      summary.openPositionsCount ??
      0,
    ),

    realizedPnl: Number(
      summary.realized_pnl ??
      summary.realizedPnl ??
      0,
    ),

    totalNotionalUsd: Number(
      summary.total_notional_usd ??
      summary.totalNotionalUsd ??
      0,
    ),

    winRate:
      summary.win_rate ??
      summary.winRate ??
      null,

    profitFactor:
      summary.profit_factor ??
      summary.profitFactor ??
      null,

    openLeverageX:
      summary.open_leverage_x ??
      summary.openLeverageX ??
      null,

    top3ConcentrationPct:
      summary.top3_concentration_pct ??
      summary.top3ConcentrationPct ??
      null,

    bySymbol:
      summary.by_symbol ??
      summary.bySymbol ??
      [],

    byAssetType:
      summary.by_asset_type ??
      summary.byAssetType ??
      [],

    topWinnersSymbols:
      summary.top_winners_symbols ??
      summary.topWinnersSymbols ??
      [],

    topLosersSymbols:
      summary.top_losers_symbols ??
      summary.topLosersSymbols ??
      [],
  };
}

export function useQuantfury() {
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [positions, setPositions] = useState([]);
  const [analyticsDocument, setAnalyticsDocument] = useState(null);
  const [imports, setImports] = useState([]);

  const [loading, setLoading] = useState(Boolean(user?.uid));
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lastImportResult, setLastImportResult] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setHistory([]);
      setPositions([]);
      setAnalyticsDocument(null);
      setImports([]);
      setLoading(false);
      setError(null);

      return undefined;
    }

    setLoading(true);
    setError(null);

    const handleError = (firebaseError) => {
      console.error('[Quantfury] Firestore:', firebaseError);
      setError(firebaseError);
      setLoading(false);
    };

    const unsubscribeHistory = subscribeQuantfuryHistory(
      user.uid,
      (items) => {
        setHistory(items);
        setLoading(false);
      },
      handleError,
    );

    const unsubscribePositions = subscribeQuantfurySnapshot(
      user.uid,
      setPositions,
      handleError,
    );

    const unsubscribeAnalytics = subscribeQuantfuryAnalytics(
      user.uid,
      setAnalyticsDocument,
      handleError,
    );

    getQuantfuryImports(user.uid)
      .then(setImports)
      .catch(handleError);

    return () => {
      unsubscribeHistory?.();
      unsubscribePositions?.();
      unsubscribeAnalytics?.();
    };
  }, [user?.uid]);

  const processPdf = useCallback(async ({ file, equity }) => {
    setProcessing(true);
    setError(null);

    try {
      const result = await procesarQuantfuryPdf({
        file,
        equity,
      });

      console.info('[Quantfury] importación completada', {
        importId: result.import_id,
        duplicate: result.duplicate,
        historyCount: result.history_count,
        positionCount: result.position_count,
      });

      setLastImportResult(result);

      return result;
    } catch (processingError) {
      console.error('[Quantfury] error de importación:', processingError);

      setError(processingError);

      throw processingError;
    } finally {
      setProcessing(false);
    }
  }, []);

  const analytics = useMemo(() => {
    const source =
      analyticsDocument?.summary ??
      analyticsDocument ??
      lastImportResult?.summary ??
      {};

    return normalizeSummary(source);
  }, [analyticsDocument, lastImportResult]);

  return {
    user,
    history,
    positions,
    imports,
    analytics,

    loading,
    processing,
    error,

    lastImportResult,
    processPdf,
  };
}