import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, LOCALE_STORAGE_KEY } from '../i18n/config';

// Locale picker for the header. Returns null while only one locale exists, so it
// stays invisible today but needs no extra wiring when a second locale is added.
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  if (SUPPORTED_LOCALES.length <= 1) return null;

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  };

  return (
    <select
      className="market-input"
      aria-label={t('language.label')}
      value={i18n.resolvedLanguage}
      onChange={onChange}
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  );
}
