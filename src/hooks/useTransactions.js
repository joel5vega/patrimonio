import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuth } from '../context/AuthContext';

import {
  addTransaction as addTransactionInFirestore,
  getAllTransactionsForExport,
  getTransactionsPage,
  removeTransaction as removeTransactionInFirestore,
  updateTransaction as updateTransactionInFirestore,
} from '../lib/firebase';

const PAGE_SIZE = 50;

/* =========================================================
   MIGRACIÓN DE CATEGORÍAS ANTIGUAS
========================================================= */

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

/* =========================================================
   GRUPOS
========================================================= */

export const TX_GROUPS = [
  {
    value: 'hogar',
    label: 'Hogar y Vivienda',
  },
  {
    value: 'estilo_vida',
    label: 'Estilo de Vida y Pareja',
  },
  {
    value: 'bienestar',
    label: 'Salud, Cuidado y Crecimiento',
  },
  {
    value: 'fe',
    label: 'Dar al Señor',
  },
  {
    value: 'finanzas',
    label: 'Ahorro e Inversiones',
  },
  {
    value: 'ingresos',
    label: 'Ingresos',
  },
  {
    value: 'otros',
    label: 'Otros',
  },
];

/* =========================================================
   CATEGORÍAS
========================================================= */

export const TX_CATEGORIES = [
  {
    value: 'alquiler',
    label: 'Alquiler',
    parent: 'hogar',
    emoji: '🔑',
  },
  {
    value: 'viveres',
    label: 'Víveres y Mercado',
    parent: 'hogar',
    emoji: '🛒',
  },
  {
    value: 'servicios',
    label: 'Servicios Básicos',
    parent: 'hogar',
    emoji: '⚡',
  },
  {
    value: 'comunicaciones',
    label: 'Comunicaciones',
    parent: 'hogar',
    emoji: '📱',
  },
  {
    value: 'transporte',
    label: 'Transporte',
    parent: 'hogar',
    emoji: '🚌',
  },
  {
    value: 'mantenimiento',
    label: 'Hogar y Equipamiento',
    parent: 'hogar',
    emoji: '🧹',
  },
  {
    value: 'citas_salidas',
    label: 'Salidas y Citas',
    parent: 'estilo_vida',
    emoji: '🍿',
  },
  {
    value: 'comida_fuera',
    label: 'Comida Afuera',
    parent: 'estilo_vida',
    emoji: '🍔',
  },
  {
    value: 'ropa',
    label: 'Ropa y Calzado',
    parent: 'estilo_vida',
    emoji: '👔',
  },
  {
    value: 'regalos_familia',
    label: 'Regalos y Familia',
    parent: 'estilo_vida',
    emoji: '🎁',
  },
  {
    value: 'cuidado_personal',
    label: 'Cuidado Personal',
    parent: 'bienestar',
    emoji: '🧴',
  },
  {
    value: 'salud',
    label: 'Salud',
    parent: 'bienestar',
    emoji: '🏥',
  },
  {
    value: 'educacion_utiles',
    label: 'Educación',
    parent: 'bienestar',
    emoji: '📚',
  },
  {
    value: 'tecnologia',
    label: 'Tecnología',
    parent: 'bienestar',
    emoji: '💻',
  },
  {
    value: 'diezmo_ofrenda',
    label: 'Diezmos y Ofrendas',
    parent: 'fe',
    emoji: '⛪',
  },
  {
    value: 'misiones',
    label: 'Misiones y Ministerio',
    parent: 'fe',
    emoji: '🌍',
  },
  {
    value: 'generosidad',
    label: 'Generosidad',
    parent: 'fe',
    emoji: '🤝',
  },
  {
    value: 'ahorro',
    label: 'Ahorro',
    parent: 'finanzas',
    emoji: '🐖',
  },
  {
    value: 'fondo_emergencia',
    label: 'Fondo de Reserva',
    parent: 'finanzas',
    emoji: '🛡️',
  },
  {
    value: 'inversion',
    label: 'Inversiones / Activos',
    parent: 'finanzas',
    emoji: '📈',
  },
  {
    value: 'salario',
    label: 'Salario / Sueldo',
    parent: 'ingresos',
    emoji: '💵',
  },
  {
    value: 'freelance_negocio',
    label: 'Freelance / Negocio',
    parent: 'ingresos',
    emoji: '💻',
  },
  {
    value: 'rendimientos',
    label: 'Intereses / Dividendos',
    parent: 'ingresos',
    emoji: '💰',
  },
  {
    value: 'ingreso_otro',
    label: 'Otro Ingreso',
    parent: 'ingresos',
    emoji: '📦',
  },
  {
    value: 'impuestos',
    label: 'Impuestos y Tasas',
    parent: 'otros',
    emoji: '🏛️',
  },
  {
    value: 'other',
    label: 'Ajuste / Otro',
    parent: 'otros',
    emoji: '⚙️',
  },
  {
    value: 'boda',
    label: 'Boda',
    parent: 'otros',
    emoji: '💍',
  },
];

/* =========================================================
   MAPA DE CATEGORÍAS
   Evita buscar TX_CATEGORIES[category] porque es un array.
========================================================= */

const TX_CATEGORY_MAP = Object.fromEntries(
  TX_CATEGORIES.map((category) => [
    category.value,
    category,
  ])
);

/* =========================================================
   NORMALIZACIÓN DE NÚMEROS
========================================================= */

const normalizeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

/* =========================================================
   NORMALIZACIÓN DE TRANSACCIONES
========================================================= */

const enrichTransaction = (transaction = {}) => {
  if (
    !transaction ||
    typeof transaction !== 'object'
  ) {
    throw new Error(
      'La transacción recibida no es válida.'
    );
  }

  const normalizedCategory =
    OLD_TO_NEW_CATEGORY[transaction.category] ||
    transaction.category ||
    'other';

  const categoryDefinition =
    TX_CATEGORY_MAP[normalizedCategory];

  const amount = Number(transaction.amount);

  return {
    ...transaction,

    title:
      transaction.title ??
      transaction.concept ??
      '',

    concept:
      transaction.concept ??
      transaction.title ??
      '',

    amount:
      Number.isFinite(amount)
        ? amount
        : 0,

    currency:
      transaction.currency || 'BOB',

    type:
      transaction.type || 'expense',

    category:
      normalizedCategory,

    parentCategory:
      transaction.parentCategory ||
      categoryDefinition?.parent ||
      'otros',
  };
};

/* =========================================================
   HOOK
========================================================= */

export function useTransactions({
  from = null,
  to = null,
  enabled = true,
  loadRange = false,
} = {}) {
  const auth = useAuth();
  const user = auth?.user;

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(false);

  const [error, setError] =
    useState(null);

  const cursorRef = useRef(null);

  const requestIdRef = useRef(0);

  /* =======================================================
     PRIMERA PÁGINA
  ======================================================= */

  const loadFirstPage = useCallback(
    async () => {
      const requestId =
        ++requestIdRef.current;

      if (!enabled || !user?.uid) {
        setTransactions([]);
        setLoading(false);
        setHasMore(false);
        setError(null);
        cursorRef.current = null;
        return;
      }

      setLoading(true);
      setError(null);
      cursorRef.current = null;

      try {
        const page =
          await getTransactionsPage(
            user.uid,
            {
              from,
              to,
              cursor: null,
              pageSize: PAGE_SIZE,
            }
          );

        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        let result =
          page.transactions.map(
            enrichTransaction
          );

        let cursor =
          page.cursor;

        let more =
          page.hasMore;

        /* -----------------------------------------------
           Si loadRange=true, cargar todo el rango
        ------------------------------------------------ */

        if (
          loadRange &&
          (from || to)
        ) {
          while (
            more &&
            cursor
          ) {
            const nextPage =
              await getTransactionsPage(
                user.uid,
                {
                  from,
                  to,
                  cursor,
                  pageSize:
                    PAGE_SIZE,
                }
              );

            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            const ids =
              new Set(
                result.map(
                  (item) =>
                    item.id
                )
              );

            result = [
              ...result,
              ...nextPage.transactions
                .map(enrichTransaction)
                .filter(
                  (item) =>
                    !ids.has(
                      item.id
                    )
                ),
            ];

            cursor =
              nextPage.cursor;

            more =
              nextPage.hasMore;
          }
        }

        setTransactions(result);

        cursorRef.current =
          cursor;

        setHasMore(
          loadRange
            ? false
            : more
        );
      } catch (requestError) {
        console.error(
          '❌ Error cargando transacciones:',
          requestError
        );

        setTransactions([]);
        setHasMore(false);

        setError(
          requestError?.message ||
            'No se pudieron cargar los movimientos.'
        );
      } finally {
        if (
          requestId ===
          requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [
      enabled,
      user?.uid,
      from,
      to,
      loadRange,
    ]
  );

  /* =======================================================
     RECARGAR CUANDO CAMBIA EL RANGO / USUARIO
  ======================================================= */

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  /* =======================================================
     CARGAR MÁS
     
     IMPORTANTE:
     Antes estaba cursor: null.
     Eso hacía que la paginación empezara nuevamente
     desde la primera página.
  ======================================================= */

  const loadMore = useCallback(
    async () => {
      if (
        !enabled ||
        loadRange ||
        !user?.uid ||
        !hasMore ||
        loadingMore ||
        !cursorRef.current
      ) {
        return;
      }

      setLoadingMore(true);

      try {
        const page =
          await getTransactionsPage(
            user.uid,
            {
              from,
              to,

              // CORREGIDO
              cursor:
                cursorRef.current,

              pageSize:
                PAGE_SIZE,
            }
          );

        const next =
          page.transactions.map(
            enrichTransaction
          );

        setTransactions(
          (current) => {
            const ids =
              new Set(
                current.map(
                  (item) =>
                    item.id
                )
              );

            return [
              ...current,
              ...next.filter(
                (item) =>
                  !ids.has(
                    item.id
                  )
              ),
            ];
          }
        );

        cursorRef.current =
          page.cursor;

        setHasMore(
          page.hasMore
        );
      } catch (requestError) {
        console.error(
          '❌ Error cargando más transacciones:',
          requestError
        );

        setError(
          requestError?.message ||
            'No se pudieron cargar más transacciones.'
        );
      } finally {
        setLoadingMore(false);
      }
    },
    [
      enabled,
      loadRange,
      user?.uid,
      from,
      to,
      hasMore,
      loadingMore,
    ]
  );

  /* =======================================================
     AGREGAR TRANSACCIÓN
  ======================================================= */

  const addTransaction =
    useCallback(
      async (transaction) => {
        if (!user?.uid) {
          throw new Error(
            'Usuario no autenticado.'
          );
        }

        if (
          !transaction ||
          typeof transaction !==
            'object'
        ) {
          throw new Error(
            'No se recibió una transacción válida desde el formulario.'
          );
        }

        console.log(
          '📥 Transacción recibida por useTransactions:',
          transaction
        );

        const normalized =
          enrichTransaction(
            transaction
          );

        console.log(
          '📤 Transacción normalizada:',
          normalized
        );

        await addTransactionInFirestore(
          user.uid,
          normalized
        );

        await loadFirstPage();
      },
      [
        user?.uid,
        loadFirstPage,
      ]
    );

  /* =======================================================
     ACTUALIZAR TRANSACCIÓN
  ======================================================= */

  const updateTransaction =
    useCallback(
      async (
        id,
        updates
      ) => {
        if (!user?.uid) {
          throw new Error(
            'Usuario no autenticado.'
          );
        }

        if (!id) {
          throw new Error(
            'Falta el ID de la transacción.'
          );
        }

        if (
          !updates ||
          typeof updates !==
            'object'
        ) {
          throw new Error(
            'Los datos de actualización no son válidos.'
          );
        }

        const normalized =
          enrichTransaction(
            updates
          );

        await updateTransactionInFirestore(
          user.uid,
          id,
          normalized
        );

        await loadFirstPage();
      },
      [
        user?.uid,
        loadFirstPage,
      ]
    );

  /* =======================================================
     ELIMINAR
  ======================================================= */

  const removeTransaction =
    useCallback(
      async (id) => {
        if (!user?.uid) {
          throw new Error(
            'Usuario no autenticado.'
          );
        }

        if (!id) {
          throw new Error(
            'Falta el ID de la transacción.'
          );
        }

        await removeTransactionInFirestore(
          user.uid,
          id
        );

        setTransactions(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id
            )
        );
      },
      [user?.uid]
    );

  /* =======================================================
     EXPORTAR
  ======================================================= */

  const getTransactionsForExport =
    useCallback(
      async () => {
        if (!user?.uid) {
          return [];
        }

        const result =
          await getAllTransactionsForExport(
            user.uid,
            {
              from,
              to,
              batchSize: 500,
            }
          );

        return result.map(
          enrichTransaction
        );
      },
      [
        user?.uid,
        from,
        to,
      ]
    );

  /* =======================================================
     RETURN
  ======================================================= */

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