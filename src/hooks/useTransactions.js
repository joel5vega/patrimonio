import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  addTransaction as addTransactionInFirestore,
  getAllTransactionsForExport,
  getTransactionsPage,
  removeTransaction as removeTransactionInFirestore,
  updateTransaction as updateTransactionInFirestore,
} from '../lib/firebase';

const PAGE_SIZE = 50;

const OLD_TO_NEW_CATEGORY = {
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
  familia: 'regalos_familia',
  boda: 'boda',
  regalo: 'regalos_familia',
  diezmos: 'diezmo_ofrenda',
  ofrenda: 'diezmo_ofrenda',
  ministerios: 'misiones',
  ayuda: 'generosidad',
  buy: 'inversion',
  sell: 'inversion',
  construccion: 'inversion',
  dividend: 'rendimientos',
  tecnologia: 'tecnologia',
  salario: 'salario',
  bono: 'salario',
  freelance: 'freelance_negocio',
  negocio: 'freelance_negocio',
  renta: 'rendimientos',
  prestamo_rec: 'ingreso_otro',
  ingreso_otro: 'ingreso_otro',
  other: 'other',
};

export const TX_GROUPS = [
  { value: 'hogar', label: 'Hogar y Vivienda' },
  { value: 'estilo_vida', label: 'Estilo de Vida y Pareja' },
  { value: 'bienestar', label: 'Salud, Cuidado y Crecimiento' },
  { value: 'fe', label: 'Dar al Señor' },
  { value: 'finanzas', label: 'Ahorro e Inversiones' },
  { value: 'ingresos', label: 'Ingresos' },
  { value: 'otros', label: 'Otros' },
];

export const TX_CATEGORIES = [
  { value: 'alquiler', label: 'Alquiler', parent: 'hogar', emoji: '🔑' },
  { value: 'viveres', label: 'Víveres y Mercado', parent: 'hogar', emoji: '🛒' },
  { value: 'servicios', label: 'Servicios Básicos', parent: 'hogar', emoji: '⚡' },
  { value: 'comunicaciones', label: 'Comunicaciones', parent: 'hogar', emoji: '📱' },
  { value: 'transporte', label: 'Transporte', parent: 'hogar', emoji: '🚌' },
  { value: 'mantenimiento', label: 'Hogar y Equipamiento', parent: 'hogar', emoji: '🧹' },

  { value: 'citas_salidas', label: 'Salidas y Citas', parent: 'estilo_vida', emoji: '🍿' },
  { value: 'comida_fuera', label: 'Comida Afuera', parent: 'estilo_vida', emoji: '🍔' },
  { value: 'ropa', label: 'Ropa y Calzado', parent: 'estilo_vida', emoji: '👔' },
  { value: 'regalos_familia', label: 'Regalos y Familia', parent: 'estilo_vida', emoji: '🎁' },

  { value: 'cuidado_personal', label: 'Cuidado Personal', parent: 'bienestar', emoji: '🧴' },
  { value: 'salud', label: 'Salud', parent: 'bienestar', emoji: '🏥' },
  { value: 'educacion_utiles', label: 'Educación', parent: 'bienestar', emoji: '📚' },
  { value: 'tecnologia', label: 'Tecnología', parent: 'bienestar', emoji: '💻' },

  { value: 'diezmo_ofrenda', label: 'Diezmos y Ofrendas', parent: 'fe', emoji: '⛪' },
  { value: 'misiones', label: 'Misiones y Ministerio', parent: 'fe', emoji: '🌍' },
  { value: 'generosidad', label: 'Generosidad', parent: 'fe', emoji: '🤝' },

  { value: 'ahorro', label: 'Ahorro', parent: 'finanzas', emoji: '🐖' },
  { value: 'fondo_emergencia', label: 'Fondo de Reserva', parent: 'finanzas', emoji: '🛡️' },
  { value: 'inversion', label: 'Inversiones / Activos', parent: 'finanzas', emoji: '📈' },

  { value: 'salario', label: 'Salario / Sueldo', parent: 'ingresos', emoji: '💵' },
  { value: 'freelance_negocio', label: 'Freelance / Negocio', parent: 'ingresos', emoji: '💻' },
  { value: 'rendimientos', label: 'Intereses / Dividendos', parent: 'ingresos', emoji: '💰' },
  { value: 'ingreso_otro', label: 'Otro Ingreso', parent: 'ingresos', emoji: '📦' },

  { value: 'impuestos', label: 'Impuestos y Tasas', parent: 'otros', emoji: '🏛️' },
  { value: 'other', label: 'Ajuste / Otro', parent: 'otros', emoji: '⚙️' },
  { value: 'boda', label: 'Boda', parent: 'otros', emoji: '💍' },
];

export const enrichTransaction = (transaction) => {
  if (!transaction) return transaction;

  const rawCategory = String(transaction.category || 'other')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const category = OLD_TO_NEW_CATEGORY[rawCategory] || rawCategory || 'other';

  const categoryDefinition = TX_CATEGORIES.find(
    (item) => item.value === category
  );

  return {
    ...transaction,
    category,
    parentCategory: categoryDefinition?.parent || 'otros',
  };
};

export function useTransactions({ from = null, to = null } = {}) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const cursorRef = useRef(null);
  const queryKey = `${from || ''}|${to || ''}`;

  const loadFirstPage = useCallback(async () => {
    if (!user?.uid) {
      setTransactions([]);
      setHasMore(false);
      cursorRef.current = null;
      return;
    }

    setLoading(true);
    setError(null);
    cursorRef.current = null;

    try {
      const page = await getTransactionsPage(user.uid, {
        from,
        to,
        pageSize: PAGE_SIZE,
      });

      setTransactions(page.transactions.map(enrichTransaction));
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } catch (requestError) {
      console.error('Error cargando transacciones:', requestError);
      setTransactions([]);
      setHasMore(false);
      setError('No se pudieron cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, from, to]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, queryKey]);

  const loadMore = useCallback(async () => {
    if (!user?.uid || !hasMore || loadingMore || !cursorRef.current) return;

    setLoadingMore(true);
    setError(null);

    try {
      const page = await getTransactionsPage(user.uid, {
        from,
        to,
        cursor: cursorRef.current,
        pageSize: PAGE_SIZE,
      });

      setTransactions((current) => {
        const ids = new Set(current.map((transaction) => transaction.id));

        const next = page.transactions
          .map(enrichTransaction)
          .filter((transaction) => !ids.has(transaction.id));

        return [...current, ...next];
      });

      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } catch (requestError) {
      console.error('Error cargando más transacciones:', requestError);
      setError('No se pudieron cargar más movimientos.');
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, from, to, hasMore, loadingMore]);

  const addTransaction = useCallback(
    async (transaction) => {
      if (!user?.uid) return;

      await addTransactionInFirestore(user.uid, enrichTransaction(transaction));
      await loadFirstPage();
    },
    [user?.uid, loadFirstPage]
  );

  const updateTransaction = useCallback(
    async (id, updates) => {
      if (!user?.uid) return;

      const normalized = enrichTransaction(updates);

      await updateTransactionInFirestore(user.uid, id, normalized);

      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === id
            ? { ...transaction, ...normalized, id }
            : transaction
        )
      );
    },
    [user?.uid]
  );

  const removeTransaction = useCallback(
    async (id) => {
      if (!user?.uid) return;

      await removeTransactionInFirestore(user.uid, id);

      setTransactions((current) =>
        current.filter((transaction) => transaction.id !== id)
      );
    },
    [user?.uid]
  );

  const getTransactionsForExport = useCallback(async () => {
    if (!user?.uid) return [];

    const allTransactions = await getAllTransactionsForExport(user.uid, {
      from,
      to,
    });

    return allTransactions.map(enrichTransaction);
  }, [user?.uid, from, to]);

  return {
    transactions,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reload: loadFirstPage,
    addTransaction,
    updateTransaction,
    removeTransaction,
    getTransactionsForExport,
  };
}