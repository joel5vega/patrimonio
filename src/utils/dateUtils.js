// utils/dateUtils.js

// 1. Convierte CUALQUIER formato a Date nativo (para comparaciones)
export function toDate(raw) {
  if (!raw) return null;
  // Firestore Timestamp
  if (typeof raw?.toDate === 'function') return raw.toDate();
  // Número epoch ms o serial Excel
  if (typeof raw === 'number') {
    // Serial Excel (valores < 100000 son seriales, no epoch ms)
    if (raw < 100000) return new Date(Math.round((raw - 25569) * 86400 * 1000));
    return new Date(raw);
  }
  // String numérico (serial Excel guardado como string)
  if (typeof raw === 'string' && /^\d{5}$/.test(raw)) {
    return new Date(Math.round((Number(raw) - 25569) * 86400 * 1000));
  }
  // String DD/MM/YYYY
  if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  // String ISO u otro formato estándar
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

// 2. Formatea para mostrar en pantalla
export function formatDate(raw) {
  const date = toDate(raw);
  if (!date) return '—';
  return date.toLocaleDateString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}