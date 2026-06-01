// Countries are a stable, static fact (id/name/permalink) and live in their own
// `countries.json`. Region identity (id/name/permalink) now lives in the region
// dataset (`regionResources.ts` seed + server-refreshed map-data), so the old
// `regions` map from travelData.js is gone.
import countriesJson from './countries.json';

export interface CountryEntry {
  id: number;
  name: string;
  permalink: string;
}

export const countries = countriesJson as unknown as Record<number, CountryEntry>;
