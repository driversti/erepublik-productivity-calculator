import type { Cell, Cells } from '../calc/types';
import type { IndustryKey } from '../data/types';
import type { RankedRegion } from '../calc/optimizer';

// A food/weapons module: factory cells keyed 1..7 live directly on the object
// (numeric keys), alongside the named fields below. This mirrors the legacy
// state shape exactly so v11 localStorage round-trips.
export interface FwModule {
  [quality: number]: Cell; // factory cells Q1..Q7
  plantations: Cells; // Q1..Q5
  countryBonus: number;
  regionBonus: number;
  pollution?: number; // legacy flat pollution fallback
  qualityPollution: Record<number, number>; // index 0 = RM, 1..7 = factories
  vat: number;
  prices: Record<number, number>; // Q1..Q7
  selectedCountryId: string;
  selectedRegionPermalink: string;
  workTaxRate: number;
  averageSalary: number;
}

// A houses/aircraft module: factories + raw-material companies in named groups.
export interface HiredModule {
  factories: Cells; // Q1..Q5
  rm: Cells; // Q1..Q5
  countryBonus: number;
  regionBonus: number;
  pollution?: number;
  qualityPollution: Record<number, number>; // index 0 = RM, 1..5 = factories
  vat: number;
  prices: Record<number, number>; // Q1..Q5
  selectedCountryId: string;
  selectedRegionPermalink: string;
  workTaxRate: number;
  averageSalary: number;
}

export interface HoldingFwIndustry {
  [quality: number]: Cell;
  plantations: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
}

export interface HoldingHiredIndustry {
  factories: Cells;
  rm: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
}

export interface Holding {
  id: string;
  name: string;
  selectedCountryId: string;
  selectedRegionPermalink: string;
  workTaxRate: number;
  averageSalary: number;
  industries: {
    food: HoldingFwIndustry;
    weapons: HoldingFwIndustry;
    houses: HoldingHiredIndustry;
    aircraft: HoldingHiredIndustry;
  };
}

export interface OptimizerState {
  industry: IndustryKey;
  threshold: number;
  maxCandidates: number;
  topN: number;
  results: RankedRegion[];
  baselineNet: number | null;
  skippedCount: number;
  fetchedAt: string | null;
}

export type ActiveModule = IndustryKey | 'holdings' | 'regions' | 'optimizer';

export interface AppState {
  activeModule: ActiveModule;
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  frmPrice: number;
  wrmPrice: number;
  hrmPrice: number;
  armPrice: number;
  food: FwModule;
  weapons: FwModule;
  houses: HiredModule;
  aircraft: HiredModule;
  holdings: Holding[];
  holdingSeq: number;
  activeHoldingId: string;
  optimizer: OptimizerState;
}
