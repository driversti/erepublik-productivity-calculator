import { describe, it, expect } from 'vitest';
import i18n, { resources } from './index';
import { SUPPORTED_LOCALES } from './config';

describe('i18n catalog', () => {
  it('registers all four namespaces for English', () => {
    expect(Object.keys(resources.en).sort()).toEqual(
      ['common', 'holdings', 'industry', 'tooltips'],
    );
  });

  it('registers all four namespaces for every supported locale', () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(Object.keys(resources[loc]).sort(), `${loc} namespaces`).toEqual(
        ['common', 'holdings', 'industry', 'tooltips'],
      );
    }
  });

  it('names every supported locale in each common catalog', () => {
    for (const loc of SUPPORTED_LOCALES) {
      const { language } = resources[loc].common as { language: Record<string, string> };
      for (const other of SUPPORTED_LOCALES) {
        expect(language[other], `${loc} should name ${other}`).toBeTruthy();
      }
    }
  });

  it('resolves representative keys to real (non-key) strings', () => {
    const keys: readonly string[] = [
      'header.title',
      'buttons.syncLivePrices',
      'industry:summary.netProfit',
      'industry:tables.headers.quality',
      'holdings:summary.title',
      'tooltips:offeredCc',
      'tooltips:breakdownOutput',
      'tooltips:breakdownProfit',
      'industry:summary.breakdownProfitNote',
    ];
    for (const k of keys) {
      const value = i18n.t(k as never);
      expect(value, `${k} should not be the key itself`).not.toBe(k);
      expect((value as string).length, `${k} should have content`).toBeGreaterThan(0);
    }
  });

  it('interpolates dynamic values', () => {
    expect(i18n.t('industry:tables.outputSession', { value: '12.50' })).toBe('12.50 / session');
    expect(i18n.t('holdings:toolbar.deleteConfirm', { name: 'Alpha' })).toBe('Delete holding "Alpha"?');
  });
});
