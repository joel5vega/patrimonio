// hooks/useTransactions.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
} from '../lib/firebase';

// ── 1. Diccionario de traducción al vuelo (Legacy / Nombres directos -> Categoría Oficial) ──
const OLD_TO_NEW_CATEGORY = {
  // Categorías provistas y legacy
  alquiler: 'alquiler',
  servicios: 'servicios',
  tigo: 'comunicaciones',
  telefono: 'comunicaciones',
  viveres: 'viveres',
  pasajes: 'transporte',
  transporte: 'transporte',
  ahorro: 'ahorro',
  fondo_reserva: 'fondo_emergencia',
  utiles: 'educacion_utiles',
  educacion: 'educacion_utiles',
  formacion: 'educacion_utiles',
  ropa: 'ropa',
  cremas: 'cuidado_personal',
  salud: 'salud',
  salidas: 'citas_salidas',
  eventos: 'citas_salidas',
  deporte: 'citas_salidas',
  comida_fuera: 'comida_fuera',
  hogar: 'mantenimiento',
  hogar_misc: 'mantenimiento',
  impuestos: 'impuestos',

  // Familia / Fe
  familia: 'regalos_familia',
  boda: 'boda',
  regalo: 'regalos_familia',
  diezmos: 'diezmo_ofrenda',
  ofrenda: 'diezmo_ofrenda',
  ministerios: 'misiones',
  ayuda: 'generosidad',

  // Inversiones
  buy: 'inversion',
  sell: 'inversion',
  construccion: 'inversion',
  dividend: 'rendimientos',
  tecnologia: 'tecnologia',

  // Ingresos
  salario: 'salario',
  bono: 'salario',
  freelance: 'freelance_negocio',
  negocio: 'freelance_negocio',
  renta: 'rendimientos',
  prestamo_rec: 'ingreso_otro',
  ingreso_otro: 'ingreso_otro',

  // Otros
  other: 'other',
};

// ── 2. Nuevos Grupos y Categorías ─────────────────────────────────────────
export const TX_GROUPS = [
  { value: 'hogar', label: '🏠 Hogar y Vivienda' },
  { value: 'estilo_vida', label: '🍿 Estilo de Vida y Pareja' },
  { value: 'bienestar', label: '🌱 Salud, Cuidado y Crecimiento' },
  { value: 'fe', label: '✝️ Dar al Señor' },
  { value: 'finanzas', label: '📊 Ahorro e Inversiones' },
  { value: 'ingresos', label: '💵 Ingresos' },
  { value: 'otros', label: '📦 Otros' },
];

export const TX_CATEGORIES = [
  // ── Hogar y Vivienda ─────────────────────────────────────────
  { value: 'alquiler', label: 'Alquiler', parent: 'hogar', emoji: '🔑' },
  { value: 'viveres', label: 'Víveres y Mercado', parent: 'hogar', emoji: '🛒' },
  { value: 'servicios', label: 'Servicios Básicos', parent: 'hogar', emoji: '⚡' },
  { value: 'comunicaciones', label: 'Comunicaciones', parent: 'hogar', emoji: '📱' },
  { value: 'transporte', label: 'Transporte', parent: 'hogar', emoji: '🚌' },
  { value: 'mantenimiento', label: 'Hogar y Equipamiento', parent: 'hogar', emoji: '🧹' },

  // ── Estilo de Vida y Pareja ──────────────────────────────────
  { value: 'citas_salidas', label: 'Salidas y Citas', parent: 'estilo_vida', emoji: '👩‍❤️‍👨' },
  { value: 'comida_fuera', label: 'Comida Afuera', parent: 'estilo_vida', emoji: '🍔' },
  { value: 'ropa', label: 'Ropa y Calzado', parent: 'estilo_vida', emoji: '👔' },
  { value: 'regalos_familia', label: 'Regalos y Familia', parent: 'estilo_vida', emoji: '🎁' },

  // ── Salud, Cuidado y Crecimiento ────────────────────────────
  { value: 'cuidado_personal', label: 'Cuidado Personal', parent: 'bienestar', emoji: '🧴' },
  { value: 'salud', label: 'Salud', parent: 'bienestar', emoji: '🏥' },
  { value: 'educacion_utiles', label: 'Educación', parent: 'bienestar', emoji: '📚' },
  { value: 'tecnologia', label: 'Tecnología', parent: 'bienestar', emoji: '💻' },

  // ── Dar al Señor ─────────────────────────────────────────────
  { value: 'diezmo_ofrenda', label: 'Diezmos y Ofrendas', parent: 'fe', emoji: '⛪' },
  { value: 'misiones', label: 'Misiones y Ministerio', parent: 'fe', emoji: '🌍' },
  { value: 'generosidad', label: 'Generosidad', parent: 'fe', emoji: '🤝' },

  // ── Ahorro e Inversiones ─────────────────────────────────────
  { value: 'ahorro', label: 'Ahorro', parent: 'finanzas', emoji: '🐖' },
  { value: 'fondo_emergencia', label: 'Fondo de Reserva', parent: 'finanzas', emoji: '🛡️' },
  { value: 'inversion', label: 'Inversiones / Activos', parent: 'finanzas', emoji: '📈' },

  // ── Ingresos ─────────────────────────────────────────────────
  { value: 'salario', label: 'Salario / Sueldo', parent: 'ingresos', emoji: '💵' },
  { value: 'freelance_negocio', label: 'Freelance / Negocio', parent: 'ingresos', emoji: '💻' },
  { value: 'rendimientos', label: 'Intereses / Dividendos', parent: 'ingresos', emoji: '💰' },
  { value: 'ingreso_otro', label: 'Otro Ingreso', parent: 'ingresos', emoji: '📦' },

  // ── Otros ────────────────────────────────────────────────────
  { value: 'impuestos', label: 'Impuestos y Tasas', parent: 'otros', emoji: '🏛️' },
  { value: 'other', label: 'Ajuste / Otro', parent: 'otros', emoji: '⚙️' },
  { value: 'boda', label: 'Boda', parent: 'otros', emoji: '💍' },
];

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  // ✅ Función para traducir la categoría antigua o provista y calcular el parentCategory
  const enrichTx = (tx) => {
    if (!tx) return tx;

    // 1. Normalizar key recibida (convertir a minúsculas y sin acentos)
    const rawCategory = (tx.category || 'other')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 2. Traducir la categoría si existe en el diccionario
    const mappedCategory = OLD_TO_NEW_CATEGORY[rawCategory] || tx.category || 'other';

    // 3. Buscar el parentCategory correspondiente en el esquema actual
    const categoryDef = TX_CATEGORIES.find((c) => c.value === mappedCategory);
    const parentCategory = categoryDef ? categoryDef.parent : 'otros';

    return {
      ...tx,
      category: mappedCategory,
      parentCategory,
    };
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    // ✅ Normalización automática al suscribirse a Firestore
    const unsub = subscribeTransactions(user.uid, (txs) => {
      setTransactions(txs.map(enrichTx));
    });

    return () => unsub();
  }, [user]);

  return {
    transactions,
    addTransaction: (tx) => user && addTransaction(user.uid, enrichTx(tx)),
    updateTransaction: (id, updates) => user && updateTransaction(user.uid, id, enrichTx(updates)),
    removeTransaction: (id) => user && removeTransaction(user.uid, id),
  };
}