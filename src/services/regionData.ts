import { REGION_RESOURCES, COUNTRY_FLAGS, SNAPSHOT_DATE, type RegionEntry } from '../data/regionResources';

export interface RegionDataSet {
  fetchedAt: string;
  regions: RegionEntry[];
  countryFlags: Record<string, string>;
}

// Offline default — used until/unless the server has a refreshed dataset.
export const BUNDLED_DATASET: RegionDataSet = {
  fetchedAt: SNAPSHOT_DATE,
  regions: REGION_RESOURCES,
  countryFlags: COUNTRY_FLAGS,
};

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
    return isDataSet(data) ? data : BUNDLED_DATASET;
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
  return data;
}
