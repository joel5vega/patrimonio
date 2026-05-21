const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const db = admin.firestore();

const requireAuth = (auth) => {
  if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesion.');
};
