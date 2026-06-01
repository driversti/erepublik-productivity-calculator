import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEY, loadState, saveState } from './persistence';
import { initialState } from './blank';
import { reducer } from './reducer';

beforeEach(() => localStorage.clear());

describe('persistence', () => {
  it('returns initial state when nothing stored', () => {
    expect(loadState().activeModule).toBe('food');
    expect(loadState().holdings).toHaveLength(0);
  });

  it('round-trips holdings and factory counts', () => {
    let s = reducer(initialState(), { type: 'CREATE_HOLDING', name: 'Berlin' });
    s = reducer(s, { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 7, field: 'companies', value: 3 });
    s = reducer(s, { type: 'SET_HOLDING_CELL', id: 'h1', industry: 'weapons', kind: 'factory', quality: 5, field: 'companies', value: 2 });
    saveState(s);
    const loaded = loadState();
    expect(loaded.holdings[0].name).toBe('Berlin');
    expect(loaded.food[7].companies).toBe(3);
    expect(loaded.holdings[0].industries.weapons[5].companies).toBe(2);
    expect(loaded.holdingSeq).toBe(1);
  });

  it('clamps companies > 9999 from stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ food: { 1: { companies: 50000, workers: 0 } } }));
    expect(loadState().food[1].companies).toBe(9999);
  });

  it('migrates the legacy numeric cell form to {companies,workers}', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ food: { 2: 4 } }));
    expect(loadState().food[2]).toEqual({ companies: 4, workers: 0 });
  });

  it('applies legacy top-level location to every module', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedCountryId: 71, workTaxRate: 5, averageSalary: 30 }));
    const s = loadState();
    expect(s.food.selectedCountryId).toBe('71');
    expect(s.weapons.workTaxRate).toBe(5);
    expect(s.aircraft.averageSalary).toBe(30);
  });

  it('caps stored workers at companies*maxEmployees', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ food: { 7: { companies: 1, workers: 999 } } }));
    // Q7 food maxEmployees = 10
    expect(loadState().food[7].workers).toBe(10);
  });

  it('migrates a v11-shaped blob (no optimizer) to include optimizer defaults', () => {
    // Simulate a blob saved by v11 code — no optimizer key at all
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeModule: 'weapons',
      hasTycoon: true,
      food: { 1: { companies: 2, workers: 0 } },
    }));
    const s = loadState();
    expect(s.activeModule).toBe('weapons');
    expect(s.hasTycoon).toBe(true);
    expect(s.food[1].companies).toBe(2);
    // optimizer must be present with defaults
    expect(s.optimizer).toBeDefined();
    expect(s.optimizer.industry).toBe('food');
    expect(s.optimizer.threshold).toBe(10);
    expect(s.optimizer.maxCandidates).toBe(60);
    expect(s.optimizer.topN).toBe(15);
    expect(s.optimizer.results).toEqual([]);
    expect(s.optimizer.baselineNet).toBeNull();
    expect(s.optimizer.skippedCount).toBe(0);
    expect(s.optimizer.fetchedAt).toBeNull();
  });

  it('round-trips excludedQualities through save→load', () => {
    let s = initialState();
    s = reducer(s, { type: 'TOGGLE_EXCLUDED_QUALITY', industry: 'weapons', quality: 6 });
    s = reducer(s, { type: 'TOGGLE_EXCLUDED_QUALITY', industry: 'food', quality: 3 });
    saveState(s);
    const loaded = loadState();
    expect(loaded.excludedQualities).toContain('weapons:6');
    expect(loaded.excludedQualities).toContain('food:3');
    expect(loaded.excludedQualities).toHaveLength(2);
  });

  it('defaults excludedQualities to [] for old saves without the field', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeModule: 'weapons' }));
    expect(loadState().excludedQualities).toEqual([]);
  });

  it('persists optimizer params but NOT volatile results', () => {
    // Simulate saving state after setting some params and results
    const s = {
      ...initialState(),
      optimizer: {
        industry: 'weapons' as const,
        threshold: 30,
        maxCandidates: 40,
        topN: 10,
        results: [{ region: {}, economics: {}, pollution: null, net: 999 }] as never,
        baselineNet: 800,
        skippedCount: 2,
        fetchedAt: '2026-01-01T00:00:00Z',
        noBonusCount: 3,
        universeFetchedAt: '2026-05-31T00:00:00Z',
      },
    };
    saveState(s);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Record<string, unknown>;
    // params must be saved
    const opt = raw.optimizer as Record<string, unknown>;
    expect(opt).toBeDefined();
    expect(opt.industry).toBe('weapons');
    expect(opt.threshold).toBe(30);
    expect(opt.maxCandidates).toBe(40);
    expect(opt.topN).toBe(10);
    // volatile fields must be stripped
    expect(opt.results).toBeUndefined();
    expect(opt.baselineNet).toBeUndefined();
    expect(opt.skippedCount).toBeUndefined();
    expect(opt.fetchedAt).toBeUndefined();
    expect(opt.noBonusCount).toBeUndefined();
    expect(opt.universeFetchedAt).toBeUndefined();
  });
});
