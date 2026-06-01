import type { IndustryKey } from '../data/types';

/** Minimal region reference for fetching its live page. */
export interface RegionRef {
  id: number;
  permalink: string;
}

export interface CountryEconomics {
  countryBonus: number;   // per-industry productivity bonus (e.g. 20 for +20%)
  averageSalary: number;
  workTaxRate: number;    // percent (e.g. 1.0 for 1%)
  vat: number;            // per-industry percent
}

/** Live, region-page-sourced details for a single region (Phase 3). */
export interface RegionLiveDetails {
  /** real in-game region production bonus for the industry (sum of resource bonuses) */
  regionBonus: number;
  /** quality-indexed pollution (index 0 = RM, 1..maxQ = factories) */
  pollution: Record<number, number>;
}

export interface CountryEconomySource {
  /** economics for the given owner countries, keyed by the SAME country string used in regionResources.currentCountry */
  getCountryEconomics(
    industry: IndustryKey,
    countryNames: string[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<string, CountryEconomics>>;

  /** real region bonus + quality-indexed pollution for specific regions (Phase 3) */
  getRegionDetails(
    industry: IndustryKey,
    regions: RegionRef[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, RegionLiveDetails>>;
}
