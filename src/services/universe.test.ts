import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchUniverse } from './universe';

afterEach(() => vi.restoreAllMocks());

describe('fetchUniverse', () => {
  it('returns the server universe + fetchedAt on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ fetchedAt: '2026-06-01T07:00:00.000Z', regions: [{ permalink: 'Samogitia', name: 'Samogitia', currentCountry: 'Lithuania' }] }),
      { status: 200 },
    ));
    const out = await fetchUniverse();
    expect(out.fetchedAt).toBe('2026-06-01T07:00:00.000Z');
    expect(out.regions.find((r) => r.permalink === 'Samogitia')?.currentCountry).toBe('Lithuania');
  });

  it('falls back to a seed-derived universe with fetchedAt=null on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    const out = await fetchUniverse();
    expect(out.fetchedAt).toBeNull();
    expect(out.regions.length).toBeGreaterThan(0);
    expect(out.regions.every((r) => typeof r.permalink === 'string' && r.permalink.length > 0)).toBe(true);
  });
});
