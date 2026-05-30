// Pure, typed reducer for the whole app. Every case returns a new AppState.
import type { AppState, FwModule, HiredModule, Holding } from './types';
import type { Cell } from '../calc/types';
import type { IndustryKey } from '../data/types';
import { createHolding } from './blank';
import { getIndustry } from '../data/industries';

const MAX_COMPANIES = 9999;

export type FwCellKind = 'factory' | 'plantation';
export type HiredCellKind = 'factory' | 'rm';
export type CellKind = 'factory' | 'plantation' | 'rm';

export type ModuleField = 'countryBonus' | 'regionBonus' | 'vat' | 'workTaxRate' | 'averageSalary';
export type SharedNumberField = 'offeredSalary' | 'frmPrice' | 'wrmPrice' | 'hrmPrice' | 'armPrice';

export type Action =
  | { type: 'REPLACE_STATE'; state: AppState }
  | { type: 'SWITCH_MODULE'; module: AppState['activeModule'] }
  | { type: 'TOGGLE_TYCOON' }
  | { type: 'TOGGLE_WAM' }
  | { type: 'SET_SHARED_FIELD'; field: SharedNumberField; value: number }
  | { type: 'SET_FACTORY_CELL'; module: IndustryKey; kind: CellKind; quality: number; field: keyof Cell; value: number }
  | { type: 'SET_MODULE_FIELD'; module: IndustryKey; field: ModuleField; value: number }
  | { type: 'SET_MODULE_PRICE'; module: IndustryKey; quality: number; value: number }
  | { type: 'SET_MODULE_QUALITY_POLLUTION'; module: IndustryKey; index: number; value: number }
  | { type: 'SET_MODULE_LOCATION'; module: IndustryKey; selectedCountryId: string; selectedRegionPermalink: string; countryBonus: number; regionBonus: number; qualityPollution: Record<number, number>; workTaxRate: number; averageSalary: number; vat: number }
  | { type: 'CREATE_HOLDING'; name: string }
  | { type: 'RENAME_HOLDING'; id: string; name: string }
  | { type: 'SWITCH_HOLDING'; id: string }
  | { type: 'DELETE_HOLDING'; id: string }
  | { type: 'CLEAR_HOLDING_COMPANIES'; id: string }
  | { type: 'SET_HOLDING_CELL'; id: string; industry: IndustryKey; kind: CellKind; quality: number; field: keyof Cell; value: number }
  | { type: 'SET_HOLDING_FIELD'; id: string; field: 'workTaxRate' | 'averageSalary'; value: number }
  | { type: 'SET_MODULE_PRICES'; module: IndustryKey; prices: Record<number, number> }
  | { type: 'SET_HOLDING_LOCATION'; id: string; selectedCountryId: string; selectedRegionPermalink: string }
  | { type: 'SET_HOLDING_MODIFIERS'; id: string; workTaxRate: number; averageSalary: number; perIndustry: Record<IndustryKey, { countryBonus: number; regionBonus: number; qualityPollution: Record<number, number>; vat: number }> };

function clampCompanies(v: number): number {
  return Math.max(0, Math.min(MAX_COMPANIES, Math.floor(v)));
}

// maxEmployees for a (module, kind, quality), used to cap workers at companies*max.
function maxEmployeesOf(industry: IndustryKey, kind: CellKind, quality: number): number {
  const cfg = getIndustry(industry);
  const data = kind === 'factory' ? cfg.factoriesData : cfg.rmData;
  const row = data.find((d) => d.quality === quality);
  return row ? row.maxEmployees : 0;
}

// Apply a companies/workers change to a single Cell, enforcing clamps.
function updateCell(cell: Cell, field: keyof Cell, value: number, maxEmp: number): Cell {
  const next: Cell = { ...cell };
  if (field === 'companies') {
    next.companies = clampCompanies(value);
    const cap = next.companies * maxEmp;
    if (next.workers > cap) next.workers = cap;
  } else {
    const cap = next.companies * maxEmp;
    next.workers = Math.max(0, Math.min(cap, Math.floor(value)));
  }
  return next;
}

// Read the cells container off an fw module for a given kind.
function fwCell(mod: FwModule, kind: CellKind, quality: number): Cell {
  if (kind === 'plantation') return mod.plantations[quality] ?? { companies: 0, workers: 0 };
  return mod[quality] ?? { companies: 0, workers: 0 };
}

function setFwCell(mod: FwModule, kind: CellKind, quality: number, cell: Cell): FwModule {
  if (kind === 'plantation') {
    return { ...mod, plantations: { ...mod.plantations, [quality]: cell } };
  }
  return { ...mod, [quality]: cell };
}

function setHiredCell(mod: HiredModule, kind: CellKind, quality: number, cell: Cell): HiredModule {
  const group = kind === 'factory' ? 'factories' : 'rm';
  return { ...mod, [group]: { ...mod[group], [quality]: cell } };
}

function isFw(industry: IndustryKey): boolean {
  return getIndustry(industry).type === 'fw';
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.state;

    case 'SWITCH_MODULE':
      return { ...state, activeModule: action.module };

    case 'TOGGLE_TYCOON':
      return { ...state, hasTycoon: !state.hasTycoon };

    case 'TOGGLE_WAM':
      return { ...state, wamEnabled: !state.wamEnabled };

    case 'SET_SHARED_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_FACTORY_CELL': {
      const { module, kind, quality, field, value } = action;
      const maxEmp = maxEmployeesOf(module, kind, quality);
      if (isFw(module)) {
        const mod = state[module] as FwModule;
        const cell = updateCell(fwCell(mod, kind, quality), field, value, maxEmp);
        return { ...state, [module]: setFwCell(mod, kind, quality, cell) };
      }
      const mod = state[module] as HiredModule;
      const group = kind === 'factory' ? 'factories' : 'rm';
      const cur = mod[group][quality] ?? { companies: 0, workers: 0 };
      const cell = updateCell(cur, field, value, maxEmp);
      return { ...state, [module]: setHiredCell(mod, kind, quality, cell) };
    }

    case 'SET_MODULE_FIELD': {
      // Manual edit de-syncs the location (clears country/region → "Manual").
      const mod = state[action.module];
      return {
        ...state,
        [action.module]: { ...mod, [action.field]: action.value, selectedCountryId: '', selectedRegionPermalink: '' },
      };
    }

    case 'SET_MODULE_PRICE': {
      const mod = state[action.module];
      return {
        ...state,
        [action.module]: { ...mod, prices: { ...mod.prices, [action.quality]: action.value } },
      };
    }

    case 'SET_MODULE_PRICES': {
      // Bulk price update from a live sync — merges parsed Q-prices, keeps location.
      const mod = state[action.module];
      return {
        ...state,
        [action.module]: { ...mod, prices: { ...mod.prices, ...action.prices } },
      };
    }

    case 'SET_MODULE_QUALITY_POLLUTION': {
      const mod = state[action.module];
      return {
        ...state,
        [action.module]: {
          ...mod,
          qualityPollution: { ...mod.qualityPollution, [action.index]: action.value },
          selectedCountryId: '',
          selectedRegionPermalink: '',
        },
      };
    }

    case 'SET_MODULE_LOCATION': {
      const mod = state[action.module];
      return {
        ...state,
        [action.module]: {
          ...mod,
          selectedCountryId: action.selectedCountryId,
          selectedRegionPermalink: action.selectedRegionPermalink,
          countryBonus: action.countryBonus,
          regionBonus: action.regionBonus,
          qualityPollution: { ...action.qualityPollution },
          workTaxRate: action.workTaxRate,
          averageSalary: action.averageSalary,
          vat: action.vat,
        },
      };
    }

    case 'CREATE_HOLDING': {
      const seq = (state.holdingSeq || 0) + 1;
      const holding = createHolding(seq, action.name);
      return { ...state, holdingSeq: seq, holdings: [...state.holdings, holding], activeHoldingId: holding.id };
    }

    case 'RENAME_HOLDING':
      return {
        ...state,
        holdings: state.holdings.map((h) => (h.id === action.id ? { ...h, name: action.name } : h)),
      };

    case 'SWITCH_HOLDING':
      return { ...state, activeHoldingId: action.id };

    case 'DELETE_HOLDING': {
      const holdings = state.holdings.filter((h) => h.id !== action.id);
      const activeHoldingId = state.activeHoldingId === action.id ? (holdings[0]?.id ?? '') : state.activeHoldingId;
      return { ...state, holdings, activeHoldingId };
    }

    case 'CLEAR_HOLDING_COMPANIES': {
      return {
        ...state,
        holdings: state.holdings.map((h) => {
          if (h.id !== action.id) return h;
          const cleared = createHolding(0, h.name);
          // keep id, name, location, and per-industry bonuses; zero only the cells
          return {
            ...h,
            industries: {
              food: { ...h.industries.food, ...zeroFwCells(cleared.industries.food) },
              weapons: { ...h.industries.weapons, ...zeroFwCells(cleared.industries.weapons) },
              houses: { ...h.industries.houses, ...zeroHiredCells(cleared.industries.houses) },
              aircraft: { ...h.industries.aircraft, ...zeroHiredCells(cleared.industries.aircraft) },
            },
          };
        }),
      };
    }

    case 'SET_HOLDING_CELL': {
      const { id, industry, kind, quality, field, value } = action;
      const maxEmp = maxEmployeesOf(industry, kind, quality);
      return {
        ...state,
        holdings: state.holdings.map((h) => {
          if (h.id !== id) return h;
          const inds = h.industries;
          if (isFw(industry)) {
            const ind = inds[industry] as Holding['industries']['food'];
            const cur = kind === 'plantation' ? (ind.plantations[quality] ?? { companies: 0, workers: 0 }) : (ind[quality] ?? { companies: 0, workers: 0 });
            const cell = updateCell(cur, field, value, maxEmp);
            const nextInd = kind === 'plantation'
              ? { ...ind, plantations: { ...ind.plantations, [quality]: cell } }
              : { ...ind, [quality]: cell };
            return { ...h, industries: { ...inds, [industry]: nextInd } };
          }
          const ind = inds[industry] as Holding['industries']['houses'];
          const group = kind === 'factory' ? 'factories' : 'rm';
          const cur = ind[group][quality] ?? { companies: 0, workers: 0 };
          const cell = updateCell(cur, field, value, maxEmp);
          const nextInd = { ...ind, [group]: { ...ind[group], [quality]: cell } };
          return { ...h, industries: { ...inds, [industry]: nextInd } };
        }),
      };
    }

    case 'SET_HOLDING_FIELD':
      return {
        ...state,
        holdings: state.holdings.map((h) => (h.id === action.id ? { ...h, [action.field]: action.value } : h)),
      };

    case 'SET_HOLDING_LOCATION':
      return {
        ...state,
        holdings: state.holdings.map((h) =>
          h.id === action.id
            ? { ...h, selectedCountryId: action.selectedCountryId, selectedRegionPermalink: action.selectedRegionPermalink }
            : h,
        ),
      };

    case 'SET_HOLDING_MODIFIERS':
      // Apply scraped modifiers to every industry of one holding at once
      // (mirrors legacy syncHoldingModifiers). Holding-level work tax + salary too.
      return {
        ...state,
        holdings: state.holdings.map((h) => {
          if (h.id !== action.id) return h;
          const p = action.perIndustry;
          const industries: Holding['industries'] = {
            food: { ...h.industries.food, countryBonus: p.food.countryBonus, regionBonus: p.food.regionBonus, qualityPollution: { ...p.food.qualityPollution }, vat: p.food.vat },
            weapons: { ...h.industries.weapons, countryBonus: p.weapons.countryBonus, regionBonus: p.weapons.regionBonus, qualityPollution: { ...p.weapons.qualityPollution }, vat: p.weapons.vat },
            houses: { ...h.industries.houses, countryBonus: p.houses.countryBonus, regionBonus: p.houses.regionBonus, qualityPollution: { ...p.houses.qualityPollution }, vat: p.houses.vat },
            aircraft: { ...h.industries.aircraft, countryBonus: p.aircraft.countryBonus, regionBonus: p.aircraft.regionBonus, qualityPollution: { ...p.aircraft.qualityPollution }, vat: p.aircraft.vat },
          };
          return { ...h, workTaxRate: action.workTaxRate, averageSalary: action.averageSalary, industries };
        }),
      };

    default:
      return state;
  }
}

function zeroFwCells(blank: Holding['industries']['food']) {
  const out: Record<number, Cell> & { plantations: Record<number, Cell> } = { plantations: {} } as never;
  for (let q = 1; q <= 7; q++) out[q] = { companies: 0, workers: 0 };
  for (let q = 1; q <= 5; q++) out.plantations[q] = { companies: 0, workers: 0 };
  void blank;
  return out;
}

function zeroHiredCells(blank: Holding['industries']['houses']) {
  const factories: Record<number, Cell> = {};
  const rm: Record<number, Cell> = {};
  for (let q = 1; q <= 5; q++) {
    factories[q] = { companies: 0, workers: 0 };
    rm[q] = { companies: 0, workers: 0 };
  }
  void blank;
  return { factories, rm };
}
