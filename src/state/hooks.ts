// Domain facade hooks. Components use these instead of touching dispatch
// directly — so a future swap to another store only rewrites this file.
import { useAppState } from './StateContext';
import type { AppState, FwModule, HiredModule, Holding } from './types';
import type { Cell, Cells } from '../calc/types';
import type { IndustryKey } from '../data/types';
import { getIndustry, INDUSTRIES } from '../data/industries';
import { computeIndustryView, type IndustryView } from '../calc/strategy';
import { computeHiredView, type HiredView } from '../calc/hiredView';
import { computeFwIndustry, computeHiredIndustry } from '../calc/industry';
import { sumHolding, type HoldingTotals } from '../calc/holding';
import type { CellKind, ModuleField, SharedNumberField } from './reducer';

export function useActiveModule(): AppState['activeModule'] {
  return useAppState().state.activeModule;
}

export function useSwitchModule(): (m: AppState['activeModule']) => void {
  const { dispatch } = useAppState();
  return (module) => dispatch({ type: 'SWITCH_MODULE', module });
}

export function useSharedFlags() {
  const { state, dispatch } = useAppState();
  return {
    hasTycoon: state.hasTycoon,
    wamEnabled: state.wamEnabled,
    offeredSalary: state.offeredSalary,
    frmPrice: state.frmPrice,
    wrmPrice: state.wrmPrice,
    hrmPrice: state.hrmPrice,
    armPrice: state.armPrice,
    toggleTycoon: () => dispatch({ type: 'TOGGLE_TYCOON' }),
    toggleWam: () => dispatch({ type: 'TOGGLE_WAM' }),
    setShared: (field: SharedNumberField, value: number) => dispatch({ type: 'SET_SHARED_FIELD', field, value }),
  };
}

export function useModule(key: IndustryKey): FwModule | HiredModule {
  return useAppState().state[key];
}

// Extract a numeric-keyed Cells map from an fw module's factory cells.
function fwFactoryCells(mod: FwModule, maxQ: number): Cells {
  const out: Cells = {};
  for (let q = 1; q <= maxQ; q++) out[q] = mod[q] ?? { companies: 0, workers: 0 };
  return out;
}

export function useIndustryView(key: IndustryKey): IndustryView {
  const { state } = useAppState();
  const cfg = getIndustry(key);
  const mod = state[key] as FwModule;
  // Both useIndustryView and useHiredView are called unconditionally by the view
  // (Rules of Hooks); the irrelevant one sees a wrong-shaped module, so guard the
  // cell containers — its result is ignored anyway.
  return computeIndustryView({
    industry: cfg,
    factoryCells: fwFactoryCells(mod, cfg.maxFactoryQuality),
    plantationCells: mod.plantations ?? {},
    countryBonus: mod.countryBonus,
    regionBonus: mod.regionBonus,
    qualityPollution: mod.qualityPollution,
    vat: mod.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon: state.hasTycoon,
    wamEnabled: state.wamEnabled,
    offeredSalary: state.offeredSalary,
    workTaxRate: mod.workTaxRate,
    averageSalary: mod.averageSalary,
  });
}

export function useHiredView(key: IndustryKey): HiredView {
  const { state } = useAppState();
  const cfg = getIndustry(key);
  const mod = state[key] as HiredModule;
  return computeHiredView({
    industry: cfg,
    factoryCells: mod.factories ?? {},
    rmCells: mod.rm ?? {},
    countryBonus: mod.countryBonus,
    regionBonus: mod.regionBonus,
    qualityPollution: mod.qualityPollution,
    vat: mod.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon: state.hasTycoon,
    offeredSalary: state.offeredSalary,
  });
}

export function useSetFactoryCell(): (module: IndustryKey, kind: CellKind, quality: number, field: keyof Cell, value: number) => void {
  const { dispatch } = useAppState();
  return (module, kind, quality, field, value) => dispatch({ type: 'SET_FACTORY_CELL', module, kind, quality, field, value });
}

export function useSetModuleField(): (module: IndustryKey, field: ModuleField, value: number) => void {
  const { dispatch } = useAppState();
  return (module, field, value) => dispatch({ type: 'SET_MODULE_FIELD', module, field, value });
}

export function useSetModulePrice(): (module: IndustryKey, quality: number, value: number) => void {
  const { dispatch } = useAppState();
  return (module, quality, value) => dispatch({ type: 'SET_MODULE_PRICE', module, quality, value });
}

export interface HoldingsApi {
  holdings: Holding[];
  activeHoldingId: string;
  activeHolding: Holding | null;
  create: (name: string) => void;
  rename: (id: string, name: string) => void;
  switchTo: (id: string) => void;
  remove: (id: string) => void;
  clearCompanies: (id: string) => void;
  setCell: (id: string, industry: IndustryKey, kind: CellKind, quality: number, field: keyof Cell, value: number) => void;
  setField: (id: string, field: 'workTaxRate' | 'averageSalary', value: number) => void;
}

export function useHoldings(): HoldingsApi {
  const { state, dispatch } = useAppState();
  return {
    holdings: state.holdings,
    activeHoldingId: state.activeHoldingId,
    activeHolding: state.holdings.find((h) => h.id === state.activeHoldingId) ?? null,
    create: (name) => dispatch({ type: 'CREATE_HOLDING', name }),
    rename: (id, name) => dispatch({ type: 'RENAME_HOLDING', id, name }),
    switchTo: (id) => dispatch({ type: 'SWITCH_HOLDING', id }),
    remove: (id) => dispatch({ type: 'DELETE_HOLDING', id }),
    clearCompanies: (id) => dispatch({ type: 'CLEAR_HOLDING_COMPANIES', id }),
    setCell: (id, industry, kind, quality, field, value) => dispatch({ type: 'SET_HOLDING_CELL', id, industry, kind, quality, field, value }),
    setField: (id, field, value) => dispatch({ type: 'SET_HOLDING_FIELD', id, field, value }),
  };
}

// Compute one industry's result inside a holding (selects fw vs hired adapter).
// Ported from app.js computeHoldingIndustry: prices come from the matching
// top-level module, RM price from the shared field, work-tax/avg-salary from
// the holding (not the module).
export function computeHoldingIndustry(state: AppState, holding: Holding, key: IndustryKey) {
  const cfg = getIndustry(key);
  const ind = holding.industries[key];
  const mod = state[key];
  if (cfg.type === 'fw') {
    const fw = ind as Holding['industries']['food'];
    const factoryCells: Cells = {};
    for (let q = 1; q <= 7; q++) factoryCells[q] = fw[q] ?? { companies: 0, workers: 0 };
    return computeFwIndustry({
      factoriesData: cfg.factoriesData,
      plantationsData: cfg.rmData,
      factoryCells,
      plantationCells: fw.plantations,
      countryBonus: fw.countryBonus,
      regionBonus: fw.regionBonus,
      qualityPollution: fw.qualityPollution,
      vat: fw.vat,
      prices: mod.prices,
      rmPrice: state[cfg.rmPriceKey],
      hasTycoon: state.hasTycoon,
      wamEnabled: state.wamEnabled,
      offeredSalary: state.offeredSalary,
      workTaxRate: holding.workTaxRate,
      averageSalary: holding.averageSalary,
    });
  }
  const hired = ind as Holding['industries']['houses'];
  return computeHiredIndustry({
    factoriesData: cfg.factoriesData,
    rmData: cfg.rmData,
    factoryCells: hired.factories,
    rmCells: hired.rm,
    countryBonus: hired.countryBonus,
    regionBonus: hired.regionBonus,
    qualityPollution: hired.qualityPollution,
    vat: hired.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon: state.hasTycoon,
    offeredSalary: state.offeredSalary,
  });
}

export function useHoldingSummary(holding: Holding): HoldingTotals {
  const { state } = useAppState();
  const results = INDUSTRIES.map((cfg) => ({
    key: cfg.key,
    label: cfg.label,
    result: computeHoldingIndustry(state, holding, cfg.key),
  }));
  return sumHolding(results);
}

// Read a single industry's per-quality cell out of a holding (for the view).
export function holdingFactoryCell(holding: Holding, key: IndustryKey, kind: CellKind, quality: number): Cell {
  const cfg = getIndustry(key);
  const ind = holding.industries[key];
  if (cfg.type === 'fw') {
    const fw = ind as Holding['industries']['food'];
    return kind === 'plantation' ? (fw.plantations[quality] ?? { companies: 0, workers: 0 }) : (fw[quality] ?? { companies: 0, workers: 0 });
  }
  const hired = ind as Holding['industries']['houses'];
  const group = kind === 'factory' ? 'factories' : 'rm';
  return hired[group][quality] ?? { companies: 0, workers: 0 };
}
