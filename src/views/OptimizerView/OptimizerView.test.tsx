import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptimizerView } from './OptimizerView';
import { StateProvider } from '../../state/StateContext';
import { STORAGE_KEY } from '../../state/persistence';
import type { CountryEconomics, CountryEconomySource, RegionLiveDetails } from '../../services/economySource';
import type { IndustryKey } from '../../data/types';
import { SNAPSHOT_DATE } from '../../data/regionResources';

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

beforeEach(() => {
  localStorage.clear();
  seedState();
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

  it('renders the region-ownership snapshot date after a scan', async () => {
    setup();
    await userEvent.click(screen.getByTestId('optimizer-scan'));
    // The bundled dataset's fetchedAt equals SNAPSHOT_DATE — a known constant.
    const el = await screen.findByTestId('optimizer-owners-snapshot');
    expect(el).toBeInTheDocument();
    expect(el.textContent).toContain(SNAPSHOT_DATE);
  });
});
