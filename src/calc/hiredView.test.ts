import { describe, it, expect } from 'vitest';
import { computeHiredView } from './hiredView';
import { getIndustry } from '../data/industries';

const houses = getIndustry('houses');
const flat5 = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };

describe('computeHiredView', () => {
  it('never charges work tax; net uses Option B (produce) accounting', () => {
    const v = computeHiredView({
      industry: houses,
      factoryCells: { 5: { companies: 1, workers: 2 } },
      rmCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: flat5, rmPrice: 0, hasTycoon: false, offeredSalary: 0,
    });
    expect(v.displayNet).toBeCloseTo(v.optionBNet, 10);
    expect(v.totalCompanies).toBe(1);
    expect(v.producingRM).toBe(false);
  });

  it('counts RM companies into totalCompanies', () => {
    const v = computeHiredView({
      industry: houses,
      factoryCells: { 1: { companies: 2, workers: 0 } },
      rmCells: { 1: { companies: 3, workers: 0 } },
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: flat5, rmPrice: 1, hasTycoon: false, offeredSalary: 0,
    });
    expect(v.totalCompanies).toBe(5);
  });
});
