import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightsPanel } from './InsightsPanel';
import type { Insight } from '../../calc/advisorInsights';

const insights: Insight[] = [
  { type: 'lossMaker', severity: 'bad', params: { industry: 'weapons', quality: 7, count: 24, perDay: -413.61, total: -9927 } },
  { type: 'hiring', severity: 'info', params: { mode: 'none', salary: 7800 } },
  { type: 'caveat', severity: 'info', params: {} },
];
describe('InsightsPanel', () => {
  it('renders insight lines including the loss-maker and caveat', () => {
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText(/Weapons Q7/)).toBeTruthy();
    expect(screen.getByText(/mark qualities you can't sell/i)).toBeTruthy();
    expect(screen.getByTestId('insight-hiring').textContent).toMatch(/7800/);
  });
});
