// Game constants ported verbatim from the legacy app.js (lines 6-79).
// baseRM on factories is in Marketplace Units (1 FRM unit = 100 individual grain).
// Raw-material companies store baseOutput in individual units (÷100 → marketplace units).
import type { FactoryDef, IndustryConfig, IndustryKey } from './types';
import { HRM_BUILDING_IDS, ARM_BUILDING_IDS } from './buildingIds';

const foodFactoriesData: FactoryDef[] = [
  { quality: 1, name: 'Grain Bakery (Q1)', baseOutput: 100, baseRM: 1, energyPerItem: 2, maxEmployees: 1 },
  { quality: 2, name: 'Food Factory (Q2)', baseOutput: 100, baseRM: 2, energyPerItem: 4, maxEmployees: 2 },
  { quality: 3, name: 'Food Factory (Q3)', baseOutput: 100, baseRM: 3, energyPerItem: 6, maxEmployees: 3 },
  { quality: 4, name: 'Food Factory (Q4)', baseOutput: 100, baseRM: 4, energyPerItem: 8, maxEmployees: 5 },
  { quality: 5, name: 'Food Factory (Q5)', baseOutput: 100, baseRM: 5, energyPerItem: 10, maxEmployees: 10 },
  { quality: 6, name: 'Food Factory (Q6)', baseOutput: 100, baseRM: 6, energyPerItem: 12, maxEmployees: 10 },
  { quality: 7, name: 'Food Factory (Q7)', baseOutput: 100, baseRM: 20, energyPerItem: 20, maxEmployees: 10 },
];

const foodPlantationsData: FactoryDef[] = [
  { quality: 1, name: 'Grain Farm (Q1)', baseOutput: 35, energyPerItem: 10, maxEmployees: 0 },
  { quality: 2, name: 'Fruit Orchard (Q2)', baseOutput: 70, energyPerItem: 10, maxEmployees: 0 },
  { quality: 3, name: 'Fishery (Q3)', baseOutput: 125, energyPerItem: 10, maxEmployees: 1 },
  { quality: 4, name: 'Cattle Farm (Q4)', baseOutput: 175, energyPerItem: 10, maxEmployees: 1 },
  { quality: 5, name: 'Hunting Lodge (Q5)', baseOutput: 250, energyPerItem: 10, maxEmployees: 4 },
];

const weaponFactoriesData: FactoryDef[] = [
  { quality: 1, name: 'Weapons Factory (Q1)', baseOutput: 10, baseRM: 1, energyPerItem: 10, maxEmployees: 1 },
  { quality: 2, name: 'Weapons Factory (Q2)', baseOutput: 10, baseRM: 2, energyPerItem: 20, maxEmployees: 2 },
  { quality: 3, name: 'Weapons Factory (Q3)', baseOutput: 10, baseRM: 3, energyPerItem: 30, maxEmployees: 3 },
  { quality: 4, name: 'Weapons Factory (Q4)', baseOutput: 10, baseRM: 4, energyPerItem: 40, maxEmployees: 5 },
  { quality: 5, name: 'Weapons Factory (Q5)', baseOutput: 10, baseRM: 5, energyPerItem: 50, maxEmployees: 10 },
  { quality: 6, name: 'Weapons Factory (Q6)', baseOutput: 10, baseRM: 6, energyPerItem: 60, maxEmployees: 10 },
  { quality: 7, name: 'Weapons Factory (Q7)', baseOutput: 10, baseRM: 20, energyPerItem: 100, maxEmployees: 10 },
];

const weaponPlantationsData: FactoryDef[] = [
  { quality: 1, name: 'Iron Mine (Q1)', baseOutput: 35, energyPerItem: 10, maxEmployees: 0 },
  { quality: 2, name: 'Oil Spring (Q2)', baseOutput: 70, energyPerItem: 10, maxEmployees: 0 },
  { quality: 3, name: 'Aluminum Mine (Q3)', baseOutput: 125, energyPerItem: 10, maxEmployees: 1 },
  { quality: 4, name: 'Saltpeter Mine (Q4)', baseOutput: 175, energyPerItem: 10, maxEmployees: 1 },
  { quality: 5, name: 'Rubber Plantation (Q5)', baseOutput: 250, energyPerItem: 10, maxEmployees: 4 },
];

// House factories. baseOutput = 1/work = fraction of a house per worker-session at x1.0.
// baseRM = 2 (HRM consumed per worker-session at x1.0) for every quality.
const houseFactoriesData: FactoryDef[] = [
  { quality: 1, name: 'House Factory (Q1)', baseOutput: 1 / 5, baseRM: 2, maxEmployees: 1 },
  { quality: 2, name: 'House Factory (Q2)', baseOutput: 1 / 10, baseRM: 2, maxEmployees: 2 },
  { quality: 3, name: 'House Factory (Q3)', baseOutput: 1 / 20, baseRM: 2, maxEmployees: 3 },
  { quality: 4, name: 'House Factory (Q4)', baseOutput: 1 / 40, baseRM: 2, maxEmployees: 5 },
  { quality: 5, name: 'House Factory (Q5)', baseOutput: 1 / 60, baseRM: 2, maxEmployees: 10 },
];

const houseRawMaterialsData: FactoryDef[] = [
  { quality: 1, name: 'Sand (Q1)', baseOutput: 35, maxEmployees: 1 },
  { quality: 2, name: 'Clay (Q2)', baseOutput: 70, maxEmployees: 2 },
  { quality: 3, name: 'Wood (Q3)', baseOutput: 125, maxEmployees: 3 },
  { quality: 4, name: 'Limestone (Q4)', baseOutput: 175, maxEmployees: 4 },
  { quality: 5, name: 'Granite (Q5)', baseOutput: 250, maxEmployees: 5 },
];

// Aircraft Weapon Factories (Q1-Q5). Owner cannot work — hired employees only.
const aircraftFactoriesData: FactoryDef[] = [
  { quality: 1, name: 'Aircraft Weapons Factory (Q1)', baseOutput: 5, baseRM: 1, maxEmployees: 1 },
  { quality: 2, name: 'Aircraft Weapons Factory (Q2)', baseOutput: 5, baseRM: 2, maxEmployees: 2 },
  { quality: 3, name: 'Aircraft Weapons Factory (Q3)', baseOutput: 5, baseRM: 3, maxEmployees: 3 },
  { quality: 4, name: 'Aircraft Weapons Factory (Q4)', baseOutput: 5, baseRM: 4, maxEmployees: 4 },
  { quality: 5, name: 'Aircraft Weapons Factory (Q5)', baseOutput: 5, baseRM: 5, maxEmployees: 5 },
];

const aircraftRawMaterialsData: FactoryDef[] = [
  { quality: 1, name: 'Magnesium Refinery (Q1)', baseOutput: 35, maxEmployees: 1 },
  { quality: 2, name: 'Titanium Refinery (Q2)', baseOutput: 70, maxEmployees: 2 },
  { quality: 3, name: 'Wolfram Mine (Q3)', baseOutput: 125, maxEmployees: 3 },
  { quality: 4, name: 'Cobalt Plant (Q4)', baseOutput: 175, maxEmployees: 4 },
  { quality: 5, name: 'Neodymium Mine (Q5)', baseOutput: 250, maxEmployees: 5 },
];

export const INDUSTRIES: IndustryConfig[] = [
  { key: 'food', label: 'Food', icon: '🍞', type: 'fw', factoriesData: foodFactoriesData, rmData: foodPlantationsData, rmPriceKey: 'frmPrice', rmName: 'FRM', maxFactoryQuality: 7, isFood: true },
  { key: 'weapons', label: 'Weapons', icon: '⚔️', type: 'fw', factoriesData: weaponFactoriesData, rmData: weaponPlantationsData, rmPriceKey: 'wrmPrice', rmName: 'WRM', maxFactoryQuality: 7, isFood: false },
  { key: 'houses', label: 'Houses', icon: '🏠', type: 'hired', factoriesData: houseFactoriesData, rmData: houseRawMaterialsData, rmPriceKey: 'hrmPrice', rmName: 'HRM', maxFactoryQuality: 5, factoryIconIndustry: 4, rmBuildingIds: HRM_BUILDING_IDS },
  { key: 'aircraft', label: 'Aircraft', icon: '✈️', type: 'hired', factoriesData: aircraftFactoriesData, rmData: aircraftRawMaterialsData, rmPriceKey: 'armPrice', rmName: 'ARM', maxFactoryQuality: 5, factoryIconIndustry: 23, rmBuildingIds: ARM_BUILDING_IDS },
];

const BY_KEY = new Map<IndustryKey, IndustryConfig>(INDUSTRIES.map((i) => [i.key, i]));

export function getIndustry(key: IndustryKey): IndustryConfig {
  const cfg = BY_KEY.get(key);
  if (!cfg) throw new Error(`Unknown industry: ${key}`);
  return cfg;
}
