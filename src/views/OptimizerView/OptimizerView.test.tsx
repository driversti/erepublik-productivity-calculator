import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptimizerView } from './OptimizerView';
import { StateProvider } from '../../state/StateContext';
import { STORAGE_KEY } from '../../state/persistence';
import type { CountryEconomics, CountryEconomySource, RegionLiveDetails } from '../../services/economySource';
import type { IndustryKey } from '../../data/types';
import { REGION_RESOURCES } from '../../data/regionResources';

// A stub economy source. Provides economics for only TWO of the bundled food
// candidates' real owner countries (Romania, USA) — the rest are intentionally
// omitted so the "skipped" note appears. USA gets a higher country bonus so its
// region ranks above Romania's, making the sort deterministic. Pollution always
// resolves to an empty map (finalists stay "estimate").
class StubSource implements CountryEconomySource {
  async getCountryEconomics(
    _industry: IndustryKey,
    countryNames: string[],
  ): Promise<Map<string, CountryEconomics>> {
    const m = new Map<string, CountryEconomics>();
    for (const name of countryNames) {
      if (name === 'USA') m.set(name, { countryBonus: 50, averageSalary: 1, workTaxRate: 1, vat: 1 });
      if (name === 'Romania') m.set(name, { countryBonus: 20, averageSalary: 1, workTaxRate: 1, vat: 1 });
    }
    return m;
  }

  async getRegionDetails(): Promise<Map<number, RegionLiveDetails>> {
    // No live details: finalists keep their (normalized) offline bonus and
    // estimated (zero) pollution.
    return new Map();
  }
}

// Seed a food module with one staffed Q1 factory and a sale price so the
// baseline and per-region nets are non-zero (and vary with country bonus).
function seedState() {
  const stored = {
    activeModule: 'optimizer',
    wamEnabled: true,
    food: {
      1: { companies: 1, workers: 1 },
      prices: { 1: 10 },
      vat: 1,
    },
    // Threshold is in the normalized (in-game) bonus scale: offline bonuses are
    // ÷5, so the top food regions sit around +18%. Keep it low enough to admit
    // several candidates (Romania + USA owners) but above zero-bonus regions.
    optimizer: { industry: 'food', threshold: 4, maxCandidates: 10, topN: 5 },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

// Build a minimal universe response whose regions all exist in the seed so the
// join produces real candidates. We include:
//  - regions owned by USA and Romania (countries the StubSource covers) for results
//  - a region owned by a country NOT in StubSource (drives skippedCount > 0)
//  - a phantom NOT in the seed at all (drives noBonusCount > 0)
function makeUniverseResponse() {
  // Pick food-bonus regions from the real seed.
  const usaRegion = REGION_RESOURCES.find(
    (r) => r.currentCountry === 'USA' && r.resources.some((x) => x.industry === 'food'),
  );
  const roRegion = REGION_RESOURCES.find(
    (r) => r.currentCountry === 'Romania' && r.resources.some((x) => x.industry === 'food'),
  );
  // A food-bonus region owned by a country the StubSource does NOT cover, so
  // the scan has to skip it → skippedCount > 0. Use 'Yukon' (Canada, food
  // bonus 55 raw / 11 normalized) which reliably passes threshold=4.
  const yukon = REGION_RESOURCES.find((r) => r.permalink === 'Yukon');

  const seedRegions = [
    ...(usaRegion ? [{ permalink: usaRegion.permalink, name: usaRegion.name, currentCountry: 'USA' }] : []),
    ...(roRegion ? [{ permalink: roRegion.permalink, name: roRegion.name, currentCountry: 'Romania' }] : []),
    ...(yukon ? [{ permalink: yukon.permalink, name: yukon.name, currentCountry: yukon.currentCountry }] : []),
  ];

  const regions = [
    ...seedRegions,
    // A phantom region NOT in the seed — this drives noBonusCount to 1.
    { permalink: '__test_phantom__', name: 'Phantom Region', currentCountry: 'SomeCountry' },
  ];
  return { fetchedAt: '2099-01-01T00:00:00Z', regions };
}

// Mock globalThis.fetch so fetchUniverse (and the flag-refresh effect) resolve
// without hitting a real server. /api/universe returns our minimal universe;
// everything else (e.g. /api/regions for flags) 204s so the bundled fallback is used.
function setupFetchMock() {
  const universeBody = JSON.stringify(makeUniverseResponse());
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.includes('/api/universe')) {
      return Promise.resolve(new Response(universeBody, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    // For all other requests (flags /api/regions, etc.) return 204 → fallback.
    return Promise.resolve(new Response(null, { status: 204 }));
  });
}

beforeEach(() => {
  localStorage.clear();
  seedState();
  setupFetchMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function setup() {
  return render(
    <StateProvider>
      <OptimizerView source={new StubSource()} />
    </StateProvider>,
  );
}

describe('OptimizerView', () => {
  it('renders the industry selector and Scan button', () => {
    setup();
    expect(screen.getByTestId('optimizer-view')).toBeInTheDocument();
    expect(screen.getByTestId('optimizer-ind-food')).toBeInTheDocument();
    expect(screen.getByTestId('optimizer-scan')).toBeInTheDocument();
  });

  it('scans and renders a results table sorted by net descending', async () => {
    setup();
    await userEvent.click(screen.getByTestId('optimizer-scan'));

    await screen.findByTestId('optimizer-table');
    const rows = await screen.findAllByTestId('optimizer-row');
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const nets = screen
      .getAllByTestId('optimizer-net')
      .map((el) => parseFloat(el.textContent!.replace(/[^\d.-]/g, '')));
    for (let i = 1; i < nets.length; i++) {
      expect(nets[i - 1]).toBeGreaterThanOrEqual(nets[i]);
    }
  });

  it('renders the baseline net caption', async () => {
    setup();
    await userEvent.click(screen.getByTestId('optimizer-scan'));
    expect(await screen.findByTestId('optimizer-baseline')).toBeInTheDocument();
  });

  it('shows a skipped note when some candidate owners lack economics', async () => {
    setup();
    await userEvent.click(screen.getByTestId('optimizer-scan'));
    // Only Romania + USA economics provided; other owner countries are skipped.
    await waitFor(() => expect(screen.getByTestId('optimizer-skipped')).toBeInTheDocument());
  });

  it('shows a no-bonus note when the universe has regions absent from the seed', async () => {
    setup();
    await userEvent.click(screen.getByTestId('optimizer-scan'));
    // The phantom region in the mock universe is not in the seed → noBonusCount = 1.
    await waitFor(() => expect(screen.getByTestId('optimizer-no-bonus')).toBeInTheDocument());
  });
});
