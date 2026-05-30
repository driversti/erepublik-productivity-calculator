import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments and clamps at 0 / max', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Counter label="Companies" value={0} max={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Companies plus' }));
    expect(onChange).toHaveBeenLastCalledWith(1);

    await userEvent.click(screen.getByRole('button', { name: 'Companies minus' }));
    expect(onChange).toHaveBeenLastCalledWith(0); // already 0, stays 0

    rerender(<Counter label="Companies" value={5} max={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Companies plus' }));
    expect(onChange).toHaveBeenLastCalledWith(5); // capped at max
  });

  it('renders the current value', () => {
    render(<Counter label="Workers" value={7} max={10} onChange={() => {}} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
