// Brittle regex scrapers over erepublik.com raw HTML, ported verbatim from the
// legacy app.js (loadRegionsForCountry / syncRegionModifiers). Each is a PURE
// parse function over an HTML string so it can be tested against saved fixtures
// without network access. JSON-first with a regex-HTML fallback, as in legacy.
import { getProxyUrl, erepUrl } from './proxy';
import { countries } from '../data/travel';
import type { IndustryKey } from '../data/types';

// Per-industry scrape config (industry id, productivity token, region resource
// ids, max quality, economy-page label). Mirrors legacy moduleSyncCfg / cfgs.
export interface IndustryScrapeConfig {
  id: string;
  token: string;
  resources: number[];
  maxQ: number;
  label: string;
}

export const SCRAPE_CONFIG: Record<IndustryKey, IndustryScrapeConfig> = {
  food: { id: '1', token: 'FOOD', resources: [1, 2, 3, 4, 5], maxQ: 7, label: 'Food' },
  weapons: { id: '2', token: 'WEAPON', resources: [6, 7, 8, 9, 10], maxQ: 7, label: 'Weapons' },
  houses: { id: '4', token: 'HOUSE', resources: [11, 12, 13, 14, 15], maxQ: 5, label: 'House' },
  aircraft: { id: '23', token: 'AIRCRAFT', resources: [16, 17, 18, 19, 20], maxQ: 5, label: 'Aircraft Weapons' },
};

export interface ParsedRegion {
  name: string;
  permalink: string;
}

// Region links from the Country Society page (controlled regions).
export function parseRegionList(html: string): ParsedRegion[] {
  const regex = /href="\/\/www\.erepublik\.com\/en\/main\/region\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const out: ParsedRegion[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const permalink = match[1];
    const name = match[2].replace(/<[^>]*>/g, '').trim();
    if (name.toLowerCase() === 'details') continue;
    if (seen.has(permalink)) continue;
    seen.add(permalink);
    out.push({ name, permalink });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// Country industry productivity bonus (JSON-first, regex fallback).
export function parseCountryBonus(countryHtml: string, cfg: IndustryScrapeConfig): number {
  const jsonMatch = countryHtml.match(/var\s+countryProductivityBonuses\s*=\s*([^\n;<]+)/);
  if (jsonMatch) {
    try {
      const bonuses = JSON.parse(jsonMatch[1]);
      if (bonuses.byToken && typeof bonuses.byToken[cfg.token] === 'number') return bonuses.byToken[cfg.token];
      if (bonuses.byId && typeof bonuses.byId[cfg.id] === 'number') return bonuses.byId[cfg.id];
    } catch {
      // fall through to regex
    }
  }
  const htmlMatch = new RegExp(`data-industryId="${cfg.id}"\\s+data-bonus="(\\d+)"`).exec(countryHtml);
  return htmlMatch ? parseInt(htmlMatch[1], 10) : 100;
}

// Region resource bonus: sum of data-bonus across the industry's resource ids.
export function parseRegionBonus(regionHtml: string, cfg: IndustryScrapeConfig): number {
  const regex = new RegExp(`data-resourceId="(${cfg.resources.join('|')})"\\s+data-bonus="(\\d+)"`, 'g');
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(regionHtml)) !== null) total += parseInt(match[2], 10);
  return total;
}

// Quality-indexed pollution (index 0 = RM, 1..maxQ = factories). JSON-first.
export function parseRegionPollution(regionHtml: string, cfg: IndustryScrapeConfig): Record<number, number> {
  const qp: Record<number, number> = {};
  for (let q = 0; q <= cfg.maxQ; q++) qp[q] = 0;
  const jsonMatch = regionHtml.match(/var\s+regionPollutionDetails\s*=\s*([^\n;]+)/);
  if (jsonMatch) {
    try {
      const details = JSON.parse(jsonMatch[1]);
      const raw = details[cfg.id] || [];
      for (let q = 0; q <= cfg.maxQ; q++) {
        if (raw[q] && raw[q].pollution && raw[q].pollution !== 'N/A') qp[q] = parseFloat(raw[q].pollution) || 0;
      }
      return qp;
    } catch {
      // fall through to regex
    }
  }
  for (let q = 0; q <= cfg.maxQ; q++) {
    const cellMatch = new RegExp(`industry-${cfg.id}\\s+quality-${q}[^>]*><span>([^<]+)%?</span>`).exec(regionHtml);
    if (cellMatch && cellMatch[1] !== 'N/A') qp[q] = parseFloat(cellMatch[1]) || 0;
  }
  return qp;
}

// Country-wide work tax (read off the Food row — it's identical across rows).
export function parseWorkTax(countryHtml: string): number {
  const m = countryHtml.match(/Food<\/span>\s*<\/td>\s*<\s*td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)%/i);
  return m ? parseFloat(m[1]) || 0 : 1.0;
}

export function parseAverageSalary(countryHtml: string): number {
  const m = countryHtml.match(/Average<\/span>\s*<\/td>\s*<\s*td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)/i);
  return m ? parseFloat(m[1]) || 0 : 0;
}

// Per-industry VAT (anchored on the industry label row).
export function parseVat(countryHtml: string, cfg: IndustryScrapeConfig, fallback: number): number {
  const vatRegexStr =
    'fakeheight">' + cfg.label + '<\\/span><\\/td>\\s*<td[^>]*>\\s*<span[^>]*>[^<]*<\\/span>\\s*<\\/td>\\s*<td[^>]*>\\s*<span[^>]*>[^<]*<\\/span>%\\s*<\\/td>\\s*<td[^>]*>\\s*<span[^>]*>([\\d.]*)<\\/span>';
  const m = countryHtml.match(new RegExp(vatRegexStr, 'i'));
  if (m && m[1] !== '') return parseFloat(m[1]) || 0;
  return fallback;
}

export interface RegionModifiers {
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  workTaxRate: number;
  averageSalary: number;
  vat: number;
}

// Combine all parsers for one industry from already-fetched HTML.
export function parseRegionModifiers(countryHtml: string, regionHtml: string, cfg: IndustryScrapeConfig, vatFallback: number): RegionModifiers {
  return {
    countryBonus: parseCountryBonus(countryHtml, cfg),
    regionBonus: parseRegionBonus(regionHtml, cfg),
    qualityPollution: parseRegionPollution(regionHtml, cfg),
    workTaxRate: parseWorkTax(countryHtml),
    averageSalary: parseAverageSalary(countryHtml),
    vat: parseVat(countryHtml, cfg, vatFallback),
  };
}

// --- Network fetchers (thin wrappers over the pure parsers) ---

export async function fetchRegionList(countryId: string): Promise<ParsedRegion[]> {
  const country = countries[Number(countryId)];
  if (!country) return [];
  const res = await fetch(getProxyUrl(erepUrl.countrySociety(country.permalink)));
  if (!res.ok) throw new Error('Failed to load country society page');
  return parseRegionList(await res.text());
}

// Fetch country-economy + region pages once; return a parser callable per industry.
export async function fetchCountryRegionHtml(countryId: string, regionPermalink: string): Promise<{ countryHtml: string; regionHtml: string }> {
  const country = countries[Number(countryId)];
  if (!country) throw new Error('Unknown country');
  const [countryRes, regionRes] = await Promise.all([
    fetch(getProxyUrl(erepUrl.countryEconomy(country.permalink))),
    fetch(getProxyUrl(erepUrl.region(regionPermalink))),
  ]);
  if (!countryRes.ok || !regionRes.ok) throw new Error('eRepublik server returned an error');
  return { countryHtml: await countryRes.text(), regionHtml: await regionRes.text() };
}
