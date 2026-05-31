import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => localStorage.clear());

describe('App tab routing', () => {
  it('shows the Regions tab and renders RegionsView when clicked', async () => {
    render(<App />);
    const tab = screen.getByTestId('tab-regions');
    expect(tab).toBeInTheDocument();
    await userEvent.click(tab);
    expect(screen.getByTestId('regions-view')).toBeInTheDocument();
  });
});
