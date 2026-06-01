import { REGION_RESOURCES, COUNTRY_FLAGS, SNAPSHOT_DATE, type RegionEntry } from '../data/regionResources';

export interface RegionDataSet {
  fetchedAt: string;
  regions: RegionEntry[];
  countryFlags: Record<string, string>;
}

// Offline regionResources bonuses are exactly 5× the in-game region bonus
// (verified vs live region pages across all 4 industries, 2026-05-31). Normalize
// to the real scale here so every consumer (optimizer pre-filter + Regions tab)
// matches the game and `parseRegionBonus`.
const BONUS_SCALE = 5;

/**
 * Returns a new dataset with every `region.resources[].bonus` divided by
 * BONUS_SCALE. Offline values are multiples of 5, so results stay integers.
 * Pure — does not mutate the input.
 */
export function normalizeDataset(ds: RegionDataSet): RegionDataSet {
  return {
    ...ds,
    regions: ds.regions.map((region) => ({
      ...region,
      resources: region.resources.map((r) => ({ ...r, bonus: r.bonus / BONUS_SCALE })),
    })),
  };
}

// Offline default — used until/unless the server has a refreshed dataset.
// Normalized once here at construction (the only place it's built).
export const BUNDLED_DATASET: RegionDataSet = normalizeDataset({
  fetchedAt: SNAPSHOT_DATE,
  regions: REGION_RESOURCES,
  countryFlags: COUNTRY_FLAGS,
});

// The live region universe now comes from /api/universe (services/universe.ts).
// This returns the bundled seed dataset (resource bonuses + country flags),
// used for bonus lookups and flag display.
export async function fetchRegionData(): Promise<RegionDataSet> {
  return BUNDLED_DATASET;
}
