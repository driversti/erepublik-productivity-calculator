// Countries are a stable, static fact (id/name/permalink) and live in their own
// `countries.json`. The list of regions a country *currently controls* is NOT
// static (regions change hands in war), so it is fetched live from the Country
// Society page instead — see `state/useRegionList.ts`. The numeric `regions`
// map below still comes from the generated `travelData.js` because the optimizer
// (`services/liveEconomy.getRegionDetails`) needs the region-id → permalink
// lookup; the per-country `regions: number[]` membership array is intentionally
// gone (it was a stale snapshot).
//   country: { id, name, permalink }
//   region:  { id, countryId, name, permalink }
import countriesJson from './countries.json';
import { regions as rawRegions } from '../../travelData.js';

export interface CountryEntry {
  id: number;
  name: string;
  permalink: string;
}

export interface RegionEntry {
  id: number;
  countryId: number;
  name: string;
  permalink: string;
}

export const countries = countriesJson as unknown as Record<number, CountryEntry>;
export const regions = rawRegions as unknown as Record<number, RegionEntry>;
