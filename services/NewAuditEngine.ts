
import { KpiInputs, KpiMetrics, AuditResult, CurrencyCode, Scenario } from "../types";

export const FX_RATE = 500; // 1 USD = 500 KZT

export function convertInputs(inputs: KpiInputs, from: CurrencyCode, to: CurrencyCode): KpiInputs {
  if (from === to) return inputs;
  const factor = to === 'KZT' ? FX_RATE : 1 / FX_RATE;
  return {
    budget: inputs.budget * factor,
    leads: inputs.leads,
    sales: inputs.sales,
    avgCheck: inputs.avgCheck * factor
  };
}

export function calculateMetrics(inputs: KpiInputs): KpiMetrics {
  const { budget, leads, sales, avgCheck } = inputs;
  
  const cpl = leads > 0 ? budget / leads : 0;
  const cpa = sales > 0 ? budget / sales : 0;
  const revenue = sales * avgCheck;
  const profit = revenue - budget;
  const roi = budget > 0 ? (profit / budget) * 100 : 0;
  const cr = leads > 0 ? (sales / leads) * 100 : 0;
  const mer = budget > 0 ? revenue / budget : 0;
  const unitGap = avgCheck - cpa;
  
  const beCpa = avgCheck; 
  const beCpl = avgCheck * (leads > 0 ? (sales / leads) : 0);

  return { cpl, cpa, revenue, profit, roi, cr, mer, unitGap, beCpa, beCpl };
}

export function generateAuditReport(
  inputs: KpiInputs,
  metrics: KpiMetrics,
  currency: CurrencyCode
): AuditResult {
  const { roi, cr, cpl, beCpl, cpa, profit, mer, unitGap, beCpa } = metrics;
  const { budget, leads, sales, avgCheck } = inputs;
  
  const isLoss = profit <= 0 || roi <= 0 || mer < 1 || unitGap <= 0;
  const mode = isLoss ? 'RECOVERY' : 'SCALING';

  const isKZT = currency === 'KZT';
  const curSym = isKZT ? '₸' : '$';

  // McKinsey-style scoring (0.0 - 10.0)
  const economyBase = isLoss ? Math.max(1, (mer * 3)) : Math.min(10, 4 + (roi / 40));
  const funnelBase = Math.min(10, (cr / 2) * 3);
  const scaleBase = !isLoss ? Math.min(10, (beCpa / (cpa || 1)) * 2) : 1;
  const totalScore = Number(((economyBase + funnelBase + scaleBase) / 3).toFixed(1));

  const insights: string[] = [];

  if (isLoss) {
    insights.push(`Критический убыток: на каждый ${isKZT ? '1000' : '1'} ${curSym} вы теряете ${Math.abs(Math.round((isKZT ? 1000 : 1) * (1 - mer)))} ${curSym}.`);
    insights.push(`Юнит-дефицит: CPA (${Math.round(cpa)}) > чека (${Math.round(avgCheck)}). Вы доплачиваете ${Math.round(Math.abs(unitGap))} ${curSym} за каждую продажу.`);
    insights.push(`Точка безубыточности: Лид должен стоить не дороже ${Math.round(beCpl)} ${curSym} при текущей конверсии.`);
  } else {
    insights.push(`Положительный маркетинговый вклад: ${Math.round(unitGap)} ${curSym} с каждой транзакции.`);
    insights.push(`Высокая эффективность (MER ${mer.toFixed(2)}x): модель позволяет агрессивно реинвестировать прибыль.`);
    insights.push(`Запас по CPA: стоимость продажи может вырасти до ${Math.round(beCpa)} ${curSym} без ухода в минус.`);
  }

  // --- Scenarios Generation ---
  let scenarios: Scenario[] = [];

  if (isLoss) {
    // Stage 1: Сокращение потерь (Стабилизация)
    const s1Budget = budget * 0.4; // Сокращаем до 40% бюджета (оставляем только окупаемое)
    const s1Profit = (s1Budget * mer) - s1Budget; // Математически уменьшаем абсолютный минус
    scenarios.push({
      title: "УМЕНЬШЕНИЕ ПОТЕРЬ",
      profit: Math.round(s1Profit),
      roi: Number(roi.toFixed(1)),
      comment: `Сокращение бюджета до ${Math.round(s1Budget).toLocaleString()} ${curSym}. Остановка слива в неэффективных каналах.`,
      badgeType: 'bad',
      badgeLabel: 'КРИЗИС'
    });

    // Stage 2: Выход в 0 (Break-Even)
    scenarios.push({
      title: "ВЫХОД В НОЛЬ (BE)",
      profit: 0,
      roi: 0,
      comment: `Снижение стоимости лида до ${Math.round(beCpl)} ${curSym} или рост конверсии до ${(leads > 0 ? (budget / avgCheck) / leads * 100 : 0).toFixed(1)}%.`,
      badgeType: 'neutral',
      badgeLabel: 'ЦЕЛЬ №1'
    });

    // Stage 3: Выход в первичный плюс (+15% ROI)
    const targetRoi = 15;
    const targetRevenue = budget * (1 + targetRoi / 100);
    scenarios.push({
      title: "ВЫХОД В ПЛЮС",
      profit: Math.round(targetRevenue - budget),
      roi: targetRoi,
      comment: `Целевая модель: рост чека на 10% и конверсии на 1.5%. Модель становится прибыльной.`,
      badgeType: 'good',
      badgeLabel: 'ГИПОТЕЗА'
    });
  } else {
    // Stage 1: Консервативное масштабирование (+25% бюджет)
    scenarios.push({
      title: "КОНСЕРВАТИВНЫЙ РОСТ",
      profit: Math.round(profit * 1.25),
      roi: Number(roi.toFixed(1)),
      comment: `Бюджет: ${Math.round(budget * 1.25).toLocaleString()} ${curSym}. Безопасное увеличение без потери качества трафика.`,
      badgeType: 'good',
      badgeLabel: 'БЕЗОПАСНО'
    });

    // Stage 2: Умеренный рост (+60% бюджет)
    scenarios.push({
      title: "УМЕРЕННЫЙ РОСТ",
      profit: Math.round(profit * 1.6),
      roi: Number(roi.toFixed(1)),
      comment: `Бюджет: ${Math.round(budget * 1.6).toLocaleString()} ${curSym}. Активный захват доли рынка при текущем CPA.`,
      badgeType: 'good',
      badgeLabel: 'МАСШТАБ'
    });

    // Stage 3: Агрессивная экспансия (+120% бюджет)
    scenarios.push({
      title: "АГРЕССИВНЫЙ РОСТ",
      profit: Math.round(profit * 2.2),
      roi: Number((roi * 0.9).toFixed(1)), // Учитываем деградацию при агрессивном росте
      comment: `Бюджет: ${Math.round(budget * 2.2).toLocaleString()} ${curSym}. Максимальный охват. Допускаем рост CPA на 10%.`,
      badgeType: 'good',
      badgeLabel: 'ЭКСПАНСИЯ'
    });
  }

  const priorityActions = isLoss ? [
    {
      title: "КРИТИЧЕСКАЯ ОПТИМИЗАЦИЯ",
      action: `Снижение CPA ниже ${Math.round(avgCheck)} ${curSym}`,
      whyNow: "Текущая юнит-экономика сжигает капитал. Каждая продажа убыточна.",
      controlKpi: "CPA / MER"
    },
    {
      title: "АУДИТ КОНВЕРСИИ",
      action: "Проверка качества лидов и скриптов",
      whyNow: `При CR ${cr.toFixed(1)}% трафик не может окупиться. Нужен рост конверсии в 1.5 раза.`,
      controlKpi: "Lead-to-Sale CR"
    }
  ] : [
    {
      title: "МАСШТАБИРОВАНИЕ",
      action: "Увеличение лимитов на 20% каждые 3 дня",
      whyNow: "ROI позволяет реинвестировать прибыль для экспоненциального роста.",
      controlKpi: "Budget / ROI"
    },
    {
      title: "ЗАЩИТА ЮНИТ-ГЭПА",
      action: "Снижение CPL через ретаргетинг",
      whyNow: "Позволит увеличить чистый маркетинговый вклад с каждой продажи.",
      controlKpi: "CPL / Unit Gap"
    }
  ];

  return {
    mode,
    risk: isLoss ? 'Высокий' : (roi < 50 ? 'Средний' : 'Низкий'),
    riskReason: isLoss 
      ? `ВНИМАНИЕ: Модель убыточна. Вы теряете деньги. Масштабирование ЗАПРЕЩЕНО до исправления юнит-экономики.`
      : `МОДЕЛЬ ЭФФЕКТИВНА. Режим масштабирования активен. Запас прочности по ROI: ${roi.toFixed(1)}%.`,
    insights,
    priorityActions,
    scenarios,
    scores: {
      total: totalScore,
      economy: Number(economyBase.toFixed(1)),
      funnel: Number(funnelBase.toFixed(1)),
      scale: Number(scaleBase.toFixed(1)),
      interpretation: isLoss ? "Требуется антикризисное управление." : "Готовность к масштабированию подтверждена."
    }
  };
}
