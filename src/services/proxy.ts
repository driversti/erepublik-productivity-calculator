// All live-data fetches go through the local Node allowlist proxy to bypass CORS.
export function getProxyUrl(targetUrl: string): string {
  return `/proxy?url=${encodeURIComponent(targetUrl)}`;
}

const EREP = 'https://www.erepublik.com';
const TOOLS = 'https://service.erepublik.tools';

export const erepUrl = {
  countrySociety: (permalink: string) => `${EREP}/en/country/society/${permalink}`,
  countryEconomy: (permalink: string) => `${EREP}/en/country/economy/${permalink}`,
  region: (permalink: string) => `${EREP}/en/main/region/${permalink}`,
  market: (industryId: number, quality: number) => `${TOOLS}/api/v1/market/item/0/${industryId}/${quality}`,
};
