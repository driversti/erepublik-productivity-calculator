import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './blank';

describe('reducer', () => {
  it('SET_FACTORY_CELL sets companies clamped to [0,9999]', () => {
    const s = reducer(initialState(), { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 3, field: 'companies', value: 5 });
    expect(s.food[3].companies).toBe(5);
    const over = reducer(s, { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 3, field: 'companies', value: 99999 });
    expect(over.food[3].companies).toBe(9999);
  });

  it('SET_FACTORY_CELL caps workers at companies*maxEmployees', () => {
    let s = reducer(initialState(), { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 7, field: 'companies', value: 2 });
    // Q7 food maxEmployees = 10 → cap 20
    s = reducer(s, { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 7, field: 'workers', value: 999 });
    expect(s.food[7].workers).toBe(20);
  });

  it('SET_MODULE_FIELD clears the location (Manual de-sync)', () => {
    let s = reducer(initialState(), {
      type: 'SET_MODULE_LOCATION', module: 'food', selectedCountryId: '1', selectedRegionPermalink: 'r',
      countryBonus: 120, regionBonus: 10, qualityPollution: {}, workTaxRate: 5, averageSalary: 50, vat: 3,
    });
    expect(s.food.selectedCountryId).toBe('1');
    s = reducer(s, { type: 'SET_MODULE_FIELD', module: 'food', field: 'countryBonus', value: 130 });
    expect(s.food.countryBonus).toBe(130);
    expect(s.food.selectedCountryId).toBe('');
    expect(s.food.selectedRegionPermalink).toBe('');
  });

  it('SWITCH_MODULE changes the active module', () => {
    const s = reducer(initialState(), { type: 'SWITCH_MODULE', module: 'weapons' });
    expect(s.activeModule).toBe('weapons');
  });

  it('CREATE_HOLDING appends a holding, bumps seq, activates it', () => {
    const s = reducer(initialState(), { type: 'CREATE_HOLDING', name: 'Berlin' });
    expect(s.holdings).toHaveLength(1);
    expect(s.holdings[0].id).toBe('h1');
    expect(s.holdings[0].name).toBe('Berlin');
    expect(s.activeHoldingId).toBe('h1');
    expect(s.holdingSeq).toBe(1);
  });

  it('CLEAR_HOLDING_COMPANIES zeros cells but keeps name/bonuses', () => {
    let s = reducer(initialState(), { type: 'CREATE_HOLDING', name: 'Berlin' });
    s = reducer(s, { type: 'SET_HOLDING_CELL', id: 'h1', industry: 'food', kind: 'factory', quality: 1, field: 'companies', value: 4 });
    s = reducer(s, { type: 'SET_HOLDING_FIELD', id: 'h1', field: 'averageSalary', value: 42 });
    expect(s.holdings[0].industries.food[1].companies).toBe(4);
    s = reducer(s, { type: 'CLEAR_HOLDING_COMPANIES', id: 'h1' });
    expect(s.holdings[0].industries.food[1].companies).toBe(0);
    expect(s.holdings[0].name).toBe('Berlin');
    expect(s.holdings[0].averageSalary).toBe(42);
  });

  it('SET_MODULE_PRICES merges bulk prices and keeps the location', () => {
    let s = reducer(initialState(), {
      type: 'SET_MODULE_LOCATION', module: 'food', selectedCountryId: '1', selectedRegionPermalink: 'r',
      countryBonus: 120, regionBonus: 10, qualityPollution: {}, workTaxRate: 5, averageSalary: 50, vat: 3,
    });
    s = reducer(s, { type: 'SET_MODULE_PRICES', module: 'food', prices: { 1: 0.5, 7: 1.1 } });
    expect(s.food.prices[1]).toBe(0.5);
    expect(s.food.prices[7]).toBe(1.1);
    expect(s.food.selectedCountryId).toBe('1'); // bulk price sync must NOT de-sync
  });

  it('SET_HOLDING_MODIFIERS applies bonuses to every industry + holding tax/salary', () => {
    let s = reducer(initialState(), { type: 'CREATE_HOLDING', name: 'Berlin' });
    const ind = { countryBonus: 130, regionBonus: 20, qualityPollution: { 0: 2, 1: 3 }, vat: 4 };
    s = reducer(s, {
      type: 'SET_HOLDING_MODIFIERS', id: 'h1', workTaxRate: 6, averageSalary: 80,
      perIndustry: { food: ind, weapons: ind, houses: ind, aircraft: ind },
    });
    const h = s.holdings[0];
    expect(h.workTaxRate).toBe(6);
    expect(h.averageSalary).toBe(80);
    expect(h.industries.food.countryBonus).toBe(130);
    expect(h.industries.aircraft.vat).toBe(4);
    expect(h.industries.weapons.qualityPollution[1]).toBe(3);
  });

  it('TOGGLE_TYCOON flips the flag immutably', () => {
    const a = initialState();
    const b = reducer(a, { type: 'TOGGLE_TYCOON' });
    expect(b.hasTycoon).toBe(true);
    expect(a.hasTycoon).toBe(false);
  });

  describe('SET_OPTIMIZER_PARAMS', () => {
    it('merges partial params into optimizer slice', () => {
      const a = initialState();
      const b = reducer(a, { type: 'SET_OPTIMIZER_PARAMS', payload: { industry: 'weapons', topN: 5 } });
      expect(b.optimizer.industry).toBe('weapons');
      expect(b.optimizer.topN).toBe(5);
      // untouched defaults survive
      expect(b.optimizer.threshold).toBe(10);
      expect(b.optimizer.maxCandidates).toBe(60);
    });

    it('is immutable: prior state object is not mutated', () => {
      const a = initialState();
      const b = reducer(a, { type: 'SET_OPTIMIZER_PARAMS', payload: { threshold: 50 } });
      expect(a.optimizer.threshold).toBe(10); // prior state unchanged
      expect(b.optimizer.threshold).toBe(50);
      expect(b.optimizer).not.toBe(a.optimizer); // new reference
      expect(b).not.toBe(a);
    });

    it('leaves volatile result fields intact', () => {
      const a = initialState();
      const b = reducer(a, { type: 'SET_OPTIMIZER_PARAMS', payload: { maxCandidates: 30 } });
      expect(b.optimizer.results).toEqual([]);
      expect(b.optimizer.baselineNet).toBeNull();
      expect(b.optimizer.skippedCount).toBe(0);
      expect(b.optimizer.fetchedAt).toBeNull();
    });
  });

  describe('SET_OPTIMIZER_RESULTS', () => {
    it('stores results and metadata', () => {
      const a = initialState();
      const fakeResults = [{ region: { id: 1, name: 'Paris', permalink: 'Paris', currentCountry: 'France', originalCountry: 'France', resources: [] }, regionBonus: 40, economics: { countryBonus: 120, workTaxRate: 5, averageSalary: 60, vat: 15 }, pollution: null, net: 999 }] as import('./types').OptimizerState['results'];
      const b = reducer(a, {
        type: 'SET_OPTIMIZER_RESULTS',
        payload: { results: fakeResults, baselineNet: 800, skippedCount: 3, fetchedAt: '2026-01-01T00:00:00Z', noBonusCount: 5, universeFetchedAt: '2026-05-31T12:00:00Z' },
      });
      expect(b.optimizer.results).toHaveLength(1);
      expect(b.optimizer.baselineNet).toBe(800);
      expect(b.optimizer.skippedCount).toBe(3);
      expect(b.optimizer.fetchedAt).toBe('2026-01-01T00:00:00Z');
      expect(b.optimizer.noBonusCount).toBe(5);
      expect(b.optimizer.universeFetchedAt).toBe('2026-05-31T12:00:00Z');
    });

    it('is immutable: prior state object is not mutated', () => {
      const a = initialState();
      const b = reducer(a, {
        type: 'SET_OPTIMIZER_RESULTS',
        payload: { results: [], baselineNet: 500, skippedCount: 1, fetchedAt: '2026-01-01T00:00:00Z', noBonusCount: 0, universeFetchedAt: null },
      });
      expect(a.optimizer.baselineNet).toBeNull(); // prior state unchanged
      expect(b.optimizer.baselineNet).toBe(500);
      expect(b.optimizer).not.toBe(a.optimizer);
      expect(b).not.toBe(a);
    });
  });
});
