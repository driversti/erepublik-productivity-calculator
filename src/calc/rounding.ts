// Pure profit-math helpers, ported verbatim from holdingsCalc.mjs. No DOM access.

// Standard round-to-N-decimals, identical to the game's roundNumber().
export function roundNumber(value: number, digits = 2): number {
  const multiplier = Math.pow(10, digits);
  return Math.round(value * multiplier) / multiplier;
}

// Raw-material production per company: the game rounds to 3 decimals then drops
// the 3rd decimal (floor to 2dp). e.g. 3.685 -> 3.68 (NOT 3.69).
export function gameRawProduction(value: number): number {
  return Number(roundNumber(value, 3).toFixed(3).slice(0, -1));
}

export interface MultiplierInput {
  countryBonus: number;
  regionBonus: number;
  hasTycoon: boolean;
  pollutionRate: number;
}

// eRepublik productivity multiplier, floored at 0. Deliberately NOT rounded —
// the game (and the legacy render()) rounds the PRODUCT (baseOutput × multiplier),
// not the multiplier itself.
export function productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate }: MultiplierInput): number {
  return Math.max(0, 1 + countryBonus / 100 + regionBonus / 100 + (hasTycoon ? 0.2 : 0) - pollutionRate / 100);
}

// Quality-indexed pollution lookup (index 0 = raw-material rate); 0 if absent.
export function pollutionAt(qualityPollution: Record<number, number> | undefined, index: number): number {
  return qualityPollution && typeof qualityPollution[index] === 'number' ? qualityPollution[index] : 0;
}
