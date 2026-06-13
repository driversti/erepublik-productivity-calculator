import { describe, it, expect } from 'vitest';
import { computeBreakeven } from './breakeven';

// Hiring break-even: the maximum salary you can pay one worker per session and
// still be better off producing than buying. Two framings:
//   self-use: producing for your own consumption beats buying the finished good
//             → salaryCap = units×finishedPrice − rm×rmPrice
//   resale:   producing-to-sell still nets ≥ 0 (VAT applies to your sale)
//             → salaryCap = units×finishedPrice×(1−vat) − rm×rmPrice
describe('computeBreakeven', () => {
  it('computes self-use and resale salary caps for a clean case', () => {
    // aircraft Q5 at multiplier 1.0: baseOutput 5, baseRM 5
    const r = computeBreakeven({
      unitsPerSession: 5,
      rmPerSession: 5,
      finishedPrice: 2.0,
      rmPrice: 0.1,
      vat: 1, // percent
    });
    expect(r.selfUseSalaryCap).toBeCloseTo(9.5, 6); // 5*2.0 - 5*0.1
    expect(r.resaleSalaryCap).toBeCloseTo(9.4, 6); // 5*2.0*0.99 - 5*0.1
  });

  it('resale cap is below self-use cap whenever VAT > 0', () => {
    const r = computeBreakeven({ unitsPerSession: 3, rmPerSession: 4, finishedPrice: 10, rmPrice: 1, vat: 5 });
    expect(r.resaleSalaryCap).toBeLessThan(r.selfUseSalaryCap);
  });

  it('flags a salary as profitable when it is at or below the cap', () => {
    const r = computeBreakeven({ unitsPerSession: 5, rmPerSession: 5, finishedPrice: 2.0, rmPrice: 0.1, vat: 1 });
    expect(r.selfUseProfitableAt(9.5)).toBe(true); // exactly at cap
    expect(r.selfUseProfitableAt(9.51)).toBe(false);
    expect(r.resaleProfitableAt(9.4)).toBe(true);
    expect(r.resaleProfitableAt(10)).toBe(false);
  });

  it('returns a negative cap when RM alone already costs more than the finished good', () => {
    // producing is never worth it: even at salary 0 you lose money
    const r = computeBreakeven({ unitsPerSession: 1, rmPerSession: 100, finishedPrice: 2, rmPrice: 1, vat: 0 });
    expect(r.selfUseSalaryCap).toBeLessThan(0); // 1*2 - 100*1 = -98
    expect(r.selfUseProfitableAt(0)).toBe(false);
  });
});
