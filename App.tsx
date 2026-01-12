
import React, { useState, useMemo, useEffect } from 'react';
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
  TrendingDown
} from 'lucide-react';
import { KpiInputs, KpiMetrics, CurrencyCode, AuditResult } from './types';

// --- UI Components ---

const MetricCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subLabel?: string;
  icon: React.ReactNode; 
  currencySymbol: string;
  isPercent?: boolean;
}> = ({ label, value, subLabel, icon, currencySymbol, isPercent }) => (
  <div className="bg-[#161e2e] p-5 rounded-2xl border border-slate-800 shadow-xl transition-all hover:border-indigo-500/30 group">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-sm font-semibold text-slate-500">{isPercent ? '%' : currencySymbol}</span>
    </div>
    {subLabel && <div className="text-[10px] mt-2 text-slate-500 font-medium uppercase tracking-tight">{subLabel}</div>}
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
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[10px] font-bold text-slate-600 border-l border-slate-800 pl-2">{currencySymbol}</span>
      </div>
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        placeholder="0"
        className={`w-full pl-16 pr-4 py-3 bg-[#0b0f19] border rounded-xl text-sm text-white placeholder:text-slate-700 focus:ring-2 outline-none transition-all ${
          error ? 'border-rose-500/50 ring-rose-500/10' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500/50'
        }`}
      />
    </div>
    {hint && <p className="text-[10px] text-rose-400 ml-1 font-medium">{hint}</p>}
  </div>
);

const FunnelBar: React.FC<{ label: string; value: number; total: number; color: string; currencySymbol: string }> = ({ label, value, total, color, currencySymbol }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-slate-300">{value.toLocaleString()} {currencySymbol} ({percentage.toFixed(0)}%)</span>
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

  const fillDemo = () => {
    setInputs({ 
      budget: currency === 'KZT' ? 300000 : 1000, 
      leads: 120, 
      sales: 12, 
      avgCheck: currency === 'KZT' ? 45000 : 150 
    });
  };

  const generateAudit = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const { roi, cpa, beCpa, cr, cpl, beCpl } = metrics;
      const res: AuditResult = { risk: 'Низкий', insights: [], priorityActions: [] };

      // Risk Logic
      if (roi < 0 || cpa > beCpa * 0.95) res.risk = 'Высокий';
      else if (roi < 60 || cpa > beCpa * 0.6) res.risk = 'Средний';

      // Insights (5-7 bullets)
      res.insights.push(`Текущая конверсия из лида в продажу составляет ${cr.toFixed(2)}%.`);
      
      if (cpa > beCpa) {
        res.insights.push(`Стоимость продажи (${cpa.toFixed(0)} ${currencySymbol}) выше среднего чека. Вы работаете в убыток.`);
      } else if (cpa > beCpa * 0.7) {
        res.insights.push(`Экономика на грани: CPA поглощает ${((cpa/beCpa)*100).toFixed(0)}% маржи.`);
      } else {
        res.insights.push(`Экономика устойчива: CPA составляет всего ${((cpa/beCpa)*100).toFixed(0)}% от чека.`);
      }

      if (cr < 5) res.insights.push("Конверсия в продажу ниже 5%. Проверьте качество лидов или работу отдела продаж.");
      if (cpl > beCpl) res.insights.push(`Лиды обходятся слишком дорого. Ваш предел CPL — ${beCpl.toFixed(0)} ${currencySymbol}.`);
      
      res.insights.push(`Чистый возврат инвестиций (ROI) — ${roi.toFixed(0)}%.`);
      res.insights.push(`Рекламный бюджет в ${inputs.budget.toLocaleString()} ${currencySymbol} принес ${inputs.sales} продаж.`);
      res.insights.push(`При текущей конверсии, чтобы выйти в ноль, CPL не должен превышать ${beCpl.toFixed(0)} ${currencySymbol}.`);

      // Priority Actions (3 items)
      if (cpa > beCpa) {
        res.priorityActions.push("СРОЧНО: Снизьте рекламный бюджет или пересмотрите воронку — текущая модель убыточна.");
      } else if (cr < 10) {
        res.priorityActions.push("ПРИОРИТЕТ: Повысьте конверсию из лида в продажу через скрипты или квалификацию.");
      } else {
        res.priorityActions.push("МАСШТАБ: При текущих показателях можно увеличивать бюджет на 20-30%.");
      }

      if (cpl > beCpl * 0.8) {
        res.priorityActions.push("ОПТИМИЗАЦИЯ: Протестируйте новые креативы, чтобы снизить CPL хотя бы на 15%.");
      } else {
        res.priorityActions.push("LTV: Работайте над повторными продажами, чтобы увеличить прибыль без доп. затрат.");
      }
      
      res.priorityActions.push("АНАЛИТИКА: Проверьте расхождения данных между рекламным кабинетом и CRM.");

      setAudit(res);
      setIsGenerating(false);
    }, 1000);
  };

  const isFormValid = inputs.budget > 0 && inputs.leads > 0 && inputs.avgCheck > 0 && inputs.sales >= 0 && inputs.sales <= inputs.leads;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-['Inter'] antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              KPI Guard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['KZT', 'USD'] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                    currency === code ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <button 
              onClick={fillDemo}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              Демо-данные
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Inputs */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                <LayoutDashboard size={18} />
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Ввод данных</h2>
            </div>
            <div className="space-y-6">
              <InputGroup 
                label="Рекламный бюджет" 
                value={inputs.budget} 
                onChange={(v) => setInputs(p => ({...p, budget: v}))}
                icon={<Wallet size={16} />}
                currencySymbol={currencySymbol}
              />
              <InputGroup 
                label="Лиды (Заявки)" 
                value={inputs.leads} 
                onChange={(v) => setInputs(p => ({...p, leads: v}))}
                icon={<Users size={16} />}
                error={errors.leads}
                hint={errors.leads ? "Нужны лиды при наличии бюджета" : undefined}
                currencySymbol={currencySymbol}
              />
              <InputGroup 
                label="Продажи" 
                value={inputs.sales} 
                onChange={(v) => setInputs(p => ({...p, sales: v}))}
                icon={<Target size={16} />}
                error={errors.sales}
                hint={errors.sales ? "Не может быть больше лидов" : undefined}
                currencySymbol={currencySymbol}
              />
              <InputGroup 
                label="Средний чек" 
                value={inputs.avgCheck} 
                onChange={(v) => setInputs(p => ({...p, avgCheck: v}))}
                icon={<DollarSign size={16} />}
                currencySymbol={currencySymbol}
              />
            </div>
          </div>

          <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800 shadow-2xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Срез воронки</h3>
            <div className="space-y-8">
              <FunnelBar label="Бюджет" value={inputs.budget} total={inputs.budget || 1} color="bg-slate-700" currencySymbol={currencySymbol} />
              <FunnelBar label="Выручка" value={metrics.revenue} total={Math.max(inputs.budget, metrics.revenue) || 1} color="bg-indigo-500" currencySymbol={currencySymbol} />
              <FunnelBar label="Прибыль" value={Math.max(0, metrics.revenue - inputs.budget)} total={Math.max(inputs.budget, metrics.revenue) || 1} color="bg-emerald-500" currencySymbol={currencySymbol} />
            </div>
          </div>
        </aside>

        {/* Right Side: Dashboard */}
        <section className="lg:col-span-9 space-y-8">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <MetricCard label="CPL (Цена лида)" value={metrics.cpl.toFixed(0)} currencySymbol={currencySymbol} icon={<Users size={20}/>} />
            <MetricCard label="CPA (Цена продажи)" value={metrics.cpa.toFixed(0)} currencySymbol={currencySymbol} icon={<Target size={20}/>} />
            <MetricCard label="Выручка" value={metrics.revenue} currencySymbol={currencySymbol} icon={<DollarSign size={20}/>} />
            <MetricCard 
              label="ROI (Окупаемость)" 
              value={metrics.roi.toFixed(0)} 
              isPercent 
              icon={metrics.roi >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>} 
              currencySymbol={currencySymbol}
            />
            <MetricCard 
              label="Предел CPL" 
              value={metrics.beCpl.toFixed(0)} 
              currencySymbol={currencySymbol} 
              icon={<Zap size={20}/>} 
              subLabel="Максимум для 0"
            />
            <MetricCard 
              label="Предел CPA" 
              value={metrics.beCpa.toFixed(0)} 
              currencySymbol={currencySymbol} 
              icon={<AlertCircle size={20}/>} 
              subLabel="Максимум для 0"
            />
          </div>

          {/* Report Section */}
          <div className="bg-[#161e2e] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Аудит кампании</h3>
              </div>
              <button
                disabled={!isFormValid || isGenerating}
                onClick={generateAudit}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black disabled:opacity-20 disabled:cursor-not-allowed hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
              >
                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                Сформировать отчёт
              </button>
            </div>

            <div className="p-8">
              {!audit ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
                    <AlertCircle className="text-slate-700" size={40} />
                  </div>
                  <p className="text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                    Заполните данные о бюджете, лидах и продажах слева, чтобы сформировать автоматический аудит эффективности.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Insights Column */}
                  <div className="md:col-span-7 space-y-8">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Уровень риска</span>
                      <span className={`px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                        audit.risk === 'Высокий' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        audit.risk === 'Средний' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {audit.risk}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Ключевые выводы</h4>
                      <ul className="space-y-5">
                        {audit.insights.map((text, i) => (
                          <li key={i} className="flex gap-4 items-start text-slate-300 group">
                            <div className="mt-2 h-2 w-2 rounded-full bg-indigo-500/40 border border-indigo-500/20 group-hover:bg-indigo-500 transition-colors flex-shrink-0" />
                            <span className="text-sm leading-relaxed font-medium">{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="md:col-span-5">
                    <div className="bg-[#0b0f19] rounded-3xl p-8 border border-slate-800 shadow-inner">
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">Что сделать сначала</h4>
                      <div className="space-y-6">
                        {audit.priorityActions.map((action, i) => (
                          <div key={i} className="flex gap-5 group">
                            <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-[12px] font-black text-indigo-400 shadow-md border border-slate-800 group-hover:scale-110 group-hover:border-indigo-500/50 transition-all flex-shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-xs font-bold text-slate-200 pt-1.5 leading-relaxed">
                              {action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-16 text-center border-t border-slate-800/50 mt-10">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
          KPI Guard Dashboard &bull; Все расчеты защищены и выполняются локально
        </p>
      </footer>
    </div>
  );
}
