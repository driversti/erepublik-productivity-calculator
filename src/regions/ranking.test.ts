import { describe, it, expect } from 'vitest';
import { rankRegions, countriesForIndustry } from './ranking';

describe('rankRegions', () => {
  it('sums an industry\'s resource bonuses per region', () => {
    const aircraft = rankRegions('aircraft');
    const dobrogea = aircraft.find((r) => r.region.name === 'Dobrogea');
    expect(dobrogea).toBeTruthy();
    // Magnesium 10 + Cobalt 25 + Titanium 15 + Wolfram 20
    expect(dobrogea!.totalBonus).toBe(70);
    expect(dobrogea!.matched.map((m) => m.name).sort()).toEqual(
      ['Cobalt', 'Magnesium', 'Titanium', 'Wolfram'],
    );
  });

  it('returns only regions that have the industry, sorted desc with name tie-break', () => {
    const food = rankRegions('food');
    expect(food.length).toBeGreaterThan(0);
    for (const row of food) {
      expect(row.matched.length).toBeGreaterThan(0);
      expect(row.matched.every((m) => m.industry === 'food')).toBe(true);
    }
    for (let i = 1; i < food.length; i++) {
      const prev = food[i - 1];
      const cur = food[i];
      expect(prev.totalBonus).toBeGreaterThanOrEqual(cur.totalBonus);
      if (prev.totalBonus === cur.totalBonus) {
        expect(prev.region.name.localeCompare(cur.region.name)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('filters by current country when given', () => {
    const all = rankRegions('aircraft');
    const ro = rankRegions('aircraft', { country: 'Romania' });
    expect(ro.length).toBeGreaterThan(0);
    expect(ro.length).toBeLessThanOrEqual(all.length);
    expect(ro.every((r) => r.region.currentCountry === 'Romania')).toBe(true);
  });

  it('returns an empty array when the country filter matches no region with the industry', () => {
    expect(rankRegions('aircraft', { country: '__no_such_country__' })).toHaveLength(0);
  });
});

describe('countriesForIndustry', () => {
  it('lists distinct current countries that have the industry, sorted', () => {
    const list = countriesForIndustry('aircraft');
    expect(list).toContain('Romania');
    expect(new Set(list).size).toBe(list.length); // no dupes
    expect([...list]).toEqual([...list].sort((a, b) => a.localeCompare(b, 'en')));
  });
});
