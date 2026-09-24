// src/pages/Analytics/dateHelpers.js
export function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case '7d': return new Date(now - 7 * 86400000);
    case '1m': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:   return null; // 'all' y 'custom' no usan este cálculo
  }
}

export function toDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw?.toDate === 'function') return raw.toDate();
  if (typeof raw === 'number') return new Date(raw);
  if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

export function fmtDate(raw) {
  const d = toDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toInputDate(date) {
  if (!date) return '';
  const d = toDate(date);
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

export function getMonthStart(monthsAgo) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}

export function getMonthEnd(monthsAgo) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
}

export function getPreviousRange(period, customStart, customEnd) {
  const now = new Date();
  switch (period) {
    case '7d':
      return { start: new Date(now - 14 * 86400000), end: new Date(now - 7 * 86400000) };
    case '1m':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      };
    case '3m':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      };
    case '1y':
      return {
        start: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      };
    case 'custom': {
      if (!customStart || !customEnd) return null;
      const diff = customEnd - customStart;
      const end = new Date(customStart - 1);
      return { start: new Date(end - diff), end };
    }
    default:
      return null;
  }
}
