// .src/hooks/useManualAssets.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeManualAssets,
  addManualAsset,
  removeManualAsset,
  updateManualAsset,
} from '../lib/firebase';

export const BOB_PER_USD = 6.96;

export function useManualAssets(bobRate = BOB_PER_USD) {
  const { user } = useAuth();
  const [rawAssets, setRawAssets] = useState([]);

  useEffect(() => {
    if (!user) { setRawAssets([]); return; }
    const unsub = subscribeManualAssets(user.uid, setRawAssets);
    return () => unsub();
  }, [user]);

  const manualAssets = rawAssets.map((a) => ({
    ...a,
    valueUSD: a.currency === 'BOB' ? a.amount / bobRate : a.amount,
    valueBOB: a.currency === 'BOB' ? a.amount : a.amount * bobRate,
    since:    a.since ?? null,
  }));

  const totalManualUSD = manualAssets.reduce((s, a) => s + a.valueUSD, 0);

  const recalcTotal = useCallback((assets) =>
    assets.reduce((s, a) =>
      s + (a.currency === 'BOB' ? a.amount / bobRate : a.amount), 0),
  [bobRate]);

  // Las acciones solo escriben en Firestore manualAssets/
  // El snapshot lo maneja AppContext via withSnapshot
  const addAsset = useCallback(async (asset) => {
    if (!user) return;
    await addManualAsset(user.uid, {
      ...asset,
      amount: parseFloat(asset.amount),
      since:  asset.since ?? new Date().toISOString().split('T')[0],
    });
  }, [user]);

  const removeAsset = useCallback(async (id) => {
    if (!user) return;
    await removeManualAsset(user.uid, id);
  }, [user]);

  const updateAsset = useCallback(async (id, updates) => {
    if (!user) return;
    await updateManualAsset(user.uid, id, {
      ...updates,
      amount: parseFloat(updates.amount),
      since:  updates.since ?? new Date().toISOString().split('T')[0],
    });
  }, [user]);

  return {
    manualAssets,
    totalManualUSD,
    BOB_PER_USD: bobRate,
    addAsset,
    removeAsset,
    updateAsset,
  };
}