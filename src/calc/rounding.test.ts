import { describe, it, expect } from 'vitest';
import { roundNumber, gameRawProduction, productivityMultiplier, pollutionAt } from './rounding';

describe('rounding', () => {
  it('roundNumber rounds to N decimals', () => {
    expect(roundNumber(1.236, 2)).toBe(1.24);
    expect(roundNumber(1.5, 0)).toBe(2);
  });

  it('gameRawProduction truncates the 3rd decimal (3.685 -> 3.68)', () => {
    expect(gameRawProduction(3.685)).toBe(3.68);
  });

  it('productivityMultiplier sums bonuses and floors at 0', () => {
    expect(roundNumber(productivityMultiplier({ countryBonus: 100, regionBonus: 0, hasTycoon: false, pollutionRate: 0 }), 5)).toBe(2);
    expect(productivityMultiplier({ countryBonus: 0, regionBonus: 0, hasTycoon: false, pollutionRate: 500 })).toBe(0);
    expect(roundNumber(productivityMultiplier({ countryBonus: 100, regionBonus: 20, hasTycoon: true, pollutionRate: 10 }), 5)).toBe(2.3);
  });

  it('pollutionAt reads the index, defaulting to 0', () => {
    expect(pollutionAt({ 0: 5, 1: 9 }, 1)).toBe(9);
    expect(pollutionAt({}, 3)).toBe(0);
    expect(pollutionAt(undefined, 0)).toBe(0);
  });
});
