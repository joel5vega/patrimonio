const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

Object.assign(exports, require('./read'));
Object.assign(exports, require('./write'));
// ─── Auth helper ─────────────────────────────────────────────
const requireAuth = (auth) => {
  if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
};

// ─── 1. getLatestSnapshot ────────────────────────────────────
// Retorna el snapshot de Binance más reciente de dailyAccountSnapshots
exports.getLatestSnapshot = onCall({ region: 'us-central1' }, async ({ auth }) => {
  requireAuth(auth);

  const col = db.collection('dailyAccountSnapshots');
  // Los binance_portfolio tienen formato YYYY-MM-DD_binance_portfolio
  const snap = await col
    .where(admin.firestore.FieldPath.documentId(), '>=', '2026')
    .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
    .limit(1)
    .get();

  if (snap.empty) throw new HttpsError('not-found', 'No hay snapshots disponibles.');

  const doc = snap.docs[0];
  const data = doc.data();

  // Filtrar solo campos relevantes para el frontend
  const holdings = (data.holdings || []).map((h) => ({
    asset: h.asset,
    pair: h.pair,
    amount: h.amount,
    available: h.available,
    price: h.price,
    valueUSD: h.valueUSD,
    weightPct: h.weightPct,
    onOrder: h.onOrder,
    earn: h.earn,
    funding: h.funding,
    futures: h.futures,
    futuresPnl: h.futuresPnl,
  }));

  return {
    snapshotId: doc.id,
    statementDate: data.statementDate,
    totalPortfolioUSD: data.totalPortfolioUSD,
    updatedAt: data.updatedAt?.toDate()?.toISOString() ?? null,
    holdings,
  };
});

// ─── 2. getSnapshotHistory ───────────────────────────────────
// Retorna los últimos N snapshots para gráfico histórico
exports.getSnapshotHistory = onCall({ region: 'us-central1' }, async ({ auth, data }) => {
  requireAuth(auth);

  const limit = Math.min(data?.limit || 30, 90); // máx 90 días

  const snap = await db.collection('dailyAccountSnapshots')
    .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
    .limit(limit)
    .get();

  const history = snap.docs
    .filter((d) => d.id.includes('binance_portfolio'))
    .map((d) => ({
      date: d.data().statementDate,
      totalPortfolioUSD: d.data().totalPortfolioUSD,
    }))
    .reverse(); // orden cronológico para el gráfico

  return { history };
});

// ─── 3. getRiskMetrics ───────────────────────────────────────
// Calcula HHI, concentración y activos sobre-expuestos
exports.getRiskMetrics = onCall({ region: 'us-central1' }, async ({ auth }) => {
  requireAuth(auth);

  // Obtener snapshot más reciente
  const snap = await db.collection('dailyAccountSnapshots')
    .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
    .limit(1)
    .get();

  if (snap.empty) throw new HttpsError('not-found', 'No hay datos de riesgo.');

  const data = snap.docs[0].data();
  const holdings = (data.holdings || []).filter((h) => h.valueUSD > 0);
  const totalUSD = data.totalPortfolioUSD || 1;

  // HHI = suma de (weightPct/100)^2
  const hhi = holdings.reduce((acc, h) => {
    const w = h.valueUSD / totalUSD;
    return acc + w * w;
  }, 0);

  // Top 3 concentración
  const sorted = [...holdings].sort((a, b) => b.valueUSD - a.valueUSD);
  const top3Pct = sorted.slice(0, 3).reduce((s, h) => s + (h.valueUSD / totalUSD) * 100, 0);

  // Activos sobre-expuestos (>70% del portafolio)
  const overExposed = holdings
    .filter((h) => (h.valueUSD / totalUSD) * 100 > 70)
    .map((h) => ({ asset: h.pair, weight: +((h.valueUSD / totalUSD) * 100).toFixed(1) }));

  // Risk score compuesto (0-100)
  const hhiScore = Math.min(hhi * 200, 50);          // HHI contribuye hasta 50 pts
  const concScore = Math.min(top3Pct / 2, 30);        // Concentración top3 hasta 30 pts
  const overScore = Math.min(overExposed.length * 20, 20); // Over-exposed hasta 20 pts
  const riskScore = Math.round(hhiScore + concScore + overScore);

  // Capital reservado en órdenes activas
  const reservedCapital = holdings.reduce((s, h) => s + (h.onOrder || 0) * (h.price || 0), 0);

  return {
    totalSpotUSD: totalUSD,
    reservedCapital,
    hhi: +hhi.toFixed(4),
    top3Concentration: +top3Pct.toFixed(1),
    riskScore,
    overExposed,
  };
});

// ─── 4. getStatements ────────────────────────────────────────
// Retorna movimientos de la colección statements
exports.getStatements = onCall({ region: 'us-central1' }, async ({ auth, data }) => {
  requireAuth(auth);

  const limit = Math.min(data?.limit || 50, 200);
  const snap = await db.collection('statements')
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  const statements = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    date: d.data().date?.toDate?.()?.toISOString() ?? d.data().date,
  }));

  return { statements };
});
