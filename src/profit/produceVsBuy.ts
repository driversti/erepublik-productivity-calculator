// Produce-vs-buy for own use — pure. The cost to produce one finished unit for
// your own consumption (e.g. weapons to fight with), so it can be compared to the
// market BUY price. Returns null when the session makes no finished units.
export function unitProductionCost(outputPerSession: number, rmCostPerSession: number, laborPerSession: number): number | null {
  if (outputPerSession <= 0) return null;
  return (rmCostPerSession + laborPerSession) / outputPerSession;
}
