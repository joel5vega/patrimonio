import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeManualAssets,
  addManualAsset,
  removeManualAsset,
  updateManualAsset,
} from '../lib/firebase';

export const BOB_PER_USD = 6.96; // fallback oficial

export function useManualAssets(bobRate = BOB_PER_USD) {  // ← acepta rate
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
  }));

  const totalManualUSD = manualAssets.reduce((s, a) => s + a.valueUSD, 0);

  return {
    manualAssets,
    totalManualUSD,
    BOB_PER_USD: bobRate,
    addAsset:    (asset)       => user && addManualAsset(user.uid, asset),
    removeAsset: (id)          => user && removeManualAsset(user.uid, id),
    updateAsset: (id, updates) => user && updateManualAsset(user.uid, id, updates),
  };
}
