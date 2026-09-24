// src/pages/Dashboard/Dashboard.jsx
import { useEffect, useRef } from 'react';
import { Plus, ShieldAlert, PiggyBank, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { animate, stagger } from 'animejs';

import QuickLinks from '../../ui/QuickLinks';
import { useDashboardData } from './useDashboardData';
import BibleVerse from './components/BibleVerse';
import HeroCard from './components/HeroCard';
import StatsGrid from './components/StatsGrid';
import FlowCard from './components/FlowCard';
import ActivityList from './components/ActivityList';
import IdeasSection from './components/IdeasSection';
import './Dashboard.css';

const QUICK_LINKS = [
  { to: '/risk',            icon: ShieldAlert, label: 'Riesgo',  accent: 'danger' },
  { to: '/manual',          icon: PiggyBank,   label: 'Manual',  accent: 'success' },
  { to: '/trading-history', icon: LineChart,   label: 'Trading', accent: 'info' },
];

export default function Dashboard() {
  const data = useDashboardData();
  const navigate = useNavigate();

  const heroRef    = useRef(null);
  const metricsRef = useRef(null);
  const txRef      = useRef(null);

  useEffect(() => {
    if (data.loading) return;
    if (heroRef.current) {
      animate(heroRef.current, { opacity: [0, 1], translateY: [-20, 0], duration: 600, ease: 'outExpo', delay: 100 });
    }
    if (metricsRef.current) {
      animate(metricsRef.current.querySelectorAll('.db-stat-card'), {
        opacity: [0, 1], translateY: [24, 0], scale: [0.94, 1],
        duration: 500, ease: 'outExpo', delay: stagger(80, { start: 300 }),
      });
    }
  }, [data.loading]);

  useEffect(() => {
    if (!txRef.current) return;
    const items = txRef.current.querySelectorAll('.db-tx-item');
    if (!items.length) return;
    animate(items, { opacity: [0, 1], translateX: [-12, 0], duration: 280, ease: 'outExpo', delay: stagger(40) });
  }, [data.timeFilter, data.recent]);

  if (data.loading) {
    return <div className="db-loading"><div className="db-loading-spinner" /></div>;
  }

  return (
    <div className="db-page">
      <div className="db-verse-wrap"><BibleVerse /></div>

      <HeroCard
        ref={heroRef}
        totalValue={data.totalValue}
        usdValue={data.usdValue}
        bobRate={data.bobRate}
        pctCrypto={data.pctCrypto}
        pctEtf={data.pctEtf}
        pctManual={data.pctManual}
        isPositive={data.isPositive}
        totalPnl={data.totalPnl}
        monthlyReturn={data.monthlyReturn}
      />

      <StatsGrid
        ref={metricsRef}
        totalCryptoUSD={data.totalCryptoUSD}
        totalInversionUSD={data.totalInversionUSD}
        totalManualUSD={data.totalManualUSD}
      />

      {/* Accesos rápidos — pantallas que no viven en el tab bar principal */}
      <QuickLinks items={QUICK_LINKS} />

      <FlowCard
        timeFilter={data.timeFilter}
        totalIncome={data.totalIncome}
        totalExpense={data.totalExpense}
        balance={data.balance}
      />

      <ActivityList
        ref={txRef}
        timeFilter={data.timeFilter}
        setTimeFilter={data.setTimeFilter}
        recent={data.recent}
        transactionsCount={data.transactionsCount}
      />

      <IdeasSection loading={data.loadingIdeas} ideas={data.filteredIdeas} />

      <button className="db-fab" onClick={() => navigate('/new-transaction')}>
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
