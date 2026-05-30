// Buy-vs-produce strategy for a food/weapons industry tab. Ported verbatim from
// the legacy render() (app.js lines 1097-1340). Kept as a standalone pure function
// because the legacy code computed the per-factory totals AND the two options
// inline; reproducing that arithmetic exactly preserves the headline numbers.
//
// IMPORTANT (parity): the legacy headline KPIs use Option B accounting
// (displayNetProfit === netProfitOptionB), which collapses to Option A when no
// plantations are staffed. `chosen*` fields below expose the higher-net option
// for the recommendation panel; `display*` fields expose the legacy headline.
import { roundNumber, gameRawProduction, productivityMultiplier, pollutionAt } from './rounding';
import type { IndustryConfig } from '../data/types';
import type { Cells } from './types';

export interface IndustryViewInput {
  industry: IndustryConfig;
  factoryCells: Cells;
  plantationCells: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  workTaxRate: number;
  averageSalary: number;
}

export interface BreakdownRow {
  quality: number;
  companies: number;
  workers: number;
  output: number;
  grossProfit: number;
}

export interface IndustryView {
  totalFactories: number;
  totalPlantations: number;
  totalOutput: number;
  totalRM: number;
  totalRMProduced: number;
  netBalance: number;
  grossRevenue: number;
  // Option A: buy all raw material.
  optionABuyCost: number;
  optionANet: number;
  // Option B: run plantations.
  optionBNet: number;
  // recommendation (higher net of A/B)
  useProduce: boolean;
  // legacy headline (Option B accounting — actual staffed config)
  displayRMCost: number;
  displayWorkTax: number;
  displaySalary: number;
  displayNet: number;
  producingRM: boolean;
  breakdown: BreakdownRow[];
}

export function computeIndustryView(p: IndustryViewInput): IndustryView {
  const {
    industry, factoryCells, plantationCells, countryBonus, regionBonus,
    qualityPollution, vat, prices, rmPrice, hasTycoon, wamEnabled,
    offeredSalary, workTaxRate, averageSalary,
  } = p;

  let totalFactories = 0;
  let factoryWamSessions = 0;
  let factoryWorkers = 0;
  let totalOutput = 0;
  let totalRM = 0;
  let sumRevenue = 0;
  const breakdown: BreakdownRow[] = [];

  for (const fact of industry.factoriesData) {
    const cell = factoryCells[fact.quality] || { companies: 0, workers: 0 };
    const companies = cell.companies || 0;
    const workers = Math.min(cell.workers || 0, companies * fact.maxEmployees);
    const sessions = (wamEnabled ? companies : 0) + workers;
    totalFactories += companies;
    factoryWamSessions += wamEnabled ? companies : 0;
    factoryWorkers += workers;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fact.quality) });
    const singleOutput = roundNumber(fact.baseOutput * mult, 2);
    const singleRM = roundNumber((fact.baseRM ?? 0) * mult, 2);
    const cardOutput = singleOutput * sessions;
    const cardRM = singleRM * sessions;
    const cardRevenue = cardOutput * prices[fact.quality] * (1 - vat / 100);
    const cardGrossProfit = cardRevenue - cardRM * rmPrice;

    totalOutput += cardOutput;
    totalRM += cardRM;
    sumRevenue += cardRevenue;

    if (companies > 0 || workers > 0) {
      breakdown.push({ quality: fact.quality, companies, workers, output: cardOutput, grossProfit: cardGrossProfit });
    }
  }

  let totalRMProduced = 0;
  let plantationWamSessions = 0;
  let plantationWorkers = 0;
  for (const plant of industry.rmData) {
    const cell = plantationCells[plant.quality] || { companies: 0, workers: 0 };
    const companies = cell.companies || 0;
    const workers = Math.min(cell.workers || 0, companies * plant.maxEmployees);
    const sessions = (wamEnabled ? companies : 0) + workers;
    plantationWamSessions += wamEnabled ? companies : 0;
    plantationWorkers += workers;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
    const singleOutput = gameRawProduction((plant.baseOutput / 100) * mult);
    totalRMProduced += singleOutput * sessions;
  }

  totalOutput = roundNumber(totalOutput, 2);
  totalRM = roundNumber(totalRM, 2);
  totalRMProduced = roundNumber(totalRMProduced, 2);

  const taxPerSession = (workTaxRate / 100) * averageSalary;
  const factoryTax = factoryWamSessions * taxPerSession;
  const factoryLabor = factoryWorkers * offeredSalary;
  const netBalance = totalRMProduced - totalRM;

  // Option A: Buy 100% of raw material.
  const optionABuyCost = totalRM * rmPrice;
  const optionANet = sumRevenue - factoryTax - factoryLabor - optionABuyCost;

  // Option B: Produce (run plantations).
  const plantTax = plantationWamSessions * taxPerSession;
  const plantLabor = plantationWorkers * offeredSalary;
  let marketExpenseB = 0;
  let marketRevenueB = 0;
  if (netBalance < 0) marketExpenseB = -netBalance * rmPrice;
  else marketRevenueB = netBalance * rmPrice * (1 - vat / 100);
  const optionBNet = sumRevenue - factoryTax - factoryLabor - plantTax - plantLabor - marketExpenseB + marketRevenueB;

  const producingRM = plantationWamSessions + plantationWorkers > 0;
  const displayRMCost = marketExpenseB - marketRevenueB;
  const displayWorkTax = factoryTax + plantTax;
  const displaySalary = factoryLabor + plantLabor;

  return {
    totalFactories,
    totalPlantations: 0, // plantation company count is folded into the KPI by the view
    totalOutput,
    totalRM,
    totalRMProduced,
    netBalance,
    grossRevenue: sumRevenue,
    optionABuyCost,
    optionANet,
    optionBNet,
    useProduce: optionBNet > optionANet,
    displayRMCost,
    displayWorkTax,
    displaySalary,
    displayNet: optionBNet,
    producingRM,
    breakdown,
  };
}
