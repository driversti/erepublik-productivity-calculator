// One-off generator: runs the legacy holdingsCalc.mjs over the SAME deterministic
// inputs used by src/calc/golden.test.ts and writes the results to a committed
// snapshot. After the legacy file is deleted at cutover, the golden test asserts
// the new TS calc still matches this frozen legacy output.
//
// Run: node scripts/gen-golden-snapshot.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeFwIndustry, computeHiredIndustry } from '../holdingsCalc.mjs';

// Data arrays must match src/data/industries.ts (and the legacy app.js).
const foodFactories = [
  { quality: 1, baseOutput: 100, baseRM: 1, maxEmployees: 1 },
  { quality: 2, baseOutput: 100, baseRM: 2, maxEmployees: 2 },
  { quality: 3, baseOutput: 100, baseRM: 3, maxEmployees: 3 },
  { quality: 4, baseOutput: 100, baseRM: 4, maxEmployees: 5 },
  { quality: 5, baseOutput: 100, baseRM: 5, maxEmployees: 10 },
  { quality: 6, baseOutput: 100, baseRM: 6, maxEmployees: 10 },
  { quality: 7, baseOutput: 100, baseRM: 20, maxEmployees: 10 },
];
const foodPlantations = [
  { quality: 1, baseOutput: 35, maxEmployees: 0 },
  { quality: 2, baseOutput: 70, maxEmployees: 0 },
  { quality: 3, baseOutput: 125, maxEmployees: 1 },
  { quality: 4, baseOutput: 175, maxEmployees: 1 },
  { quality: 5, baseOutput: 250, maxEmployees: 4 },
];
const houseFactories = [
  { quality: 1, baseOutput: 1 / 5, baseRM: 2, maxEmployees: 1 },
  { quality: 2, baseOutput: 1 / 10, baseRM: 2, maxEmployees: 2 },
  { quality: 3, baseOutput: 1 / 20, baseRM: 2, maxEmployees: 3 },
  { quality: 4, baseOutput: 1 / 40, baseRM: 2, maxEmployees: 5 },
  { quality: 5, baseOutput: 1 / 60, baseRM: 2, maxEmployees: 10 },
];
const houseRm = [
  { quality: 1, baseOutput: 35, maxEmployees: 1 },
  { quality: 2, baseOutput: 70, maxEmployees: 2 },
  { quality: 3, baseOutput: 125, maxEmployees: 3 },
  { quality: 4, baseOutput: 175, maxEmployees: 4 },
  { quality: 5, baseOutput: 250, maxEmployees: 5 },
];

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fw = [];
{
  const rnd = mulberry32(12345);
  for (let i = 0; i < 300; i++) {
    const factoryCells = {};
    const plantationCells = {};
    for (let q = 1; q <= 7; q++) factoryCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 30) };
    for (let q = 1; q <= 5; q++) plantationCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 5) };
    const prices = {};
    for (let q = 1; q <= 7; q++) prices[q] = Math.round(rnd() * 100) / 100;
    const params = {
      factoriesData: foodFactories, plantationsData: foodPlantations,
      factoryCells, plantationCells,
      countryBonus: 100 + Math.floor(rnd() * 50), regionBonus: Math.floor(rnd() * 30),
      qualityPollution: { 0: rnd() * 10, 1: rnd() * 5, 7: rnd() * 10 }, vat: rnd() * 5,
      prices, rmPrice: Math.round(rnd() * 10) / 100,
      hasTycoon: rnd() > 0.5, wamEnabled: rnd() > 0.3,
      offeredSalary: Math.floor(rnd() * 20), workTaxRate: rnd() * 25, averageSalary: Math.floor(rnd() * 100),
    };
    fw.push(computeFwIndustry(params));
  }
}

const hired = [];
{
  const rnd = mulberry32(999);
  for (let i = 0; i < 300; i++) {
    const factoryCells = {};
    const rmCells = {};
    for (let q = 1; q <= 5; q++) {
      factoryCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 20) };
      rmCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 20) };
    }
    const prices = {};
    for (let q = 1; q <= 5; q++) prices[q] = Math.round(rnd() * 1000) / 100;
    const params = {
      factoriesData: houseFactories, rmData: houseRm,
      factoryCells, rmCells,
      countryBonus: 100 + Math.floor(rnd() * 50), regionBonus: Math.floor(rnd() * 30),
      qualityPollution: { 0: rnd() * 10 }, vat: rnd() * 5,
      prices, rmPrice: Math.round(rnd() * 100) / 100,
      hasTycoon: rnd() > 0.5, offeredSalary: Math.floor(rnd() * 20),
    };
    hired.push(computeHiredIndustry(params));
  }
}

mkdirSync(new URL('../src/calc/__fixtures__/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../src/calc/__fixtures__/golden-snapshot.json', import.meta.url),
  JSON.stringify({ fw, hired }, null, 0) + '\n',
);
console.log(`Wrote golden snapshot: ${fw.length} fw + ${hired.length} hired results.`);
