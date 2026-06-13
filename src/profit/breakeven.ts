// Hiring break-even — pure. Answers: "what is the most I can pay one worker per
// session and still be better off producing than buying?" No DOM, no fetch.
//
// You always BUY the raw material at market gross (rm × rmPrice), so RM cost is
// the same in both framings. The framings differ only on the output side:
//   self-use: you'd otherwise BUY the finished good at gross → benefit = units×price
//   resale:   you SELL the finished good, paying VAT          → benefit = units×price×(1−vat)

export interface BreakevenInput {
  unitsPerSession: number; // finished units one worker produces per session (baseOutput × multiplier)
  rmPerSession: number; // RM units one worker consumes per session (baseRM × multiplier)
  finishedPrice: number; // gross market price of the finished good
  rmPrice: number; // gross market price of the raw material
  vat: number; // sales VAT, percent
}

export interface BreakevenResult {
  selfUseSalaryCap: number; // max salary where producing-for-own-use beats buying
  resaleSalaryCap: number; // max salary where producing-to-sell still nets ≥ 0
  selfUseProfitableAt: (salary: number) => boolean;
  resaleProfitableAt: (salary: number) => boolean;
}

export function computeBreakeven(input: BreakevenInput): BreakevenResult {
  const { unitsPerSession, rmPerSession, finishedPrice, rmPrice, vat } = input;
  const rmCost = rmPerSession * rmPrice;
  const selfUseSalaryCap = unitsPerSession * finishedPrice - rmCost;
  const resaleSalaryCap = unitsPerSession * finishedPrice * (1 - vat / 100) - rmCost;
  return {
    selfUseSalaryCap,
    resaleSalaryCap,
    selfUseProfitableAt: (salary: number) => salary <= selfUseSalaryCap,
    resaleProfitableAt: (salary: number) => salary <= resaleSalaryCap,
  };
}
