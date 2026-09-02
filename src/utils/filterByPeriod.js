// utils/filterByPeriod.js
import { parseLocal } from './dateUtils';

export { parseLocal };

export const isInPeriod = (value, period) => {
  if (!period) return true;

  const date = parseLocal(value);
  if (Number.isNaN(date.getTime())) return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'week': {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));

      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);

      return date >= monday && date < nextMonday;
    }

    case 'month':
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );

    case 'quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      return (
        Math.floor(date.getMonth() / 3) === currentQuarter &&
        date.getFullYear() === today.getFullYear()
      );
    }

    case 'year':
      return date.getFullYear() === today.getFullYear();

    default:
      return true;
  }
};