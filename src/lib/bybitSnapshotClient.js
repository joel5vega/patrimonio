// src/lib/bybitSnapshotClient.js
import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { app } from './firebase';

// Debe coincidir con:
// region: "asia-east1"
// en functions/triggers/bybitSnapshotOnDemand.js
const functions = getFunctions(app, 'asia-east1');

const refreshBybitSnapshotCallable = httpsCallable(
  functions,
  'refreshBybitSnapshotOnDemand',
);

export async function refreshBybitSnapshot() {
  console.log('[Bybit client] Iniciando callable');

  try {
    const result = await refreshBybitSnapshotCallable({
      slot: 'manual',
    });

    console.log(
      '[Bybit client] Respuesta recibida',
      result.data,
    );

    return result.data;
  } catch (error) {
    console.error(
      '[Bybit client] Error callable',
      {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      },
    );

    throw error;
  }
}