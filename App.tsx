import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  AlertCircle, 
  Zap,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  RefreshCw,
  Wallet,
  TrendingDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { KpiInputs, KpiMetrics, CurrencyCode, AuditResult } from './types';

// --- UI Components ---

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
  currencySymbol: string;
  isPercent?: boolean;
  badge?: 'good' | 'neutral' | 'bad';
  badgeText?: string;
}> = ({ label, value, subLabel, icon, currencySymbol, isPercent, badge, badgeText }) => (
  <div className="bg-[#161e2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl transition-all hover:border-indigo-500/30 group w-full max-w-full overflow-hidden break-words">
    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <div className="p-2 sm:p-2.5 bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors flex-shrink-0">
          {React.cloneElement(icon as React.ReactElement, { size: 18, className: 'sm:w-5 sm:h-5' })}
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
        {React.cloneElement(icon as React.ReactElement, { size: 14 })}
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

  const resetData = () => {
    setInputs({ 
      budget: 0, 
      leads: 0, 
      sales: 0, 
      avgCheck: 0 
    });
    setAudit(null);
  };

  const generateAudit = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const { roi, cpa, beCpa, cr, cpl, beCpl, revenue } = metrics;
      const budget = inputs.budget;
      const avgCheck = inputs.avgCheck;
      
      const res: AuditResult = {
        risk: 'Низкий',
        insights: [],
        priorityActions: [],
        lossPoints: [],
        scenarios: [],
        scores: { total: 0, economy: 0, funnel: 0, scale: 0, interpretation: "" }
      };

      if (roi < 0 || cpa > beCpa * 0.95) res.risk = 'Высокий';
      else if (roi < 80 || cpa > beCpa * 0.6) res.risk = 'Средний';

      res.insights.push(`Конверсия ${cr.toFixed(1)}% требует внимания при масштабировании.`);
      res.insights.push(`ROI ${roi.toFixed(0)}% показывает ${roi > 0 ? 'прибыльность' : 'убыточность'} текущей модели.`);
      res.insights.push(`Точка безубыточности (BE CPL) находится на уровне ${beCpl.toFixed(0)} ${currencySymbol}.`);

      if (cpl > beCpl) {
        const loss = (cpl - beCpl) * inputs.leads;
        res.lossPoints.push({ label: 'CPL выше точки безубыточности', diff: `${(((cpl/beCpl)-1)*100).toFixed(0)}%`, lossValue: loss, isCritical: true });
      }
      if (cpa > avgCheck * 0.3) {
        res.lossPoints.push({ label: 'CPA превышает безопасный порог (30% чека)', diff: `${((cpa/avgCheck)*100).toFixed(0)}%`, lossValue: 0, isCritical: cpa > avgCheck * 0.5 });
      }
      if (roi < 100) {
        const potentialProfit = budget * 2 - revenue;
        res.lossPoints.push({ label: 'ROI ниже целевого (200%)', diff: `${(100 - roi).toFixed(0)}%`, lossValue: potentialProfit > 0 ? potentialProfit : 0, isCritical: roi < 0 });
      }

      const s1Budget = budget * 1.2;
      const s1Sales = s1Budget / (cpa || 1);
      const s1Rev = s1Sales * avgCheck;
      res.scenarios.push({
        title: 'Увеличение бюджета на +20%',
        profit: s1Rev - s1Budget,
        roi: s1Budget > 0 ? ((s1Rev - s1Budget) / s1Budget) * 100 : 0,
        comment: 'При сохранении текущей цены продажи (CPA).'
      });
      const s2Cr = cr + 5;
      const s2Sales = inputs.leads * (s2Cr / 100);
      const s2Rev = s2Sales * avgCheck;
      res.scenarios.push({
        title: 'Улучшение конверсии на +5%',
        profit: s2Rev - budget,
        roi: budget > 0 ? ((s2Rev - budget) / budget) * 100 : 0,
        comment: 'Критический рычаг для снижения CPA.'
      });
      const s3Cpl = cpl * 0.9;
      const s3Leads = budget / (s3Cpl || 1);
      const s3Sales = s3Leads * (cr / 100);
      const s3Rev = s3Sales * avgCheck;
      res.scenarios.push({
        title: 'Снижение CPL на -10%',
        profit: s3Rev - budget,
        roi: budget > 0 ? ((s3Rev - budget) / budget) * 100 : 0,
        comment: 'Оптимизация креативов и таргета.'
      });

      const ecoScore = Math.min(10, Math.max(1, (roi / 200) * 10));
      const funScore = Math.min(10, Math.max(1, (cr / 15) * 10));
      const scaleScore = Math.min(10, Math.max(1, (1 - (cpl / (beCpl || 1))) * 10 + 5));
      res.scores = {
        economy: Number(ecoScore.toFixed(1)),
        funnel: Number(funScore.toFixed(1)),
        scale: Number(scaleScore.toFixed(1)),
        total: Number(((ecoScore + funScore + scaleScore) / 3).toFixed(1)),
        interpretation: roi > 150 && cr > 8 ? "Кампания устойчива и готова к масштабированию." : "Требуется оптимизация воронки перед ростом бюджета."
      };

      if (cpa > beCpa) {
        res.priorityActions.push({ title: "СНИЗИТЬ CPA", action: "Оптимизируйте воронку или снижайте CPL", why: `Текущая модель сжигает ${Math.abs(revenue - budget).toLocaleString()} ${currencySymbol} ежемесячно.` });
      } else if (cr < 10) {
        res.priorityActions.push({ title: "УСИЛИТЬ КОНВЕРСИЮ", action: "Внедрите квалификацию лидов и скрипты", why: "Рост CR на 2% даст существенный рывок в прибыли без вложений." });
      }
      if (roi > 150) {
        res.priorityActions.push({ title: "МАСШТАБИРОВАТЬ", action: "Увеличьте бюджет на 20-30%", why: "Запас прочности позволяет агрессивно захватывать рынок." });
      } else {
        res.priorityActions.push({ title: "ТЕСТ КРЕАТИВОВ", action: "Запустите 5 новых гипотез в неделю", why: `Снижение CPL на 15% выведет ROI на уровень ${(roi * 1.15).toFixed(0)}%.` });
      }
      res.priorityActions.push({ title: "РАБОТА С LTV", action: "Запустите email-маркетинг по базе", why: "Повторные продажи увеличат ROI без дополнительных затрат на трафик." });

      setAudit(res);
      setIsGenerating(false);
    }, 1200);
  };

  const isFormValid = inputs.budget > 0 && inputs.leads > 0 && inputs.avgCheck > 0 && inputs.sales >= 0 && inputs.sales <= inputs.leads;

  const getBadgeType = (key: string): { type: 'good' | 'neutral' | 'bad', text: string } | undefined => {
    if (key === 'CPL') return metrics.cpl > metrics.beCpl ? { type: 'bad', text: 'РИСК' } : metrics.cpl > metrics.beCpl * 0.7 ? { type: 'neutral', text: 'НОРМА' } : { type: 'good', text: 'ХОРОШО' };
    if (key === 'CPA') return metrics.cpa > inputs.avgCheck * 0.5 ? { type: 'bad', text: 'РИСК' } : metrics.cpa > inputs.avgCheck * 0.25 ? { type: 'neutral', text: 'НОРМА' } : { type: 'good', text: 'ХОРОШО' };
    if (key === 'ROI') return metrics.roi < 100 ? { type: 'bad', text: 'РИСК' } : metrics.roi < 250 ? { type: 'neutral', text: 'НОРМА' } : { type: 'good', text: 'ХОРОШО' };
    return undefined;
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-['Inter'] antialiased pb-12 overflow-x-hidden">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
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
              <button 
                disabled={!isFormValid || isGenerating} 
                onClick={generateAudit} 
                className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-3 bg-indigo-600 text-white rounded-2xl text-[10px] sm:text-xs font-black disabled:opacity-20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 min-h-[48px]"
              >
                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                <span className="whitespace-nowrap uppercase tracking-widest">Анализировать</span>
              </button>
            </div>

            <div className="p-5 sm:p-8">
              {!audit ? (
                <div className="text-center py-12 sm:py-20 px-4">
                  <AlertCircle className="text-slate-700 mx-auto mb-6 sm:w-10 sm:h-10" size={32} />
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">Введите показатели кампании для получения глубокого анализа точек роста и рисков.</p>
                </div>
              ) : (
                <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="lg:col-span-7 space-y-8 sm:space-y-10">
                      <div>
                        <h4 className="text-[10px] sm:text-[11px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
                          <XCircle size={14} className="flex-shrink-0" /> Точки потерь бюджета
                        </h4>
                        <div className="space-y-3">
                          {audit.lossPoints.length > 0 ? audit.lossPoints.map((lp, i) => (
                            <div key={i} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${lp.isCritical ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-900/50 border-slate-800'}`}>
                              <div className="space-y-1 overflow-hidden">
                                <div className="text-[11px] sm:text-xs font-bold text-slate-200 break-words">{lp.label}</div>
                                <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Отклонение: <span className="text-rose-400 font-bold">{lp.diff}</span></div>
                              </div>
                              {lp.lossValue > 0 && <div className="text-[11px] sm:text-xs font-black text-rose-500 whitespace-nowrap">-{lp.lossValue.toLocaleString()} {currencySymbol}</div>}
                            </div>
                          )) : (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                              <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
                              <span className="text-[10px] sm:text-xs font-bold text-emerald-500">Критических потерь не обнаружено</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Выводы маркетолога</h4>
                        <ul className="space-y-3 sm:space-y-4">
                          {audit.insights.map((text, i) => (
                            <li key={i} className="flex gap-3 sm:gap-4 items-start text-slate-300">
                              <ChevronRight className="mt-1 text-indigo-500 flex-shrink-0" size={14} />
                              <span className="text-[11px] sm:text-sm font-medium leading-relaxed break-words">{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8 sm:space-y-10">
                      <div>
                        <h4 className="text-[10px] sm:text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
                          <TrendingUp size={14} className="flex-shrink-0" /> Сценарии роста
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {audit.scenarios.map((s, i) => (
                            <div key={i} className="bg-slate-900/50 rounded-2xl p-4 sm:p-5 border border-slate-800 hover:border-indigo-500/30 transition-all">
                              <div className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase mb-2 leading-tight break-words">{s.title}</div>
                              <div className="flex justify-between items-end mb-3 gap-2">
                                <div className="space-y-1 overflow-hidden">
                                  <div className="text-[9px] sm:text-xs text-slate-400">Ожидаемая прибыль</div>
                                  <div className="text-sm sm:text-lg font-black text-white truncate">{s.profit.toLocaleString()} {currencySymbol}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-[8px] sm:text-[10px] text-slate-500">Новый ROI</div>
                                  <div className="text-xs sm:text-sm font-bold text-emerald-400">{s.roi.toFixed(0)}%</div>
                                </div>
                              </div>
                              <div className="text-[8px] sm:text-[9px] text-slate-500 font-medium leading-tight border-t border-slate-800 pt-3 break-words">{s.comment}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#0b0f19] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-inner">
                        <h4 className="text-[10px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 sm:mb-8">Что сделать в первую очередь</h4>
                        <div className="space-y-6 sm:space-y-8">
                          {audit.priorityActions.map((item, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex gap-3 items-center mb-1">
                                <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/20 flex-shrink-0">{i + 1}</div>
                                <div className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider break-words leading-tight">{item.title}</div>
                              </div>
                              <p className="text-[11px] sm:text-xs font-bold text-slate-300 pl-9 leading-relaxed break-words">{item.action}</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium italic pl-9 break-words leading-snug">— {item.why}</p>
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
      </main>
      <footer className="max-w-7xl mx-auto px-6 py-10 text-center border-t border-slate-800/50 mt-8">
        <p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-relaxed">
          KPI Guard PRO &bull; Профессиональный инструмент анализа юнит-экономики
        </p>
      </footer>
    </div>
  );
}
