import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TrendingUp, Users, Target, DollarSign, ShieldCheck, 
  RotateCcw, Zap, AlertCircle, LayoutDashboard, Wallet,
  Copy, Download, FileText, Check, ArrowUpRight, ArrowDownRight,
  TrendingDown, Percent, BarChart3, ChevronRight, Activity, Layers
} from 'lucide-react';
import { KpiInputs, KpiMetrics, CurrencyCode, AuditResult } from './types';
import { calculateMetrics, generateAuditReport, convertInputs } from './services/NewAuditEngine';

// --- Components ---

const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * ease;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return <span>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
};

const MetricCard: React.FC<{ 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  currencySymbol?: string;
  isPercent?: boolean;
  decimals?: number;
  status?: 'good' | 'neutral' | 'bad';
}> = ({ label, value, icon, currencySymbol = "", isPercent, decimals = 0, status }) => {
  const styles = {
    good: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/10',
    neutral: 'border-amber-500/30 bg-amber-500/5 text-amber-400 shadow-amber-500/10',
    bad: 'border-rose-500/30 bg-rose-500/5 text-rose-400 shadow-rose-500/10',
    none: 'border-slate-800 bg-slate-900/40 text-slate-400 shadow-none'
  };

  return (
    <div className={`p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border backdrop-blur-xl transition-all duration-500 group hover:-translate-y-1 shadow-2xl ${styles[status || 'none']}`}>
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-slate-800/80 group-hover:bg-indigo-500/20 transition-colors border border-white/5">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
        </div>
        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 md:gap-1.5 overflow-hidden">
        <div className="text-xl md:text-4xl font-black text-white tracking-tighter">
          <AnimatedNumber value={value} decimals={decimals} />
        </div>
        <span className="text-[8px] md:text-xs font-black text-slate-500 uppercase">{isPercent ? '%' : currencySymbol}</span>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon: React.ReactNode;
  currencySymbol: string;
}> = ({ label, value, onChange, icon, currencySymbol }) => (
  <div className="space-y-2 group">
    <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 md:ml-2 flex items-center gap-2">
      <span className="w-1 h-1 bg-indigo-500 rounded-full" /> {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0"
        className="w-full pl-12 md:pl-14 pr-12 md:pr-14 py-3.5 md:py-5 bg-slate-950/80 border border-slate-800/60 rounded-xl md:rounded-[1.8rem] text-white text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800"
      />
      <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] font-black text-slate-700 uppercase">{currencySymbol}</div>
    </div>
  </div>
);

// --- App ---

export default function NewKpiGuard() {
  const [currency, setCurrency] = useState<CurrencyCode>('KZT');
  const [inputs, setInputs] = useState<KpiInputs>({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [toast, setToast] = useState({ show: false, msg: "" });

  const currencySymbol = currency === 'KZT' ? '₸' : '$';
  const metrics = useMemo(() => calculateMetrics(inputs), [inputs]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const toggleCurrency = (code: CurrencyCode) => {
    if (currency === code) return;
    const newInputs = convertInputs(inputs, currency, code);
    setInputs(newInputs);
    setCurrency(code);
    setAudit(null);
  };

  const handleAnalyze = () => {
    if (inputs.budget <= 0) return;
    setAudit(generateAuditReport(inputs, metrics, currency));
    showToast("Аудит успешно проведен");
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        const el = document.getElementById('results-section');
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      }, 100);
    }
  };

  const reset = () => {
    setInputs({ budget: 0, leads: 0, sales: 0, avgCheck: 0 });
    setAudit(null);
  };

  const copyFullReport = () => {
    if (!audit) return;
    const text = `
--------------------------------------------------
🛡️ KPI GUARD: СТРАТЕГИЧЕСКИЙ АУДИТ [${audit.mode}]
--------------------------------------------------
🏆 Итоговый балл: ${audit.scores.total}/10 (${audit.scores.interpretation})
📊 Риск: ${audit.risk}
⚠️ Вердикт: ${audit.riskReason}

📈 ОСНОВНЫЕ ПОКАЗАТЕЛИ:
• ROI: ${metrics.roi.toFixed(1)}%
• MER: ${metrics.mer.toFixed(2)}x
• Выручка: ${Math.round(metrics.revenue).toLocaleString()} ${currencySymbol}
• Профит: ${Math.round(metrics.profit).toLocaleString()} ${currencySymbol}
• Unit Gap: ${Math.round(metrics.unitGap).toLocaleString()} ${currencySymbol}
• CR: ${metrics.cr.toFixed(1)}%

🔍 КЛЮЧЕВЫЕ ИНСАЙТЫ:
${audit.insights.map(i => `• ${i}`).join('\n')}

⚡ ПРИОРИТЕТНЫЕ ШАГИ:
${audit.priorityActions.map(a => `📌 ${a.title}: ${a.action}\n   (Почему сейчас: ${a.whyNow} | Контроль: ${a.controlKpi})`).join('\n\n')}

🚀 ПРОГНОЗНЫЕ СЦЕНАРИИ:
${audit.scenarios.map(s => `📈 ${s.title} [${s.badgeLabel}]
   • Прогноз прибыли: ${Math.round(s.profit).toLocaleString()} ${currencySymbol}
   • ROI: ${s.roi}%
   • Комментарий: ${s.comment}`).join('\n\n')}

--------------------------------------------------
Сформировано в KPI Guard (Professional Edition)
`.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast("Полный отчет скопирован"));
    } else {
      showToast("Ошибка копирования");
    }
  };

  const downloadHtml = () => {
    if (!audit) return;
    const date = new Date().toLocaleString();
    const isRecovery = audit.mode === 'RECOVERY';
    const accentColor = isRecovery ? '#f43f5e' : '#10b981';
    
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KPI Guard Strategic Intelligence - ${audit.mode}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        :root {
            --accent: ${accentColor};
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text: #f8fafc;
            --text-muted: #94a3b8;
        }

        * { box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: #020617; 
            color: var(--text); 
            margin: 0; 
            padding: 40px 20px; 
            line-height: 1.6;
        }

        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
        }

        .report-card {
            background: var(--bg);
            border: 1px solid #334155;
            border-radius: 40px;
            overflow: hidden;
            box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5);
        }

        header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 60px;
            border-bottom: 1px solid #334155;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -1.5px;
        }

        .logo h1 span { color: #6366f1; }
        .logo p { 
            margin: 5px 0 0; 
            font-size: 10px; 
            font-weight: 800; 
            opacity: 0.5; 
            letter-spacing: 4px; 
            text-transform: uppercase; 
        }

        .mode-status {
            padding: 12px 24px;
            border-radius: 100px;
            background: var(--accent)22;
            color: var(--accent);
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            border: 1px solid var(--accent)44;
        }

        main { padding: 60px; }

        .executive-summary {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 40px;
            margin-bottom: 80px;
            align-items: center;
        }

        .health-score {
            background: #1e293b88;
            border: 1px solid #334155;
            border-radius: 32px;
            padding: 40px;
            text-align: center;
        }

        .score-circle {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            border: 12px solid #334155;
            border-top-color: var(--accent);
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
        }

        .score-val {
            font-size: 56px;
            font-weight: 900;
            color: #fff;
            transform: rotate(-45deg);
        }

        .verdict h2 {
            font-size: 11px;
            font-weight: 900;
            color: #6366f1;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .verdict p {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            line-height: 1.3;
        }

        .risk-tag {
            margin-top: 20px;
            display: inline-block;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            background: #334155;
            color: #fff;
        }

        .section-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #6366f1;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #334155;
        }

        .metrics-board {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 80px;
        }

        .m-card {
            background: #1e293b44;
            border: 1px solid #334155;
            border-radius: 24px;
            padding: 25px;
        }

        .m-card .label {
            font-size: 9px;
            font-weight: 800;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .m-card .value {
            font-size: 24px;
            font-weight: 900;
        }

        .roadmap {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 80px;
        }

        .action-item {
            background: #1e293b66;
            border: 1px solid #334155;
            border-radius: 24px;
            padding: 30px;
            position: relative;
        }

        .action-item::before {
            content: 'STEP';
            position: absolute;
            top: 20px;
            right: 30px;
            font-size: 10px;
            font-weight: 900;
            color: #334155;
        }

        .action-item h3 {
            font-size: 12px;
            font-weight: 900;
            color: #6366f1;
            text-transform: uppercase;
            margin: 0 0 10px;
        }

        .action-item .task {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .action-item .rationale {
            font-size: 13px;
            color: var(--text-muted);
        }

        .action-item .kpi-guard {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #334155;
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
        }

        .forecasts {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 80px;
        }

        .f-card {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 24px;
            padding: 25px;
            transition: all 0.3s ease;
        }

        .f-card:hover {
            border-color: #6366f1;
            transform: translateY(-5px);
        }

        .f-card .profit {
            font-size: 22px;
            font-weight: 900;
            margin: 10px 0;
        }

        .f-card .roi-tag {
            color: #6366f1;
            font-weight: 800;
            font-size: 12px;
        }

        footer {
            padding: 40px;
            text-align: center;
            background: #0b0f19;
            border-top: 1px solid #334155;
            font-size: 10px;
            font-weight: 800;
            color: #475569;
            letter-spacing: 5px;
            text-transform: uppercase;
        }

        @media (max-width: 768px) {
            .executive-summary, .metrics-board, .roadmap, .forecasts {
                grid-template-columns: 1fr;
            }
            header { flex-direction: column; text-align: center; gap: 30px; }
            main { padding: 30px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="report-card">
            <header>
                <div class="logo">
                    <h1>KPI <span>GUARD</span></h1>
                    <p>Marketing Intelligence Unit</p>
                </div>
                <div class="mode-status">${audit.mode} PHASE ACTIVE</div>
            </header>

            <main>
                <section class="executive-summary">
                    <div class="health-score">
                        <div class="score-circle">
                            <div class="score-val">${audit.scores.total}</div>
                        </div>
                        <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Health Score</div>
                    </div>
                    <div class="verdict">
                        <h2>Strategic Verdict</h2>
                        <p>${audit.riskReason}</p>
                        <div class="risk-tag">RISK EXPOSURE: ${audit.risk.toUpperCase()}</div>
                    </div>
                </section>

                <div class="section-title">Core Performance Matrix</div>
                <section class="metrics-board">
                    <div class="m-card">
                        <div class="label">ROI Gross</div>
                        <div class="value">${metrics.roi.toFixed(1)}%</div>
                    </div>
                    <div class="m-card">
                        <div class="label">Efficiency (MER)</div>
                        <div class="value">${metrics.mer.toFixed(2)}x</div>
                    </div>
                    <div class="m-card">
                        <div class="label">Unit Contribution</div>
                        <div class="value">${Math.round(metrics.unitGap).toLocaleString()} ${currencySymbol}</div>
                    </div>
                    <div class="m-card">
                        <div class="label">Lead Conversion</div>
                        <div class="value">${metrics.cr.toFixed(1)}%</div>
                    </div>
                </section>

                <div class="section-title">Growth Roadmap & Execution</div>
                <section class="roadmap">
                    ${audit.priorityActions.map(action => `
                        <div class="action-item">
                            <h3>${action.title}</h3>
                            <div class="task">${action.action}</div>
                            <div class="rationale">${action.whyNow}</div>
                            <div class="kpi-guard">CONTROL KPI: ${action.controlKpi}</div>
                        </div>
                    `).join('')}
                </section>

                <div class="section-title">Diagnostic Insights</div>
                <section style="margin-bottom: 80px;">
                    <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 15px;">
                        ${audit.insights.map(i => `
                            <li style="padding: 20px; background: #1e293b44; border-radius: 16px; border: 1px solid #334155; display: flex; align-items: flex-start; gap: 15px;">
                                <span style="color: #6366f1;">•</span>
                                <span style="font-size: 14px; color: #cbd5e1;">${i}</span>
                            </li>
                        `).join('')}
                    </ul>
                </section>

                <div class="section-title">Scenario Simulations</div>
                <section class="forecasts">
                    ${audit.scenarios.map(s => `
                        <div class="f-card">
                            <div style="font-size: 8px; font-weight: 900; background: #6366f1; color: #fff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; text-transform: uppercase;">${s.badgeLabel}</div>
                            <div style="font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">${s.title}</div>
                            <div class="profit">${Math.round(s.profit).toLocaleString()} ${currencySymbol}</div>
                            <div class="roi-tag">${s.roi}% Expected ROI</div>
                            <div style="font-size: 11px; font-style: italic; color: #64748b; margin-top: 10px;">"${s.comment}"</div>
                        </div>
                    `).join('')}
                </section>
            </main>

            <footer>
                KPI GUARD PROFESSIONAL SYSTEM &bull; GENERATED ON ${date}
            </footer>
        </div>
    </div>
</body>
</html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KPI_Guard_Deep_Audit_${audit.mode}.html`;
    a.click();
    showToast("Профессиональный отчет загружен");
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-100 selection:bg-indigo-500/40 pb-10 md:pb-20 overflow-x-hidden">
      {/* Toast */}
      <div className={`fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 transform ${toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}>
        <div className="bg-indigo-600 px-6 md:px-10 py-3.5 md:py-4 rounded-2xl md:rounded-[1.8rem] shadow-2xl flex items-center gap-3 md:gap-4 border border-white/10 backdrop-blur-3xl">
          <Check size={14} strokeWidth={3} />
          <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em]">{toast.msg}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-3xl sticky top-0 z-40 px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl md:rounded-2xl shadow-xl">
              <ShieldCheck size={16} className="text-white md:size-[22px]" />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-black uppercase tracking-tighter leading-none">KPI Guard</h1>
              <span className="hidden md:block text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Audit & Scaling</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5">
              {(['KZT', 'USD'] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => toggleCurrency(code)}
                  className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${
                    currency === code ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <button onClick={reset} className="p-2 md:p-3 bg-slate-900/60 border border-white/5 rounded-xl text-slate-500"><RotateCcw size={16} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
          
          {/* Form */}
          <aside className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-slate-900/30 p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-white/5 backdrop-blur-2xl">
              <div className="flex items-center gap-3 mb-6 md:mb-10 text-indigo-400">
                <LayoutDashboard size={14} />
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em]">Операционные вводы</h2>
              </div>
              <div className="space-y-5 md:space-y-8">
                <InputField label="Рекламный бюджет" value={inputs.budget} onChange={(v) => setInputs(p => ({...p, budget: v}))} icon={<Wallet />} currencySymbol={currencySymbol} />
                <InputField label="Кол-во лидов" value={inputs.leads} onChange={(v) => setInputs(p => ({...p, leads: v}))} icon={<Users />} currencySymbol={currencySymbol} />
                <InputField label="Кол-во продаж" value={inputs.sales} onChange={(v) => setInputs(p => ({...p, sales: v}))} icon={<Target />} currencySymbol={currencySymbol} />
                <InputField label="Средний чек" value={inputs.avgCheck} onChange={(v) => setInputs(p => ({...p, avgCheck: v}))} icon={<DollarSign />} currencySymbol={currencySymbol} />
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={inputs.budget <= 0}
                className="w-full mt-8 md:mt-12 py-4 md:py-6 bg-indigo-600 disabled:opacity-20 text-white rounded-2xl md:rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 flex items-center justify-center gap-3 transition-all"
              >
                <Zap size={14} fill="currentColor" /> Анализировать
              </button>
            </div>
          </aside>

          {/* Report */}
          <section id="results-section" className="lg:col-span-8 space-y-6 md:space-y-10">
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <MetricCard label="ROI Gross" value={metrics.roi} isPercent decimals={1} icon={<TrendingUp />} status={metrics.roi > 0 ? 'good' : 'bad'} />
              <MetricCard label="MER Effect" value={metrics.mer} decimals={2} icon={<Percent />} status={metrics.mer > 1 ? 'good' : 'bad'} />
              <MetricCard label="Unit Gap" value={metrics.unitGap} currencySymbol={currencySymbol} icon={<ArrowUpRight />} status={metrics.unitGap > 0 ? 'good' : 'bad'} />
              <MetricCard label="Contribution" value={metrics.profit} currencySymbol={currencySymbol} icon={<Target />} status={metrics.profit > 0 ? 'good' : 'bad'} />
            </div>

            {audit ? (
              <div className="space-y-6 md:space-y-10 animate-in">
                <div className="bg-slate-900/30 p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] border border-white/5 backdrop-blur-3xl relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-4 md:px-8 py-2 md:py-3 text-[8px] md:text-[10px] font-black uppercase tracking-widest ${audit.mode === 'RECOVERY' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {audit.mode} MODE
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-5xl md:text-7xl font-black text-indigo-400 tracking-tighter leading-none">
                        <AnimatedNumber value={audit.scores.total} decimals={1} />
                      </div>
                      <div>
                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Audit Index</span>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${audit.risk === 'Низкий' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          Risk: {audit.risk}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={copyFullReport} 
                        className="flex-1 md:flex-none p-3 md:p-4 bg-slate-950/60 border-2 border-indigo-500 rounded-full md:rounded-full text-slate-300 flex items-center justify-center hover:bg-indigo-500/10 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] active:scale-90"
                        title="Копировать отчет"
                      >
                        <Copy size={20} />
                      </button>
                      <button onClick={downloadHtml} className="flex-1 md:flex-none p-3 md:p-4 bg-slate-800/60 rounded-xl md:rounded-2xl text-slate-300 flex items-center justify-center border border-white/5 hover:bg-slate-700 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
                    <div className="space-y-4 md:space-y-8">
                      <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2"><BarChart3 size={14} /> Вердикт</h4>
                      <p className={`text-sm md:text-lg font-bold leading-relaxed ${audit.mode === 'RECOVERY' ? 'text-rose-400' : 'text-slate-100'}`}>{audit.riskReason}</p>
                      <div className="space-y-3">
                        {audit.insights.map((ins, i) => (
                          <div key={i} className="flex gap-3 text-[11px] md:text-xs font-medium text-slate-400 leading-relaxed"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />{ins}</div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-8">
                      <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2"><Zap size={14} /> Приоритеты</h4>
                      <div className="space-y-3">
                        {audit.priorityActions.map((act, i) => (
                          <div key={i} className="p-4 md:p-6 bg-slate-950/40 rounded-xl md:rounded-[1.8rem] border border-white/5">
                            <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">{act.title}</div>
                            <div className="text-[12px] md:text-sm text-slate-200 font-bold mb-1">{act.action}</div>
                            <div className="text-[8px] font-bold text-slate-600 uppercase">KPI: {act.controlKpi}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {audit.scenarios.map((sc, i) => (
                    <div key={i} className="bg-slate-900/30 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[8px] font-black text-slate-500 uppercase">{sc.title}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase border ${sc.badgeType === 'good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>{sc.badgeLabel}</div>
                      </div>
                      <div className="text-xl md:text-2xl font-black text-white mb-1 flex items-baseline gap-1"><AnimatedNumber value={sc.profit} /><span className="text-[9px] text-slate-600">{currencySymbol}</span></div>
                      <div className="text-[10px] font-black text-indigo-400 mb-3">ROI: {sc.roi}%</div>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold italic opacity-60">{sc.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 md:h-80 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-slate-800">
                <FileText size={32} strokeWidth={0.5} className="mb-4 opacity-5 animate-pulse" />
                <p className="text-[8px] font-black uppercase tracking-[0.5em] opacity-10">Ждем расчет</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto py-10 px-8 border-t border-white/5 text-center text-slate-700">
        <p className="text-[8px] font-black uppercase tracking-[1em] opacity-40">KPI Guard &bull; 2025</p>
      </footer>
    </div>
  );
}