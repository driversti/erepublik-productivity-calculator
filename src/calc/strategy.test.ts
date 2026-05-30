import { describe, it, expect } from 'vitest';
import { computeIndustryView } from './strategy';
import { getIndustry } from '../data/industries';

const food = getIndustry('food');
const flatPrices7 = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 };

describe('computeIndustryView (Option A vs B)', () => {
  it('collapses to buy when no plantations exist (displayNet === optionANet)', () => {
    const v = computeIndustryView({
      industry: food,
      factoryCells: { 1: { companies: 1, workers: 0 } }, plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: flatPrices7, rmPrice: 1,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0,
    });
    expect(v.producingRM).toBe(false);
    expect(v.displayNet).toBeCloseTo(v.optionANet, 10);
    expect(v.optionANet).toBeCloseTo(198, 10); // 200 revenue − 2 rm cost
    expect(v.totalFactories).toBe(1);
  });

  it('useProduce flags whichever option nets higher', () => {
    const v = computeIndustryView({
      industry: food,
      factoryCells: { 7: { companies: 2, workers: 0 } },
      plantationCells: { 5: { companies: 3, workers: 0 } },
      countryBonus: 120, regionBonus: 20, qualityPollution: { 0: 5, 7: 10 }, vat: 1,
      prices: flatPrices7, rmPrice: 0.02,
      hasTycoon: true, wamEnabled: true, offeredSalary: 5, workTaxRate: 10, averageSalary: 30,
    });
    expect(v.useProduce).toBe(v.optionBNet > v.optionANet);
  });

  it('emits a breakdown row only for stocked qualities', () => {
    const v = computeIndustryView({
      industry: food,
      factoryCells: { 1: { companies: 1, workers: 0 }, 3: { companies: 0, workers: 0 } },
      plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: flatPrices7, rmPrice: 1,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0,
    });
    expect(v.breakdown).toHaveLength(1);
    expect(v.breakdown[0].quality).toBe(1);
  });
});
