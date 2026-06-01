import { parseRegionList } from './regionList.js';

// Pure: per-country region lists -> deduped universe tagged with the owner.
// Input: [{ country, regions: [{name, permalink}] }]. First occurrence of a
// permalink wins (lists are passed in a stable order).
export function aggregateUniverse(perCountry) {
  const byPermalink = new Map();
  for (const { country, regions } of perCountry) {
    for (const r of regions) {
      if (byPermalink.has(r.permalink)) continue;
      byPermalink.set(r.permalink, { permalink: r.permalink, name: r.name, currentCountry: country });
    }
  }
  return [...byPermalink.values()].sort((a, b) => a.permalink.localeCompare(b.permalink));
}

// Orchestrator: fetch each country's Society page and aggregate. `fetchImpl`
// is injected (the server's anonymous fetch returning page text). `countries`
// is [{name, permalink}].
export async function buildUniverse(fetchImpl, countries) {
  const perCountry = [];
  for (const c of countries) {
    try {
      const html = await fetchImpl(`https://www.erepublik.com/en/country/society/${c.permalink}`);
      perCountry.push({ country: c.name, regions: parseRegionList(html) });
    } catch {
      // skip a country whose page failed — partial universe is still useful
    }
  }
  return aggregateUniverse(perCountry);
}
