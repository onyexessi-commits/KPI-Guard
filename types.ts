
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
  profit: number; // Marketing Contribution (Gross)
  roi: number;    // ROI Gross
  cr: number;     // Conversion Rate
  mer: number;    // Marketing Efficiency Ratio (Revenue / Budget)
  unitGap: number; // AOV - CPA
  beCpa: number;  // Break-even CPA
  beCpl: number;  // Break-even CPL
}

export interface Scenario {
  title: string;
  profit: number;
  roi: number;
  comment: string;
  badgeType: 'good' | 'neutral' | 'bad';
  badgeLabel: string;
}

export interface AuditResult {
  mode: 'RECOVERY' | 'SCALING';
  risk: 'Низкий' | 'Средний' | 'Высокий';
  riskReason: string;
  insights: string[];
  priorityActions: { 
    title: string; 
    action: string; 
    whyNow: string;
    ifNotDone?: string;
    controlKpi: string;
  }[];
  lossPoints?: any[];
  alternativePlan?: string;
  scenarios: Scenario[];
  scores: {
    total: number;
    economy: number;
    funnel: number;
    scale: number;
    interpretation: string;
  };
}