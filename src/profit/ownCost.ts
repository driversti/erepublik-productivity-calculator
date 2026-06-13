// собівартість of self-produced raw material — pure. The labour cost of one RM
// production session divided by the RM units it yields. Returns null when the
// session yields no RM (you cannot self-supply it).
export function rmUnitCost(laborPerSession: number, rmPerSession: number): number | null {
  if (rmPerSession <= 0) return null;
  return laborPerSession / rmPerSession;
}
