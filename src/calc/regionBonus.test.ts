import { describe, it, expect } from 'vitest';
import { regionBonusFor, selectCandidates } from './regionBonus';
import type { RegionEntry } from '../data/regionResources';

const region = (id: number, currentCountry: string, res: Array<['food' | 'weapons' | 'houses' | 'aircraft', number]>): RegionEntry => ({
  id, name: `R${id}`, permalink: `R${id}`, originalCountry: currentCountry, currentCountry,
  resources: res.map(([industry, bonus]) => ({ name: `${industry}-res`, industry, bonus })),
});

describe('regionBonusFor', () => {
  it('sums only the chosen industry resource bonuses', () => {
    const r = region(1, 'Poland', [['food', 10], ['food', 5], ['weapons', 20]]);
    expect(regionBonusFor(r, 'food')).toBe(15);
    expect(regionBonusFor(r, 'weapons')).toBe(20);
    expect(regionBonusFor(r, 'houses')).toBe(0);
  });
});

describe('selectCandidates', () => {
  const regions = [
    region(1, 'Poland', [['food', 40]]),
    region(2, 'Spain',  [['food', 25]]),
    region(3, 'Cuba',   [['food', 5]]),
    region(4, 'Peru',   [['food', 0]]),
  ];

  it('keeps regions at or above the threshold, sorted by bonus desc', () => {
    const out = selectCandidates(regions, 'food', { threshold: 25, maxCandidates: 10 });
    expect(out.map(c => c.region.id)).toEqual([1, 2]);
    expect(out[0].regionBonus).toBe(40);
  });

  it('caps to maxCandidates by highest bonus', () => {
    const out = selectCandidates(regions, 'food', { threshold: 0, maxCandidates: 2 });
    expect(out.map(c => c.region.id)).toEqual([1, 2]);
  });

  it('drops zero-bonus regions even when threshold is 0', () => {
    const out = selectCandidates(regions, 'food', { threshold: 0, maxCandidates: 10 });
    expect(out.map(c => c.region.id)).toEqual([1, 2, 3]);
  });
});
