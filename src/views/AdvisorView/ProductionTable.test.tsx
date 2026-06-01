import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductionTable } from './ProductionTable';
import type { AdvisorRow } from '../../calc/advisor';

const rows: AdvisorRow[] = [
  { industry: 'food', quality: 7, kind: 'factory', wamNet: 10, hireNet: -1, hireNetTycoon: 0.3, roiRm: 0.28, owned: 5, hasPrice: true, excluded: false },
  { industry: 'weapons', quality: 7, kind: 'factory', wamNet: 12, hireNet: -1.2, hireNetTycoon: 0.9, roiRm: 0.34, owned: 0, hasPrice: true, excluded: false },
  { industry: 'houses', quality: 5, kind: 'factory', wamNet: null, hireNet: -0.4, hireNetTycoon: 1.6, roiRm: 0.21, owned: 0, hasPrice: true, excluded: false },
  { industry: 'food', quality: 5, kind: 'rm', wamNet: 2.5, hireNet: 1, hireNetTycoon: 1.5, roiRm: null, owned: 0, hasPrice: true, excluded: false },
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

  it('fires onToggleExclude with industry+quality for finished rows', () => {
    const fxRows = [
      { industry: 'weapons', quality: 7, kind: 'factory', wamNet: -413, hireNet: -8000, hireNetTycoon: -8000, roiRm: -0.2, owned: 24, hasPrice: true, excluded: false },
    ] as AdvisorRow[];
    const spy = vi.fn();
    render(<ProductionTable rows={fxRows} onToggleExclude={spy} />);
    fireEvent.click(screen.getByTestId('exclude-weapons-7'));
    expect(spy).toHaveBeenCalledWith('weapons', 7);
  });

  it('does not render an exclude toggle for raw-material rows', () => {
    const fxRows = [
      { industry: 'food', quality: 5, kind: 'rm', wamNet: 2.5, hireNet: 1, hireNetTycoon: 1.5, roiRm: null, owned: 0, hasPrice: true, excluded: false },
    ] as AdvisorRow[];
    render(<ProductionTable rows={fxRows} />);
    expect(screen.queryByTestId('exclude-food-5')).toBeNull();
  });

  it('excluded row gets the excluded class and badge', () => {
    const fxRows = [
      { industry: 'food', quality: 7, kind: 'factory', wamNet: 5, hireNet: 1, hireNetTycoon: 1.5, roiRm: 0.2, owned: 2, hasPrice: true, excluded: true },
    ] as AdvisorRow[];
    render(<ProductionTable rows={fxRows} />);
    const row = screen.getByTestId('advisor-row');
    expect(row.className).toContain('excluded');
    expect(screen.getByText("won't sell")).toBeTruthy();
  });

  it('does not throw when onToggleExclude is not provided', () => {
    const fxRows = [
      { industry: 'food', quality: 7, kind: 'factory', wamNet: 5, hireNet: 1, hireNetTycoon: 1.5, roiRm: 0.2, owned: 0, hasPrice: true, excluded: false },
    ] as AdvisorRow[];
    render(<ProductionTable rows={fxRows} />);
    expect(() => fireEvent.click(screen.getByTestId('exclude-food-7'))).not.toThrow();
  });
});
