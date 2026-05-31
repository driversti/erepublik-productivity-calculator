// Blank-state builders, ported from app.js (blankFwIndustry / blankHiredIndustry
// / createHolding) plus the top-level state literal.
import type {
  AppState, FwModule, HiredModule, Holding, HoldingFwIndustry, HoldingHiredIndustry, OptimizerState,
} from './types';

export function blankFwModule(): FwModule {
  const m = {} as FwModule;
  for (let q = 1; q <= 7; q++) m[q] = { companies: 0, workers: 0 };
  m.plantations = {};
  for (let q = 1; q <= 5; q++) m.plantations[q] = { companies: 0, workers: 0 };
  m.countryBonus = 100;
  m.regionBonus = 0;
  m.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  m.vat = 1.0;
  m.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  m.selectedCountryId = '';
  m.selectedRegionPermalink = '';
  m.workTaxRate = 1.0;
  m.averageSalary = 0.0;
  return m;
}

export function blankHiredModule(): HiredModule {
  const m = { factories: {}, rm: {} } as HiredModule;
  for (let q = 1; q <= 5; q++) {
    m.factories[q] = { companies: 0, workers: 0 };
    m.rm[q] = { companies: 0, workers: 0 };
  }
  m.countryBonus = 100;
  m.regionBonus = 0;
  m.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  m.vat = 1.0;
  m.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  m.selectedCountryId = '';
  m.selectedRegionPermalink = '';
  m.workTaxRate = 1.0;
  m.averageSalary = 0.0;
  return m;
}

function blankHoldingFw(): HoldingFwIndustry {
  const ind = {} as HoldingFwIndustry;
  for (let q = 1; q <= 7; q++) ind[q] = { companies: 0, workers: 0 };
  ind.plantations = {};
  for (let q = 1; q <= 5; q++) ind.plantations[q] = { companies: 0, workers: 0 };
  ind.countryBonus = 100;
  ind.regionBonus = 0;
  ind.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  ind.vat = 1.0;
  return ind;
}

function blankHoldingHired(): HoldingHiredIndustry {
  const ind = { factories: {}, rm: {} } as HoldingHiredIndustry;
  for (let q = 1; q <= 5; q++) {
    ind.factories[q] = { companies: 0, workers: 0 };
    ind.rm[q] = { companies: 0, workers: 0 };
  }
  ind.countryBonus = 100;
  ind.regionBonus = 0;
  ind.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ind.vat = 1.0;
  return ind;
}

export function blankOptimizer(): OptimizerState {
  return {
    industry: 'food',
    threshold: 20,
    maxCandidates: 60,
    topN: 15,
    results: [],
    baselineNet: null,
    skippedCount: 0,
    fetchedAt: null,
    ownersSnapshot: null,
  };
}

// Build a holding with id "h<seq>". Caller is responsible for bumping the seq.
export function createHolding(seq: number, name: string): Holding {
  return {
    id: 'h' + seq,
    name,
    selectedCountryId: '',
    selectedRegionPermalink: '',
    workTaxRate: 1.0,
    averageSalary: 0.0,
    industries: {
      food: blankHoldingFw(),
      weapons: blankHoldingFw(),
      houses: blankHoldingHired(),
      aircraft: blankHoldingHired(),
    },
  };
}

export function initialState(): AppState {
  return {
    activeModule: 'food',
    hasTycoon: false,
    wamEnabled: true,
    offeredSalary: 0,
    frmPrice: 0,
    wrmPrice: 0,
    hrmPrice: 0,
    armPrice: 0,
    food: blankFwModule(),
    weapons: blankFwModule(),
    houses: blankHiredModule(),
    aircraft: blankHiredModule(),
    holdings: [],
    holdingSeq: 0,
    activeHoldingId: '',
    optimizer: blankOptimizer(),
  };
}
