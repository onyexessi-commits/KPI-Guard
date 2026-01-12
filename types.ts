
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
  insights: string[];
  priorityActions: string[];
}
