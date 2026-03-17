import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
} from '../lib/firebase';

export const TX_CATEGORIES = [
  // ── Hogar ──────────────────────────────
  { value: 'viveres',      label: 'Víveres',       parent: 'hogar',       emoji: '🍎' },
  { value: 'servicios',    label: 'Servicios',     parent: 'hogar',       emoji: '⚡' },
  { value: 'telefono',     label: 'Teléfono',      parent: 'hogar',       emoji: '📞' },
  { value: 'transporte',   label: 'Transporte',    parent: 'hogar',       emoji: '🚌' },
  { value: 'salud',        label: 'Salud',         parent: 'hogar',       emoji: '🏥' },
  { value: 'hogar_misc',   label: 'Hogar',         parent: 'hogar',       emoji: '🪑' },
  { value: 'impuestos',    label: 'Impuestos',     parent: 'hogar',       emoji: '🏛️' },
  // ── Familia ────────────────────────────
  { value: 'familia',      label: 'Familia',       parent: 'familia',     emoji: '👨‍👩‍👧' },
  // ── Desarrollo Personal ────────────────
  { value: 'educacion',    label: 'Educación',     parent: 'desarrollo',  emoji: '📚' },
  { value: 'ropa',         label: 'Ropa',          parent: 'desarrollo',  emoji: '👔' },
  { value: 'tecnologia',   label: 'Tecnología',    parent: 'desarrollo',  emoji: '📱' },
  { value: 'deporte',      label: 'Deporte',       parent: 'desarrollo',  emoji: '⚽' },
  { value: 'eventos',      label: 'Eventos',       parent: 'desarrollo',  emoji: '🎉' },
  // ── Dar al Señor ───────────────────────
  { value: 'diezmos',      label: 'Diezmos',       parent: 'fe',          emoji: '⛪' },
  { value: 'ofrenda',      label: 'Ofrenda',       parent: 'fe',          emoji: '🙌' },
  { value: 'ministerios',  label: 'Ministerios',   parent: 'fe',          emoji: '🌍' },
  { value: 'formacion',    label: 'Formación',     parent: 'fe',          emoji: '🎓' },
  { value: 'ayuda',        label: 'Ayuda',         parent: 'fe',          emoji: '🤝' },
  // ── Inversiones ────────────────────────
  { value: 'buy',          label: 'Compra',        parent: 'inversiones', emoji: '📈' },
  { value: 'sell',         label: 'Venta',         parent: 'inversiones', emoji: '📉' },
  { value: 'construccion', label: 'Construcción',  parent: 'inversiones', emoji: '🏗️' },
  { value: 'dividend',     label: 'Dividendo',     parent: 'inversiones', emoji: '💰' },
  // ── Otros ──────────────────────────────
  { value: 'regalo',       label: 'Regalo/Préstamo', parent: 'otros',    emoji: '🎁' },
  { value: 'other',        label: 'Otro',          parent: 'otros',       emoji: '📦' },
];

// Grupos para el selector agrupado
export const TX_GROUPS = [
  { value: 'hogar',       label: '🏠 Hogar'              },
  { value: 'familia',     label: '👨‍👩‍👧 Familia'            },
  { value: 'desarrollo',  label: '👤 Desarrollo Personal' },
  { value: 'fe',          label: '✝️ Dar al Señor'        },
  { value: 'inversiones', label: '📈 Inversiones'         },
  { value: 'otros',       label: '📦 Otros'               },
];


export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) { setTransactions([]); return; }
    const unsub = subscribeTransactions(user.uid, setTransactions);
    return () => unsub();
  }, [user]);

  return {
    transactions,
    addTransaction:    (tx)          => user && addTransaction(user.uid, tx),
    updateTransaction: (id, updates) => user && updateTransaction(user.uid, id, updates),
    removeTransaction: (id)          => user && removeTransaction(user.uid, id),
    TX_CATEGORIES,
  };
}
