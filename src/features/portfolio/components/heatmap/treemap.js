// Squarified treemap (Bruls et al.). Pure functions, no React.
// Cada rectángulo recibe un área exactamente proporcional a `value`.

const sum = (list) => list.reduce((acc, n) => acc + n, 0);

// Peor relación de aspecto de una fila de áreas dado el lado corto del espacio libre.
function worstRatio(areas, side) {
  const total = sum(areas);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (total * total), (total * total) / (side * side * min));
}

// Coloca una fila contra el lado corto y devuelve el espacio libre restante.
function layoutRow(row, free, out) {
  const rowArea = sum(row.map((n) => n.area));

  if (free.w >= free.h) {
    const colW = rowArea / free.h;
    let y = free.y;
    for (const n of row) {
      const h = n.area / colW;
      out.push({ ...n.item, x: free.x, y, w: colW, h });
      y += h;
    }
    return { x: free.x + colW, y: free.y, w: free.w - colW, h: free.h };
  }

  const rowH = rowArea / free.w;
  let x = free.x;
  for (const n of row) {
    const w = n.area / rowH;
    out.push({ ...n.item, x, y: free.y, w, h: rowH });
    x += w;
  }
  return { x: free.x, y: free.y + rowH, w: free.w, h: free.h - rowH };
}

/**
 * @param {Array<{value:number}>} items  elementos con `value` > 0
 * @param {{x:number,y:number,w:number,h:number}} rect  contenedor en px
 * @returns items con x, y, w, h añadidos
 */
export function squarify(items, rect) {
  const valid = items.filter((i) => i.value > 0);
  const total = sum(valid.map((i) => i.value));
  if (!valid.length || rect.w <= 0 || rect.h <= 0) return [];

  const scale = (rect.w * rect.h) / total;
  const nodes = valid
    .map((item) => ({ item, area: item.value * scale }))
    .sort((a, b) => b.area - a.area);

  const out = [];
  let free = { ...rect };
  let row = [];

  for (const node of nodes) {
    const side = Math.min(free.w, free.h);
    const candidate = [...row, node];
    const improves =
      row.length === 0 ||
      worstRatio(candidate.map((n) => n.area), side) <=
        worstRatio(row.map((n) => n.area), side);

    if (improves) {
      row = candidate;
    } else {
      free = layoutRow(row, free, out);
      row = [node];
    }
  }

  if (row.length) layoutRow(row, free, out);
  return out;
}
