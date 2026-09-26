// utils/formatDate.js  (o directo en el componente)
export const formatDate = (raw) => {
  if (!raw) return '—';

  // Si es número (fecha serial de Sheets/Excel)
  if (!isNaN(Number(raw))) {
    const serial = Number(raw);
    // Epoch de Excel: 1 enero 1900, con bug del año bisiesto 1900
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Si ya es string ISO (2024-03-18)
  const date = new Date(raw);
  if (isNaN(date)) return raw;
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};