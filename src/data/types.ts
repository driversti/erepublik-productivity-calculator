// Static game-fact types. baseRM / energyPerItem are absent on raw-material
// companies (plantations / mines / refineries), so they are optional.
export interface FactoryDef {
  quality: number;
  name: string;
  baseOutput: number;
  baseRM?: number;
  energyPerItem?: number;
  maxEmployees: number;
}

export type IndustryKey = 'food' | 'weapons' | 'houses' | 'aircraft';
export type IndustryType = 'fw' | 'hired';
export type RmPriceKey = 'frmPrice' | 'wrmPrice' | 'hrmPrice' | 'armPrice';

export interface IndustryConfig {
  key: IndustryKey;
  label: string;
  icon: string;
  type: IndustryType;
  /** finished-goods factories */
  factoriesData: FactoryDef[];
  /** raw-material companies (plantations for fw, mines/refineries for hired) */
  rmData: FactoryDef[];
  rmPriceKey: RmPriceKey;
  rmName: string;
  /** highest factory quality: 7 for food/weapons, 5 for houses/aircraft */
  maxFactoryQuality: number;
  /** fw only — finished-goods icon uses industry 1 (food) vs 2 (weapons) */
  isFood?: boolean;
  /** hired only — finished-goods icon industry id */
  factoryIconIndustry?: number;
  /** hired only — per-quality raw-material building icon ids */
  rmBuildingIds?: Record<number, number>;
}
