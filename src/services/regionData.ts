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

function isDataSet(v: unknown): v is RegionDataSet {
  return (
    !!v &&
    typeof v === 'object' &&
    Array.isArray((v as RegionDataSet).regions) &&
    typeof (v as RegionDataSet).fetchedAt === 'string' &&
    typeof (v as RegionDataSet).countryFlags === 'object'
  );
}

// GET the server-stored dataset; fall back to the bundled seed on 204/any error.
export async function fetchRegionData(): Promise<RegionDataSet> {
  try {
    const res = await fetch('/api/regions');
    if (res.status === 204 || !res.ok) return BUNDLED_DATASET;
    const data: unknown = await res.json();
    // Server JSON carries raw offline-scale bonuses too — normalize it once here.
    // (BUNDLED_DATASET is already normalized at construction; do not re-normalize.)
    return isDataSet(data) ? normalizeDataset(data) : BUNDLED_DATASET;
  } catch {
    return BUNDLED_DATASET;
  }
}

// Trigger a server-side refresh from eRepublik using the admin's erpk cookie.
export async function refreshRegionData(erpk: string): Promise<RegionDataSet> {
  const res = await fetch('/api/regions/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ erpk }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Refresh failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  if (!isDataSet(data)) throw new Error('Refresh returned malformed data');
  // Same offline-scale raw bonuses as the GET path — normalize once before display.
  return normalizeDataset(data);
}
