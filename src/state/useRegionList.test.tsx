import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRegionList, _clearRegionListCache } from './useRegionList';
import * as regions from '../services/regions';

const list = (n: string) => [
  { name: `${n} North`, permalink: `${n}-North` },
  { name: `${n} South`, permalink: `${n}-South` },
];

describe('useRegionList', () => {
  beforeEach(() => _clearRegionListCache());
  afterEach(() => vi.restoreAllMocks());

  it('returns an empty, non-loading list when no country is selected', () => {
    const spy = vi.spyOn(regions, 'fetchRegionList');
    const { result } = renderHook(() => useRegionList(''));
    expect(result.current).toEqual({ regions: [], loading: false, error: false });
    expect(spy).not.toHaveBeenCalled();
  });

  it('fetches the live region list for a selected country', async () => {
    const spy = vi.spyOn(regions, 'fetchRegionList').mockResolvedValue(list('LT'));
    const { result } = renderHook(() => useRegionList('72'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(spy).toHaveBeenCalledWith('72');
    expect(result.current.regions.map((r) => r.permalink)).toEqual(['LT-North', 'LT-South']);
    expect(result.current.error).toBe(false);
  });

  it('serves a cached list without refetching on re-select', async () => {
    const spy = vi.spyOn(regions, 'fetchRegionList').mockResolvedValue(list('PL'));
    const first = renderHook(() => useRegionList('11'));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(spy).toHaveBeenCalledTimes(1);

    // A fresh mount for the same country must hit the cache (no loading, no fetch).
    const second = renderHook(() => useRegionList('11'));
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.regions).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reports an error and an empty list when the fetch fails', async () => {
    vi.spyOn(regions, 'fetchRegionList').mockRejectedValue(new Error('proxy down'));
    const { result } = renderHook(() => useRegionList('999'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.regions).toEqual([]);
    expect(result.current.error).toBe(true);
  });

  it('ignores a stale in-flight response when the country changes', async () => {
    let resolveLT: (v: regions.ParsedRegion[]) => void = () => {};
    vi.spyOn(regions, 'fetchRegionList').mockImplementation((id: string) => {
      if (id === '72') return new Promise((res) => { resolveLT = res; });
      return Promise.resolve(list('PL'));
    });

    const { result, rerender } = renderHook(({ id }) => useRegionList(id), {
      initialProps: { id: '72' },
    });
    // Switch country before LT resolves.
    rerender({ id: '11' });
    await waitFor(() => expect(result.current.regions.map((r) => r.permalink)).toEqual(['PL-North', 'PL-South']));

    // Late LT response must NOT clobber the PL list.
    resolveLT(list('LT'));
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.regions.map((r) => r.permalink)).toEqual(['PL-North', 'PL-South']);
  });
});
