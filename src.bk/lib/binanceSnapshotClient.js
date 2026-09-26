// src/lib/binanceSnapshotClient.js
import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';
import { initializeApp } from 'firebase/app';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Debe coincidir con:
// region: "asia-east1"
// en functions/triggers/binanceSnapshotOnDemand.js
const functions = getFunctions(
  app,
  'asia-east1',
);

const refreshSnapshotCallable =
  httpsCallable(
    functions,
    'refreshBinanceSnapshotOnDemand',
  );

export async function refreshBinanceSnapshot() {
  console.log(
    '[Binance client] Iniciando callable',
  );

  try {
    const result =
      await refreshSnapshotCallable({
        slot: 'manual',
      });

    console.log(
      '[Binance client] Respuesta recibida',
      result.data,
    );

    return result.data;
  } catch (error) {
    console.error(
      '[Binance client] Error callable',
      {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      },
    );

    throw error;
  }
}