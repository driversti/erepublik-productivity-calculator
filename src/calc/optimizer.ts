import { computeIndustryView } from './strategy';
import { computeHiredView } from './hiredView';
import type { IndustryConfig } from '../data/types';
import type { Cells } from './types';
import type { RegionEntry } from '../data/regionResources';
import type { RegionCandidate } from './regionBonus';
import type { CountryEconomics } from '../services/economySource';

export interface OptimizerConfig {
  industry: IndustryConfig;
  /** finished-goods factory companies/workers per quality */
  factoryCells: Cells;
  /** plantations (fw) or RM companies (hired) per quality */
  rmCells: Cells;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  wamEnabled: boolean;     // fw only; ignored for hired
  offeredSalary: number;
}

export interface RankedRegion {
  region: RegionEntry;
  regionBonus: number;
  economics: CountryEconomics;
  pollution: Record<number, number> | null; // null => estimated at 0
  net: number;
}

const ZERO_POLLUTION: Record<number, number> = {};

export function rankRegions(
  config: OptimizerConfig,
  economicsByCountry: Map<string, CountryEconomics>,
  candidates: RegionCandidate[],
  detailsByRegion?: Map<number, { regionBonus?: number; pollution?: Record<number, number> }>,
): RankedRegion[] {
  const out: RankedRegion[] = [];
  for (const { region, regionBonus: candidateBonus } of candidates) {
    const economics = economicsByCountry.get(region.currentCountry);
    if (!economics) continue;
    const details = detailsByRegion?.get(region.id);
    // Prefer the live region-page bonus when available; otherwise fall back to
    // the candidate's offline (normalized) estimate.
    const regionBonus = details?.regionBonus ?? candidateBonus;
    const pollution = details?.pollution ?? null;
    const qualityPollution = pollution ?? ZERO_POLLUTION;

    let net: number;
    if (config.industry.type === 'fw') {
      net = computeIndustryView({
        industry: config.industry,
        factoryCells: config.factoryCells,
        plantationCells: config.rmCells,
        countryBonus: economics.countryBonus,
        regionBonus,
        qualityPollution,
        vat: economics.vat,
        prices: config.prices,
        rmPrice: config.rmPrice,
        hasTycoon: config.hasTycoon,
        wamEnabled: config.wamEnabled,
        offeredSalary: config.offeredSalary,
        workTaxRate: economics.workTaxRate,
        averageSalary: economics.averageSalary,
      }).displayNet;
    } else {
      net = computeHiredView({
        industry: config.industry,
        factoryCells: config.factoryCells,
        rmCells: config.rmCells,
        countryBonus: economics.countryBonus,
        regionBonus,
        qualityPollution,
        vat: economics.vat,
        prices: config.prices,
        rmPrice: config.rmPrice,
        hasTycoon: config.hasTycoon,
        offeredSalary: config.offeredSalary,
      }).displayNet;
    }
    out.push({ region, regionBonus, economics, pollution, net });
  }
  out.sort((a, b) => b.net - a.net);
  return out;
}
