export const LOCALE_STORAGE_KEY = 'erep_locale';

// Add new locale codes here, then run `node scripts/gen-i18n-resources.mjs` to
// regenerate index.ts. The LanguageSwitcher appears automatically once this list
// has more than one entry.
export const SUPPORTED_LOCALES = [
  'en', 'uk', 'hr', 'tr', 'ro', 'bg', 'pl', 'it', 'es', 'fr', 'de', 'fa',
  'pt', 'zh', 'id', 'el', 'hu', 'ko', 'mk', 'sk', 'sq', 'sr', 'zh-TW', 'be',
] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

// Right-to-left locales — drive the document `dir` attribute.
export const RTL_LOCALES: readonly Locale[] = ['fa'];
export const isRtl = (locale: string): boolean =>
  (RTL_LOCALES as readonly string[]).includes(locale);

// ISO 3166-1 alpha-2 country code per locale, for flag-icons (`fi fi-<code>`).
export const LOCALE_FLAG: Record<Locale, string> = {
  en: 'gb', uk: 'ua', hr: 'hr', tr: 'tr', ro: 'ro', bg: 'bg', pl: 'pl',
  it: 'it', es: 'es', fr: 'fr', de: 'de', fa: 'ir', pt: 'pt', zh: 'cn',
  id: 'id', el: 'gr', hu: 'hu', ko: 'kr', mk: 'mk', sk: 'sk', sq: 'al',
  sr: 'rs', 'zh-TW': 'tw', be: 'by',
};

export function loadLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  return (SUPPORTED_LOCALES as readonly string[]).includes(saved ?? '')
    ? (saved as Locale)
    : DEFAULT_LOCALE;
}
