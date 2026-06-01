import { describe, it, expect } from 'vitest';
import { parseRegionList } from './regionList.js';

const HTML = `
  <a href="//www.erepublik.com/en/main/region/Lithuania-Minor" class="x">Lithuania Minor</a>
  <a href="//www.erepublik.com/en/main/region/Samogitia">Samogitia</a>
  <a href="//www.erepublik.com/en/main/region/Samogitia">Samogitia</a>
  <a href="//www.erepublik.com/en/main/region/Whatever">Details</a>
`;

describe('parseRegionList (server)', () => {
  it('extracts unique region {name, permalink}, drops "Details", sorts by name', () => {
    expect(parseRegionList(HTML)).toEqual([
      { name: 'Lithuania Minor', permalink: 'Lithuania-Minor' },
      { name: 'Samogitia', permalink: 'Samogitia' },
    ]);
  });
});
