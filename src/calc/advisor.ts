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
  kind: 'factory' | 'rm'; // finished-good factory, or a raw-material company
  wamNet: number | null; // net per WAM session (= per company/day); null when WAM not possible
  hireNet: number | null; // net per hired worker-session, Tycoon OFF; null when hiring not possible
  hireNetTycoon: number | null; // net per hired worker-session, Tycoon ON; null when hiring not possible
  roiRm: number | null; // net per 1 CC spent on RM; null for raw-material rows (they produce, not consume, RM)
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

// One isolated session of a single fw raw-material company (plantation/mine).
// Only the RM company is staffed, so the result's net is RM sale income − tax/salary.
function fwRmSession(state: AppState, key: IndustryKey, mod: FwModule, quality: number, wam: boolean, hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const plantationCells: Cells = { [quality]: { companies: 1, workers: wam ? 0 : 1 } };
  return computeFwIndustry({
    factoriesData: cfg.factoriesData,
    plantationsData: cfg.rmData,
    factoryCells: {},
    plantationCells,
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

// One isolated hired session of a single hired (houses/aircraft) raw-material company.
function hiredRmSession(state: AppState, key: IndustryKey, mod: HiredModule, quality: number, hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const rmCells: Cells = { [quality]: { companies: 1, workers: 1 } };
  return computeHiredIndustry({
    factoriesData: cfg.factoriesData,
    rmData: cfg.rmData,
    factoryCells: {},
    rmCells,
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
        const hireFalse = hiredSession(state, key, mod, q, false);
        const hireTrue = hiredSession(state, key, mod, q, true);
        wamNet = null;
        hireNet = hireFalse.net;
        hireNetTycoon = hireTrue.net;
        primary = state.hasTycoon ? hireTrue : hireFalse;
        owned = mod.factories[q]?.companies ?? 0;
      }

      rows.push({ industry: key, quality: q, kind: 'factory', wamNet, hireNet, hireNetTycoon, roiRm: roi(primary), owned, hasPrice });

      // Rank fw by the WAM session, hired by the actual-Tycoon session — i.e. always
      // the user's real per-session economics (primary.net). wamNet is the fw primary.
      const metric = wamNet ?? primary.net;
      if (hasPrice && metric > bestMetric) {
        bestMetric = metric;
        bestQuality = q;
        bestPrimary = primary;
      }
    }

    // Raw-material companies as their own rankable rows. Net comes from staffing
    // only the RM company (sale income − tax/salary); they consume no RM, so roiRm is null.
    const rmPriced = rmPrice > 0;
    for (let q = 1; q <= cfg.rmData.length; q++) {
      const rmDef = cfg.rmData[q - 1];
      let wamNet: number | null;
      let hireNet: number | null;
      let hireNetTycoon: number | null;
      let owned: number;
      if (cfg.type === 'fw') {
        const mod = state[key] as FwModule;
        wamNet = fwRmSession(state, key, mod, q, true, state.hasTycoon).net;
        const canHire = rmDef.maxEmployees > 0;
        hireNet = canHire ? fwRmSession(state, key, mod, q, false, false).net : null;
        hireNetTycoon = canHire ? fwRmSession(state, key, mod, q, false, true).net : null;
        owned = mod.plantations?.[q]?.companies ?? 0;
      } else {
        const mod = state[key] as HiredModule;
        wamNet = null;
        hireNet = hiredRmSession(state, key, mod, q, false).net;
        hireNetTycoon = hiredRmSession(state, key, mod, q, true).net;
        owned = mod.rm?.[q]?.companies ?? 0;
      }
      rows.push({ industry: key, quality: q, kind: 'rm', wamNet, hireNet, hireNetTycoon, roiRm: null, owned, hasPrice: rmPriced });
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
