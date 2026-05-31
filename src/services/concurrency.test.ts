import { describe, it, expect } from 'vitest';
import { mapWithLimit } from './concurrency';

describe('mapWithLimit', () => {
  it('runs at most `limit` tasks at once and preserves order', async () => {
    let active = 0, maxActive = 0;
    const items = [1, 2, 3, 4, 5];
    const out = await mapWithLimit(items, 2, async (n) => {
      active++; maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active--; return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('handles an empty array', async () => {
    const out = await mapWithLimit([], 3, async (n: number) => n);
    expect(out).toEqual([]);
  });

  it('handles limit larger than item count', async () => {
    const out = await mapWithLimit([1, 2], 10, async (n) => n * 3);
    expect(out).toEqual([3, 6]);
  });

  it('passes the correct index to fn', async () => {
    const indices: number[] = [];
    await mapWithLimit(['a', 'b', 'c'], 2, async (_item, i) => {
      indices.push(i);
    });
    expect(indices.sort()).toEqual([0, 1, 2]);
  });
});
