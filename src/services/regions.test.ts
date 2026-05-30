import { describe, it, expect } from 'vitest';
import {
  SCRAPE_CONFIG, parseRegionList, parseCountryBonus, parseRegionBonus,
  parseRegionPollution, parseWorkTax, parseAverageSalary, parseVat, parseRegionModifiers,
} from './regions';

// Synthetic HTML mirroring the real erepublik.com economy/region markup the
// scrapers target. Inlined (not read from disk) to avoid import.meta.url/FS
// quirks under the jsdom test environment.
const countryHtml = `<html><body>
<script>var countryProductivityBonuses = {"byToken":{"FOOD":120,"WEAPON":110,"HOUSE":105,"AIRCRAFT":100},"byId":{"1":120,"2":110,"4":105,"23":100}}</script>
<table>
  <tr><td><span>Food</span></td><td><span class="special">5.00%</span></td></tr>
  <tr><td><span>Average</span></td><td><span class="special">42.50</span></td></tr>
  <tr><td><span class="fakeheight">Food</span></td><td><span>x</span></td><td><span>y</span>%</td><td><span>3</span></td></tr>
  <tr><td><span class="fakeheight">Weapons</span></td><td><span>x</span></td><td><span>y</span>%</td><td><span>1</span></td></tr>
</table>
</body></html>`;

const regionHtml = `<html><body>
<script>var regionPollutionDetails = {"1":[{"pollution":"2.50"},{"pollution":"3.00"},{"pollution":"N/A"},{"pollution":"4.00"},{"pollution":"5.00"},{"pollution":"6.00"},{"pollution":"7.00"},{"pollution":"8.00"}]};</script>
<div data-resourceId="1" data-bonus="10"></div>
<div data-resourceId="3" data-bonus="5"></div>
<div data-resourceId="6" data-bonus="20"></div>
<a href="//www.erepublik.com/en/main/region/Samogitia">Samogitia</a>
<a href="//www.erepublik.com/en/main/region/Aukstaitija">Aukstaitija</a>
<a href="//www.erepublik.com/en/main/region/Samogitia">Samogitia</a>
<a href="//www.erepublik.com/en/main/region/Detail">Details</a>
</body></html>`;

describe('region scrapers', () => {
  it('parseRegionList dedupes, drops "Details", and sorts', () => {
    const list = parseRegionList(regionHtml);
    expect(list.map((r) => r.permalink)).toEqual(['Aukstaitija', 'Samogitia']);
  });

  it('parseCountryBonus reads byToken first', () => {
    expect(parseCountryBonus(countryHtml, SCRAPE_CONFIG.food)).toBe(120);
    expect(parseCountryBonus(countryHtml, SCRAPE_CONFIG.weapons)).toBe(110);
  });

  it('parseRegionBonus sums only the industry resource ids', () => {
    // food resources 1..5 → 10 + 5; weapons resources 6..10 → 20
    expect(parseRegionBonus(regionHtml, SCRAPE_CONFIG.food)).toBe(15);
    expect(parseRegionBonus(regionHtml, SCRAPE_CONFIG.weapons)).toBe(20);
  });

  it('parseRegionPollution maps index 0..maxQ, N/A → 0', () => {
    const qp = parseRegionPollution(regionHtml, SCRAPE_CONFIG.food);
    expect(qp[0]).toBe(2.5);
    expect(qp[1]).toBe(3.0);
    expect(qp[2]).toBe(0); // N/A
    expect(qp[7]).toBe(8.0);
  });

  it('parseWorkTax / parseAverageSalary read the special cells', () => {
    expect(parseWorkTax(countryHtml)).toBe(5.0);
    expect(parseAverageSalary(countryHtml)).toBe(42.5);
  });

  it('parseVat reads the per-industry label row', () => {
    expect(parseVat(countryHtml, SCRAPE_CONFIG.food, 1)).toBe(3);
    expect(parseVat(countryHtml, SCRAPE_CONFIG.weapons, 1)).toBe(1);
  });

  it('parseRegionModifiers bundles everything for one industry', () => {
    const m = parseRegionModifiers(countryHtml, regionHtml, SCRAPE_CONFIG.food, 1);
    expect(m.countryBonus).toBe(120);
    expect(m.regionBonus).toBe(15);
    expect(m.workTaxRate).toBe(5.0);
    expect(m.averageSalary).toBe(42.5);
    expect(m.vat).toBe(3);
    expect(m.qualityPollution[0]).toBe(2.5);
  });
});
