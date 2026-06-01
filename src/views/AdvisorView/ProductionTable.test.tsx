import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductionTable } from './ProductionTable';
import type { AdvisorRow } from '../../calc/advisor';

const rows: AdvisorRow[] = [
  { industry: 'food', quality: 7, kind: 'factory', wamNet: 10, hireNet: -1, hireNetTycoon: 0.3, roiRm: 0.28, owned: 5, hasPrice: true },
  { industry: 'weapons', quality: 7, kind: 'factory', wamNet: 12, hireNet: -1.2, hireNetTycoon: 0.9, roiRm: 0.34, owned: 0, hasPrice: true },
  { industry: 'houses', quality: 5, kind: 'factory', wamNet: null, hireNet: -0.4, hireNetTycoon: 1.6, roiRm: 0.21, owned: 0, hasPrice: true },
  { industry: 'food', quality: 5, kind: 'rm', wamNet: 2.5, hireNet: 1, hireNetTycoon: 1.5, roiRm: null, owned: 0, hasPrice: true },
];

describe('ProductionTable', () => {
  it('defaults to sorting by net/WAM descending (weapons Q7 first)', () => {
    render(<ProductionTable rows={rows} />);
    const first = screen.getAllByTestId('advisor-row')[0];
    expect(within(first).getByText(/Weapons Q7/)).toBeTruthy();
  });

  it('re-sorts when a column header is clicked (net/hired Tycoon → houses Q5 first)', () => {
    render(<ProductionTable rows={rows} />);
    fireEvent.click(screen.getByTestId('sort-hireTycoon'));
    const first = screen.getAllByTestId('advisor-row')[0];
    expect(within(first).getByText(/Houses Q5/)).toBeTruthy();
  });

  it('renders raw-material rows with the RM name and a "raw" badge', () => {
    render(<ProductionTable rows={rows} />);
    expect(screen.getByText(/FRM Q5/)).toBeTruthy();
    expect(screen.getByText('raw')).toBeTruthy();
  });
});
