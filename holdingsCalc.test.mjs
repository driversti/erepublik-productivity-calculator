import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundNumber, gameRawProduction, productivityMultiplier } from './holdingsCalc.mjs';

test('roundNumber rounds to N decimals', () => {
    assert.equal(roundNumber(1.236, 2), 1.24);
    assert.equal(roundNumber(1.5, 0), 2);
});

test('gameRawProduction truncates the 3rd decimal (3.685 -> 3.68)', () => {
    assert.equal(gameRawProduction(3.685), 3.68);
});

test('productivityMultiplier sums bonuses and floors at 0', () => {
    // The multiplier is left raw (matches app.js), so compare via roundNumber to stay
    // robust against IEEE-754 noise (e.g. the tycoon case is 1.8499999999999999).
    assert.equal(roundNumber(productivityMultiplier({ countryBonus: 50, regionBonus: 20, hasTycoon: false, pollutionRate: 5 }), 2), 1.65);
    assert.equal(roundNumber(productivityMultiplier({ countryBonus: 50, regionBonus: 20, hasTycoon: true, pollutionRate: 5 }), 2), 1.85);
    assert.equal(productivityMultiplier({ countryBonus: 0, regionBonus: 0, hasTycoon: false, pollutionRate: 200 }), 0);
});
