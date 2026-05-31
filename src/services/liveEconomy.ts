/**
 * LiveEconomySource — server-side implementation of CountryEconomySource.
 *
 * Fetches country economy pages and region pages via the /proxy endpoint (all
 * requests egress server-side, no CORS issues). Reuses the pure HTML parsers
 * from regions.ts verbatim — no new parsers introduced here.
 *
 * VAT fallback choice: 0.  The game can render 0% VAT for some industries in
 * some countries, and the parser returns the fallback only when it cannot find
 * the label row at all (malformed/changed markup). Defaulting to 0 is the
 * safest neutral value — it neither inflates nor deflates estimated profit when
 * the page is unreadable. Callers may override by supplying their own instance
 * with a different strategy; the fallback is not part of the public interface.
 */
import type { IndustryKey } from '../data/types';
import type { CountryEconomics, CountryEconomySource } from './economySource';
import { countries, regions } from '../data/travel';
import { getProxyUrl, erepUrl } from './proxy';
import { normalizeCountryName } from './countryNames';
import {
  SCRAPE_CONFIG,
  parseCountryBonus,
  parseAverageSalary,
  parseWorkTax,
  parseVat,
  parseRegionPollution,
} from './regions';
import { mapWithLimit } from './concurrency';

const CONCURRENCY = 5;
const VAT_FALLBACK = 0;

/** Build a name → country-entry index from the travel data (done once per call). */
function buildNameIndex(): Map<string, { permalink: string }> {
  const index = new Map<string, { permalink: string }>();
  for (const country of Object.values(countries)) {
    index.set(country.name, { permalink: country.permalink });
  }
  return index;
}

export class LiveEconomySource implements CountryEconomySource {
  /**
   * Fetches per-country economics for the given list of display names.
   *
   * Returns a Map keyed by the ORIGINAL input name so callers can look up by
   * `region.currentCountry` directly. Unknown names and failed fetches are
   * silently skipped — the batch always resolves.
   */
  async getCountryEconomics(
    industry: IndustryKey,
    countryNames: string[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<string, CountryEconomics>> {
    const cfg = SCRAPE_CONFIG[industry];
    const nameIndex = buildNameIndex();
    const result = new Map<string, CountryEconomics>();
    const total = countryNames.length;
    let done = 0;

    await mapWithLimit(countryNames, CONCURRENCY, async (inputName) => {
      try {
        const canonical = normalizeCountryName(inputName);
        const entry = nameIndex.get(canonical);
        if (!entry) return; // unknown country name — skip

        const url = getProxyUrl(erepUrl.countryEconomy(entry.permalink));
        const res = await fetch(url);
        if (!res.ok) return; // server error — skip

        const html = await res.text();
        const economics: CountryEconomics = {
          countryBonus: parseCountryBonus(html, cfg),
          averageSalary: parseAverageSalary(html),
          workTaxRate: parseWorkTax(html),
          vat: parseVat(html, cfg, VAT_FALLBACK),
        };
        result.set(inputName, economics);
      } finally {
        done++;
        onProgress?.(done, total);
      }
    });

    return result;
  }

  /**
   * Fetches real quality-indexed pollution maps for the given region ids.
   *
   * Returns a Map keyed by region id. Missing region ids and failed fetches are
   * silently skipped.
   */
  async getRegionPollution(
    industry: IndustryKey,
    regionIds: number[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, Record<number, number>>> {
    const cfg = SCRAPE_CONFIG[industry];
    const result = new Map<number, Record<number, number>>();
    const total = regionIds.length;
    let done = 0;

    await mapWithLimit(regionIds, CONCURRENCY, async (regionId) => {
      try {
        const regionEntry = regions[regionId];
        if (!regionEntry) return; // unknown region id — skip

        const url = getProxyUrl(erepUrl.region(regionEntry.permalink));
        const res = await fetch(url);
        if (!res.ok) return; // server error — skip

        const html = await res.text();
        result.set(regionId, parseRegionPollution(html, cfg));
      } finally {
        done++;
        onProgress?.(done, total);
      }
    });

    return result;
  }
}
