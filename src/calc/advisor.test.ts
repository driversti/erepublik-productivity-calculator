import { describe, it, expect } from 'vitest';
import { computeAdvisor } from './advisor';
import { initialState } from '../state/blank';
import type { AppState } from '../state/types';

// A deterministic state: zero bonuses → productivity multiplier = 1.0, so outputs
// are the raw base values and the arithmetic is hand-checkable.
function stateForTest(): AppState {
  const s = initialState();
  s.wamEnabled = true;
  s.hasTycoon = false;
  s.offeredSalary = 90;
  s.frmPrice = 1;
  // Food: only Q7 is priced; bonuses/vat/tax all zero.
  s.food.countryBonus = 0;
  s.food.regionBonus = 0;
  s.food.vat = 0;
  s.food.workTaxRate = 0;
  s.food.averageSalary = 0;
  s.food.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1 };
  return s;
}

describe('computeAdvisor', () => {
  it('computes per-session economics for a priced fw quality', () => {
    const report = computeAdvisor(stateForTest());
    const q7 = report.rows.find((r) => r.industry === 'food' && r.quality === 7)!;
    // Food Q7 at x1.0: output 100, RM consumed 20, finished price 1, frmPrice 1.
    // WAM session: revenue 100 − RM 20 − tax 0 − salary 0 = 80.
    expect(q7.wamNet).toBeCloseTo(80, 5);
    // Hired session (no Tycoon): revenue 100 − RM 20 − salary 90 = −10.
    expect(q7.hireNet).toBeCloseTo(-10, 5);
    // Hired session (Tycoon, mult 1.2): output 120, RM 24, revenue 120 − 24 − 90 = 6.
    expect(q7.hireNetTycoon).toBeCloseTo(6, 5);
    // ROI per CC of RM (primary = WAM session): 80 / 20 = 4.0.
    expect(q7.roiRm).toBeCloseTo(4, 5);
    expect(q7.owned).toBe(0);
    expect(q7.hasPrice).toBe(true);
  });

  it('marks hired industries with null wamNet', () => {
    const report = computeAdvisor(stateForTest());
    const house = report.rows.find((r) => r.industry === 'houses')!;
    expect(house.wamNet).toBeNull();
  });

  it('flags unpriced qualities and excludes them from topWam', () => {
    const report = computeAdvisor(stateForTest());
    const q6 = report.rows.find((r) => r.industry === 'food' && r.quality === 6)!;
    expect(q6.hasPrice).toBe(false);
    expect(report.topWam?.industry).toBe('food');
    expect(report.topWam?.quality).toBe(7);
  });

  it('gives a convert-vs-sell verdict per priced industry', () => {
    const report = computeAdvisor(stateForTest());
    const food = report.rmVerdicts.find((v) => v.industry === 'food')!;
    // sell raw = frmPrice × (1 − vat) = 1. convert = (net + rmCost)/rmConsumed = (80+20)/20 = 5.
    expect(food.sellRaw).toBeCloseTo(1, 5);
    expect(food.convert).toBeCloseTo(5, 5);
    expect(food.convertIsBetter).toBe(true);
    expect(food.delta).toBeCloseTo(4, 5);
    expect(food.bestQuality).toBe(7);
  });

  it('emits a row for every quality of every industry (24 total)', () => {
    const report = computeAdvisor(stateForTest());
    expect(report.rows).toHaveLength(7 + 7 + 5 + 5);
  });
});
