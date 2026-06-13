// Combat damage economics — pure. eRepublik damage per hit and the cost of energy
// (food) needed to deliver it. No DOM, no fetch.
//
// Damage formula (wiki Military_formulas):
//   D = 10 × (1 + Strength/400) × (1 + RankValue/5) × (1 + Firepower/100)
// Each hit costs 10 energy; food restores energy 1:1 (Energy wiki page).

// Ground-weapon firepower (%) and durability (hits per weapon), from the Weapon wiki.
export const WEAPON_COMBAT: Record<number, { firepower: number; durability: number }> = {
  1: { firepower: 20, durability: 1 },
  2: { firepower: 40, durability: 2 },
  3: { firepower: 60, durability: 3 },
  4: { firepower: 80, durability: 4 },
  5: { firepower: 100, durability: 5 },
  6: { firepower: 120, durability: 6 },
  7: { firepower: 200, durability: 10 },
};

// Aircraft weapons (Q1-Q5 only) — firepower (%) and durability, from the
// Aircraft weapon wiki. Air damage uses the same formula with strength = 0.
export const AIRCRAFT_WEAPON_COMBAT: Record<number, { firepower: number; durability: number }> = {
  1: { firepower: 20, durability: 1 },
  2: { firepower: 40, durability: 2 },
  3: { firepower: 60, durability: 3 },
  4: { firepower: 80, durability: 4 },
  5: { firepower: 100, durability: 5 },
};

export const ENERGY_PER_HIT = 10;

export function damagePerHit(strength: number, rankValue: number, firepower: number): number {
  return 10 * (1 + strength / 400) * (1 + rankValue / 5) * (1 + firepower / 100);
}

// Cheapest CC per 1 energy across the available food qualities (price ÷ energy restored).
export function cheapestEnergyCost(foodPrices: Record<number, number>, foodEnergy: Record<number, number>): number | null {
  let best: number | null = null;
  for (const q of Object.keys(foodEnergy)) {
    const price = foodPrices[Number(q)] ?? 0;
    const energy = foodEnergy[Number(q)] ?? 0;
    if (price <= 0 || energy <= 0) continue;
    const cost = price / energy;
    if (best === null || cost < best) best = cost;
  }
  return best;
}
