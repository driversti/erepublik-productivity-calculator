import { describe, it, expect } from 'vitest';
import { rmUnitCost } from './ownCost';

// собівартість of self-produced raw material: the labour cost of one production
// session (work tax for a WAM plantation, or salary for a hired RM company)
// divided by the RM units that session yields.
describe('rmUnitCost', () => {
  it('divides labour cost per session by RM produced per session', () => {
    // rubber plantation: work tax 88.58 per WAM session, 4.97 WRM produced
    expect(rmUnitCost(88.58, 4.97)).toBeCloseTo(17.82, 2);
  });

  it('returns null when the session produces no RM (cannot self-supply)', () => {
    expect(rmUnitCost(88.58, 0)).toBeNull();
    expect(rmUnitCost(88.58, -1)).toBeNull();
  });

  it('is zero when labour is free (WAM with zero work tax)', () => {
    expect(rmUnitCost(0, 5)).toBe(0);
  });
});
