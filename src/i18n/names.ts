import type { TFunction } from 'i18next';
import type { IndustryConfig } from '../data/types';

// Industry & raw-material display names stay canonical in data/industries.ts for
// English. We resolve them through i18next with the data value as defaultValue,
// so EN is always byte-identical and other locales can override via
// `industry:names.<key>.label` / `.rm`. The key is cast because these names are
// intentionally absent from the typed EN resources.
export const industryLabel = (t: TFunction, cfg: IndustryConfig): string =>
  t(`industry:names.${cfg.key}.label` as never, { defaultValue: cfg.label });

export const industryRm = (t: TFunction, cfg: IndustryConfig): string =>
  t(`industry:names.${cfg.key}.rm` as never, { defaultValue: cfg.rmName });
