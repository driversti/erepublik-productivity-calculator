import { describe, it, expect } from 'vitest';
import { INDUSTRIES, getIndustry } from './industries';

describe('industry data', () => {
  it('food factory Q7 matches game constants', () => {
    const q7 = getIndustry('food').factoriesData.find((f) => f.quality === 7)!;
    expect(q7.baseOutput).toBe(100);
    expect(q7.baseRM).toBe(20);
    expect(q7.energyPerItem).toBe(20);
    expect(q7.maxEmployees).toBe(10);
  });

  it('weapon factory Q1 has baseOutput 10 / baseRM 1', () => {
    const q1 = getIndustry('weapons').factoriesData.find((f) => f.quality === 1)!;
    expect(q1.baseOutput).toBe(10);
    expect(q1.baseRM).toBe(1);
  });

  it('house factory Q5 baseOutput is 1/60 with baseRM 2', () => {
    const q5 = getIndustry('houses').factoriesData.find((f) => f.quality === 5)!;
    expect(q5.baseOutput).toBeCloseTo(1 / 60, 12);
    expect(q5.baseRM).toBe(2);
  });

  it('exposes all four industries in order with correct types', () => {
    expect(INDUSTRIES.map((i) => i.key)).toEqual(['food', 'weapons', 'houses', 'aircraft']);
    expect(getIndustry('houses').type).toBe('hired');
    expect(getIndustry('food').type).toBe('fw');
  });

  it('aircraft has five factories (Q1-Q5)', () => {
    expect(getIndustry('aircraft').factoriesData).toHaveLength(5);
  });

  it('plantations have no baseRM field', () => {
    expect(getIndustry('food').rmData[0].baseRM).toBeUndefined();
  });
});
