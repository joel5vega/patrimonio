// utils/dateUtils.js

export const todayLocal = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

export const parseLocal = (value) => {
  if (value === null || value === undefined || value === '') {
    return new Date(NaN);
  }

  if (value?.toDate) {
    const date = value.toDate();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  const numeric = Number(text);

  if (Number.isFinite(numeric) && numeric > 40000) {
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + numeric * 86400000);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, year, month, day] = iso;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return new Date(NaN);
};

export const toDateInputValue = (dateValue, fallback = '') => {
  const date = parseLocal(dateValue);
  if (Number.isNaN(date.getTime())) return fallback || '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

export const formatDateFull = (dateValue) => {
  const date = parseLocal(dateValue);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (dateValue) => {
  if (!dateValue || !dateValue?.toDate && !dateValue) return null;
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const transactionDate = (tx) => tx?.date || tx?.createdAt || null;

