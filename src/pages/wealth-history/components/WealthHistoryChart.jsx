import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { animate } from 'animejs';
import { formatUSD } from '../wealthHistory.helpers';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const NICE_STEPS = [1, 2, 2.5, 5, 10];

function niceStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const exponent = Math.floor(Math.log10(rawStep));
  const magnitude = 10 ** exponent;
  const normalized = rawStep / magnitude;
  const multiplier = NICE_STEPS.find((step) => normalized <= step) ?? 10;
  return multiplier * magnitude;
}

function getScale(values, { zeroBaseline = false, paddingRatio = 0.18 } = {}) {
  const validValues = values
    .map(Number)
    .filter(Number.isFinite);

  if (!validValues.length) {
    return { min: 0, max: 1, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1] };
  }

  const dataMin = Math.min(...validValues);
  const dataMax = Math.max(...validValues);
  const dataRange = dataMax - dataMin;

  if (dataRange === 0) {
    const padding = Math.max(Math.abs(dataMax) * 0.01, 1);
    const min = zeroBaseline ? 0 : dataMin - padding;
    const max = dataMax + padding;
    const step = niceStep((max - min) / 5);
    return { min, max: min + step * 5, step, ticks: Array.from({ length: 6 }, (_, i) => min + step * i) };
  }

  const padding = Math.max(dataRange * paddingRatio, Math.abs(dataMax) * 0.0005, 0.01);
  const rawMin = zeroBaseline ? 0 : dataMin - padding;
  const rawMax = dataMax + padding;
  const step = niceStep((rawMax - rawMin) / 5);
  const min = zeroBaseline ? 0 : Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + step * i);

  return { min, max, step, ticks };
}

function formatAxisValue(value) {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(2)}k`;
  return formatUSD(value);
}

const pathFor = (data, x, y) => {
  if (data.length < 2) return '';
  return data.reduce((path, item, index) => {
    const current = [x(index, data.length), y(item.v)];
    if (index === 0) return `M ${current[0]},${current[1]}`;
    const previous = [x(index - 1, data.length), y(data[index - 1].v)];
    const center = (previous[0] + current[0]) / 2;
    return `${path} C ${center},${previous[1]} ${center},${current[1]} ${current[0]},${current[1]}`;
  }, '');
};

function Tooltip({ point, position }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) animate(ref.current, { opacity: [0, 1], scale: [0.96, 1], duration: 140, ease: 'outQuad' });
  }, [point?.index]);

  if (!point || !position) return null;

  const tooltipWidth = 190;
  const left = clamp(position.x + 14, 8, window.innerWidth - tooltipWidth - 8);
  const top = clamp(position.y - 12, 8, window.innerHeight - 160);

  return ReactDOM.createPortal(
    <div ref={ref} role="status" aria-live="polite" style={{ position: 'fixed', left, top, zIndex: 50, width: tooltipWidth, pointerEvents: 'none', transformOrigin: 'left center' }} className="rounded-xl border border-slate-200 bg-white/95 p-3 text-sm shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mb-2 font-semibold text-slate-800 dark:text-slate-100">{point.date}</div>
      {point.values.map((item) => (
        <div key={item.key ?? item.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
          <strong className="text-slate-800 dark:text-slate-100">{formatUSD(item.v)}</strong>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export default function WealthHistoryChart({ series = [], onHoverChange, zeroBaseline = false }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 360 });
  const [activeIndex, setActiveIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const updateSize = () => setSize({ width: Math.max(320, element.clientWidth), height: element.clientWidth < 560 ? 320 : 360 });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const margin = useMemo(() => ({ top: 20, right: 20, bottom: 56, left: 64 }), []);
  const chartWidth = size.width - margin.left - margin.right;
  const chartHeight = size.height - margin.top - margin.bottom;

  const allData = useMemo(() => {
    const firstData = series[0]?.data ?? [];
    return firstData.map((item, index) => ({
      date: item.date,
      values: series.map((entry) => ({ key: entry.key ?? entry.name, name: entry.name, color: entry.color, v: Number(entry.data?.[index]?.v ?? 0) })),
    }));
  }, [series]);

  const scale = useMemo(() => getScale(allData.flatMap((item) => item.values.map((value) => value.v)), { zeroBaseline }), [allData, zeroBaseline]);

  const x = useCallback((index, length = allData.length) => (length <= 1 ? chartWidth / 2 : (index / (length - 1)) * chartWidth), [chartWidth, allData.length]);
  const y = useCallback((value) => chartHeight - ((value - scale.min) / (scale.max - scale.min)) * chartHeight, [chartHeight, scale]);

  const getNearestIndex = useCallback((event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = clamp(event.clientX - bounds.left - margin.left, 0, chartWidth);
    return allData.length <= 1 ? 0 : clamp(Math.round((localX / chartWidth) * (allData.length - 1)), 0, allData.length - 1);
  }, [allData.length, chartWidth, margin.left]);

  const handlePointerMove = useCallback((event) => {
    if (!allData.length) return;
    const index = getNearestIndex(event);
    const point = { ...allData[index], index };
    setActiveIndex(index);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    onHoverChange?.(point);
  }, [allData, getNearestIndex, onHoverChange]);

  const handlePointerLeave = useCallback(() => {
    setActiveIndex(null);
    setTooltipPosition(null);
    onHoverChange?.(null);
  }, [onHoverChange]);

  const activePoint = activeIndex == null ? null : { ...allData[activeIndex], index: activeIndex };
  const labelIndexes = allData.length <= 1 ? [0] : Array.from({ length: Math.min(6, allData.length) }, (_, i) => Math.round((i * (allData.length - 1)) / (Math.min(6, allData.length) - 1)));

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="Historial del patrimonio" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} className="block select-none overflow-visible">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {scale.ticks.map((value) => {
            const yPosition = y(value);
            return <g key={value}><line x1="0" x2={chartWidth} y1={yPosition} y2={yPosition} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" /><text x={-12} y={yPosition + 4} textAnchor="end" className="fill-slate-500 text-[11px] dark:fill-slate-400">{formatAxisValue(value)}</text></g>;
          })}

          <line x1="0" x2={chartWidth} y1={chartHeight} y2={chartHeight} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />

          {labelIndexes.map((index) => <g key={`x-${index}`}><line x1={x(index)} x2={x(index)} y1={chartHeight} y2={chartHeight + 5} className="stroke-slate-400 dark:stroke-slate-500" vectorEffect="non-scaling-stroke" /><text x={x(index)} y={chartHeight + 25} textAnchor="middle" className="fill-slate-500 text-[11px] dark:fill-slate-400">{allData[index]?.date ?? ''}</text></g>)}

          {series.map((entry) => <path key={entry.key ?? entry.name} d={pathFor(entry.data ?? [], x, y)} fill="none" stroke={entry.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}

          {activePoint && <><line x1={x(activeIndex)} x2={x(activeIndex)} y1="0" y2={chartHeight} className="stroke-slate-400/70 dark:stroke-slate-500/70" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} /><circle cx={x(activeIndex)} cy={y(activePoint.values[0]?.v ?? 0)} r="5" fill="white" stroke="currentColor" strokeWidth="2" className="text-slate-700 dark:text-slate-100" style={{ pointerEvents: 'none' }} /></>}

          <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="transparent" style={{ cursor: 'crosshair' }} />
        </g>
      </svg>
      <Tooltip point={activePoint} position={tooltipPosition} />
    </div>
  );
}