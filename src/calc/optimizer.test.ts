import { describe, it, expect } from 'vitest';
import { rankRegions, type OptimizerConfig } from './optimizer';
import type { CountryEconomics } from '../services/economySource';
import type { RegionCandidate } from './regionBonus';
import { INDUSTRIES } from '../data/industries';
import type { RegionEntry } from '../data/regionResources';

const foodCfg = INDUSTRIES.find(i => i.key === 'food')!;

const candidate = (id: number, country: string, bonus: number): RegionCandidate => ({
  region: { id, name: `R${id}`, originalCountry: country, currentCountry: country, resources: [] } as RegionEntry,
  regionBonus: bonus,
});

const econ = (countryBonus: number, averageSalary: number, workTaxRate: number, vat: number): CountryEconomics =>
  ({ countryBonus, averageSalary, workTaxRate, vat });

const baseConfig: OptimizerConfig = {
  industry: foodCfg,
  factoryCells: { 1: { companies: 1, workers: 0 } }, // 1 WAM Q1 factory
  rmCells: {},
  prices: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 },
  rmPrice: 0.01,
  hasTycoon: false,
  wamEnabled: true,
  offeredSalary: 0,
};

describe('rankRegions', () => {
  it('ranks higher net first and pairs region->owner economics', () => {
    const candidates = [candidate(1, 'HighTax', 50), candidate(2, 'LowTax', 50)];
    const economics = new Map<string, CountryEconomics>([
      ['HighTax', econ(20, 100, 25, 1)], // high avg salary -> high work tax
      ['LowTax', econ(20, 1, 1, 1)],     // low avg salary -> low work tax
    ]);
    const out = rankRegions(baseConfig, economics, candidates);
    expect(out[0].region.currentCountry).toBe('LowTax');
    expect(out[0].net).toBeGreaterThan(out[1].net);
  });

  it('skips candidates whose owner has no economics', () => {
    const candidates = [candidate(1, 'Known', 50), candidate(2, 'Unknown', 50)];
    const economics = new Map<string, CountryEconomics>([['Known', econ(20, 1, 1, 1)]]);
    const out = rankRegions(baseConfig, economics, candidates);
    expect(out.map(r => r.region.id)).toEqual([1]);
  });

  it('applies per-region pollution override when supplied', () => {
    const candidates = [candidate(1, 'C', 50)];
    const economics = new Map([['C', econ(20, 1, 1, 1)]]);
    const clean = rankRegions(baseConfig, economics, candidates);
    const polluted = rankRegions(baseConfig, economics, candidates, new Map([[1, { pollution: { 0: 0, 1: 50 } }]]));
    expect(polluted[0].net).toBeLessThan(clean[0].net);
  });

  it('uses the live regionBonus override instead of the candidate estimate', () => {
    // Candidate carries an offline (inflated) bonus of 75; the live detail says 15.
    const candidates = [candidate(1, 'C', 75)];
    const economics = new Map([['C', econ(20, 1, 1, 1)]]);
    const offline = rankRegions(baseConfig, economics, candidates);
    const live = rankRegions(baseConfig, economics, candidates, new Map([[1, { regionBonus: 15 }]]));
    // A lower bonus yields lower output -> lower net, and is reflected on the row.
    expect(live[0].regionBonus).toBe(15);
    expect(offline[0].regionBonus).toBe(75);
    expect(live[0].net).toBeLessThan(offline[0].net);
  });
});
