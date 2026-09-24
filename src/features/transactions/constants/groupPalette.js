// src/features/transactions/constants/groupPalette.js
//
// ANTES: Analytics.jsx y Budget.jsx tenían cada uno su propia copia de este
// mapa, y ninguna coincidía del todo con las claves reales de TX_GROUPS
// (ver src/hooks/useTransactions.js):
//   - Analytics tenía 'estilovida' (sin guion bajo) en vez de 'estilo_vida'
//     → esa categoría siempre caía al color por defecto.
//   - Budget tenía 'familia', 'desarrollo', 'inversiones' — claves que ya
//     no existen. Los grupos reales 'estilo_vida', 'bienestar', 'finanzas'
//     e 'ingresos' nunca tenían color propio en el presupuesto.
//
// Con esto, ambas páginas comparten un solo mapa correcto.
export const GROUP_COLORS = {
  hogar: 'bg-blue-500',
  estilo_vida: 'bg-pink-500',
  bienestar: 'bg-purple-500',
  fe: 'bg-yellow-500',
  finanzas: 'bg-emerald-500',
  ingresos: 'bg-teal-500',
  otros: 'bg-white/30',
};

export const GROUP_TEXT = {
  hogar: 'text-blue-400',
  estilo_vida: 'text-pink-400',
  bienestar: 'text-purple-400',
  fe: 'text-yellow-400',
  finanzas: 'text-emerald-400',
  ingresos: 'text-teal-400',
  otros: 'text-white/40',
};

export const GROUP_HEX = {
  hogar: '#3b82f6',
  estilo_vida: '#ec4899',
  bienestar: '#a855f7',
  fe: '#eab308',
  finanzas: '#10b981',
  ingresos: '#2dd4bf',
  otros: 'rgba(255,255,255,0.3)',
};

export function groupColor(key) { return GROUP_COLORS[key] || 'bg-white/20'; }
export function groupText(key)  { return GROUP_TEXT[key]   || 'text-white/40'; }
export function groupHex(key)   { return GROUP_HEX[key]    || 'rgba(255,255,255,0.3)'; }
