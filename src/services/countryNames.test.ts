import { describe, it, expect } from 'vitest';
import { normalizeCountryName } from './countryNames';

// Grounding result: after comparing all distinct `currentCountry` values in
// src/data/regionResources.ts against the country names in countries.json,
// the two sets are identical — all 70 regionResources country names appear
// verbatim in countries.json. No aliases are needed; ALIASES is empty {}.

describe('normalizeCountryName', () => {
  it('passes through names that already match travel.ts exactly', () => {
    expect(normalizeCountryName('Romania')).toBe('Romania');
    expect(normalizeCountryName('USA')).toBe('USA');
    expect(normalizeCountryName('Republic of China (Taiwan)')).toBe('Republic of China (Taiwan)');
    expect(normalizeCountryName('Bosnia and Herzegovina')).toBe('Bosnia and Herzegovina');
    expect(normalizeCountryName('United Kingdom')).toBe('United Kingdom');
    expect(normalizeCountryName('Republic of Moldova')).toBe('Republic of Moldova');
    expect(normalizeCountryName('South Korea')).toBe('South Korea');
    expect(normalizeCountryName('United Arab Emirates')).toBe('United Arab Emirates');
  });

  it('passes through unknown strings unchanged', () => {
    expect(normalizeCountryName('Narnia')).toBe('Narnia');
    expect(normalizeCountryName('')).toBe('');
    expect(normalizeCountryName('Unknown Country')).toBe('Unknown Country');
  });
});
