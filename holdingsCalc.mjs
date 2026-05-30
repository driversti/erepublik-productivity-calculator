// holdingsCalc.mjs — pure profit math for the Holdings mode. No DOM access, so it is
// importable both by the browser (app.js) and by the node test runner (node --test).

// Standard round-to-N-decimals, identical to the game's roundNumber().
export function roundNumber(number, digits = 2) {
    const multiplier = Math.pow(10, digits);
    return Math.round(parseFloat(number) * multiplier) / multiplier;
}

// Raw-material production per company: the game rounds to 3 decimals then drops the
// 3rd decimal (floor to 2dp). e.g. 3.685 -> 3.68 (NOT 3.69).
export function gameRawProduction(value) {
    return Number(roundNumber(value, 3).toFixed(3).slice(0, -1));
}

// eRepublik productivity multiplier, floored at 0. Deliberately NOT rounded — the game
// (and app.js render()) rounds the PRODUCT (baseOutput × multiplier), not the multiplier
// itself, so leaving this raw keeps Holdings numbers identical to the industry tabs.
export function productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate }) {
    return Math.max(0, 1 + (countryBonus / 100) + (regionBonus / 100) + (hasTycoon ? 0.2 : 0) - (pollutionRate / 100));
}

// Quality-indexed pollution lookup (index 0 = raw-material rate); 0 if absent.
export function pollutionAt(qualityPollution, index) {
    return (qualityPollution && typeof qualityPollution[index] === 'number') ? qualityPollution[index] : 0;
}
