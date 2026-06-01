// Pure production-profitability advisor. Re-runs the golden-parity per-industry
// math (computeFwIndustry / computeHiredIndustry) for single isolated work
// sessions, so it never forks the profit arithmetic. No DOM, no fetch.
import type { AppState, FwModule, HiredModule } from '../state/types';
import type { IndustryKey } from '../data/types';
import type { Cells, IndustryResult } from './types';
import { INDUSTRIES, getIndustry } from '../data/industries';
import { computeFwIndustry, computeHiredIndustry } from './industry';

export interface AdvisorRow {
  industry: IndustryKey;
  quality: number;
  wamNet: number | null; // net per WAM session (= per company/day); null for hired industries
  hireNet: number; // net per hired worker-session, Tycoon OFF
  hireNetTycoon: number; // net per hired worker-session, Tycoon ON
  roiRm: number; // net per 1 CC spent on raw material (primary session); 0 if no RM cost
  owned: number; // companies owned of this quality
  hasPrice: boolean; // finished-good price available for this quality
}

export interface RmVerdict {
  industry: IndustryKey;
  bestQuality: number; // quality whose conversion is evaluated
  sellRaw: number; // value realized per 1 RM unit sold raw (net of VAT)
  convert: number; // value added per 1 RM unit converted into finished goods
  convertIsBetter: boolean;
  delta: number; // |convert − sellRaw|
  hasPrice: boolean; // at least one priced quality exists for this industry
}

export interface AdvisorReport {
  rows: AdvisorRow[]; // every (industry × quality); UI sorts
  rmVerdicts: RmVerdict[]; // one per industry
  topWam: AdvisorRow | null; // highest wamNet among priced rows
}

// One isolated session of a single fw factory. wam=true → 1 owner WAM session,
// 0 hired. wam=false → 1 hired worker, 0 WAM (buying all RM from market).
function fwSession(state: AppState, key: IndustryKey, mod: FwModule, quality: number, wam: boolean, hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const factoryCells: Cells = { [quality]: { companies: 1, workers: wam ? 0 : 1 } };
  return computeFwIndustry({
    factoriesData: cfg.factoriesData,
    plantationsData: cfg.rmData,
    factoryCells,
    plantationCells: {},
    countryBonus: mod.countryBonus,
    regionBonus: mod.regionBonus,
    qualityPollution: mod.qualityPollution,
    vat: mod.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon,
    wamEnabled: wam,
    offeredSalary: state.offeredSalary,
    workTaxRate: mod.workTaxRate,
    averageSalary: mod.averageSalary,
  });
}

// One isolated hired worker-session of a single hired (houses/aircraft) factory.
function hiredSession(state: AppState, key: IndustryKey, mod: HiredModule, quality: number, hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const factoryCells: Cells = { [quality]: { companies: 1, workers: 1 } };
  return computeHiredIndustry({
    factoriesData: cfg.factoriesData,
    rmData: cfg.rmData,
    factoryCells,
    rmCells: {},
    countryBonus: mod.countryBonus,
    regionBonus: mod.regionBonus,
    qualityPollution: mod.qualityPollution,
    vat: mod.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon,
    offeredSalary: state.offeredSalary,
  });
}

function roi(primary: IndustryResult): number {
  return primary.rmNetCost > 0 ? primary.net / primary.rmNetCost : 0;
}

export function computeAdvisor(state: AppState): AdvisorReport {
  const rows: AdvisorRow[] = [];
  const rmVerdicts: RmVerdict[] = [];

  for (const cfg of INDUSTRIES) {
    const key = cfg.key;
    const rmPrice = state[cfg.rmPriceKey];
    // Track the best priced quality and its primary session for the RM verdict.
    let bestQuality = 0;
    let bestPrimary: IndustryResult | null = null;
    let bestMetric = -Infinity;

    for (let q = 1; q <= cfg.maxFactoryQuality; q++) {
      const hasPrice = (state[key].prices[q] ?? 0) > 0;

      let wamNet: number | null;
      let hireNet: number;
      let hireNetTycoon: number;
      let primary: IndustryResult;
      let owned: number;

      if (cfg.type === 'fw') {
        const mod = state[key] as FwModule;
        const wamRes = fwSession(state, key, mod, q, true, state.hasTycoon);
        wamNet = wamRes.net;
        hireNet = fwSession(state, key, mod, q, false, false).net;
        hireNetTycoon = fwSession(state, key, mod, q, false, true).net;
        primary = wamRes;
        owned = mod[q]?.companies ?? 0;
      } else {
        const mod = state[key] as HiredModule;
        wamNet = null;
        hireNet = hiredSession(state, key, mod, q, false).net;
        hireNetTycoon = hiredSession(state, key, mod, q, true).net;
        primary = hiredSession(state, key, mod, q, state.hasTycoon);
        owned = mod.factories[q]?.companies ?? 0;
      }

      rows.push({ industry: key, quality: q, wamNet, hireNet, hireNetTycoon, roiRm: roi(primary), owned, hasPrice });

      const metric = cfg.type === 'fw' ? (wamNet ?? -Infinity) : hireNetTycoon;
      if (hasPrice && metric > bestMetric) {
        bestMetric = metric;
        bestQuality = q;
        bestPrimary = primary;
      }
    }

    const hasPrice = bestPrimary !== null && rmPrice > 0;
    const sellRaw = rmPrice * (1 - state[key].vat / 100);
    // convert = (revenue − session taxes) / RM consumed = (net + rmNetCost) / rmConsumed.
    const convert = bestPrimary && bestPrimary.rmConsumed > 0
      ? (bestPrimary.net + bestPrimary.rmNetCost) / bestPrimary.rmConsumed
      : 0;
    rmVerdicts.push({
      industry: key,
      bestQuality,
      sellRaw,
      convert,
      convertIsBetter: convert > sellRaw,
      delta: Math.abs(convert - sellRaw),
      hasPrice,
    });
  }

  const topWam = rows
    .filter((r) => r.hasPrice && r.wamNet !== null)
    .sort((a, b) => (b.wamNet as number) - (a.wamNet as number))[0] ?? null;

  return { rows, rmVerdicts, topWam };
}
