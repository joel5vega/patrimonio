import { useEffect, useMemo, useRef, useState } from 'react';
import { squarify } from './treemap';

export const HEADER_H = 22; // alto de la cabecera del rol (px)
const FRAME_PAD = 2; // margen interno entre marco del rol y sus tiles

// Mide el ancho del contenedor y lo mantiene actualizado.
export function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

const HEIGHT_SCALE = 0.8; // factor global sobre la altura base
const MAX_VIEWPORT_RATIO = 0.8; // el stage nunca supera 80% del alto de pantalla
const MIN_HEIGHT = 280;

// Alto de la ventana, actualizado al redimensionar.
export function useViewportHeight() {
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 900 : window.innerHeight));

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return vh;
}

// Alto del heatmap: proporcional al ancho (apaisado en desktop, vertical en móvil),
// reducido por HEIGHT_SCALE y limitado a un % del viewport.
export function stageHeight(width, viewportHeight) {
  if (width <= 0) return 0;
  const ratio = width < 640 ? 1.3 : width < 1024 ? 0.8 : 0.52;
  const base = width * ratio * HEIGHT_SCALE;
  const cap = viewportHeight * MAX_VIEWPORT_RATIO;
  return Math.round(Math.max(MIN_HEIGHT, Math.min(base, cap)));
}

/**
 * Calcula rectángulos de roles y de tiles (ambos en px, coordenadas del stage).
 * @param {Array<{key,total,assets}>} roles
 */
export function useTreemapLayout(roles, width, height) {
  return useMemo(() => {
    if (!width || !height) return { roles: [], tiles: [] };

    const roleRects = squarify(
      roles.map((role) => ({ ...role, value: role.total })),
      { x: 0, y: 0, w: width, h: height },
    );

    const tiles = [];
    const framedRoles = roleRects.map((role) => {
      const showHeader = role.w >= 86 && role.h >= 58;
      const top = showHeader ? HEADER_H : 0;
      const inner = {
        x: role.x + FRAME_PAD,
        y: role.y + top + FRAME_PAD,
        w: role.w - FRAME_PAD * 2,
        h: role.h - top - FRAME_PAD * 2,
      };

      const assetRects = squarify(
        role.assets.map((asset) => ({ asset, value: asset.valueUSD })),
        inner,
      );
      tiles.push(...assetRects.map((rect) => ({ ...rect, roleKey: role.key })));

      return { ...role, showHeader };
    });

    return { roles: framedRoles, tiles };
  }, [roles, width, height]);
}