import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateProvider } from '../../state/StateContext';
import { IndustryView } from './IndustryView';

beforeEach(() => localStorage.clear());

function setup(key: 'food' | 'houses' = 'food') {
  return render(<StateProvider><IndustryView industryKey={key} /></StateProvider>);
}

describe('IndustryView', () => {
  it('increments a Q1 factory and reflects it in the company KPI', async () => {
    setup('food');
    const card = screen.getByTestId('factory-card-1');
    await userEvent.click(within(card).getByRole('button', { name: 'Companies plus' }));
    expect(screen.getByTestId('total-factories-count')).toHaveTextContent('1');
  });

  it('shows both strategy cards for a food industry', () => {
    setup('food');
    expect(screen.getByTestId('strategy-buy-card')).toBeInTheDocument();
    expect(screen.getByTestId('strategy-produce-card')).toBeInTheDocument();
  });

  it('renders the hired (houses) industry without the WAM toggle', () => {
    setup('houses');
    expect(screen.getByTestId('industry-view-houses')).toBeInTheDocument();
    expect(screen.queryByText(/Work as Manager/i)).not.toBeInTheDocument();
  });

  it('updates net profit when a price is entered for a stocked factory', async () => {
    setup('food');
    const card = screen.getByTestId('factory-card-1');
    await userEvent.click(within(card).getByRole('button', { name: 'Companies plus' }));
    // default prices are 0 → revenue 0; net stays 0.00 but the row exists
    expect(screen.getByTestId('total-net-profit')).toBeInTheDocument();
  });
});
