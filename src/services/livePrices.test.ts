import { describe, it, expect } from 'vitest';
import { parseFoodMisc, parseCheapestOffer } from './livePrices';

describe('livePrices parsers', () => {
  it('parseFoodMisc reads Q1-Q7 gross from info.misc', () => {
    const data = {
      status: 'ok',
      info: { misc: { 1: { gross: 0.5 }, 2: { gross: 0.6 }, 7: { gross: 1.1 } } },
    };
    const prices = parseFoodMisc(data);
    expect(prices[1]).toBe(0.5);
    expect(prices[2]).toBe(0.6);
    expect(prices[7]).toBe(1.1);
    expect(prices[3]).toBeUndefined();
  });

  it('parseFoodMisc returns empty when status not ok or misc missing', () => {
    expect(parseFoodMisc({ status: 'error' })).toEqual({});
    expect(parseFoodMisc({ status: 'ok', info: {} })).toEqual({});
  });

  it('parseCheapestOffer returns the first offer gross', () => {
    expect(parseCheapestOffer({ status: 'ok', offers: [{ gross: 0.02 }, { gross: 0.03 }] })).toBe(0.02);
  });

  it('parseCheapestOffer returns undefined when no offers', () => {
    expect(parseCheapestOffer({ status: 'ok', offers: [] })).toBeUndefined();
    expect(parseCheapestOffer({ status: 'error' })).toBeUndefined();
  });
});
