// Profit-report orchestrator. Loads the user's inventory config, fetches live
// prices + location modifiers, runs the app's golden-parity engine, and renders a
// self-contained light-theme HTML report (opened in the browser).
//
//   npx vite-node scripts/profit/run.mts [config.json] [--relocate] [--no-open]
//
// All profit math is the existing engine (computeFwIndustry/computeHiredIndustry,
// via computeAdvisor) — no formula is duplicated here.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initialState } from '../../src/state/blank';
import type { AppState, FwModule, HiredModule } from '../../src/state/types';
import { computeAdvisor } from '../../src/calc/advisor';
import { computeFwIndustry, computeHiredIndustry } from '../../src/calc/industry';
import { productivityMultiplier, pollutionAt } from '../../src/calc/rounding';
import { INDUSTRIES, getIndustry } from '../../src/data/industries';
import type { IndustryKey, IndustryConfig } from '../../src/data/types';
import type { IndustryResult } from '../../src/calc/types';

import { renderReport } from '../../src/profit/render';
import { computeBreakeven } from '../../src/profit/breakeven';
import { rmUnitCost } from '../../src/profit/ownCost';
import { unitProductionCost } from '../../src/profit/produceVsBuy';
import { damagePerHit, cheapestEnergyCost, WEAPON_COMBAT, AIRCRAFT_WEAPON_COMBAT, ENERGY_PER_HIT } from '../../src/profit/damageCost';
import { stripJsonComments } from '../../src/profit/jsonc';
import type {
  ReportModel, IndustryBlock, CompanyBreakdown, RankRow, BreakevenRow, ProduceVsBuyRow, RmVerdictRow, RelocationRow, DamageCostBlock, DamageCostRow,
} from '../../src/profit/types';
import { rankRegions } from '../../src/regions/ranking';
import { BUNDLED_DATASET } from '../../src/services/regionData';
import type { Industry } from '../../src/data/regionResources';
import { fetchPrices, fetchModifiers } from './fetch.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface IndustryConfigEntry {
  country: string;
  region: string;
  factories?: Record<string, number>;
  plantations?: Record<string, number>;
  rm?: Record<string, number>;
}
interface UserConfig {
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  combat?: { strength: number; rankValue?: number; airRankValue?: number; groundTarget?: number; airTarget?: number };
  industries: Partial<Record<IndustryKey, IndustryConfigEntry>>;
}

const RM_PRICE_KEY: Record<IndustryKey, 'frmPrice' | 'wrmPrice' | 'hrmPrice' | 'armPrice'> = {
  food: 'frmPrice', weapons: 'wrmPrice', houses: 'hrmPrice', aircraft: 'armPrice',
};

function loadConfig(path: string): UserConfig {
  if (!existsSync(path)) {
    throw new Error(`Config not found: ${path}\nCopy scripts/profit/my-companies.example.jsonc to ${path} and fill in your companies.`);
  }
  // JSONC: comments (// and /* */) are stripped so the config can carry guidance.
  return JSON.parse(stripJsonComments(readFileSync(path, 'utf8'))) as UserConfig;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function stamp(d: Date): { file: string; human: string } {
  const Y = d.getFullYear(), M = pad2(d.getMonth() + 1), D = pad2(d.getDate());
  const h = pad2(d.getHours()), m = pad2(d.getMinutes());
  return { file: `${Y}-${M}-${D}-${h}${m}`, human: `${Y}-${M}-${D} ${h}:${m}` };
}

// Apply live modifiers + prices + owned counts into the AppState module.
function applyIndustry(state: AppState, key: IndustryKey, cfg: IndustryConfigEntry, mods: any, prices: Record<number, number>, rmPrice: number) {
  const m = state[key] as any;
  m.countryBonus = mods.countryBonus;
  m.regionBonus = mods.regionBonus;
  m.qualityPollution = mods.qualityPollution;
  m.vat = mods.vat;
  m.workTaxRate = mods.workTaxRate;
  m.averageSalary = mods.averageSalary;
  m.prices = prices;
  state[RM_PRICE_KEY[key]] = rmPrice;

  const icfg = getIndustry(key);
  if (icfg.type === 'fw') {
    const fw = m as FwModule;
    for (const [q, n] of Object.entries(cfg.factories ?? {})) fw[Number(q)] = { companies: n, workers: 0 };
    for (const [q, n] of Object.entries(cfg.plantations ?? {})) fw.plantations[Number(q)] = { companies: n, workers: 0 };
  } else {
    const hi = m as HiredModule;
    for (const [q, n] of Object.entries(cfg.factories ?? {})) hi.factories[Number(q)] = { companies: n, workers: 0 };
    for (const [q, n] of Object.entries(cfg.rm ?? {})) hi.rm[Number(q)] = { companies: n, workers: 0 };
  }
}

// One isolated single-company session through the engine (reuses, never forks).
function fwSingle(state: AppState, key: IndustryKey, q: number, kind: 'factory' | 'plantation', hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const mod = state[key] as FwModule;
  const cell = { [q]: { companies: 1, workers: 0 } };
  return computeFwIndustry({
    factoriesData: cfg.factoriesData, plantationsData: cfg.rmData,
    factoryCells: kind === 'factory' ? cell : {}, plantationCells: kind === 'plantation' ? cell : {},
    countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, qualityPollution: mod.qualityPollution,
    vat: mod.vat, prices: mod.prices, rmPrice: state[cfg.rmPriceKey], hasTycoon, wamEnabled: true,
    offeredSalary: 0, workTaxRate: mod.workTaxRate, averageSalary: mod.averageSalary,
  });
}
function hiredSingle(state: AppState, key: IndustryKey, q: number, kind: 'factory' | 'rm', hasTycoon: boolean, salary: number): IndustryResult {
  const cfg = getIndustry(key);
  const mod = state[key] as HiredModule;
  const cell = { [q]: { companies: 1, workers: 1 } };
  return computeHiredIndustry({
    factoriesData: cfg.factoriesData, rmData: cfg.rmData,
    factoryCells: kind === 'factory' ? cell : {}, rmCells: kind === 'rm' ? cell : {},
    countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, qualityPollution: mod.qualityPollution,
    vat: mod.vat, prices: mod.prices, rmPrice: state[cfg.rmPriceKey], hasTycoon, offeredSalary: salary,
  });
}

function mult(state: AppState, key: IndustryKey, polIndex: number, hasTycoon: boolean): { value: number; terms: any } {
  const mod = state[key] as any;
  const terms = { countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, tycoon: hasTycoon ? 20 : 0, pollution: pollutionAt(mod.qualityPollution, polIndex) };
  return { value: productivityMultiplier({ countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, hasTycoon, pollutionRate: terms.pollution }), terms };
}

// `state` prices RM at market (used for producer/plantation rows that SELL it);
// `factoryState` prices RM for factories that CONSUME it (own-cost when that mode
// is on, else market). hiredSalary is the salary modelled for hired sessions.
function buildIndustryBlock(state: AppState, factoryState: AppState, cfg: IndustryConfig, entry: IndustryConfigEntry, hasTycoon: boolean, hiredSalary: number, ownRmCost: number | null): IndustryBlock {
  const key = cfg.key;
  const mod = state[key] as any;
  const companies: CompanyBreakdown[] = [];

  const addFactory = (q: number, count: number) => {
    const def = cfg.factoriesData[q - 1];
    const polIndex = q;
    const mu = mult(state, key, polIndex, hasTycoon);
    if (cfg.type === 'fw') {
      const r = fwSingle(factoryState, key, q, 'factory', hasTycoon);
      companies.push({
        quality: q, kind: 'factory', name: def.name, count, basis: 'wam',
        multiplier: mu.value, terms: mu.terms, produces: false,
        unitsPerSession: r.output, rmPerSession: r.rmConsumed, price: mod.prices[q] ?? 0, vat: mod.vat,
        grossRevenue: r.output * (mod.prices[q] ?? 0), netRevenue: r.revenue, rmCost: r.rmNetCost,
        workTax: r.workTax, salary: r.salary, netPerSession: r.net, netPerDay: r.net * count, runnable: true,
      });
    } else {
      // hired industry: idle under WAM-only. Show units it WOULD make, net=null.
      const r = hiredSingle(factoryState, key, q, 'factory', hasTycoon, hiredSalary);
      companies.push({
        quality: q, kind: 'factory', name: def.name, count, basis: 'hired',
        multiplier: mu.value, terms: mu.terms, produces: false,
        unitsPerSession: r.output, rmPerSession: r.rmConsumed, price: mod.prices[q] ?? 0, vat: mod.vat,
        grossRevenue: r.output * (mod.prices[q] ?? 0), netRevenue: r.revenue, rmCost: r.rmNetCost,
        workTax: 0, salary: r.salary, netPerSession: null, netPerDay: null, runnable: false,
      });
    }
  };

  const addProducer = (q: number, count: number, kind: 'plantation' | 'rm') => {
    const def = cfg.rmData[q - 1];
    const mu = mult(state, key, 0, hasTycoon);
    if (cfg.type === 'fw') {
      const r = fwSingle(state, key, q, 'plantation', hasTycoon);
      const income = -r.rmNetCost; // producer: rmNetCost is negative (sale income)
      companies.push({
        quality: q, kind: 'plantation', name: def.name, count, basis: 'wam',
        multiplier: mu.value, terms: mu.terms, produces: true,
        unitsPerSession: r.rmProduced, rmPerSession: 0, price: state[cfg.rmPriceKey], vat: mod.vat,
        grossRevenue: r.rmProduced * state[cfg.rmPriceKey], netRevenue: income, rmCost: 0,
        workTax: r.workTax, salary: r.salary, netPerSession: r.net, netPerDay: r.net * count, runnable: true,
      });
    } else {
      const r = hiredSingle(state, key, q, 'rm', hasTycoon, hiredSalary);
      const income = -r.rmNetCost;
      companies.push({
        quality: q, kind: 'rm', name: def.name, count, basis: 'hired',
        multiplier: mu.value, terms: mu.terms, produces: true,
        unitsPerSession: r.rmProduced, rmPerSession: 0, price: state[cfg.rmPriceKey], vat: mod.vat,
        grossRevenue: r.rmProduced * state[cfg.rmPriceKey], netRevenue: income, rmCost: 0,
        workTax: 0, salary: r.salary, netPerSession: null, netPerDay: null, runnable: false,
      });
    }
  };

  for (const [q, n] of Object.entries(entry.factories ?? {})) if (n > 0) addFactory(Number(q), n);
  for (const [q, n] of Object.entries(entry.plantations ?? {})) if (n > 0) addProducer(Number(q), n, 'plantation');
  for (const [q, n] of Object.entries(entry.rm ?? {})) if (n > 0) addProducer(Number(q), n, 'rm');

  return {
    key, label: cfg.label, icon: cfg.icon, country: entry.country, region: entry.region,
    countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, vat: mod.vat, workTax: mod.workTaxRate,
    avgSalary: mod.averageSalary, pollution: mod.qualityPollution, rmName: cfg.rmName,
    rmPrice: state[cfg.rmPriceKey], ownRmCost, prices: mod.prices, companies,
  };
}

// собівартість of self-produced RM for an industry: cheapest cost/unit across the
// RM producers the user owns. fw plantations cost work tax (WAM); hired RM mines
// cost salary — and are only producible if a salary is paid (else null/idle).
function computeOwnRmCost(state: AppState, cfg: IndustryConfig, entry: IndustryConfigEntry, hasTycoon: boolean, hiredSalary: number): number | null {
  const mod = state[cfg.key] as any;
  let best: number | null = null;
  const consider = (cost: number | null) => {
    if (cost !== null && (best === null || cost < best)) best = cost;
  };
  if (cfg.type === 'fw') {
    const workTaxPerSession = mod.averageSalary * (mod.workTaxRate / 100);
    for (const q of Object.keys(entry.plantations ?? {})) {
      if ((entry.plantations as any)[q] <= 0) continue;
      const produced = fwSingle(state, cfg.key, Number(q), 'plantation', hasTycoon).rmProduced;
      consider(rmUnitCost(workTaxPerSession, produced));
    }
  } else if (hiredSalary > 0) {
    for (const q of Object.keys(entry.rm ?? {})) {
      if ((entry.rm as any)[q] <= 0) continue;
      const produced = hiredSingle(state, cfg.key, Number(q), 'rm', hasTycoon, hiredSalary).rmProduced;
      consider(rmUnitCost(hiredSalary, produced));
    }
  }
  return best;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const configPath = resolve(args.find((a) => !a.startsWith('--')) ?? resolve(__dirname, 'my-companies.json'));
  const cfg = loadConfig(configPath);

  const state = initialState();
  state.hasTycoon = cfg.hasTycoon;
  state.wamEnabled = cfg.wamEnabled;
  state.offeredSalary = cfg.offeredSalary;

  const presentKeys = INDUSTRIES.map((i) => i.key).filter((k) => cfg.industries[k]);
  const modsByKey: Record<string, any> = {};
  for (const key of presentKeys) {
    const entry = cfg.industries[key]!;
    process.stderr.write(`fetching ${key} @ ${entry.country}/${entry.region}…\n`);
    const [mods, pr] = await Promise.all([fetchModifiers(key, entry.country, entry.region), fetchPrices(key)]);
    modsByKey[key] = mods;
    applyIndustry(state, key, entry, mods, pr.prices, pr.rmPrice);
  }

  // --- valuation basis ---
  // RM is always valued at MARKET (= the correct opportunity cost of your own RM:
  // what you forgo by not selling it). Production собівартість is shown for info
  // only — charging factories that cost would double-count the plantation's margin.
  const effSalary = cfg.offeredSalary > 0 ? cfg.offeredSalary : null; // null → use country avg
  const salaryFor = (key: IndustryKey) => effSalary ?? modsByKey[key].averageSalary;
  const rmBasis: 'market' | 'own' = 'market';
  const salaryBasis: 'country-avg' | 'user' = effSalary != null ? 'user' : 'country-avg';

  // Informational only: your WAM/hire production cost per RM unit (собівартість).
  const ownCost: Partial<Record<IndustryKey, number | null>> = {};
  for (const c of INDUSTRIES) {
    if (cfg.industries[c.key]) ownCost[c.key] = computeOwnRmCost(state, c, cfg.industries[c.key]!, cfg.hasTycoon, salaryFor(c.key));
  }

  const reportNoTyc = computeAdvisor({ ...state, hasTycoon: false, offeredSalary: 0 });
  const reportTyc = computeAdvisor({ ...state, hasTycoon: true, offeredSalary: 0 });

  // Industry blocks (market RM basis; собівартість shown for reference).
  const industries: IndustryBlock[] = INDUSTRIES.filter((c) => cfg.industries[c.key]).map((c) =>
    buildIndustryBlock(state, state, c, cfg.industries[c.key]!, cfg.hasTycoon, salaryFor(c.key), ownCost[c.key] ?? null),
  );

  // Current daily total: MARKET basis, runnable (fw WAM) rows only.
  const sumDaily = (rep: ReturnType<typeof computeAdvisor>) =>
    rep.rows
      .filter((r) => cfg.industries[r.industry] && getIndustry(r.industry).type === 'fw' && r.wamNet !== null)
      .reduce((s, r) => s + (r.wamNet as number) * r.owned, 0);

  // Ranking: fw factory rows from factory reports (own-cost), fw rm rows from market; hired at effective salary.
  const find = (rep: ReturnType<typeof computeAdvisor>, key: IndustryKey, kind: string, q: number) =>
    rep.rows.find((x) => x.industry === key && x.kind === kind && x.quality === q)!;
  const ranking: RankRow[] = [];
  for (const c of INDUSTRIES) {
    if (!cfg.industries[c.key]) continue;
    if (c.type === 'fw') {
      for (const r of reportNoTyc.rows) {
        if (r.industry !== c.key) continue;
        const onR = find(reportTyc, c.key, r.kind, r.quality);
        ranking.push({ industry: c.key, label: c.label, quality: r.quality, kind: r.kind, basis: 'wam', netNoTycoon: r.wamNet, netTycoon: onR.wamNet, hasPrice: r.hasPrice });
      }
    } else {
      const rep = computeAdvisor({ ...state, offeredSalary: salaryFor(c.key) });
      for (const r of rep.rows) {
        if (r.industry !== c.key) continue;
        ranking.push({ industry: c.key, label: c.label, quality: r.quality, kind: r.kind, basis: 'hired', netNoTycoon: r.hireNet, netTycoon: r.hireNetTycoon, hasPrice: r.hasPrice });
      }
    }
  }
  ranking.sort((a, b) => (Math.max(b.netTycoon ?? -1e9, b.netNoTycoon ?? -1e9)) - (Math.max(a.netTycoon ?? -1e9, a.netNoTycoon ?? -1e9)));

  // Hiring break-even: RM bought at market, verdict at the effective salary.
  const breakeven: BreakevenRow[] = [];
  for (const c of INDUSTRIES) {
    if (c.type !== 'hired' || !cfg.industries[c.key]) continue;
    const mod = state[c.key] as HiredModule;
    for (let q = 1; q <= c.maxFactoryQuality; q++) {
      const price = mod.prices[q] ?? 0;
      if (price <= 0) continue;
      const def = c.factoriesData[q - 1];
      const beFor = (hasTycoon: boolean) => {
        const m = productivityMultiplier({ countryBonus: mod.countryBonus, regionBonus: mod.regionBonus, hasTycoon, pollutionRate: pollutionAt(mod.qualityPollution, q) });
        return computeBreakeven({ unitsPerSession: def.baseOutput * m, rmPerSession: (def.baseRM ?? 0) * m, finishedPrice: price, rmPrice: state[c.rmPriceKey], vat: mod.vat });
      };
      const no = beFor(false);
      const yes = beFor(true);
      breakeven.push({
        industry: c.key, label: c.label, quality: q, name: def.name,
        selfUseCapNoTyc: no.selfUseSalaryCap, selfUseCapTyc: yes.selfUseSalaryCap,
        resaleCapNoTyc: no.resaleSalaryCap, resaleCapTyc: yes.resaleSalaryCap,
        userSalary: salaryFor(c.key),
      });
    }
  }

  // Produce-vs-buy for own use (WAM/fw factory industries: food, weapons).
  const produceVsBuy: ProduceVsBuyRow[] = [];
  for (const c of INDUSTRIES) {
    if (c.type !== 'fw' || !cfg.industries[c.key]) continue;
    const mod = state[c.key] as FwModule;
    for (let q = 1; q <= c.maxFactoryQuality; q++) {
      const buyPrice = mod.prices[q] ?? 0;
      if (buyPrice <= 0) continue;
      const r = fwSingle(state, c.key, q, 'factory', cfg.hasTycoon);
      const cost = unitProductionCost(r.output, r.rmNetCost, r.workTax);
      if (cost === null) continue;
      produceVsBuy.push({ industry: c.key, label: c.label, quality: q, name: c.factoriesData[q - 1].name, produceCost: cost, buyPrice, produceIsCheaper: cost < buyPrice });
    }
  }

  // Convert vs sell raw — at the user's Tycoon setting.
  const primary = cfg.hasTycoon ? reportTyc : reportNoTyc;
  const rmVerdicts: RmVerdictRow[] = primary.rmVerdicts
    .filter((v) => cfg.industries[v.industry])
    .map((v) => ({ industry: v.industry, label: getIndustry(v.industry).label, bestQuality: v.bestQuality, sellRaw: v.sellRaw, convert: v.convert, convertIsBetter: v.convertIsBetter, hasPrice: v.hasPrice }));

  // Cost of damage (only when combat stats are configured). Full cost = weapons + energy/food.
  // One block per combat type: ground (military rank + strength) and air (aircraft rank, no strength).
  const damageCost: DamageCostBlock[] = [];
  if (cfg.combat) {
    const foodCfg = getIndustry('food');
    const foodEnergy: Record<number, number> = {};
    foodCfg.factoriesData.forEach((f) => { foodEnergy[f.quality] = f.energyPerItem ?? 0; });
    const energyCostPerUnit = cheapestEnergyCost((state.food as FwModule).prices, foodEnergy) ?? 0;

    const buildBlock = (
      label: string, strength: number, rankValue: number,
      prices: Record<number, number>, combat: Record<number, { firepower: number; durability: number }>, target: number,
    ): DamageCostBlock | null => {
      const rows: DamageCostRow[] = [];
      for (const q of Object.keys(combat).map(Number)) {
        const price = prices[q] ?? 0;
        if (price <= 0) continue;
        const { firepower, durability } = combat[q];
        const dph = damagePerHit(strength, rankValue, firepower);
        const hits = target / dph;
        const weapons = hits / durability;
        const weaponCost = weapons * price;
        const foodCost = hits * ENERGY_PER_HIT * energyCostPerUnit;
        rows.push({ quality: q, firepower, damagePerHit: dph, hitsPer100M: hits, weaponsPer100M: weapons, weaponCost, foodCost, totalCost: weaponCost + foodCost });
      }
      return rows.length ? { label, strength, rankValue, energyPerHit: ENERGY_PER_HIT, energyCostPerUnit, targetDamage: target, rows } : null;
    };

    if (cfg.combat.rankValue != null) {
      const b = buildBlock('Наземна', cfg.combat.strength, cfg.combat.rankValue, (state.weapons as FwModule).prices, WEAPON_COMBAT, cfg.combat.groundTarget ?? 100_000_000);
      if (b) damageCost.push(b);
    }
    if (cfg.combat.airRankValue != null) {
      const b = buildBlock('Авіа', 0, cfg.combat.airRankValue, (state.aircraft as HiredModule).prices, AIRCRAFT_WEAPON_COMBAT, cfg.combat.airTarget ?? 30_000);
      if (b) damageCost.push(b);
    }
  }

  // Relocation (productivity lever = region bonus; country bonus is often already maxed).
  let relocation: RelocationRow[] | null = null;
  if (flags.has('--relocate')) {
    relocation = [];
    for (const c of INDUSTRIES) {
      if (!cfg.industries[c.key]) continue;
      const entry = cfg.industries[c.key]!;
      const mod = state[c.key] as any;
      const ranked = rankRegions(BUNDLED_DATASET.regions, c.key as Industry);
      const current = ranked.find((r) => r.region.permalink === entry.region);
      const best = ranked.slice(0, 6).map((r) => ({
        region: r.region.name, country: r.region.currentCountry, regionBonus: r.totalBonus,
        isCurrent: r.region.permalink === entry.region,
      }));
      if (current && !best.some((b) => b.isCurrent)) {
        best.push({ region: current.region.name, country: current.region.currentCountry, regionBonus: current.totalBonus, isCurrent: true });
      }
      relocation.push({
        industry: c.key, label: c.label, currentRegion: entry.region,
        currentBonus: current?.totalBonus ?? mod.regionBonus, countryBonusMaxed: mod.countryBonus >= 100, best,
      });
    }
  }

  const now = stamp(new Date());
  const model: ReportModel = {
    generatedAt: now.human,
    hasTycoon: cfg.hasTycoon, wamEnabled: cfg.wamEnabled, offeredSalary: cfg.offeredSalary,
    rmBasis, salaryBasis,
    industries, ranking, breakeven, produceVsBuy, rmVerdicts, damageCost, relocation,
    dailyTotalNoTycoon: sumDaily(reportNoTyc), dailyTotalTycoon: sumDaily(reportTyc),
  };

  const html = renderReport(model);
  const outDir = resolve(__dirname, '../../reports');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `profit-${now.file}.html`);
  writeFileSync(outPath, html, 'utf8');
  process.stderr.write(`\nReport written: ${outPath}\n`);

  if (!flags.has('--no-open')) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    execFile(opener, [outPath], () => {});
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
