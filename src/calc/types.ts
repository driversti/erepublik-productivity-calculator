export interface Cell {
  companies: number;
  workers: number;
}
export type Cells = Record<number, Cell>;

export interface IndustryResult {
  companies: number;
  output: number;
  rmConsumed: number;
  rmProduced: number;
  netBalance: number;
  revenue: number;
  rmNetCost: number;
  workTax: number;
  salary: number;
  net: number;
}
