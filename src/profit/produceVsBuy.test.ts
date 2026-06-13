import { describe, it, expect } from 'vitest';
import { unitProductionCost } from './produceVsBuy';

// Cost to produce ONE finished unit for your own use (e.g. weapons to fight with):
// the session's raw-material cost + labour, divided by the units it makes.
// Compare against the market BUY price to decide produce-vs-buy.
describe('unitProductionCost', () => {
  it('sums RM cost and labour per session and divides by output', () => {
    // Q7 weapons: 18.40 units, RM cost 1357.92, work tax 88.58
    expect(unitProductionCost(18.4, 1357.92, 88.58)).toBeCloseTo(78.61, 2);
  });

  it('returns null when the session makes no finished units', () => {
    expect(unitProductionCost(0, 100, 50)).toBeNull();
  });

  it('counts only labour when raw material is free', () => {
    expect(unitProductionCost(10, 0, 50)).toBeCloseTo(5, 6);
  });
});
