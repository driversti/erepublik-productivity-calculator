import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateProvider } from '../../state/StateContext';
import { HoldingsView } from './HoldingsView';

beforeEach(() => localStorage.clear());

function setup() {
  return render(<StateProvider><HoldingsView /></StateProvider>);
}

describe('HoldingsView', () => {
  it('shows the empty state with no holdings', () => {
    setup();
    expect(screen.getByTestId('hld-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('hld-content')).not.toBeInTheDocument();
  });

  it('creates a holding via + New (prompt) and shows content', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Berlin');
    setup();
    await userEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    expect(screen.getByTestId('hld-content')).toBeInTheDocument();
    expect(screen.getByTestId('hld-tab-h1')).toHaveTextContent('Berlin');
    vi.restoreAllMocks();
  });

  it('adds a company in a holding industry and reflects it in the summary', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Berlin');
    setup();
    await userEvent.click(screen.getByRole('button', { name: /\+ New/i }));

    // Food section is present; expand if collapsed, then add a company.
    const section = screen.getByTestId('hld-section-food');
    const head = section.querySelector('.hld-section-head') as HTMLElement;
    await userEvent.click(head); // expand (empty → starts collapsed)
    const plusButtons = within(section).getAllByRole('button', { name: 'Companies plus' });
    await userEvent.click(plusButtons[0]);

    expect(screen.getByTestId('hld-total-companies')).toHaveTextContent('1');
    vi.restoreAllMocks();
  });
});
