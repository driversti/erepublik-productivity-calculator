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
import hrCommon from './locales/hr/common.json';
import hrIndustry from './locales/hr/industry.json';
import hrHoldings from './locales/hr/holdings.json';
import hrTooltips from './locales/hr/tooltips.json';
import trCommon from './locales/tr/common.json';
import trIndustry from './locales/tr/industry.json';
import trHoldings from './locales/tr/holdings.json';
import trTooltips from './locales/tr/tooltips.json';
import roCommon from './locales/ro/common.json';
import roIndustry from './locales/ro/industry.json';
import roHoldings from './locales/ro/holdings.json';
import roTooltips from './locales/ro/tooltips.json';
import bgCommon from './locales/bg/common.json';
import bgIndustry from './locales/bg/industry.json';
import bgHoldings from './locales/bg/holdings.json';
import bgTooltips from './locales/bg/tooltips.json';
import plCommon from './locales/pl/common.json';
import plIndustry from './locales/pl/industry.json';
import plHoldings from './locales/pl/holdings.json';
import plTooltips from './locales/pl/tooltips.json';
import itCommon from './locales/it/common.json';
import itIndustry from './locales/it/industry.json';
import itHoldings from './locales/it/holdings.json';
import itTooltips from './locales/it/tooltips.json';
import esCommon from './locales/es/common.json';
import esIndustry from './locales/es/industry.json';
import esHoldings from './locales/es/holdings.json';
import esTooltips from './locales/es/tooltips.json';
import frCommon from './locales/fr/common.json';
import frIndustry from './locales/fr/industry.json';
import frHoldings from './locales/fr/holdings.json';
import frTooltips from './locales/fr/tooltips.json';
import deCommon from './locales/de/common.json';
import deIndustry from './locales/de/industry.json';
import deHoldings from './locales/de/holdings.json';
import deTooltips from './locales/de/tooltips.json';
import faCommon from './locales/fa/common.json';
import faIndustry from './locales/fa/industry.json';
import faHoldings from './locales/fa/holdings.json';
import faTooltips from './locales/fa/tooltips.json';
import ptCommon from './locales/pt/common.json';
import ptIndustry from './locales/pt/industry.json';
import ptHoldings from './locales/pt/holdings.json';
import ptTooltips from './locales/pt/tooltips.json';
import zhCommon from './locales/zh/common.json';
import zhIndustry from './locales/zh/industry.json';
import zhHoldings from './locales/zh/holdings.json';
import zhTooltips from './locales/zh/tooltips.json';
import idCommon from './locales/id/common.json';
import idIndustry from './locales/id/industry.json';
import idHoldings from './locales/id/holdings.json';
import idTooltips from './locales/id/tooltips.json';
import elCommon from './locales/el/common.json';
import elIndustry from './locales/el/industry.json';
import elHoldings from './locales/el/holdings.json';
import elTooltips from './locales/el/tooltips.json';
import huCommon from './locales/hu/common.json';
import huIndustry from './locales/hu/industry.json';
import huHoldings from './locales/hu/holdings.json';
import huTooltips from './locales/hu/tooltips.json';
import koCommon from './locales/ko/common.json';
import koIndustry from './locales/ko/industry.json';
import koHoldings from './locales/ko/holdings.json';
import koTooltips from './locales/ko/tooltips.json';
import mkCommon from './locales/mk/common.json';
import mkIndustry from './locales/mk/industry.json';
import mkHoldings from './locales/mk/holdings.json';
import mkTooltips from './locales/mk/tooltips.json';
import skCommon from './locales/sk/common.json';
import skIndustry from './locales/sk/industry.json';
import skHoldings from './locales/sk/holdings.json';
import skTooltips from './locales/sk/tooltips.json';
import sqCommon from './locales/sq/common.json';
import sqIndustry from './locales/sq/industry.json';
import sqHoldings from './locales/sq/holdings.json';
import sqTooltips from './locales/sq/tooltips.json';
import srCommon from './locales/sr/common.json';
import srIndustry from './locales/sr/industry.json';
import srHoldings from './locales/sr/holdings.json';
import srTooltips from './locales/sr/tooltips.json';
import zhTWCommon from './locales/zh-TW/common.json';
import zhTWIndustry from './locales/zh-TW/industry.json';
import zhTWHoldings from './locales/zh-TW/holdings.json';
import zhTWTooltips from './locales/zh-TW/tooltips.json';
import beCommon from './locales/be/common.json';
import beIndustry from './locales/be/industry.json';
import beHoldings from './locales/be/holdings.json';
import beTooltips from './locales/be/tooltips.json';
import jaCommon from './locales/ja/common.json';
import jaIndustry from './locales/ja/industry.json';
import jaHoldings from './locales/ja/holdings.json';
import jaTooltips from './locales/ja/tooltips.json';

// Resources for every supported locale. This file is GENERATED by
// scripts/gen-i18n-resources.mjs — re-run it after adding a locale folder
// rather than editing the import/resource lists by hand.
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
  hr: {
    common: hrCommon,
    industry: hrIndustry,
    holdings: hrHoldings,
    tooltips: hrTooltips,
  },
  tr: {
    common: trCommon,
    industry: trIndustry,
    holdings: trHoldings,
    tooltips: trTooltips,
  },
  ro: {
    common: roCommon,
    industry: roIndustry,
    holdings: roHoldings,
    tooltips: roTooltips,
  },
  bg: {
    common: bgCommon,
    industry: bgIndustry,
    holdings: bgHoldings,
    tooltips: bgTooltips,
  },
  pl: {
    common: plCommon,
    industry: plIndustry,
    holdings: plHoldings,
    tooltips: plTooltips,
  },
  it: {
    common: itCommon,
    industry: itIndustry,
    holdings: itHoldings,
    tooltips: itTooltips,
  },
  es: {
    common: esCommon,
    industry: esIndustry,
    holdings: esHoldings,
    tooltips: esTooltips,
  },
  fr: {
    common: frCommon,
    industry: frIndustry,
    holdings: frHoldings,
    tooltips: frTooltips,
  },
  de: {
    common: deCommon,
    industry: deIndustry,
    holdings: deHoldings,
    tooltips: deTooltips,
  },
  fa: {
    common: faCommon,
    industry: faIndustry,
    holdings: faHoldings,
    tooltips: faTooltips,
  },
  pt: {
    common: ptCommon,
    industry: ptIndustry,
    holdings: ptHoldings,
    tooltips: ptTooltips,
  },
  zh: {
    common: zhCommon,
    industry: zhIndustry,
    holdings: zhHoldings,
    tooltips: zhTooltips,
  },
  id: {
    common: idCommon,
    industry: idIndustry,
    holdings: idHoldings,
    tooltips: idTooltips,
  },
  el: {
    common: elCommon,
    industry: elIndustry,
    holdings: elHoldings,
    tooltips: elTooltips,
  },
  hu: {
    common: huCommon,
    industry: huIndustry,
    holdings: huHoldings,
    tooltips: huTooltips,
  },
  ko: {
    common: koCommon,
    industry: koIndustry,
    holdings: koHoldings,
    tooltips: koTooltips,
  },
  mk: {
    common: mkCommon,
    industry: mkIndustry,
    holdings: mkHoldings,
    tooltips: mkTooltips,
  },
  sk: {
    common: skCommon,
    industry: skIndustry,
    holdings: skHoldings,
    tooltips: skTooltips,
  },
  sq: {
    common: sqCommon,
    industry: sqIndustry,
    holdings: sqHoldings,
    tooltips: sqTooltips,
  },
  sr: {
    common: srCommon,
    industry: srIndustry,
    holdings: srHoldings,
    tooltips: srTooltips,
  },
  'zh-TW': {
    common: zhTWCommon,
    industry: zhTWIndustry,
    holdings: zhTWHoldings,
    tooltips: zhTWTooltips,
  },
  be: {
    common: beCommon,
    industry: beIndustry,
    holdings: beHoldings,
    tooltips: beTooltips,
  },
  ja: {
    common: jaCommon,
    industry: jaIndustry,
    holdings: jaHoldings,
    tooltips: jaTooltips,
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
