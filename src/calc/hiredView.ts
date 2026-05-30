// View model for a houses/aircraft industry tab. Ported verbatim from the legacy
// renderHiredLaborModule strategy math (app.js lines 1914-2019). No WAM, so work
// tax is always 0; the owner's only labor cost is hired-worker salaries.
import { productivityMultiplier, pollutionAt } from './rounding';
import type { IndustryConfig } from '../data/types';
import type { Cells } from './types';

export interface HiredViewInput {
  industry: IndustryConfig;
  factoryCells: Cells;
  rmCells: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  offeredSalary: number;
}

export interface HiredBreakdownRow {
  quality: number;
  companies: number;
  workers: number;
  output: number;
  profit: number;
}

export interface HiredView {
  totalCompanies: number;
  totalOutput: number;
  totalRMUsed: number;
  totalRMProduced: number;
  netBalance: number;
  grossRevenue: number;
  optionABuyCost: number;
  optionANet: number;
  optionBNet: number;
  useProduce: boolean;
  displayRMCost: number;
  displaySalary: number;
  displayNet: number;
  producingRM: boolean;
  breakdown: HiredBreakdownRow[];
}

export function computeHiredView(p: HiredViewInput): HiredView {
  const {
    industry, factoryCells, rmCells, countryBonus, regionBonus,
    qualityPollution, vat, prices, rmPrice, hasTycoon, offeredSalary,
  } = p;

  let totalCompanies = 0;
  let totalWorkers = 0;
  let totalOutput = 0;
  let totalRMUsed = 0;
  let sumRevenue = 0;
  const breakdown: HiredBreakdownRow[] = [];

  for (const fac of industry.factoriesData) {
    const cell = factoryCells[fac.quality] || { companies: 0, workers: 0 };
    const companies = cell.companies || 0;
    const maxWorkers = companies * fac.maxEmployees;
    const workers = Math.min(cell.workers || 0, maxWorkers);
    totalCompanies += companies;
    totalWorkers += workers;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fac.quality) });
    const singleOutput = fac.baseOutput * mult;
    const cardOutput = singleOutput * workers;
    const cardRM = (fac.baseRM ?? 0) * mult * workers;
    const cardRevenue = cardOutput * prices[fac.quality] * (1 - vat / 100);
    const cardProfit = cardRevenue - cardRM * rmPrice - workers * offeredSalary;

    totalOutput += cardOutput;
    totalRMUsed += cardRM;
    sumRevenue += cardRevenue;

    if (companies > 0 || workers > 0) {
      breakdown.push({ quality: fac.quality, companies, workers, output: cardOutput, profit: cardProfit });
    }
  }

  let totalRmWorkers = 0;
  let totalRMProduced = 0;
  for (const rm of industry.rmData) {
    const cell = rmCells[rm.quality] || { companies: 0, workers: 0 };
    const companies = cell.companies || 0;
    const maxWorkers = companies * rm.maxEmployees;
    const workers = Math.min(cell.workers || 0, maxWorkers);
    totalRmWorkers += workers;
    totalCompanies += companies;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
    const singleOutput = (rm.baseOutput / 100) * mult;
    totalRMProduced += singleOutput * workers;
  }

  const houseSalaryCost = totalWorkers * offeredSalary;
  const hrmSalaryCost = totalRmWorkers * offeredSalary;
  const netBalance = totalRMProduced - totalRMUsed;

  const optionABuyCost = totalRMUsed * rmPrice;
  const optionANet = sumRevenue - optionABuyCost - houseSalaryCost;

  let marketExpenseB = 0;
  let marketRevenueB = 0;
  if (netBalance < 0) marketExpenseB = -netBalance * rmPrice;
  else marketRevenueB = netBalance * rmPrice * (1 - vat / 100);
  const optionBNet = sumRevenue - houseSalaryCost - hrmSalaryCost - marketExpenseB + marketRevenueB;

  const producingRM = totalRmWorkers > 0;

  return {
    totalCompanies,
    totalOutput,
    totalRMUsed,
    totalRMProduced,
    netBalance,
    grossRevenue: sumRevenue,
    optionABuyCost,
    optionANet,
    optionBNet,
    useProduce: optionBNet > optionANet,
    displayRMCost: marketExpenseB - marketRevenueB,
    displaySalary: houseSalaryCost + hrmSalaryCost,
    displayNet: optionBNet,
    producingRM,
    breakdown,
  };
}
