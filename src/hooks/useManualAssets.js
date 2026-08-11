// useManualAssets.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeManualAssets,
  addManualAsset,
  removeManualAsset,
  updateManualAsset,
} from '../lib/firebase';

const DEFAULT_BOB_PER_USD = 10;

export function useManualAssets(bobRate = DEFAULT_BOB_PER_USD) {
  const { user } = useAuth();
  const [rawAssets, setRawAssets] = useState([]);

  useEffect(() => {
    if (!user) {
      setRawAssets([]);
      return;
    }
    const unsub = subscribeManualAssets(user.uid, setRawAssets);
    return () => unsub();
  }, [user]);

  const rate = bobRate || DEFAULT_BOB_PER_USD;

  const manualAssets = useMemo(
    () =>
      rawAssets.map((a) => ({
        ...a,
        type: a.type ?? 'manual',
        valueUSD: a.currency === 'BOB' ? a.amount / rate : a.amount,
        valueBOB: a.currency === 'BOB' ? a.amount : a.amount * rate,
        since: a.since ?? null,
      })),
    [rawAssets, rate]
  );

  const totalManualUSD = useMemo(
    () => manualAssets.reduce((s, a) => s + a.valueUSD, 0),
    [manualAssets]
  );

  const recalcTotal = useCallback(
    (assets) =>
      assets.reduce(
        (s, a) => s + (a.currency === 'BOB' ? a.amount / rate : a.amount),
        0
      ),
    [rate]
  );

  const addAsset = useCallback(
    async (asset) => {
      if (!user) return;

      await addManualAsset(user.uid, {
        name: String(asset.name || '').trim(),
        type: asset.type ?? 'manual',
        currency: asset.currency ?? 'USD',
        amount: parseFloat(asset.amount),
        note: asset.note || '',
        since: asset.since ?? new Date().toISOString().split('T')[0],
      });
    },
    [user]
  );

  const removeAsset = useCallback(
    async (id) => {
      if (!user) return;
      await removeManualAsset(user.uid, id);
    },
    [user]
  );

  const updateAsset = useCallback(
    async (id, updates) => {
      if (!user) return;

      await updateManualAsset(user.uid, id, {
        ...updates,
        type: updates.type ?? 'manual',
        amount: parseFloat(updates.amount),
        since: updates.since ?? new Date().toISOString().split('T')[0],
      });
    },
    [user]
  );

  return {
    manualAssets,
    totalManualUSD,
    BOB_PER_USD: rate,
    recalcTotal,
    addAsset,
    removeAsset,
    updateAsset,
  };
}