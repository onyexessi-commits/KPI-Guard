
export type CurrencyCode = 'KZT' | 'USD';

export interface KpiInputs {
  budget: number;
  leads: number;
  sales: number;
  avgCheck: number;
}

export interface KpiMetrics {
  cpl: number;
  cpa: number;
  revenue: number;
  roi: number;
  cr: number;
  beCpa: number;
  beCpl: number;
}

export interface AuditResult {
  risk: 'Низкий' | 'Средний' | 'Высокий';
  riskReason?: string;
  insights: string[];
  priorityActions: { 
    title: string; 
    action: string; 
    whyNow: string;
    ifNotDone: string;
    controlKpi: string;
  }[];
  lossPoints: { label: string; diff: string; lossValue: number; isCritical: boolean }[];
  scenarios: { title: string; profit: number; roi: number; comment: string }[];
  alternativePlan?: string;
  scores: {
    total: number;
    economy: number;
    funnel: number;
    scale: number;
    interpretation: string;
  };
}
