// Per-industry profit math, ported verbatim from holdingsCalc.mjs (lines 30-131).
// Do NOT "improve" the arithmetic — golden-parity tests assert bit-identical results.
import { roundNumber, gameRawProduction, productivityMultiplier, pollutionAt } from './rounding';
import type { FactoryDef } from '../data/types';
import type { Cells, IndustryResult } from './types';

export interface FwInput {
  factoriesData: FactoryDef[];
  plantationsData: FactoryDef[];
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

export interface HiredInput {
  factoriesData: FactoryDef[];
  rmData: FactoryDef[];
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

// One food/weapons-style industry (owner WAM + plantations).
export function computeFwIndustry(p: FwInput): IndustryResult {
  const {
    factoriesData, plantationsData, factoryCells, plantationCells,
    countryBonus, regionBonus, qualityPollution, vat, prices, rmPrice,
    hasTycoon, wamEnabled, offeredSalary, workTaxRate, averageSalary,
  } = p;

  let companies = 0, factoryWorkers = 0, wamSessions = 0;
  let output = 0, rmConsumed = 0, revenue = 0;

  for (const fact of factoriesData) {
    const cell = factoryCells[fact.quality] || { companies: 0, workers: 0 };
    const c = cell.companies || 0;
    const w = Math.min(cell.workers || 0, c * fact.maxEmployees);
    const sessions = (wamEnabled ? c : 0) + w;
    companies += c; factoryWorkers += w; wamSessions += wamEnabled ? c : 0;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fact.quality) });
    const singleOutput = roundNumber(fact.baseOutput * mult, 2);
    const singleRM = roundNumber((fact.baseRM ?? 0) * mult, 2);
    output += singleOutput * sessions;
    rmConsumed += singleRM * sessions;
    revenue += singleOutput * sessions * prices[fact.quality] * (1 - vat / 100);
  }

  let plantWorkers = 0, plantWamSessions = 0, rmProduced = 0;
  for (const plant of plantationsData) {
    const cell = plantationCells[plant.quality] || { companies: 0, workers: 0 };
    const c = cell.companies || 0;
    const w = Math.min(cell.workers || 0, c * plant.maxEmployees);
    const sessions = (wamEnabled ? c : 0) + w;
    companies += c; plantWorkers += w; plantWamSessions += wamEnabled ? c : 0;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
    const singleOutput = gameRawProduction((plant.baseOutput / 100) * mult);
    rmProduced += singleOutput * sessions;
  }

  output = roundNumber(output, 2);
  rmConsumed = roundNumber(rmConsumed, 2);
  rmProduced = roundNumber(rmProduced, 2);

  const netBalance = rmProduced - rmConsumed;
  const rmNetCost = netBalance < 0
    ? -netBalance * rmPrice
    : -(netBalance * rmPrice * (1 - vat / 100));

  const workTax = (wamSessions + plantWamSessions) * (workTaxRate / 100) * averageSalary;
  const salary = (factoryWorkers + plantWorkers) * offeredSalary;
  const net = revenue - rmNetCost - workTax - salary;

  return { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net };
}

// One houses/aircraft-style industry (no WAM; hired workers only). workTax always 0.
export function computeHiredIndustry(p: HiredInput): IndustryResult {
  const {
    factoriesData, rmData, factoryCells, rmCells,
    countryBonus, regionBonus, qualityPollution, vat, prices, rmPrice,
    hasTycoon, offeredSalary,
  } = p;

  let companies = 0, factoryWorkers = 0;
  let output = 0, rmConsumed = 0, revenue = 0;

  for (const fac of factoriesData) {
    const cell = factoryCells[fac.quality] || { companies: 0, workers: 0 };
    const c = cell.companies || 0;
    const w = Math.min(cell.workers || 0, c * fac.maxEmployees);
    companies += c; factoryWorkers += w;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fac.quality) });
    const singleOutput = fac.baseOutput * mult;
    output += singleOutput * w;
    rmConsumed += (fac.baseRM ?? 0) * mult * w;
    revenue += singleOutput * w * prices[fac.quality] * (1 - vat / 100);
  }

  let rmWorkers = 0, rmProduced = 0;
  for (const rm of rmData) {
    const cell = rmCells[rm.quality] || { companies: 0, workers: 0 };
    const c = cell.companies || 0;
    const w = Math.min(cell.workers || 0, c * rm.maxEmployees);
    companies += c; rmWorkers += w;

    const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
    const singleOutput = (rm.baseOutput / 100) * mult;
    rmProduced += singleOutput * w;
  }

  const netBalance = rmProduced - rmConsumed;
  const rmNetCost = netBalance < 0
    ? -netBalance * rmPrice
    : -(netBalance * rmPrice * (1 - vat / 100));

  const salary = (factoryWorkers + rmWorkers) * offeredSalary;
  const workTax = 0;
  const net = revenue - rmNetCost - workTax - salary;

  return { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net };
}
