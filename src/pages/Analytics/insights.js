// src/pages/Analytics/insights.js
import { TX_GROUPS } from '../../hooks/useTransactions';

export function getInsights(savingsRate, byGroup, totalExp, monthlyTrend, expenses) {
  const tips = [];

  if (savingsRate < 0) {
    tips.push({
      icon: '⚠️',
      color: 'text-rose-400',
      msg: 'Tus gastos superan tus ingresos en este período. Revisa tus compras discrecionales.',
    });
  } else if (savingsRate < 15) {
    tips.push({
      icon: '💡',
      color: 'text-yellow-400',
      msg: `Tu tasa de ahorro está en ${savingsRate.toFixed(0)}%. Intenta acercarte a la meta del 20%.`,
    });
  } else if (savingsRate >= 20) {
    tips.push({
      icon: '🎯',
      color: 'text-emerald-400',
      msg: `¡Excelente disciplina! Estás ahorrando e invirtiendo el ${savingsRate.toFixed(0)}% de tus ingresos.`,
    });
  }

  const topGroup = byGroup[0];
  if (topGroup && totalExp > 0) {
    const pct = (topGroup.total / totalExp) * 100;
    const groupLabel = TX_GROUPS?.find((g) => g.value === topGroup.key)?.label || topGroup.key;
    if (pct > 35) {
      tips.push({
        icon: '🔴',
        color: 'text-orange-400',
        msg: `${groupLabel} absorbe el ${pct.toFixed(0)}% de tus egresos. Revisa ese grupo de gastos.`,
      });
    }
  }

  const salidasYOcio = expenses
    .filter((e) => e.category === 'citassalidas' || e.category === 'comidafuera')
    .reduce((s, e) => s + e.amount, 0);
  if (totalExp > 0 && salidasYOcio / totalExp > 0.25) {
    tips.push({
      icon: '🍽️',
      color: 'text-pink-400',
      msg: 'Las salidas y restaurantes representan más del 25% de tus gastos actuales.',
    });
  }

  if (monthlyTrend.length >= 2) {
    const last = monthlyTrend[monthlyTrend.length - 1].exp;
    const prev = monthlyTrend[monthlyTrend.length - 2].exp;
    const change = ((last - prev) / prev) * 100;
    if (change > 15) {
      tips.push({
        icon: '📈',
        color: 'text-rose-300',
        msg: `Tus gastos aumentaron un ${change.toFixed(0)}% con respecto al mes anterior.`,
      });
    } else if (change < -10) {
      tips.push({
        icon: '📉',
        color: 'text-teal-400',
        msg: `¡Buen trabajo! Redujiste tus gastos un ${Math.abs(change).toFixed(0)}% respecto al mes pasado.`,
      });
    }
  }

  if (tips.length === 0) {
    tips.push({
      icon: '📝',
      color: 'text-[#eeeeee]/50',
      msg: 'Registra tus movimientos diariamente para obtener mejores proyecciones.',
    });
  }

  return tips;
}
