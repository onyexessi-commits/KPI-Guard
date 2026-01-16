
import { KpiInputs, KpiMetrics, AuditResult, CurrencyCode, Scenario } from "../types";

const clampRoi = (roi: number): number => Math.min(1000, Math.max(-100, roi));

export function calculateMetrics(inputs: KpiInputs): KpiMetrics {
  const { budget, leads, sales, avgCheck } = inputs;
  
  const cpl = leads > 0 ? budget / leads : 0;
  const cpa = sales > 0 ? budget / sales : 0;
  const revenue = sales * avgCheck;
  const marketingContribution = revenue - budget; // Маркетинговый вклад (Gross)
  const roi = budget > 0 ? (marketingContribution / budget) * 100 : 0;
  const cr = leads > 0 ? (sales / leads) * 100 : 0;
  
  // Безубыточность СТРОГО по выручке (Marketing BE)
  const beCpa = avgCheck; 
  const beCpl = avgCheck * (leads > 0 ? (sales / leads) : 0);

  return { cpl, cpa, revenue, profit: marketingContribution, roi, cr, beCpa, beCpl };
}

export function generateAuditReport(
  inputs: KpiInputs,
  metrics: KpiMetrics,
  currency: CurrencyCode
): AuditResult {
  const currencySymbol = currency === 'KZT' ? '₸' : '$';
  const { budget, leads, sales, avgCheck } = inputs;
  const { roi, cr, cpl, beCpl, cpa, beCpa, profit } = metrics;

  // Определение режима
  const isRecoveryMode = profit <= 0 || roi <= 0;

  // Оценки (0-10), СТРОГИЙ потолок 8.5
  const economyBase = Math.min(8.5, Math.max(0, (roi / 45) + 3.5));
  const funnelBase = Math.min(8.5, Math.max(0, (cr / 2) + 1.5));
  const scaleBase = cpl < beCpl ? Math.min(8.5, Math.max(1, (beCpl / (cpl || 1)) * 2)) : 1.5;
  
  const totalScore = Number(Math.min(8.5, (economyBase + funnelBase + scaleBase) / 3).toFixed(1));

  let interpretation = "";
  if (isRecoveryMode) {
    interpretation = "Критическая неэффективность маркетинга. Модель работает в убыток по выручке. Требуется поэтапное восстановление экономики.";
  } else {
    if (totalScore >= 7.5) interpretation = "Высокая маркетинговая эффективность. Модель имеет запас прочности для тестирования масштабирования.";
    else if (totalScore >= 5.5) interpretation = "Устойчивые показатели маркетинга. Рекомендуется точечная оптимизация воронки.";
    else interpretation = "Низкая эффективность вклада. Необходим аудит перед любым ростом затрат.";
  }

  const lossPoints = [];
  if (cpl > beCpl) {
    lossPoints.push({
      label: 'CPL выше порога выручки',
      diff: `+${(((cpl / (beCpl || 1)) - 1) * 100).toFixed(1)}%`,
      lossValue: Math.round((cpl - beCpl) * leads),
      isCritical: cpl > beCpl * 1.15
    });
  }
  if (cr < 2) {
    lossPoints.push({
      label: 'Низкая конверсия (CR)',
      diff: `${cr.toFixed(1)}%`,
      lossValue: Math.round(budget * 0.5),
      isCritical: true
    });
  }
  if (cpa > beCpa) {
    lossPoints.push({
      label: 'CPA превышает чек',
      diff: `-${Math.round(cpa - beCpa)}${currencySymbol}`,
      lossValue: Math.round(Math.abs(profit)),
      isCritical: true
    });
  }

  const scenarios: Scenario[] = [];

  const getFormatDiff = (val: number) => {
    const abs = Math.abs(val);
    return `${val >= 0 ? '+' : '-'}${abs.toLocaleString()}${currencySymbol}`;
  };

  if (isRecoveryMode) {
    // РЕЖИМ ВОССТАНОВЛЕНИЯ (3 Уровня)
    
    // Уровень 1: Минимизация потерь
    // Снижаем CPL на 20% или повышаем CR на 20% от текущего (не п.п.)
    const l1Cr = cr * 1.2 / 100;
    const l1Sales = leads * l1Cr;
    const l1Profit = (l1Sales * avgCheck) - budget;
    scenarios.push({
      title: 'Уровень 1: Минимизация потерь',
      profit: Math.round(l1Profit),
      roi: Number(clampRoi((l1Profit / (budget || 1)) * 100).toFixed(1)),
      comment: `Текущий вклад: ${getFormatDiff(Math.round(profit))}. Цель: ${getFormatDiff(Math.round(l1Profit))}. Разница: ${getFormatDiff(Math.round(l1Profit - profit))}. Требуется рост CR на 20% от тек. значения.`,
      badgeType: 'neutral',
      badgeLabel: 'РЕАЛИСТИЧНО'
    });

    // Уровень 2: Выход к безубыточности (Break-even)
    // Рассчитываем CR необходимый для 0 при текущем CPL и бюджете
    const l2TargetCr = budget / (leads * (avgCheck || 1));
    const l2Sales = leads * l2TargetCr;
    const l2Profit = (l2Sales * avgCheck) - budget; // Должно быть ~0
    scenarios.push({
      title: 'Уровень 2: Безубыточность (BE)',
      profit: 0,
      roi: 0,
      comment: `Текущий вклад: ${getFormatDiff(Math.round(profit))}. Цель: 0${currencySymbol}. Разница: ${getFormatDiff(Math.round(-profit))}. Необходимо довести CR до ${(l2TargetCr * 100).toFixed(2)}%.`,
      badgeType: 'good',
      badgeLabel: 'РЕАЛИСТИЧНО'
    });

    // Уровень 3: Контролируемый плюс (ROI +7%)
    const targetRoi = 7;
    const l3RequiredRevenue = budget * (1 + targetRoi / 100);
    const l3RequiredSales = l3RequiredRevenue / (avgCheck || 1);
    const l3Profit = l3RequiredRevenue - budget;
    scenarios.push({
      title: 'Уровень 3: Контролируемый плюс',
      profit: Math.round(l3Profit),
      roi: targetRoi,
      comment: `Текущий вклад: ${getFormatDiff(Math.round(profit))}. Цель: ${getFormatDiff(Math.round(l3Profit))}. Разница: ${getFormatDiff(Math.round(l3Profit - profit))}. Достижение ROI gross +7% через оптимизацию воронки.`,
      badgeType: 'good',
      badgeLabel: 'РЕАЛИСТИЧНО'
    });

  } else {
    // РЕЖИМ РОСТА
    const getBadge = (roiVal: number, crPrime: number, crBase: number, budgetFactor: number, cplFactor: number): { type: 'good' | 'neutral' | 'bad', label: string } => {
      const isAggressive = crPrime > 0.30 || (crPrime - crBase) > 0.1 || cplFactor < 0.65 || budgetFactor > 1.8;
      if (isAggressive) return { type: 'bad', label: 'АГРЕССИВНО' };
      return roiVal >= 0 ? { type: 'good', label: 'РЕАЛИСТИЧНО' } : { type: 'neutral', label: 'РИСК' };
    };

    // Гипотеза 1: +20% Бюджет
    const budgetA = budget * 1.2;
    const salesA = cpa > 0 ? (budgetA / cpa) : 0;
    const profitA = (salesA * avgCheck) - budgetA;
    const roiA = budgetA > 0 ? (profitA / budgetA) * 100 : 0;
    const badgeA = getBadge(roiA, cr / 100, cr / 100, 1.2, 1);
    scenarios.push({
      title: '+20% Бюджет (Гипотеза)',
      profit: Math.round(profitA),
      roi: Number(clampRoi(roiA).toFixed(1)),
      comment: `Прогноз вклада при сохранении текущего CPA. Цель: ${getFormatDiff(Math.round(profitA))}.`,
      badgeType: badgeA.type,
      badgeLabel: badgeA.label
    });

    // Гипотеза 2: +5% к CR (п.п.)
    const crBaseVal = leads > 0 ? (sales / leads) : 0;
    const crB = Math.min(1, crBaseVal + 0.05);
    const salesB = leads * crB;
    const profitB = (salesB * avgCheck) - budget;
    const roiB = budget > 0 ? (profitB / budget) * 100 : 0;
    const badgeB = getBadge(roiB, crB, crBaseVal, 1, 1);
    scenarios.push({
      title: '+5% к Конверсии (Гипотеза)',
      profit: Math.round(profitB),
      roi: Number(clampRoi(roiB).toFixed(1)),
      comment: `Оптимизация воронки. Цель: ${getFormatDiff(Math.round(profitB))}.`,
      badgeType: badgeB.type,
      badgeLabel: badgeB.label
    });

    // Гипотеза 3: -10% CPL
    const cplC = cpl * 0.9;
    const leadsC = cplC > 0 ? budget / cplC : 0;
    const salesC = leadsC * (leads > 0 ? (sales / leads) : 0);
    const profitC = (salesC * avgCheck) - budget;
    const roiC = budget > 0 ? (profitC / budget) * 100 : 0;
    const badgeC = getBadge(roiC, cr / 100, cr / 100, 1, 0.9);
    scenarios.push({
      title: '-10% Стоимость лида (Гипотеза)',
      profit: Math.round(profitC),
      roi: Number(clampRoi(roiC).toFixed(1)),
      comment: `Улучшение CTR/Таргета. Цель: ${getFormatDiff(Math.round(profitC))}.`,
      badgeType: badgeC.type,
      badgeLabel: badgeC.label
    });
  }

  const insights = [
    `Маркетинговый вклад: Текущий результат — ${Math.round(profit).toLocaleString()}${currencySymbol} (Gross).`,
    `Эффективность: Каждый ${currencySymbol} приносит ${(metrics.revenue / (budget || 1)).toFixed(2)}${currencySymbol} выручки (ROAS).`,
    `Уровень безубыточности: CPL не выше ${Math.round(beCpl).toLocaleString()}${currencySymbol} для окупаемости по выручке.`,
    `Дисклеймер: Расчеты выполнены без учета себестоимости продукции.`
  ];

  const priorityActions = [
    {
      title: isRecoveryMode ? "ОСТАНОВКА УБЫТКОВ" : "ТЕСТ МАСШТАБА",
      action: isRecoveryMode ? "Отключить сегменты с отрицательным вкладом (CPA > Чек)" : "Поэтапное увеличение лимитов на 10% в эффективных связках",
      whyNow: isRecoveryMode ? "Текущая модель сжигает бюджет без возврата выручки." : "Положительный ROI позволяет безопасно расширять охват.",
      ifNotDone: "Это приведет к дефициту маркетингового бюджета.",
      controlKpi: "ROAS / CPA"
    },
    {
      title: "КОНТРОЛЬ ВОРОНКИ",
      action: "Аудит качества обработки заявок и квалификации лидов",
      whyNow: "Разрыв между CPL и BE CPL критичен для выживаемости модели.",
      ifNotDone: "Рекламный бюджет будет потрачен неэффективно.",
      controlKpi: "Sales CR"
    }
  ];

  return {
    risk: profit < 0 ? 'Высокий' : roi < 40 ? 'Средний' : 'Низкий',
    insights,
    priorityActions,
    lossPoints,
    scenarios,
    alternativePlan: isRecoveryMode ? "Сфокусироваться на повторных продажах (LTV) для исправления экономики маркетинга." : "Тестирование новых офферов для повышения среднего чека.",
    scores: {
      total: totalScore,
      economy: Number(economyBase.toFixed(1)),
      funnel: Number(funnelBase.toFixed(1)),
      scale: Number(scaleBase.toFixed(1)),
      interpretation
    }
  };
}
