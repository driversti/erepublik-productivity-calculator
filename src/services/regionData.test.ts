import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchRegionData, refreshRegionData, BUNDLED_DATASET, normalizeDataset } from './regionData';
import { REGION_RESOURCES } from '../data/regionResources';

afterEach(() => vi.restoreAllMocks());

const PAYLOAD = {
  fetchedAt: '2026-06-01',
  regions: [{ id: 1, name: 'R', originalCountry: 'A', currentCountry: 'A', resources: [] }],
  countryFlags: { A: '//a' },
};

describe('fetchRegionData', () => {
  it('returns server data when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => PAYLOAD }) as Response));
    const data = await fetchRegionData();
    expect(data.fetchedAt).toBe('2026-06-01');
    expect(data.regions).toHaveLength(1);
  });

  it('falls back to the bundled seed on 204', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 204, json: async () => null }) as Response));
    expect(await fetchRegionData()).toBe(BUNDLED_DATASET);
  });

  it('falls back to the bundled seed on network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchRegionData()).toBe(BUNDLED_DATASET);
  });
});

describe('refreshRegionData', () => {
  it('posts erpk and returns parsed data', async () => {
    const spy = vi.fn(async () => ({ ok: true, status: 200, json: async () => PAYLOAD }) as Response);
    vi.stubGlobal('fetch', spy);
    const data = await refreshRegionData('ERPK123');
    expect(data.fetchedAt).toBe('2026-06-01');
    expect(spy).toHaveBeenCalledWith('/api/regions/refresh', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(((spy.mock.calls[0] as unknown[])[1] as RequestInit).body as string);
    expect(body).toEqual({ erpk: 'ERPK123' });
  });

  it('throws with the server error message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'session expired' }) }) as Response));
    await expect(refreshRegionData('bad')).rejects.toThrow('session expired');
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

  it('fetchRegionData normalizes server JSON exactly once', async () => {
    const serverPayload = {
      fetchedAt: '2026-06-01',
      regions: [{ id: 1, name: 'R', originalCountry: 'A', currentCountry: 'A', resources: [{ name: 'Grain', industry: 'food', bonus: 50 }] }],
      countryFlags: { A: '//a' },
    };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => serverPayload }) as Response));
    const data = await fetchRegionData();
    // 50 / 5 = 10, normalized once (not 50/25 = 2).
    expect(data.regions[0].resources[0].bonus).toBe(10);
  });

  it('normalizeDataset is pure and idempotent-once (divides each bonus exactly once)', () => {
    const ds = {
      fetchedAt: 'x',
      regions: [{ id: 9, name: 'N', originalCountry: 'C', currentCountry: 'C', resources: [{ name: 'X', industry: 'food' as const, bonus: 25 }] }],
      countryFlags: {},
    };
    const out = normalizeDataset(ds);
    expect(out.regions[0].resources[0].bonus).toBe(5);
    // input untouched
    expect(ds.regions[0].resources[0].bonus).toBe(25);
  });
});
