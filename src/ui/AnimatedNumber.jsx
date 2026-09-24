// src/ui/AnimatedNumber.jsx
import { useEffect, useRef } from 'react';

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function AnimatedNumber({ value, prefix = '', decimals = 2, className = '' }) {
  const ref     = useRef(null);
  const prevRef = useRef(0);
  const rafRef  = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to   = Number(value) || 0;
    prevRef.current = to;
    if (from === to) return;

    const duration  = 900;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current  = from + (to - from) * easeOutExpo(progress);
      if (ref.current) {
        ref.current.textContent =
          prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, prefix, decimals]);

  const formatted = (Number(value) || 0).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return <span ref={ref} className={className}>{prefix}{formatted}</span>;
}
