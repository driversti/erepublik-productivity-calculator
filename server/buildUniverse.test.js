import { describe, it, expect } from 'vitest';
import { aggregateUniverse } from './buildUniverse.js';

describe('aggregateUniverse', () => {
  it('tags each region with its owner country, dedupes by permalink, sorts by permalink', () => {
    const out = aggregateUniverse([
      { country: 'Lithuania', regions: [{ name: 'Samogitia', permalink: 'Samogitia' }] },
      { country: 'Poland', regions: [{ name: 'Masovia', permalink: 'Masovia' }] },
      // same region seen under two countries → first owner wins (occupation order)
      { country: 'Russia', regions: [{ name: 'Samogitia', permalink: 'Samogitia' }] },
    ]);
    expect(out).toEqual([
      { permalink: 'Masovia', name: 'Masovia', currentCountry: 'Poland' },
      { permalink: 'Samogitia', name: 'Samogitia', currentCountry: 'Lithuania' },
    ]);
  });
});
