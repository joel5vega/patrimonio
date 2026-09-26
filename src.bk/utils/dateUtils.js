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

  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const text = String(value).trim();
  const numeric = Number(text);

  if (Number.isFinite(numeric) && numeric > 40000) {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + numeric * 86400000);
  }

  // Fecha contable: se interpreta en hora local.
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (iso) {
    const [, year, month, day] = iso;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(text);

  return parsed;
};

export const toDateInputValue = (dateValue, fallback = '') => {
  const date = parseLocal(dateValue);

  if (Number.isNaN(date.getTime())) {
    return fallback || '';
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

export const formatDateFull = (dateValue) => {
  const date = parseLocal(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatTime = (dateValue) => {
  if (!dateValue) return null;

  const date =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : dateValue instanceof Date
        ? dateValue
        : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const formatDateTime = (dateValue) => {
  if (!dateValue) return '—';

  const date =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : dateValue instanceof Date
        ? dateValue
        : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', ' ·');
};

export const transactionDate = (tx) =>
  tx?.date || tx?.createdAt || null;