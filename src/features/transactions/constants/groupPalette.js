// Shared group colors — Altitude (mostly monochrome + voltage blue)
export const GROUP_COLORS = {
  hogar: 'bg-[#2b7fff]',
  estilo_vida: 'bg-[#a4a19b]',
  bienestar: 'bg-[#5a9fff]',
  fe: 'bg-[#c9a227]',
  finanzas: 'bg-[#eeeeee]',
  ingresos: 'bg-[#2b7fff]',
  otros: 'bg-[#5e5d59]',
};

export const GROUP_TEXT = {
  hogar: 'text-[#2b7fff]',
  estilo_vida: 'text-[#a4a19b]',
  bienestar: 'text-[#5a9fff]',
  fe: 'text-[#c9a227]',
  finanzas: 'text-[#eeeeee]',
  ingresos: 'text-[#2b7fff]',
  otros: 'text-[#5e5d59]',
};

export const GROUP_HEX = {
  hogar: '#2b7fff',
  estilo_vida: '#a4a19b',
  bienestar: '#5a9fff',
  fe: '#c9a227',
  finanzas: '#eeeeee',
  ingresos: '#2b7fff',
  otros: '#5e5d59',
};

export function groupColor(key) { return GROUP_COLORS[key] || 'bg-[#5e5d59]'; }
export function groupText(key)  { return GROUP_TEXT[key]   || 'text-[#5e5d59]'; }
export function groupHex(key)   { return GROUP_HEX[key]    || '#5e5d59'; }
