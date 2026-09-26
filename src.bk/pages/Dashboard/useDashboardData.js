// src/pages/Dashboard/useDashboardData.js
//
// Toda la preparación de datos del Dashboard (ordenar, filtrar, totalizar)
// vive acá, separada del render. Dashboard.jsx solo consume el resultado.
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useIdeas } from '../../hooks/useIdeas';

// ── Helpers de fecha ──────────────────────────────────────
const excelSerialToDate = (value) => {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isNaN(num) && num < 100000) {
    const base = new Date(1899, 11, 30);
    return new Date(base.getTime() + num * 86400000);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const parseAnyDate = (raw) => {
  if (!raw) return null;
  if (typeof raw?.toDate === 'function') return raw.toDate();
  if (typeof raw === 'number') {
    if (raw < 100000) return excelSerialToDate(raw);
    return new Date(raw);
  }
  if (typeof raw === 'string') {
    if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
      const [d, m, y] = raw.split('/');
      return new Date(`${y}-${m}-${d}`);
    }
    if (/^\d{4}\.\d{2}\.\d{2}/.test(raw)) {
      return new Date(raw.replace(/\./g, '-'));
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const isTodayRecord = (recordDate) => {
  if (!recordDate) return false;
  const today = new Date();
  if (typeof recordDate === 'string') {
    const str1 = today.toISOString().slice(0, 10);
    const str2 = str1.replace(/-/g, '.');
    if (recordDate.startsWith(str1) || recordDate.startsWith(str2)) return true;
  }
  const d = parseAnyDate(recordDate);
  if (!d || isNaN(d.getTime())) return false;
  return (
    d.getDate()     === today.getDate() &&
    d.getMonth()    === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

const isTxToday = (tx) =>
  isTodayRecord(tx.date) || isTodayRecord(tx.createdAt) || isTodayRecord(tx.fecha);

export function useDashboardData() {
  const {
    totalValue        = 0,
    totalPnl          = 0,
    totalCryptoUSD    = 0,
    totalInversionUSD = 0,
    totalManualUSD    = 0,
    bobRate,
    loading           = false,
    monthlyReturn     = 0,
  } = useApp();

  const { transactions } = useTransactions();
  const { ideas, loading: loadingIdeas } = useIdeas();

  const [timeFilter, setTimeFilter] = useState('today');

  const isPositive = totalPnl >= 0;
  const usdValue    = bobRate > 0 ? totalValue / bobRate : 0;

  const totalUSD  = totalCryptoUSD + totalInversionUSD + (totalManualUSD ?? 0);
  const pctCrypto = totalUSD > 0 ? (totalCryptoUSD    / totalUSD * 100) : 0;
  const pctEtf    = totalUSD > 0 ? (totalInversionUSD / totalUSD * 100) : 0;
  const pctManual = totalUSD > 0 ? ((totalManualUSD ?? 0) / totalUSD * 100) : 0;

  const sortedTx = [...transactions].sort((a, b) => {
    const aDate = parseAnyDate(a.createdAt) || parseAnyDate(a.date);
    const bDate = parseAnyDate(b.createdAt) || parseAnyDate(b.date);
    return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
  });

  const recent = sortedTx
    .filter((tx) => {
      if (typeof tx.amount !== 'number') return false;
      if (timeFilter === 'history') return true;
      return isTxToday(tx);
    })
    .slice(0, timeFilter === 'history' ? 20 : 10)
    .map((tx) => {
      const rawDate = tx.createdAt || tx.date;
      const d = parseAnyDate(rawDate);
      const dateLabel = d
        ? d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      return { ...tx, dateLabel };
    });

  const totalIncome  = recent.filter((t) => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const totalExpense = recent.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance       = totalIncome - totalExpense;

  const filteredIdeas = timeFilter === 'today'
    ? ideas.filter((i) => isTodayRecord(i.date || i.createdAt))
    : ideas;

  return {
    loading,
    timeFilter,
    setTimeFilter,
    totalValue, usdValue, bobRate,
    isPositive, totalPnl, monthlyReturn,
    totalCryptoUSD, totalInversionUSD, totalManualUSD,
    pctCrypto, pctEtf, pctManual,
    recent,
    transactionsCount: transactions.length,
    totalIncome, totalExpense, balance,
    filteredIdeas, loadingIdeas,
  };
}
