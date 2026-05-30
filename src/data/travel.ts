// travelData.js is generated, untyped game data (countries + regions). It is
// re-exported here with explicit types so the rest of the app stays type-safe.
// Field shapes match the actual generated literals (verified via tsc inference):
//   country: { id, name, permalink, regions: number[] }
//   region:  { id, countryId, name, permalink }
import { countries as rawCountries, regions as rawRegions } from '../../travelData.js';

export interface CountryEntry {
  id: number;
  name: string;
  permalink: string;
  regions: number[];
}

export interface RegionEntry {
  id: number;
  countryId: number;
  name: string;
  permalink: string;
}

export const countries = rawCountries as unknown as Record<number, CountryEntry>;
export const regions = rawRegions as unknown as Record<number, RegionEntry>;
