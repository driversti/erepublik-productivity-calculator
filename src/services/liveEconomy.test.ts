/**
 * Tests for LiveEconomySource. Uses the same synthetic HTML fragments as
 * regions.test.ts (inlined, no FS) and mocks global.fetch so no real network
 * traffic occurs. Behaviour-oriented — tests skip-on-failure semantics and
 * correct parsing, not which internal functions are called.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveEconomySource } from './liveEconomy';

// Synthetic HTML that exactly satisfies the parser regexes in regions.ts.
// Mirrors the fixtures used in regions.test.ts.
const ECONOMY_HTML = `<html><body>
<script>var countryProductivityBonuses = {"byToken":{"FOOD":120,"WEAPON":110,"HOUSE":105,"AIRCRAFT":100},"byId":{"1":120,"2":110,"4":105,"23":100}}</script>
<table>
  <tr><td><span>Food</span></td><td><span class="special">5.00%</span></td></tr>
  <tr><td><span>Average</span></td><td><span class="special">42.50</span></td></tr>
  <tr><td><span class="fakeheight">Food</span></td><td><span>x</span></td><td><span>y</span>%</td><td><span>3</span></td></tr>
  <tr><td><span class="fakeheight">Weapons</span></td><td><span>x</span></td><td><span>y</span>%</td><td><span>1</span></td></tr>
</table>
</body></html>`;

// Region page carries both the per-resource bonus markup (food resource ids 1..5,
// here 2 + 3 = 5) and the pollution JSON — both parsed from the SAME fetch.
const REGION_HTML = `<html><body>
<div data-resourceId="1" data-bonus="2"></div>
<div data-resourceId="3" data-bonus="3"></div>
<script>var regionPollutionDetails = {"1":[{"pollution":"2.50"},{"pollution":"3.00"},{"pollution":"N/A"},{"pollution":"4.00"},{"pollution":"5.00"},{"pollution":"6.00"},{"pollution":"7.00"},{"pollution":"8.00"}]};</script>
</body></html>`;

function makeOkResponse(body: string): Response {
  return { ok: true, text: async () => body } as unknown as Response;
}
function makeFailResponse(): Response {
  return { ok: false, text: async () => '' } as unknown as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('LiveEconomySource.getCountryEconomics', () => {
  it('parses a known country into the correct economics keyed by the original input name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(ECONOMY_HTML));

    const source = new LiveEconomySource();
    // "Romania" exists in travelData.js (id 1, permalink "Romania")
    const result = await source.getCountryEconomics('food', ['Romania']);

    expect(result.size).toBe(1);
    const eco = result.get('Romania');
    expect(eco).toBeDefined();
    expect(eco!.countryBonus).toBe(120);
    expect(eco!.averageSalary).toBe(42.5);
    expect(eco!.workTaxRate).toBe(5.0);
    expect(eco!.vat).toBe(3);
  });

  it('keys the result by the ORIGINAL input name (not the canonical name)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(ECONOMY_HTML));

    const source = new LiveEconomySource();
    const result = await source.getCountryEconomics('food', ['Romania']);

    // Must be accessible by 'Romania', not some normalized variant
    expect(result.has('Romania')).toBe(true);
  });

  it('skips a country whose fetch returns !ok and resolves the batch with remaining entries', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    // First call (Romania) fails, second call (Serbia) succeeds.
    // Serbia exists in travelData.js.
    fetchMock
      .mockResolvedValueOnce(makeFailResponse())
      .mockResolvedValueOnce(makeOkResponse(ECONOMY_HTML));

    const source = new LiveEconomySource();
    const result = await source.getCountryEconomics('food', ['Romania', 'Serbia']);

    expect(result.has('Romania')).toBe(false);
    expect(result.has('Serbia')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('skips an unknown country name (not in travelData) without calling fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(ECONOMY_HTML));

    const source = new LiveEconomySource();
    const result = await source.getCountryEconomics('food', ['UnknownCountryXYZ']);

    expect(result.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls onProgress for every item including skipped ones', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(makeOkResponse(ECONOMY_HTML))  // Romania — success
      .mockResolvedValueOnce(makeFailResponse());            // Serbia — fail

    const source = new LiveEconomySource();
    const progressCalls: [number, number][] = [];

    await source.getCountryEconomics('food', ['Romania', 'Serbia'], (done, total) => {
      progressCalls.push([done, total]);
    });

    // Should have been called twice (once per item, total=2)
    expect(progressCalls.length).toBe(2);
    expect(progressCalls[progressCalls.length - 1]).toEqual([2, 2]);
  });

  it('parses weapons economics correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(ECONOMY_HTML));

    const source = new LiveEconomySource();
    const result = await source.getCountryEconomics('weapons', ['Romania']);

    const eco = result.get('Romania');
    expect(eco!.countryBonus).toBe(110);
    expect(eco!.vat).toBe(1);
  });

  it('returns empty map when given an empty list', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const source = new LiveEconomySource();
    const result = await source.getCountryEconomics('food', []);

    expect(result.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the batch when fetch THROWS for one country and still returns the other', async () => {
    // Romania throws (network error), Serbia succeeds — batch must resolve, not reject.
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(makeOkResponse(ECONOMY_HTML));

    const source = new LiveEconomySource();
    // Must not throw
    const result = await source.getCountryEconomics('food', ['Romania', 'Serbia']);

    // Throwing country is omitted
    expect(result.has('Romania')).toBe(false);
    // Succeeding country is present
    expect(result.has('Serbia')).toBe(true);
    expect(result.size).toBe(1);
  });
});

describe('LiveEconomySource.getRegionDetails', () => {
  it('parses a known region into BOTH the live region bonus and the quality→pollution map, keyed by region id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(REGION_HTML));

    const source = new LiveEconomySource();
    // Region 38 exists in travelData.js (Oltenia, Romania, permalink "Oltenia")
    const result = await source.getRegionDetails('food', [38]);

    expect(result.size).toBe(1);
    const details = result.get(38);
    expect(details).toBeDefined();
    // Live region bonus parsed from data-resourceId/data-bonus (2 + 3).
    expect(details!.regionBonus).toBe(5);
    const pollution = details!.pollution;
    expect(pollution[0]).toBe(2.5);   // RM slot
    expect(pollution[1]).toBe(3.0);   // Q1
    expect(pollution[2]).toBe(0);     // N/A → 0
    expect(pollution[7]).toBe(8.0);   // Q7
  });

  it('skips a region whose fetch returns !ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeFailResponse());

    const source = new LiveEconomySource();
    const result = await source.getRegionDetails('food', [38]);

    expect(result.size).toBe(0);
  });

  it('skips an unknown region id without calling fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(REGION_HTML));

    const source = new LiveEconomySource();
    // 999999 does not exist in travelData.js
    const result = await source.getRegionDetails('food', [999999]);

    expect(result.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls onProgress for every item', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(REGION_HTML));

    const source = new LiveEconomySource();
    const progressCalls: [number, number][] = [];

    await source.getRegionDetails('food', [38, 39], (done, total) => {
      progressCalls.push([done, total]);
    });

    expect(progressCalls.length).toBe(2);
    expect(progressCalls[progressCalls.length - 1]).toEqual([2, 2]);
  });

  it('returns empty map for an empty list', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const source = new LiveEconomySource();
    const result = await source.getRegionDetails('food', []);

    expect(result.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the batch when fetch THROWS for one region and still returns the other', async () => {
    // Region 38 throws (network error), region 39 succeeds — batch must resolve, not reject.
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(makeOkResponse(REGION_HTML));

    const source = new LiveEconomySource();
    // Must not throw
    const result = await source.getRegionDetails('food', [38, 39]);

    // Throwing region is omitted
    expect(result.has(38)).toBe(false);
    // Succeeding region is present
    expect(result.has(39)).toBe(true);
    expect(result.size).toBe(1);
  });
});
