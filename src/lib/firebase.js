import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  where,
  setDoc,
  orderBy,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();


// ─── getLatestBinanceSnapshot ───────────────────────────────
export const getLatestBinanceSnapshot = async () => {
  const q = query(
    collection(db, 'dailyAccountSnapshots'),
    where('accountId', '==', 'binanceportfolio'),
    orderBy('statementDate', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};


// ─── getSnapshotHistory ─────────────────────────────────────
export const getSnapshotHistory = async (
  n = 30,
) => {
  const q = query(
    collection(
      db,
      "dailyAccountSnapshots",
    ),

    where(
      "accountId",
      "==",
      "binanceportfolio",
    ),

    orderBy(
      "statementDate",
      "desc",
    ),

    limit(n),
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((document) => {
      const data = document.data();
      const snapshot = data.snapshot || {};

      const spotAndEarnUSD = Number(
        snapshot.totals
          ?.spotAndEarnValueUSD ??
        snapshot.totalPortfolioUSD ??
        snapshot.balancesUSD ??
        0,
      );

      return {
        id: document.id,

        date:
          data.statementDate ||
          snapshot.statementDate ||
          document.id.slice(0, 10),

        cryptoUSD: spotAndEarnUSD,
        totalCryptoUSD: spotAndEarnUSD,

        accountValueUSD: Number(
          snapshot.totals
            ?.accountValueUSD ?? 0,
        ),

        spotAndEarnValueUSD: spotAndEarnUSD,

        futuresMarginBalanceUSD: Number(
          snapshot.totals
            ?.futuresMarginBalanceUSD ?? 0,
        ),

        futuresGrossNotionalUSD: Number(
          snapshot.totals
            ?.futuresGrossNotionalUSD ?? 0,
        ),
      };
    })
    .reverse();
};

// ─── getAdmiralsSnapshots ──────────────────────────────────
export const getAdmiralsSnapshots = async () => {
  const q = query(
    collection(db, 'dailyAccountSnapshots'),
    where('accountType', 'in', ['trade', 'inversion']),
    orderBy('statementDate', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};


// ─── getStatements ─────────────────────────────────────────
export const getStatements = async (n = 50) => {
  const q = query(
    collection(db, 'statements'),
    orderBy('statementDate', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};


// ─── getReports ────────────────────────────────────────────
export const getReports = async (n = 20) => {
  const results = [];

  try {
    const snap = await getDocs(
      query(collection(db, 'standoutsReports'), orderBy('date', 'desc'), limit(n))
    );

    snap.docs.forEach((d) =>
      results.push({
        id: d.id,
        type: 'standouts',
        title: 'Standouts ' + (d.data().timeSlot || ''),
        date: d.data().date,
        summary: (d.data().report || '').slice(0, 300),
        report: d.data().report,
      })
    );
  } catch (_) {}

  try {
    const snap = await getDocs(
      query(
        collection(db, 'dailyAccountSnapshots'),
        orderBy('statementDate', 'desc'),
        limit(50)
      )
    );

    snap.docs
      .filter((d) => !!d.data().report)
      .slice(0, n)
      .forEach((d) =>
        results.push({
          id: d.id,
          type: d.data().accountType === 'crypto' ? 'crypto' : 'market',
          title:
            'Reporte ' +
            (d.data().accountType || '').toUpperCase() +
            ' · ' +
            d.data().statementDate,
          date: d.data().statementDate,
          summary: (d.data().report || '').slice(0, 300),
          report: d.data().report,
        })
      );
  } catch (_) {}

  results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return results.slice(0, n);
};


// =============================================================================
// MANUAL ASSETS
// =============================================================================

export const subscribeManualAssets = (uid, callback) => {
  const col = collection(db, 'users', uid, 'manualAssets');
  const q = query(col, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const assets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(assets);
  });
};

export const addManualAsset = (uid, asset) =>
  addDoc(collection(db, 'users', uid, 'manualAssets'), {
    name: asset.name,
    currency: asset.currency,
    type: asset.type || 'manual',
    amount: parseFloat(asset.amount),
    note: asset.note || '',
    since: asset.since ?? null,
    createdAt: serverTimestamp(),
  });

export const removeManualAsset = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'manualAssets', id));

export const updateManualAsset = (uid, id, updates) =>
  updateDoc(doc(db, 'users', uid, 'manualAssets', id), updates);

//Quantfury
const normalizedText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const makeTradingHistoryId = (row) => {
  const source = normalizedText(row.source || 'quantfury');
  const symbol = normalizedText(row.symbol || 'unknown');
  const date = normalizedText(row.date || '');
  const time = normalizedText(row.time || '');
  const side = normalizedText(row.side || row.direction || '');
  const quantity = Number(row.quantity ?? row.size ?? 0);
  const price = Number(
    row.price ??
    row.entry_price ??
    row.entryPrice ??
    row.exit_price ??
    row.exitPrice ??
    0
  );
  const isClosing = row.is_closing_leg ? 'close' : 'open';

  /*
    Es un id estable: importar dos veces el mismo PDF
    actualizará el mismo documento, no duplicará la operación.
  */
  return [
    source,
    symbol,
    date,
    time,
    side,
    quantity,
    price,
    isClosing,
  ]
    .join('|')
    .replace(/[^a-z0-9|.-]/gi, '_')
    .slice(0, 140);
};

const normalizeTradingRow = (row, meta, importId) => {
  const realizedPnlUSD = Number(
    row.realized_pnl ??
    row.realizedPnlUSD ??
    row.pnl ??
    0
  );

  const notionalUSD = Number(
    row.notional_usd ??
    row.notionalUSD ??
    row.value_usd ??
    row.valueUSD ??
    0
  );

  const leverage = Number(
    row.leverage ??
    row.leverage_used ??
    row.multiplier ??
    1
  );

  return {
    ...row,

    source: 'quantfury',
    importId,
    importBatchId: importId,

    symbol: String(row.symbol ?? row.name ?? 'UNKNOWN').toUpperCase(),
    assetType: String(
      row.asset_type ??
      row.assetType ??
      row.type ??
      'other'
    ).toLowerCase(),

    date: String(row.date ?? ''),
    time: String(row.time ?? ''),

    realized_pnl: realizedPnlUSD,
    realizedPnlUSD,

    notional_usd: notionalUSD,
    notionalUSD,

    leverage: Number.isFinite(leverage) && leverage > 0
      ? leverage
      : 1,

    is_closing_leg: Boolean(
      row.is_closing_leg ??
      row.isClosingLeg ??
      false
    ),

    file_name: meta.file_name ?? null,
    equity_real: Number(meta.equity_real ?? 0) || null,
    import_summary: meta.summary ?? {},
    updatedAt: serverTimestamp(),
  };
};

// =============================================================================
// TRANSACTIONS
// =============================================================================
export const subscribeTransactions = (uid, callback) => {
  const col = collection(db, 'users', uid, 'transactions');
  const q = query(col, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const transactions = snap.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      callback(transactions);
    },
    (error) => {
      console.error('Error leyendo transacciones:', error);
      callback([]);
    }
  );
};

export const addTransaction = (uid, tx) =>
  addDoc(collection(db, 'users', uid, 'transactions'), {
    title: tx.title || tx.concept || '',
    concept: tx.concept || '',
    amount: Number(tx.amount),
    currency: tx.currency || 'USD',
    type: tx.type || 'expense',
    category: tx.category || 'other',
    date: tx.date,
    note: tx.note || '',
    createdAt: serverTimestamp(),
  });

export const updateTransaction = (uid, id, updates) =>
  updateDoc(doc(db, 'users', uid, 'transactions', id), {
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.concept !== undefined && { concept: updates.concept }),
    ...(updates.amount !== undefined && { amount: Number(updates.amount) }),
    ...(updates.currency !== undefined && { currency: updates.currency }),
    ...(updates.type !== undefined && { type: updates.type }),
    ...(updates.category !== undefined && { category: updates.category }),
    ...(updates.date !== undefined && { date: updates.date }),
    ...(updates.note !== undefined && { note: updates.note }),
    updatedAt: serverTimestamp(),
  });


export const removeTransaction = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'transactions', id));


// =============================================================================
// PORTFOLIO HISTORY
// =============================================================================

export async function replacePortfolioSnapshot(uid, date, data) {
  const ref = doc(db, 'users', uid, 'portfolioHistory', date);
  await setDoc(ref, { ...data, date, updatedAt: new Date().toISOString() });
}

export async function savePortfolioSnapshot(uid, data) {
  const date = data.date ?? new Date().toISOString().split('T')[0];
  const ref = doc(db, 'users', uid, 'portfolioHistory', date);

  const cryptoUSD = data.cryptoUSD ?? 0;
  const inversionUSD = data.inversionUSD ?? 0;

  const manualFieldsUSD = Object.entries(data)
    .filter(([k]) => k.startsWith('manual_') && k !== 'manual_AhorroBs')
    .reduce((acc, [k, v]) => {
      acc[k] = typeof v === 'number' ? v : v ?? 0;
      return acc;
    }, {});

  const manualSumUSD = Object.values(manualFieldsUSD).reduce(
    (s, v) => s + (typeof v === 'number' ? v : 0),
    0
  );

  const totalPortfolioUSD =
    data.totalPortfolioUSD ?? cryptoUSD + inversionUSD + manualSumUSD;

  const payload = {
    date,
    cryptoUSD,
    inversionUSD,
    totalPortfolioUSD,
    ...manualFieldsUSD,
    ...(data.manual_AhorroBs != null ? { manual_AhorroBs: data.manual_AhorroBs } : {}),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, payload, { merge: true });
}

export async function getPortfolioHistory(uid) {
  try {
    const q = query(
      // collection(db, 'users', uid, 'portfolioHistoryV2'),
      collection(db, 'users', uid, 'portfolioHistory'),
      orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    // console.log('getPortfolioHistory raw docs:', snap.size, snap.docs.map((d) => d.id));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error('❌ getPortfolioHistory error:', e.code, e.message);
    return [];
  }
}

export async function getAllDailySnapshots() {
  try {
    const ref = collection(db, 'dailyAccountSnapshots');
    const snap = await getDocs(ref);
    console.log('✅ getAllDailySnapshots:', snap.size, 'docs');
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('❌ getAllDailySnapshots error:', e.code, e.message);
    return [];
  }
}


// =============================================================================
// IDEAS / STANDOUTS
// =============================================================================

export const subscribeIdeas = (callback) => {
  const q = query(
    collection(db, 'ideaTasks'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      callback(data);
    },
    (error) => {
      console.error('Error en subscribeIdeas:', error);
    }
  );
};

export const subscribeStandouts = (callback) => {
  const q = query(
    collection(db, 'standoutsReports'),
    orderBy('createdAt', 'desc'),
    limit(3)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      callback(data);
    },
    (error) => {
      console.error('Error en subscribeStandouts:', error);
    }
  );
};

export async function getPortfolioSnapshotByDate(userId, date) {
  const ref = doc(db, 'users', userId, 'portfolioHistoryV2', date);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getLatestPortfolioAnalysis(userId) {
  const q = query(
    collection(db, 'portfolioAnalysis', userId, 'daily'),
    orderBy('date', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}


// =============================================================================
// TRADING HISTORY
// =============================================================================

async function commitDeleteBatches(docs) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    docs.slice(i, i + 400).forEach((snap) => {
      batch.delete(snap.ref);
    });
    await batch.commit();
  }
}

async function commitInsertBatches(colRef, rows, meta, batchId) {
  for (let i = 0; i < rows.length; i += 400) {
    const batch = writeBatch(db);

    rows.slice(i, i + 400).forEach((row) => {
      const ref = doc(colRef);
      batch.set(ref, {
        ...row,
        source: meta.source ?? 'quantfury',
        import_batch_id: batchId,
        equity_real: meta.equity_real ?? null,
        import_summary: meta.summary ?? null,
        file_name: meta.file_name ?? null,
        importedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}




// =============================================================================
// QUANTFURY PDF PROCESSOR
// =============================================================================

export async function procesarQuantfuryPdf({file, equity}) {
  if (!file) {
    throw new Error('Archivo PDF requerido');
  }

  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const numericEquity = Number(equity);

  if (!Number.isFinite(numericEquity) || numericEquity <= 0) {
    throw new Error('Equity válido requerido');
  }

  const endpoint = import.meta.env.VITE_QUANTFURY_PARSER_URL;

  if (!endpoint) {
    throw new Error('Falta VITE_QUANTFURY_PARSER_URL');
  }

  const token = await auth.currentUser.getIdToken(true);
  const formData = new FormData();

  formData.append('pdf', file, file.name);
  formData.append('equity', String(numericEquity));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const raw = await response.text();
  let payload;

  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {error: raw};
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.error || 'Error procesando el PDF Quantfury',
    );
  }

  return payload;
}

export function subscribeQuantfurySnapshot(uid, callback, onError) {
  if (!uid) return () => {};

  const reference = query(
    collection(db, 'users', uid, 'manualAssets'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    reference,
    (snapshot) => {
      const assets = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .filter((asset) => {
          const note = String(asset.note || '').toLowerCase();
          return asset.source === 'quantfury' || note.includes('quantfury');
        });

      callback(assets);
    },
    onError,
  );
}

export function subscribeQuantfuryHistory(uid, callback, onError) {
  if (!uid) return () => {};

  const reference = query(
    collection(db, 'users', uid, 'tradingHistory'),
    orderBy('date', 'desc'),
    orderBy('time', 'desc'),
    limit(500),
  );

  return onSnapshot(
    reference,
    (snapshot) => {
      callback(snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })));
    },
    onError,
  );
}

export function subscribeQuantfuryAnalytics(uid, callback, onError) {
  if (!uid) return () => {};

  const reference = doc(
    db,
    'users',
    uid,
    'tradingAnalytics',
    'latest',
  );

  return onSnapshot(
    reference,
    (snapshot) => {
      callback(snapshot.exists()
        ? {id: snapshot.id, ...snapshot.data()}
        : null);
    },
    onError,
  );
}

export async function getQuantfuryImports(uid, count = 20) {
  if (!uid) return [];

  const reference = query(
    collection(db, 'users', uid, 'tradingImports'),
    orderBy('imported_at', 'desc'),
    limit(count),
  );

  const snapshot = await getDocs(reference);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}


export function subscribeQuantfuryPositions(uid, callback, onError) {
  if (!uid) return () => {};

  const reference = query(
    collection(db, 'users', uid, 'manualAssets'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    reference,
    (snapshot) => {
      const assets = snapshot.docs
        .map((item) => ({id: item.id, ...item.data()}))
        .filter((asset) => {
          const note = String(asset.note || '').toLowerCase();
          return asset.source === 'quantfury' || note.includes('quantfury');
        });

      callback(assets);
    },
    onError,
  );
}

