import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionsView } from './RegionsView';
import { SNAPSHOT_DATE } from '../../data/regionResources';

function setup() {
  return render(<RegionsView />);
}

describe('RegionsView', () => {
  it('renders a ranked list with the snapshot note', () => {
    setup();
    expect(screen.getByTestId('regions-view')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Snapshot ${SNAPSHOT_DATE}`))).toBeInTheDocument();
    expect(screen.getAllByTestId('regions-row').length).toBeGreaterThan(0);
  });

  it('switching industry to aircraft shows Dobrogea at +70%', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    const dobrogea = screen.getByText('Dobrogea').closest('tr') as HTMLElement;
    expect(within(dobrogea).getByText('+70%')).toBeInTheDocument();
  });

  it('country filter narrows rows to the chosen country', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    await userEvent.selectOptions(screen.getByTestId('regions-country'), 'Romania');
    const rows = screen.getAllByTestId('regions-row');
    for (const row of rows) {
      expect(within(row).getByTestId('regions-country-cell')).toHaveTextContent('Romania');
    }
  });
});
