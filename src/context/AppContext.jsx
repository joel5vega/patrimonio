import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getLatestBinanceSnapshot, getAdmiralsSnapshots,
  getStatements, getReports, getSnapshotHistory,
  getAllDailySnapshots, savePortfolioSnapshot, getPortfolioHistory,
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useManualAssets, BOB_PER_USD } from '../hooks/useManualAssets';

const AppContext = createContext(null);

const MANUAL_COLORS = ['#a855f7', '#ec4899', '#facc15', '#06b6d4'];
const STABLES       = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD'];

async function fetchBobRate() {
  try {
    const res  = await fetch('https://bo.dolarapi.com/v1/dolares/binance');
    const data = await res.json();
    return data?.venta ?? data?.compra ?? null;
  } catch (e) {
    console.error('❌ fetchBobRate error:', e);
    return null;
  }
}

// Construye mapa { id: valueUSD } de activos manuales
const buildManualAssetsMap = (assets = []) =>
  Object.fromEntries(assets.map((a) => [a.id, a.valueUSD ?? 0]));

export const AppProvider = ({ children }) => {
  const { user } = useAuth();

  const [binanceSnap, setBinanceSnap]     = useState(null);
  const [admiralsSnaps, setAdmiralsSnaps] = useState([]);
  const [statements, setStatements]       = useState([]);
  const [reports, setReports]             = useState([]);
  const [history, setHistory]             = useState([]);
  const [chartHistory, setChartHistory]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [bobRate, setBobRate]             = useState(BOB_PER_USD);

  const totalsRef   = useRef({ cryptoUSD: 0, inversionUSD: 0 });
  const migratedRef = useRef(false);

  const manualCtx = useManualAssets(bobRate);

  // ─── Migración histórica ──────────────────────────────────
  const migrateHistoryOnce = useCallback(async (manualUSD, manualAssets) => {
    if (!user?.uid || migratedRef.current) return;
    migratedRef.current = true;

    const existing = await getPortfolioHistory(user.uid);
    if (existing.length > 1) return;

    console.log('📦 Iniciando migración...');
    const all = await getAllDailySnapshots();
    console.log('📥 dailyAccountSnapshots leídos:', all.length, 'docs');

    const binanceSnaps = all.filter((d) => d.accountType === 'crypto');
    const admiralsDocs = all.filter((d) => d.accountType !== 'crypto');

    const admiralsByDate = admiralsDocs.reduce((acc, d) => {
      const rawDate = d.snapshot?.statementDate ?? d.statementDate ?? d.id.slice(0, 10);
      const date    = rawDate.replace(/\./g, '-');
      const val     = d.snapshot?.portfolioStats?.totalMarketValue
                   ?? d.snapshot?.portfolioStats?.equity
                   ?? d.snapshot?.balance
                   ?? d.snapshot?.equity
                   ?? 0;
      if (d.accountType === 'inversion' || !d.accountType) {
        acc[date] = (acc[date] ?? 0) + val;
      }
      return acc;
    }, {});

    const admiralDates = Object.keys(admiralsByDate).sort();

    const findClosestAdmiral = (date) => {
      if (!admiralDates.length) return 0;
      let closest = admiralDates[0];
      for (const d of admiralDates) {
        if (d <= date) closest = d;
        else break;
      }
      return admiralsByDate[closest] ?? 0;
    };

    const sorted = [...binanceSnaps].sort((a, b) => {
      const da  = a.snapshot?.statementDate ?? a.id.slice(0, 10);
      const db_ = b.snapshot?.statementDate ?? b.id.slice(0, 10);
      return da.localeCompare(db_);
    });

    // mapa de activos manuales con valor constante (no hay histórico previo)
    const manualMap = buildManualAssetsMap(manualAssets);

    await Promise.all(
      sorted.map((snap) => {
        const date      = snap.snapshot?.statementDate ?? snap.id.slice(0, 10);
        const cryptoUSD = snap.snapshot?.totalPortfolioUSD ?? snap.snapshot?.balancesUSD ?? 0;
        const invUSD    = findClosestAdmiral(date);
        console.log(`  📌 ${date} → crypto: ${cryptoUSD.toFixed(2)}, inv: ${invUSD.toFixed(2)}`);
        return savePortfolioSnapshot(user.uid, {
          date,
          totalPortfolioUSD: cryptoUSD + invUSD + manualUSD,
          cryptoUSD,
          inversionUSD: invUSD,
          manualUSD,
          manualAssets: manualMap, // ← incluir mapa en migración
        });
      })
    );

    console.log(`✅ Migrados ${sorted.length} snapshots`);
  }, [user]);

// ─── withSnapshot ─────────────────────────────────────────
const withSnapshot = useCallback(async (action, getNewManualUSD, assetSince) => {
  console.log('📸 withSnapshot ejecutado, since:', assetSince);
  await action();
  const newManualUSD = await getNewManualUSD();
  if (!user?.uid) return;
  const { cryptoUSD, inversionUSD } = totalsRef.current;
  const manualMap = buildManualAssetsMap(manualCtx.manualAssets);

  const snapData = {
    totalPortfolioUSD: cryptoUSD + inversionUSD + newManualUSD,
    cryptoUSD,
    inversionUSD,
    manualUSD:    newManualUSD,
    manualAssets: manualMap,
  };

  // Siempre guardar hoy
  await savePortfolioSnapshot(user.uid, snapData);

  // Si tiene fecha pasada, crear snapshot en esa fecha
  const today = new Date().toISOString().split('T')[0];
  if (assetSince && assetSince < today) {
    console.log('📅 Creando snapshot en fecha pasada:', assetSince);
    await savePortfolioSnapshot(user.uid, { ...snapData, date: assetSince });
  }

  const updated = await getPortfolioHistory(user.uid);
  setChartHistory(updated);
}, [user, manualCtx.manualAssets]);

// ─── addAsset ─────────────────────────────────────────────
const addAsset = useCallback(async (asset) => {
  const val   = asset.currency === 'BOB'
    ? parseFloat(asset.amount) / bobRate
    : parseFloat(asset.amount);
  const since = asset.since ?? null;
  await withSnapshot(
    () => manualCtx.addAsset(asset),
    () => Promise.resolve(manualCtx.totalManualUSD + val),
    since,
  );
}, [manualCtx, bobRate, withSnapshot]);

// ─── removeAsset ──────────────────────────────────────────
const removeAsset = useCallback(async (id) => {
  const removed = manualCtx.manualAssets.find((a) => a.id === id);
  await withSnapshot(
    () => manualCtx.removeAsset(id),
    () => Promise.resolve(Math.max(0, manualCtx.totalManualUSD - (removed?.valueUSD ?? 0))),
    null,
  );
}, [manualCtx, withSnapshot]);

  // ─── updateAsset ──────────────────────────────────────────
const updateAsset = useCallback(async (id, updates) => {
  console.log('🔧 updateAsset WRAPPER ejecutado', id, updates);
  const since = updates.since ?? null; // ← capturar ANTES de withSnapshot
  await withSnapshot(
    () => manualCtx.updateAsset(id, updates),
    () => {
      const newTotal = manualCtx.manualAssets.reduce((s, a) => {
        const data = a.id === id ? { ...a, ...updates } : a;
        const val  = data.currency === 'BOB'
          ? parseFloat(data.amount) / bobRate
          : parseFloat(data.amount);
        return s + (isNaN(val) ? 0 : val);
      }, 0);
      return Promise.resolve(newTotal);
    },
    since, // ← ahora sí llega correctamente
  );
}, [manualCtx, bobRate, withSnapshot]);

  // ─── fetchAll ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [binance, admirals, stmts, rpts, hist, savedRate, portHistory] = await Promise.all([
        getLatestBinanceSnapshot(),
        getAdmiralsSnapshots(),
        getStatements(50),
        getReports(20),
        getSnapshotHistory(90),
        fetchBobRate(),
        user ? getPortfolioHistory(user.uid) : Promise.resolve([]),
      ]);
      setBinanceSnap(binance);
      setAdmiralsSnaps(admirals);
      setStatements(stmts);
      setReports(rpts);
      setHistory(hist);
      setChartHistory(portHistory);
      if (savedRate) setBobRate(savedRate);
    } catch (e) {
      if (e?.message === 'permission error') return;
      console.error('Error fetching data:', e);
      setError(e.message);
    } finally { setLoading(false); }
  }, [user]);

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
  const inversionSnap      = admiralsSnaps.find((s) => s.accountType === 'inversion');
  const tradeSnap          = admiralsSnaps.find((s) => s.accountType === 'trade');
  const inversionPositions = (inversionSnap?.snapshot?.portfolioStats?.positions || []).map((p) => ({
    id: p.ticket, name: p.symbol, symbol: p.symbol, type: 'etf',
    quantity: p.size, avgBuyPrice: p.entry, currentPrice: p.marketPrice,
    valueUSD: p.marketValue ?? 0, valueBOB: (p.marketValue ?? 0) * bobRate,
    weightPct: p.weight ?? 0, unrealizedPL: p.unrealizedPL ?? 0,
    tp: p.tp, sl: p.sl,
  }));
  const totalInversionUSD = inversionSnap?.snapshot?.portfolioStats?.totalMarketValue ?? 0;
  const totalInversionPnl = inversionSnap?.snapshot?.portfolioStats?.totalUnrealizedPL ?? 0;

  // ─── Actualizar ref de totales ────────────────────────────
  useEffect(() => {
    totalsRef.current = { cryptoUSD: totalCryptoUSD, inversionUSD: totalInversionUSD };
  }, [totalCryptoUSD, totalInversionUSD]);

  // ─── Snapshot diario + migración al cargar ────────────────
  useEffect(() => {
    if (!user?.uid || loading) return;
    const manualUSD    = manualCtx.totalManualUSD ?? 0;
    const inversionUSD = totalInversionUSD ?? 0;
    if (!totalCryptoUSD && !inversionUSD && !manualUSD) return;

    const run = async () => {
      try {
        // 1. Migrar histórico (pasa manualAssets para el mapa)
        await migrateHistoryOnce(manualUSD, manualCtx.manualAssets);

        // 2. Snapshot de hoy con mapa de activos manuales
        await savePortfolioSnapshot(user.uid, {
          totalPortfolioUSD: totalCryptoUSD + inversionUSD + manualUSD,
          cryptoUSD:    totalCryptoUSD,
          inversionUSD: inversionUSD,
          manualUSD:    manualUSD,
          manualAssets: buildManualAssetsMap(manualCtx.manualAssets), // ← nuevo
        });

        // 3. Leer historial completo
        const data = await getPortfolioHistory(user.uid);
        console.log('📊 chartHistory cargado:', data.length, 'entradas');
        setChartHistory(data);
      } catch (e) {
        console.error('❌ run error:', e);
      }
    };

    run();
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── TOTALES GLOBALES ─────────────────────────────────────
  const totalValue = (totalCryptoUSD + totalInversionUSD + (manualCtx.totalManualUSD ?? 0)) * bobRate;
  const totalPnl   = totalInversionPnl;

  // ─── PIE DATA ────────────────────────────────────────────
  const stableAssets     = cryptoAssets.filter((a) => STABLES.includes(a.symbol) && a.netExposureUSD > 0);
  const volatileAssets   = cryptoAssets.filter((a) => !STABLES.includes(a.symbol) && a.netExposureUSD > 0);
  const totalVolatileUSD = volatileAssets.reduce((s, a) => s + a.netExposureUSD, 0);
  const totalETFUSD      = inversionPositions.reduce((s, p) => s + (p.valueUSD ?? 0), 0);

  const pieData = [
    ...(totalVolatileUSD > 0 ? [{ label: 'Crypto', valueUSD: totalVolatileUSD, color: '#f97316' }] : []),
    ...stableAssets.map((a) => ({ label: `${a.symbol} (Cash)`, valueUSD: a.netExposureUSD, color: '#10b981' })),
    ...(totalETFUSD > 0 ? [{ label: 'ETFs', valueUSD: totalETFUSD, color: '#3b82f6' }] : []),
    ...(manualCtx.manualAssets || []).filter((a) => a.valueUSD > 0).map((a, i) => ({
      label: a.name, valueUSD: a.valueUSD, color: MANUAL_COLORS[i % MANUAL_COLORS.length],
    })),
  ].filter((d) => d.valueUSD > 0);

  // ─── TRANSACTIONS ─────────────────────────────────────────
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

  // ─── ACCOUNTS ─────────────────────────────────────────────
  const accounts = {
    sections: [
      {
        title: 'Binance Crypto', iconType: 'crypto', isLiability: false,
        totalBOB: totalCryptoUSD * bobRate,
        items: cryptoAssets.filter((a) => a.netExposureUSD > 0).map((a) => ({
          name: a.symbol, displayValue: `$${a.netExposureUSD.toFixed(2)}`,
          currency: 'USD', valueBOB: a.netExposureUSD * bobRate,
        })),
      },
      {
        title: 'Admirals Inversión', iconType: 'etf', isLiability: false,
        totalBOB: totalInversionUSD * bobRate,
        items: inversionPositions.map((p) => ({
          name: p.symbol, displayValue: `$${p.valueUSD.toFixed(2)}`,
          currency: 'USD', valueBOB: p.valueBOB, pnl: p.unrealizedPL,
        })),
      },
      {
        title: 'Activos Manuales', iconType: 'manual', isLiability: false,
        totalBOB: (manualCtx.totalManualUSD ?? 0) * bobRate,
        items: (manualCtx.manualAssets ?? []).map((a) => ({
          name: a.name,
          displayValue: a.currency === 'BOB' ? `Bs ${a.amount.toFixed(2)}` : `$${a.amount.toFixed(2)}`,
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
      assets: [...cryptoAssets, ...inversionPositions, ...(manualCtx.manualAssets ?? [])],
      totalValue, totalPnl,
      pieData, riskData, loadingRisk: loading,
      transactions, accounts,
      reports, loadingReports: loading, refreshReports: fetchAll,
      chartHistory,
      loading, error,
      snapshot: binanceSnap,
      bobRate,
      ...manualCtx,
      addAsset,
      removeAsset,
      updateAsset,
      bankEmails: [], importBankEmail: () => {},
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);