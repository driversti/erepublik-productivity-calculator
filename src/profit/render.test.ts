import { describe, it, expect } from 'vitest';
import { renderReport } from './render';
import type { ReportModel } from './types';

function sampleModel(overrides: Partial<ReportModel> = {}): ReportModel {
  return {
    generatedAt: '2026-06-13 14:00',
    hasTycoon: false,
    wamEnabled: true,
    offeredSalary: 0,
    rmBasis: 'market',
    salaryBasis: 'country-avg',
    industries: [
      {
        key: 'weapons', label: 'Weapons', icon: '⚔️', country: 'Lithuania', region: 'Lithuania-Minor',
        countryBonus: 20, regionBonus: 15, vat: 1, workTax: 1, avgSalary: 10,
        pollution: { 0: 0, 7: 5 }, rmName: 'WRM', rmPrice: 0.1, ownRmCost: 0.05, prices: { 7: 9.5 },
        companies: [
          {
            quality: 7, kind: 'factory', name: 'Weapons Factory (Q7)', count: 24, basis: 'wam',
            multiplier: 1.3, terms: { countryBonus: 20, regionBonus: 15, tycoon: 0, pollution: 5 },
            produces: false, unitsPerSession: 13, rmPerSession: 26, price: 9.5, vat: 1,
            grossRevenue: 123.5, netRevenue: 122.27, rmCost: 2.6, workTax: 0.1, salary: 0,
            netPerSession: 119.57, netPerDay: 2869.68, runnable: true,
          },
        ],
      },
      {
        key: 'aircraft', label: 'Aircraft', icon: '✈️', country: 'Romania', region: 'Dobrogea',
        countryBonus: 10, regionBonus: 5, vat: 1, workTax: 1, avgSalary: 12,
        pollution: { 0: 0, 5: 0 }, rmName: 'ARM', rmPrice: 0.2, ownRmCost: null, prices: { 5: 3 },
        companies: [
          {
            quality: 5, kind: 'factory', name: 'Aircraft Weapons Factory (Q5)', count: 2, basis: 'hired',
            multiplier: 1.15, terms: { countryBonus: 10, regionBonus: 5, tycoon: 0, pollution: 0 },
            produces: false, unitsPerSession: 5.75, rmPerSession: 5.75, price: 3, vat: 1,
            grossRevenue: 17.25, netRevenue: 17.08, rmCost: 1.15, workTax: 0, salary: 0,
            netPerSession: null, netPerDay: null, runnable: false,
          },
        ],
      },
    ],
    ranking: [
      { industry: 'weapons', label: 'Weapons', quality: 7, kind: 'factory', basis: 'wam', netNoTycoon: 119.57, netTycoon: 140.2, hasPrice: true },
    ],
    breakeven: [
      { industry: 'aircraft', label: 'Aircraft', quality: 5, name: 'Aircraft Weapons Factory (Q5)', selfUseCap: 16.1, resaleCap: 15.93, avgSalary: 12, userSalary: 12 },
    ],
    produceVsBuy: [
      { industry: 'weapons', label: 'Weapons', quality: 7, name: 'Weapons Factory (Q7)', produceCost: 78.61, buyPrice: 75, produceIsCheaper: false },
    ],
    rmVerdicts: [
      { industry: 'weapons', label: 'Weapons', bestQuality: 7, sellRaw: 0.099, convert: 0.45, convertIsBetter: true, hasPrice: true },
    ],
    damageCost: null,
    relocation: null,
    dailyTotalNoTycoon: 2869.68,
    dailyTotalTycoon: 3364.8,
    ...overrides,
  };
}

describe('renderReport', () => {
  it('produces a self-contained light-theme HTML document', () => {
    const html = renderReport(sampleModel());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('content="light"'); // <meta name="color-scheme" content="light">
    expect(html).not.toContain('http://'); // no external assets
    expect(html).not.toContain('<script src'); // no external scripts
  });

  it('includes a plain-language "how to read this" guide and per-section explainers', () => {
    const html = renderReport(sampleModel());
    expect(html).toContain('Як читати'); // intro guide (Ukrainian)
    // each major section carries an explainer callout
    const explainCount = (html.match(/class="explain"/g) ?? []).length;
    expect(explainCount).toBeGreaterThanOrEqual(5);
  });

  it('shows the RM cost basis (market vs your own production cost)', () => {
    const html = renderReport(sampleModel());
    expect(html.toLowerCase()).toContain('собівартіст'); // own-cost label
    expect(html).toContain('0.05'); // weapons ownRmCost
  });

  it('shows the produce-vs-buy verdict for own use (weapons/food)', () => {
    const html = renderReport(sampleModel());
    expect(html.toLowerCase()).toContain('виробляти vs купувати');
    expect(html).toContain('78.61'); // produce cost
    expect(html).toContain('купувати'); // verdict (produce not cheaper)
  });

  it('shows the hiring verdict against your chosen salary', () => {
    const html = renderReport(sampleModel({ salaryBasis: 'user', offeredSalary: 7200 }));
    expect(html.toLowerCase()).toContain('твоя зарплата');
  });

  it('shows each industry, its location and a per-company breakdown', () => {
    const html = renderReport(sampleModel());
    expect(html).toContain('Weapons');
    expect(html).toContain('Lithuania-Minor');
    expect(html).toContain('Weapons Factory (Q7)');
    expect(html).toContain('2869.68'); // netPerDay
  });

  it('flags non-runnable companies as idle capital', () => {
    const html = renderReport(sampleModel());
    expect(html.toLowerCase()).toContain('idle');
    expect(html).toContain('Aircraft Weapons Factory (Q5)');
  });

  it('renders the hiring break-even caps', () => {
    const html = renderReport(sampleModel());
    expect(html).toContain('16.10'); // selfUseCap formatted to 2dp
    expect(html).toContain('15.93'); // resaleCap
  });

  it('renders the convert-vs-sell verdict', () => {
    const html = renderReport(sampleModel());
    expect(html.toLowerCase()).toContain('переробляти');
  });

  it('renders the current daily total for both Tycoon states', () => {
    const html = renderReport(sampleModel());
    expect(html).toContain('2869.68');
    expect(html).toContain('3364.80');
  });

  it('shows the cost-of-damage section only when combat data is present', () => {
    const without = renderReport(sampleModel({ damageCost: null }));
    expect(without.toLowerCase()).not.toContain('вартість шкоди');
    const withDmg = renderReport(
      sampleModel({
        damageCost: {
          strength: 425000, rankValue: 89, energyPerHit: 10, energyCostPerUnit: 0.4, targetDamage: 100_000_000,
          rows: [
            { quality: 7, firepower: 200, damagePerHit: 599814, hitsPer100M: 166.7, weaponsPer100M: 16.7, weaponCost: 1250, foodCost: 668, totalCost: 1918 },
            { quality: 1, firepower: 20, damagePerHit: 239926, hitsPer100M: 416.8, weaponsPer100M: 416.8, weaponCost: 709, foodCost: 1667, totalCost: 2376 },
          ],
        },
      }),
    );
    expect(withDmg.toLowerCase()).toContain('вартість шкоди');
    expect(withDmg).toContain('599'); // damage per hit shown
    expect(withDmg).toContain('1918'); // total cost shown (no thousands separator)
  });

  it('shows a relocation section only when relocation data is present', () => {
    const without = renderReport(sampleModel({ relocation: null }));
    expect(without.toLowerCase()).not.toContain('релокація');
    const withReloc = renderReport(
      sampleModel({
        relocation: [
          { industry: 'weapons', label: 'Weapons', currentRegion: 'Lithuania-Minor', currentBonus: 9, countryBonusMaxed: true,
            best: [
              { region: 'Pomerania', country: 'Poland', regionBonus: 25, isCurrent: false },
              { region: 'Lithuania-Minor', country: 'Lithuania', regionBonus: 9, isCurrent: true },
            ] },
        ],
      }),
    );
    expect(withReloc.toLowerCase()).toContain('релокація');
    expect(withReloc).toContain('Pomerania');
    expect(withReloc).toContain('+25%'); // candidate region bonus
  });
});
