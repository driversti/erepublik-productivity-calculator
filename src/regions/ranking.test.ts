import { describe, it, expect } from 'vitest';
import { rankRegions, countriesForIndustry, allCountries } from './ranking';
import { REGION_RESOURCES } from '../data/regionResources';

describe('rankRegions', () => {
  it('sums an industry\'s resource bonuses per region', () => {
    const aircraft = rankRegions(REGION_RESOURCES, 'aircraft');
    const dobrogea = aircraft.find((r) => r.region.name === 'Dobrogea');
    expect(dobrogea).toBeTruthy();
    expect(dobrogea!.totalBonus).toBe(70);
    expect(dobrogea!.matched.map((m) => m.name).sort()).toEqual(
      ['Cobalt', 'Magnesium', 'Titanium', 'Wolfram'],
    );
  });

  it('returns only regions that have the industry, sorted desc with name tie-break', () => {
    const food = rankRegions(REGION_RESOURCES, 'food');
    expect(food.length).toBeGreaterThan(0);
    for (const row of food) {
      expect(row.matched.length).toBeGreaterThan(0);
      expect(row.matched.every((m) => m.industry === 'food')).toBe(true);
    }
    for (let i = 1; i < food.length; i++) {
      expect(food[i - 1].totalBonus).toBeGreaterThanOrEqual(food[i].totalBonus);
      if (food[i - 1].totalBonus === food[i].totalBonus) {
        expect(food[i - 1].region.name.localeCompare(food[i].region.name, 'en')).toBeLessThanOrEqual(0);
      }
    }
  });

  it('filters by current country when given', () => {
    const ro = rankRegions(REGION_RESOURCES, 'aircraft', { country: 'Romania' });
    expect(ro.length).toBeGreaterThan(0);
    expect(ro.every((r) => r.region.currentCountry === 'Romania')).toBe(true);
  });

  it('returns an empty array when the country filter matches no region with the industry', () => {
    expect(rankRegions(REGION_RESOURCES, 'aircraft', { country: '__no_such_country__' })).toHaveLength(0);
  });
});

describe('countriesForIndustry', () => {
  it('lists distinct current countries that have the industry, sorted', () => {
    const list = countriesForIndustry(REGION_RESOURCES, 'aircraft');
    expect(list).toContain('Romania');
    expect(new Set(list).size).toBe(list.length);
    expect([...list]).toEqual([...list].sort((a, b) => a.localeCompare(b, 'en')));
  });
});

describe('allCountries', () => {
  it('is a sorted, distinct superset of any single industry\'s country list', () => {
    const all = allCountries(REGION_RESOURCES);
    expect(new Set(all).size).toBe(all.length);
    expect([...all]).toEqual([...all].sort((a, b) => a.localeCompare(b, 'en')));
    for (const c of countriesForIndustry(REGION_RESOURCES, 'aircraft')) {
      expect(all).toContain(c);
    }
  });
});
