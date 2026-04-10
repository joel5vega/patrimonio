import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, Copy, Check,
  ChevronDown, ChevronUp, ArrowRight, BarChart2,
  AlertTriangle, CheckCircle2, XCircle, Home, TrendingUp,
  Lock, Zap, Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildPortfolioV3, PORTFOLIO_TARGETS, MANUAL_RULES } from '../utils/portfolioAnalysis';
import './Portfolio.css';
import MarketHeatmap from '../components/MarketHeatmap';
// ─── CONSTANTES ───────────────────────────────────────────────
const STABLES = ['USDT','USDC','BUSD','DAI','FDUSD'];

const CRYPTO_ICONS = {
  BTC:'currency_bitcoin', ETH:'token', SOL:'sunny', BNB:'toll',
  XRP:'water_drop', ADA:'hexagon', LINK:'link', DEFAULT:'generating_tokens',
};

const HIGH_CONTRAST_COLORS = [
  '#f97316','#10b981','#3b82f6','#a855f7',
  '#ec4899','#facc15','#06b6d4','#f43f5e',
  '#8b5cf6','#14b8a6','#84cc16','#eab308',
];

const ROLE_COLORS = {
  core:'#3b82f6', growth:'#10b981', defensive:'#facc15',
  liquidity:'#06b6d4', yield:'#14b8a6', speculative:'#f43f5e',
  trading:'#a855f7', patrimony:'#f97316', reserve:'#94a3b8',
};

const ROLE_COLORS_BG = {
  core:'rgba(96,165,250,0.12)', growth:'rgba(52,211,153,0.12)',
  defensive:'rgba(250,204,21,0.12)', liquidity:'rgba(34,211,238,0.12)',
  yield:'rgba(20,184,166,0.12)', speculative:'rgba(251,113,133,0.12)',
  trading:'rgba(167,139,250,0.12)', patrimony:'rgba(249,115,22,0.12)',
  reserve:'rgba(148,163,184,0.10)',
};

const TABS = ['Todos','Crypto','ETFs','Manual'];

// ─── UTILS ────────────────────────────────────────────────────
const fmt  = (v=0, d=0) => `$${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d})}`;
const fmtB = (v=0, rate=6.96) => `Bs ${((Number(v||0)*rate)|0).toLocaleString()}`;

const isQuantfury = a =>
  String(a?.note).toLowerCase().includes('quantfury') ||
  String(a?.type).toLowerCase() === 'stock';

// ─── TypeIcon ─────────────────────────────────────────────────
const TypeIcon = ({ type, symbol }) => {
  const icons = {
    crypto:'generating_tokens', etf:'show_chart', manual:'savings',
    stock:'monitoring', stable:'attach_money', patrimony:'home_work',
  };
  const icon = type === 'crypto'
    ? (CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT)
    : (icons[type] || 'account_balance');
  return (
    <span className="material-symbols-outlined" style={{fontSize:20,color:'#22d3ee'}}>
      {icon}
    </span>
  );
};

// ─── StatCard ─────────────────────────────────────────────────
const StatCard = ({ label, value, tone, sub }) => (
  <div className="portfolio-stat-card">
    <p className="portfolio-stat-label">{label}</p>
    <p className={`portfolio-stat-value ${tone||''}`}>{value}</p>
    {sub && <p className="portfolio-stat-sub">{sub}</p>}
  </div>
);

// ─── DonutChart ───────────────────────────────────────────────
const DonutChart = ({ data, totalUSD }) => {
  const safe = (data||[]).filter(d=>d.valueUSD>0);
  if (!safe.length) return null;
  const total = totalUSD>0 ? totalUSD : safe.reduce((s,d)=>s+d.valueUSD,0);
  if (!total) return null;
  const S=260,CX=130,CY=130,R=90,RI=58,LR=116,MIN=3;
  let cum=-Math.PI/2;
  const P=(r,t)=>[CX+r*Math.cos(t),CY+r*Math.sin(t)];
  const slices=safe.map(d=>{
    const a=(d.valueUSD/total)*2*Math.PI;
    const s=cum,mid=s+a/2; cum+=a;
    const large=a>Math.PI?1:0;
    const [x1,y1]=P(R,s),[x2,y2]=P(R,cum),[xi1,yi1]=P(RI,cum),[xi2,yi2]=P(RI,s);
    return {...d,pct:(d.valueUSD/total)*100,
      path:`M${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}L${xi1} ${yi1}A${RI} ${RI} 0 ${large} 0 ${xi2} ${yi2}Z`,
      lx:P(LR,mid)[0],ly:P(LR,mid)[1],
      lsx:P(R+3,mid)[0],lsy:P(R+3,mid)[1],
      lex:P(LR-9,mid)[0],ley:P(LR-9,mid)[1],mid};
  });
  return (
    <div className="portfolio-donut-wrap">
      <svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`} className="portfolio-donut-svg">
        {slices.map((s,i)=>(
          <path key={i} d={s.path} fill={s.color} stroke="rgba(2,6,23,0.95)" strokeWidth="2" opacity="0.95"/>
        ))}
        {slices.filter(s=>s.pct>=MIN).map((s,i)=>{
          const anchor=Math.cos(s.mid)>=0?'start':'end';
          return (
            <g key={`l${i}`}>
              <line x1={s.lsx} y1={s.lsy} x2={s.lex} y2={s.ley} stroke={s.color} strokeWidth="1.5" opacity="0.6"/>
              <text x={s.lx} y={s.ly-4} textAnchor={anchor} fill={s.color} fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">{s.label}</text>
              <text x={s.lx} y={s.ly+8} textAnchor={anchor} fill="rgba(148,163,184,.9)" fontSize="8" fontFamily="JetBrains Mono,monospace">{s.pct.toFixed(1)}%</text>
            </g>
          );
        })}
        <text x={CX} y={CY-12} textAnchor="middle" fill="rgba(148,163,184,.8)" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif" letterSpacing="1.5">INVERTIBLE</text>
        <text x={CX} y={CY+14} textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="JetBrains Mono,monospace">
          ${Number(total).toLocaleString(undefined,{maximumFractionDigits:0})}
        </text>
      </svg>
    </div>
  );
};

// ─── Section collapsible ──────────────────────────────────────
const Section = ({ title, eyebrow, children, defaultOpen=false, badge }) => {
  const [open,setOpen]=useState(defaultOpen);
  return (
    <div className="v3-section">
      <button type="button" onClick={()=>setOpen(v=>!v)} className="v3-section-trigger">
        <div>
          {eyebrow && <span className="portfolio-eyebrow">{eyebrow}</span>}
          <p className="v3-section-title">{title}</p>
        </div>
        <div className="v3-section-actions">
          {badge}
          {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </div>
      </button>
      {open && <div className="v3-section-content">{children}</div>}
    </div>
  );
};

// ─── RoleTreemap ──────────────────────────────────────────────
const RoleTreemap = ({ byRole, byRoleMap }) => {
  const roleOrder = ['core','growth','defensive','liquidity','yield','speculative','trading'];
  const total = Object.values(byRole||{}).reduce((s,v)=>s+v,0)||1;
  const sorted = roleOrder.filter(r=>(byRole||{})[r]>0).sort((a,b)=>(byRole[b]||0)-(byRole[a]||0));
  return (
    <div className="role-treemap">
      <div className="role-treemap__bar" style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
        <div style={{display:'flex',width:'100%'}}>
          {sorted.map(role=>{
            const pct=((byRole[role]||0)/total)*100;
            return (
              <div key={role} style={{width:`${pct}%`,display:'flex',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                {pct>7&&(
                  <span style={{fontSize:'0.6rem',fontWeight:800,color:ROLE_COLORS[role]||'#64748b',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',height:'5px',borderRadius:'999px',overflow:'hidden',gap:'2px'}}>
          {sorted.map(role=>(
            <div key={role} style={{
              width:`${((byRole[role]||0)/total)*100}%`,
              background:ROLE_COLORS[role]||'#64748b',
              borderRadius:'999px',flexShrink:0,
            }}/>
          ))}
        </div>
      </div>
      <div className="role-treemap__chips">
        {sorted.map(role=>{
          const pct=byRole[role]||0;
          const color=ROLE_COLORS[role]||'#64748b';
          const items=(byRoleMap[role]||[]).sort((a,b)=>b.valueUSD-a.valueUSD);
          const totalInv=items.reduce((s,a)=>s+a.valueUSD,0)||1;
          return (
            <div key={role} className="role-chip" style={{'--chip-color':color}}>
              <div className="role-chip__head">
                <span className="role-chip__dot" style={{background:color}}/>
                <span className="role-chip__name">{role}</span>
                <span className="role-chip__pct">{pct.toFixed(1)}%</span>
                {/* Target indicator */}
                {PORTFOLIO_TARGETS[role]!=null&&(
                  <span style={{fontSize:'0.6rem',color:'rgba(148,163,184,0.6)',marginLeft:'auto'}}>
                    meta {PORTFOLIO_TARGETS[role]}%
                  </span>
                )}
              </div>
              {items.length>0&&(
                <div className="role-chip__assets">
                  {items.map((a,i)=>{
                    const w=(a.valueUSD/totalInv)*100;
                    return (
                      <div key={i} className="role-chip__asset-row">
                        <span className="role-chip__asset-name">{a.symbol||a.name}</span>
                        {/* Mostrar APR si es DeFi */}
                        {a.classification?.isDeFi&&(
                          <span style={{fontSize:'0.6rem',color:'#14b8a6',marginRight:'0.25rem'}}>
                            {a.classification.aprPct}% APR
                          </span>
                        )}
                        <div className="role-chip__asset-bar-wrap">
                          <div className="role-chip__asset-bar" style={{width:`${w}%`,background:color,opacity:0.4+w/200}}/>
                        </div>
                        <span className="role-chip__asset-val">${Number(a.valueUSD).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── StatusBar ────────────────────────────────────────────────
const StatusBar = ({ totals, risk, alerts }) => {
  const fired = [
    {key:'underCore',label:'Core insuficiente',critical:true},
    {key:'lowCash',label:'Liquidez baja',critical:true},
    {key:'overCash',label:'Exceso de caja',critical:false},
    {key:'overSpeculative',label:'Sobre-especulativo',critical:true},
    {key:'excessTrading',label:'Trading excesivo',critical:false},
    {key:'highRisk',label:'Riesgo alto',critical:true},
    {key:'lowDiversification',label:'Baja diversificación',critical:false},
    {key:'noPrivateEquity',label:'Sin private equity',critical:false},
  ].filter(a=>alerts?.[a.key]);

  const critical = fired.filter(a=>a.critical).length;
  const warnings = fired.filter(a=>!a.critical).length;

  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginBottom:'1rem'}}>
      {[
        {label:'Invertible',  value:fmt(totals?.investableUSD)},
        {label:'Reservas',    value:fmt(totals?.reserveUSD),  muted:true},
        {label:'Patrimonio',  value:fmt(totals?.patrimonyUSD),muted:true},
        {label:'Riesgo',      value:(risk?.portfolioRisk??0).toFixed(2)},
        {label:'Retorno est.',value:`${(risk?.expectedReturn??0).toFixed(1)}%`,green:true},
      ].map(item=>(
        <div key={item.label} className="v3-metric-card" style={{flex:'1',minWidth:'90px'}}>
          <span className="v3-metric-label">{item.label}</span>
          <span className={`v3-metric-value ${item.green?'green':item.muted?'muted':''}`}>{item.value}</span>
        </div>
      ))}
      <div className="v3-metric-card" style={{flex:'1',minWidth:'90px'}}>
        <span className="v3-metric-label">Alertas</span>
        <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginTop:'0.15rem'}}>
          {critical>0&&<span className="v3-badge critical">{critical} crítica{critical>1?'s':''}</span>}
          {warnings>0&&<span className="v3-badge warn">{warnings} aviso{warnings>1?'s':''}</span>}
          {fired.length===0&&<span className="v3-badge ok">Todo OK</span>}
        </div>
      </div>
    </div>
  );
};

// ─── MonthlyPlanPanel ─────────────────────────────────────────
// Nuevo: muestra el plan mensual separado del lump-sum
const MonthlyPlanPanel = ({ rebalancePlan }) => {
  if (!rebalancePlan) return null;
  const { monthly=[], lumpSum=[], monthlyUSD=287, deployableCash=0 } = rebalancePlan;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

      {/* Plan mensual */}
      {monthly.length>0&&(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
            <Calendar size={12} style={{color:'#3b82f6'}}/>
            <span style={{fontSize:'0.7rem',fontWeight:700,color:'#3b82f6',letterSpacing:'0.08em'}}>
              ESTE MES · ${monthlyUSD.toLocaleString(undefined,{maximumFractionDigits:0})} disponibles
            </span>
          </div>
          <div className="v3-plan-stack">
            {monthly.map((a,i)=>(
              <div key={i} className="v3-plan-item">
                <span className="v3-plan-type buy">BUY</span>
                <div className="v3-plan-details">
                  <p className="v3-plan-asset">{a.asset}</p>
                  <p className="v3-plan-reason">{a.reason}</p>
                  {a.monthsToTarget&&(
                    <p className="v3-plan-reason" style={{color:'rgba(148,163,184,0.5)'}}>
                      ~{a.monthsToTarget} mes{a.monthsToTarget>1?'es':''} para alcanzar meta
                    </p>
                  )}
                </div>
                <span className="v3-plan-amount">{fmt(a.amountUSD,2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan lump-sum */}
      {lumpSum.length>0&&(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
            <Zap size={12} style={{color:'#10b981'}}/>
            <span style={{fontSize:'0.7rem',fontWeight:700,color:'#10b981',letterSpacing:'0.08em'}}>
              DEPLOY DISPONIBLE · {fmt(deployableCash)} deployable
            </span>
          </div>
          <div className="v3-plan-stack">
            {lumpSum.map((a,i)=>(
              <div key={i} className="v3-plan-item">
                <span className="v3-plan-type buy">BUY</span>
                <div className="v3-plan-details">
                  <p className="v3-plan-asset">{a.asset}</p>
                  <p className="v3-plan-reason">{a.reason}</p>
                </div>
                <span className="v3-plan-amount">{fmt(a.amountUSD,2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthly.length===0&&lumpSum.length===0&&(
        <p style={{fontSize:'0.75rem',color:'rgba(148,163,184,0.6)',textAlign:'center',padding:'0.75rem'}}>
          No hay acciones de rebalanceo necesarias
        </p>
      )}
    </div>
  );
};

// ─── ReservesPanel ────────────────────────────────────────────
// Nuevo: panel dedicado para activos no invertibles (SAFI, Ahorro $, Ahorro Bs)
const ReservesPanel = ({ reserves }) => {
  if (!reserves?.totalUSD) return null;
  const { totalUSD, assets=[], note } = reserves;
  return (
    <div className="patrimony-grid">
      <div className="patrimony-summary" style={{borderColor:'rgba(148,163,184,0.2)'}}>
        <Lock size={14} style={{color:'#94a3b8'}}/>
        <span className="patrimony-label">Total reservas bloqueadas</span>
        <span className="patrimony-value" style={{color:'#94a3b8'}}>{fmt(totalUSD)}</span>
      </div>
      {note&&(
        <p style={{fontSize:'0.7rem',color:'rgba(148,163,184,0.5)',padding:'0 1rem',marginBottom:'0.25rem'}}>
          {note}
        </p>
      )}
      <div className="patrimony-items">
        {assets.map((a,i)=>(
          <div key={i} className="patrimony-item">
            <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
              <Lock size={10} style={{color:'#64748b'}}/>
              <span className="patrimony-item-name">{a.name}</span>
            </div>
            <span className="patrimony-item-class" style={{color:'#64748b'}}>
              {a.classification?.subClass?.replace('_',' ')}
            </span>
            <span className="patrimony-item-value" style={{color:'#94a3b8'}}>{fmt(a.valueUSD)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────
const Dashboard = ({ v3 }) => {
  if (!v3) return null;
  const { portfolio, alerts, ruleEvaluation, rebalancePlan, assets, risk, totals } = v3;
  const byRole  = portfolio?.byRole  || {};
  const byClass = portfolio?.byAssetClass || {};

  const alertDefs = [
    {key:'underCore',       label:'Core insuficiente',     desc:'Priorizar VOO en el plan mensual',    critical:true},
    {key:'lowCash',         label:'Liquidez baja',          desc:'Mover parte a USDT',                  critical:true},
    {key:'overCash',        label:'Exceso de caja',         desc:'Desplegar en core/growth',            critical:false},
    {key:'overSpeculative', label:'Sobre-especulativo',     desc:'Reducir altcoins al 5%',              critical:true},
    {key:'excessTrading',   label:'Trading excesivo',       desc:'Concentrar Quantfury en 2–3 posiciones', critical:false},
    {key:'highRisk',        label:'Riesgo alto',            desc:'Rotar a core/defensive',              critical:true},
    {key:'lowDiversification',label:'Baja diversificación',desc:'Diversificar más',                    critical:false},
    {key:'noPrivateEquity', label:'Sin private equity',     desc:'Considerar más fondos SAFI',          critical:false},
  ];

  // byRoleMap excluye patrimony y reserve
  const byRoleMap = (assets||[])
    .filter(a => !['patrimony','reserve'].includes(a.classification?.role))
    .reduce((acc,a)=>{
      const r=a.classification?.role||'liquidity';
      (acc[r]=acc[r]||[]).push(a);
      return acc;
    },{});

  // Flujo de capital basado en alertas activas
  const flows=[];
  if (alerts?.underCore)       flows.push({from:'Ingreso mensual',to:'VOO / SPY',    color:'#60a5fa'});
  if (alerts?.lowCash)         flows.push({from:'Especulativo',   to:'USDT',         color:'#22d3ee'});
  if (alerts?.overCash)        flows.push({from:'Caja excedente', to:'Core / Growth',color:'#34d399'});
  if (alerts?.overSpeculative) flows.push({from:'Altcoins',       to:'Core',         color:'#60a5fa'});
  if (!flows.length)           flows.push({from:'Ingreso mensual','to':'Plan normal',color:'#34d399'});

  // Aviso de fragmentación Quantfury
  const tradingAssets = (assets||[]).filter(a=>a.classification?.role==='trading');
  const showTradingWarning = tradingAssets.length > 3;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
    
 {/* Objetivo vs actual */}
      <Section eyebrow="Rebalanceo" title="Objetivo vs actual">
        <div className="v3-target-list">
          {Object.entries(PORTFOLIO_TARGETS).map(([role,target])=>{
            const current=byRole[role]||0;
            const ok=role==='speculative'||role==='trading'?current<=target:current>=target;
            const dir=role==='speculative'||role==='trading'?'≤':'≥';
            const color=ROLE_COLORS[role]||'#fff';
            return (
              <div key={role} className="v3-target-row">
                <div className="v3-target-head">
                  <div className="v3-role-info">
                    <span className="v3-role-dot" style={{background:color}}/>
                    <span className="v3-role-name" style={{color}}>{role}</span>
                  </div>
                  <div className="v3-target-meta">
                    <span className="v3-target-goal">{dir}{target}%</span>
                    <span className="v3-target-current">{current.toFixed(1)}%</span>
                    {ok
                      ?<CheckCircle2 size={11} style={{color:'#10b981'}}/>
                      :<XCircle size={11} style={{color:'#f43f5e'}}/>}
                  </div>
                </div>
                <div className="v3-target-track">
                  <div className="v3-target-fill" style={{width:`${Math.min(current,100)}%`,background:ok?color:'#f43f5e',opacity:0.75}}/>
                  <div className="v3-target-marker" style={{left:`${Math.min(target,100)}%`}}/>
                </div>
                {!ok&&(
                  <span className="v3-target-diff">
                    {(current-target)>0?'+':''}{(current-target).toFixed(1)}% vs objetivo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>
  <StatusBar totals={totals} risk={risk} alerts={alerts}/>
      {/* Distribución por rol */}
      <Section eyebrow="Motor de reglas" title="Distribución por rol" defaultOpen={true}>
        <RoleTreemap byRole={byRole} byRoleMap={byRoleMap}/>
      </Section>

     

      {/* Plan de rebalanceo — mensual + lump-sum */}
      <Section
        eyebrow="Acciones sugeridas"
        title="Plan de inversión"
        defaultOpen={true}
        badge={
          rebalancePlan?.monthly?.length>0&&(
            <span className="v3-badge ok" style={{background:'rgba(59,130,246,0.15)',color:'#60a5fa',borderColor:'rgba(59,130,246,0.3)'}}>
              ${rebalancePlan.monthlyUSD}/mes
            </span>
          )
        }
      >
        <MonthlyPlanPanel rebalancePlan={rebalancePlan}/>
      </Section>

      {/* Alertas */}
      <Section
        eyebrow="Sistema de alertas"
        title="Panel de alertas"
        defaultOpen={alertDefs.some(a=>alerts?.[a.key]&&a.critical)}
        badge={alertDefs.some(a=>alerts?.[a.key]&&a.critical)&&<span className="v3-badge critical">!</span>}
      >
        <div className="v3-alert-stack">
          {alertDefs.map(({key,label,desc,critical})=>{
            const active=alerts?.[key];
            const cls=active?(critical?'critical':'warning'):'ok';
            return (
              <div key={key} className={`v3-alert ${cls}`}>
                <div className="v3-alert-icon">
                  {active?(critical?<XCircle size={16}/>:<AlertTriangle size={16}/>):<CheckCircle2 size={16}/>}
                </div>
                <div>
                  <div className="v3-alert-title">
                    {label}
                    {active&&<span className="v3-mini-badge">{critical?'CRÍTICO':'AVISO'}</span>}
                  </div>
                  {active&&<p className="v3-alert-desc">{desc}</p>}
                </div>
              </div>
            );
          })}

          {/* Aviso de fragmentación Quantfury */}
          {showTradingWarning&&(
            <div className="v3-alert warning">
              <div className="v3-alert-icon"><AlertTriangle size={16}/></div>
              <div>
                <div className="v3-alert-title">
                  Quantfury fragmentado
                  <span className="v3-mini-badge">AVISO</span>
                </div>
                <p className="v3-alert-desc">
                  {tradingAssets.length} posiciones pequeñas — concentrar en 2–3 con mayor convicción
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Flujo de capital */}
      <div className="v3-flow-card">
        <span className="portfolio-eyebrow" style={{display:'block',marginBottom:'0.75rem'}}>Flujo de capital</span>
        <div className="v3-flow-stack">
          {flows.map((f,i)=>(
            <div key={i} className="v3-flow-path">
              <span className="v3-flow-from">{f.from}</span>
              <div className="v3-flow-arrow"><ArrowRight size={12}/></div>
              <span className="v3-flow-to" style={{color:f.color}}>{f.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reglas disparadas */}
      {ruleEvaluation?.length>0&&(
        <Section eyebrow="Decisiones" title="Reglas disparadas">
          <ol className="v3-rules-list">
            {ruleEvaluation.map((r,i)=>(
              <li key={i} className="v3-rule-row">
                <span className="v3-rule-num">{i+1}</span>
                <span className={`v3-rule-text ${r.includes('✓')?'ok':''}`}>{r}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
};

// ─── PatrimonyPanel ───────────────────────────────────────────
const PatrimonyPanel = ({ patrimony }) => {
  if (!patrimony?.totalUSD) return null;
  const { totalUSD, byClass, assets } = patrimony;
  return (
    <div className="patrimony-grid">
      <div className="patrimony-summary">
        <Home size={14} style={{color:'#fb923c'}}/>
        <span className="patrimony-label">Total patrimonio</span>
        <span className="patrimony-value">{fmt(totalUSD)}</span>
      </div>
      <div className="patrimony-items">
        {(assets||[]).map((a,i)=>(
          <div key={i} className="patrimony-item">
            <span className="patrimony-item-name">{a.name}</span>
            <span className="patrimony-item-class">{a.classification?.assetClass}</span>
            <span className="patrimony-item-value">{fmt(a.valueUSD)}</span>
          </div>
        ))}
      </div>
      {Object.keys(byClass||{}).length>0&&(
        <div className="patrimony-classes">
          {Object.entries(byClass).map(([cls,val])=>(
            <div key={cls} className="patrimony-class-row">
              <span className="patrimony-class-name">{cls}</span>
              <span className="patrimony-class-pct">{totalUSD>0?((val/totalUSD)*100).toFixed(1):0}%</span>
              <span className="patrimony-class-val">{fmt(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
const Portfolio = () => {
  const {
    cryptoAssets=[],inversionPositions=[],manualAssets=[],
    totalCryptoUSD=0,binanceSnap,loading=false,bobRate=6.96,
  } = useApp();

  const [activeTab,     setActiveTab]     = useState('Todos');
  const [visibleGroups, setVisibleGroups] = useState({});
  const [copied,        setCopied]        = useState(false);
  const [legendOpen,    setLegendOpen]    = useState(false);

  const bs            = binanceSnap?.snapshot;
  const reservedBUY   = bs?.reservedCapitalUSD  ?? 0;
  const pendingSELL   = bs?.pendingSellUSD       ?? 0;
  const grossExposure = bs?.grossExposureUSD     ?? 0;
  const riskScore     = bs?.riskMetrics?.riskScore ?? 0;
  const riskTone      = riskScore>70?'text-rose-400':riskScore>40?'text-yellow-400':'text-emerald-400';

  // Ingreso mensual en USD (2000 Bs / tasa actual)
  const monthlyUSD = useMemo(()=>
    bobRate > 0 ? Math.round(2000 / bobRate) : 287
  ,[bobRate]);

  const stableAssets   = useMemo(()=>cryptoAssets.filter(a=>STABLES.includes(a.symbol)&&a.netExposureUSD>0),[cryptoAssets]);
  const volatileAssets = useMemo(()=>cryptoAssets.filter(a=>!STABLES.includes(a.symbol)&&(a.netExposureUSD>0||a.pendingBuyUSD>0)),[cryptoAssets]);

  const groupDefinitions = useMemo(()=>{
    const qAssets = (manualAssets??[]).filter(isQuantfury);
   const mAssets = manualAssets?.filter(a => {
  if (isQuantfury(a)) return false;
  const rule = MANUAL_RULES[(a.name || '').toLowerCase().trim()];
  const role = rule?.role;
  return role !== 'reserve' && role !== 'patrimony';
});
    return [
      {groupKey:'crypto',    label:'Crypto',    color:HIGH_CONTRAST_COLORS[0], type:'crypto'},
      {groupKey:'stable',    label:'Cash',      color:HIGH_CONTRAST_COLORS[1], type:'stable'},
      {groupKey:'etf',       label:'ETFs',      color:HIGH_CONTRAST_COLORS[2], type:'etf'},
      ...(qAssets.length>0?[{groupKey:'quantfury',label:'Quantfury',color:HIGH_CONTRAST_COLORS[3],type:'stock'}]:[]),
      ...mAssets.map((a,idx)=>({
        groupKey:`manual-${a.id}`, label:a.name,
        color:HIGH_CONTRAST_COLORS[(idx+4)%HIGH_CONTRAST_COLORS.length],
        type:'manual', rawId:a.id,
      })),
    ];
  },[manualAssets]);

  const allAssets = useMemo(()=>[
    ...volatileAssets.map(a=>({
      id:`crypto-${a.symbol}`,groupKey:'crypto',type:'crypto',
      symbol:a.symbol,name:a.symbol,
      subtitle:`${a.quantity?.toFixed(4)??0} ${a.symbol}`,
      price:a.currentPrice,
      valueUSD:a.netExposureUSD+(a.pendingBuyUSD??0),
      pnl:null,pnlPct:null,
      extra:a.pendingBuyUSD>0?`${Number(a.pendingBuyUSD).toLocaleString(undefined,{maximumFractionDigits:2})} orden`:null,
    })),
    ...stableAssets.map(a=>({
      id:`stable-${a.symbol}`,groupKey:'stable',type:'stable',
      symbol:a.symbol,name:`${a.symbol} Cash`,
      subtitle:`${a.quantity?.toFixed(2)??0} ${a.symbol}`,
      price:1,valueUSD:a.netExposureUSD,pnl:null,pnlPct:null,extra:null,
    })),
    ...inversionPositions.map(p=>({
      id:`etf-${p.id}`,groupKey:'etf',type:'etf',
      symbol:p.symbol,name:p.symbol,
      subtitle:`${p.quantity} u · $${p.currentPrice?.toFixed(2)}`,
      price:p.currentPrice,valueUSD:p.valueUSD,
      pnl:p.unrealizedPL,
      pnlPct:p.avgBuyPrice>0?(p.currentPrice-p.avgBuyPrice)/p.avgBuyPrice*100:null,
      extra:p.tp>0?`TP $${p.tp?.toFixed(2)}`:null,
    })),
   ...manualAssets?.map((a, id) => {
  const rule = MANUAL_RULES[(a.name || '').toLowerCase().trim()];
  const role = rule?.role;
  const isNonInvestable = role === 'reserve' || role === 'patrimony';

  return {
    id: `manual-${a.id}`, rawId: a.id,
    groupKey: isQuantfury(a) ? 'quantfury' : `manual-${a.id}`,
    type: isQuantfury(a) ? 'stock' : (a.type || 'manual'),
    // ← no mostrar símbolo inventado para no invertibles
    symbol: isNonInvestable ? null : a.name?.slice(0, 4).toUpperCase() || 'MAN',
    name: a.name,
    subtitle: a.note || (a.currency === 'BOB'
      ? `Bs ${a.amount?.toFixed(2)}`
      : a.amount?.toFixed(2)),
    price: null,
    valueUSD: a.valueUSD,
    pnl: null, pnlPct: null,
    extra: a.since ? `Desde ${a.since}` : null,
  };
}),
  ],[volatileAssets,stableAssets,inversionPositions,manualAssets]);

  useEffect(()=>{
    setVisibleGroups(prev=>{
      const next={};
      groupDefinitions.forEach(g=>{next[g.groupKey]=prev[g.groupKey]??true;});
      allAssets.forEach(a=>{if(!(a.groupKey in next))next[a.groupKey]=prev[a.groupKey]??true;});
      return next;
    });
  },[groupDefinitions,allAssets]);

  const totalBrutoUSD = useMemo(()=>allAssets.reduce((s,a)=>s+(a.valueUSD||0),0),[allAssets]);

  // v3 ahora recibe monthlyUSD
  const v3 = useMemo(()=>buildPortfolioV3({
    allAssets, totalUSD:totalBrutoUSD, reservedBUY, pendingSELL, grossExposure, monthlyUSD,
  }),[allAssets,totalBrutoUSD,reservedBUY,pendingSELL,grossExposure,monthlyUSD]);

  // pieData: solo activos investables (excluye reserve y patrimony)
  const pieData = useMemo(()=>{
    const cryptoVal = volatileAssets.reduce((s,a)=>s+a.netExposureUSD+(a.pendingBuyUSD??0),0);
    const stableVal = stableAssets.reduce((s,a)=>s+a.netExposureUSD,0);
    const etfVal    = inversionPositions.reduce((s,p)=>s+(p.valueUSD??0),0);
    const qAssets   = (manualAssets??[]).filter(isQuantfury);
    const qVal      = qAssets.reduce((s,a)=>s+(a.valueUSD??0),0);
    // Solo manuales que no sean reserve ni patrimony
    const mAssets   = (manualAssets??[]).filter(a=>{
      if (isQuantfury(a)) return false;
      const rule = MANUAL_RULES[(a.name||'').toLowerCase().trim()];
      return rule?.role !== 'reserve' && rule?.role !== 'patrimony';
    });
    return [
      {groupKey:'crypto',    label:'Crypto',      valueUSD:cryptoVal, color:HIGH_CONTRAST_COLORS[0]},
      {groupKey:'stable',    label:'USDT / Cash', valueUSD:stableVal, color:HIGH_CONTRAST_COLORS[1]},
      {groupKey:'etf',       label:'ETFs',        valueUSD:etfVal,    color:HIGH_CONTRAST_COLORS[2]},
      ...(qVal>0?[{groupKey:'quantfury',label:'Quantfury',valueUSD:qVal,color:HIGH_CONTRAST_COLORS[3]}]:[]),
      ...mAssets.map((a,idx)=>({
        groupKey:`manual-${a.id}`,label:a.name,
        valueUSD:a.valueUSD??0,
        color:HIGH_CONTRAST_COLORS[(idx+4)%HIGH_CONTRAST_COLORS.length],
      })).filter(i=>i.valueUSD>0),
    ].filter(i=>i.valueUSD>0);
  },[volatileAssets,stableAssets,inversionPositions,manualAssets]);

  const visiblePieData  = useMemo(()=>pieData.filter(i=>visibleGroups[i.groupKey]??true),[pieData,visibleGroups]);
  // totalUSD del donut = investableUSD real de v3 (excluye reserve + patrimony)
  const donutTotalUSD   = v3?.totals?.investableUSD ?? visiblePieData.reduce((s,i)=>s+i.valueUSD,0);
  const visibleGroupSet = useMemo(()=>new Set(visiblePieData.map(i=>i.groupKey)),[visiblePieData]);

  // Lista de activos para las tabs: excluye patrimony, incluye reserve siempre visible
  const portfolioListAssets = useMemo(()=>
    allAssets.filter(a=>{
      const v3a  = v3?.assets?.find(x=>x.id===a.id);
      const role = v3a?.classification?.role;
      return role !== 'patrimony';
    })
  ,[allAssets,v3]);

  const tabFilter = {
    Todos:  ()=>true,
    Crypto: a=>a.type==='crypto'||a.type==='stable',
    ETFs:   a=>a.type==='etf',
    Manual: a=>a.type==='manual'||a.type==='stock',
  };

  const filtered = portfolioListAssets
    .filter(tabFilter[activeTab])
    .filter(a=>{
      const v3a  = v3?.assets?.find(x=>x.id===a.id);
      const role = v3a?.classification?.role;
      if (role==='reserve') return true; // reservas siempre visibles
      return visibleGroupSet.has(a.groupKey);
    })
    .sort((a,b)=>(b.valueUSD??0)-(a.valueUSD??0));

  const toggleGroup = key => setVisibleGroups(prev=>({...prev,[key]:!(prev[key]??true)}));

  const handleCopy = async()=>{
    try{await navigator.clipboard.writeText(JSON.stringify(v3,null,2));}catch{}
    setCopied(true); setTimeout(()=>setCopied(false),1800);
  };

  const visibleManualUSD = visiblePieData
    .filter(i=>i.type==='manual'||i.type==='stock')
    .reduce((s,i)=>s+i.valueUSD,0);

  if (loading) return (
    <div className="portfolio-loading"><div className="portfolio-spinner"/></div>
  );

  return (
    <div className="portfolio-page">

      {/* ── Hero ── */}
      <section className="portfolio-card">
        <div className="portfolio-section-head">
          <div>
            <h1 className="portfolio-title">Portfolio</h1>
          </div>
          <div className="portfolio-header-pills">
            <div className="portfolio-rate-pill">
              <span className="portfolio-rate-dot"/>
              Bs {bobRate.toFixed(2)} · ~${monthlyUSD}/mes
            </div>
            <button type="button" onClick={handleCopy} className="portfolio-copy-btn">
              {copied?<Check size={13}/>:<Copy size={13}/>}
              <span>{copied?'Copiado':'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Toggles de grupos */}
        <div className="portfolio-group-toggles">
          {groupDefinitions.map(group=>{
            const active=visibleGroups[group.groupKey]??true;
            return (
              <button key={group.groupKey} type="button"
                onClick={()=>toggleGroup(group.groupKey)}
                className={`portfolio-toggle-chip ${active?'active':''}`}>
                <span className="portfolio-toggle-chip__dot" style={{backgroundColor:group.color}}/>
                <span>{group.label}</span>
                {active?<Eye size={13}/>:<EyeOff size={13}/>}
              </button>
            );
          })}
        </div>

        <div className="portfolio-hero-grid">
          {/* Donut sobre portafolio INVERTIBLE */}
          <DonutChart data={visiblePieData} totalUSD={donutTotalUSD}/>

          <div>
            <div className="portfolio-metrics-row">
              <StatCard label="Invertible" value={fmt(v3?.totals?.investableUSD)} tone="text-emerald-400"
                sub={`${fmt(v3?.totals?.reserveUSD)} reservas`}/>
              <StatCard label="Crypto"  value={fmt(visiblePieData.filter(i=>i.groupKey==='crypto'||i.groupKey==='stable').reduce((s,i)=>s+i.valueUSD,0))} tone="text-orange-400"/>
              <StatCard label="ETFs"    value={fmt(visiblePieData.filter(i=>i.groupKey==='etf').reduce((s,i)=>s+i.valueUSD,0))} tone="text-blue-400"/>
            </div>
            <div className="portfolio-metrics-row">
              <StatCard label="Manual"     value={fmt(visibleManualUSD)} tone="text-violet-400"/>
              <StatCard label="Retorno est." value={`${v3?.risk?.expectedReturn?.toFixed(1)}%`} tone="text-teal-400"
                sub="AirTM DeFi 8% incluido"/>
              <StatCard label="Patrimonio" value={fmt(v3?.totals?.patrimonyUSD)} tone="muted"/>
            </div>

            <button type="button" onClick={()=>setLegendOpen(p=>!p)}
              className="portfolio-legend-toggle" aria-expanded={legendOpen}>
              <span>Desglose invertible</span>
              <span className="portfolio-legend-toggle__count">{visiblePieData.length}</span>
              <ChevronDown size={13} className={`portfolio-legend-toggle__chevron ${legendOpen?'open':''}`}/>
            </button>

            <div className={`portfolio-legend-collapsible ${legendOpen?'open':''}`}>
              <div className="portfolio-legend-grid">
                {visiblePieData.map((d,i)=>(
                  <div key={i} className="portfolio-legend-card">
                    <div className="portfolio-legend-top">
                      <span className="portfolio-legend-dot" style={{backgroundColor:d.color}}/>
                      <span className="portfolio-legend-label">{d.label}</span>
                    </div>
                    <div className="portfolio-legend-bottom">
                      <span className="portfolio-legend-value">{fmt(d.valueUSD)}</span>
                      <span className="portfolio-legend-pct">
                        {donutTotalUSD>0?((d.valueUSD/donutTotalUSD)*100).toFixed(1):0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
<MarketHeatmap assets={v3.assets} />
      {/* ── Dashboard ── */}
      <section className="portfolio-card">
        <div className="portfolio-section-head">
          <div>
            <span className="portfolio-eyebrow">Análisis automático</span>
            <h2 className="portfolio-subtitle">Dashboard · Portafolio invertible</h2>
          </div>
          <BarChart2 size={16} style={{color:'rgba(255,255,255,0.2)'}}/>
        </div>
        <div style={{padding:'0 1.5rem 1.5rem'}}>
          <Dashboard v3={v3}/>
        </div>
      </section>

      {/* ── Reservas (SAFI, Ahorro $, Ahorro Bs) ── */}
      {v3?.reserves?.totalUSD>0&&(
        <section className="portfolio-card">
          <div className="portfolio-section-head">
            <div>
              <span className="portfolio-eyebrow" style={{color:'#64748b'}}>Bloqueado · no invertible</span>
              <h2 className="portfolio-subtitle">Reservas estructurales</h2>
            </div>
            <Lock size={16} style={{color:'#64748b',opacity:0.5}}/>
          </div>
          <ReservesPanel reserves={v3.reserves}/>
        </section>
      )}

      {/* ── Patrimonio ── */}
      {v3?.patrimony?.totalUSD>0&&(
        <section className="portfolio-card">
          <div className="portfolio-section-head">
            <div>
              <span className="portfolio-eyebrow patrimony-eyebrow">Bienes no líquidos</span>
              <h2 className="portfolio-subtitle">Patrimonio · terrenos</h2>
            </div>
            <Home size={16} style={{color:'#fb923c',opacity:0.5}}/>
          </div>
          <PatrimonyPanel patrimony={v3.patrimony}/>
        </section>
      )}

      {/* ── Riesgo Binance ── */}
      {visibleGroups['crypto']!==false&&totalCryptoUSD>0&&(
        <section className="portfolio-card">
          <div className="portfolio-section-head">
            <div>
              <span className="portfolio-eyebrow warn">Binance · Exposición</span>
              <h2 className="portfolio-subtitle">Riesgo y concentración</h2>
            </div>
            <span className={`portfolio-risk-badge ${riskTone}`}>Riesgo {riskScore}/100</span>
          </div>
          {grossExposure>0&&(
            <div style={{padding:'0 1.5rem 0.5rem'}}>
              <div className="portfolio-riskbar">
                <div className="portfolio-riskbar-segment spot" style={{width:`${(totalCryptoUSD/grossExposure)*100}%`}}/>
                <div className="portfolio-riskbar-segment buy"  style={{width:`${(reservedBUY/grossExposure)*100}%`}}/>
                <div className="portfolio-riskbar-segment sell" style={{width:`${(pendingSELL/grossExposure)*100}%`}}/>
              </div>
              <div className="portfolio-risk-legend">
                <span><i className="spot"/>Spot</span>
                <span><i className="buy"/>Ord. BUY</span>
                <span><i className="sell"/>Ord. SELL</span>
              </div>
            </div>
          )}
          <div className="portfolio-binance-stats">
            <div className="portfolio-stats-grid four">
              <StatCard label="Spot"       value={fmt(totalCryptoUSD)}/>
              <StatCard label="Ord. BUY"   value={fmt(reservedBUY)}   tone="text-yellow-400"/>
              <StatCard label="Ord. SELL"  value={fmt(pendingSELL)}   tone="text-blue-400"/>
              <StatCard label="Exposición" value={fmt(grossExposure)} tone="text-emerald-400"/>
            </div>
            <div className="portfolio-stats-grid">
              <StatCard label="HHI"         value={(bs?.riskMetrics?.herfindahlIndex??0).toFixed(4)}/>
              <StatCard label="Top 3 conc." value={`${(bs?.riskMetrics?.top3ConcentrationPct??0).toFixed(1)}%`}
                tone={(bs?.riskMetrics?.top3ConcentrationPct??0)>80?'text-rose-400':''}/>
            </div>
          </div>
        </section>
      )}

      {/* ── Tabs ── */}
      <div className="portfolio-tabs-wrap">
        <div className="portfolio-tabs-scroll">
          {TABS.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`portfolio-tab ${activeTab===tab?'active':''}`}>{tab}</button>
          ))}
        </div>
      </div>

      {/* ── Lista de activos ── */}
      <div className="portfolio-assets">
        {filtered.length===0
          ?<p className="portfolio-empty">Sin activos visibles</p>
          :filtered.map(a=>{
            const v3Asset = v3?.assets?.find(x=>x.id===a.id);
            const cls     = v3Asset?.classification;
            const role    = cls?.role;
            const reduce  = v3Asset?.strategy?.reduce;
            const isReserve    = role==='reserve';
            const isLocked     = cls?.isLocked;
            const isDeFi       = cls?.isDeFi;
            const aprPct       = cls?.aprPct;
            // Aviso de fragmentación en activos trading
            const tradingCount = v3?.assets?.filter(x=>x.classification?.role==='trading').length??0;
            const showConsolidate = role==='trading' && tradingCount>3;

            return (
              <article key={a.id} className="portfolio-asset-card">
                <div className="portfolio-asset-icon">
                  <TypeIcon type={a.type} symbol={a.symbol}/>
                </div>
                <div className="portfolio-asset-copy">
                  <div className="portfolio-asset-title-row">
                    <p className="portfolio-asset-title">{a.name}</p>
                    {role&&(
                      <span className="portfolio-chip" style={{
                        color:ROLE_COLORS[role],
                        borderColor:`${ROLE_COLORS[role]}33`,
                        backgroundColor:`${ROLE_COLORS[role]}11`,
                      }}>
                        {isLocked&&'🔒 '}{role}
                      </span>
                    )}
                  </div>
                  <p className="portfolio-asset-subtitle">{a.subtitle}</p>
                  {a.extra&&<p className="portfolio-asset-extra">{a.extra}</p>}

                  {/* Badge DeFi APR */}
                  {isDeFi&&aprPct&&(
                    <p className="portfolio-asset-extra" style={{color:'#14b8a6',fontWeight:600}}>
                      ⚡ DeFi · {aprPct}% APR
                    </p>
                  )}

                  {/* Nota reserva */}
                  {isReserve&&(
                    <p className="portfolio-asset-extra" style={{color:'#64748b'}}>
                      🔒 Reserva estructural · no invertible en bolsa
                    </p>
                  )}

                  {/* Aviso reducción */}
                  {reduce&&!isReserve&&(
                    <p className="portfolio-asset-extra danger">↓ Reducir posición</p>
                  )}

                  {/* Aviso consolidación trading */}
                  {showConsolidate&&(
                    <p className="portfolio-asset-extra" style={{color:'#a855f7',opacity:0.8}}>
                      Consolidar con 2–3 posiciones de mayor convicción
                    </p>
                  )}
                </div>
                <div className="portfolio-asset-metrics">
                  <p className="portfolio-metric-label">Valor</p>
                  <p className="portfolio-metric-value">{fmt(a.valueUSD,0)}</p>
                  <p className="portfolio-metric-subvalue">{fmtB(a.valueUSD,bobRate)}</p>
                  {a.pnl!=null&&(
                    <>
                      <div className={`portfolio-pnl ${a.pnl>=0?'up':'down'}`}>
                        {a.pnl>=0?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>}
                        <span>{fmt(Math.abs(a.pnl),2)}</span>
                      </div>
                      {a.pnlPct!=null&&(
                        <p className={`portfolio-pnl-pct ${a.pnl>=0?'up':'down'}`}>{a.pnlPct.toFixed(1)}%</p>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })
        }
      </div>
    </div>
  );
};

export default Portfolio;
