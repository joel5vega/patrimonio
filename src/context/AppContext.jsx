import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  getLatestBinanceSnapshot,
  getAdmiralsSnapshots,
  getStatements,
  getReports,
  getSnapshotHistory,
  getAllDailySnapshots,
  savePortfolioSnapshot,
  getPortfolioHistory,
  replacePortfolioSnapshot,
  getLatestPortfolioAnalysis,
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useManualAssets, BOB_PER_USD } from '../hooks/useManualAssets';
import { buildPortfolioV3 } from '../utils/portfolioAnalysis';

const AppContext = createContext(null);

const STABLES = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD'];

const MANUAL_HISTORY = {
  Ahorro: [
    { date: '2025-01-30', valueUSD: 950 },
    { date: '2025-03-21', valueUSD: 1070 },
    { date: '2025-07-06', valueUSD: 1300 },
    { date: '2025-10-13', valueUSD: 1500 },
  ],
  AirTM: [
    { date: '2025-12-18', valueUSD: 100 },
    { date: '2025-12-19', valueUSD: 500.24 },
    { date: '2026-02-19', valueUSD: 518.24 },
    { date: '2026-03-07', valueUSD: 618.24 },
    { date: '2026-03-08', valueUSD: 1018.24 },
    { date: '2026-03-19', valueUSD: 1032.42 },
  ],
  SAFI: [
    { date: '2025-10-03', valueUSD: 964.12 },
    { date: '2025-11-03', valueUSD: 964.89 },
    { date: '2025-12-03', valueUSD: 965.5 },
    { date: '2026-01-03', valueUSD: 966.31 },
    { date: '2026-02-03', valueUSD: 966.94 },
    { date: '2026-03-05', valueUSD: 967.61 },
  ],
  AhorroBs: [
    { date: '2020-01-25', valueBOB: 10000 },
    { date: '2022-01-25', valueBOB: 20000 },
    { date: '2023-01-25', valueBOB: 30000 },
    { date: '2024-01-25', valueBOB: 40000 },
    { date: '2025-08-25', valueBOB: 45587 },
    { date: '2025-09-25', valueBOB: 56955 },
    { date: '2025-10-25', valueBOB: 72078 },
    { date: '2025-11-25', valueBOB: 84007 },
    { date: '2025-12-25', valueBOB: 79007 },
    { date: '2026-01-01', valueBOB: 73276 },
    { date: '2026-02-01', valueBOB: 71276 },
    { date: '2026-03-01', valueBOB: 69276 },
    { date: '2026-03-11', valueBOB: 55587 },
    { date: '2026-03-17', valueBOB: 45587 },
    { date: '2026-03-18', valueBOB: 48000 },
  ],
};

async function fetchBobRate() {
  try {
    const res = await fetch('https://bo.dolarapi.com/v1/dolares/binance');
    const data = await res.json();
    return data?.venta ?? data?.compra ?? null;
  } catch (e) {
    console.error('bobRate error:', e);
    return null;
  }
}

const mapUiNameToLogical = (uiName) => {
  if (uiName === 'Ahorro $') return 'Ahorro';
  if (uiName === 'Ahorro en Bs') return 'AhorroBs';
  return uiName;
};

const isQuantfuryAsset = (a) =>
  String(a?.note || '').toLowerCase().includes('[quantfury]') ||
  String(a?.note || '').toLowerCase().includes('quantfury') ||
  String(a?.type || '').toLowerCase() === 'stock';

const normalizeSnapshotDate = (snap) => {
  const raw =
    snap?.statementDate ??
    snap?.snapshot?.statementDate ??
    snap?.createdAt?.toDate?.()?.toISOString?.() ??
    snap?.createdAt?.seconds ??
    '';

  return String(raw);
};

const getLatestSnapshotByType = (snaps, accountType) => {
  return (snaps || [])
    .filter((s) => s?.accountType === accountType)
    .sort((a, b) => normalizeSnapshotDate(b).localeCompare(normalizeSnapshotDate(a)))[0] ?? null;
};

function computeRoleFields({ cryptoAssets, inversionPositions, manualAssets, totalUSD }) {
  const allAssets = [
    ...cryptoAssets.map((a) => ({
      ...a,
      groupKey: 'binance',
      type: a.type || 'crypto',
    })),
    ...inversionPositions.map((a) => ({
      ...a,
      groupKey: 'admirals',
      type: 'etf',
    })),
    ...(manualAssets ?? []).map((a) => ({
      ...a,
      groupKey: isQuantfuryAsset(a) ? 'quantfury' : 'manual',
      type: isQuantfuryAsset(a) ? 'stock' : (a.type || 'manual'),
      valueUSD: a.valueUSD ?? 0,
    })),
  ];

  try {
    const analysis = buildPortfolioV3({ allAssets, totalUSD });
    const roleFields = {};

    Object.entries(analysis?.portfolio?.byRole || {}).forEach(([role, pct]) => {
      const usd = (pct / 100) * (analysis?.totals?.investableUSD ?? 0);
      roleFields[`role_${role}`] = Number(usd.toFixed(2));
    });

    return roleFields;
  } catch (e) {
    console.error('computeRoleFields error:', e);
    return {};
  }
}

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const manualCtx = useManualAssets();

  const [binanceSnap, setBinanceSnap] = useState(null);
  const [admiralsSnaps, setAdmiralsSnaps] = useState([]);
  const [statements, setStatements] = useState([]);
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState([]);
  const [chartHistory, setChartHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bobRate, setBobRate] = useState(BOB_PER_USD);

  const [todayPortfolioV3, setTodayPortfolioV3] = useState(null);
  const [todayPortfolioMeta, setTodayPortfolioMeta] = useState(null);

  const totalsRef = useRef({ cryptoUSD: 0, inversionUSD: 0 });
  const migratedRef = useRef(false);

  const latestInversionSnap = useMemo(
    () => getLatestSnapshotByType(admiralsSnaps, 'inversion'),
    [admiralsSnaps]
  );

  const latestTradeSnap = useMemo(
    () => getLatestSnapshotByType(admiralsSnaps, 'trade'),
    [admiralsSnaps]
  );

  const cryptoAssets = useMemo(() => {
    const bs = binanceSnap?.snapshot || {};
    return (bs.assets || []).map((a, i) => ({
      id: `crypto-${a.asset}-${i}`,
      name: a.asset,
      symbol: a.asset,
      type: 'crypto',
      quantity: a.amount ?? 0,
      avgBuyPrice: 0,
      currentPrice: a.price ?? 0,
      valueUSD: a.valueUSD ?? 0,
      netExposureUSD: a.netExposureUSD ?? a.valueUSD ?? 0,
      weightPct: a.weightPct ?? 0,
      pendingBuyUSD: a.pendingBuyUSD ?? 0,
      unrealizedPL: null,
    }));
  }, [binanceSnap]);

  const totalCryptoUSD = useMemo(() => {
    const bs = binanceSnap?.snapshot || {};
    return bs.totalPortfolioUSD ?? bs.balancesUSD ?? 0;
  }, [binanceSnap]);

  const inversionSnap = latestInversionSnap;
  const tradeSnap = latestTradeSnap;

  const inversionPositions = useMemo(() => {
    return (inversionSnap?.snapshot?.portfolioStats?.positions || []).map((p) => ({
      id: p.ticket ?? p.symbol,
      name: p.symbol,
      symbol: p.symbol,
      type: 'etf',
      quantity: p.size ?? 0,
      avgBuyPrice: p.entry ?? 0,
      currentPrice: p.marketPrice ?? 0,
      valueUSD: p.marketValue ?? 0,
      valueBOB: (p.marketValue ?? 0) * bobRate,
      weightPct: p.weight ?? 0,
      unrealizedPL: p.unrealizedPL ?? 0,
      tp: p.tp,
      sl: p.sl,
    }));
  }, [inversionSnap, bobRate]);

  const totalInversionUSD = useMemo(
    () => inversionSnap?.snapshot?.portfolioStats?.totalMarketValue ?? 0,
    [inversionSnap]
  );

  const totalInversionPnl = useMemo(
    () => inversionSnap?.snapshot?.portfolioStats?.totalUnrealizedPL ?? 0,
    [inversionSnap]
  );

  const totalManualUSD = useMemo(
    () => manualCtx?.totalManualUSD ?? 0,
    [manualCtx?.totalManualUSD]
  );

  const stableAssets = useMemo(
    () => cryptoAssets.filter((a) => STABLES.includes(a.symbol) && a.netExposureUSD > 0),
    [cryptoAssets]
  );

  const volatileAssets = useMemo(
    () => cryptoAssets.filter((a) => !STABLES.includes(a.symbol) && a.netExposureUSD > 0),
    [cryptoAssets]
  );

  const totalVolatileUSD = useMemo(
    () => volatileAssets.reduce((s, a) => s + (a.netExposureUSD ?? 0), 0),
    [volatileAssets]
  );

  const totalETFUSD = useMemo(
    () => inversionPositions.reduce((s, p) => s + (p.valueUSD ?? 0), 0),
    [inversionPositions]
  );

  const totalValue = useMemo(
    () => (totalCryptoUSD + totalInversionUSD + totalManualUSD) * bobRate,
    [totalCryptoUSD, totalInversionUSD, totalManualUSD, bobRate]
  );

  const totalPnl = totalInversionPnl;

  const riskData = useMemo(() => {
    const bs = binanceSnap?.snapshot || {};
    return {
      totalSpotUSD: totalCryptoUSD,
      reservedCapital: bs.reservedCapitalUSD ?? 0,
      hhi: bs.riskMetrics?.herfindahlIndex ?? 0,
      top3Concentration: bs.riskMetrics?.top3ConcentrationPct ?? 0,
      riskScore: bs.riskMetrics?.riskScore ?? 0,
      openOrdersCount: bs.openOrdersCount ?? 0,
      overExposed: (bs.portfolioHealth?.overExposedAssets || []).map((asset) => {
        const found = (bs.assets || []).find((a) => a.asset === asset);
        return { asset, weight: found?.weightPct ?? 0 };
      }),
    };
  }, [binanceSnap, totalCryptoUSD]);

  const pieData = useMemo(() => {
    return [
      ...(totalVolatileUSD > 0
        ? [{ label: 'Crypto', valueUSD: totalVolatileUSD, color: '#f97316' }]
        : []),
      ...stableAssets.map((a) => ({
        label: `${a.symbol} (Cash)`,
        valueUSD: a.netExposureUSD,
        color: '#10b981',
      })),
      ...(totalETFUSD > 0
        ? [{ label: 'ETFs', valueUSD: totalETFUSD, color: '#3b82f6' }]
        : []),
      ...(manualCtx.manualAssets || [])
        .filter((a) => (a.valueUSD ?? 0) > 0)
        .map((a, i) => ({
          label: a.name,
          valueUSD: a.valueUSD,
          color: ['#a855f7', '#ec4899', '#facc15', '#06b6d4'][i % 4],
        })),
    ].filter((d) => d.valueUSD > 0);
  }, [totalVolatileUSD, stableAssets, totalETFUSD, manualCtx.manualAssets]);

  const transactions = useMemo(() => {
    return statements.map((st) => ({
      id: st.id,
      title: st.subject || `${(st.accountType || 'broker').toUpperCase()} Statement`,
      subtitle: `${st.accountType || 'Broker'} • ${st.statementDate || ''}`,
      amount:
        st.summary?.closedTradePL != null
          ? `${st.summary.closedTradePL >= 0 ? '+' : ''}$${st.summary.closedTradePL.toFixed(2)}`
          : `fPL: $${(st.floatingPL ?? 0).toFixed(2)}`,
      type: (st.summary?.closedTradePL ?? st.floatingPL ?? 0) >= 0 ? 'up' : 'down',
      category: st.accountType || 'trade',
      date: st.statementDate,
    }));
  }, [statements]);

  const accounts = useMemo(() => {
    return {
      sections: [
        {
          title: 'Binance Crypto',
          iconType: 'crypto',
          isLiability: false,
          totalBOB: totalCryptoUSD * bobRate,
          items: cryptoAssets
            .filter((a) => a.netExposureUSD > 0)
            .map((a) => ({
              name: a.symbol,
              displayValue: `$${a.netExposureUSD.toFixed(2)}`,
              currency: 'USD',
              valueBOB: a.netExposureUSD * bobRate,
            })),
        },
        {
          title: 'Admirals Inversión',
          iconType: 'etf',
          isLiability: false,
          totalBOB: totalInversionUSD * bobRate,
          items: inversionPositions.map((p) => ({
            name: p.symbol,
            displayValue: `$${p.valueUSD.toFixed(2)}`,
            currency: 'USD',
            valueBOB: p.valueBOB,
            pnl: p.unrealizedPL,
          })),
        },
        {
          title: 'Activos Manuales',
          iconType: 'manual',
          isLiability: false,
          totalBOB: totalManualUSD * bobRate,
          items: (manualCtx.manualAssets ?? []).map((a) => ({
            name: a.name,
            displayValue:
              a.currency === 'BOB'
                ? `Bs ${Number(a.amount ?? 0).toFixed(2)}`
                : `$${Number(a.amount ?? 0).toFixed(2)}`,
            currency: a.currency,
            valueBOB: a.valueBOB,
          })),
        },
      ],
    };
  }, [
    totalCryptoUSD,
    totalInversionUSD,
    totalManualUSD,
    bobRate,
    cryptoAssets,
    inversionPositions,
    manualCtx.manualAssets,
  ]);

  const migrateHistoryOnce = useCallback(async () => {
    if (!user?.uid) return;
    if (migratedRef.current) return;

    migratedRef.current = true;

    const existing = await getPortfolioHistory(user.uid);
    if (existing.length > 0) return;

    const all = await getAllDailySnapshots();

    const binanceSnaps = all.filter((d) => d.accountType === 'crypto');
    const admiralsDocs = all.filter((d) => d.accountType !== 'crypto');

    const cryptoByDate = {};
    binanceSnaps.forEach((d) => {
      const raw = d.snapshot?.statementDate ?? d.statementDate ?? d.id.slice(0, 10);
      const date = String(raw).replace(/\./g, '-');
      const cryptoUSD = d.snapshot?.totalPortfolioUSD ?? d.snapshot?.balancesUSD ?? 0;
      cryptoByDate[date] = cryptoUSD;
    });

    const invByDate = admiralsDocs.reduce((acc, d) => {
      const raw = d.snapshot?.statementDate ?? d.statementDate ?? d.id.slice(0, 10);
      const date = String(raw).replace(/\./g, '-');
      const val =
        d.snapshot?.portfolioStats?.totalMarketValue ??
        d.snapshot?.portfolioStats?.equity ??
        d.snapshot?.balance ??
        d.snapshot?.equity ??
        0;

      if (d.accountType === 'inversion' || !d.accountType) {
        acc[date] = (acc[date] ?? 0) + val;
      }
      return acc;
    }, {});

    const allDatesSet = new Set([
      ...Object.keys(cryptoByDate),
      ...Object.keys(invByDate),
      ...(MANUAL_HISTORY.Ahorro || []).map((x) => x.date),
      ...(MANUAL_HISTORY.AirTM || []).map((x) => x.date),
      ...(MANUAL_HISTORY.SAFI || []).map((x) => x.date),
      ...(MANUAL_HISTORY.AhorroBs || []).map((x) => x.date),
    ]);

    const allDates = Array.from(allDatesSet).sort();

    const getLastValue = (series, date, getter) => {
      const valid = series
        .filter((p) => p.date <= date)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!valid.length) return 0;
      return getter(valid[valid.length - 1]);
    };

    let lastCrypto = 0;
    let lastInv = 0;

    await Promise.all(
      allDates.map((date) => {
        if (cryptoByDate[date] != null) lastCrypto = cryptoByDate[date];
        if (invByDate[date] != null) lastInv = invByDate[date];

        const fields = {};

        if (MANUAL_HISTORY.Ahorro) {
          const v = getLastValue(MANUAL_HISTORY.Ahorro, date, (p) => p.valueUSD);
          if (v > 0) fields.manual_Ahorro = v;
        }

        if (MANUAL_HISTORY.AirTM) {
          const v = getLastValue(MANUAL_HISTORY.AirTM, date, (p) => p.valueUSD);
          if (v > 0) fields.manual_AirTM = v;
        }

        if (MANUAL_HISTORY.SAFI) {
          const v = getLastValue(MANUAL_HISTORY.SAFI, date, (p) => p.valueUSD);
          if (v > 0) fields.manual_SAFI = v;
        }

        if (MANUAL_HISTORY.AhorroBs) {
          const vBOB = getLastValue(MANUAL_HISTORY.AhorroBs, date, (p) => p.valueBOB);
          if (vBOB > 0) fields.manual_AhorroBs = vBOB;
        }

        const manualUSDsum =
          (fields.manual_Ahorro ?? 0) +
          (fields.manual_AirTM ?? 0) +
          (fields.manual_SAFI ?? 0);

        const totalPortfolioUSD = lastCrypto + lastInv + manualUSDsum;

        return savePortfolioSnapshot(user.uid, {
          date,
          cryptoUSD: lastCrypto,
          inversionUSD: lastInv,
          totalPortfolioUSD,
          ...fields,
        });
      })
    );
  }, [user]);

  const refreshPortfolioAnalysis = useCallback(async () => {
    if (!user?.uid) {
      setTodayPortfolioV3(null);
      setTodayPortfolioMeta(null);
      return;
    }

    try {
      const latestAnalysis = await getLatestPortfolioAnalysis(user.uid);
      setTodayPortfolioV3(latestAnalysis?.portfolioV3 ?? null);
      setTodayPortfolioMeta(
        latestAnalysis
          ? {
              id: latestAnalysis.id,
              date: latestAnalysis.date ?? latestAnalysis.id,
              status: latestAnalysis.status ?? null,
              source: 'cloud-function',
            }
          : null
      );
    } catch (e) {
      console.warn('getLatestPortfolioAnalysis no disponible o falló:', e?.message || e);
      setTodayPortfolioV3(null);
      setTodayPortfolioMeta(null);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

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

      const latestInversion = getLatestSnapshotByType(admirals, 'inversion');
      const latestTrade = getLatestSnapshotByType(admirals, 'trade');

      setBinanceSnap(binance);
      setAdmiralsSnaps([latestInversion, latestTrade].filter(Boolean));
      setStatements(stmts);
      setReports(rpts);
      setHistory(hist);
      setChartHistory(portHistory);

      if (savedRate) setBobRate(savedRate);

      await refreshPortfolioAnalysis();
    } catch (e) {
      console.error('fetchAll error:', e);
      setError(e?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [user, refreshPortfolioAnalysis]);

  useEffect(() => {
    if (!user) {
      setBinanceSnap(null);
      setAdmiralsSnaps([]);
      setStatements([]);
      setReports([]);
      setHistory([]);
      setChartHistory([]);
      setTodayPortfolioV3(null);
      setTodayPortfolioMeta(null);
      setLoading(false);
      return;
    }

    fetchAll();
  }, [user, fetchAll]);

  useEffect(() => {
    totalsRef.current = {
      cryptoUSD: totalCryptoUSD,
      inversionUSD: totalInversionUSD,
    };
  }, [totalCryptoUSD, totalInversionUSD]);

  useEffect(() => {
    if (!user?.uid || loading) return;

    const manualUSDOnly = (manualCtx.manualAssets ?? []).reduce((sum, a) => {
      const logical = mapUiNameToLogical(a.name);
      if (logical === 'AhorroBs') return sum;
      return sum + (a.valueUSD ?? 0);
    }, 0);

    if (!totalCryptoUSD && !totalInversionUSD && !manualUSDOnly) return;

    const run = async () => {
      try {
        await migrateHistoryOnce();

        const manualFields = Object.fromEntries(
          (manualCtx.manualAssets ?? []).map((a) => {
            const logical = mapUiNameToLogical(a.name);
            const value = logical === 'AhorroBs' ? a.valueBOB ?? a.amount ?? 0 : a.valueUSD ?? 0;
            return [`manual_${logical}`, value];
          })
        );

        const totalUSD = totalCryptoUSD + totalInversionUSD + manualUSDOnly;

        const roleFields = computeRoleFields({
          cryptoAssets,
          inversionPositions,
          manualAssets: manualCtx.manualAssets,
          totalUSD,
        });

        await savePortfolioSnapshot(user.uid, {
          cryptoUSD: totalCryptoUSD,
          inversionUSD: totalInversionUSD,
          ...manualFields,
          ...roleFields,
          totalPortfolioUSD: totalUSD,
        });

        const data = await getPortfolioHistory(user.uid);
        setChartHistory(data);

        await refreshPortfolioAnalysis();
      } catch (e) {
        console.error('snapshot diario error:', e);
      }
    };

    run();
  }, [
    user,
    loading,
    totalCryptoUSD,
    totalInversionUSD,
    cryptoAssets,
    inversionPositions,
    manualCtx.manualAssets,
    migrateHistoryOnce,
    refreshPortfolioAnalysis,
  ]);

  const withSnapshot = useCallback(
    async (action, assetSince = null) => {
      await action();

      if (!user?.uid) return;

      const { cryptoUSD, inversionUSD } = totalsRef.current;

      const manualFields = Object.fromEntries(
        (manualCtx.manualAssets ?? []).map((a) => {
          const logical = mapUiNameToLogical(a.name);
          const value = logical === 'AhorroBs' ? a.valueBOB ?? a.amount ?? 0 : a.valueUSD ?? 0;
          return [`manual_${logical}`, value];
        })
      );

      const manualUSDOnly = (manualCtx.manualAssets ?? []).reduce((sum, a) => {
        const logical = mapUiNameToLogical(a.name);
        if (logical === 'AhorroBs') return sum;
        return sum + (a.valueUSD ?? 0);
      }, 0);

      const totalUSD = cryptoUSD + inversionUSD + manualUSDOnly;

      const roleFields = computeRoleFields({
        cryptoAssets,
        inversionPositions,
        manualAssets: manualCtx.manualAssets,
        totalUSD,
      });

      await savePortfolioSnapshot(user.uid, {
        cryptoUSD,
        inversionUSD,
        ...manualFields,
        ...roleFields,
        totalPortfolioUSD: totalUSD,
      });

      const today = new Date().toISOString().split('T')[0];
      await replacePortfolioSnapshot(user.uid, today, {
        cryptoUSD,
        inversionUSD,
        ...manualFields,
        totalPortfolioUSD: totalUSD,
      });

      if (assetSince && assetSince !== today) {
        const existing = await getPortfolioHistory(user.uid);
        const existDoc = existing.find((d) => d.date === assetSince);
        const pastCrypto = existDoc?.cryptoUSD ?? 0;
        const pastInv = existDoc?.inversionUSD ?? 0;

        await replacePortfolioSnapshot(user.uid, assetSince, {
          cryptoUSD: pastCrypto,
          inversionUSD: pastInv,
          ...manualFields,
          totalPortfolioUSD: pastCrypto + pastInv + manualUSDOnly,
        });
      }

      const updated = await getPortfolioHistory(user.uid);
      setChartHistory(updated);
      await refreshPortfolioAnalysis();
    },
    [
      user,
      manualCtx.manualAssets,
      cryptoAssets,
      inversionPositions,
      refreshPortfolioAnalysis,
    ]
  );

  const addAsset = useCallback(
    async (asset) => {
      const since = asset.since ?? null;
      await withSnapshot(() => manualCtx.addAsset(asset), since);
    },
    [manualCtx, withSnapshot]
  );

  const removeAsset = useCallback(
    async (id) => {
      await withSnapshot(() => manualCtx.removeAsset(id), null);
    },
    [manualCtx, withSnapshot]
  );

  const updateAsset = useCallback(
    async (id, updates) => {
      const since = updates?.since ?? null;
      await withSnapshot(() => manualCtx.updateAsset(id, updates), since);
    },
    [manualCtx, withSnapshot]
  );

  const replaceImportedAssetsBulk = useCallback(
    async (rows, sourceTag = 'quantfury') => {
      const tag = `[${sourceTag.toLowerCase()}]`;

      const cleanedRows = rows
        .map((row) => {
          const name = String(row.name || '').trim();
          const currency = String(row.currency || '').toUpperCase() === 'BOB' ? 'BOB' : 'USD';
          const amount = parseFloat(row.amount);
          const since = row.since ?? null;
          const baseNote = String(row.note || '').trim();

          if (!name || Number.isNaN(amount) || amount <= 0) return null;

          const rawType = String(row.type || row.asset_type || 'stock').trim().toLowerCase();
          const type = ['stock', 'crypto', 'future', 'manual'].includes(rawType)
            ? rawType
            : 'stock';

          return {
            name,
            type,
            currency,
            amount,
            since,
            note: baseNote ? `${baseNote} ${tag}` : `Importado ${tag}`,
          };
        })
        .filter(Boolean);

      if (cleanedRows.length === 0) return;

      await withSnapshot(async () => {
        const existingImported = (manualCtx.manualAssets ?? []).filter((a) =>
          String(a.note || '').toLowerCase().includes(tag)
        );

        for (const old of existingImported) {
          await manualCtx.removeAsset(old.id);
        }

        for (const row of cleanedRows) {
          await manualCtx.addAsset(row);
        }
      });
    },
    [manualCtx, withSnapshot]
  );

  const value = {
    user,
    loading,
    error,
    bobRate,

    binanceSnap,
    admiralsSnaps,
    inversionSnap,
    tradeSnap,

    statements,
    reports,
    history,
    chartHistory,

    cryptoAssets,
    inversionPositions,
    manualAssets: manualCtx.manualAssets ?? [],

    stableAssets,
    volatileAssets,

    totalCryptoUSD,
    totalInversionUSD,
    totalInversionPnl,
    totalManualUSD,
    totalVolatileUSD,
    totalETFUSD,
    totalValue,
    totalPnl,

    riskData,
    pieData,
    accounts,
    transactions,

    todayPortfolioV3,
    todayPortfolioMeta,

    addAsset,
    removeAsset,
    updateAsset,
    replaceImportedAssetsBulk,

    refreshAll: fetchAll,
    refreshPortfolioAnalysis,

    ...manualCtx,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);