import {
  REGION_RESOURCES,
  type Industry,
  type RegionEntry,
  type RegionResource,
} from '../data/regionResources';

export interface RankedRegion {
  region: RegionEntry;
  /** Sum of the bonuses of this industry's resources in the region. */
  totalBonus: number;
  /** The resources that contributed (for display chips). */
  matched: RegionResource[];
}

/**
 * Regions that contain at least one resource of `industry`, ranked by total
 * bonus (desc), tie-broken by region name (asc). Optionally restricted to a
 * single `currentCountry`.
 */
export function rankRegions(
  industry: Industry,
  opts?: { country?: string },
): RankedRegion[] {
  const country = opts?.country;
  const ranked: RankedRegion[] = [];
  for (const region of REGION_RESOURCES) {
    if (country && region.currentCountry !== country) continue;
    const matched = region.resources.filter((r) => r.industry === industry);
    if (matched.length === 0) continue;
    const totalBonus = matched.reduce((sum, r) => sum + r.bonus, 0);
    ranked.push({ region, totalBonus, matched });
  }
  ranked.sort(
    (a, b) => b.totalBonus - a.totalBonus || a.region.name.localeCompare(b.region.name),
  );
  return ranked;
}

/** Distinct `currentCountry` values that have ≥1 region for the industry, sorted. */
export function countriesForIndustry(industry: Industry): string[] {
  const set = new Set<string>();
  for (const region of REGION_RESOURCES) {
    if (region.resources.some((r) => r.industry === industry)) {
      set.add(region.currentCountry);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
