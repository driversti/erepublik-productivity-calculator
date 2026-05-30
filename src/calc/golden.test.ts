// GOLDEN PARITY: the new TypeScript calc must produce bit-identical results to
// the legacy holdingsCalc.mjs on randomized inputs. This is the safety net for
// the whole migration. At cutover (before legacy deletion) it is re-pointed at a
// committed snapshot — see plan Task 14.
import { describe, it, expect } from 'vitest';
// @ts-expect-error - legacy untyped module, present only during migration
import { computeFwIndustry as legacyFw, computeHiredIndustry as legacyHired } from '../../holdingsCalc.mjs';
import { computeFwIndustry, computeHiredIndustry } from './industry';
import { getIndustry } from '../data/industries';

// Deterministic PRNG so any failure reproduces exactly.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type CellMap = Record<number, { companies: number; workers: number }>;

describe('golden parity: src/calc == legacy holdingsCalc.mjs', () => {
  it('computeFwIndustry matches on 300 random inputs (food)', () => {
    const food = getIndustry('food');
    const rnd = mulberry32(12345);
    for (let i = 0; i < 300; i++) {
      const factoryCells: CellMap = {};
      const plantationCells: CellMap = {};
      for (let q = 1; q <= 7; q++) factoryCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 30) };
      for (let q = 1; q <= 5; q++) plantationCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 5) };
      const prices: Record<number, number> = {};
      for (let q = 1; q <= 7; q++) prices[q] = Math.round(rnd() * 100) / 100;
      const params = {
        factoriesData: food.factoriesData, plantationsData: food.rmData,
        factoryCells, plantationCells,
        countryBonus: 100 + Math.floor(rnd() * 50), regionBonus: Math.floor(rnd() * 30),
        qualityPollution: { 0: rnd() * 10, 1: rnd() * 5, 7: rnd() * 10 }, vat: rnd() * 5,
        prices, rmPrice: Math.round(rnd() * 10) / 100,
        hasTycoon: rnd() > 0.5, wamEnabled: rnd() > 0.3,
        offeredSalary: Math.floor(rnd() * 20), workTaxRate: rnd() * 25, averageSalary: Math.floor(rnd() * 100),
      };
      expect(computeFwIndustry(params)).toEqual(legacyFw(params));
    }
  });

  it('computeHiredIndustry matches on 300 random inputs (houses)', () => {
    const houses = getIndustry('houses');
    const rnd = mulberry32(999);
    for (let i = 0; i < 300; i++) {
      const factoryCells: CellMap = {};
      const rmCells: CellMap = {};
      for (let q = 1; q <= 5; q++) {
        factoryCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 20) };
        rmCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 20) };
      }
      const prices: Record<number, number> = {};
      for (let q = 1; q <= 5; q++) prices[q] = Math.round(rnd() * 1000) / 100;
      const params = {
        factoriesData: houses.factoriesData, rmData: houses.rmData,
        factoryCells, rmCells,
        countryBonus: 100 + Math.floor(rnd() * 50), regionBonus: Math.floor(rnd() * 30),
        qualityPollution: { 0: rnd() * 10 }, vat: rnd() * 5,
        prices, rmPrice: Math.round(rnd() * 100) / 100,
        hasTycoon: rnd() > 0.5, offeredSalary: Math.floor(rnd() * 20),
      };
      expect(computeHiredIndustry(params)).toEqual(legacyHired(params));
    }
  });
});
