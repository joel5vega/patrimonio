// utils/filterByPeriod.js

export const parseLocal = (dateStr) => {
  if (!dateStr) return new Date(NaN);

  // ── Caso 1: Serial de Excel (ej: "45512" o 45512) ──
  const num = Number(dateStr);
  if (!isNaN(num) && num > 40000) {
    // Excel cuenta desde 1900-01-01, con bug del año bisiesto 1900
    const excelEpoch = new Date(1899, 11, 30); // 30 dic 1899
    const ms = excelEpoch.getTime() + num * 86400000;
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // ── Caso 2: ISO string "2026-03-17" ──
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // ── Caso 3: Timestamp Firestore (objeto con .toDate()) ──
  if (dateStr?.toDate) {
    const d = dateStr.toDate();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return new Date(NaN);
};

export const isInPeriod = (dateStr, period) => {
  if (!period) return true;

  const date = parseLocal(dateStr);
  if (isNaN(date.getTime())) return true;

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'week': {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return date >= monday && date <= sunday;
    }
    case 'month':
      // ✅ usa today (normalizado) en vez de now
      return (
        date.getMonth()    === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    case 'quarter': {
      const q     = Math.floor(today.getMonth()  / 3);
      const qDate = Math.floor(date.getMonth() / 3);
      return qDate === q && date.getFullYear() === today.getFullYear();
    }
    case 'year':
      return date.getFullYear() === today.getFullYear();
    default:
      return true;
  }
};


