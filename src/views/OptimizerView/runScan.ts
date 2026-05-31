import type { IndustryKey } from '../../data/types';
import { getIndustry } from '../../data/industries';
import { selectCandidates } from '../../calc/regionBonus';
import { rankRegions, type OptimizerConfig, type RankedRegion } from '../../calc/optimizer';
import { fetchRegionData } from '../../services/regionData';
import type { CountryEconomySource } from '../../services/economySource';

export type ScanPhase = 'economics' | 'pollution';

export interface ScanProgress {
  phase: ScanPhase;
  done: number;
  total: number;
}

export interface ScanParams {
  industry: IndustryKey;
  config: OptimizerConfig;
  baselineNet: number | null;
  threshold: number;
  maxCandidates: number;
  topN: number;
}

export interface ScanOutcome {
  results: RankedRegion[];
  baselineNet: number | null;
  skippedCount: number;
  fetchedAt: string;
}

/**
 * Orchestrates the three-phase optimizer scan:
 *   1. select candidate regions by bonus threshold
 *   2. fetch per-country economics, rank with pollution=0
 *   3. refine pollution for the topN finalists, re-rank
 *
 * Returns null when no candidates survive the threshold (caller shows a hint).
 */
export async function runScan(
  source: CountryEconomySource,
  { industry, config, baselineNet, threshold, maxCandidates, topN }: ScanParams,
  onProgress: (p: ScanProgress) => void,
): Promise<ScanOutcome | null> {
  void getIndustry(industry); // validate key early

  const dataset = await fetchRegionData();
  const candidates = selectCandidates(dataset.regions, industry, { threshold, maxCandidates });
  if (candidates.length === 0) return null;

  const owners = [...new Set(candidates.map((c) => c.region.currentCountry))];
  const economics = await source.getCountryEconomics(industry, owners, (done, total) =>
    onProgress({ phase: 'economics', done, total }),
  );

  // Phase 2: rank with estimated (zero) pollution to find finalists.
  const ranked = rankRegions(config, economics, candidates);
  const skippedCount = candidates.length - ranked.length;
  const top = ranked.slice(0, topN);

  // Phase 3: fetch real pollution for finalists, then re-rank all candidates
  // (only the finalists gain real pollution; the rest stay estimated).
  const pollution = await source.getRegionPollution(
    industry,
    top.map((r) => r.region.id),
    (done, total) => onProgress({ phase: 'pollution', done, total }),
  );
  const finalRanked = rankRegions(config, economics, candidates, pollution);

  return {
    results: finalRanked.slice(0, topN),
    baselineNet,
    skippedCount,
    fetchedAt: new Date().toISOString(),
  };
}
