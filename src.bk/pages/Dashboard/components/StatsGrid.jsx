// src/pages/Dashboard/components/StatsGrid.jsx
import { forwardRef, useEffect, useRef } from 'react';
import { Activity, PieChart, Target } from 'lucide-react';
import { animate } from 'animejs';

const StatCard = ({ label, value, prefix = '$', color, icon: Icon, delay = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, { opacity: [0, 1], translateY: [20, 0], scale: [0.95, 1], duration: 500, ease: 'outExpo', delay });
  }, [delay]);

  return (
    <div ref={ref} className="db-stat-card" style={{ opacity: 0 }}>
      <div className="db-stat-top">
        <div className="db-stat-icon" style={{ color }}><Icon size={16} /></div>
      </div>
      <p className="db-stat-label">{label}</p>
      <p className="db-stat-value" style={{ color }}>
        {prefix}{Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
};

const StatsGrid = forwardRef(function StatsGrid({ totalCryptoUSD, totalInversionUSD, totalManualUSD }, ref) {
  return (
    <div ref={ref} className="db-stats-grid">
      <StatCard label="Crypto" value={totalCryptoUSD}      color="var(--color-accent-orange)" icon={Activity} delay={0}   />
      <StatCard label="ETFs"   value={totalInversionUSD}   color="var(--color-info)"          icon={PieChart} delay={80}  />
      <StatCard label="Manual" value={totalManualUSD ?? 0} color="var(--color-success)"       icon={Target}   delay={160} />
    </div>
  );
});

export default StatsGrid;
