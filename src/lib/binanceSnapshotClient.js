// src/lib/binanceSnapshotClient.js
import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { app } from './firebase';

// Debe coincidir con:
// region: "asia-east1"
// en functions/triggers/binanceSnapshotOnDemand.js
const functions = getFunctions(app, 'asia-east1');

const refreshBinanceSnapshotCallable = httpsCallable(
  functions,
  'refreshBinanceSnapshotOnDemand',
);

export async function refreshBinanceSnapshot() {
  // console.log('[Binance client] Iniciando callable');

  try {
    const result = await refreshBinanceSnapshotCallable({
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