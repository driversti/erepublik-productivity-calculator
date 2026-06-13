// Shared data model for the profit report. The orchestrator (scripts/profit/run.mts)
// builds a ReportModel from live data + the golden-parity engine; render() turns it
// into a self-contained light-theme HTML page. Pure data — no DOM, no fetch.

export interface MultiplierTerms {
  countryBonus: number; // percent points
  regionBonus: number; // percent points
  tycoon: number; // 0 or 20
  pollution: number; // percent points (subtracted)
}

export interface CompanyBreakdown {
  quality: number;
  kind: 'factory' | 'plantation' | 'rm';
  name: string; // e.g. "Weapons Factory (Q7)"
  count: number; // companies owned of this quality
  basis: 'wam' | 'hired';
  multiplier: number;
  terms: MultiplierTerms;
  produces: boolean; // true = raw-material producer (plantation/rm); false = consumes RM
  unitsPerSession: number; // finished units (factory) or RM units (producer) per session
  rmPerSession: number; // RM consumed per session (factory only; 0 for producers)
  price: number; // finished price (factory) or RM price (producer)
  vat: number; // percent
  grossRevenue: number;
  netRevenue: number; // after VAT
  rmCost: number; // RM cost per session (>= 0; factories only)
  workTax: number; // per session
  salary: number; // per session (hired)
  netPerSession: number | null; // null when not runnable
  netPerDay: number | null; // netPerSession × count
  runnable: boolean; // false → idle capital (e.g. hired factory under WAM-only)
}

export interface IndustryBlock {
  key: string;
  label: string;
  icon: string;
  country: string;
  region: string;
  countryBonus: number;
  regionBonus: number;
  vat: number;
  workTax: number;
  avgSalary: number;
  pollution: Record<number, number>;
  rmName: string;
  rmPrice: number; // market price of the raw material
  ownRmCost: number | null; // your WAM/hire production cost per RM unit (null = you produce none)
  prices: Record<number, number>;
  companies: CompanyBreakdown[];
}

export interface RankRow {
  industry: string;
  label: string;
  quality: number;
  kind: 'factory' | 'rm';
  basis: 'wam' | 'hired';
  netNoTycoon: number | null;
  netTycoon: number | null;
  hasPrice: boolean;
}

export interface BreakevenRow {
  industry: string;
  label: string;
  quality: number;
  name: string;
  selfUseCap: number;
  resaleCap: number;
  avgSalary: number; // country average salary (reference)
  userSalary: number; // the salary actually used for the verdict (your offeredSalary, else avg)
}

export interface ProduceVsBuyRow {
  industry: string;
  label: string;
  quality: number;
  name: string;
  produceCost: number; // your cost per finished unit (RM at market + labour)
  buyPrice: number; // market price to buy the finished good
  produceIsCheaper: boolean; // produceCost < buyPrice
}

export interface RmVerdictRow {
  industry: string;
  label: string;
  bestQuality: number;
  sellRaw: number;
  convert: number;
  convertIsBetter: boolean;
  hasPrice: boolean;
}

export interface RelocationCandidate {
  region: string;
  country: string;
  regionBonus: number; // summed region production bonus for this industry
  isCurrent: boolean; // true = the region you are already in
}

export interface DamageCostRow {
  quality: number;
  firepower: number;
  damagePerHit: number;
  hitsPer100M: number;
  weaponsPer100M: number;
  weaponCost: number; // CC of weapons per target damage
  foodCost: number; // CC of energy/food per target damage
  totalCost: number; // weaponCost + foodCost
}

export interface DamageCostBlock {
  strength: number;
  rankValue: number;
  energyPerHit: number;
  energyCostPerUnit: number; // CC per 1 energy (cheapest food); 0 if no food price
  targetDamage: number; // normalization, e.g. 100_000_000
  rows: DamageCostRow[];
}

export interface RelocationRow {
  industry: string;
  label: string;
  currentRegion: string;
  currentBonus: number; // your current region's bonus (may be 0 if not in the seed)
  countryBonusMaxed: boolean; // true when country bonus is already +100%
  best: RelocationCandidate[];
}

export interface ReportModel {
  generatedAt: string;
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  rmBasis: 'market' | 'own'; // how factory RM is priced: market vs your own production cost
  salaryBasis: 'country-avg' | 'user'; // salary used for hired analysis
  industries: IndustryBlock[];
  ranking: RankRow[];
  breakeven: BreakevenRow[];
  produceVsBuy: ProduceVsBuyRow[];
  rmVerdicts: RmVerdictRow[];
  damageCost: DamageCostBlock | null;
  relocation: RelocationRow[] | null;
  dailyTotalNoTycoon: number;
  dailyTotalTycoon: number;
}
