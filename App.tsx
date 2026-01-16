import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  AlertCircle, 
  Zap,
  ShieldCheck,
  LayoutDashboard,
  RefreshCw,
  Wallet,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Copy,
  Download,
  Check
} from 'lucide-react';
import { KpiInputs, KpiMetrics, CurrencyCode, AuditResult } from './types';

// --- UI Components ---

const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
    <div className="bg-[#1e293b] border border-emerald-500/50 text-emerald-400 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider">
      <Check size={14} strokeWidth={3} />
      {message}
    </div>
  </div>
);

const Badge: React.FC<{ type: 'good' | 'neutral' | 'bad'; children: React.ReactNode }> = ({ type, children }) => {
  const styles = {
    good: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    neutral: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bad: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${styles[type]}`}>
      {children}
    </span>
  );
};

const MetricCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subLabel?: string;
  icon: React.ReactNode; 
  // FIX: Make currencySymbol optional to fix missing property error on ROI card
  currencySymbol?: string;
  isPercent?: boolean;
  badge?: 'good' | 'neutral' | 'bad';
  badgeText?: string;
}> = ({ label, value, subLabel, icon, currencySymbol, isPercent, badge, badgeText }) => (
  <div className="bg-[#161e2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl transition-all hover:border-indigo-500/30 group w-full max-w-full overflow-hidden break-words">
    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <div className="p-2 sm:p-2.5 bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors flex-shrink-0">
          {/* FIX: Cast icon to React.ReactElement<any> to avoid 'size' property type error */}
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18, className: 'sm:w-5 sm:h-5' })}
        </div>
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest break-words leading-tight">
          {label}
        </span>
      </div>
      {badge && <Badge type={badge}>{badgeText}</Badge>}
    </div>
    <div className="flex items-baseline gap-1 overflow-hidden">
      <span className="text-[clamp(1.1rem,5vw,1.5rem)] font-black text-white tracking-tight truncate max-w-[80%]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-xs sm:text-sm font-semibold text-slate-500 flex-shrink-0">{isPercent ? '%' : currencySymbol}</span>
    </div>
    {subLabel && <div className="text-[8px] sm:text-[10px] mt-2 text-slate-500 font-medium uppercase tracking-tight break-words">{subLabel}</div>}
  </div>
);

const InputGroup: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon: React.ReactNode;
  currencySymbol: string;
  hint?: string;
  error?: boolean;
}> = ({ label, value, onChange, icon, currencySymbol, hint, error }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider leading-tight">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 pointer-events-none">
        {/* FIX: Cast icon to React.ReactElement<any> to avoid 'size' property type error */}
        {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
        <span className="text-[9px] font-bold text-slate-600 border-l border-slate-800 pl-2">{currencySymbol}</span>
      </div>
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        placeholder="0"
        className={`w-full pl-14 sm:pl-16 pr-4 py-3.5 sm:py-3 bg-[#0b0f19] border rounded-xl text-sm text-white placeholder:text-slate-700 focus:ring-2 outline-none transition-all appearance-none min-h-[44px] ${
          error ? 'border-rose-500/50 ring-rose-500/10' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500/50'
        }`}
      />
    </div>
    {hint && <p className="text-[9px] sm:text-[10px] text-rose-400 ml-1 font-medium leading-tight">{hint}</p>}
  </div>
);

const FunnelBar: React.FC<{ label: string; value: number; total: number; color: string; currencySymbol: string }> = ({ label, value, total, color, currencySymbol }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest gap-2">
        <span className="truncate">{label}</span>
        <span className="text-slate-300 flex-shrink-0">{value.toLocaleString()} {currencySymbol} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${color}`} 
          style={{ width: `${Math.min(100, percentage)}%` }} 
        />
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currency, setCurrency] = useState<CurrencyCode>('KZT');
  const [inputs, setInputs] = useState<KpiInputs>({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const currencySymbol = currency === 'KZT' ? '₸' : '$';

  const errors = useMemo(() => ({
    sales: inputs.sales > inputs.leads,
    leads: inputs.leads === 0 && inputs.budget > 0,
  }), [inputs]);

  const metrics = useMemo<KpiMetrics>(() => {
    const { budget, leads, sales, avgCheck } = inputs;
    const cpl = leads > 0 ? budget / leads : 0;
    const cpa = sales > 0 ? budget / sales : 0;
    const revenue = sales * avgCheck;
    const roi = budget > 0 ? ((revenue - budget) / budget) * 100 : 0;
    const cr = leads > 0 ? (sales / leads) * 100 : 0;
    const beCpa = avgCheck;
    const beCpl = cr > 0 ? avgCheck * (cr / 100) : 0;

    return { cpl, cpa, revenue, roi, cr, beCpa, beCpl };
  }, [inputs]);

  const isFormValid = useMemo(() => {
    return inputs.budget > 0 && inputs.leads > 0 && inputs.avgCheck > 0 && !errors.sales && !errors.leads;
  }, [inputs, errors]);

  const getBadgeType = (type: 'CPL' | 'CPA' | 'ROI'): { type: 'good' | 'neutral' | 'bad'; text: string } | null => {
    const { cpl, beCpl, cpa, beCpa, roi } = metrics;
    if (type === 'CPL') {
      if (!cpl || !beCpl) return null;
      if (cpl < beCpl * 0.7) return { type: 'good', text: 'В норме' };
      if (cpl <= beCpl) return { type: 'neutral', text: 'Критично' };
      return { type: 'bad', text: 'Убыток' };
    }
    if (type === 'CPA') {
      if (!cpa || !beCpa) return null;
      if (cpa < beCpa * 0.7) return { type: 'good', text: 'В норме' };
      if (cpa <= beCpa) return { type: 'neutral', text: 'Высокий' };
      return { type: 'bad', text: 'Убыток' };
    }
    if (type === 'ROI') {
      if (inputs.budget === 0) return null;
      if (roi > 100) return { type: 'good', text: 'Высокий' };
      if (roi > 0) return { type: 'neutral', text: 'Средний' };
      return { type: 'bad', text: 'Низкий' };
    }
    return null;
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  const resetData = () => {
    setInputs({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
    setAudit(null);
  };

  const generateAudit = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const { roi, cpa, beCpa, cr, cpl, beCpl, revenue } = metrics;
      const { budget, avgCheck, leads } = inputs;
      const riskLevel = roi < 0 || cpa > beCpa * 0.95 ? 'Высокий' : (roi < 80 || cpa > beCpa * 0.6 ? 'Средний' : 'Низкий');
      
      const res: AuditResult = {
        risk: riskLevel,
        riskReason: riskLevel === 'Высокий' ? 'Критически высокая стоимость продажи и отрицательный ROI.' : (riskLevel === 'Средний' ? 'Показатели близки к точке безубыточности.' : 'Кампания показывает стабильную прибыльность.'),
        insights: [
          `Конверсия ${cr.toFixed(1)}% требует внимания при масштабировании.`,
          `ROI ${roi.toFixed(0)}% показывает ${roi > 0 ? 'прибыльность' : 'убыточность'} текущей модели.`,
          `Точка безубыточности (BE CPL) находится на уровне ${beCpl.toFixed(0)} ${currencySymbol}.`
        ],
        priorityActions: [
          { 
            title: cpa > beCpa ? "СНИЗИТЬ CPA" : "ТЕСТ КРЕАТИВОВ", 
            action: cpa > beCpa ? "Оптимизируйте воронку или снижайте CPL" : "Запустите 5 новых гипотез в неделю", 
            whyNow: cpa > beCpa ? `Текущая модель сжигает ${Math.abs(revenue - budget).toLocaleString()} ${currencySymbol} ежемесячно.` : `Снижение CPL выведет ROI на уровень ${(roi * 1.15).toFixed(0)}%.`,
            ifNotDone: "Бюджет будет исчерпан без возврата инвестиций через несколько циклов.",
            controlKpi: "Target CPA: " + (beCpa * 0.7).toFixed(0) + " " + currencySymbol
          },
          { 
            title: "РАБОТА С LTV", 
            action: "Запустите ретаргетинг по текущей базе", 
            whyNow: "Повторные продажи стоят в 5-7 раз дешевле привлечения новых.",
            ifNotDone: "База клиентов остывает, снижая LTV бизнеса.",
            controlKpi: "Retention Rate (RR)"
          }
        ],
        lossPoints: cpl > beCpl ? [{ label: 'CPL выше точки безубыточности', diff: `${(((cpl/beCpl)-1)*100).toFixed(0)}%`, lossValue: (cpl - beCpl) * leads, isCritical: true }] : [],
        scenarios: [
          { title: 'Оптимизация бюджета (+20%)', profit: (budget * 1.2 / (cpa || 1)) * avgCheck - (budget * 1.2), roi: roi + 15, comment: 'При сохранении текущего CPA и масштабировании.' }
        ],
        alternativePlan: roi < 50 ? "Переключить 30% бюджета на работу с теплой базой через Email/SMS до исправления CPL." : "Сосредоточиться на повышении среднего чека через апселлы.",
        scores: {
          total: Number(((roi / 200 * 10 + cr / 15 * 10) / 2).toFixed(1)),
          economy: Number((roi / 200 * 10).toFixed(1)),
          funnel: Number((cr / 15 * 10).toFixed(1)),
          scale: 7.5,
          interpretation: roi > 100 ? "Кампания устойчива and готова к росту." : "Требуется оптимизация ключевых этапов воронки."
        }
      };
      setAudit(res);
      setIsGenerating(false);
    }, 1200);
  };

  const copyReportToClipboard = () => {
    if (!audit) return;
    const profit = metrics.revenue - inputs.budget;
    
    const lossPoints = audit.lossPoints.length > 0 
      ? audit.lossPoints.map((lp, i) => `${i+1}) ${lp.label} (${lp.diff}): -${lp.lossValue.toLocaleString()} ${currencySymbol}`).join('\n')
      : '— нет данных';
    
    const scenarios = audit.scenarios.length > 0
      ? audit.scenarios.map((s, i) => `${i+1}) ${s.title}: Прибыль ${s.profit.toLocaleString()} ${currencySymbol}, ROI ${s.roi}%. ${s.comment}`).join('\n')
      : '— нет данных';

    const priorityActions = audit.priorityActions.length > 0
      ? audit.priorityActions.map((pa, i) => `${i+1}) ${pa.title}\n   Действие: ${pa.action}\n   Почему сейчас: ${pa.whyNow}\n   Если не сделать: ${pa.ifNotDone}\n   Контроль KPI: ${pa.controlKpi}`).join('\n')
      : '— нет данных';

    const text = `
ОТЧЁТ KPI GUARD
Сформировано: ${new Date().toLocaleString()}

ВХОДНЫЕ ДАННЫЕ:
- Валюта: ${currency}
- Бюджет: ${inputs.budget.toLocaleString()} ${currencySymbol}
- Лиды: ${inputs.leads}
- Продажи: ${inputs.sales}
- Средний чек: ${inputs.avgCheck.toLocaleString()} ${currencySymbol}

KPI:
- CPL (Цена лида): ${metrics.cpl.toFixed(0)} ${currencySymbol}
- CPA (Цена продажи): ${metrics.cpa.toFixed(0)} ${currencySymbol}
- ROI: ${metrics.roi.toFixed(0)}%
- Выручка: ${metrics.revenue.toLocaleString()} ${currencySymbol}
- Прибыль: ${profit.toLocaleString()} ${currencySymbol}
- Конверсия: ${metrics.cr.toFixed(1)}%

ПРЕДЕЛЫ:
- Предел CPL (Break-even): ${metrics.beCpl.toFixed(0)} ${currencySymbol}
- Предел CPA (Break-even): ${metrics.beCpa.toFixed(0)} ${currencySymbol}

ИТОГ:
- Риск: ${audit.risk} ${audit.riskReason ? `(${audit.riskReason})` : ''}
- Общая оценка: ${audit.scores.total}/10
- Подоценки: Экономика: ${audit.scores.economy}/10, Воронка: ${audit.scores.funnel}/10, Масштаб: ${audit.scores.scale}/10
- Интерпретация: ${audit.scores.interpretation}

ТОЧКИ ПОТЕРЬ БЮДЖЕТА:
${lossPoints}

СЦЕНАРИИ РОСТА:
${scenarios}

ЧТО СДЕЛАТЬ В ПЕРВУЮ ОЧЕРЕДЬ:
${priorityActions}

${audit.alternativePlan ? `АЛЬТЕРНАТИВА МАСШТАБУ:\n- ${audit.alternativePlan}\n` : ''}

ОЦЕНКА РИСКА:
- ${audit.risk}: ${audit.riskReason || '—'}

Сформировано в KPI Guard
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      showToast('Скопировано ✅');
    }).catch(() => {
      showToast('Не удалось скопировать ❌');
    });
  };

  const downloadHtmlReport = () => {
    if (!audit) return;
    const profit = metrics.revenue - inputs.budget;
    const dateStr = new Date().toLocaleString();

    const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>KPI Guard Report - ${dateStr}</title>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: #ffffff; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #0b0f19; text-transform: uppercase; }
        h2 { font-size: 14px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.1em; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .metric { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
        .metric-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .metric-value { font-size: 20px; font-weight: 800; color: #0f172a; }
        .score-box { display: flex; align-items: center; gap: 24px; margin-bottom: 16px; }
        .score-circle { width: 64px; height: 64px; border-radius: 50%; background: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; }
        .list-item { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .list-item:last-child { border-bottom: none; }
        .bold { font-weight: 700; color: #0b0f19; }
        .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .risk-Высокий { background: #fee2e2; color: #ef4444; }
        .risk-Средний { background: #ffedd5; color: #f59e0b; }
        .risk-Низкий { background: #dcfce7; color: #10b981; }
        footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>KPI Guard</h1>
        <p style="color: #64748b; margin-bottom: 32px;">Аналитический отчет от ${dateStr}</p>

        <div class="card">
            <h2>Входные данные</h2>
            <div class="grid">
                <div class="metric"><div class="metric-label">Бюджет</div><div class="metric-value">${inputs.budget.toLocaleString()} ${currencySymbol}</div></div>
                <div class="metric"><div class="metric-label">Средний чек</div><div class="metric-value">${inputs.avgCheck.toLocaleString()} ${currencySymbol}</div></div>
                <div class="metric"><div class="metric-label">Лиды</div><div class="metric-value">${inputs.leads}</div></div>
                <div class="metric"><div class="metric-label">Продажи</div><div class="metric-value">${inputs.sales}</div></div>
            </div>
        </div>

        <div class="card">
            <h2>KPI показатели</h2>
            <div class="grid">
                <div class="metric"><div class="metric-label">CPL</div><div class="metric-value">${metrics.cpl.toFixed(0)} ${currencySymbol}</div></div>
                <div class="metric"><div class="metric-label">CPA</div><div class="metric-value">${metrics.cpa.toFixed(0)} ${currencySymbol}</div></div>
                <div class="metric"><div class="metric-label">ROI</div><div class="metric-value">${metrics.roi.toFixed(0)}%</div></div>
                <div class="metric"><div class="metric-label">Конверсия</div><div class="metric-value">${metrics.cr.toFixed(1)}%</div></div>
                <div class="metric"><div class="metric-label">Выручка</div><div class="metric-value">${metrics.revenue.toLocaleString()} ${currencySymbol}</div></div>
                <div class="metric"><div class="metric-label">Прибыль</div><div class="metric-value">${profit.toLocaleString()} ${currencySymbol}</div></div>
            </div>
        </div>

        <div class="card">
            <h2>Предельные значения</h2>
            <div class="grid">
                <div class="metric"><div class="metric-label">Предел CPL</div><div class="metric-value">${metrics.beCpl.toFixed(0)} ${currencySymbol}</div></div>
                <div class="metric"><div class="metric-label">Предел CPA</div><div class="metric-value">${metrics.beCpa.toFixed(0)} ${currencySymbol}</div></div>
            </div>
        </div>

        <div class="card">
            <h2>Оценка кампании</h2>
            <div class="score-box">
                <div class="score-circle">${audit.scores.total}</div>
                <div>
                    <div class="risk-badge risk-${audit.risk}">Риск: ${audit.risk}</div>
                    <div style="margin-top: 8px; font-weight: 500;">${audit.scores.interpretation}</div>
                </div>
            </div>
            <div class="grid" style="margin-top: 24px;">
                <div class="metric"><div class="metric-label">Экономика</div><div class="metric-value">${audit.scores.economy}/10</div></div>
                <div class="metric"><div class="metric-label">Воронка</div><div class="metric-value">${audit.scores.funnel}/10</div></div>
                <div class="metric"><div class="metric-label">Масштаб</div><div class="metric-value">${audit.scores.scale}/10</div></div>
            </div>
        </div>

        <div class="card">
            <h2>Точки потерь бюджета</h2>
            ${audit.lossPoints.length > 0 ? audit.lossPoints.map(lp => `
                <div class="list-item">
                    <div class="bold">${lp.label}</div>
                    <div style="color: #ef4444; font-size: 14px; margin-top: 4px;">Потеря: -${lp.lossValue.toLocaleString()} ${currencySymbol} (${lp.diff})</div>
                </div>
            `).join('') : '<p>— нет данных</p>'}
        </div>

        <div class="card">
            <h2>Сценарии роста</h2>
            ${audit.scenarios.length > 0 ? audit.scenarios.map(s => `
                <div class="list-item">
                    <div class="bold" style="color: #4f46e5;">${s.title}</div>
                    <div style="margin-top: 8px; font-size: 14px;">Ожидаемая прибыль: ${s.profit.toLocaleString()} ${currencySymbol} | Новый ROI: ${s.roi}%</div>
                    <div style="margin-top: 4px; color: #64748b; font-size: 13px;">${s.comment}</div>
                </div>
            `).join('') : '<p>— нет данных</p>'}
        </div>

        <div class="card">
            <h2>План действий (Roadmap)</h2>
            ${audit.priorityActions.length > 0 ? audit.priorityActions.map((pa, i) => `
                <div class="list-item">
                    <div class="bold">${i+1}. ${pa.title}</div>
                    <div style="margin-top: 8px; font-size: 14px;"><span class="bold">Действие:</span> ${pa.action}</div>
                    <div style="margin-top: 4px; font-size: 13px; color: #64748b;"><span class="bold">Почему сейчас:</span> ${pa.whyNow}</div>
                    <div style="margin-top: 4px; font-size: 13px; color: #ef4444;"><span class="bold">Риск бездействия:</span> ${pa.ifNotDone}</div>
                    <div style="margin-top: 4px; font-size: 13px; color: #10b981;"><span class="bold">Контрольный KPI:</span> ${pa.controlKpi}</div>
                </div>
            `).join('') : '<p>— нет данных</p>'}
        </div>

        ${audit.alternativePlan ? `
        <div class="card">
            <h2>Альтернатива масштабу</h2>
            <p style="font-weight: 500;">${audit.alternativePlan}</p>
        </div>
        ` : ''}

        <footer>
            Сформировано в KPI Guard — Профессиональный инструмент анализа маркетинга
        </footer>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpi-guard-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Отчёт скачан ✅');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-['Inter'] antialiased pb-12 overflow-x-hidden">
      <Toast message={toast.message} visible={toast.visible} />
      
      <nav className="sticky top-0 z-20 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-auto sm:h-18 flex flex-col sm:flex-row items-center justify-between py-3 sm:py-4 gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              KPI Guard
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['KZT', 'USD'] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all min-h-[32px] sm:min-h-[auto] ${
                    currency === code ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <button 
              onClick={resetData}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-slate-700 active:scale-95 transition-all min-h-[40px] sm:min-h-[44px]"
            >
              <RotateCcw size={14} className="sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Сбросить</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-[#161e2e] p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <LayoutDashboard size={18} className="text-indigo-500" />
                <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Ввод данных</h2>
              </div>
              <div className="space-y-5 sm:space-y-6">
                <InputGroup label="Бюджет" value={inputs.budget} onChange={(v) => setInputs(p => ({...p, budget: v}))} icon={<Wallet />} currencySymbol={currencySymbol} />
                <InputGroup label="Лиды" value={inputs.leads} onChange={(v) => setInputs(p => ({...p, leads: v}))} icon={<Users />} error={errors.leads} hint={errors.leads ? "Нужны лиды" : undefined} currencySymbol={currencySymbol} />
                <InputGroup label="Продажи" value={inputs.sales} onChange={(v) => setInputs(p => ({...p, sales: v}))} icon={<Target />} error={errors.sales} hint={errors.sales ? "Ошибка" : undefined} currencySymbol={currencySymbol} />
                <InputGroup label="Средний чек" value={inputs.avgCheck} onChange={(v) => setInputs(p => ({...p, avgCheck: v}))} icon={<DollarSign />} currencySymbol={currencySymbol} />
              </div>
            </div>
            <div className="bg-[#161e2e] p-5 sm:p-6 rounded-3xl border border-slate-800">
              <h3 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Срез воронки</h3>
              <div className="space-y-6 sm:space-y-8">
                <FunnelBar label="Бюджет" value={inputs.budget} total={inputs.budget || 1} color="bg-slate-700" currencySymbol={currencySymbol} />
                <FunnelBar label="Выручка" value={metrics.revenue} total={Math.max(inputs.budget, metrics.revenue) || 1} color="bg-indigo-500" currencySymbol={currencySymbol} />
                <FunnelBar label="Прибыль" value={Math.max(0, metrics.revenue - inputs.budget)} total={Math.max(inputs.budget, metrics.revenue) || 1} color="bg-emerald-500" currencySymbol={currencySymbol} />
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              <MetricCard label="CPL (Цена лида)" value={metrics.cpl.toFixed(0)} currencySymbol={currencySymbol} icon={<Users />} badge={getBadgeType('CPL')?.type} badgeText={getBadgeType('CPL')?.text} />
              <MetricCard label="CPA (Цена продажи)" value={metrics.cpa.toFixed(0)} currencySymbol={currencySymbol} icon={<Target />} badge={getBadgeType('CPA')?.type} badgeText={getBadgeType('CPA')?.text} />
              <MetricCard label="Выручка" value={metrics.revenue} currencySymbol={currencySymbol} icon={<DollarSign />} />
              <MetricCard label="ROI (Окупаемость)" value={metrics.roi.toFixed(0)} isPercent icon={<TrendingUp />} badge={getBadgeType('ROI')?.type} badgeText={getBadgeType('ROI')?.text} />
              <MetricCard label="Предел CPL" value={metrics.beCpl.toFixed(0)} currencySymbol={currencySymbol} icon={<Zap />} subLabel="Максимум для 0" />
              <MetricCard label="Предел CPA" value={metrics.beCpa.toFixed(0)} currencySymbol={currencySymbol} icon={<AlertCircle />} subLabel="Максимум для 0" />
            </div>

            <div className="bg-[#161e2e] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <ShieldCheck size={20} className="text-indigo-400 flex-shrink-0" />
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest leading-tight">Профессиональный аудит</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button 
                    disabled={!isFormValid || isGenerating} 
                    onClick={generateAudit} 
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-4 sm:py-3 bg-indigo-600 text-white rounded-2xl text-[10px] sm:text-xs font-black disabled:opacity-20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                    <span className="whitespace-nowrap uppercase tracking-widest">Анализировать</span>
                  </button>
                  {audit && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={copyReportToClipboard} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center min-w-[48px] min-h-[48px]" title="Копировать отчет">
                        <Copy size={18}/>
                      </button>
                      <button onClick={downloadHtmlReport} className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[48px]">
                        <Download size={18}/>
                        <span>Скачать HTML</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 sm:p-8">
                {!audit ? (
                  <div className="text-center py-12 sm:py-20 px-4">
                    <AlertCircle className="text-slate-700 mx-auto mb-6 sm:w-10 sm:h-10" size={32} />
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">Введите показатели кампании для получения глубокого анализа точек роста и рисков.</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                      <div className="p-5 sm:p-6 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Общая оценка</span>
                        <div className="text-3xl sm:text-4xl font-black text-indigo-400 mb-1">{audit.scores.total}</div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase">из 10</span>
                      </div>
                      <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['Экономика', 'Воронка', 'Масштаб'].map((s, idx) => (
                          <div key={s} className="p-3 sm:p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 flex sm:flex-col justify-between items-center sm:items-start">
                            <div className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500 sm:mb-1 tracking-widest">{s}</div>
                            <div className="text-sm sm:text-lg font-bold text-white tracking-tight">{[audit.scores.economy, audit.scores.funnel, audit.scores.scale][idx]} / 10</div>
                          </div>
                        ))}
                        <div className="sm:col-span-3 text-[10px] sm:text-[11px] font-medium text-slate-400 italic px-1 pt-1 break-words">
                          «{audit.scores.interpretation}»
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-[#0b0f19] p-6 rounded-3xl border border-slate-800">
                          <h4 className="text-[10px] sm:text-[11px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <XCircle size={14} className="flex-shrink-0" /> Точки потерь
                          </h4>
                          <div className="space-y-3">
                            {audit.lossPoints.length > 0 ? audit.lossPoints.map((lp, i) => (
                              <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                <div className="text-[11px] sm:text-xs font-bold text-slate-200">{lp.label}</div>
                                <div className="text-[11px] sm:text-xs font-black text-rose-500 whitespace-nowrap">-{lp.lossValue.toLocaleString()} {currencySymbol}</div>
                              </div>
                            )) : (
                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
                                <span className="text-[10px] sm:text-xs font-bold text-emerald-500">Потерь не обнаружено</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Выводы</h4>
                          <ul className="space-y-3">
                            {audit.insights.map((text, i) => (
                              <li key={i} className="flex gap-3 items-start text-slate-300">
                                <ChevronRight className="mt-1 text-indigo-500 flex-shrink-0" size={14} />
                                <span className="text-[11px] sm:text-sm leading-relaxed">{text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-[#0b0f19] p-6 rounded-3xl border border-slate-800">
                          <h4 className="text-[10px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Приоритетные действия</h4>
                          <div className="space-y-6">
                            {audit.priorityActions.map((item, i) => (
                              <div key={i} className="space-y-2">
                                <div className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">{item.title}</div>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-300">{item.action}</p>
                                <div className="pl-4 border-l-2 border-indigo-500/30 space-y-1 mt-2">
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium italic"><span className="text-indigo-400 font-bold uppercase">Зачем:</span> {item.whyNow}</p>
                                    <p className="text-[9px] sm:text-[10px] text-rose-500/70 font-medium italic"><span className="font-bold uppercase">Риск:</span> {item.ifNotDone}</p>
                                    <p className="text-[9px] sm:text-[10px] text-emerald-400/70 font-medium italic"><span className="font-bold uppercase">Контроль:</span> {item.controlKpi}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-10 text-center border-t border-slate-800/50 mt-8">
        <p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-relaxed">
          KPI Guard PRO &bull; Профессиональный инструмент анализа маркетинга
        </p>
      </footer>
    </div>
  );
}
