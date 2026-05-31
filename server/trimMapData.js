// Pure transform: raw eRepublik /main/map-data JSON -> the slim dataset the app
// serves. Mirrors the original one-off trim so the shape stays identical to the
// bundled src/data/regionResources.ts seed.
const INDUSTRY_MAP = { food: 'food', weapon: 'weapons', house: 'houses', aircraft: 'aircraft' };

export function trimMapData(raw, fetchedAt) {
  const flags = {};
  const regions = [];
  for (const key of Object.keys(raw)) {
    const r = raw[key];
    const res = (r && r.resources) || [];
    if (!res.length) continue;
    const oc = r.original_country;
    const cc = r.current_country;
    if (oc && oc.name && oc.flag) flags[oc.name] = oc.flag;
    if (cc && cc.name && cc.flag) flags[cc.name] = cc.flag;
    regions.push({
      id: Number(r.region.id),
      name: r.region.name,
      originalCountry: (oc && oc.name) || '',
      currentCountry: (cc && cc.name) || '',
      resources: res.map((x) => ({
        name: x.name,
        industry: INDUSTRY_MAP[x.industry] || x.industry,
        bonus: Number(x.bonus),
      })),
    });
  }
  regions.sort((a, b) => a.id - b.id);
  const countryFlags = {};
  for (const k of Object.keys(flags).sort()) countryFlags[k] = flags[k];
  return { fetchedAt, regions, countryFlags };
}
