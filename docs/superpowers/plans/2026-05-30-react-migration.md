# React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the eRepublik Productivity / Profit Calculator from a 2700-line vanilla `app.js` to a Vite + React 19 + TypeScript app, preserving behavior and numeric output to the cent.

**Architecture:** Clean rewrite on branch `feat/react-migration`. Pure profit math is extracted to typed `src/calc/` modules and locked with golden-parity tests **before** any UI is built. State is one `useReducer` + Context, accessed only through domain facade hooks (so a later swap to Zustand touches no component). The existing `server.js` keeps its `/proxy` allowlist and serves Vite's `dist/` in production. Old files stay in place until a final cutover.

**Tech Stack:** Vite, React 19, TypeScript, Vitest, @testing-library/react, @testing-library/jest-dom, jsdom.

**Spec:** `docs/superpowers/specs/2026-05-30-react-migration-design.md`

**Conventions for every task:**
- Always ask the user before any `git commit` (project rule). Commit steps below are written as the *intent*; the worker proposes the message and waits for approval.
- TypeScript strict mode. No `any` except where bridging untyped scraped JSON, and then narrowed immediately.
- Money/counts display: `.toFixed(2)` for CC, integer `.toLocaleString()` for output counts, per current behavior.

---

## Task 1: Branch + Vite/React/TS scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html` (new), `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Keep untouched: existing `app.js`, `holdingsCalc.mjs`, `holdingsCalc.test.mjs`, `travelData.js`, `styles.css`, `server.js`, current `index.html` → rename to `index.legacy.html`

- [ ] **Step 1: Create the branch**

Run: `git checkout -b feat/react-migration`
Expected: `Switched to a new branch 'feat/react-migration'`

- [ ] **Step 2: Preserve the legacy entry so both apps can be served during migration**

Run: `git mv index.html index.legacy.html`
Expected: no output (staged rename). The legacy app is still runnable via `node server.js` + visiting `/index.legacy.html`.

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "erep-calculator",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "serve": "node server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Write `vite.config.ts`** (dev-proxies `/proxy` to the running `server.js` on 8080; builds to `dist/`)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Live data still flows through the existing Node allowlist proxy.
      '/proxy': 'http://localhost:8080',
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 7: Write new `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>eRepublik Productivity & Profit Calculator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Write `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 9: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 10: Write placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <h1>eRepublik Calculator — React</h1>;
}
```

- [ ] **Step 11: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '../styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 12: Install and verify dev server boots**

Run: `npm install`
Then run: `npm run build`
Expected: `tsc -b` passes and Vite writes `dist/` with no type errors.

- [ ] **Step 13: Commit** (ask user first)

Proposed message: `chore: scaffold Vite + React 19 + TS alongside legacy app`

---

## Task 2: Port game data to typed `src/data/`

**Files:**
- Create: `src/data/types.ts`, `src/data/industries.ts`, `src/data/buildingIds.ts`, `src/data/travel.ts`
- Test: `src/data/industries.test.ts`
- Source of truth: `app.js:4-114` (the four `*FactoriesData` / `*PlantationsData` / `*RawMaterialsData` arrays, building-ID maps, `HIRED_LABOR_MODULES`, `HOLDING_INDUSTRIES`)

- [ ] **Step 1: Write `src/data/types.ts`**

```ts
export interface FactoryDef {
  quality: number;
  baseOutput: number;
  baseRM: number;
  energyPerItem: number;
  maxEmployees: number;
}

export type IndustryKey = 'food' | 'weapons' | 'houses' | 'aircraft';
export type IndustryType = 'fw' | 'hired';

export interface IndustryConfig {
  key: IndustryKey;
  label: string;
  type: IndustryType;
  factoriesData: FactoryDef[];
  /** plantations (fw) or raw-material companies (hired) */
  rmData: FactoryDef[];
  rmPriceKey: 'frmPrice' | 'wrmPrice' | 'hrmPrice' | 'armPrice';
  rmName: string;
}
```

- [ ] **Step 2: Write the failing test `src/data/industries.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { INDUSTRIES, getIndustry } from './industries';

describe('industry data', () => {
  it('food factory Q7 matches game constants', () => {
    const q7 = getIndustry('food').factoriesData.find((f) => f.quality === 7)!;
    expect(q7).toEqual({ quality: 7, baseOutput: 31.08, baseRM: 0.07, energyPerItem: 7, maxEmployees: 7 });
  });

  it('weapon factory Q1 baseRM equals baseOutput', () => {
    const q1 = getIndustry('weapons').factoriesData.find((f) => f.quality === 1)!;
    expect(q1.baseOutput).toBe(1.5);
    expect(q1.baseRM).toBe(1.5);
  });

  it('exposes all four industries with correct types', () => {
    expect(INDUSTRIES.map((i) => i.key)).toEqual(['food', 'weapons', 'houses', 'aircraft']);
    expect(getIndustry('houses').type).toBe('hired');
    expect(getIndustry('food').type).toBe('fw');
  });

  it('aircraft has a single Q1 factory', () => {
    expect(getIndustry('aircraft').factoriesData).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/data/industries.test.ts`
Expected: FAIL — cannot resolve `./industries`.

- [ ] **Step 4: Write `src/data/buildingIds.ts`** (from `app.js:86-89`)

```ts
export const EREP_CDN = 'https://www.erepublik.net/images';
export const FRM_BUILDING_IDS: Record<number, number> = { 1: 7, 2: 8, 3: 9, 4: 10, 5: 11 };
export const WRM_BUILDING_IDS: Record<number, number> = { 1: 12, 2: 13, 3: 14, 4: 15, 5: 16 };
export const HRM_BUILDING_IDS: Record<number, number> = { 1: 17, 2: 18, 3: 19, 4: 21, 5: 22 };
export const ARM_BUILDING_IDS: Record<number, number> = { 1: 24, 2: 25, 3: 26, 4: 27, 5: 28 };
```

- [ ] **Step 5: Write `src/data/industries.ts`** — copy the four data arrays verbatim from `app.js:4-79`, then assemble configs. (Full arrays below; copy exact numbers.)

```ts
import type { FactoryDef, IndustryConfig, IndustryKey } from './types';

const foodFactoriesData: FactoryDef[] = [
  { quality: 1, baseOutput: 4.44, baseRM: 0.01, energyPerItem: 1, maxEmployees: 1 },
  { quality: 2, baseOutput: 8.88, baseRM: 0.02, energyPerItem: 2, maxEmployees: 2 },
  { quality: 3, baseOutput: 13.32, baseRM: 0.03, energyPerItem: 3, maxEmployees: 3 },
  { quality: 4, baseOutput: 17.76, baseRM: 0.04, energyPerItem: 4, maxEmployees: 4 },
  { quality: 5, baseOutput: 22.2, baseRM: 0.05, energyPerItem: 5, maxEmployees: 5 },
  { quality: 6, baseOutput: 26.64, baseRM: 0.06, energyPerItem: 6, maxEmployees: 6 },
  { quality: 7, baseOutput: 31.08, baseRM: 0.07, energyPerItem: 7, maxEmployees: 7 },
];
const foodPlantationsData: FactoryDef[] = [
  { quality: 1, baseOutput: 444, baseRM: 0, energyPerItem: 0, maxEmployees: 1 },
  { quality: 2, baseOutput: 888, baseRM: 0, energyPerItem: 0, maxEmployees: 2 },
  { quality: 3, baseOutput: 1332, baseRM: 0, energyPerItem: 0, maxEmployees: 3 },
  { quality: 4, baseOutput: 1776, baseRM: 0, energyPerItem: 0, maxEmployees: 4 },
  { quality: 5, baseOutput: 2220, baseRM: 0, energyPerItem: 0, maxEmployees: 5 },
];
const weaponFactoriesData: FactoryDef[] = [
  { quality: 1, baseOutput: 1.5, baseRM: 1.5, energyPerItem: 1, maxEmployees: 1 },
  { quality: 2, baseOutput: 3, baseRM: 3, energyPerItem: 2, maxEmployees: 2 },
  { quality: 3, baseOutput: 4.5, baseRM: 4.5, energyPerItem: 3, maxEmployees: 3 },
  { quality: 4, baseOutput: 6, baseRM: 6, energyPerItem: 4, maxEmployees: 4 },
  { quality: 5, baseOutput: 7.5, baseRM: 7.5, energyPerItem: 5, maxEmployees: 5 },
  { quality: 6, baseOutput: 9, baseRM: 9, energyPerItem: 6, maxEmployees: 6 },
  { quality: 7, baseOutput: 10.5, baseRM: 10.5, energyPerItem: 7, maxEmployees: 7 },
];
const weaponPlantationsData: FactoryDef[] = [
  { quality: 1, baseOutput: 150, baseRM: 0, energyPerItem: 0, maxEmployees: 1 },
  { quality: 2, baseOutput: 300, baseRM: 0, energyPerItem: 0, maxEmployees: 2 },
  { quality: 3, baseOutput: 450, baseRM: 0, energyPerItem: 0, maxEmployees: 3 },
  { quality: 4, baseOutput: 600, baseRM: 0, energyPerItem: 0, maxEmployees: 4 },
  { quality: 5, baseOutput: 750, baseRM: 0, energyPerItem: 0, maxEmployees: 5 },
];
const houseFactoriesData: FactoryDef[] = [
  { quality: 1, baseOutput: 1, baseRM: 50, energyPerItem: 0, maxEmployees: 5 },
  { quality: 2, baseOutput: 1, baseRM: 100, energyPerItem: 0, maxEmployees: 10 },
  { quality: 3, baseOutput: 1, baseRM: 150, energyPerItem: 0, maxEmployees: 15 },
  { quality: 4, baseOutput: 1, baseRM: 200, energyPerItem: 0, maxEmployees: 20 },
  { quality: 5, baseOutput: 1, baseRM: 250, energyPerItem: 0, maxEmployees: 25 },
];
const houseRawMaterialsData: FactoryDef[] = [
  { quality: 1, baseOutput: 100, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 2, baseOutput: 200, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 3, baseOutput: 300, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 4, baseOutput: 400, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 5, baseOutput: 500, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
];
const aircraftFactoriesData: FactoryDef[] = [
  { quality: 1, baseOutput: 1, baseRM: 100, energyPerItem: 0, maxEmployees: 10 },
];
const aircraftRawMaterialsData: FactoryDef[] = [
  { quality: 1, baseOutput: 100, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 2, baseOutput: 200, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 3, baseOutput: 300, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 4, baseOutput: 400, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
  { quality: 5, baseOutput: 500, baseRM: 0, energyPerItem: 0, maxEmployees: 10 },
];

export const INDUSTRIES: IndustryConfig[] = [
  { key: 'food', label: 'Food', type: 'fw', factoriesData: foodFactoriesData, rmData: foodPlantationsData, rmPriceKey: 'frmPrice', rmName: 'FRM' },
  { key: 'weapons', label: 'Weapons', type: 'fw', factoriesData: weaponFactoriesData, rmData: weaponPlantationsData, rmPriceKey: 'wrmPrice', rmName: 'WRM' },
  { key: 'houses', label: 'Houses', type: 'hired', factoriesData: houseFactoriesData, rmData: houseRawMaterialsData, rmPriceKey: 'hrmPrice', rmName: 'HRM' },
  { key: 'aircraft', label: 'Aircraft', type: 'hired', factoriesData: aircraftFactoriesData, rmData: aircraftRawMaterialsData, rmPriceKey: 'armPrice', rmName: 'ARM' },
];

const BY_KEY = new Map(INDUSTRIES.map((i) => [i.key, i]));
export function getIndustry(key: IndustryKey): IndustryConfig {
  const cfg = BY_KEY.get(key);
  if (!cfg) throw new Error(`Unknown industry: ${key}`);
  return cfg;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/data/industries.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Port `travelData.js` → `src/data/travel.ts`**

Convert the two exported maps (`countries`, `regions`) to TypeScript by adding type annotations only — do not edit data. Add at the top:

```ts
export interface CountryEntry { name: string; permalink: string; regionIds: number[]; }
export interface RegionEntry { name: string; permalink: string; }
export const countries: Record<number, CountryEntry> = /* paste from travelData.js */;
export const regions: Record<number, RegionEntry> = /* paste from travelData.js */;
```

- [ ] **Step 8: Run full test + typecheck**

Run: `npm test && npx tsc -b`
Expected: all pass, no type errors.

- [ ] **Step 9: Commit** (ask user first)

Proposed message: `feat: port game data to typed src/data`

---

## Task 3: Port pure rounding helpers to `src/calc/rounding.ts`

**Files:**
- Create: `src/calc/rounding.ts`
- Test: `src/calc/rounding.test.ts`
- Source: `holdingsCalc.mjs:5-26` (already pure) + existing `holdingsCalc.test.mjs`

- [ ] **Step 1: Write the failing test `src/calc/rounding.test.ts`** (ports the existing node:test cases)

```ts
import { describe, it, expect } from 'vitest';
import { roundNumber, gameRawProduction, productivityMultiplier, pollutionAt } from './rounding';

describe('rounding', () => {
  it('roundNumber rounds to N decimals', () => {
    expect(roundNumber(1.236, 2)).toBe(1.24);
    expect(roundNumber(1.5, 0)).toBe(2);
  });

  it('gameRawProduction truncates the 3rd decimal (3.685 -> 3.68)', () => {
    expect(gameRawProduction(3.685)).toBe(3.68);
  });

  it('productivityMultiplier sums bonuses and floors at 0', () => {
    expect(roundNumber(productivityMultiplier({ countryBonus: 100, regionBonus: 0, hasTycoon: false, pollutionRate: 0 }), 5)).toBe(2);
    expect(productivityMultiplier({ countryBonus: 0, regionBonus: 0, hasTycoon: false, pollutionRate: 500 })).toBe(0);
  });

  it('pollutionAt reads the index, defaulting to 0', () => {
    expect(pollutionAt({ 0: 5, 1: 9 }, 1)).toBe(9);
    expect(pollutionAt({}, 3)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/calc/rounding.test.ts`
Expected: FAIL — cannot resolve `./rounding`.

- [ ] **Step 3: Write `src/calc/rounding.ts`** (verbatim logic from `holdingsCalc.mjs`, typed)

```ts
export function roundNumber(value: number, digits = 2): number {
  const multiplier = Math.pow(10, digits);
  return Math.round(value * multiplier) / multiplier;
}

// Game rounds to 3 decimals then drops the 3rd (floor to 2dp): 3.685 -> 3.68.
export function gameRawProduction(value: number): number {
  return Number(roundNumber(value, 3).toFixed(3).slice(0, -1));
}

export interface MultiplierInput {
  countryBonus: number;
  regionBonus: number;
  hasTycoon: boolean;
  pollutionRate: number;
}

// Deliberately NOT rounded — the product is rounded by callers, matching the game.
export function productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate }: MultiplierInput): number {
  return Math.max(0, 1 + countryBonus / 100 + regionBonus / 100 + (hasTycoon ? 0.2 : 0) - pollutionRate / 100);
}

export function pollutionAt(qualityPollution: Record<number, number> | undefined, index: number): number {
  return qualityPollution && typeof qualityPollution[index] === 'number' ? qualityPollution[index] : 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/calc/rounding.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `feat: port pure rounding helpers to src/calc`

---

## Task 4: Port industry compute to `src/calc/industry.ts`

**Files:**
- Create: `src/calc/types.ts`, `src/calc/industry.ts`
- Test: `src/calc/industry.test.ts`
- Source: `holdingsCalc.mjs:30-131` (`computeFwIndustry`, `computeHiredIndustry`)

- [ ] **Step 1: Write `src/calc/types.ts`**

```ts
export interface Cell { companies: number; workers: number; }
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
```

- [ ] **Step 2: Write the failing test `src/calc/industry.test.ts`**

Empty input must yield an all-zero result (cheap golden anchor):

```ts
import { describe, it, expect } from 'vitest';
import { computeFwIndustry } from './industry';
import { getIndustry } from '../data/industries';

const food = getIndustry('food');

describe('computeFwIndustry', () => {
  it('returns zeros for empty input', () => {
    const r = computeFwIndustry({
      factoriesData: food.factoriesData,
      plantationsData: food.rmData,
      factoryCells: {}, plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 1,
      prices: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 }, rmPrice: 0.01,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 1, averageSalary: 0,
    });
    expect(r.net).toBe(0);
    expect(r.companies).toBe(0);
  });

  it('one Q1 food factory at 100% country bonus, WAM on', () => {
    const r = computeFwIndustry({
      factoriesData: food.factoriesData,
      plantationsData: food.rmData,
      factoryCells: { 1: { companies: 1, workers: 0 } }, plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 }, rmPrice: 0,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0,
    });
    // multiplier = 2 → output = roundNumber(4.44*2,2)=8.88, revenue = 8.88*1*(1-0)=8.88
    expect(r.output).toBe(8.88);
    expect(r.revenue).toBeCloseTo(8.88, 10);
    expect(r.companies).toBe(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/calc/industry.test.ts`
Expected: FAIL — cannot resolve `./industry`.

- [ ] **Step 4: Write `src/calc/industry.ts`** — port `computeFwIndustry` + `computeHiredIndustry` from `holdingsCalc.mjs:30-131` verbatim, typed with `IndustryResult`. Use `roundNumber`, `gameRawProduction`, `productivityMultiplier`, `pollutionAt` from `./rounding`. Parameter objects:

```ts
import { roundNumber, gameRawProduction, productivityMultiplier, pollutionAt } from './rounding';
import type { FactoryDef } from '../data/types';
import type { Cells, IndustryResult } from './types';

export interface FwInput {
  factoriesData: FactoryDef[];
  plantationsData: FactoryDef[];
  factoryCells: Cells;
  plantationCells: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  workTaxRate: number;
  averageSalary: number;
}

export interface HiredInput {
  factoriesData: FactoryDef[];
  rmData: FactoryDef[];
  factoryCells: Cells;
  rmCells: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  offeredSalary: number;
}

export function computeFwIndustry(p: FwInput): IndustryResult { /* port lines 37-81 */ }
export function computeHiredIndustry(p: HiredInput): IndustryResult { /* port lines 93-130 */ }
```

Port the bodies exactly as in `holdingsCalc.mjs` (same accumulation, same `roundNumber`/`gameRawProduction` placement, same `rmNetCost`/`workTax`/`salary`/`net` formulas). Do not "improve" the math.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/calc/industry.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit** (ask user first)

Proposed message: `feat: port industry compute to src/calc/industry`

---

## Task 5: Extract the buy-vs-produce strategy to `src/calc/strategy.ts`

This logic is currently **inline in `render()`** (`app.js:1011-1043`). It must become a pure function so the IndustryView and tests share it.

**Files:**
- Create: `src/calc/strategy.ts`
- Test: `src/calc/strategy.test.ts`

- [ ] **Step 1: Write the failing test `src/calc/strategy.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeIndustryView } from './strategy';
import { getIndustry } from '../data/industries';

const food = getIndustry('food');

describe('computeIndustryView (Option A vs B)', () => {
  it('picks Option A (buy) when no plantations exist', () => {
    const v = computeIndustryView({
      industry: food,
      factoryCells: { 1: { companies: 1, workers: 0 } },
      plantationCells: {},
      countryBonus: 100, regionBonus: 0, qualityPollution: {}, vat: 0,
      prices: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 }, rmPrice: 1,
      hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0,
    });
    expect(v.useProduce).toBe(false);
    // chosen net == option A net
    expect(v.chosenNet).toBeCloseTo(v.optionANet, 10);
  });

  it('chosenNet is always the max of the two options', () => {
    const v = computeIndustryView({
      industry: food,
      factoryCells: { 7: { companies: 2, workers: 0 } },
      plantationCells: { 5: { companies: 3, workers: 0 } },
      countryBonus: 120, regionBonus: 20, qualityPollution: { 0: 5, 7: 10 }, vat: 1,
      prices: { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.8, 5: 0.9, 6: 1.0, 7: 1.1 }, rmPrice: 0.02,
      hasTycoon: true, wamEnabled: true, offeredSalary: 5, workTaxRate: 10, averageSalary: 30,
    });
    expect(v.chosenNet).toBe(Math.max(v.optionANet, v.optionBNet));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/calc/strategy.test.ts`
Expected: FAIL — cannot resolve `./strategy`.

- [ ] **Step 3: Write `src/calc/strategy.ts`** — port the Option A/B math verbatim from `app.js:976-1043`. Note: this recomputes per-factory totals (it does NOT reuse `computeFwIndustry`, because the legacy `render()` computes `totalRM`, `totalRMProduced`, `breakdown`, and the two options inline; preserve that exact arithmetic for parity).

```ts
import { roundNumber, gameRawProduction, productivityMultiplier, pollutionAt } from './rounding';
import type { IndustryConfig } from '../data/types';
import type { Cells } from './types';

export interface IndustryViewInput {
  industry: IndustryConfig;
  factoryCells: Cells;
  plantationCells: Cells;
  countryBonus: number;
  regionBonus: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  workTaxRate: number;
  averageSalary: number;
}

export interface BreakdownRow { quality: number; count: number; output: number; revenue: number; }

export interface IndustryView {
  totalFactories: number;
  totalOutput: number;
  totalRM: number;
  totalRMProduced: number;
  netBalance: number;
  grossRevenue: number;
  plantationWorkTax: number;
  optionABuyCost: number;
  optionANet: number;
  optionBRMCost: number;
  optionBNet: number;
  useProduce: boolean;
  chosenNet: number;
  chosenWorkTax: number;
  chosenSalary: number;
  chosenRMCost: number;
  breakdown: BreakdownRow[];
}

export function computeIndustryView(p: IndustryViewInput): IndustryView {
  const { industry, factoryCells, plantationCells, countryBonus, regionBonus,
    qualityPollution, vat, prices, rmPrice, hasTycoon, wamEnabled,
    offeredSalary, workTaxRate, averageSalary } = p;

  const mult = (q: number) =>
    productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, q) });

  let totalOutput = 0, totalRM = 0, totalRevenue = 0, totalFactories = 0, totalFactoryWorkers = 0, factoryWamSessions = 0;
  const breakdown: BreakdownRow[] = [];
  for (const fact of industry.factoriesData) {
    const cell = factoryCells[fact.quality] ?? { companies: 0, workers: 0 };
    const c = cell.companies || 0;
    const w = Math.min(cell.workers || 0, c * fact.maxEmployees);
    const sessions = (wamEnabled ? c : 0) + w;
    totalFactories += c; totalFactoryWorkers += w;
    factoryWamSessions += wamEnabled ? c : 0;
    const m = mult(fact.quality);
    const singleOutput = roundNumber(fact.baseOutput * m, 2);
    const singleRM = roundNumber(fact.baseRM * m, 2);
    totalOutput += singleOutput * sessions;
    totalRM += singleRM * sessions;
    const rev = singleOutput * sessions * prices[fact.quality] * (1 - vat / 100);
    totalRevenue += rev;
    if (sessions > 0) breakdown.push({ quality: fact.quality, count: sessions, output: singleOutput * sessions, revenue: rev });
  }

  let totalPlantationWorkers = 0, plantationWamSessions = 0, totalRMProduced = 0;
  for (const plant of industry.rmData) {
    const cell = plantationCells[plant.quality] ?? { companies: 0, workers: 0 };
    const c = cell.companies || 0;
    const w = Math.min(cell.workers || 0, c * plant.maxEmployees);
    const sessions = (wamEnabled ? c : 0) + w;
    totalPlantationWorkers += w;
    plantationWamSessions += wamEnabled ? c : 0;
    const m = mult(0);
    const singleOutput = gameRawProduction((plant.baseOutput / 100) * m);
    totalRMProduced += singleOutput * sessions;
  }

  totalOutput = roundNumber(totalOutput, 2);
  totalRM = roundNumber(totalRM, 2);
  totalRMProduced = roundNumber(totalRMProduced, 2);

  const grossRevenue = totalRevenue;
  const wtr = workTaxRate / 100;
  const factoryWorkTax = factoryWamSessions * wtr * averageSalary;
  const plantationWorkTax = plantationWamSessions * wtr * averageSalary;

  const optionABuyCost = totalRM * rmPrice;
  const optionAWorkTax = factoryWorkTax;
  const optionASalary = totalFactoryWorkers * offeredSalary;
  const optionANet = grossRevenue - optionABuyCost - optionAWorkTax - optionASalary;

  const netBalance = totalRMProduced - totalRM;
  const optionBRMCost = netBalance < 0 ? -netBalance * rmPrice : -(netBalance * rmPrice * (1 - vat / 100));
  const optionBWorkTax = factoryWorkTax + plantationWorkTax;
  const optionBSalary = (totalFactoryWorkers + totalPlantationWorkers) * offeredSalary;
  const optionBNet = grossRevenue - optionBRMCost - optionBWorkTax - optionBSalary;

  const useProduce = optionBNet > optionANet;
  return {
    totalFactories, totalOutput, totalRM, totalRMProduced, netBalance, grossRevenue,
    plantationWorkTax, optionABuyCost, optionANet, optionBRMCost, optionBNet, useProduce,
    chosenNet: useProduce ? optionBNet : optionANet,
    chosenWorkTax: useProduce ? optionBWorkTax : optionAWorkTax,
    chosenSalary: useProduce ? optionBSalary : optionASalary,
    chosenRMCost: useProduce ? optionBRMCost : optionABuyCost,
    breakdown,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/calc/strategy.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `feat: extract buy-vs-produce strategy to pure src/calc/strategy`

---

## Task 6: Holding aggregation + GOLDEN PARITY harness

This is the safety net. We snapshot the **legacy** `holdingsCalc.mjs` output on randomized inputs and assert the new `src/calc` matches.

**Files:**
- Create: `src/calc/holding.ts`, `src/calc/golden.test.ts`
- Test: `src/calc/holding.test.ts`
- Source: `holdingsCalc.mjs:135-148` (`sumHolding`)

- [ ] **Step 1: Write `src/calc/holding.ts`** (port `sumHolding`)

```ts
import type { IndustryResult } from './types';

export interface PerIndustry { key: string; label: string; net: number; companies: number; }
export interface HoldingTotals {
  net: number; revenue: number; rmNetCost: number; workTax: number; salary: number; companies: number;
  perIndustry: PerIndustry[];
}

export function sumHolding(results: { key: string; label: string; result: IndustryResult }[]): HoldingTotals {
  const totals = { net: 0, revenue: 0, rmNetCost: 0, workTax: 0, salary: 0, companies: 0 };
  const perIndustry: PerIndustry[] = [];
  for (const { key, label, result } of results) {
    totals.net += result.net;
    totals.revenue += result.revenue;
    totals.rmNetCost += result.rmNetCost;
    totals.workTax += result.workTax;
    totals.salary += result.salary;
    totals.companies += result.companies;
    perIndustry.push({ key, label, net: result.net, companies: result.companies });
  }
  return { ...totals, perIndustry };
}
```

- [ ] **Step 2: Write `src/calc/holding.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sumHolding } from './holding';

describe('sumHolding', () => {
  it('sums net and companies across industries', () => {
    const r = sumHolding([
      { key: 'food', label: 'Food', result: { net: 10, revenue: 20, rmNetCost: 5, workTax: 2, salary: 3, companies: 4, output: 0, rmConsumed: 0, rmProduced: 0, netBalance: 0 } },
      { key: 'weapons', label: 'Weapons', result: { net: 7, revenue: 9, rmNetCost: 1, workTax: 0, salary: 1, companies: 2, output: 0, rmConsumed: 0, rmProduced: 0, netBalance: 0 } },
    ]);
    expect(r.net).toBe(17);
    expect(r.companies).toBe(6);
    expect(r.perIndustry).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Write the golden-parity test `src/calc/golden.test.ts`** — import BOTH the legacy `.mjs` and the new TS, run identical randomized inputs, assert equality. The legacy file is still present during migration.

```ts
import { describe, it, expect } from 'vitest';
import { computeFwIndustry as legacyFw, computeHiredIndustry as legacyHired } from '../../holdingsCalc.mjs';
import { computeFwIndustry } from './industry';
import { computeHiredIndustry } from './industry';
import { getIndustry } from '../data/industries';

// Deterministic PRNG so failures reproduce.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const food = getIndustry('food');

describe('golden parity: new TS calc == legacy holdingsCalc.mjs', () => {
  it('computeFwIndustry matches on 200 random inputs', () => {
    const rnd = mulberry32(12345);
    for (let i = 0; i < 200; i++) {
      const factoryCells: Record<number, { companies: number; workers: number }> = {};
      const plantationCells: Record<number, { companies: number; workers: number }> = {};
      for (let q = 1; q <= 7; q++) factoryCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 3) };
      for (let q = 1; q <= 5; q++) plantationCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 3) };
      const prices: Record<number, number> = {};
      for (let q = 1; q <= 7; q++) prices[q] = Math.round(rnd() * 100) / 100;
      const params = {
        factoriesData: food.factoriesData, plantationsData: food.rmData,
        factoryCells, plantationCells,
        countryBonus: 100 + Math.floor(rnd() * 50), regionBonus: Math.floor(rnd() * 30),
        qualityPollution: { 0: rnd() * 10, 7: rnd() * 10 }, vat: rnd() * 5,
        prices, rmPrice: Math.round(rnd() * 10) / 100,
        hasTycoon: rnd() > 0.5, wamEnabled: rnd() > 0.3,
        offeredSalary: Math.floor(rnd() * 20), workTaxRate: rnd() * 25, averageSalary: Math.floor(rnd() * 100),
      };
      expect(computeFwIndustry(params)).toEqual(legacyFw(params));
    }
  });

  it('computeHiredIndustry matches on 200 random inputs', () => {
    const rnd = mulberry32(999);
    const houses = getIndustry('houses');
    for (let i = 0; i < 200; i++) {
      const factoryCells: Record<number, { companies: number; workers: number }> = {};
      const rmCells: Record<number, { companies: number; workers: number }> = {};
      for (let q = 1; q <= 5; q++) { factoryCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 20) }; rmCells[q] = { companies: Math.floor(rnd() * 5), workers: Math.floor(rnd() * 20) }; }
      const prices: Record<number, number> = {};
      for (let q = 1; q <= 5; q++) prices[q] = Math.round(rnd() * 1000) / 100;
      const params = {
        factoriesData: houses.factoriesData, rmData: houses.rmData,
        factoryCells, rmCells,
        countryBonus: 100 + Math.floor(rnd() * 50), regionBonus: Math.floor(rnd() * 30),
        qualityPollution: { 0: rnd() * 10 }, vat: rnd() * 5,
        prices, rmPrice: Math.round(rnd() * 100) / 100,
        hasTycoon: rnd() > 0.5, offeredSalary: Math.floor(rnd() * 20),
      };
      expect(computeHiredIndustry(params)).toEqual(legacyHired(params));
    }
  });
});
```

- [ ] **Step 4: Run all calc tests**

Run: `npm test -- src/calc`
Expected: PASS — golden parity confirms the port is bit-identical to legacy.

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `test: add holding aggregation + golden-parity harness vs legacy calc`

---

## Task 7: State types + reducer

**Files:**
- Create: `src/state/types.ts`, `src/state/blank.ts`, `src/state/reducer.ts`
- Test: `src/state/reducer.test.ts`
- Source: `app.js:261-314` (`blankFwIndustry`, `blankHiredIndustry`, `createHolding`, `clearHoldingCompanies`), plus the `state` object shape used throughout.

- [ ] **Step 1: Write `src/state/types.ts`** — model the full state shape (per-module food/weapons/houses/aircraft sub-objects, shared top-level fields, holdings).

```ts
import type { Cells, Cell } from '../calc/types';
import type { IndustryKey } from '../data/types';

export interface FwModule {
  [q: number]: Cell | undefined; // factory cells 1..7 (numeric keys)
  plantations: Cells;
  countryBonus: number;
  regionBonus: number;
  pollution?: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  selectedCountryId: string;
  selectedRegionPermalink: string;
  workTaxRate: number;
  averageSalary: number;
}

export interface HiredModule {
  factories: Cells;
  rm: Cells;
  countryBonus: number;
  regionBonus: number;
  pollution?: number;
  qualityPollution: Record<number, number>;
  vat: number;
  prices: Record<number, number>;
  selectedCountryId: string;
  selectedRegionPermalink: string;
  workTaxRate: number;
  averageSalary: number;
}

export interface HoldingIndustry { /* same as Fw/Hired industry sub-shapes used in createHolding */ }
export interface Holding {
  id: string;
  name: string;
  selectedCountryId: string;
  selectedRegionPermalink: string;
  workTaxRate: number;
  averageSalary: number;
  industries: { food: FwModule; weapons: FwModule; houses: HiredModule; aircraft: HiredModule };
}

export type ActiveModule = IndustryKey | 'holdings';

export interface AppState {
  activeModule: ActiveModule;
  hasTycoon: boolean;
  wamEnabled: boolean;
  offeredSalary: number;
  frmPrice: number;
  wrmPrice: number;
  hrmPrice: number;
  armPrice: number;
  food: FwModule;
  weapons: FwModule;
  houses: HiredModule;
  aircraft: HiredModule;
  holdings: Holding[];
  holdingSeq: number;
  activeHoldingId: string;
}
```

- [ ] **Step 2: Write `src/state/blank.ts`** — port `blankFwIndustry`/`blankHiredIndustry`/`createHolding` and add `initialState()`.

```ts
import type { AppState, FwModule, HiredModule, Holding } from './types';

export function blankFwModule(): FwModule {
  const m = {} as FwModule;
  for (let q = 1; q <= 7; q++) m[q] = { companies: 0, workers: 0 };
  m.plantations = {};
  for (let q = 1; q <= 5; q++) m.plantations[q] = { companies: 0, workers: 0 };
  m.countryBonus = 100; m.regionBonus = 0;
  m.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  m.vat = 1.0;
  m.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  m.selectedCountryId = ''; m.selectedRegionPermalink = '';
  m.workTaxRate = 1.0; m.averageSalary = 0.0;
  return m;
}

export function blankHiredModule(): HiredModule {
  const m = { factories: {}, rm: {} } as HiredModule;
  for (let q = 1; q <= 5; q++) { m.factories[q] = { companies: 0, workers: 0 }; m.rm[q] = { companies: 0, workers: 0 }; }
  m.countryBonus = 100; m.regionBonus = 0;
  m.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  m.vat = 1.0;
  m.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  m.selectedCountryId = ''; m.selectedRegionPermalink = '';
  m.workTaxRate = 1.0; m.averageSalary = 0.0;
  return m;
}

export function createHolding(seq: number, name: string): Holding {
  return {
    id: 'h' + seq, name,
    selectedCountryId: '', selectedRegionPermalink: '',
    workTaxRate: 1.0, averageSalary: 0.0,
    industries: { food: blankFwModule(), weapons: blankFwModule(), houses: blankHiredModule(), aircraft: blankHiredModule() },
  };
}

export function initialState(): AppState {
  return {
    activeModule: 'food', hasTycoon: false, wamEnabled: true, offeredSalary: 0,
    frmPrice: 0, wrmPrice: 0, hrmPrice: 0, armPrice: 0,
    food: blankFwModule(), weapons: blankFwModule(), houses: blankHiredModule(), aircraft: blankHiredModule(),
    holdings: [], holdingSeq: 0, activeHoldingId: '',
  };
}
```

- [ ] **Step 3: Write the failing test `src/state/reducer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './blank';

describe('reducer', () => {
  it('SET_FACTORY_CELL sets companies clamped to [0,9999]', () => {
    const s = reducer(initialState(), { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 3, field: 'companies', value: 5 });
    expect((s.food[3])!.companies).toBe(5);
    const over = reducer(s, { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 3, field: 'companies', value: 99999 });
    expect((over.food[3])!.companies).toBe(9999);
  });

  it('SWITCH_MODULE changes the active module', () => {
    const s = reducer(initialState(), { type: 'SWITCH_MODULE', module: 'weapons' });
    expect(s.activeModule).toBe('weapons');
  });

  it('CREATE_HOLDING appends a holding and bumps the sequence', () => {
    const s = reducer(initialState(), { type: 'CREATE_HOLDING', name: 'Berlin' });
    expect(s.holdings).toHaveLength(1);
    expect(s.holdings[0].id).toBe('h1');
    expect(s.activeHoldingId).toBe('h1');
  });

  it('TOGGLE_TYCOON flips the flag immutably', () => {
    const a = initialState();
    const b = reducer(a, { type: 'TOGGLE_TYCOON' });
    expect(b.hasTycoon).toBe(true);
    expect(a.hasTycoon).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- src/state/reducer.test.ts`
Expected: FAIL — cannot resolve `./reducer`.

- [ ] **Step 5: Write `src/state/reducer.ts`** — a typed discriminated-union `Action` and pure reducer. Cover at minimum: `SWITCH_MODULE`, `SET_FACTORY_CELL` (module/kind/quality/field/value, clamps companies≤9999 and workers≤companies*maxEmployees using `getIndustry`), `SET_MODULE_FIELD` (countryBonus/regionBonus/vat/workTaxRate/averageSalary/price-by-quality, which also clears the location selection → "Manual" per spec §5), `SET_SHARED_FIELD` (hasTycoon/wamEnabled/offeredSalary/frmPrice/…), `TOGGLE_TYCOON`, `TOGGLE_WAM`, `CREATE_HOLDING`, `RENAME_HOLDING`, `SWITCH_HOLDING`, `CLEAR_HOLDING_COMPANIES`, `SET_HOLDING_CELL`, `SET_HOLDING_FIELD`, `SET_LOCATION` (sets country/region + synced bonuses together), `REPLACE_STATE` (used by persistence load). All branches return new objects (immutable). Use `structuredClone` or spread for nested updates.

```ts
import type { AppState } from './types';
import { createHolding } from './blank';
import { getIndustry } from '../data/industries';
// ...Action union + reducer body. Every case returns a new AppState.
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/state/reducer.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit** (ask user first)

Proposed message: `feat: add typed app state, blanks, and reducer`

---

## Task 8: Persistence (v11 load/migrate + save) round-trip

**Files:**
- Create: `src/state/persistence.ts`
- Test: `src/state/persistence.test.ts`
- Source: `app.js:317-501` (`STORAGE_KEY`, `loadState`, `saveState`) — port the migration logic faithfully (same key, same clamps, same legacy fallbacks).

- [ ] **Step 1: Write the failing test `src/state/persistence.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEY, loadState, saveState } from './persistence';
import { initialState } from './blank';
import { reducer } from './reducer';

beforeEach(() => localStorage.clear());

describe('persistence', () => {
  it('returns initial state when nothing stored', () => {
    expect(loadState().activeModule).toBe('food');
  });

  it('round-trips a holding and factory counts', () => {
    let s = reducer(initialState(), { type: 'CREATE_HOLDING', name: 'Berlin' });
    s = reducer(s, { type: 'SET_FACTORY_CELL', module: 'food', kind: 'factory', quality: 7, field: 'companies', value: 3 });
    saveState(s);
    const loaded = loadState();
    expect(loaded.holdings[0].name).toBe('Berlin');
    expect(loaded.food[7]!.companies).toBe(3);
  });

  it('clamps companies > 9999 from stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ food: { 1: { companies: 50000, workers: 0 } } }));
    expect(loadState().food[1]!.companies).toBe(9999);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/persistence.test.ts`
Expected: FAIL — cannot resolve `./persistence`.

- [ ] **Step 3: Write `src/state/persistence.ts`** — `export const STORAGE_KEY = 'erep_calculator_food_factories_v11';`, `loadState(): AppState` (starts from `initialState()`, applies the same field-by-field migration as `app.js:320-491`, including legacy top-level→per-module fallbacks and holding rehydration), and `saveState(s: AppState): void` (try/catch around `localStorage.setItem`). Keep the same clamps (`Math.floor`, `Math.min(.,9999)`, workers ≤ companies*maxEmployees via `getIndustry`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/state/persistence.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `feat: port v11 localStorage load/migrate/save with round-trip tests`

---

## Task 9: Context + facade hooks

**Files:**
- Create: `src/state/StateContext.tsx`, `src/state/hooks.ts`
- Test: `src/state/hooks.test.tsx`

- [ ] **Step 1: Write `src/state/StateContext.tsx`** — provider wires `useReducer(reducer, undefined, loadState)`, persists via `useEffect(() => saveState(state), [state])`, exposes `{state, dispatch}` through context.

```tsx
import { createContext, useContext, useEffect, useReducer, type ReactNode, type Dispatch } from 'react';
import { reducer } from './reducer';
import type { Action } from './reducer';
import { loadState, saveState } from './persistence';
import type { AppState } from './types';

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => { saveState(state); }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used within StateProvider');
  return v;
}
```

- [ ] **Step 2: Write `src/state/hooks.ts`** — domain facades so components never touch dispatch directly. e.g. `useActiveModule()`, `useModule(key)`, `useIndustryView(key)` (calls `computeIndustryView` with the module's state), `useHoldings()`, `useSharedFlags()`, plus action hooks (`useSetFactoryCell()`, `useSwitchModule()`, …) that wrap `dispatch`.

```ts
import { useAppState } from './StateContext';
import { computeIndustryView } from '../calc/strategy';
import { getIndustry } from '../data/industries';
// ...export the facade hooks. Keep components dispatch-free.
```

- [ ] **Step 3: Write the failing test `src/state/hooks.test.tsx`** — render a tiny consumer in `StateProvider`, click an action hook, assert state changes.

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateProvider } from './StateContext';
import { useActiveModule, useSwitchModule } from './hooks';

function Probe() {
  const active = useActiveModule();
  const switchTo = useSwitchModule();
  return <button onClick={() => switchTo('weapons')}>active:{active}</button>;
}

describe('facade hooks', () => {
  it('useSwitchModule updates active module', async () => {
    render(<StateProvider><Probe /></StateProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('active:food');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('active:weapons');
  });
});
```

- [ ] **Step 4: Run test to verify it fails, then passes after implementing hooks**

Run: `npm test -- src/state/hooks.test.tsx`
Expected: first FAIL (missing exports), then PASS after Steps 1-2 complete.

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `feat: add state Context provider and domain facade hooks`

---

## Task 10: Shared presentational components

**Files:**
- Create: `src/components/Counter.tsx`, `src/components/IconImage.tsx`, `src/components/StarRating.tsx`
- Test: `src/components/Counter.test.tsx`
- Source: `app.js:504-514` (stars), `app.js:120` (icon w/ SVG fallback), counter button groups (`fwCounterGroupsHtml` etc.)

- [ ] **Step 1: Write the failing test `src/components/Counter.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('calls onChange with incremented/decremented value, clamped at 0', async () => {
    const onChange = vi.fn();
    render(<Counter label="Companies" value={0} max={9999} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onChange).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByRole('button', { name: '−' }));
    expect(onChange).toHaveBeenCalledWith(0); // already 0, stays 0
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Counter.test.tsx`
Expected: FAIL — cannot resolve `./Counter`.

- [ ] **Step 3: Implement the three components**

`Counter` (− / number input / +, clamps to `[0, max]`, calls `onChange(next)`), `IconImage` (`<img>` with `onError` swapping to an inline SVG fallback — port `gameIconHtml`), `StarRating` (renders `quality` star SVGs — port `generateStarsHtml`).

```tsx
// Counter.tsx
interface CounterProps { label: string; value: number; max: number; onChange: (v: number) => void; }
export function Counter({ label, value, max, onChange }: CounterProps) {
  const clamp = (v: number) => Math.max(0, Math.min(max, v));
  return (
    <div className="counter" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))}>−</button>
      <input type="number" value={value} min={0} max={max}
        onChange={(e) => onChange(clamp(parseInt(e.target.value || '0', 10)))} />
      <button type="button" onClick={() => onChange(clamp(value + 1))}>+</button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Counter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `feat: add shared Counter, IconImage, StarRating components`

---

## Task 11: IndustryView — Summary, Modifiers, Prices, grids

**Files:**
- Create: `src/views/IndustryView/IndustryView.tsx`, `SummarySidebar.tsx`, `ModifiersPanel.tsx`, `PricesPanel.tsx`, `FactoriesGrid.tsx`, `RmGrid.tsx`, `FactoryCard.tsx`
- Test: `src/views/IndustryView/IndustryView.test.tsx`
- Source: `app.js:945-1130` (render summary/strategy), `index.legacy.html:44-320` (markup + IDs)

- [ ] **Step 1: Write the failing integration test `src/views/IndustryView/IndustryView.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateProvider } from '../../state/StateContext';
import { IndustryView } from './IndustryView';

function setup() {
  return render(<StateProvider><IndustryView industryKey="food" /></StateProvider>);
}

describe('IndustryView (food)', () => {
  it('increments a Q1 factory and updates the net profit KPI', async () => {
    setup();
    const card = screen.getByTestId('factory-card-1');
    await userEvent.click(within(card).getByRole('button', { name: '+' }));
    // With default prices 0, net stays 0.00 but factory count reflects 1.
    expect(screen.getByTestId('total-factories-count')).toHaveTextContent('1');
  });

  it('shows Option A and Option B strategy cards', () => {
    setup();
    expect(screen.getByTestId('strategy-buy-card')).toBeInTheDocument();
    expect(screen.getByTestId('strategy-produce-card')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/IndustryView`
Expected: FAIL — cannot resolve `./IndustryView`.

- [ ] **Step 3: Implement the components**

- `IndustryView` reads `useIndustryView(industryKey)` and lays out Summary + Modifiers + Prices + FactoriesGrid + RmGrid. For `hired` industries (houses/aircraft) it hides WAM and the strategy panel, and uses `computeHiredIndustry`-derived totals (mirror legacy `renderHiredLaborModule`).
- `SummarySidebar` renders KPIs with `data-testid` matching legacy IDs (`total-net-profit`, `total-factories-count`, `total-gross-revenue`, `total-grain-cost`, `total-work-tax`, `total-salary`), the breakdown list, and the two strategy cards highlighting the chosen one (`useProduce`).
- `ModifiersPanel` binds country/region selects (from `src/data/travel`), read-only synced inputs, tycoon/WAM toggles, work-tax/salary/VAT; manual edits dispatch `SET_MODULE_FIELD` (clears location → "Manual").
- `PricesPanel` renders Q1–Q7 (or Q1–Q5) price inputs.
- `FactoriesGrid`/`RmGrid` map data rows → `FactoryCard` (icon, stars, per-card output, `Counter` for companies and, when not hired or WAM off, workers).

Display formatting must match legacy: CC `.toFixed(2)`, output `Math.round(...).toLocaleString()`, RM `.toFixed(2)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/views/IndustryView`
Expected: PASS.

- [ ] **Step 5: Render in App behind a tab bar and smoke-check in browser**

Update `src/App.tsx` to wrap in `StateProvider` and render a `TabBar` + the active view. Run `npm run dev` (with `node server.js` also running for `/proxy`), open `http://localhost:5173`, switch food/weapons/houses/aircraft tabs.

- [ ] **Step 6: Commit** (ask user first)

Proposed message: `feat: implement IndustryView (summary, modifiers, prices, grids)`

---

## Task 12: HoldingsView

**Files:**
- Create: `src/views/HoldingsView/HoldingsView.tsx`, `HoldingToolbar.tsx`, `HoldingSections.tsx`, `HoldingSummary.tsx`
- Test: `src/views/HoldingsView/HoldingsView.test.tsx`
- Source: `app.js:1538-1818` (`renderHoldings`, sections, summary, holding cell helpers)

- [ ] **Step 1: Write the failing integration test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateProvider } from '../../state/StateContext';
import { HoldingsView } from './HoldingsView';

describe('HoldingsView', () => {
  it('shows empty state, then creates a holding', async () => {
    render(<StateProvider><HoldingsView /></StateProvider>);
    expect(screen.getByText(/No holdings yet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    expect(screen.getByTestId('hld-content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/HoldingsView`
Expected: FAIL — cannot resolve `./HoldingsView`.

- [ ] **Step 3: Implement HoldingsView**

- `HoldingToolbar`: + New, rename, switch (dropdown over `state.holdings`), Clear All Companies (confirm), location selects + Sync.
- `HoldingSections`: for each of the four industries render its cards (reuse `FactoryCard`/`Counter`); per-industry productivity uses that holding-industry's own bonuses.
- `HoldingSummary`: combined KPIs via `computeHoldingIndustry` per industry + `sumHolding`; render `hld-net-profit`, `hld-total-companies`, `hld-revenue`, `hld-rm-net`, `hld-work-tax`, `hld-salary`, and the per-industry breakdown (`hld-breakdown`). Add a `computeHoldingIndustry` helper in `src/calc/holding.ts` that selects `computeFwIndustry`/`computeHiredIndustry` by industry type (port `app.js:1659-1681`).
- Preserve manual section collapse state across re-renders (legacy behavior, `app.js` commit 428dcc2) using local component state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/views/HoldingsView`
Expected: PASS.

- [ ] **Step 5: Commit** (ask user first)

Proposed message: `feat: implement HoldingsView (toolbar, sections, summary)`

---

## Task 13: Services — proxy, live prices, region scrapers (with fixtures)

**Files:**
- Create: `src/services/proxy.ts`, `src/services/livePrices.ts`, `src/services/regions.ts`
- Test: `src/services/livePrices.test.ts`, `src/services/regions.test.ts`
- Fixtures: `src/services/__fixtures__/country-economy.html`, `region.html`, `prices-food.json`
- Source: `app.js:628-944` (`getProxyUrl`, `loadRegionsForCountry`, `syncRegionModifiers`, `syncHoldingModifiers`), `app.js:2421-2700` (`syncLivePrices`, `syncAllPrices`)

- [ ] **Step 1: Capture fixtures** — save one real proxied response each: a country-economy HTML page, a region page, and a food price JSON. Trim to the parsed region.

Run (with `node server.js` up):
`curl -s 'http://localhost:8080/proxy?url=https://service.erepublik.tools/api/v1/market/item/0/1/1' > src/services/__fixtures__/prices-food.json`
Expected: a JSON file containing `info.misc`.

- [ ] **Step 2: Write the failing test `src/services/livePrices.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseFoodPrices } from './livePrices';
import fixture from './__fixtures__/prices-food.json';

describe('parseFoodPrices', () => {
  it('extracts Q1–Q7 prices from info.misc', () => {
    const prices = parseFoodPrices(fixture);
    expect(Object.keys(prices)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    for (let q = 1; q <= 7; q++) expect(typeof prices[q]).toBe('number');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/services/livePrices.test.ts`
Expected: FAIL — cannot resolve `./livePrices`.

- [ ] **Step 4: Implement services** — `proxy.ts` (`getProxyUrl(url)` → `/proxy?url=...`), `livePrices.ts` (`parseFoodPrices(json)`, `parseWeaponPrice(json)`, `fetchPrices(...)` using `getProxyUrl` + `fetch`), `regions.ts` (port the regex scrapers `countryProductivityBonuses`, `regionPollutionDetails`, work-tax/salary cells as **pure parse functions** `parseCountryEconomy(html)`, `parseRegion(html)` taking a string, plus thin fetchers). Keep the JSON-first-then-regex fallback structure.

- [ ] **Step 5: Write `src/services/regions.test.ts`** against the HTML fixtures, asserting the parsed bonus/pollution/tax numbers match what the page shows.

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCountryEconomy } from './regions';

const html = readFileSync(new URL('./__fixtures__/country-economy.html', import.meta.url), 'utf8');

describe('parseCountryEconomy', () => {
  it('extracts work tax and VAT', () => {
    const r = parseCountryEconomy(html);
    expect(typeof r.workTaxRate).toBe('number');
    expect(typeof r.vat).toBe('number');
  });
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- src/services`
Expected: PASS.

- [ ] **Step 7: Wire sync buttons** in `ModifiersPanel` / `HoldingToolbar` to call the fetchers and dispatch `SET_LOCATION` / price updates. Manually verify in browser that "Sync Live Prices" fills the price inputs.

- [ ] **Step 8: Commit** (ask user first)

Proposed message: `feat: port proxy, live-price and region-scraper services with fixture tests`

---

## Task 14: server.js serves dist/ + cutover

**Files:**
- Modify: `server.js` (serve `dist/` as static root; keep `/proxy` allowlist)
- Delete (at cutover): `app.js`, `holdingsCalc.mjs`, `holdingsCalc.test.mjs`, `index.legacy.html`
- Modify: `CLAUDE.md`, `README.md`, `.gitignore` (add `node_modules/`, `dist/`)
- Test: manual parity check

- [ ] **Step 1: Update `server.js`** to resolve static files from `dist/` (fallback to repo root only for `favicon.svg`/`styles.css` if referenced), keeping the existing `/proxy` GET allowlist (`www.erepublik.com`, `service.erepublik.tools`) and PORT 8080 untouched.

- [ ] **Step 2: Build and parity-check before deleting anything**

Run: `npm run build && node server.js`
Then open `http://localhost:8080` (React) and `http://localhost:8080/index.legacy.html` (old, temporarily copied into `dist/` or served from root). For 3 representative setups (e.g. all-food Q7×10 WAM-on tycoon; mixed holding; houses with hired workers), confirm headline net profit and KPIs match to the cent.

Expected: identical numbers. If any differ, STOP and fix the calc/strategy port (do not proceed to delete).

- [ ] **Step 3: Remove golden test's legacy import dependency** — once parity is verified and legacy files are about to be deleted, the `golden.test.ts` import of `../../holdingsCalc.mjs` will break. Replace the golden test's legacy import with a committed snapshot file `src/calc/__fixtures__/golden-snapshot.json` (generated from the legacy run) so the parity guard survives without the legacy source.

Run: `npm test`
Expected: PASS without referencing `holdingsCalc.mjs`.

- [ ] **Step 4: Delete legacy files**

Run: `git rm app.js holdingsCalc.mjs holdingsCalc.test.mjs index.legacy.html`
Expected: staged deletions.

- [ ] **Step 5: Update `.gitignore`** to add `node_modules/` and `dist/`.

- [ ] **Step 6: Update `CLAUDE.md`** — replace the "zero-dependency, no build step" architecture section with the React/Vite/TS reality: `npm run dev` / `npm run build` / `npm test`; `src/` layout; note `server.js` now serves `dist/`; record that the zero-build philosophy was intentionally dropped (ref this spec).

- [ ] **Step 7: Update `README.md`** Run/Features sections to match (build step, `npm` scripts).

- [ ] **Step 8: Full verification**

Run: `npm run build && npm test`
Expected: build clean, all tests pass.

- [ ] **Step 9: Manual smoke test** — `node server.js`, open `http://localhost:8080`, exercise every tab, create/rename/switch/clear a holding, sync prices, reload to confirm persistence survived.

- [ ] **Step 10: Commit** (ask user first)

Proposed message: `feat: serve React build from server.js; remove legacy vanilla app`

---

## Task 15: Merge

- [ ] **Step 1: Confirm clean state**

Run: `npm run build && npm test`
Expected: all green.

- [ ] **Step 2: Merge the branch** (ask user first — per project PR workflow, the user may prefer a PR)

Offer: open a PR (`gh pr create`) or fast-forward merge to `main`, per user preference.

---

## Self-Review Notes

- **Spec coverage:** §1 goal → Tasks 3-6 (math-first) + 14 (parity). §2 file structure → Tasks 1-13 create exactly those dirs. §3 state → Tasks 7-9. §4 component tree → Tasks 10-12. §5 services → Task 13. §6 dev/build/deploy → Tasks 1, 14. §7 sequence → task order matches. §8 testing → every task is TDD; golden parity in Task 6; persistence round-trip in Task 8; component integration in 11-12; service fixtures in 13. §9 risks → golden parity (6/14), fixtures (13), same key (8), scope frozen (no feature tasks), CLAUDE.md note (14.6).
- **Type consistency:** `IndustryResult` (Task 4) reused in Tasks 5/6/12. `Cell`/`Cells` (Task 4) used in 5/7/8. `computeIndustryView`/`IndustryView` names consistent across 5/9/11. `computeHoldingIndustry` introduced in Task 12 lives in `holding.ts` (Task 6 file).
- **Parity guard lifecycle:** Task 6 tests against live legacy `.mjs`; Task 14.3 swaps to a committed snapshot before legacy deletion so the guard persists.
