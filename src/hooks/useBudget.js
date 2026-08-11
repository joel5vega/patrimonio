import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useBudget() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const docRef = doc(db, 'users', user.uid, 'config', 'budgets');
    getDoc(docRef)
      .then(snap => { if (snap.exists()) setBudgets(snap.data()); })
      .catch(err => console.error('useBudget:', err))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const saveBudget = async (groupOrObject, amount) => {
    if (!user?.uid) return;
    const docRef = doc(db, 'users', user.uid, 'config', 'budgets');

    // Permite recibir un objeto { comunicaciones: 200, transporte: 300 } o par (key, value)
    const updates = typeof groupOrObject === 'object'
      ? groupOrObject
      : { [groupOrObject]: Number(amount) };

    setBudgets(prev => {
      const updated = { ...prev };
      Object.keys(updates).forEach(key => {
        updated[key] = Number(updates[key] || 0);
      });

      // Persistir en Firestore usando el objeto unificado
      setDoc(docRef, updated, { merge: true }).catch(err => 
        console.error('Error al guardar presupuesto en Firestore:', err)
      );

      return updated;
    });
  };

  return { budgets, saveBudget, loading };
}