import { describe, it, expect } from 'vitest';
import { sumHolding } from './holding';
import type { IndustryResult } from './types';

const r = (net: number, companies: number, extra: Partial<IndustryResult> = {}): IndustryResult => ({
  net, companies, revenue: 0, rmNetCost: 0, workTax: 0, salary: 0,
  output: 0, rmConsumed: 0, rmProduced: 0, netBalance: 0, ...extra,
});

describe('sumHolding', () => {
  it('sums net and companies across industries', () => {
    const t = sumHolding([
      { key: 'food', label: 'Food', result: r(10, 4, { revenue: 20, rmNetCost: 5, workTax: 2, salary: 3 }) },
      { key: 'weapons', label: 'Weapons', result: r(7, 2, { revenue: 9, rmNetCost: 1, salary: 1 }) },
    ]);
    expect(t.net).toBe(17);
    expect(t.companies).toBe(6);
    expect(t.revenue).toBe(29);
    expect(t.perIndustry).toHaveLength(2);
    expect(t.perIndustry[0]).toEqual({ key: 'food', label: 'Food', net: 10, companies: 4 });
  });
});
