import { describe, it, expect } from 'vitest';
import { trimMapData } from './trimMapData.js';

const RAW = {
  '3': {
    resources: [
      { id: '31', name: 'Magnesium', industry: 'aircraft', bonus: '10' },
      { id: '34', name: 'Cobalt', industry: 'aircraft', bonus: '25' },
    ],
    original_country: { name: 'Romania', flag: '//flags/Romania.png' },
    current_country: { name: 'Hungary', flag: '//flags/Hungary.png' },
    region: { id: '3', name: 'Dobrogea' },
  },
  '99': {
    resources: [{ id: '11', name: 'Iron', industry: 'weapon', bonus: '15' }],
    original_country: { name: 'Serbia', flag: '//flags/Serbia.png' },
    current_country: { name: 'Serbia', flag: '//flags/Serbia.png' },
    region: { id: '99', name: 'Sumadija' },
  },
  '7': {
    resources: [],
    region: { id: '7', name: 'Empty' },
    original_country: { name: 'X', flag: '//x' },
    current_country: { name: 'X', flag: '//x' },
  },
};

describe('trimMapData', () => {
  it('drops resourceless regions, sorts by id, maps industry keys, coerces numbers', () => {
    const out = trimMapData(RAW, '2026-06-01');
    expect(out.fetchedAt).toBe('2026-06-01');
    expect(out.regions.map((r) => r.id)).toEqual([3, 99]); // '7' dropped, sorted asc
    const iron = out.regions.find((r) => r.id === 99).resources[0];
    expect(iron.industry).toBe('weapons'); // weapon -> weapons
    expect(iron.bonus).toBe(15); // string -> number
    expect(typeof out.regions[0].id).toBe('number');
  });

  it('keeps original + current country and dedupes/sorts flags', () => {
    const out = trimMapData(RAW, 'd');
    const dobrogea = out.regions.find((r) => r.id === 3);
    expect(dobrogea.originalCountry).toBe('Romania');
    expect(dobrogea.currentCountry).toBe('Hungary');
    expect(out.countryFlags).toEqual({
      Hungary: '//flags/Hungary.png',
      Romania: '//flags/Romania.png',
      Serbia: '//flags/Serbia.png',
    });
  });

  it('maps house -> houses', () => {
    const raw = {
      '5': {
        resources: [{ id: '21', name: 'Sand', industry: 'house', bonus: '20' }],
        region: { id: '5', name: 'R' },
        original_country: { name: 'A', flag: '//a' },
        current_country: { name: 'A', flag: '//a' },
      },
    };
    expect(trimMapData(raw, 'd').regions[0].resources[0].industry).toBe('houses');
  });
});
