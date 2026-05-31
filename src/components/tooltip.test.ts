import { describe, it, expect } from 'vitest';
import { tip, TIP_ID } from './tooltip';

describe('tip()', () => {
  it('returns react-tooltip anchor attributes for the given content', () => {
    expect(tip('Hello')).toEqual({
      'data-tooltip-id': TIP_ID,
      'data-tooltip-content': 'Hello',
    });
  });
});
