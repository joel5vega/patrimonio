import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
sa.private_key = sa.private_key.replace(/\\n/g, '\n');

initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

// Intenta leer una colección
const snap = await db.collection('test').limit(1).get();
console.log('✅ Firestore OK, docs:', snap.size);
