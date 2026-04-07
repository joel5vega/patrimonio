// pages/QuantDashboard.jsx
// Orquesta todos los sub-componentes con datos de ejemplo
import React from 'react';
import './Portfolio.css';

import QuantHeader    from '../components/QuantHeader';
import DonutChart     from '../components/DonutChart';
import AlertPanel     from '../components/AlertPanel';
import RoleEngine     from '../components/RoleEngine';
import RebalancePlan  from '../components/RebalancePlan';
import AssetList      from '../components/AssetList';

// ─── Sample data (reemplazar con props / context / API) ───────────────────────
const HEADER_METRICS = [
  { label: 'HHI Index',      value: '0.1842'  },
  { label: 'Portfolio Risk', value: '4.82',   color: '#facc15' },
  { label: 'Cash Drag',      value: '0.0510'  },
  { label: 'Est. Return',    value: '14.2%',  color: '#34d399' },
];

const SEGMENTS = [
  { label: 'Crypto',  color: '#f97316', valueUSD: '$12,400', pct: '13.2%', deg: 45  },
  { label: 'Stable',  color: '#10b981', valueUSD: '$28,150', pct: '29.8%', deg: 75  },
  { label: 'ETFs',    color: '#3b82f6', valueUSD: '$39,800', pct: '28.0%', deg: 80  },
  { label: 'Stocks',  color: '#a855f7', valueUSD: '$34,500', pct: '24.2%', deg: 60  },
  { label: 'Others',  color: '#00d1c0', valueUSD: '$7,654',  pct: '5.4%',  deg: 100 },
];

const ALERTS = [
  {
    id: 'core-low', level: 'critical',
    title: 'Core insuficiente',
    description: 'Tu base de ETFs/Bluechips está por debajo del 40%. Riesgo de volatilidad extrema detectado.',
  },
  {
    id: 'speculative-high', level: 'warn',
    title: 'Sobre-especulativo',
    description: 'La exposición a Altcoins (Speculative) supera el límite del 15% definido en tu estrategia.',
  },
];

const ROLES = [
  { name: 'Core',        color: '#3b82f6', goal: '≥40%', goalPct: 40, goalDir: 'min', currentPct: 28.0, diff: '-12.0% vs objetivo', status: 'over' },
  { name: 'Growth',      color: '#10b981', goal: '≥30%', goalPct: 30, goalDir: 'min', currentPct: 32.4, diff: null,                  status: 'ok'   },
  { name: 'Speculative', color: '#f43f5e', goal: '≤10%', goalPct: 10, goalDir: 'max', currentPct: 18.2, diff: '+8.2% (Sobre-expuesto)', status: 'warn' },
];

const ACTIONS = [
  { action: 'BUY',  name: 'Vanguard S&P 500 (VOO)', reason: 'Incrementar Core / Equity',    amount: '+$2,450.00' },
  { action: 'SELL', name: 'Bitcoin (BTC)',            reason: 'Tomar ganancias Speculative', amount: '-$1,200.00' },
];

const ASSET_GROUPS = [
  {
    role: 'Core', color: '#3b82f6',
    assets: [{
      id: 'voo', name: 'Vanguard S&P 500', subtitle: '50.00 VOO • $472.15',
      icon: 'show_chart', iconColor: '#3b82f6',
      valueUSD: '$23,607.50', valueBOB: 'Bs. 162,891.67',
      pnl: 1840.50, pnlPct: 7.8, reduce: false, role: 'STOCKS',
    }],
  },
  {
    role: 'Speculative', color: '#f43f5e',
    assets: [{
      id: 'btc', name: 'Bitcoin', subtitle: '0.125 BTC • $64,210',
      icon: 'currency_bitcoin', iconColor: '#f97316',
      valueUSD: '$8,026.25', valueBOB: 'Bs. 55,381.13',
      pnl: 1840.50, pnlPct: 29.1, reduce: true, role: 'CRYPTO',
    }],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function QuantDashboard() {
  return (
    <>
      <QuantHeader
        investable="$94,280.14"
        metrics={HEADER_METRICS}
        onMore={() => {}}
      />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '7rem' }}>
        <DonutChart total="$142,504" ytd="+2.4% YTD" segments={SEGMENTS} />
        <AlertPanel alerts={ALERTS} />
        <RoleEngine roles={ROLES} />
        <RebalancePlan actions={ACTIONS} cash="$12,400.00" onExecute={() => {}} />
        <AssetList groups={ASSET_GROUPS} filters={['TODOS','CRYPTO','STOCKS']} />
      </main>

      {/* FAB */}
      <button style={{
        position: 'fixed', right: 24, bottom: 96,
        width: 56, height: 56,
        background: 'var(--color-primary)', color: 'var(--color-bg)',
        border: 'none', borderRadius: '1rem', cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 8px 32px rgba(0,209,192,.25)',
        transition: 'transform 120ms ease',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, fontWeight: 900 }}>add</span>
      </button>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        borderTop: '1px solid rgba(30,41,59,.50)',
        padding: '1rem 1.5rem 2.5rem',
      }} className="glass">
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[
            { icon: 'dashboard',              label: 'Inicio',   active: false },
            { icon: 'analytics',              label: 'Análisis', active: true  },
            { icon: 'account_balance_wallet', label: 'Cartera',  active: false },
            { icon: 'tune',                   label: 'Config',   active: false },
          ].map(n => (
            <a key={n.label} href="#" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: n.active ? 'var(--color-primary)' : '#64748b',
              textDecoration: 'none', position: 'relative',
            }}>
              {n.active && (
                <div style={{
                  position: 'absolute', top: -4,
                  width: 4, height: 4, borderRadius: 999,
                  background: 'var(--color-primary)',
                }} />
              )}
              <span className="material-symbols-outlined"
                style={{ fontVariationSettings: n.active ? "'FILL' 1" : "'FILL' 0" }}>
                {n.icon}
              </span>
              <span style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {n.label}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}