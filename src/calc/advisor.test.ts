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

  it('gives a convert-vs-sell verdict for a priced hired industry', () => {
    const s = initialState();
    s.hasTycoon = false;
    s.offeredSalary = 20;
    s.armPrice = 2;
    s.aircraft.countryBonus = 0;
    s.aircraft.regionBonus = 0;
    s.aircraft.vat = 0;
    s.aircraft.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10 };
    const report = computeAdvisor(s);
    const air = report.rmVerdicts.find((v) => v.industry === 'aircraft')!;
    // Aircraft Q5 at x1.0: output 5, RM consumed 5, price 10, armPrice 2, salary 20.
    // hired net = 50 − 10 − 20 = 20. convert = (20 + 10)/5 = 6. sellRaw = 2.
    expect(air.bestQuality).toBe(5);
    expect(air.sellRaw).toBeCloseTo(2, 5);
    expect(air.convert).toBeCloseTo(6, 5);
    expect(air.convertIsBetter).toBe(true);
    expect(air.delta).toBeCloseTo(4, 5);
    expect(air.hasPrice).toBe(true);
    const row = report.rows.find((r) => r.industry === 'aircraft' && r.quality === 5)!;
    expect(row.wamNet).toBeNull();
    expect(row.hireNet).toBeCloseTo(20, 5);
    expect(row.roiRm).toBeCloseTo(2, 5); // 20 / 10
  });

  it('includes raw-material companies as rm rows', () => {
    const report = computeAdvisor(stateForTest());
    // Food plantation Q5 (Hunting Lodge): baseOutput 250 → 2.5 marketplace units at x1.0.
    // WAM net = 2.5 × frmPrice(1) × (1 − vat 0) − workTax 0 = 2.5. No RM consumed → roiRm null.
    const farm = report.rows.find((r) => r.industry === 'food' && r.kind === 'rm' && r.quality === 5)!;
    expect(farm.wamNet).toBeCloseTo(2.5, 5);
    expect(farm.roiRm).toBeNull();
    expect(farm.hasPrice).toBe(true); // frmPrice = 1 > 0
    // Grain Farm Q1 has maxEmployees 0 → cannot hire.
    const q1 = report.rows.find((r) => r.industry === 'food' && r.kind === 'rm' && r.quality === 1)!;
    expect(q1.hireNet).toBeNull();
    expect(q1.wamNet).toBeCloseTo(0.35, 5); // 35/100 = 0.35 at x1.0
  });

  it('emits factory + rm rows for every quality of every industry (44 total)', () => {
    const report = computeAdvisor(stateForTest());
    // 24 factory rows (7+7+5+5) + 20 rm rows (5 per industry × 4).
    expect(report.rows).toHaveLength(7 + 7 + 5 + 5 + (5 * 4));
  });

  it('drops excluded finished qualities from topWam and rm bestQuality', () => {
    const s = stateForTest();
    s.food.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 2, 7: 1 }; // Q6 & Q7 priced
    s.excludedQualities = ['food:7'];
    const report = computeAdvisor(s);
    const q7 = report.rows.find((r) => r.industry === 'food' && r.quality === 7 && r.kind === 'factory')!;
    expect(q7.excluded).toBe(true);
    // topWam must be the non-excluded Q6
    expect(report.topWam?.industry).toBe('food');
    expect(report.topWam?.quality).toBe(6);
    // RM convert verdict must pick a non-excluded quality
    const frm = report.rmVerdicts.find((v) => v.industry === 'food')!;
    expect(frm.bestQuality).not.toBe(7);
  });
});
