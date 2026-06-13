import { describe, it, expect } from 'vitest';
import { damagePerHit, cheapestEnergyCost, WEAPON_COMBAT, AIRCRAFT_WEAPON_COMBAT } from './damageCost';

// Damage per hit: D = 10 × (1 + S/400) × (1 + R/5) × (1 + FP/100)
// (eRepublik Military_formulas; verified by the wiki's worked example).
describe('damagePerHit', () => {
  it('matches the wiki example: S=100, rank value 10, unarmed → 37.5', () => {
    expect(damagePerHit(100, 10, 0)).toBeCloseTo(37.5, 4);
  });

  it('computes a Q7 hit for a max-rank heavy hitter (S=425000, R=89, FP=200)', () => {
    // 10 × 1063.5 × 18.8 × 3 = 599814
    expect(damagePerHit(425000, 89, 200)).toBeCloseTo(599814, 0);
  });

  it('firepower 0 (unarmed) drops the weapon term to 1', () => {
    expect(damagePerHit(425000, 89, 0)).toBeCloseTo(199938, 0);
  });

  it('air hits ignore strength (S=0): rank 61, FP 100 → 264', () => {
    // 10 × 1 × (1+61/5) × (1+100/100) = 10 × 13.2 × 2 = 264
    expect(damagePerHit(0, 61, 100)).toBeCloseTo(264, 4);
  });
});

describe('AIRCRAFT_WEAPON_COMBAT', () => {
  it('has Q1..Q5 firepower/durability and no Q6/Q7', () => {
    expect(AIRCRAFT_WEAPON_COMBAT[1]).toEqual({ firepower: 20, durability: 1 });
    expect(AIRCRAFT_WEAPON_COMBAT[5]).toEqual({ firepower: 100, durability: 5 });
    expect(AIRCRAFT_WEAPON_COMBAT[6]).toBeUndefined();
    expect(AIRCRAFT_WEAPON_COMBAT[7]).toBeUndefined();
  });
});

describe('WEAPON_COMBAT', () => {
  it('has wiki firepower and durability for Q1..Q7', () => {
    expect(WEAPON_COMBAT[1]).toEqual({ firepower: 20, durability: 1 });
    expect(WEAPON_COMBAT[5]).toEqual({ firepower: 100, durability: 5 });
    expect(WEAPON_COMBAT[7]).toEqual({ firepower: 200, durability: 10 });
  });
});

describe('cheapestEnergyCost', () => {
  it('returns the lowest CC-per-energy across food qualities', () => {
    // Q1: 0.89/2 = 0.445 ; Q2: 1.60/4 = 0.40 → cheapest 0.40
    expect(cheapestEnergyCost({ 1: 0.89, 2: 1.6 }, { 1: 2, 2: 4 })).toBeCloseTo(0.4, 6);
  });

  it('ignores qualities with no price or no energy', () => {
    expect(cheapestEnergyCost({ 1: 0, 5: 4.25 }, { 1: 2, 5: 10 })).toBeCloseTo(0.425, 6);
  });

  it('returns null when no priced food is available', () => {
    expect(cheapestEnergyCost({ 1: 0 }, { 1: 2 })).toBeNull();
  });
});
