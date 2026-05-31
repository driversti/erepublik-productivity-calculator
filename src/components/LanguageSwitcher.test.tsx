import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SUPPORTED_LOCALES } from '../i18n/config';

describe('LanguageSwitcher', () => {
  it('renders nothing while only one locale is configured', () => {
    // Guard: this test encodes the current single-locale behaviour.
    expect(SUPPORTED_LOCALES.length).toBe(1);
    const { container } = render(<LanguageSwitcher />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
