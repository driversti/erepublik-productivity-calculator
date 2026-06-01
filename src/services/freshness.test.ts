import { describe, it, expect } from 'vitest';
import { relativeMinutes } from './freshness';

describe('relativeMinutes', () => {
  it('formats minutes-ago in the given locale via Intl', () => {
    const now = new Date('2026-06-01T07:12:00.000Z').getTime();
    const then = '2026-06-01T07:00:00.000Z'; // 12 min earlier
    const en = relativeMinutes(then, 'en', now);
    expect(en).toMatch(/12/);
  });

  it('returns null for a missing or invalid timestamp', () => {
    expect(relativeMinutes(null, 'en', Date.now())).toBeNull();
    expect(relativeMinutes('not-a-date', 'en', Date.now())).toBeNull();
  });
});
