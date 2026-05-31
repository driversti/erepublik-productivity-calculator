import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, loadLocale } from './config';
import enCommon from './locales/en/common.json';
import enIndustry from './locales/en/industry.json';
import enHoldings from './locales/en/holdings.json';
import enTooltips from './locales/en/tooltips.json';
import ukCommon from './locales/uk/common.json';
import ukIndustry from './locales/uk/industry.json';
import ukHoldings from './locales/uk/holdings.json';
import ukTooltips from './locales/uk/tooltips.json';

export const resources = {
  en: {
    common: enCommon,
    industry: enIndustry,
    holdings: enHoldings,
    tooltips: enTooltips,
  },
  uk: {
    common: ukCommon,
    industry: ukIndustry,
    holdings: ukHoldings,
    tooltips: ukTooltips,
  },
} as const;

// Synchronous init: resources are bundled JSON, so translated text is present on
// first render (no Suspense, no key flash, tests render immediately). Uses the
// global instance via initReactI18next — components need no <I18nextProvider>.
i18n.use(initReactI18next).init({
  resources,
  lng: loadLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: ['common', 'industry', 'holdings', 'tooltips'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
