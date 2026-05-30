import { describe, it, expect } from 'vitest';
import { computeFwIndustry, computeHiredIndustry } from './industry';
import { getIndustry } from '../data/industries';

const food = getIndustry('food');
const houses = getIndustry('houses');
const flatPrices7 = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 };
const flatPrices5 = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };

describe('computeFwIndustry', () => {
  it('returns zeros for empty input', () => {
    const r = computeFwIndustry({
      factoriesData: food.factoriesData, plantationsData: food.rmData,
      factoryCells: {}, plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 1,
      prices: flatPrices7, rmPrice: 0.01,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 1, averageSalary: 0,
    });
    expect(r.net).toBe(0);
    expect(r.companies).toBe(0);
  });

  it('one Q1 food factory at 100% country bonus, WAM on (mult=2)', () => {
    const r = computeFwIndustry({
      factoriesData: food.factoriesData, plantationsData: food.rmData,
      factoryCells: { 1: { companies: 1, workers: 0 } }, plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: flatPrices7, rmPrice: 0,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0,
    });
    // baseOutput 100 × mult 2 = 200; revenue = 200 × 1 × (1-0); rmConsumed = roundNumber(1×2,2) = 2
    expect(r.output).toBe(200);
    expect(r.revenue).toBeCloseTo(200, 10);
    expect(r.rmConsumed).toBe(2);
    expect(r.companies).toBe(1);
  });
});

describe('computeHiredIndustry', () => {
  it('houses: workTax always 0; one Q5 worker produces output', () => {
    const r = computeHiredIndustry({
      factoriesData: houses.factoriesData, rmData: houses.rmData,
      factoryCells: { 5: { companies: 1, workers: 1 } }, rmCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: flatPrices5, rmPrice: 0,
      hasTycoon: false, offeredSalary: 0,
    });
    expect(r.workTax).toBe(0);
    // baseOutput 1/60 × mult 2 × 1 worker
    expect(r.output).toBeCloseTo((1 / 60) * 2, 10);
    expect(r.companies).toBe(1);
  });
});
