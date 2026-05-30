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

import { computeFwIndustry } from './holdingsCalc.mjs';

test('computeFwIndustry: single Q1 food company, buys RM', () => {
    const r = computeFwIndustry({
        factoriesData: [{ quality: 1, baseOutput: 100, baseRM: 1, maxEmployees: 1 }],
        plantationsData: [],
        factoryCells: { 1: { companies: 1, workers: 0 } },
        plantationCells: {},
        countryBonus: 0, regionBonus: 0, qualityPollution: { 0: 0, 1: 0 }, vat: 1,
        prices: { 1: 1.00 }, rmPrice: 50,
        hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 1, averageSalary: 100
    });
    assert.equal(r.output, 100);
    assert.equal(r.rmConsumed, 1);
    assert.equal(r.rmProduced, 0);
    assert.equal(roundNumber(r.revenue, 2), 99);     // 100 * 1.00 * (1 - 0.01)
    assert.equal(roundNumber(r.rmNetCost, 2), 50);   // buy 1 RM @ 50
    assert.equal(roundNumber(r.workTax, 2), 1);      // 1 WAM session * 1% * 100
    assert.equal(r.salary, 0);
    assert.equal(roundNumber(r.net, 2), 48);         // 99 - 50 - 1 - 0
});

test('computeFwIndustry: surplus RM from a plantation is sold minus VAT', () => {
    const r = computeFwIndustry({
        factoriesData: [],
        plantationsData: [{ quality: 1, baseOutput: 100, maxEmployees: 0 }], // 100/100 = 1 unit/session
        factoryCells: {},
        plantationCells: { 1: { companies: 1, workers: 0 } },
        countryBonus: 0, regionBonus: 0, qualityPollution: { 0: 0 }, vat: 10,
        prices: {}, rmPrice: 50,
        hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0
    });
    assert.equal(r.rmProduced, 1);
    assert.equal(r.netBalance, 1);
    assert.equal(roundNumber(r.rmNetCost, 2), -45); // sell: -(1 * 50 * 0.90) = -45 (negative cost = income)
    assert.equal(roundNumber(r.net, 2), 45);
});

import { computeHiredIndustry } from './holdingsCalc.mjs';

test('computeHiredIndustry: single Q1 house, 1 worker, buys HRM, no WAM/work-tax', () => {
    const r = computeHiredIndustry({
        factoriesData: [{ quality: 1, baseOutput: 1 / 5, baseRM: 2, maxEmployees: 1 }],
        rmData: [],
        factoryCells: { 1: { companies: 1, workers: 1 } },
        rmCells: {},
        countryBonus: 0, regionBonus: 0, qualityPollution: { 0: 0, 1: 0 }, vat: 1,
        prices: { 1: 29000 }, rmPrice: 1535,
        hasTycoon: false, offeredSalary: 10
    });
    assert.equal(roundNumber(r.output, 2), 0.20);
    assert.equal(r.rmConsumed, 2);
    assert.equal(r.workTax, 0);
    assert.equal(roundNumber(r.revenue, 2), 5742);   // 0.2 * 29000 * 0.99
    assert.equal(roundNumber(r.rmNetCost, 2), 3070); // buy 2 HRM @ 1535
    assert.equal(r.salary, 10);
    assert.equal(roundNumber(r.net, 2), 2662);       // 5742 - 3070 - 0 - 10
});
