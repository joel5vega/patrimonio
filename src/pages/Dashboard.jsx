import { TrendingUp, TrendingDown, Bell, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TransactionItem from '../components/TransactionItem';
import SummaryCard from '../components/SummaryCard';
import { useState, useEffect } from 'react';

// ─── Versículos bíblicos sobre el dinero ─────────────────
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

const INTERVAL_MS = 30_000; // cambia cada 30 segundos

const BibleVerse = () => {
  const [idx, setIdx]       = useState(() => Math.floor(Math.random() * VERSICULOS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // fade out → cambia → fade in
      setVisible(false);
      setTimeout(() => {
        setIdx((prev) => {
          let next;
          do { next = Math.floor(Math.random() * VERSICULOS.length); } while (next === prev);
          return next;
        });
        setVisible(true);
      }, 400);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const v = VERSICULOS[idx];

  return (
    <div
      className="bg-card-dark border border-border-dark rounded-2xl p-4 transition-opacity duration-400"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-primary text-2xl leading-none mt-0.5 select-none">"</span>
        <div>
          <p className="text-sm text-slate-300 leading-relaxed italic">{v.text}</p>
          <p className="text-[11px] font-bold text-primary mt-2">{v.ref}</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const {
    totalValue, totalPnl, transactions,
    totalCryptoUSD, totalInversionUSD, totalManualUSD,
    bobRate,
  } = useApp();

  const navigate   = useNavigate();
  const isPositive = totalPnl >= 0;
  const usdValue   = bobRate > 0 ? totalValue / bobRate : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pt-2">
        <div>
          <p className="text-white/40 text-sm">Bienvenido</p>
          <h1 className="text-xl font-bold">MiPatrimonio</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/bank-import')}
            className="bg-brand-card p-2 rounded-xl border border-white/10 text-brand-teal">
            <Mail size={20} />
          </button>
          <button className="bg-brand-card p-2 rounded-xl border border-white/10 text-white/60">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 rounded-3xl shadow-xl shadow-teal-900/40">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Patrimonio Total</p>
        <h2 className="text-4xl font-black mb-1">
          Bs {totalValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-white/60 text-sm">
            ≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
          </p>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/50 text-xs font-mono">Bs {bobRate.toFixed(2)}/USD</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold w-fit px-3 py-1 rounded-full bg-black/20">
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>
            {isPositive ? '+' : ''}${totalPnl.toFixed(2)} P&L
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Crypto"  value={`$${totalCryptoUSD.toFixed(0)}`}       color="text-orange-400" />
        <SummaryCard label="ETFs"    value={`$${totalInversionUSD.toFixed(0)}`}     color="text-blue-400" />
        <SummaryCard label="Manual"  value={`$${(totalManualUSD ?? 0).toFixed(0)}`} color="text-emerald-400" />
      </div>

      {/* Versículo bíblico */}
      <BibleVerse />

      {/* Recent */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-base">Actividad Reciente</h3>
          <button onClick={() => navigate('/transactions')}
            className="text-brand-teal text-sm font-semibold">Ver todas</button>
        </div>
        <div className="space-y-2">
          {transactions.length === 0 && (
            <p className="text-white/30 text-sm text-center py-6">Sin actividad reciente</p>
          )}
          {transactions.slice(0, 3).map((tx) => (
            <TransactionItem key={tx.id} {...tx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
