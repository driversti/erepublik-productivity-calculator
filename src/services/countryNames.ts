// Normalizes a `currentCountry` display name from regionResources.ts to the
// canonical country name used by src/data/travel.ts (travelData.js).
//
// Grounding: after comparing all 70 distinct `currentCountry` values in
// src/data/regionResources.ts against the country names in travelData.js,
// the two sets are identical — every regionResources name appears verbatim in
// travel.ts. No aliases are needed at this time; ALIASES is kept as an
// extension point in case the two data sources diverge in the future.

// regionResources display name -> canonical name used by travel data.
const ALIASES: Record<string, string> = {
  // No mismatches found between regionResources.ts and travelData.js.
  // Add entries here if a future data update introduces a divergence.
};

export function normalizeCountryName(name: string): string {
  return ALIASES[name] ?? name;
}
