// Normalizes a `currentCountry` display name from regionResources.ts to the
// canonical country name used by src/data/countries.json (via src/data/travel.ts).
//
// Grounding: after comparing all 70 distinct `currentCountry` values in
// src/data/regionResources.ts against the country names in countries.json,
// the two sets are identical — every regionResources name appears verbatim in
// countries.json. No aliases are needed at this time; ALIASES is kept as an
// extension point in case the two data sources diverge in the future.

// regionResources display name -> canonical name used by countries.json.
const ALIASES: Record<string, string> = {
  // No mismatches found between regionResources.ts and countries.json.
  // Add entries here if a future data update introduces a divergence.
};

export function normalizeCountryName(name: string): string {
  return ALIASES[name] ?? name;
}
