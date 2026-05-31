// localStorage load/migrate/save, ported from app.js (STORAGE_KEY, loadState,
// saveState). Same key + same shape so existing user data survives the cutover.
import type { AppState, FwModule, HiredModule, Holding } from './types';
import type { Cell } from '../calc/types';
import type { FactoryDef, IndustryKey } from '../data/types';
import { initialState, createHolding, blankOptimizer } from './blank';
import { getIndustry } from '../data/industries';

export const STORAGE_KEY = 'erep_calculator_food_factories_v12';

const MAX_COMPANIES = 9999;

function maxEmpOf(data: FactoryDef[], q: number): number {
  const row = data.find((x) => x.quality === q);
  return row ? row.maxEmployees || 0 : 0;
}

// Migrate one stored cell (number legacy form OR {companies,workers}) into a Cell.
function migrateCell(src: unknown, maxEmp: number): Cell {
  let companies = 0;
  let workers = 0;
  if (typeof src === 'number') {
    companies = Math.max(0, Math.floor(src));
  } else if (src && typeof src === 'object') {
    const o = src as { companies?: unknown; workers?: unknown };
    companies = typeof o.companies === 'number' ? Math.max(0, Math.floor(o.companies)) : 0;
    workers = typeof o.workers === 'number' ? Math.max(0, Math.floor(o.workers)) : 0;
  }
  companies = Math.min(companies, MAX_COMPANIES);
  const cap = companies * maxEmp;
  if (workers > cap) workers = cap;
  return { companies, workers };
}

function isNum(v: unknown): v is number {
  return typeof v === 'number';
}

// Copy a numeric value from a loose record into a target field if present.
function copyNum(src: Record<string, unknown>, key: string, set: (v: number) => void): void {
  const v = src[key];
  if (isNum(v)) set(v);
}

// Copy a numeric map (e.g. prices / qualityPollution) index-by-index.
function copyNumMap(src: Record<string, unknown> | undefined, from: number, to: number, set: (i: number, v: number) => void): void {
  if (!src || typeof src !== 'object') return;
  for (let i = from; i <= to; i++) {
    const v = src[i];
    if (isNum(v)) set(i, v);
  }
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : undefined;
}

function loadFwModule(target: FwModule, m: Record<string, unknown>, key: IndustryKey): void {
  const cfg = getIndustry(key);
  for (let q = 1; q <= 7; q++) {
    if (m[q] !== undefined) target[q] = migrateCell(m[q], maxEmpOf(cfg.factoriesData, q));
  }
  const plant = asRecord(m.plantations);
  if (plant) {
    for (let q = 1; q <= 5; q++) {
      if (plant[q] !== undefined) target.plantations[q] = migrateCell(plant[q], maxEmpOf(cfg.rmData, q));
    }
  }
  copyNum(m, 'countryBonus', (v) => (target.countryBonus = v));
  copyNum(m, 'regionBonus', (v) => (target.regionBonus = v));
  copyNum(m, 'pollution', (v) => (target.pollution = v));
  copyNumMap(asRecord(m.qualityPollution), 0, 7, (i, v) => (target.qualityPollution[i] = v));
  copyNumMap(asRecord(m.prices), 1, 7, (i, v) => (target.prices[i] = v));
}

function loadHiredModule(target: HiredModule, pm: Record<string, unknown>, facData: FactoryDef[], rmData: FactoryDef[]): void {
  const loadGroup = (groupKey: 'factories' | 'rm', data: FactoryDef[]) => {
    const g = asRecord(pm[groupKey]);
    if (!g) return;
    for (let q = 1; q <= 5; q++) {
      const src = g[q];
      if (src && typeof src === 'object') target[groupKey][q] = migrateCell(src, maxEmpOf(data, q));
    }
  };
  loadGroup('factories', facData);
  loadGroup('rm', rmData);
  copyNum(pm, 'countryBonus', (v) => (target.countryBonus = v));
  copyNum(pm, 'regionBonus', (v) => (target.regionBonus = v));
  copyNum(pm, 'pollution', (v) => (target.pollution = v));
  copyNumMap(asRecord(pm.qualityPollution), 0, 5, (i, v) => (target.qualityPollution[i] = v));
  copyNumMap(asRecord(pm.prices), 1, 5, (i, v) => (target.prices[i] = v));
}

function loadHoldings(parsed: Record<string, unknown>, state: AppState): void {
  if (isNum(parsed.holdingSeq)) state.holdingSeq = parsed.holdingSeq;
  if (typeof parsed.activeHoldingId === 'string') state.activeHoldingId = parsed.activeHoldingId;
  if (!Array.isArray(parsed.holdings)) return;

  state.holdings = (parsed.holdings as unknown[]).map((raw): Holding => {
    const ph = raw as Record<string, unknown>;
    const h = createHolding(0, typeof ph.name === 'string' ? ph.name : 'Holding');
    if (typeof ph.id === 'string') h.id = ph.id;
    if (typeof ph.selectedCountryId === 'string' || typeof ph.selectedCountryId === 'number') h.selectedCountryId = String(ph.selectedCountryId);
    if (typeof ph.selectedRegionPermalink === 'string') h.selectedRegionPermalink = ph.selectedRegionPermalink;
    copyNum(ph, 'workTaxRate', (v) => (h.workTaxRate = v));
    copyNum(ph, 'averageSalary', (v) => (h.averageSalary = v));
    const pind = asRecord(ph.industries) ?? {};

    (['food', 'weapons'] as const).forEach((key) => {
      const src = asRecord(pind[key]);
      if (!src) return;
      const ind = h.industries[key];
      const cfg = getIndustry(key);
      for (let q = 1; q <= 7; q++) if (src[q]) ind[q] = migrateCell(src[q], maxEmpOf(cfg.factoriesData, q));
      const plant = asRecord(src.plantations);
      if (plant) for (let q = 1; q <= 5; q++) if (plant[q]) ind.plantations[q] = migrateCell(plant[q], maxEmpOf(cfg.rmData, q));
      copyNum(src, 'countryBonus', (v) => (ind.countryBonus = v));
      copyNum(src, 'regionBonus', (v) => (ind.regionBonus = v));
      copyNumMap(asRecord(src.qualityPollution), 0, 7, (i, v) => (ind.qualityPollution[i] = v));
      copyNum(src, 'vat', (v) => (ind.vat = v));
    });

    (['houses', 'aircraft'] as const).forEach((key) => {
      const src = asRecord(pind[key]);
      if (!src) return;
      const ind = h.industries[key];
      const cfg = getIndustry(key);
      const facs = asRecord(src.factories);
      if (facs) for (let q = 1; q <= 5; q++) if (facs[q]) ind.factories[q] = migrateCell(facs[q], maxEmpOf(cfg.factoriesData, q));
      const rm = asRecord(src.rm);
      if (rm) for (let q = 1; q <= 5; q++) if (rm[q]) ind.rm[q] = migrateCell(rm[q], maxEmpOf(cfg.rmData, q));
      copyNum(src, 'countryBonus', (v) => (ind.countryBonus = v));
      copyNum(src, 'regionBonus', (v) => (ind.regionBonus = v));
      copyNumMap(asRecord(src.qualityPollution), 0, 5, (i, v) => (ind.qualityPollution[i] = v));
      copyNum(src, 'vat', (v) => (ind.vat = v));
    });

    return h;
  });
}

export function loadState(): AppState {
  const state = initialState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return state;
    const parsed = JSON.parse(stored) as Record<string, unknown>;

    if (typeof parsed.activeModule === 'string') state.activeModule = parsed.activeModule as AppState['activeModule'];
    if (typeof parsed.hasTycoon === 'boolean') state.hasTycoon = parsed.hasTycoon;
    if (typeof parsed.wamEnabled === 'boolean') state.wamEnabled = parsed.wamEnabled;
    copyNum(parsed, 'offeredSalary', (v) => (state.offeredSalary = v));
    copyNum(parsed, 'frmPrice', (v) => (state.frmPrice = v));
    copyNum(parsed, 'wrmPrice', (v) => (state.wrmPrice = v));
    copyNum(parsed, 'hrmPrice', (v) => (state.hrmPrice = v));
    copyNum(parsed, 'armPrice', (v) => (state.armPrice = v));

    const food = asRecord(parsed.food);
    if (food) loadFwModule(state.food, food, 'food');
    const weapons = asRecord(parsed.weapons);
    if (weapons) loadFwModule(state.weapons, weapons, 'weapons');
    const houses = asRecord(parsed.houses);
    if (houses) loadHiredModule(state.houses, houses, getIndustry('houses').factoriesData, getIndustry('houses').rmData);
    const aircraft = asRecord(parsed.aircraft);
    if (aircraft) loadHiredModule(state.aircraft, aircraft, getIndustry('aircraft').factoriesData, getIndustry('aircraft').rmData);

    // Per-module location & country metrics, migrating any legacy top-level values.
    const legacyCountry = (typeof parsed.selectedCountryId === 'string' || typeof parsed.selectedCountryId === 'number') ? String(parsed.selectedCountryId) : '';
    const legacyRegion = typeof parsed.selectedRegionPermalink === 'string' ? parsed.selectedRegionPermalink : '';
    const legacyWorkTax = isNum(parsed.workTaxRate) ? parsed.workTaxRate : null;
    const legacyAvgSalary = isNum(parsed.averageSalary) ? parsed.averageSalary : null;
    const legacyVat = isNum(parsed.vat) ? parsed.vat : null;
    (['food', 'weapons', 'houses', 'aircraft'] as const).forEach((key) => {
      const pm = asRecord(parsed[key]) ?? {};
      const target = state[key];
      const cid = pm.selectedCountryId;
      if (typeof cid === 'string' || typeof cid === 'number') target.selectedCountryId = String(cid);
      else if (legacyCountry) target.selectedCountryId = legacyCountry;
      if (typeof pm.selectedRegionPermalink === 'string') target.selectedRegionPermalink = pm.selectedRegionPermalink;
      else if (legacyRegion) target.selectedRegionPermalink = legacyRegion;
      if (isNum(pm.workTaxRate)) target.workTaxRate = pm.workTaxRate;
      else if (legacyWorkTax !== null) target.workTaxRate = legacyWorkTax;
      if (isNum(pm.averageSalary)) target.averageSalary = pm.averageSalary;
      else if (legacyAvgSalary !== null) target.averageSalary = legacyAvgSalary;
      if (isNum(pm.vat)) target.vat = pm.vat;
      else if (legacyVat !== null) target.vat = legacyVat;
    });

    loadHoldings(parsed, state);

    // Optimizer params (no migration needed for older shapes — blankOptimizer()
    // is already in state; just overwrite with any stored params).
    const opt = asRecord(parsed.optimizer);
    if (opt) {
      const o = blankOptimizer();
      if (typeof opt.industry === 'string') o.industry = opt.industry as AppState['optimizer']['industry'];
      copyNum(opt, 'threshold', (v) => (o.threshold = v));
      copyNum(opt, 'maxCandidates', (v) => (o.maxCandidates = v));
      copyNum(opt, 'topN', (v) => (o.topN = v));
      // volatile fields (results/baselineNet/skippedCount/fetchedAt) are NOT loaded —
      // they are always re-initialised to defaults (empty/null) on startup.
      state.optimizer = o;
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return state;
}

export function saveState(state: AppState): void {
  try {
    // Persist optimizer params only; strip volatile run-time fields so
    // localStorage stays lean (results arrays can be large).
    const { results: _r, baselineNet: _bn, skippedCount: _sc, fetchedAt: _fa, ...optimizerParams } = state.optimizer;
    const serialisable = { ...state, optimizer: optimizerParams };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}
