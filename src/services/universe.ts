import { REGION_RESOURCES } from '../data/regionResources';

export interface UniverseRegion {
  permalink: string;
  name: string;
  currentCountry: string;
}

export interface Universe {
  regions: UniverseRegion[];
  /** ISO timestamp the server last enumerated the Society pages; null when the
   *  seed fallback is used (server unreachable). Drives the UI freshness note. */
  fetchedAt: string | null;
}

function seedUniverse(): Universe {
  return {
    regions: REGION_RESOURCES.map((r) => ({ permalink: r.permalink, name: r.name, currentCountry: r.currentCountry })),
    fetchedAt: null,
  };
}

/** Live region universe from the server; seed-derived fallback on any failure. */
export async function fetchUniverse(): Promise<Universe> {
  try {
    const res = await fetch('/api/universe');
    if (!res.ok) return seedUniverse();
    const data: unknown = await res.json();
    const regions = (data as { regions?: unknown }).regions;
    const fetchedAt = (data as { fetchedAt?: unknown }).fetchedAt;
    if (!Array.isArray(regions)) return seedUniverse();
    return { regions: regions as UniverseRegion[], fetchedAt: typeof fetchedAt === 'string' ? fetchedAt : null };
  } catch {
    return seedUniverse();
  }
}
