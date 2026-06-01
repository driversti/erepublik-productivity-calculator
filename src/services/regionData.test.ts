import { describe, it, expect } from 'vitest';
import { fetchRegionData, BUNDLED_DATASET, normalizeDataset } from './regionData';
import { REGION_RESOURCES } from '../data/regionResources';

describe('fetchRegionData', () => {
  it('returns the bundled seed dataset (no network call)', async () => {
    const data = await fetchRegionData();
    expect(data).toBe(BUNDLED_DATASET);
  });
});

describe('bonus normalization (÷5)', () => {
  // Pick a known region/resource to assert the exact divided value. Dobrogea
  // (id 3) Magnesium is raw 10 in the offline dump → 2 after normalization.
  const rawDobrogea = REGION_RESOURCES.find((r) => r.id === 3)!;
  const rawMagnesium = rawDobrogea.resources.find((res) => res.name === 'Magnesium')!;

  it('BUNDLED_DATASET exposes bonuses divided by 5', () => {
    const dobrogea = BUNDLED_DATASET.regions.find((r) => r.id === 3)!;
    const magnesium = dobrogea.resources.find((res) => res.name === 'Magnesium')!;
    expect(rawMagnesium.bonus).toBe(10); // guard the fixture assumption
    expect(magnesium.bonus).toBe(rawMagnesium.bonus / 5);
    expect(magnesium.bonus).toBe(2);
  });

  it('does not mutate the source REGION_RESOURCES (no double-normalization risk)', () => {
    // The raw module export must stay at full scale.
    expect(rawMagnesium.bonus).toBe(10);
  });

  it('normalizeDataset is pure and idempotent-once (divides each bonus exactly once)', () => {
    const ds = {
      fetchedAt: 'x',
      regions: [{ id: 9, name: 'N', permalink: 'N', originalCountry: 'C', currentCountry: 'C', resources: [{ name: 'X', industry: 'food' as const, bonus: 25 }] }],
      countryFlags: {},
    };
    const out = normalizeDataset(ds);
    expect(out.regions[0].resources[0].bonus).toBe(5);
    // input untouched
    expect(ds.regions[0].resources[0].bonus).toBe(25);
  });
});
