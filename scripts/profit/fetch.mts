// Live-data fetchers for the profit report. Thin wrappers over the repo's PURE
// parsers (src/services). All requests go through the GCP proxy so erepublik.com's
// Cloudflare doesn't block a local IP. No new parsing logic lives here.
import { erepUrl } from '../../src/services/proxy';
import { parseFoodMisc, parseCheapestOffer } from '../../src/services/livePrices';
import { parseRegionModifiers, SCRAPE_CONFIG, type RegionModifiers } from '../../src/services/regions';
import type { IndustryKey } from '../../src/data/types';

const PROXY = process.env.EREP_PROXY ?? 'https://epc.yurii.live';

async function proxyJson(url: string): Promise<any> {
  const r = await fetch(`${PROXY}/proxy?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(`proxy ${r.status} for ${url}`);
  return r.json();
}
async function proxyText(url: string): Promise<string> {
  const r = await fetch(`${PROXY}/proxy?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(`proxy ${r.status} for ${url}`);
  return r.text();
}

// tools.com market industry ids (mirrors services/livePrices.ts).
const MARKET: Record<IndustryKey, { product: number; rm: number; maxQ: number }> = {
  food: { product: 1, rm: 7, maxQ: 7 },
  weapons: { product: 2, rm: 12, maxQ: 7 },
  houses: { product: 4, rm: 17, maxQ: 5 },
  aircraft: { product: 23, rm: 24, maxQ: 5 },
};

export interface Prices {
  prices: Record<number, number>;
  rmPrice: number;
}

export async function fetchPrices(key: IndustryKey): Promise<Prices> {
  const m = MARKET[key];
  if (key === 'food') {
    const [food, frm] = await Promise.all([proxyJson(erepUrl.market(m.product, 1)), proxyJson(erepUrl.market(m.rm, 1))]);
    return { prices: parseFoodMisc(food), rmPrice: parseCheapestOffer(frm) ?? 0 };
  }
  const qs = Array.from({ length: m.maxQ }, (_, i) => i + 1);
  const [rm, ...products] = await Promise.all([
    proxyJson(erepUrl.market(m.rm, 1)),
    ...qs.map((q) => proxyJson(erepUrl.market(m.product, q))),
  ]);
  const prices: Record<number, number> = {};
  products.forEach((d, i) => {
    const p = parseCheapestOffer(d);
    if (p !== undefined) prices[i + 1] = p;
  });
  return { prices, rmPrice: parseCheapestOffer(rm) ?? 0 };
}

export async function fetchModifiers(key: IndustryKey, country: string, region: string): Promise<RegionModifiers> {
  const [countryHtml, regionHtml] = await Promise.all([
    proxyText(erepUrl.countryEconomy(country)),
    proxyText(erepUrl.region(region)),
  ]);
  return parseRegionModifiers(countryHtml, regionHtml, SCRAPE_CONFIG[key], 1.0);
}
