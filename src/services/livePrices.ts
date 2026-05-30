// eRepublik Tools market API. Pure parsers (testable without network) + fetchers.
import { getProxyUrl, erepUrl } from './proxy';
import type { IndustryKey } from '../data/types';

interface MarketOffer {
  gross?: number;
}
interface MarketResponse {
  status?: string;
  info?: { misc?: Record<number, { gross?: number } | undefined> };
  offers?: MarketOffer[];
}

// Industry ids in the eRepublik Tools market API (finished goods + raw materials).
const FOOD = 1;
const FRM = 7;
const WEAPONS = 2;
const WRM = 12;
const HOUSES = 4;
const HRM = 17;
const AIRCRAFT = 23;
const ARM = 24;

// Cheapest-offer price, or undefined if none.
export function parseCheapestOffer(data: MarketResponse): number | undefined {
  if (data.status === 'ok' && data.offers && data.offers.length > 0 && typeof data.offers[0].gross === 'number') {
    return data.offers[0].gross;
  }
  return undefined;
}

// Food aggregate: info.misc holds Q1..Q7 gross prices in one response.
export function parseFoodMisc(data: MarketResponse): Record<number, number> {
  const out: Record<number, number> = {};
  if (data.status === 'ok' && data.info && data.info.misc) {
    for (let q = 1; q <= 7; q++) {
      const e = data.info.misc[q];
      if (e && typeof e.gross === 'number') out[q] = e.gross;
    }
  }
  return out;
}

async function fetchJson(url: string): Promise<MarketResponse> {
  const res = await fetch(getProxyUrl(url));
  if (!res.ok) throw new Error(`Market request failed: ${url}`);
  return (await res.json()) as MarketResponse;
}

export interface PriceSyncResult {
  prices: Record<number, number>;
  rmPrice?: number;
}

// Fetch product (Q1..maxQ) + raw-material prices for one industry.
export async function fetchPrices(industry: IndustryKey, maxQuality: number): Promise<PriceSyncResult> {
  if (industry === 'food') {
    const [food, frm] = await Promise.all([fetchJson(erepUrl.market(FOOD, 1)), fetchJson(erepUrl.market(FRM, 1))]);
    return { prices: parseFoodMisc(food), rmPrice: parseCheapestOffer(frm) };
  }

  const map: Record<Exclude<IndustryKey, 'food'>, { product: number; rm: number }> = {
    weapons: { product: WEAPONS, rm: WRM },
    houses: { product: HOUSES, rm: HRM },
    aircraft: { product: AIRCRAFT, rm: ARM },
  };
  const ids = map[industry];
  const qualities = Array.from({ length: maxQuality }, (_, i) => i + 1);
  const [rm, ...products] = await Promise.all([
    fetchJson(erepUrl.market(ids.rm, 1)),
    ...qualities.map((q) => fetchJson(erepUrl.market(ids.product, q))),
  ]);
  const prices: Record<number, number> = {};
  products.forEach((data, i) => {
    const p = parseCheapestOffer(data);
    if (p !== undefined) prices[i + 1] = p;
  });
  return { prices, rmPrice: parseCheapestOffer(rm) };
}
