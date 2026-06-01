import type { RegionEntry } from '../data/regionResources';
import type { UniverseRegion } from '../services/universe';

export interface JoinResult {
  regions: RegionEntry[];
  /** universe regions with no matching seed entry (no bonus data) — excluded */
  skipped: number;
}

/**
 * Build candidate RegionEntry[] from the live universe (owner + permalink) joined
 * to the stable seed (resource bonuses) by permalink. Regions absent from the seed
 * have no bonus data and are skipped (counted).
 */
export function joinUniverseWithSeed(universe: UniverseRegion[], seed: RegionEntry[]): JoinResult {
  const byPermalink = new Map(seed.map((r) => [r.permalink, r]));
  const regions: RegionEntry[] = [];
  let skipped = 0;
  for (const u of universe) {
    const s = byPermalink.get(u.permalink);
    if (!s) { skipped++; continue; }
    regions.push({ ...s, name: u.name, permalink: u.permalink, currentCountry: u.currentCountry });
  }
  return { regions, skipped };
}
