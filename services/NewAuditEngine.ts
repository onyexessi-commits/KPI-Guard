
import { KpiInputs, KpiMetrics, AuditResult, CurrencyCode, Scenario } from "../types";

const clampRoi = (roi: number): number => Math.min(1000, Math.max(-100, roi));

export function calculateMetrics(inputs: KpiInputs): KpiMetrics {
  const { budget, leads, sales, avgCheck } = inputs;
  
  const cpl = leads > 0 ? budget / leads : 0;
  const cpa = sales > 0 ? budget / sales : 0;
  const revenue = sales * avgCheck;
  const profit = revenue - budget;
  const roi = budget > 0 ? (profit / budget) * 100 : 0;
  const cr = leads > 0 ? (sales / leads) * 100 : 0;
  
  // Simplified Break-even: Revenue per sale must cover cost per sale
  const beCpa = avgCheck;
  const beCpl = avgCheck * (leads > 0 ? (sales / leads) : 0);

  return { cpl, cpa, revenue, profit, roi, cr, beCpa, beCpl };
}

export function generateAuditReport(
  inputs: KpiInputs,
  metrics: KpiMetrics,
  currency: CurrencyCode
): AuditResult {
  const currencySymbol = currency === 'KZT' ? '₸' : '$';
  const { budget, leads, sales, avgCheck } = inputs;
  const { roi, cr, cpl, beCpl, cpa, beCpa, profit } = metrics;

  // 1. Scores (0-10)
  const economyScore = Math.min(10, Math.max(0, Math.round(roi / 25) + 5));
  const funnelScore = Math.min(10, Math.max(0, Math.round(cr / 2) + 2));
  const scaleScore = cpl < beCpl ? Math.min(10, Math.max(1, Math.round((beCpl / (cpl || 1)) * 3))) : 2;
  const totalScore = Math.round((economyScore + funnelScore + scaleScore) / 3);

  // 2. Interpretation
  let interpretation = "Требуется радикальная перестройка воронки и оффера.";
  if (totalScore >= 8) interpretation = "Модель высокоэффективна. Рекомендуется агрессивное масштабирование.";
  else if (totalScore >= 5) interpretation = "Устойчивая модель с потенциалом роста через оптимизацию конверсии.";
  else if (totalScore >= 3) interpretation = "Кампания работает на грани окупаемости. Необходим аудит этапов продаж.";

  // 3. Loss Points
  const lossPoints = [];
  if (cpl > beCpl) {
    lossPoints.push({
      label: 'Превышение BE CPL',
      diff: `+${(((cpl / (beCpl || 1)) - 1) * 100).toFixed(1)}%`,
      lossValue: Math.round((cpl - beCpl) * leads),
      isCritical: cpl > beCpl * 1.3
    });
  }
  if (cr < 2) {
    lossPoints.push({
      label: 'Критический CR воронки',
      diff: `${cr.toFixed(1)}%`,
      lossValue: Math.round(budget * 0.5),
      isCritical: true
    });
  }
  if (cpa > beCpa) {
    lossPoints.push({
      label: 'Отрицательная Unit-экономика',
      diff: `-${Math.round(cpa - beCpa)}${currencySymbol}`,
      lossValue: Math.round(Math.abs(profit)),
      isCritical: true
    });
  }

  // 4. Scenarios (WHAT-IF)
  const scenarios: Scenario[] = [];

  const getBadge = (roiVal: number, crPrime: number, crBase: number, budgetFactor: number, cplFactor: number): { type: 'good' | 'neutral' | 'bad', label: string } => {
    const isExtreme = crPrime > 0.3 || (crPrime - crBase) > 0.1 || cplFactor < 0.8 || budgetFactor > 1.5;
    if (isExtreme) return { type: 'bad', label: 'ЭКСТРЕМАЛЬНО' };
    return roiVal >= 0 ? { type: 'good', label: 'РЕАЛИСТИЧНО' } : { type: 'neutral', label: 'РИСК' };
  };

  // a) +20% Budget
  const budgetA = budget * 1.2;
  const salesA = cpa > 0 ? (budgetA / cpa) : 0;
  const profitA = (salesA * avgCheck) - budgetA;
  const roiA = budgetA > 0 ? (profitA / budgetA) * 100 : 0;
  const badgeA = getBadge(roiA, cr / 100, cr / 100, 1.2, 1);
  scenarios.push({
    title: '+20% Бюджет',
    profit: Math.round(profitA),
    roi: Number(clampRoi(roiA).toFixed(1)),
    comment: 'Масштабирование текущей модели без потери качества трафика.',
    badgeType: badgeA.type,
    badgeLabel: badgeA.label
  });

  // b) +5 p.p. Conversion
  const crBase = leads > 0 ? (sales / leads) : 0;
  const crB = Math.min(1, crBase + 0.05);
  const salesB = leads * crB;
  const profitB = (salesB * avgCheck) - budget;
  const roiB = budget > 0 ? (profitB / budget) * 100 : 0;
  const badgeB = getBadge(roiB, crB, crBase, 1, 1);
  scenarios.push({
    title: '+5% к Конверсии',
    profit: Math.round(profitB),
    roi: Number(clampRoi(roiB).toFixed(1)),
    comment: 'Результат улучшения посадочной страницы или скриптов.',
    badgeType: badgeB.type,
    badgeLabel: badgeB.label
  });

  // c) -10% CPL
  const cplC = cpl * 0.9;
  const leadsC = cplC > 0 ? budget / cplC : 0;
  const salesC = leadsC * (leads > 0 ? (sales / leads) : 0);
  const profitC = (salesC * avgCheck) - budget;
  const roiC = budget > 0 ? (profitC / budget) * 100 : 0;
  const badgeC = getBadge(roiC, cr / 100, cr / 100, 1, 0.9);
  scenarios.push({
    title: '-10% Стоимость лида',
    profit: Math.round(profitC),
    roi: Number(clampRoi(roiC).toFixed(1)),
    comment: 'Оптимизация рекламы и CTR объявлений.',
    badgeType: badgeC.type,
    badgeLabel: badgeC.label
  });

  // 5. Insights
  const insights = [
    `Доходность: Текущая выручка с каждой продажи — ${Math.round(avgCheck)}${currencySymbol}.`,
    `Эффективность: Каждый вложенный ${currencySymbol} приносит ${(metrics.revenue / (budget || 1)).toFixed(2)}${currencySymbol} выручки.`,
    `Конверсия: Текущий показатель ${cr.toFixed(1)}% ${cr < 3 ? 'ниже рыночного минимума' : 'в пределах нормы'}.`,
    `Безубыточность: Чтобы не работать в минус, цена лида не должна превышать ${Math.round(beCpl)}${currencySymbol}.`,
    `Запас прочности: Маржа позволяет увеличить CPA на ${Math.max(0, Math.round(beCpa - cpa))}${currencySymbol} до выхода в ноль.`,
    `Диагноз: Основная потеря денег происходит на этапе ${cr < 4 ? 'конвертации трафика в лиды' : 'закрытия сделок'}.`
  ];

  // 6. Actions
  const priorityActions = [
    {
      title: profit < 0 ? "КРИЗИС-МЕНЕДЖМЕНТ" : "МАСШТАБИРОВАНИЕ",
      action: profit < 0 ? "Отключить кампании с ROI < 0 и CPA > Чека" : "Увеличить суточный лимит на 20% в прибыльных связках",
      whyNow: "Текущая Unit-экономика не позволяет продолжать работу в прежнем режиме.",
      ifNotDone: "Дальнейший слив бюджета приведет к кассовому разрыву.",
      controlKpi: "ROI / CPA"
    },
    {
      title: "ОПТИМИЗАЦИЯ КОНВЕРСИИ",
      action: "Внедрить A/B тест первого экрана лендинга",
      whyNow: "Рост CR на 1% даст больший эффект, чем удвоение бюджета.",
      ifNotDone: "Стоимость привлечения клиента будет расти вместе с конкуренцией.",
      controlKpi: "CR (Landing Page)"
    },
    {
      title: "РАБОТА С ЧЕКОМ",
      action: "Разработать Upsell-предложение для текущих лидов",
      whyNow: "Увеличение среднего чека на 10% мгновенно выправляет ROI.",
      ifNotDone: "Низкая маржинальность не даст возможности покупать дорогой трафик.",
      controlKpi: "Average Order Value"
    }
  ];

  return {
    risk: profit < 0 ? 'Высокий' : roi < 50 ? 'Средний' : 'Низкий',
    insights,
    priorityActions,
    lossPoints,
    scenarios,
    alternativePlan: "Перераспределить бюджет в пользу наиболее конверсионных площадок.",
    scores: {
      total: totalScore,
      economy: economyScore,
      funnel: funnelScore,
      scale: scaleScore,
      interpretation
    }
  };
}
