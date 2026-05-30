// travelData.js is generated, untyped game data (countries + regions). It is
// re-exported here with explicit types so the rest of the app stays type-safe.
// @ts-expect-error - untyped generated JS module at the repo root
import { countries as rawCountries, regions as rawRegions } from '../../travelData.js';

export interface CountryEntry {
  name: string;
  permalink: string;
  regionIds: number[];
}

export interface RegionEntry {
  name: string;
  permalink: string;
}

export const countries = rawCountries as Record<number, CountryEntry>;
export const regions = rawRegions as Record<number, RegionEntry>;
