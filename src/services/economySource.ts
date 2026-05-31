import type { IndustryKey } from '../data/types';

export interface CountryEconomics {
  countryBonus: number;   // per-industry productivity bonus (e.g. 20 for +20%)
  averageSalary: number;
  workTaxRate: number;    // percent (e.g. 1.0 for 1%)
  vat: number;            // per-industry percent
}

export interface CountryEconomySource {
  /** economics for the given owner countries, keyed by the SAME country string used in regionResources.currentCountry */
  getCountryEconomics(
    industry: IndustryKey,
    countryNames: string[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<string, CountryEconomics>>;

  /** real quality-indexed pollution for specific regions (Phase 3) */
  getRegionPollution(
    industry: IndustryKey,
    regionIds: number[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, Record<number, number>>>;
}
