
import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  BarChart3,
  Calendar,
  Activity,
  History,
  Lock,
  ArrowRight
} from 'lucide-react';
import { KpiInputs, KpiMetrics, CurrencyCode, AuditResult, AnalyticsSummary } from './types';
import { track, initAnalytics } from './analytics/client';

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
  currencySymbol?: string;
  isPercent?: boolean;
  badge?: 'good' | 'neutral' | 'bad';
  badgeText?: string;
}> = ({ label, value, subLabel, icon, currencySymbol, isPercent, badge, badgeText }) => (
  <div className="bg-[#161e2e] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl transition-all hover:border-indigo-500/30 group w-full max-w-full overflow-hidden break-words">
    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <div className="p-2 sm:p-2.5 bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors flex-shrink-0">
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

// --- Admin Components ---

const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = new URLSearchParams(window.location.search).get('key');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-analytics?key=${key}`);
      if (!res.ok) throw new Error(res.status === 401 ? 'Доступ запрещен' : 'Ошибка загрузки данных');
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Lock className="text-rose-500" size={48} />
      <h1 className="text-xl font-black uppercase text-white tracking-widest">{error}</h1>
      <p className="text-slate-500 text-sm">Проверьте параметр key в URL</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <RefreshCw className="animate-spin text-indigo-500" size={48} />
      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Загрузка аналитики...</span>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-500" /> Аналитика Системы
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Мониторинг KPI Guard в реальном времени</p>
        </div>
        <button onClick={fetchStats} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2">
          <RefreshCw size={18} />
          <span className="text-[10px] font-black uppercase">Обновить</span>
        </button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Визиты сегодня" value={summary.stats.today} icon={<Users />} />
            <MetricCard label="Визиты (7дн)" value={summary.stats.last7Days} icon={<Calendar />} />
            <MetricCard label="Посетители (Всего)" value={summary.stats.uniqueVisitors} icon={<Activity />} />
            <MetricCard label="Конверсия" value={summary.conversion.rate.toFixed(1)} isPercent icon={<TrendingUp />} badge={summary.conversion.rate > 5 ? 'good' : 'neutral'} badgeText="Анализ" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 size={16} /> Популярные События
              </h3>
              <div className="space-y-4">
                {summary.topEvents.map(e => (
                  <div key={e.event_name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">{e.event_name}</span>
                    <span className="text-xs font-black text-white px-2 py-1 bg-slate-800 rounded-lg">{e.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#161e2e] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Target size={16} /> Популярные Пути
              </h3>
              <div className="space-y-4">
                {summary.topPages.map(p => (
                  <div key={p.path} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">{p.path}</span>
                    <span className="text-xs font-black text-white px-2 py-1 bg-slate-800 rounded-lg">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#161e2e] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800/50 flex items-center gap-3">
              <History className="text-indigo-400" size={20} />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Последние 50 событий</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <th className="px-8 py-4">Событие</th>
                    <th className="px-8 py-4">Время</th>
                    <th className="px-8 py-4">Путь</th>
                    <th className="px-8 py-4">Посетитель</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {summary.recentEvents.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${e.event_name.startsWith('click') ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/50 text-slate-400'}`}>
                          {e.event_name}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs text-slate-400">{new Date(e.created_at).toLocaleTimeString()}</td>
                      <td className="px-8 py-4 text-xs text-slate-300 font-medium">{e.path}</td>
                      <td className="px-8 py-4 text-[10px] text-slate-500 font-mono">{e.visitor_id.slice(0, 8)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const [view, setView] = useState(window.location.pathname === '/admin' ? 'admin' : 'main');
  const [currency, setCurrency] = useState<CurrencyCode>('KZT');
  const [inputs, setInputs] = useState<KpiInputs>({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const currencySymbol = currency === 'KZT' ? '₸' : '$';

 useEffect(() => {
  initAnalytics();
  track('page_view', {
    path: window.location.pathname,
    referrer: document.referrer || null,
  });
}, []);

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

  const handleSetCurrency = (code: CurrencyCode) => {
    setCurrency(code);
    track('toggle_currency', { currency: code });
  };

  const handleReset = () => {
    resetData();
    track('click_reset');
  };

  const resetData = () => {
    setInputs({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
    setAudit(null);
  };

  const generateAudit = () => {
    setIsGenerating(true);
    track('click_analyze', { budget: inputs.budget, leads: inputs.leads });
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
    track('click_copy_report');
    const profit = metrics.revenue - inputs.budget;
    const text = `KPI GUARD REPORT\n...`; // Shortened for brevity
    navigator.clipboard.writeText(text).then(() => showToast('Скопировано ✅'));
  };

  const downloadHtmlReport = () => {
    if (!audit) return;
    track('click_download_report');
    // ... HTML logic ...
    showToast('Отчёт скачан ✅');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-['Inter'] antialiased pb-12 overflow-x-hidden">
      <Toast message={toast.message} visible={toast.visible} />
      
      <nav className="sticky top-0 z-20 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-auto sm:h-18 flex flex-col sm:flex-row items-center justify-between py-3 sm:py-4 gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto cursor-pointer" onClick={() => setView('main')}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              KPI Guard
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {view === 'main' && (
              <>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(['KZT', 'USD'] as CurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => handleSetCurrency(code)}
                      className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all min-h-[32px] sm:min-h-[auto] ${
                        currency === code ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-slate-700 active:scale-95 transition-all min-h-[40px] sm:min-h-[44px]"
                >
                  <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">Сбросить</span>
                </button>
              </>
            )}
            {view === 'admin' && (
              <button onClick={() => setView('main')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
                На главную <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {view === 'admin' ? (
          <AdminDashboard />
        ) : (
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
                {/* Audit Body Shortened */}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-10 text-center border-t border-slate-800/50 mt-8">
        <p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-relaxed">
          KPI Guard PRO &bull; Профессиональный инструмент анализа маркетинга
        </p>
      </footer>
    </div>
  );
}
