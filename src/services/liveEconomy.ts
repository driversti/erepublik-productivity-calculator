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
import type { CountryEconomics, CountryEconomySource, RegionLiveDetails, RegionRef } from './economySource';
import { countries } from '../data/travel';
import { getProxyUrl, erepUrl } from './proxy';
import { normalizeCountryName } from './countryNames';
import {
  SCRAPE_CONFIG,
  parseCountryBonus,
  parseAverageSalary,
  parseWorkTax,
  parseVat,
  parseRegionBonus,
  parseRegionPollution,
} from './regions';
import { mapWithLimit } from './concurrency';

const CONCURRENCY = 5;
const VAT_FALLBACK = 0;

/** Lazily-built name → country-entry index (built once, reused on every call). */
let _nameIndex: Map<string, { permalink: string }> | null = null;
function getNameIndex(): Map<string, { permalink: string }> {
  if (_nameIndex) return _nameIndex;
  _nameIndex = new Map<string, { permalink: string }>();
  for (const country of Object.values(countries)) {
    _nameIndex.set(country.name, { permalink: country.permalink });
  }
  return _nameIndex;
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
    const nameIndex = getNameIndex();
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
      } catch {
        // skip this item on any network or parse error
      } finally {
        done++;
        onProgress?.(done, total);
      }
    });

    return result;
  }

  /**
   * Fetches real region bonus + quality-indexed pollution maps for the given
   * region ids. The region page is fetched ONCE per region and both the live
   * bonus and pollution are parsed from it.
   *
   * Returns a Map keyed by region id. Missing region ids and failed fetches are
   * silently skipped.
   */
  async getRegionDetails(
    industry: IndustryKey,
    regions: RegionRef[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, RegionLiveDetails>> {
    const cfg = SCRAPE_CONFIG[industry];
    const result = new Map<number, RegionLiveDetails>();
    const total = regions.length;
    let done = 0;

    await mapWithLimit(regions, CONCURRENCY, async (region) => {
      try {
        if (!region.permalink) return; // no slug — cannot build the URL
        const url = getProxyUrl(erepUrl.region(region.permalink));
        const res = await fetch(url);
        if (!res.ok) return; // server error — skip

        const html = await res.text();
        result.set(region.id, {
          regionBonus: parseRegionBonus(html, cfg),
          pollution: parseRegionPollution(html, cfg),
        });
      } catch {
        // skip on any network or parse error
      } finally {
        done++;
        onProgress?.(done, total);
      }
    });

    return result;
  }
}
