
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
    interpretation = "Маркетинговая модель нерентабельна по выручке. Требуется экстренное восстановление экономики воронки.";
  } else {
    if (totalScore >= 7.5) interpretation = "Высокая маркетинговая эффективность. Модель имеет запас прочности для тестирования масштабирования.";
    else if (totalScore >= 5.5) interpretation = "Устойчивые показатели маркетинга. Рекомендуется точечная оптимизация конверсионных этапов.";
    else interpretation = "Низкая эффективность маркетингового вклада. Рекомендуется аудит воронки перед любым ростом затрат.";
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
      label: 'CPA превышает выручку на сделку',
      diff: `-${Math.round(cpa - beCpa)}${currencySymbol}`,
      lossValue: Math.round(Math.abs(profit)),
      isCritical: true
    });
  }

  const scenarios: Scenario[] = [];

  const getBadge = (roiVal: number, crPrime: number, crBase: number, budgetFactor: number, cplFactor: number): { type: 'good' | 'neutral' | 'bad', label: string } => {
    const isAggressive = crPrime > 0.30 || (crPrime - crBase) > 0.1 || cplFactor < 0.65 || budgetFactor > 1.8;
    if (isAggressive) return { type: 'bad', label: 'АГРЕССИВНО' };
    return roiVal >= 0 ? { type: 'good', label: 'РЕАЛИСТИЧНО' } : { type: 'neutral', label: 'РИСК' };
  };

  if (isRecoveryMode) {
    // РЕЖИМ ВОССТАНОВЛЕНИЯ
    // 1. Сценарий: Целевой CPL для BE
    const targetCpl = beCpl > 0 ? beCpl : (avgCheck * 0.02);
    const newLeadsA = budget / targetCpl;
    const newSalesA = newLeadsA * (leads > 0 ? (sales / leads) : 0.02);
    const newProfitA = (newSalesA * avgCheck) - budget;
    scenarios.push({
      title: 'Оптимизация CPL (до BE)',
      profit: Math.round(newProfitA),
      roi: 0,
      comment: `Снижение стоимости лида до ${Math.round(targetCpl)}${currencySymbol} для выхода в маркетинговый ноль.`,
      badgeType: 'good',
      badgeLabel: 'РЕАЛИСТИЧНО'
    });

    // 2. Сценарий: Целевой CR для BE
    const targetCr = (avgCheck > 0) ? (budget / (leads * avgCheck)) : 0.05;
    const newSalesB = leads * targetCr;
    const newProfitB = (newSalesB * avgCheck) - budget;
    scenarios.push({
      title: 'Рост Конверсии (до BE)',
      profit: Math.round(newProfitB),
      roi: 0,
      comment: `Повышение CR до ${(targetCr * 100).toFixed(1)}% для окупаемости текущих затрат на трафик.`,
      badgeType: 'good',
      badgeLabel: 'РЕАЛИСТИЧНО'
    });

    // 3. Сценарий: Сокращение бюджета
    const reducedBudget = budget * 0.6;
    const newLeadsC = leads * 0.6;
    const newSalesC = sales * 0.6;
    const newProfitC = (newSalesC * avgCheck) - reducedBudget;
    scenarios.push({
      title: 'Сокращение бюджета (-40%)',
      profit: Math.round(newProfitC),
      roi: Number(clampRoi((newProfitC / (reducedBudget || 1)) * 100).toFixed(1)),
      comment: 'Снижение операционных рисков через сокращение охвата в неэффективных каналах.',
      badgeType: 'neutral',
      badgeLabel: 'РИСК'
    });

  } else {
    // РЕЖИМ РОСТА
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
      comment: 'Расчет при условии сохранения текущего CPA и качества лидов при росте масштаба.',
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
      comment: 'Гипотеза: оптимизация посадочной страницы или квалификации лидов.',
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
      comment: 'Гипотеза: снижение стоимости клика или рост CTR без потери качества.',
      badgeType: badgeC.type,
      badgeLabel: badgeC.label
    });
  }

  const insights = [
    `Маркетинговый вклад: Текущий результат маркетинга — ${Math.round(profit).toLocaleString()}${currencySymbol} (Gross).`,
    `ROAS/ROI (Gross): Маркетинг генерирует ${(metrics.revenue / (budget || 1)).toFixed(2)}${currencySymbol} выручки на каждый вложенный ${currencySymbol}.`,
    `Порог BE CPL: Лид должен стоить не более ${Math.round(beCpl).toLocaleString()}${currencySymbol} для окупаемости по выручке.`,
    `Дисклеймер: Расчеты отражают эффективность маркетинга. Себестоимость и операционные расходы НЕ учтены.`
  ];

  const priorityActions = [
    {
      title: isRecoveryMode ? "ОСТАНОВКА УБЫТКОВ" : "ТЕСТ МАСШТАБА",
      action: isRecoveryMode ? "Выявить и отключить кампании с CPA > Avg Check" : "Плановое увеличение лимитов на 10% в наиболее эффективных связках",
      whyNow: isRecoveryMode ? "Каждый день работы в текущем режиме сжигает маркетинговый бюджет." : "Текущий ROI (Gross) позволяет расширять воронку без риска дефицита.",
      ifNotDone: "Бизнес продолжит нести необоснованные маркетинговые расходы.",
      controlKpi: "ROAS / CPA"
    },
    {
      title: "АУДИТ ВОРОНКИ",
      action: "Проверка качества лидов и скорости обработки заявок",
      whyNow: "Разрыв между CPL и BE CPL указывает на неэффективность этапа конвертации трафика.",
      ifNotDone: "Дальнейшее вливание бюджета будет умножать неэффективность воронки.",
      controlKpi: "Sales CR"
    }
  ];

  return {
    risk: profit < 0 ? 'Высокий' : roi < 40 ? 'Средний' : 'Низкий',
    insights,
    priorityActions,
    lossPoints,
    scenarios,
    alternativePlan: isRecoveryMode ? "Сфокусироваться на CRM-маркетинге и LTV для извлечения выручки из текущей базы." : "Протестировать новые источники трафика для диверсификации рисков.",
    scores: {
      total: totalScore,
      economy: Number(economyBase.toFixed(1)),
      funnel: Number(funnelBase.toFixed(1)),
      scale: Number(scaleBase.toFixed(1)),
      interpretation
    }
  };
}
