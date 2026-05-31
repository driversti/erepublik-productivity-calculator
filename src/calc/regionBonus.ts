import type { IndustryKey } from '../data/types';
import type { RegionEntry } from '../data/regionResources';

export interface RegionCandidate {
  region: RegionEntry;
  regionBonus: number;
}

export interface CandidateOptions {
  /** keep regions with regionBonus >= threshold */
  threshold: number;
  /** hard ceiling on how many candidates survive (highest bonus wins) */
  maxCandidates: number;
}

export function regionBonusFor(region: RegionEntry, industry: IndustryKey): number {
  let sum = 0;
  for (const r of region.resources) if (r.industry === industry) sum += r.bonus;
  return sum;
}

export function selectCandidates(
  regions: RegionEntry[],
  industry: IndustryKey,
  { threshold, maxCandidates }: CandidateOptions,
): RegionCandidate[] {
  return regions
    .map((region) => ({ region, regionBonus: regionBonusFor(region, industry) }))
    .filter((c) => c.regionBonus > 0 && c.regionBonus >= threshold)
    .sort((a, b) => b.regionBonus - a.regionBonus)
    .slice(0, maxCandidates);
}
