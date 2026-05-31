// Live per-country region list for the location dropdowns. The set of regions a
// country controls changes in war, so it is fetched from the Country Society
// page (via /proxy) rather than read from a static snapshot. Identity is the
// region `permalink` — the value the rest of the app already persists and uses
// to scrape `/region/{permalink}` for bonuses.
import { useEffect, useState } from 'react';
import { fetchRegionList, type ParsedRegion } from '../services/regions';

export interface RegionListState {
  regions: ParsedRegion[];
  loading: boolean;
  error: boolean;
}

// Module-level cache so re-selecting a country (or remounting a dropdown) is
// instant and does not re-hit the network. Keyed by the country id string.
const cache = new Map<string, ParsedRegion[]>();

/** Test-only: drop the cache so each test starts from a clean slate. */
export function _clearRegionListCache(): void {
  cache.clear();
}

const EMPTY: RegionListState = { regions: [], loading: false, error: false };

export function useRegionList(countryId: string | number | undefined): RegionListState {
  const id = countryId ? String(countryId) : '';
  const [state, setState] = useState<RegionListState>(() =>
    id && cache.has(id) ? { regions: cache.get(id)!, loading: false, error: false } : EMPTY,
  );

  useEffect(() => {
    if (!id) {
      setState(EMPTY);
      return;
    }
    const cached = cache.get(id);
    if (cached) {
      setState({ regions: cached, loading: false, error: false });
      return;
    }

    let cancelled = false;
    setState({ regions: [], loading: true, error: false });
    fetchRegionList(id)
      .then((regions) => {
        cache.set(id, regions);
        if (!cancelled) setState({ regions, loading: false, error: false });
      })
      .catch((e) => {
        console.error('Region list fetch failed:', e);
        if (!cancelled) setState({ regions: [], loading: false, error: true });
      });

    // A country switch mid-flight cancels the stale response so it cannot
    // clobber the newer selection's list.
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
