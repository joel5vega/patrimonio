import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getLatestBinanceSnapshot, getAdmiralsSnapshots, getStatements, getReports, getSnapshotHistory } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useManualAssets } from '../hooks/useManualAssets';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const manualCtx = useManualAssets();

  const [binanceSnap, setBinanceSnap]     = useState(null);
  const [admiralsSnaps, setAdmiralsSnaps] = useState([]);
  const [statements, setStatements]       = useState([]);
  const [reports, setReports]             = useState([]);
  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [binance, admirals, stmts, rpts, hist] = await Promise.all([
        getLatestBinanceSnapshot(),
        getAdmiralsSnapshots(),
        getStatements(50),
        getReports(20),
        getSnapshotHistory(90),
      ]);
      setBinanceSnap(binance);
      setAdmiralsSnaps(admirals);
      setStatements(stmts);
      setReports(rpts);
      setHistory(hist);
    } catch (e) {
      if (e?.message === 'permission error') return;
      console.error('Error fetching data:', e);
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchAll();
  }, [user, fetchAll]);

  // ─── BINANCE ─────────────────────────────────────────────
  const bs = binanceSnap?.snapshot || {};
  const cryptoAssets = (bs.assets || []).map((a, i) => ({
    id: i, name: a.asset, symbol: a.asset, type: 'crypto',
    quantity: a.amount ?? 0, avgBuyPrice: 0, currentPrice: a.price ?? 0,
    valueUSD: a.valueUSD ?? 0,
    netExposureUSD: a.netExposureUSD ?? a.valueUSD ?? 0,
    weightPct: a.weightPct ?? 0,
    pendingBuyUSD: a.pendingBuyUSD ?? 0,
    unrealizedPL: null,
  }));
  const totalCryptoUSD = bs.totalPortfolioUSD ?? bs.balancesUSD ?? 0;

  const riskData = {
    totalSpotUSD:      totalCryptoUSD,
    reservedCapital:   bs.reservedCapitalUSD ?? 0,
    hhi:               bs.riskMetrics?.herfindahlIndex ?? 0,
    top3Concentration: bs.riskMetrics?.top3ConcentrationPct ?? 0,
    riskScore:         bs.riskMetrics?.riskScore ?? 0,
    openOrdersCount:   bs.openOrdersCount ?? 0,
    overExposed: (bs.portfolioHealth?.overExposedAssets || []).map((asset) => {
      const found = (bs.assets || []).find((a) => a.asset === asset);
      return { asset, weight: found?.weightPct ?? 0 };
    }),
  };

  // ─── ADMIRALS ────────────────────────────────────────────
  const inversionSnap = admiralsSnaps.find((s) => s.accountType === 'inversion');
  const tradeSnap     = admiralsSnaps.find((s) => s.accountType === 'trade');
  const inversionPositions = (inversionSnap?.snapshot?.portfolioStats?.positions || []).map((p) => ({
    id: p.ticket, name: p.symbol, symbol: p.symbol, type: 'etf',
    quantity: p.size, avgBuyPrice: p.entry, currentPrice: p.marketPrice,
    valueUSD: p.marketValue ?? 0, valueBOB: (p.marketValue ?? 0) * 6.96,
    weightPct: p.weight ?? 0, unrealizedPL: p.unrealizedPL ?? 0,
    tp: p.tp, sl: p.sl,
  }));
  const totalInversionUSD = inversionSnap?.snapshot?.portfolioStats?.totalMarketValue ?? 0;
  const totalInversionPnl = inversionSnap?.snapshot?.portfolioStats?.totalUnrealizedPL ?? 0;

  // ─── TOTALES GLOBALES ─────────────────────────────────────
  const totalValue = (totalCryptoUSD + totalInversionUSD + manualCtx.totalManualUSD) * 6.96;
  const totalPnl   = totalInversionPnl;

  // ─── PIE DATA — 3 segmentos + manuales por tipo ──────────
// Paleta de 8 colores para activos manuales
const MANUAL_COLORS = [
  '#8b5cf6', // violeta
  '#10b981', // esmeralda
  '#f59e0b', // ámbar
  '#ec4899', // rosa
  '#06b6d4', // cyan
  '#84cc16', // lima
  '#f97316', // naranja claro
  '#6366f1', // indigo
];

const manualPieSlices = (manualCtx.manualAssets || [])
  .filter((a) => a.valueUSD > 0)
  .reduce((acc, a) => {
    const existing = acc.find((x) => x.label === a.name);
    if (existing) { existing.valueUSD += a.valueUSD; }
    else {
      acc.push({
        label: a.label,
        valueUSD: a.valueUSD,
        color: MANUAL_COLORS[acc.length % MANUAL_COLORS.length], // ← color por índice
      });
    }
    return acc;
  }, []);


const pieData = [
  { label: 'Crypto', valueUSD: totalCryptoUSD,   color: '#f97316' },
  { label: 'ETFs',   valueUSD: totalInversionUSD, color: '#3b82f6' },
  ...manualPieSlices,
].filter((d) => d.valueUSD > 0);

  const transactions = statements.map((st) => ({
    id: st.id,
    title: st.subject || `${(st.accountType || 'broker').toUpperCase()} Statement`,
    subtitle: `${st.accountType || 'Broker'} • ${st.statementDate || ''}`,
    amount: st.summary?.closedTradePL != null
      ? `${st.summary.closedTradePL >= 0 ? '+' : ''}$${st.summary.closedTradePL.toFixed(2)}`
      : `fPL: $${(st.floatingPL ?? 0).toFixed(2)}`,
    type: ((st.summary?.closedTradePL ?? st.floatingPL ?? 0) >= 0) ? 'up' : 'down',
    category: st.accountType || 'trade', date: st.statementDate,
  }));

  const accounts = {
    sections: [
      {
        title: 'Binance Crypto', iconType: 'crypto', isLiability: false,
        totalBOB: totalCryptoUSD * 6.96,
        items: cryptoAssets.filter((a) => a.netExposureUSD > 0).map((a) => ({
          name: a.symbol, displayValue: `$${a.netExposureUSD.toFixed(2)}`,
          currency: 'USD', valueBOB: a.netExposureUSD * 6.96,
        })),
      },
      {
        title: 'Admirals Inversión', iconType: 'etf', isLiability: false,
        totalBOB: totalInversionUSD * 6.96,
        items: inversionPositions.map((p) => ({
          name: p.symbol, displayValue: `$${p.valueUSD.toFixed(2)}`,
          currency: 'USD', valueBOB: p.valueBOB, pnl: p.unrealizedPL,
        })),
      },
      {
        title: 'Activos Manuales', iconType: 'manual', isLiability: false,
        totalBOB: manualCtx.totalManualUSD * 6.96,
        items: manualCtx.manualAssets.map((a) => ({
          name: a.name, displayValue: a.currency === 'BOB' ? `Bs ${a.amount.toFixed(2)}` : `$${a.amount.toFixed(2)}`,
          currency: a.currency, valueBOB: a.valueBOB,
        })),
      },
    ],
  };

  return (
    <AppContext.Provider value={{
      cryptoAssets, totalCryptoUSD,
      inversionPositions, totalInversionUSD, totalInversionPnl,
      inversionSnap, tradeSnap, binanceSnap,
      assets: [...cryptoAssets, ...inversionPositions, ...manualCtx.manualAssets],
      totalValue, totalPnl,
      pieData, riskData, loadingRisk: loading,
      transactions, accounts,
      reports, loadingReports: loading, refreshReports: fetchAll,
      chartHistory: history,
      loading, error,
      snapshot: binanceSnap,
      // Manual assets
      ...manualCtx,
      bankEmails: [], importBankEmail: () => {},
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
