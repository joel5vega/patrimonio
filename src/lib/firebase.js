import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore, collection, query,addDoc,deleteDoc,updateDoc,doc, onSnapshot, serverTimestamp,
  where,setDoc, orderBy, limit, getDocs,
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

// ─── getLatestBinanceSnapshot ─────────────────────────────────
// Lee: dailyAccountSnapshots / 2026-03-14_binance_portfolio
export const getLatestBinanceSnapshot = async () => {
  const q = query(
    collection(db, 'dailyAccountSnapshots'),
    where('accountId', '==', 'binance_portfolio'),
    orderBy('statementDate', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ─── getSnapshotHistory ───────────────────────────────────────
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

// ─── getAdmiralsSnapshots ─────────────────────────────────────
// Lee: dailyAccountSnapshots / 2026.03.12_AccountID
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

// ─── getStatements ────────────────────────────────────────────
export const getStatements = async (n = 50) => {
  const q = query(
    collection(db, 'statements'),
    orderBy('statementDate', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── getReports ───────────────────────────────────────────────
export const getReports = async (n = 20) => {
  const results = [];
  // standoutsReports
  try {
    const snap = await getDocs(
      query(collection(db, 'standoutsReports'), orderBy('date', 'desc'), limit(n))
    );
    snap.docs.forEach((d) => results.push({
      id: d.id, type: 'standouts',
      title: 'Standouts ' + (d.data().timeSlot || ''),
      date: d.data().date,
      summary: (d.data().report || '').slice(0, 300),
      report: d.data().report,
    }));
  } catch (_) {}

  // reportes en dailyAccountSnapshots — filtro en cliente
  try {
    const snap = await getDocs(
      query(collection(db, 'dailyAccountSnapshots'), orderBy('statementDate', 'desc'), limit(50))
    );
    snap.docs
      .filter((d) => !!d.data().report)
      .slice(0, n)
      .forEach((d) => results.push({
        id: d.id, type: d.data().accountType === 'crypto' ? 'crypto' : 'market',
        title: 'Reporte ' + (d.data().accountType || '').toUpperCase() + ' · ' + d.data().statementDate,
        date: d.data().statementDate,
        summary: (d.data().report || '').slice(0, 300),
        report: d.data().report,
      }));
  } catch (_) {}

  results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return results.slice(0, n);
};


// =============================================================================
// MANUAL ASSETS — Firestore CRUD
// =============================================================================


const BOB_PER_USD = 10;

// Colección: users/{uid}/manualAssets
const manualCol = (uid) => collection(db, 'users', uid, 'manualAssets');

export const subscribeManualAssets = (uid, callback) => {
  const q = query(manualCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const assets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(assets);
  });
};

export const addManualAsset = (uid, asset) =>
  addDoc(manualCol(uid), {
    name:      asset.name,
    currency:  asset.currency,   // 'USD' | 'BOB'
    amount:    parseFloat(asset.amount),
    note:      asset.note || '',
    createdAt: serverTimestamp(),
  });

export const removeManualAsset = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'manualAssets', id));

export const updateManualAsset = (uid, id, updates) =>
  updateDoc(doc(db, 'users', uid, 'manualAssets', id), updates);



// =============================================================================
// TRANSACTIONS — Firestore CRUD  (agregar al final de firebase.js)
// =============================================================================

const transactionsCol = (uid) => collection(db, 'users', uid, 'transactions');

export const subscribeTransactions = (uid, callback, n = 100) => {
  const q = query(transactionsCol(uid), orderBy('date', 'desc'), limit(n));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addTransaction = (uid, tx) =>
  addDoc(transactionsCol(uid), {
    title:     tx.title,
    concept:   tx.concept || '',
    amount:    parseFloat(tx.amount),
    currency:  tx.currency || 'USD',   // 'USD' | 'BOB'
    type:      tx.type,                // 'income' | 'expense' | 'transfer'
    category:  tx.category,            // 'buy' | 'sell' | 'dividend' | 'transfer' | 'other'
    date:      tx.date,                // 'YYYY-MM-DD'
    note:      tx.note || '',
    createdAt: serverTimestamp(),
  });

export const updateTransaction = (uid, id, updates) =>
  updateDoc(doc(db, 'users', uid, 'transactions', id), updates);

export const removeTransaction = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'transactions', id));

// lib/firebase.js  ← agregar al final


export async function savePortfolioSnapshot(uid, data) {
  const date = data.date ?? new Date().toISOString().split('T')[0];
  const ref  = doc(db, 'users', uid, 'portfolioHistory', date);
  await setDoc(ref, {
    date,
    totalPortfolioUSD: data.totalPortfolioUSD,
    cryptoUSD:         data.cryptoUSD,
    inversionUSD:      data.inversionUSD,
    manualUSD:         data.manualUSD,
    // ← nuevo: mapa id → valueUSD
    manualAssets:      data.manualAssets ?? {},
    updatedAt:         new Date().toISOString(),
  }, { merge: true });
}
export async function getPortfolioHistory(uid) {
  try {
    const q = query(
      collection(db, 'users', uid, 'portfolioHistory'),
      orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    console.log('getPortfolioHistory raw docs:', snap.size, snap.docs.map(d => d.id));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error('❌ getPortfolioHistory error:', e.code, e.message);
    return [];
  }
}
export async function getAllDailySnapshots() {
  try {
    // Colección raíz — NO bajo users/
    const ref  = collection(db, 'dailyAccountSnapshots');
    const snap = await getDocs(ref);
    console.log('✅ getAllDailySnapshots:', snap.size, 'docs');
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('❌ getAllDailySnapshots error:', e.code, e.message);
    return [];
  }
}