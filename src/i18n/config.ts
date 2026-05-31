export const LOCALE_STORAGE_KEY = 'erep_locale';

// Add new locale codes here; the LanguageSwitcher appears automatically once
// this list has more than one entry.
export const SUPPORTED_LOCALES = ['en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function loadLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  return (SUPPORTED_LOCALES as readonly string[]).includes(saved ?? '')
    ? (saved as Locale)
    : DEFAULT_LOCALE;
}
