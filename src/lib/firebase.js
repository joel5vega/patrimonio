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
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
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
export const getSnapshotHistory = async (n = 30) => {
  const q = query(
    collection(db, 'dailyAccountSnapshots'),
    where('accountId', '==', 'binance_portfolio'),
    orderBy('statementDate', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.data().statementDate,
    totalPortfolioUSD: d.data().snapshot?.balancesUSD ?? 0,
  })).reverse();
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
  const q   = query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const assets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(assets);
  });
};

export const addManualAsset = (uid, asset) =>
  addDoc(collection(db, 'users', uid, 'manualAssets'), {
    name:      asset.name,
    currency:  asset.currency,
      type:      asset.type || 'manual', 
    amount:    parseFloat(asset.amount),
    note:      asset.note || '',
    since:     asset.since ?? null,
    createdAt: serverTimestamp(),
  });

export const removeManualAsset = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'manualAssets', id));

export const updateManualAsset = (uid, id, updates) =>
  updateDoc(doc(db, 'users', uid, 'manualAssets', id), updates);

// =============================================================================
// TRANSACTIONS
// =============================================================================

export const subscribeTransactions = (uid, callback, n = 100) => {
  const col = collection(db, 'users', uid, 'transactions');
  const q   = query(col, orderBy('date', 'desc'), limit(n));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addTransaction = (uid, tx) =>
  addDoc(collection(db, 'users', uid, 'transactions'), {
    title:     tx.title,
    concept:   tx.concept || '',
    amount:    parseFloat(tx.amount),
    currency:  tx.currency || 'USD',
    type:      tx.type,
    category:  tx.category,
    date:      tx.date,
    note:      tx.note || '',
    createdAt: serverTimestamp(),
  });

export const updateTransaction = (uid, id, updates) =>
  updateDoc(doc(db, 'users', uid, 'transactions', id), updates);

export const removeTransaction = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'transactions', id));

// =============================================================================
// PORTFOLIO HISTORY
// =============================================================================
// Sobrescribe el documento completo (sin merge) — elimina campos obsoletos
export async function replacePortfolioSnapshot(uid, date, data) {
  const ref = doc(db, 'users', uid, 'portfolioHistory', date);
  await setDoc(ref, { ...data, date, updatedAt: new Date().toISOString() });
  // sin merge: true → campos viejos desaparecen
}
export async function savePortfolioSnapshot(uid, data) {
  const date = data.date ?? new Date().toISOString().split('T')[0];
  const ref  = doc(db, 'users', uid, 'portfolioHistory', date);

  const cryptoUSD    = data.cryptoUSD    ?? 0;
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
      collection(db, 'users', uid, 'portfolioHistory'),
      orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    console.log('getPortfolioHistory raw docs:', snap.size, snap.docs.map((d) => d.id));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error('❌ getPortfolioHistory error:', e.code, e.message);
    return [];
  }
}

export async function getAllDailySnapshots() {
  try {
    const ref  = collection(db, 'dailyAccountSnapshots');
    const snap = await getDocs(ref);
    console.log('✅ getAllDailySnapshots:', snap.size, 'docs');
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('❌ getAllDailySnapshots error:', e.code, e.message);
    return [];
  }
}

export const subscribeIdeas = (callback) => {
  const q = query(
    collection(db, 'ideaTasks'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  }, (error) => {
    console.error("Error en subscribeIdeas:", error);
  });
};

export const subscribeStandouts = (callback) => {
  const q = query(
    collection(db, 'standoutsReports'),
    orderBy('createdAt', 'desc'),
    limit(3)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  }, (error) => {
    console.error("Error en subscribeStandouts:", error);
  });
};

export async function getPortfolioSnapshotByDate(userId, date) {
  const ref = doc(db, 'users', userId, 'portfolioHistory', date);
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