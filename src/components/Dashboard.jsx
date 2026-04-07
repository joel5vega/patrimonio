// src/components/Dashboard.jsx
import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { PORTFOLIO_TARGETS } from '../utils/portfolioAnalysis';

const ROLE_COLORS = {
  core:'#3b82f6', growth:'#10b981', defensive:'#facc15', liquidity:'#06b6d4',
  yield:'#14b8a6', speculative:'#f43f5e', trading:'#a855f7', patrimony:'#f97316',
};
const ROLE_COLORS_BG = {
  core:'rgba(96,165,250,0.12)',    growth:'rgba(52,211,153,0.12)',
  defensive:'rgba(250,204,21,0.12)', liquidity:'rgba(34,211,238,0.12)',
  yield:'rgba(20,184,166,0.12)',   speculative:'rgba(251,113,133,0.12)',
  trading:'rgba(167,139,250,0.12)', patrimony:'rgba(249,115,22,0.12)',
};
const fmt = (v=0,d=0) => '$'+Number(v??0).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g,',');

const Section = ({ title, eyebrow, children, defaultOpen=false, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="portfolio-dash-section">
      <button type="button" onClick={()=>setOpen(v=>!v)} className="portfolio-dash-header">
        <div>
          {eyebrow && <p className="portfolio-eyebrow">{eyebrow}</p>}
          <p className="portfolio-subtitle">{title}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          {badge}
          {open
            ? <ChevronUp  size={14} style={{color:'rgba(255,255,255,.25)'}}/>
            : <ChevronDown size={14} style={{color:'rgba(255,255,255,.25)'}}/>
          }
        </div>
      </button>
      {open && <div className="portfolio-dash-body">{children}</div>}
    </div>
  );
};

const Dashboard = ({ v3 }) => {
  if (!v3) return null;
  const { portfolio, alerts, ruleEvaluation, rebalancePlan, assets, risk, totals } = v3;

  const byRole  = portfolio?.byRole  || {};
  const byClass = portfolio?.byAssetClass || {};

  const ALERT_LIST = [
    { key:'underCore',        label:'Core insuficiente',    critical:true  },
    { key:'lowCash',          label:'Liquidez baja',        critical:true  },
    { key:'overCash',         label:'Exceso de caja',       critical:false },
    { key:'overSpeculative',  label:'Sobre-especulativo',   critical:true  },
    { key:'excessTrading',    label:'Trading excesivo',     critical:false },
    { key:'highRisk',         label:'Riesgo alto',          critical:true  },
    { key:'lowDiversification',label:'Baja diversificación',critical:false },
  ];

  const fired    = ALERT_LIST.filter(a => alerts?.[a.key]);
  const critical = fired.filter(a =>  a.critical).length;
  const warnings = fired.filter(a => !a.critical).length;

  const roleRows  = Object.entries(byRole).filter(([,p])=>p>0).sort((a,b)=>b[1]-a[1]);
  const classRows = Object.entries(byClass).filter(([,p])=>p>0).sort((a,b)=>b[1]-a[1]);

  // Targets sincronizados con portfolioAnalysis.js vía export
  const targetChecks = Object.entries(PORTFOLIO_TARGETS).map(([role,target]) => ({
    role, target,
    current: byRole[role]||0,
    ok: role==='speculative' ? (byRole[role]||0)<=target : (byRole[role]||0)>=target,
    dir: role==='speculative' ? '≤' : '≥',
  }));

  const byRoleMap = (assets||[])
    .filter(a => a.classification?.role !== 'patrimony')
    .reduce((acc,a) => {
      const r = a.classification?.role||'liquidity';
      if (!acc[r]) acc[r] = [];
      acc[r].push(a);
      return acc;
    }, {});

  const flows = [];
  if (alerts?.underCore)     flows.push({ from:'Nuevo efectivo',  to:'SPY / QQQM',      color:'#60a5fa' });
  if (alerts?.lowCash)       flows.push({ from:'Especulativo',    to:'USDT / Cash',      color:'#22d3ee' });
  if (alerts?.overCash)      flows.push({ from:'Caja excedente',  to:'Core / Growth',    color:'#34d399' });
  if (alerts?.overSpeculative) flows.push({ from:'Altcoins',      to:'Core',             color:'#60a5fa' });
  if (alerts?.excessTrading) flows.push({ from:'Trading exceso',  to:'Core',             color:'#60a5fa' });
  if (!flows.length)         flows.push({ from:'Nuevo efectivo',  to:'Plan normal',      color:'#34d399' });

  const ROLE_ORDER = ['core','growth','defensive','liquidity','yield','speculative','trading'];

  return (
    <div className="dash-grid">

      {/* Status bar */}
      <div className="dash-status-bar">
        {[
          { label:'Invertible',   value:fmt(totals?.investableUSD),            tone:''       },
          { label:'Patrimonio',   value:fmt(totals?.patrimonyUSD),             tone:'muted'  },
          { label:'Riesgo medio', value:(risk?.portfolioRisk??0).toFixed(2),   tone:''       },
          { label:'Retorno est.', value:`${(risk?.expectedReturn??0).toFixed(1)}%`, tone:'green' },
        ].map((item,i,arr) => (
          <div key={item.label} style={{display:'flex',alignItems:'center'}}>
            <div className="dash-status-item">
              <span className="dash-status-label">{item.label}</span>
              <span className={`dash-status-value ${item.tone}`}>{item.value}</span>
            </div>
            {i<arr.length-1 && <div className="dash-status-divider"/>}
          </div>
        ))}
        <div className="dash-status-divider"/>
        <div className="dash-status-item">
          <span className="dash-status-label">Alertas</span>
          <div className="dash-alert-pills">
            {critical>0 && <span className="dash-alert-pill critical">{critical} cr&iacute;tica{critical>1?'s':''}</span>}
            {warnings>0 && <span className="dash-alert-pill warn">{warnings} aviso{warnings>1?'s':''}</span>}
            {fired.length===0 && <span className="dash-alert-pill ok">Todo OK</span>}
          </div>
        </div>
      </div>

      {/* Distribución + Targets */}
      <div className="dash-two-col">
       <Section
  eyebrow="Motor de reglas"
  title="Distribución por rol"
  defaultOpen={false}
  badge={
  <div style={{ display:'flex', flexDirection:'column', gap:'4px', width:'160px', alignSelf:'center' }}>
    {/* Labels */}
    <div style={{ display:'flex', width:'100%' }}>
      {roleRows.map(([role, pct]) => (
        <div
          key={role}
          style={{
            width: `${Math.min(pct, 100)}%`,
            display: 'flex',
            justifyContent: 'center',
            flexShrink: 0,
            minWidth: pct > 8 ? undefined : 0,
            overflow: 'hidden',
          }}
        >
          {pct > 8 && (
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 800,
              color: ROLE_COLORS[role] || '#fff',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      ))}
    </div>
    {/* Barra */}
    <div style={{ display:'flex', height:'5px', borderRadius:'999px', overflow:'hidden', width:'100%', gap:'1px' }}>
      {roleRows.map(([role, pct]) => (
        <div
          key={role}
          style={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            background: ROLE_COLORS[role] || '#fff',
            borderRadius: '999px',
            flexShrink: 0,
          }}
          title={`${role}: ${pct.toFixed(1)}%`}
        />
      ))}
    </div>
  </div>
}
>
  <div className="dash-role-list">
    {roleRows.map(([role, pct]) => {
      const color = ROLE_COLORS[role] || '#fff';
      return (
        <div key={role} className="dash-role-row">
          <div className="dash-role-left">
            <span className="dash-role-dot" style={{ background: color }} />
            <span className="dash-role-name" style={{ color }}>{role}</span>
          </div>
          <div className="dash-role-bar-wrap">
            <div className="dash-role-bar-track">
              <div
                className="dash-role-bar-fill"
                style={{ width: `${Math.min(pct, 100)}%`, background: color, opacity: 0.7 }}
              />
            </div>
          </div>
          <span className="dash-role-pct">{pct.toFixed(1)}%</span>
        </div>
      );
    })}
  </div>
</Section>

        <Section eyebrow="Rebalanceo" title="Objetivo vs actual">
          <div className="dash-target-list">
            {targetChecks.map(({role,target,current,ok,dir}) => {
              const diff  = current-target;
              const color = ROLE_COLORS[role]||'#fff';
              return (
                <div key={role} className="dash-target-row">
                  <div className="dash-target-head">
                    <div className="dash-role-left">
                      <span className="dash-role-dot" style={{background:color}}/>
                      <span className="dash-role-name" style={{color}}>{role}</span>
                    </div>
                    <div className="dash-target-meta">
                      <span className="dash-target-goal">{dir}{target}%</span>
                      <span className="dash-target-current">{current.toFixed(1)}%</span>
                      {ok
                        ? <CheckCircle2 size={11} style={{color:'#34d399'}}/>
                        : <XCircle      size={11} style={{color:'#fb7185'}}/>
                      }
                    </div>
                  </div>
                  <div className="dash-target-track">
                    <div className="dash-target-fill"
                      style={{width:`${Math.min(current,100)}%`, background:ok?color:'#f43f5e', opacity:0.75}}/>
                    <div className="dash-target-marker" style={{left:`${Math.min(target,100)}%`}}/>
                  </div>
                  {!ok && <span className="dash-target-diff">{diff>0?'+':''}{diff.toFixed(1)}% vs objetivo</span>}
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Alertas + Métricas */}
      <div className="dash-two-col">
        <Section eyebrow="Sistema de alertas" title="Panel de alertas" defaultOpen={critical>0}>
          <div className="dash-alert-list">
            {ALERT_LIST.map(({key,label,critical:isCrit}) => {
              const active = !!alerts?.[key];
              return (
                <div key={key}
                  className={`dash-alert-row${active?(isCrit?' dash-alert-row--critical':' dash-alert-row--warn'):''}`}>
                  <div className={`dash-alert-icon ${active?(isCrit?'critical':'warn'):'ok'}`}>
                    {active?(isCrit?<XCircle size={12}/>:<AlertTriangle size={12}/>):<CheckCircle2 size={12}/>}
                  </div>
                  <span className="dash-alert-label">{label}</span>
                  {active && (
                    <span className={`dash-alert-badge ${isCrit?'critical':'warn'}`}>
                      {isCrit?'CRÍTICO':'AVISO'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section eyebrow="Métricas cuantitativas" title="Riesgo y retorno">
          <div className="dash-metrics-grid">
            <div className="dash-metric-card">
              <span className="dash-metric-label">Riesgo medio</span>
              <span className="dash-metric-value">{(risk?.portfolioRisk??0).toFixed(2)}</span>
            </div>
            <div className="dash-metric-card">
              <span className="dash-metric-label">Retorno est.</span>
              <span className="dash-metric-value green">{(risk?.expectedReturn??0).toFixed(1)}%</span>
            </div>
            <div className="dash-metric-card">
              <span className="dash-metric-label">HHI</span>
              <span className={`dash-metric-value ${(risk?.hhi??0)>0.25?'red':''}`}>
                {(risk?.hhi??0).toFixed(4)}
              </span>
            </div>
            <div className="dash-metric-card">
              <span className="dash-metric-label">Cash drag</span>
              <span className="dash-metric-value muted">{(risk?.cashDrag??0).toFixed(4)}</span>
            </div>
          </div>
          <div className="dash-class-list">
            {classRows.map(([cls,pct]) => (
              <div key={cls} className="dash-class-row">
                <span className="dash-class-name">{cls}</span>
                <div className="dash-class-track">
                  <div className="dash-class-fill" style={{width:`${Math.min(pct,100)}%`}}/>
                </div>
                <span className="dash-class-pct">{pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Rebalanceo + Flujos */}
      {(rebalancePlan?.actions?.length>0 || flows.length>0) && (
        <div className="dash-two-col">
          {rebalancePlan?.actions?.length>0 && (
            <Section eyebrow="Acciones sugeridas" title="Plan de rebalanceo">
              <div className="dash-plan-list">
                {rebalancePlan.actions.map((a,i) => (
                  <div key={i} className="dash-plan-row">
                    <span className="dash-plan-action">BUY</span>
                    <div className="dash-plan-body">
                      <span className="dash-plan-asset">{a.asset}</span>
                      <span className="dash-plan-reason">{a.reason}</span>
                    </div>
                    <span className="dash-plan-amount">{fmt(a.amountUSD,2)}</span>
                  </div>
                ))}
              </div>
              <div className="dash-plan-footer">
                <span>Cash restante</span>
                <span>{fmt(rebalancePlan.remainingCash,2)}</span>
              </div>
            </Section>
          )}
          {flows.length>0 && (
            <Section eyebrow="Flujo de capital" title="¿Dónde mover el dinero?">
              <div className="dash-flow-list">
                {flows.map((f,i) => (
                  <div key={i} className="dash-flow-row">
                    <span className="dash-flow-from">{f.from}</span>
                    <div className="dash-flow-arrow"><ArrowRight size={12}/></div>
                    <span className="dash-flow-to" style={{color:f.color}}>{f.to}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Activos por rol */}
      {/* <div className="dash-two-col">
        <Section eyebrow="Clasificación" title="Activos por rol">
          <div className="dash-assets-list">
            {Object.entries(byRoleMap)
              .sort((a,b) => ROLE_ORDER.indexOf(a[0]) - ROLE_ORDER.indexOf(b[0]))
              .map(([role,list]) => {
                const color = ROLE_COLORS[role]||'#fff';
                const bg    = ROLE_COLORS_BG[role]||'rgba(255,255,255,0.04)';
                return (
                  <div key={role} className="dash-role-group">
                    <div className="dash-role-group-head" style={{background:bg}}>
                      <span className="dash-role-dot" style={{background:color}}/>
                      <span className="dash-role-group-label" style={{color}}>{role}</span>
                      <span className="dash-role-group-count">{list.length}</span>
                    </div>
                    <div className="dash-role-group-items">
                      {list.sort((a,b)=>b.valueUSD-a.valueUSD).map((a,i) => (
                        <div key={i} className="dash-asset-row">
                          <span className="dash-asset-name">{a.name||a.symbol}</span>
                          <div className="dash-asset-right">
                            {a.strategy?.reduce && <span className="dash-asset-reduce">↙ reducir</span>}
                            <span className="dash-asset-value">{fmt(a.valueUSD,0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </Section>

        <Section eyebrow="Decisiones" title="Reglas disparadas">
          <ol className="dash-rules-list">
            {(ruleEvaluation||[]).map((r,i) => (
              <li key={i} className="dash-rule-row">
                <span className="dash-rule-num">{i+1}</span>
                <span className={`dash-rule-text${r.includes('✓')?' ok':''}`}>{r}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div> */}
    </div>
  );
};

export default Dashboard;
