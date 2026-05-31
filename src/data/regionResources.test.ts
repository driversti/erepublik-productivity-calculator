import { describe, it, expect } from 'vitest';
import {
  REGION_RESOURCES,
  COUNTRY_FLAGS,
  SNAPSHOT_DATE,
  type Industry,
} from './regionResources';

const INDUSTRIES: readonly Industry[] = ['food', 'weapons', 'houses', 'aircraft'];
const BONUSES = new Set([10, 15, 20, 25, 30]);

describe('regionResources dataset', () => {
  it('is non-empty and every region carries at least one resource', () => {
    expect(REGION_RESOURCES.length).toBeGreaterThan(0);
    for (const r of REGION_RESOURCES) {
      expect(r.resources.length, `${r.name} has resources`).toBeGreaterThan(0);
    }
  });

  it('uses only known industries and bonus tiers', () => {
    for (const region of REGION_RESOURCES) {
      for (const res of region.resources) {
        expect(INDUSTRIES, `${region.name}/${res.name} industry`).toContain(res.industry);
        expect(BONUSES.has(res.bonus), `${region.name}/${res.name} bonus ${res.bonus}`).toBe(true);
      }
    }
  });

  it('has unique region ids', () => {
    const ids = REGION_RESOURCES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a valid snapshot date and string flag URLs', () => {
    expect(SNAPSHOT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const url of Object.values(COUNTRY_FLAGS)) {
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    }
  });
});
