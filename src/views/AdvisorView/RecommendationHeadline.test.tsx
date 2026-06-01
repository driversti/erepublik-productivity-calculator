import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecommendationHeadline } from './RecommendationHeadline';
import type { AdvisorReport } from '../../calc/advisor';

const baseRow = { hireNet: -1, hireNetTycoon: -1, roiRm: 0, owned: 0, hasPrice: true };

function report(partial: Partial<AdvisorReport>): AdvisorReport {
  return { rows: [], rmVerdicts: [], topWam: null, ...partial };
}

describe('RecommendationHeadline', () => {
  it('shows the top WAM pick when it is profitable', () => {
    const top = { industry: 'weapons' as const, quality: 7, wamNet: 12.4, ...baseRow };
    render(<RecommendationHeadline report={report({ rows: [top], topWam: top })} />);
    expect(screen.getByText(/Weapons Q7/)).toBeTruthy();
    expect(screen.getByText(/\+12\.40 CC/)).toBeTruthy();
  });

  it('prompts to sync prices when nothing is priced', () => {
    const row = { industry: 'food' as const, quality: 7, wamNet: null, ...baseRow, hasPrice: false };
    render(<RecommendationHeadline report={report({ rows: [row] })} />);
    expect(screen.getByText(/Sync prices/i)).toBeTruthy();
  });

  it('separates hired profitable-without-Tycoon from Tycoon-only', () => {
    const rows = [
      { industry: 'houses' as const, quality: 5, wamNet: null, ...baseRow, hireNet: 2, hireNetTycoon: 4 },
      { industry: 'aircraft' as const, quality: 5, wamNet: null, ...baseRow, hireNet: -1, hireNetTycoon: 2 },
    ];
    render(<RecommendationHeadline report={report({ rows })} />);
    expect(screen.getByText(/Hired workers profitable:/)).toBeTruthy();
    expect(screen.getByText(/Profitable only with Tycoon:/)).toBeTruthy();
  });
});
