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
});
