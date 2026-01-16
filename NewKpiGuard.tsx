
import { 
  TrendingUp, Users, Target, DollarSign, ShieldCheck, LayoutDashboard, Wallet, 
  CheckCircle2, RotateCcw, Check, Zap, XCircle, ArrowUpRight,
  RefreshCw, Copy, Download, AlertCircle, TrendingDown, Info
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { KpiInputs, KpiMetrics, CurrencyCode, AuditResult } from './types';
import { calculateMetrics, generateAuditReport } from './services/NewAuditEngine';

const FX_RATE = 500;

// --- UI Components ---

const Badge: React.FC<{ type: 'good' | 'neutral' | 'bad'; children: React.ReactNode }> = ({ type, children }) => {
  const styles = {
    good: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    neutral: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bad: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${styles[type]}`}>
      {children}
    </span>
  );
};

const MetricCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  currencySymbol?: string;
  isPercent?: boolean;
  status?: 'good' | 'neutral' | 'bad';
}> = ({ label, value, icon, currencySymbol, isPercent, status }) => (
  <div className={`bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border transition-all duration-300 ${
    status === 'bad' ? 'border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]' : 
    status === 'good' ? 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 
    'border-slate-800/60 hover:border-indigo-500/40'
  }`}>
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl ${
          status === 'bad' ? 'bg-rose-500/10 text-rose-400' : 
          status === 'good' ? 'bg-emerald-500/10 text-emerald-400' : 
          'bg-slate-800/50 text-slate-400'
        }`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
        </div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{label}</span>
      </div>
      {status && <Badge type={status}>{status === 'good' ? 'НОРМА' : status === 'bad' ? 'РИСК' : 'ВНИМАНИЕ'}</Badge>}
    </div>
    <div className="flex items-baseline gap-2 overflow-hidden whitespace-nowrap leading-none tracking-tight">
      <span className="text-3xl font-extrabold text-white truncate">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">{isPercent ? '%' : currencySymbol}</span>
    </div>
  </div>
);

const InputGroup: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon: React.ReactNode;
  currencySymbol: string;
  error?: boolean;
}> = ({ label, value, onChange, icon, currencySymbol, error }) => (
  <div className="space-y-2 w-full">
    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
        <span className="text-[10px] font-bold text-slate-600 border-l border-slate-800/80 pl-3">{currencySymbol}</span>
      </div>
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        placeholder="0"
        className={`w-full pl-20 pr-6 py-4 bg-[#0b0f19] border rounded-2xl text-sm text-white focus:ring-4 outline-none transition-all ${
          error ? 'border-rose-500/50 ring-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-800 focus:ring-indigo-500/10 focus:border-indigo-500/50'
        }`}
      />
    </div>
  </div>
);

// --- Main App ---

export default function NewKpiGuard() {
  const [currency, setCurrency] = useState<CurrencyCode>('KZT');
  const [inputs, setInputs] = useState<KpiInputs>({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const currencySymbol = currency === 'KZT' ? '₸' : '$';
  const metrics = useMemo(() => calculateMetrics(inputs), [inputs]);
  const canAnalyze = inputs.budget > 0 && inputs.leads > 0 && inputs.avgCheck > 0 && inputs.sales <= inputs.leads;

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleCurrencySwitch = (newCode: CurrencyCode) => {
    if (currency === newCode) return;
    const multiplier = newCode === 'USD' ? (1 / FX_RATE) : FX_RATE;
    setInputs(prev => ({
      ...prev,
      budget: Math.round(prev.budget * multiplier),
      avgCheck: Math.round(prev.avgCheck * multiplier)
    }));
    setCurrency(newCode);
    setAudit(null);
    showToast(`Валюта: ${newCode}`);
  };

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setIsGenerating(true);
    setAudit(null);
    setTimeout(() => {
      setAudit(generateAuditReport(inputs, metrics, currency));
      setIsGenerating(false);
      showToast('Анализ завершен');
    }, 1200);
  };

  const copyReport = () => {
    if (!audit) return;
    const dateStr = new Date().toLocaleString('ru-RU');
    const text = `
--------------------------------------------------
📋 KPI GUARD: АУДИТ МАРКЕТИНГОВОЙ ЭФФЕКТИВНОСТИ
--------------------------------------------------
Дата: ${dateStr}
Валюта: ${currency}

ДИСКЛЕЙМЕР: Все расчёты выполнены без учёта себестоимости и операционных расходов. 
Показатели отражают эффективность маркетинга, а не прибыль бизнеса.

1. ФАКТИЧЕСКИЕ ПОКАЗАТЕЛИ (GROSS):
   - Рекл. Бюджет: ${Math.round(inputs.budget).toLocaleString()} ${currencySymbol}
   - Выручка (Gross): ${Math.round(metrics.revenue).toLocaleString()} ${currencySymbol}
   - Маркетинговый вклад: ${Math.round(metrics.profit).toLocaleString()} ${currencySymbol}

2. МАРКЕТИНГОВЫЕ KPI:
   - ROI (Gross): ${metrics.roi.toFixed(1)}%
   - Конверсия (CR): ${metrics.cr.toFixed(1)}%
   - CPL (Факт): ${Math.round(metrics.cpl).toLocaleString()}
   - BE CPL (Marketing BE): ${Math.round(metrics.beCpl).toLocaleString()}

3. ВЕРДИКТ [ ${audit.scores.total}/8.5 ]:
   ${audit.scores.interpretation}

4. ${metrics.profit <= 0 ? 'ПЛАН ВОССТАНОВЛЕНИЯ' : 'ГИПОТЕЗЫ РОСТА'} (WHAT-IF):
   - ${audit.scenarios[0].title}: Вклад ${audit.scenarios[0].profit.toLocaleString()} (${audit.scenarios[0].badgeLabel})
   - ${audit.scenarios[1].title}: Вклад ${audit.scenarios[1].profit.toLocaleString()} (${audit.scenarios[1].badgeLabel})
   - ${audit.scenarios[2].title}: Вклад ${audit.scenarios[2].profit.toLocaleString()} (${audit.scenarios[2].badgeLabel})

--------------------------------------------------
Отчет сформирован автоматически в KPI Guard Professional.
    `.trim();
    navigator.clipboard.writeText(text);
    showToast('Отчет скопирован');
  };

  const downloadHtml = () => {
    if (!audit) return;
    const dateStr = new Date().toLocaleString('ru-RU');
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>KPI Guard — Marketing Audit Report</title>
    <style>
        :root { --bg: #0b0f19; --card: #161e2e; --accent: #6366f1; --text: #f8fafc; --muted: #94a3b8; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); padding: 40px; margin: 0; line-height: 1.5; }
        .report { max-width: 900px; margin: 0 auto; }
        .disclaimer { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 15px; border-radius: 12px; font-size: 11px; margin-bottom: 30px; text-transform: uppercase; font-weight: 800; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .summary-card { background: var(--card); padding: 24px; border-radius: 20px; border: 1px solid #334155; }
        .summary-card .label { font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 8px; }
        .summary-card .value { font-size: 24px; font-weight: 900; }
        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 24px; }
        .verdict { background: var(--card); padding: 30px; border-radius: 24px; border: 1px solid #334155; display: flex; align-items: center; gap: 30px; }
        .score-circle { width: 80px; height: 80px; border-radius: 50%; border: 4px solid var(--accent); display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; }
        .score-circle span { font-size: 32px; line-height: 1; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 10px; color: var(--muted); text-align: center; }
    </style>
</head>
<body>
    <div class="report">
        <div class="disclaimer">Все расчёты отражают маркетинговую эффективность (Gross). Не учитывается себестоимость продукции, налоги и операционные расходы.</div>
        <div class="header"><div class="logo">KPI Guard Marketing Analysis</div><div class="meta">Дата: ${dateStr}<br>Валюта: ${currency}</div></div>
        <div class="verdict">
            <div class="score-circle"><span>${audit.scores.total}</span><small>/8.5</small></div>
            <div><div style="font-size: 12px; text-transform: uppercase; font-weight: 800; color: var(--muted); margin-bottom: 4px;">Efficiency Verdict</div><div style="font-size: 20px; font-weight: 800;">${audit.scores.interpretation}</div></div>
        </div>
        <div class="section" style="margin-top: 40px;">
            <div class="section-title">Marketing Performance (Gross)</div>
            <div class="summary-grid">
                <div class="summary-card"><div class="label">ROI (Gross)</div><div class="value">${metrics.roi.toFixed(1)}%</div></div>
                <div class="summary-card"><div class="label">Contribution</div><div class="value">${Math.round(metrics.profit).toLocaleString()} ${currencySymbol}</div></div>
                <div class="summary-card"><div class="label">Revenue</div><div class="value">${Math.round(metrics.revenue).toLocaleString()} ${currencySymbol}</div></div>
                <div class="summary-card"><div class="label">Conversion</div><div class="value">${metrics.cr.toFixed(1)}%</div></div>
            </div>
        </div>
        <div class="footer">Professional Marketing Audit &copy; 2025 KPI Guard.</div>
    </div>
</body>
</html>
    `.trim();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-audit-report.html`;
    a.click();
    showToast('HTML отчет сохранен');
  };

  const getStatus = (type: 'CPL' | 'CPA' | 'ROI') => {
    if (type === 'CPL') {
      if (inputs.leads === 0) return undefined;
      return metrics.cpl <= metrics.beCpl ? 'good' : metrics.cpl <= metrics.beCpl * 1.15 ? 'neutral' : 'bad';
    }
    if (type === 'CPA') {
      if (inputs.sales === 0) return undefined;
      return metrics.cpa <= metrics.beCpa ? 'good' : metrics.cpa <= metrics.beCpa * 1.15 ? 'neutral' : 'bad';
    }
    if (type === 'ROI') {
      if (inputs.budget === 0) return undefined;
      return metrics.roi >= 50 ? 'good' : metrics.roi >= 0 ? 'neutral' : 'bad';
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500/30 pb-20">
      <div className={`fixed top-8 right-8 z-[100] transition-all duration-500 transform ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#1e293b]/90 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-black uppercase tracking-widest backdrop-blur-xl">
          <div className="p-1.5 bg-emerald-500/20 rounded-full"><Check size={14} strokeWidth={4} /></div>
          {toast.message}
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#0b0f19]/80 backdrop-blur-2xl border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-500/20"><ShieldCheck size={24} strokeWidth={2.5} /></div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white uppercase block leading-none">KPI Guard</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 block">Marketing Analysis</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60 backdrop-blur-md">
              {(['KZT', 'USD'] as CurrencyCode[]).map((code) => (
                <button key={code} onClick={() => handleCurrencySwitch(code)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 ${currency === code ? 'bg-slate-800 text-indigo-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{code}</button>
              ))}
            </div>
            <button onClick={() => { setInputs({ budget: 0, leads: 0, sales: 0, avgCheck: 0 }); setAudit(null); }} className="p-3.5 bg-slate-900/60 text-slate-400 border border-slate-800/60 rounded-2xl hover:text-white transition-all shadow-lg active:scale-95"><RotateCcw size={18} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-in">
          <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
          <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest leading-relaxed">
            Внимание: расчеты отражают маркетинговый вклад (Gross). Себестоимость (COGS) и налоги не учитываются.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3.5 mb-10"><LayoutDashboard size={20} className="text-indigo-400" /><h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Ввод данных</h2></div>
              <div className="space-y-8">
                <InputGroup label="Рекл. Бюджет" value={inputs.budget} onChange={(v) => setInputs(p => ({...p, budget: v}))} icon={<Wallet />} currencySymbol={currencySymbol} />
                <InputGroup label="Получено лидов" value={inputs.leads} onChange={(v) => setInputs(p => ({...p, leads: v}))} icon={<Users />} currencySymbol={currencySymbol} />
                <InputGroup label="Всего продаж" value={inputs.sales} onChange={(v) => setInputs(p => ({...p, sales: v}))} icon={<Target />} error={inputs.sales > inputs.leads} currencySymbol={currencySymbol} />
                <InputGroup label="Средний чек" value={inputs.avgCheck} onChange={(v) => setInputs(p => ({...p, avgCheck: v}))} icon={<DollarSign />} currencySymbol={currencySymbol} />
              </div>
            </div>
            <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/60 shadow-lg">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp size={12} /> Срез воронки</h3>
              <div className="space-y-7">
                {[ 
                  { l: 'Бюджет', v: inputs.budget, c: 'text-slate-300', p: 100, bc: 'bg-slate-700' },
                  { l: 'Выручка (gross)', v: metrics.revenue, c: 'text-indigo-400', p: Math.min(100, (metrics.revenue / (inputs.budget || 1)) * 50), bc: 'bg-indigo-500' },
                  { l: 'Вклад (gross)', v: metrics.profit, c: metrics.profit >= 0 ? 'text-emerald-400' : 'text-rose-400', p: Math.min(100, (Math.abs(metrics.profit) / (inputs.budget || 1)) * 50), bc: metrics.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase"><span>{item.l}</span><span className={item.c}>{Math.round(item.v).toLocaleString()} {currencySymbol}</span></div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ease-out rounded-full ${item.bc}`} style={{ width: `${item.p}%` }}></div></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <MetricCard label="CPL (Цена лида)" value={Math.round(metrics.cpl).toLocaleString()} currencySymbol={currencySymbol} icon={<Users />} status={getStatus('CPL')} />
              <MetricCard label="CPA (Цена продажи)" value={Math.round(metrics.cpa).toLocaleString()} currencySymbol={currencySymbol} icon={<Target />} status={getStatus('CPA')} />
              <MetricCard label="ROI (Gross)" value={metrics.roi.toFixed(1)} isPercent icon={<TrendingUp />} status={getStatus('ROI')} />
              <MetricCard label="Маркетинг BE (CPL)" value={Math.round(metrics.beCpl).toLocaleString()} currencySymbol={currencySymbol} icon={<TrendingDown />} />
              <MetricCard label="Маркетинг BE (CPA)" value={Math.round(metrics.beCpa).toLocaleString()} currencySymbol={currencySymbol} icon={<DollarSign />} />
              <MetricCard label="CR (Конверсия)" value={metrics.cr.toFixed(1)} isPercent icon={<Zap />} />
            </div>

            <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="px-10 py-8 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/20 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-500/5"><ShieldCheck size={22} /></div>
                  <div><h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Marketing Efficiency Audit</h3><span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 block opacity-60">Анализ маркетингового вклада (Gross)</span></div>
                </div>
                <div className="flex items-center gap-3">
                  {audit && (
                    <>
                      <button onClick={copyReport} className="p-3.5 bg-slate-800/40 text-slate-400 border border-slate-700/50 rounded-2xl hover:text-white transition-all active:scale-95" title="Скопировать отчет"><Copy size={18} /></button>
                      <button onClick={downloadHtml} className="p-3.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-2xl hover:bg-indigo-500/20 transition-all active:scale-95" title="Скачать HTML"><Download size={18} /></button>
                    </>
                  )}
                  <button onClick={handleAnalyze} disabled={isGenerating || !canAnalyze} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black disabled:opacity-20 hover:bg-indigo-500 transition-all duration-300 flex items-center gap-3 shadow-2xl shadow-indigo-500/30 active:scale-95 group">
                    {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} className="group-hover:scale-125 transition-transform" fill="currentColor" />}
                    <span className="uppercase tracking-[0.25em]">{isGenerating ? 'Считаем...' : 'Анализировать'}</span>
                  </button>
                </div>
              </div>

              {audit ? (
                <div className="p-10 space-y-16 animate-in">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="bg-indigo-500/5 p-10 rounded-[2.5rem] border border-indigo-500/10 flex flex-col items-center justify-center text-center group transition-all hover:bg-indigo-500/10 shadow-inner">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 opacity-60">Efficiency Score</span>
                      <div className="text-7xl font-extrabold text-indigo-400 leading-none drop-shadow-2xl tracking-tighter">{audit.scores.total}</div>
                      <span className="text-[11px] font-bold text-indigo-300/40 mt-5 uppercase tracking-[0.4em]">из 8.5</span>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                       {[ {l: 'Экономика', v: audit.scores.economy, bc: 'bg-indigo-500' }, {l: 'Воронка', v: audit.scores.funnel, bc: 'bg-emerald-500' }, {l: 'Масштаб', v: audit.scores.scale, bc: 'bg-indigo-400' } ].map((s, i) => (
                         <div key={i} className="p-7 bg-slate-900/60 rounded-[2rem] border border-slate-800/60 flex flex-col justify-between hover:border-slate-700/80 transition-all">
                            <span className="text-[10px] font-black uppercase text-slate-500 mb-2 opacity-50 tracking-widest">{s.l}</span>
                            <span className="text-3xl font-extrabold text-white tracking-tight leading-none">{s.v}/8.5</span>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full mt-4 overflow-hidden"><div className={`h-full ${s.bc} rounded-full`} style={{ width: `${(s.v / 8.5) * 100}%` }}></div></div>
                         </div>
                       ))}
                       <div className="col-span-1 sm:col-span-3 flex items-center gap-4 bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10"><AlertCircle size={20} className="text-indigo-400 flex-shrink-0" /><p className="text-sm font-semibold text-slate-300 leading-relaxed italic">«{audit.scores.interpretation}»</p></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
                    <div className="space-y-12">
                       <div className="bg-rose-500/[0.02] p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl">
                          <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-3.5"><XCircle size={18} /> Точки потерь бюджета</h4>
                          <div className="space-y-4">
                             {audit.lossPoints.length > 0 ? audit.lossPoints.map((lp, i) => (
                               <div key={i} className="p-5.5 bg-slate-900/60 border border-slate-800/60 rounded-3xl flex items-center justify-between group hover:border-rose-500/20 transition-all">
                                  <div className="space-y-1"><div className="text-xs font-black text-slate-200 uppercase tracking-tight">{lp.label}</div><div className="text-[11px] text-rose-500 font-bold uppercase tracking-widest opacity-80">Риск: -{lp.lossValue.toLocaleString()} {currencySymbol}</div></div>
                                  <Badge type={lp.isCritical ? 'bad' : 'neutral'}>{lp.diff}</Badge>
                               </div>
                             )) : <div className="p-7 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center gap-5"><div className="p-2.5 bg-emerald-500/15 rounded-2xl text-emerald-400"><CheckCircle2 size={22} /></div><div><span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">Аномальных потерь не найдено</span></div></div>}
                          </div>
                       </div>
                       <div className="space-y-7">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2"><Info size={14} /> Аналитический вывод</h4>
                          <ul className="space-y-6">{audit.insights.map((ins, i) => (<li key={i} className="flex gap-5 items-start text-slate-300 group"><div className="mt-2 w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div><span className="text-[13px] leading-relaxed font-medium">{ins}</span></li>))}</ul>
                       </div>
                    </div>

                    <div className="space-y-12">
                       <div className="bg-indigo-500/[0.02] p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl">
                          <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-3.5"><ArrowUpRight size={18} /> {metrics.profit <= 0 ? 'План восстановления экономики' : 'Гипотезы роста (What-if)'}</h4>
                          <div className="space-y-5">
                             {audit.scenarios.map((sc, i) => (
                               <div key={i} className="p-6 bg-[#0b0f19]/70 border border-slate-800/80 rounded-[1.75rem] group hover:border-indigo-500/30 transition-all cursor-default shadow-inner">
                                  <div className="flex justify-between items-center mb-4">
                                    <span className="text-[11px] font-black text-white uppercase tracking-tight">{sc.title}</span>
                                    <Badge type={sc.badgeType}>{sc.badgeLabel}</Badge>
                                  </div>
                                  <div className="mb-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Ожидаемый вклад (gross)</span>
                                    <div className="whitespace-nowrap inline-flex items-baseline gap-2 leading-none tracking-tight text-white font-extrabold text-[clamp(28px,6vw,44px)]">
                                      {sc.profit.toLocaleString()}
                                      <span className="text-[clamp(18px,3.5vw,28px)] font-bold text-slate-500 whitespace-nowrap">{currencySymbol}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm font-medium text-slate-500 italic leading-relaxed">«{sc.comment}»</p>
                                  <div className="mt-3 pt-3 border-t border-slate-800/40 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">ROI (Gross)</span>
                                    <span className={`text-xs font-black ${sc.roi >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{sc.roi}%</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-56 flex flex-col items-center justify-center text-slate-800/40 gap-8"><div className="p-12 bg-slate-900/40 rounded-full border-2 border-slate-800/40 relative"><Target size={64} strokeWidth={1} /><div className="absolute inset-0 animate-ping bg-indigo-500/5 rounded-full pointer-events-none"></div></div><div className="text-center space-y-2"><p className="text-[11px] uppercase tracking-[0.6em] font-black">Ожидание данных</p><p className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-40">Нажмите кнопку анализа после заполнения полей</p></div></div>
              )}
            </div>
          </section>
        </div>
      </main>
      <footer className="max-w-7xl mx-auto px-6 py-20 text-center border-t border-slate-800/30 mt-20 opacity-40"><p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] leading-relaxed">KPI Guard Professional &bull; Marketing Efficiency Audit &bull; 2025</p></footer>
    </div>
  );
}
