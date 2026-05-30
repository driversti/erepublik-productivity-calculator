// Holding aggregation. computeHoldingIndustry (the thin adapter that selects
// fw vs hired by industry type) lives with the HoldingsView, since it depends on
// the app-state shape; this module stays free of state-shape coupling.
import type { IndustryResult } from './types';

export interface PerIndustry {
  key: string;
  label: string;
  net: number;
  companies: number;
}

export interface HoldingTotals {
  net: number;
  revenue: number;
  rmNetCost: number;
  workTax: number;
  salary: number;
  companies: number;
  perIndustry: PerIndustry[];
}

// Sum per-industry results into holding totals. Ported from holdingsCalc.mjs.
export function sumHolding(results: { key: string; label: string; result: IndustryResult }[]): HoldingTotals {
  const totals = { net: 0, revenue: 0, rmNetCost: 0, workTax: 0, salary: 0, companies: 0 };
  const perIndustry: PerIndustry[] = [];
  for (const { key, label, result } of results) {
    totals.net += result.net;
    totals.revenue += result.revenue;
    totals.rmNetCost += result.rmNetCost;
    totals.workTax += result.workTax;
    totals.salary += result.salary;
    totals.companies += result.companies;
    perIndustry.push({ key, label, net: result.net, companies: result.companies });
  }
  return { ...totals, perIndustry };
}
