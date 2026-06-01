import { describe, it, expect } from 'vitest';
import { joinUniverseWithSeed } from './regionJoin';
import type { RegionEntry } from '../data/regionResources';

const seed: RegionEntry[] = [
  { id: 1, name: 'Samogitia', permalink: 'Samogitia', originalCountry: 'Lithuania', currentCountry: 'Lithuania',
    resources: [{ name: 'Iron', industry: 'weapons', bonus: 2 }] },
];

describe('joinUniverseWithSeed', () => {
  it('uses seed bonuses with the live owner/permalink, counts regions missing from the seed', () => {
    const { regions, skipped } = joinUniverseWithSeed(
      [
        { permalink: 'Samogitia', name: 'Samogitia', currentCountry: 'Russia' }, // occupied
        { permalink: 'BrandNew', name: 'Brand New', currentCountry: 'Poland' },   // not in seed
      ],
      seed,
    );
    expect(skipped).toBe(1);
    expect(regions).toHaveLength(1);
    expect(regions[0].currentCountry).toBe('Russia');       // live owner wins
    expect(regions[0].resources[0].bonus).toBe(2);          // bonus from seed
    expect(regions[0].permalink).toBe('Samogitia');
  });
});
