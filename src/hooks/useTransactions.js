// hooks/useTransactions.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
} from '../lib/firebase';

// hooks/useTransactions.js

export const TX_CATEGORIES = [
  // ── Hogar ──────────────────────────────────────────────────
  { value: 'viveres',      label: 'Víveres',         parent: 'hogar',       emoji: '🍎' },
  { value: 'servicios',    label: 'Servicios',        parent: 'hogar',       emoji: '⚡' },
  { value: 'telefono',     label: 'Teléfono',         parent: 'hogar',       emoji: '📞' },
  { value: 'transporte',   label: 'Transporte',       parent: 'hogar',       emoji: '🚌' },
  { value: 'salud',        label: 'Salud',            parent: 'hogar',       emoji: '🏥' },
  { value: 'hogar_misc',   label: 'Hogar',            parent: 'hogar',       emoji: '🪑' },
  { value: 'impuestos',    label: 'Impuestos',        parent: 'hogar',       emoji: '🏛️' },
  // ── Familia ────────────────────────────────────────────────
  { value: 'familia',      label: 'Familia',          parent: 'familia',     emoji: '👨‍👩‍👧' },
  { value: 'boda',         label: 'Boda',             parent: 'familia',     emoji: '💍' },
  // ── Desarrollo Personal ────────────────────────────────────
  { value: 'educacion',    label: 'Educación',        parent: 'desarrollo',  emoji: '📚' },
  { value: 'ropa',         label: 'Ropa',             parent: 'desarrollo',  emoji: '👔' },
  { value: 'tecnologia',   label: 'Tecnología',       parent: 'desarrollo',  emoji: '📱' },
  { value: 'deporte',      label: 'Deporte',          parent: 'desarrollo',  emoji: '⚽' },
  { value: 'eventos',      label: 'Eventos',          parent: 'desarrollo',  emoji: '🎉' },
  { value: 'salidas',      label: 'Salidas',          parent: 'desarrollo',  emoji: '🍽️' },
  { value: 'comida_fuera', label: 'Comida afuera',    parent: 'desarrollo',  emoji: '🍔' },
  // ── Dar al Señor ───────────────────────────────────────────
  { value: 'diezmos',      label: 'Diezmos',          parent: 'fe',          emoji: '⛪' },
  { value: 'ofrenda',      label: 'Ofrenda',          parent: 'fe',          emoji: '🙌' },
  { value: 'ministerios',  label: 'Ministerios',      parent: 'fe',          emoji: '🌍' },
  { value: 'formacion',    label: 'Formación',        parent: 'fe',          emoji: '🎓' },
  { value: 'ayuda',        label: 'Ayuda',            parent: 'fe',          emoji: '🤝' },
  // ── Inversiones ────────────────────────────────────────────
  { value: 'buy',          label: 'Compra',           parent: 'inversiones', emoji: '📈' },
  { value: 'sell',         label: 'Venta',            parent: 'inversiones', emoji: '📉' },
  { value: 'construccion', label: 'Construcción',     parent: 'inversiones', emoji: '🏗️' },
  { value: 'dividend',     label: 'Dividendo',        parent: 'inversiones', emoji: '💰' },
  // ── Ingresos ───────────────────────────────────────────────
  { value: 'salario',      label: 'Salario',          parent: 'ingresos',    emoji: '💵' },
  { value: 'bono',         label: 'Bono',             parent: 'ingresos',    emoji: '🎯' },
  { value: 'freelance',    label: 'Freelance',        parent: 'ingresos',    emoji: '💻' },
  { value: 'negocio',      label: 'Negocio',          parent: 'ingresos',    emoji: '🏪' },
  { value: 'renta',        label: 'Renta',            parent: 'ingresos',    emoji: '🏠' },
  { value: 'prestamo_rec', label: 'Préstamo recibido',parent: 'ingresos',    emoji: '🤝' },
  { value: 'ingreso_otro', label: 'Otro ingreso',     parent: 'ingresos',    emoji: '📦' },
  // ── Otros ──────────────────────────────────────────────────
  { value: 'regalo',       label: 'Regalo/Préstamo',  parent: 'otros',       emoji: '🎁' },
  { value: 'other',        label: 'Otro',             parent: 'otros',       emoji: '📦' },
];

export const TX_GROUPS = [
  { value: 'hogar',       label: '🏠 Hogar'               },
  { value: 'familia',     label: '👨‍👩‍👧 Familia'             },
  { value: 'desarrollo',  label: '👤 Desarrollo Personal'  },
  { value: 'fe',          label: '✝️ Dar al Señor'         },
  { value: 'inversiones', label: '📈 Inversiones'          },
  { value: 'ingresos',    label: '💵 Ingresos'             }, // ✅ nuevo
  { value: 'otros',       label: '📦 Otros'                },
];

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  // ✅ Definida antes del useEffect
  const enrichTx = (tx) => ({
    ...tx,
    parentCategory:
      tx.parentCategory ||
      TX_CATEGORIES.find(c => c.value === tx.category)?.parent ||
      'otros',
  });

  useEffect(() => {
    if (!user) { setTransactions([]); return; }
    // ✅ Enriquecer al LEER desde Firestore
    const unsub = subscribeTransactions(user.uid, (txs) => {
      setTransactions(txs.map(enrichTx));
    });
    return () => unsub();
  }, [user]);

  return {
    transactions,
    addTransaction:    (tx)          => user && addTransaction(user.uid, enrichTx(tx)),
    updateTransaction: (id, updates) => user && updateTransaction(user.uid, id, enrichTx(updates)),
    removeTransaction: (id)          => user && removeTransaction(user.uid, id),
  };
}