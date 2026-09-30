// Helpers de fecha para Analytics.
// Todas las operaciones usan hora local para evitar desplazamientos por UTC.

export function toDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  if (typeof raw?.toDate === 'function') return toDate(raw.toDate());
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof raw === 'string') {
    const value = raw.trim();
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // YYYY-MM-DD: interpretar como fecha local, no UTC.
    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const [, year, month, day] = isoDate;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(raw) {
  const d = toDate(raw);
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
}

export function endOfDay(raw) {
  const d = toDate(raw);
  return d
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    : null;
}

export function formatQueryDate(raw) {
  const d = toDate(raw);
  if (!d) return null;
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function toInputDate(raw) {
  return formatQueryDate(raw) || '';
}

export function fmtDate(raw) {
  const d = toDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtMonth(raw) {
  const d = toDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString('es-BO', {
    month: 'short',
    year: '2-digit',
  }).replace('.', '');
}

export function startOfMonth(raw = new Date()) {
  const d = toDate(raw) || new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(raw = new Date()) {
  const d = toDate(raw) || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(raw, amount) {
  const d = toDate(raw) || new Date();
  return new Date(d.getFullYear(), d.getMonth() + amount, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
}

export function getStartDate(period, now = new Date()) {
  const d = toDate(now) || new Date();
  switch (period) {
    case '7d':
      return startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6));
    case '1m':
      return startOfDay(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()));
    case '3m':
      return startOfDay(new Date(d.getFullYear(), d.getMonth() - 3, d.getDate()));
    case '1y':
      return startOfDay(new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()));
    default:
      return null;
  }
}

export function getRangeEnd(period, now = new Date()) {
  if (period === 'all') return null;
  return endOfDay(now);
}

export function getPreviousRange(period, customStart, customEnd, now = new Date()) {
  const currentStart =
    period === 'custom'
      ? startOfDay(customStart)
      : getStartDate(period, now);
  const currentEnd =
    period === 'custom'
      ? endOfDay(customEnd)
      : getRangeEnd(period, now);

  if (!currentStart || !currentEnd) return null;

  const duration = currentEnd.getTime() - currentStart.getTime();
  const end = new Date(currentStart.getTime() - 1);
  const start = new Date(end.getTime() - duration);

  return { start, end };
}

export function getMonthStart(monthsAgo = 0, now = new Date()) {
  const d = toDate(now) || new Date();
  return new Date(d.getFullYear(), d.getMonth() - monthsAgo, 1);
}

export function getMonthEnd(monthsAgo = 0, now = new Date()) {
  const d = toDate(now) || new Date();
  return new Date(d.getFullYear(), d.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
}

export function getMonthsBetween(start, end) {
  const a = startOfMonth(start);
  const b = startOfMonth(end);
  if (!a || !b || a > b) return [];

  const result = [];
  let cursor = new Date(a);
  while (cursor <= b) {
    result.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return result;
}
