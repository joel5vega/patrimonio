import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Bell,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ─── Fechas (ISO + serial Excel) ──────────────────────────
const excelSerialToDate = (value) => {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isNaN(num)) {
    const base = new Date(1899, 11, 30); // 1899-12-30
    const ms = num * 24 * 60 * 60 * 1000;
    return new Date(base.getTime() + ms);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseDateMs = (d) => {
  const dt = excelSerialToDate(d);
  return dt ? dt.getTime() : 0;
};

// ─── Versículos (los que ya tienes) ───────────────────────
const VERSICULOS = [
  { text: 'La riqueza lograda de la noche a la mañana pronto desaparece; pero la que es fruto del arduo trabajo aumenta con el tiempo.', ref: 'Proverbios 13:11 NTV' },
  { text: 'La bendición del Señor trae riquezas que no vienen acompañadas de tristezas.', ref: 'Proverbios 10:22 NTV' },
  { text: 'La riqueza del rico es su fortaleza; la pobreza del pobre es su ruina.', ref: 'Proverbios 10:15 NTV' },
  { text: 'Las ganancias de los justos realzan sus vidas, pero la gente malvada derrocha su dinero en el pecado.', ref: 'Proverbios 10:16 NTV' },
  { text: 'Los sabios tienen riquezas y lujos, pero los necios gastan todo lo que consiguen.', ref: 'Proverbios 21:20 NTV' },
  { text: 'Honra al Señor con tus riquezas y con los primeros frutos de tus cosechas.', ref: 'Proverbios 3:9 NTV' },
  { text: 'Más vale tener poco, con temor del Señor, que muchas riquezas con grandes angustias.', ref: 'Proverbios 15:16 NTV' },
  { text: 'Vale más la buena fama que las muchas riquezas, y la buena reputación más que la plata y el oro.', ref: 'Proverbios 22:1 NTV' },
  { text: 'El dinero mal habido pronto se acaba; quien ahorra, poco a poco se enriquece.', ref: 'Proverbios 13:11 NTV' },
  { text: 'Manténganse libres del amor al dinero y conténtense con lo que tienen, porque Dios ha dicho: «Nunca los dejaré; jamás los abandonaré».', ref: 'Hebreos 13:5 NTV' },
  { text: 'Los que quieren enriquecerse caen en la tentación y se vuelven esclavos de sus muchos deseos. Estos afanes insensatos y dañinos hunden a la gente en la ruina y en la destrucción.', ref: '1 Timoteo 6:9 NTV' },
  { text: '»Así es, el que almacena riquezas terrenales pero no es rico en su relación con Dios es un necio«.', ref: 'Lucas 12:21 NTV' },
  { text: '»Vendan sus posesiones y den a los que pasan necesidad. ¡Eso almacenará tesoros para ustedes en el cielo! Y las bolsas celestiales nunca se ponen viejas ni se agujerean.«', ref: 'Lucas 12:33 NTV' },
  { text: 'Donde esté su tesoro, allí estarán también los deseos de su corazón.', ref: 'Lucas 12:34 NTV' },
  { text: '¿Por qué gastan dinero en lo que no es pan, y su salario en lo que no sacia? Escúchenme atentamente, y coman lo que es bueno.', ref: 'Isaías 55:2 NTV' },
  { text: 'El que ama el dinero no se saciará de dinero, y el que ama la abundancia no se saciará de ganancias. También esto es vanidad.', ref: 'Eclesiastés 5:10 NTV' },
  { text: 'Hablar demasiado conduce al pecado. Sé prudente y mantén la boca cerrada.', ref: 'Proverbios 10:19 NTV' },
  { text: 'Las palabras del justo son como la plata refinada; el corazón del necio no vale nada.', ref: 'Proverbios 10:20 NTV' },
  { text: 'Las esperanzas del justo traen felicidad, pero las expectativas de los perversos no resultan en nada.', ref: 'Proverbios 10:28 NTV' },
  { text: 'El temor del Señor prolonga la vida, pero los años de los perversos serán truncados.', ref: 'Proverbios 10:27 NTV' },
];

const BibleVerse = () => {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * VERSICULOS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * VERSICULOS.length);
          } while (next === prev);
          return next;
        });
        setVisible(true);
      }, 400);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const v = VERSICULOS[idx];

  return (
    <section className="px-4 pt-6 mb-4">
      <div
        className="bg-slate-900/60 p-5 rounded-[1.75rem] border border-dashed border-slate-800 text-center italic transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-slate-300 text-sm leading-relaxed mb-3">"{v.text}"</p>
        <p className="text-teal-500 text-[10px] font-black uppercase tracking-widest">
          — {v.ref}
        </p>
      </div>
    </section>
  );
};

// ─── Reutilizables ────────────────────────────────────────
const SummaryCard = ({ label, value, color }) => (
  <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center active:scale-95 transition-transform">
    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</p>
    <p className={`text-sm font-black ${color}`}>{value}</p>
  </div>
);

const TransactionItem = ({ type, concept, title, dateLabel, amount, currency }) => {
  const isIncome = type === 'income';
  return (
    <div className="bg-slate-900 p-4 rounded-[2rem] border border-slate-800 flex items-center justify-between active:scale-95 transition-transform">
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-2xl ${
            isIncome
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          {isIncome ? (
            <ArrowUpRight size={18} strokeWidth={3} />
          ) : (
            <ArrowDownRight size={18} strokeWidth={3} />
          )}
        </div>
        <div>
          <p className="font-bold text-sm">{concept || title || 'Transacción'}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase">
            {dateLabel || '—'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-black text-sm ${
            isIncome ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isIncome ? '+' : '-'}
          {currency === 'USD' ? '$' : 'Bs'}{' '}
          {Number(Math.abs(amount || 0)).toLocaleString('es-BO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const {
    totalValue = 0,
    totalPnl = 0,
    transactions = [],
    totalCryptoUSD = 0,
    totalInversionUSD = 0,
    totalManualUSD = 0,
    bobRate = 6.96,
    loading = false,
    monthlyReturn = 0,
  } = useApp();

  const navigate = useNavigate();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const isPositive = totalPnl >= 0;
  const usdValue = bobRate > 0 ? totalValue / bobRate : 0;

  // ordenar transacciones por fecha (no invento montos: uso amount y currency tal cual)
  const sortedTx = [...(transactions || [])].sort(
    (a, b) => parseDateMs(b.date) - parseDateMs(a.date)
  );
  const recent = sortedTx
  .filter((tx) => typeof tx.amount === 'number')
  .slice(0, 3)
  .map((tx) => {
    const d = excelSerialToDate(tx.date);
    const dateLabel = d
      ? d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    return { ...tx, dateLabel };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 font-sans antialiased">
      

      {/* Header */}
      <header className="px-6 pb-4 flex justify-between items-center">
        <div>
       
          {/* <h1 className="text-2xl font-black">MiPatrimonio</h1> */}
        </div>
        {/* <div className="flex gap-3">
          <button
            onClick={() => navigate('/bank-import')}
            className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 active:scale-95 transition-transform"
          >
            <Mail size={18} />
          </button>
          <div className="relative active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Bell size={18} />
            </div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-slate-950" />
          </div>
        </div> */}
      </header>
{/* Versículo primero */}
      <h1><BibleVerse /></h1>
      {/* Main Portfolio Card */}
      <section className="px-4 mb-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity size={120} />
          </div>

          <p className="text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            Patrimonio Total
          </p>
          <div className="space-y-1 relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              Bs {totalValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-lg font-bold">
                ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
              </p>
              <span className="text-slate-700 font-bold font-mono text-xs">
                | Bs {bobRate.toFixed(2)}/USD
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 relative z-10">
            <div
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl backdrop-blur-md border ${
                isPositive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-xs font-black">
                {isPositive ? '+' : '-'}$
                {Math.abs(totalPnl).toFixed(2)} P&L
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 backdrop-blur-md">
              <span className="text-xs font-black">
                +{monthlyReturn}% este mes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-6 mb-8 grid grid-cols-3 gap-3">
        <SummaryCard
          label="Crypto"
          value={`$${totalCryptoUSD.toFixed(0)}`}
          color="text-orange-400"
        />
        <SummaryCard
          label="ETFs"
          value={`$${totalInversionUSD.toFixed(0)}`}
          color="text-blue-400"
        />
        <SummaryCard
          label="Manual"
          value={`$${(totalManualUSD ?? 0).toFixed(0)}`}
          color="text-emerald-400"
        />
      </section>

      {/* Actividad reciente */}
      <section className="px-6 mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-black text-lg">Actividad Reciente</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-teal-500 text-[10px] font-black uppercase tracking-wider"
          >
            Ver todo
          </button>
        </div>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <div className="bg-slate-900/30 p-8 rounded-[2rem] border border-dashed border-slate-800 text-center">
              <p className="text-slate-500 text-sm font-medium">
                Sin actividad reciente
              </p>
            </div>
          ) : (
            recent.map((tx) => (
              <TransactionItem
                key={tx.id}
                type={tx.type}
                concept={tx.concept}
                title={tx.title}
                dateLabel={tx.dateLabel}
                amount={tx.amount}
                currency={tx.currency}
              />
            ))
          )}
        </div>
      </section>

      {/* FAB */}
      <button
        onClick={() => navigate('/new-transaction')}
        className="fixed bottom-28 right-6 w-14 h-14 bg-teal-500 text-slate-950 rounded-2xl shadow-2xl shadow-teal-500/20 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

    </div>
  );
};

export default Dashboard;