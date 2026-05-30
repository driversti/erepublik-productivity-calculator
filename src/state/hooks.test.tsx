import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateProvider } from './StateContext';
import { useActiveModule, useSwitchModule, useIndustryView, useSetFactoryCell } from './hooks';

beforeEach(() => localStorage.clear());

function ModuleProbe() {
  const active = useActiveModule();
  const switchTo = useSwitchModule();
  return <button onClick={() => switchTo('weapons')}>active:{active}</button>;
}

function ViewProbe() {
  const view = useIndustryView('food');
  const setCell = useSetFactoryCell();
  return (
    <div>
      <span data-testid="count">{view.totalFactories}</span>
      <button onClick={() => setCell('food', 'factory', 1, 'companies', 2)}>add</button>
    </div>
  );
}

describe('facade hooks', () => {
  it('useSwitchModule updates the active module', async () => {
    render(<StateProvider><ModuleProbe /></StateProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('active:food');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('active:weapons');
  });

  it('useIndustryView reflects dispatched cell changes', async () => {
    render(<StateProvider><ViewProbe /></StateProvider>);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await userEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });
});
