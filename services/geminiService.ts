
import { GoogleGenAI } from "@google/genai";
import { KpiInputs, KpiMetrics, CurrencyCode } from "../types";

export async function generateAiAuditNarrative(
  inputs: KpiInputs,
  metrics: KpiMetrics,
  currency: CurrencyCode
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const currencySymbol = currency === 'KZT' ? '₸' : '$';
  
  const prompt = `
    Ты — KPI Guard, профессиональный AI-инструмент маркетингового аудита.
    Сформируй консалтинговый отчет (McKinsey style) на основе следующих данных:
    
    ВВОДНЫЕ:
    - Бюджет: ${inputs.budget} ${currencySymbol}
    - Лиды: ${inputs.leads}
    - Продажи: ${inputs.sales}
    - Средний чек: ${inputs.avgCheck} ${currencySymbol}
    
    РАСЧЕТНЫЕ KPI (Marketing Gross):
    - ROI: ${metrics.roi.toFixed(1)}%
    - Выручка: ${metrics.revenue} ${currencySymbol}
    - Вклад (Gross Profit): ${metrics.profit} ${currencySymbol}
    - CPL: ${metrics.cpl.toFixed(1)}
    - CPA: ${metrics.cpa.toFixed(1)}
    - Конверсия (CR): ${metrics.cr.toFixed(1)}%
    - Безубыточный CPL (BE CPL): ${metrics.beCpl.toFixed(1)}
    
    ТРЕБОВАНИЯ К ОТВЕТУ (JSON):
    Верни строго JSON объект с тремя полями:
    1. verdict: (2-3 предложения) Сверх-лаконичный вывод по эффективности модели.
    2. diagnostic: (3 пункта) Анализ того, что является "узким горлышком" (бюджет, цена лида или продажи).
    3. strategicActions: (3 пункта) Что нужно сделать прямо сейчас для исправления или роста.
    
    ТОН: Профессиональный, без воды, без прилагательных "замечательный", "ужасный". Только факты и логика.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return {
      verdict: "Анализ выполнен на основе локальных алгоритмов. AI-интерпретация временно недоступна.",
      diagnostic: "Требуется ручная проверка воронки.",
      strategicActions: "Сфокусируйтесь на контроле CPA относительно среднего чека."
    };
  }
}
