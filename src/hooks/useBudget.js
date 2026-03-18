// src/hooks/useBudget.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useBudget() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; } // ← antes quedaba en loading:true si no hay user
    const docRef = doc(db, 'users', user.uid, 'config', 'budgets'); // ← movido adentro
    getDoc(docRef)
      .then(snap => { if (snap.exists()) setBudgets(snap.data()); })
      .catch(err => console.error('useBudget:', err))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const saveBudget = async (group, amount) => {
    if (!user?.uid) return;
    const docRef = doc(db, 'users', user.uid, 'config', 'budgets');
    const updated = { ...budgets, [group]: Number(amount) };
    setBudgets(updated);
    await setDoc(docRef, updated, { merge: true }); // ← merge:true para no sobreescribir
  };

  return { budgets, saveBudget, loading };
}