// src/features/portfolio/hooks/portfolioData/allocationRows.js
//
// Filas de asignación por rol: actual vs objetivo del perfil del inversionista.

import { safeNumber } from './numbers.js';

export function statusFromDiff(diff) {
  const abs = Math.abs(safeNumber(diff));
  if (abs >= 5) return 'critical';
  if (abs >= 1) return 'warning';
  return 'ok';
}

/** Filas base: las del backend, o derivadas de byRole si no hay. */
function getSourceRows(allocationAnalysis, byRole) {
  const rows = allocationAnalysis.roleRows ?? allocationAnalysis.rows;
  if (Array.isArray(rows) && rows.length) return rows;

  return Object.entries(byRole).map(([role, pct]) => ({ role, currentPct: pct }));
}

export function buildAllocationRows({
  allocationAnalysis = {},
  byRole = {},
  byRoleUSD = {},
  targets = {},
  assets = [],
}) {
  return getSourceRows(allocationAnalysis, byRole).map((row) => {
    const role = row.role ?? row.key;
    const currentPct = safeNumber(row.currentPct ?? row.current);
    const targetPct = safeNumber(targets[role] ?? row.targetPct ?? row.target, null);
    const differencePct = targetPct === null ? null : currentPct - targetPct;

    return {
      ...row,
      key: role,
      role,
      label: row.label ?? role,
      current: currentPct,
      currentPct,
      currentUSD: safeNumber(row.currentUSD ?? byRoleUSD[role]),
      target: targetPct,
      targetPct,
      difference: differencePct,
      differencePct,
      status: differencePct === null ? 'unknown' : statusFromDiff(differencePct),
      action: row.action ?? null,
      assets: assets.filter((asset) => asset.role === role),
    };
  });
}
