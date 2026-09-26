// src/pages/Dashboard/components/BibleVerse.jsx
import { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { animate } from 'animejs';

const VERSICULOS = [
  { text: 'La riqueza lograda de la noche a la mañana pronto desaparece; pero la que es fruto del arduo trabajo aumenta con el tiempo.', ref: 'Proverbios 13:11 NTV' },
  { text: 'La bendición del Señor trae riquezas que no vienen acompañadas de tristezas.', ref: 'Proverbios 10:22 NTV' },
  { text: 'Las ganancias de los justos realzan sus vidas, pero la gente malvada derrocha su dinero en el pecado.', ref: 'Proverbios 10:16 NTV' },
  { text: 'Los sabios tienen riquezas y lujos, pero los necios gastan todo lo que consiguen.', ref: 'Proverbios 21:20 NTV' },
  { text: 'Honra al Señor con tus riquezas y con los primeros frutos de tus cosechas.', ref: 'Proverbios 3:9 NTV' },
  { text: 'Más vale tener poco, con temor del Señor, que muchas riquezas con grandes angustias.', ref: 'Proverbios 15:16 NTV' },
  { text: 'Vale más la buena fama que las muchas riquezas.', ref: 'Proverbios 22:1 NTV' },
  { text: 'Manténganse libres del amor al dinero y conténtense con lo que tienen.', ref: 'Hebreos 13:5 NTV' },
  { text: '«Así es, el que almacena riquezas terrenales pero no es rico en su relación con Dios es un necio».', ref: 'Lucas 12:21 NTV' },
  { text: 'Donde esté su tesoro, allí estarán también los deseos de su corazón.', ref: 'Lucas 12:34 NTV' },
  { text: 'El que ama el dinero no se saciará de dinero. También esto es vanidad.', ref: 'Eclesiastés 5:10 NTV' },
  { text: '¿Por qué gastan dinero en lo que no es pan, y su salario en lo que no sacia?', ref: 'Isaías 55:2 NTV' },
];

export default function BibleVerse() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * VERSICULOS.length));
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    animate(cardRef.current, {
      opacity: [0, 1], translateY: [-16, 0], scale: [0.97, 1],
      duration: 700, ease: 'outExpo',
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (cardRef.current) {
        animate(cardRef.current, { opacity: [1, 0], translateY: [0, -10], scale: [1, 0.97], duration: 350, ease: 'inExpo' });
      }
      setTimeout(() => {
        setIdx((prev) => {
          let next;
          do { next = Math.floor(Math.random() * VERSICULOS.length); } while (next === prev);
          return next;
        });
        setTimeout(() => {
          if (cardRef.current) {
            animate(cardRef.current, { opacity: [0, 1], translateY: [10, 0], scale: [0.97, 1], duration: 500, ease: 'outExpo' });
          }
        }, 50);
      }, 380);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const v = VERSICULOS[idx];
  return (
    <div ref={cardRef} className="db-verse-card" style={{ opacity: 0 }}>
      <div className="db-verse-icon-wrap"><BookOpen size={16} /></div>
      <blockquote className="db-verse-text">"{v.text}"</blockquote>
      <cite className="db-verse-ref">— {v.ref}</cite>
    </div>
  );
}
