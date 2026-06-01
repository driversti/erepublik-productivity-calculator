import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the data service: fetch returns the bundled seed.
vi.mock('../../services/regionData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/regionData')>();
  return {
    ...actual,
    fetchRegionData: vi.fn(async () => actual.BUNDLED_DATASET),
  };
});

import { RegionsView } from './RegionsView';
import { BUNDLED_DATASET } from '../../services/regionData';
import { allCountries, countriesForIndustry } from '../../regions/ranking';

beforeEach(() => vi.clearAllMocks());

function setup() {
  return render(<RegionsView />);
}

describe('RegionsView', () => {
  it('renders a ranked list with the updated-date note', () => {
    setup();
    expect(screen.getByTestId('regions-view')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Updated ${BUNDLED_DATASET.fetchedAt}`))).toBeInTheDocument();
    expect(screen.getAllByTestId('regions-row').length).toBeGreaterThan(0);
  });

  it('switching industry to aircraft shows Dobrogea at +14% (normalized from raw 70)', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    const dobrogea = screen.getByText('Dobrogea').closest('tr') as HTMLElement;
    expect(within(dobrogea).getByText('+14%')).toBeInTheDocument();
  });

  it('keeps the country filter when switching industries', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    await userEvent.selectOptions(screen.getByTestId('regions-country'), 'Romania');
    await userEvent.click(screen.getByTestId('regions-ind-food'));
    expect(screen.getByTestId('regions-country')).toHaveValue('Romania');
    const rows = screen.getAllByTestId('regions-row');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(within(row).getByTestId('regions-country-cell')).toHaveTextContent('Romania');
    }
  });

  it('shows the empty state when the chosen country has no regions for the industry', async () => {
    const aircraftCountries = new Set(countriesForIndustry(BUNDLED_DATASET.regions, 'aircraft'));
    const missing = allCountries(BUNDLED_DATASET.regions).find((c) => !aircraftCountries.has(c));
    expect(missing, 'dataset should contain a country with no aircraft regions').toBeTruthy();
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    await userEvent.selectOptions(screen.getByTestId('regions-country'), missing!);
    expect(screen.getByTestId('regions-empty')).toBeInTheDocument();
    expect(screen.queryAllByTestId('regions-row')).toHaveLength(0);
  });
});
