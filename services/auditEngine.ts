
import { KpiInputs, KpiMetrics, AuditResult, CurrencyCode, Scenario } from "../types";

export function generateAuditReport(
  inputs: KpiInputs,
  metrics: KpiMetrics,
  currency: CurrencyCode
): AuditResult {
  const currencySymbol = currency === 'KZT' ? '₸' : '$';
  const { budget, leads, avgCheck } = inputs;
  const { roi, cr, cpl, beCpl, cpa, beCpa, revenue, profit } = metrics;

  // 1. Scores Calculation (0-10 Scale)
  const economyScore = Math.min(10, Math.max(0, Math.round(roi / 25)));
  const funnelScore = Math.min(10, Math.max(0, Math.round(cr / 1.5)));
  const scaleScore = cpl < beCpl ? Math.min(10, Math.max(1, Math.round((beCpl / (cpl || 1)) * 4))) : 1;
  const totalScore = Math.round((economyScore + funnelScore + scaleScore) / 3);

  // 2. Risk Determination
  let risk: 'Низкий' | 'Средний' | 'Высокий' = 'Низкий';
  let riskReason = 'Экономика выглядит здоровой. Текущие показатели позволяют безопасно масштабироваться.';
  
  if (profit < 0) {
    risk = 'Высокий';
    riskReason = 'Критическая ситуация: кампания работает в убыток. Требуется немедленная остановка или радикальная оптимизация.';
  } else if (roi < 50 || cpl > beCpl * 0.85) {
    risk = 'Средний';
    riskReason = 'Запас прочности минимален. Любое колебание цены клика выведет проект в минус.';
  }

  // 3. Loss Points
  const lossPoints = [];
  if (cpl > beCpl) {
    lossPoints.push({
      label: 'CPL выше безубыточности',
      diff: `+${(((cpl / beCpl) - 1) * 100).toFixed(0)}%`,
      lossValue: Math.round((cpl - beCpl) * leads),
      isCritical: true
    });
  }
  if (cr < 3) {
    lossPoints.push({
      label: 'Критически низкая конверсия',
      diff: `${cr.toFixed(1)}%`,
      lossValue: Math.round(revenue * 0.4),
      isCritical: true
    });
  }

  // 4. Scenarios (What-if) - Strictly matching user requirements
  // FIX: Pre-calculate values to avoid defining temporary variables inside the object literal which caused TS errors
  const newSalesWithMoreCr = (cr + 5) / 100 * leads;
  const newLeadsWithLessCpl = budget / (cpl * 0.9 || 1);

  // Added badgeType and badgeLabel to Scenario objects to resolve TS errors
  const scenarios: Scenario[] = [
    {
      title: '+20% Бюджет',
      profit: Math.round(( (budget * 1.2) / (cpa || 1) ) * avgCheck - (budget * 1.2)),
      roi: Math.round(roi),
      comment: 'Прогноз прибыли при сохранении текущей эффективности воронки.',
      badgeType: roi >= 0 ? 'good' : 'bad',
      badgeLabel: roi >= 0 ? 'РЕАЛИСТИЧНО' : 'РИСК'
    },
    {
      title: '+5% Конверсия',
      // FIX: Removed illegal property 'constNewSales' and used pre-calculated value
      profit: Math.round(newSalesWithMoreCr * avgCheck - budget),
      roi: Math.round(((newSalesWithMoreCr * avgCheck - budget) / (budget || 1)) * 100),
      comment: 'Результат при улучшении работы отдела продаж или посадочной страницы.',
      badgeType: 'good',
      badgeLabel: 'РЕАЛИСТИЧНО'
    },
    {
      title: '-10% CPL',
      // FIX: Removed illegal property 'constNewLeads' and used pre-calculated value
      profit: Math.round((newLeadsWithLessCpl * (cr / 100)) * avgCheck - budget),
      roi: Math.round((((newLeadsWithLessCpl * (cr / 100)) * avgCheck - budget) / (budget || 1)) * 100),
      comment: 'Эффект от снижения стоимости привлечения (улучшение CTR/таргета).',
      badgeType: 'good',
      badgeLabel: 'РЕАЛИСТИЧНО'
    }
  ];

  // 5. Insights
  const insights = [
    `Конверсия воронки составляет ${cr.toFixed(1)}%. ${cr < 5 ? 'Это "узкое горлышко" вашего маркетинга.' : 'Показатель в пределах нормы.'}`,
    `Текущий ROI ${roi.toFixed(0)}% говорит о ${profit > 0 ? 'положительной' : 'отрицательной'} динамике капитала.`,
    `Безубыточный лид (BE CPL) стоит не более ${beCpl.toFixed(0)}${currencySymbol}.`
  ];

  // 6. Priority Actions
  const priorityActions = [
    {
      title: profit < 0 ? "СТОП КАМПАНИЯ" : "МАСШТАБИРОВАНИЕ",
      action: profit < 0 ? "Отключите нерентабельные связки немедленно" : "Поэтапно наращивайте бюджет на 15% в неделю",
      whyNow: profit < 0 ? "Каждый день работы приносит прямой убыток." : "ROI позволяет кратно увеличивать долю рынка.",
      ifNotDone: "Бизнес потеряет операционную устойчивость.",
      controlKpi: profit < 0 ? "CPA (Target)" : "Volume of Sales"
    },
    {
      title: "ОПТИМИЗАЦИЯ CR",
      action: "Проведите аудит скриптов продаж или UX сайта.",
      whyNow: "Повышение CR на 1% даст больше прибыли, чем рост бюджета на 20%.",
      ifNotDone: "Вы продолжите переплачивать за трафик, который не конвертируется.",
      controlKpi: "Conversion Rate"
    }
  ];

  return {
    risk,
    riskReason,
    insights,
    priorityActions,
    lossPoints,
    scenarios,
    alternativePlan: roi < 50 ? "Сфокусируйтесь на допродажах текущей базе (LTV), чтобы компенсировать дорогой трафик." : "Протестируйте новые каналы (Influencers/SEO), так как текущий канал близок к насыщению.",
    scores: {
      total: totalScore,
      economy: economyScore,
      funnel: funnelScore,
      scale: scaleScore,
      interpretation: totalScore > 7 ? "Бизнес-модель устойчива. Рекомендуется агрессивный рост." : "Фундамент маркетинга слаб. Исправьте воронку перед вливанием бюджета."
    }
  };
}
