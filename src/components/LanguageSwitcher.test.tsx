import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SUPPORTED_LOCALES } from '../i18n/config';

describe('LanguageSwitcher', () => {
  it('shows a trigger and reveals one option per locale when opened', async () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThan(1);
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    // Collapsed by default: trigger present, options hidden.
    const trigger = screen.getByRole('button', { name: /language|мова/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(SUPPORTED_LOCALES.length);
  });

  it('switches the active language when an option is picked', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /language|мова/i }));
    await user.click(screen.getByRole('option', { name: /українська/i }));

    // Menu closes and the trigger now reflects the picked locale.
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('UK')).toBeInTheDocument();
  });
});
