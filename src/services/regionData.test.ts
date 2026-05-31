import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchRegionData, refreshRegionData, BUNDLED_DATASET } from './regionData';

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
