# Holdings Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 5th `🗂️ Holdings` mode where each named holding pins one location and holds a mix of companies across all four industries, showing the holding's combined daily profit with each industry computed from that region's industry-specific bonuses.

**Architecture:** Pure profit math is extracted into a new, DOM-free `holdingsCalc.mjs` (unit-tested with the built-in `node:test` runner, no package.json, no dependencies). The browser app imports that module. A separate `#holdings-view` container is shown/hidden against the existing `#industry-view`; the four existing industry tabs are left untouched. Holdings store only location + per-industry company counts + per-industry location modifiers; prices, tycoon, WAM and offered-salary stay global/shared.

**Tech Stack:** Vanilla ES module JS (browser), `node:test` + `node:assert/strict` for the math, no build step, no external deps.

**Reference spec:** `docs/superpowers/specs/2026-05-30-holdings-design.md`

**Conventions to honor (from CLAUDE.md):** no external dependencies; no build step; DOM access by hardcoded id; currency display `.toFixed(2)`; counts clamp 0–9999, workers ≤ companies × maxEmployees; `setupListeners()` is called at the end of every render so listeners rebind each cycle.

---

## File structure

- **Create `holdingsCalc.mjs`** — pure math: `roundNumber`, `gameRawProduction`, `productivityMultiplier`, `computeFwIndustry`, `computeHiredIndustry`, `sumHolding`. No DOM.
- **Create `holdingsCalc.test.mjs`** — `node:test` unit tests for the above.
- **Modify `server.js`** — add `.mjs` to the MIME table so the browser can import the module.
- **Modify `app.js`** — import the shared helpers from `holdingsCalc.mjs` (remove the inline duplicates); add holdings state + migration; the `HOLDING_INDUSTRIES` config; `renderHoldings()` + section/card/counter helpers; holding CRUD; `syncHoldingModifiers()` + `syncAllPrices()`; view toggle + tab wiring + listeners.
- **Modify `index.html`** — add the `tab-holdings` nav button; add `id="industry-view"` to the existing `<main>`; add the `#holdings-view` markup.
- **Modify `styles.css`** — add the holdings-view layout styles.

---

## Task 1: holdingsCalc.mjs — rounding + multiplier primitives

**Files:**
- Create: `holdingsCalc.mjs`
- Test: `holdingsCalc.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `holdingsCalc.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundNumber, gameRawProduction, productivityMultiplier } from './holdingsCalc.mjs';

test('roundNumber rounds to N decimals', () => {
    assert.equal(roundNumber(1.236, 2), 1.24);
    assert.equal(roundNumber(1.5, 0), 2);
});

test('gameRawProduction truncates the 3rd decimal (3.685 -> 3.68)', () => {
    assert.equal(gameRawProduction(3.685), 3.68);
});

test('productivityMultiplier sums bonuses and floors at 0', () => {
    assert.equal(productivityMultiplier({ countryBonus: 50, regionBonus: 20, hasTycoon: false, pollutionRate: 5 }), 1.65);
    assert.equal(productivityMultiplier({ countryBonus: 50, regionBonus: 20, hasTycoon: true, pollutionRate: 5 }), 1.85);
    assert.equal(productivityMultiplier({ countryBonus: 0, regionBonus: 0, hasTycoon: false, pollutionRate: 200 }), 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test holdingsCalc.test.mjs`
Expected: FAIL — cannot find module `./holdingsCalc.mjs` (file does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `holdingsCalc.mjs`:

```js
// holdingsCalc.mjs — pure profit math for the Holdings mode. No DOM access, so it is
// importable both by the browser (app.js) and by the node test runner (node --test).

// Standard round-to-N-decimals, identical to the game's roundNumber().
export function roundNumber(number, digits = 2) {
    const multiplier = Math.pow(10, digits);
    return Math.round(parseFloat(number) * multiplier) / multiplier;
}

// Raw-material production per company: the game rounds to 3 decimals then drops the
// 3rd decimal (floor to 2dp). e.g. 3.685 -> 3.68 (NOT 3.69).
export function gameRawProduction(value) {
    return Number(roundNumber(value, 3).toFixed(3).slice(0, -1));
}

// eRepublik productivity multiplier, floored at 0.
export function productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate }) {
    return Math.max(0, 1 + (countryBonus / 100) + (regionBonus / 100) + (hasTycoon ? 0.2 : 0) - (pollutionRate / 100));
}

// Quality-indexed pollution lookup (index 0 = raw-material rate); 0 if absent.
export function pollutionAt(qualityPollution, index) {
    return (qualityPollution && typeof qualityPollution[index] === 'number') ? qualityPollution[index] : 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test holdingsCalc.test.mjs`
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add holdingsCalc.mjs holdingsCalc.test.mjs
git commit -m "feat(holdings): pure rounding + productivity-multiplier helpers"
```

---

## Task 2: computeFwIndustry (food/weapons-style industry)

**Files:**
- Modify: `holdingsCalc.mjs`
- Test: `holdingsCalc.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `holdingsCalc.test.mjs`:

```js
import { computeFwIndustry } from './holdingsCalc.mjs';

test('computeFwIndustry: single Q1 food company, buys RM', () => {
    const r = computeFwIndustry({
        factoriesData: [{ quality: 1, baseOutput: 100, baseRM: 1, maxEmployees: 1 }],
        plantationsData: [],
        factoryCells: { 1: { companies: 1, workers: 0 } },
        plantationCells: {},
        countryBonus: 0, regionBonus: 0, qualityPollution: { 0: 0, 1: 0 }, vat: 1,
        prices: { 1: 1.00 }, rmPrice: 50,
        hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 1, averageSalary: 100
    });
    assert.equal(r.output, 100);
    assert.equal(r.rmConsumed, 1);
    assert.equal(r.rmProduced, 0);
    assert.equal(roundNumber(r.revenue, 2), 99);     // 100 * 1.00 * (1 - 0.01)
    assert.equal(roundNumber(r.rmNetCost, 2), 50);   // buy 1 RM @ 50
    assert.equal(roundNumber(r.workTax, 2), 1);      // 1 WAM session * 1% * 100
    assert.equal(r.salary, 0);
    assert.equal(roundNumber(r.net, 2), 48);         // 99 - 50 - 1 - 0
});

test('computeFwIndustry: surplus RM from a plantation is sold minus VAT', () => {
    const r = computeFwIndustry({
        factoriesData: [],
        plantationsData: [{ quality: 1, baseOutput: 100, maxEmployees: 0 }], // 100/100 = 1 unit/session
        factoryCells: {},
        plantationCells: { 1: { companies: 1, workers: 0 } },
        countryBonus: 0, regionBonus: 0, qualityPollution: { 0: 0 }, vat: 10,
        prices: {}, rmPrice: 50,
        hasTycoon: false, wamEnabled: true, offeredSalary: 0, workTaxRate: 0, averageSalary: 0
    });
    assert.equal(r.rmProduced, 1);
    assert.equal(r.netBalance, 1);
    assert.equal(roundNumber(r.rmNetCost, 2), -45); // sell: -(1 * 50 * 0.90) = -45 (negative cost = income)
    assert.equal(roundNumber(r.net, 2), 45);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test holdingsCalc.test.mjs`
Expected: FAIL — `computeFwIndustry` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `holdingsCalc.mjs`:

```js
// One food/weapons-style industry inside a holding (owner WAM + plantations).
// Returns { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net }.
export function computeFwIndustry(p) {
    const {
        factoriesData, plantationsData, factoryCells, plantationCells,
        countryBonus, regionBonus, qualityPollution, vat, prices, rmPrice,
        hasTycoon, wamEnabled, offeredSalary, workTaxRate, averageSalary
    } = p;

    let companies = 0, factoryWorkers = 0, wamSessions = 0;
    let output = 0, rmConsumed = 0, revenue = 0;

    for (const fact of factoriesData) {
        const cell = factoryCells[fact.quality] || { companies: 0, workers: 0 };
        const c = cell.companies || 0;
        const w = Math.min(cell.workers || 0, c * fact.maxEmployees);
        const sessions = (wamEnabled ? c : 0) + w;
        companies += c; factoryWorkers += w; wamSessions += (wamEnabled ? c : 0);

        const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fact.quality) });
        const singleOutput = roundNumber(fact.baseOutput * mult, 2);
        const singleRM = roundNumber(fact.baseRM * mult, 2);
        output += singleOutput * sessions;
        rmConsumed += singleRM * sessions;
        revenue += (singleOutput * sessions) * prices[fact.quality] * (1 - vat / 100);
    }

    let plantWorkers = 0, plantWamSessions = 0, rmProduced = 0;
    for (const plant of plantationsData) {
        const cell = plantationCells[plant.quality] || { companies: 0, workers: 0 };
        const c = cell.companies || 0;
        const w = Math.min(cell.workers || 0, c * plant.maxEmployees);
        const sessions = (wamEnabled ? c : 0) + w;
        companies += c; plantWorkers += w; plantWamSessions += (wamEnabled ? c : 0);

        const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
        const singleOutput = gameRawProduction((plant.baseOutput / 100) * mult);
        rmProduced += singleOutput * sessions;
    }

    output = roundNumber(output, 2);
    rmConsumed = roundNumber(rmConsumed, 2);
    rmProduced = roundNumber(rmProduced, 2);

    const netBalance = rmProduced - rmConsumed;
    const rmNetCost = netBalance < 0
        ? (-netBalance) * rmPrice
        : -(netBalance * rmPrice * (1 - vat / 100));

    const workTax = (wamSessions + plantWamSessions) * (workTaxRate / 100) * averageSalary;
    const salary = (factoryWorkers + plantWorkers) * offeredSalary;
    const net = revenue - rmNetCost - workTax - salary;

    return { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test holdingsCalc.test.mjs`
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add holdingsCalc.mjs holdingsCalc.test.mjs
git commit -m "feat(holdings): computeFwIndustry profit math"
```

---

## Task 3: computeHiredIndustry (houses/aircraft-style industry)

**Files:**
- Modify: `holdingsCalc.mjs`
- Test: `holdingsCalc.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `holdingsCalc.test.mjs`:

```js
import { computeHiredIndustry } from './holdingsCalc.mjs';

test('computeHiredIndustry: single Q1 house, 1 worker, buys HRM, no WAM/work-tax', () => {
    const r = computeHiredIndustry({
        factoriesData: [{ quality: 1, baseOutput: 1 / 5, baseRM: 2, maxEmployees: 1 }],
        rmData: [],
        factoryCells: { 1: { companies: 1, workers: 1 } },
        rmCells: {},
        countryBonus: 0, regionBonus: 0, qualityPollution: { 0: 0, 1: 0 }, vat: 1,
        prices: { 1: 29000 }, rmPrice: 1535,
        hasTycoon: false, offeredSalary: 10
    });
    assert.equal(roundNumber(r.output, 2), 0.20);
    assert.equal(r.rmConsumed, 2);
    assert.equal(r.workTax, 0);
    assert.equal(roundNumber(r.revenue, 2), 5742);   // 0.2 * 29000 * 0.99
    assert.equal(roundNumber(r.rmNetCost, 2), 3070); // buy 2 HRM @ 1535
    assert.equal(r.salary, 10);
    assert.equal(roundNumber(r.net, 2), 2662);       // 5742 - 3070 - 0 - 10
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test holdingsCalc.test.mjs`
Expected: FAIL — `computeHiredIndustry` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `holdingsCalc.mjs`:

```js
// One houses/aircraft-style industry inside a holding (no WAM; hired workers only).
// Same return shape as computeFwIndustry; workTax is always 0 (owner cannot be GM).
export function computeHiredIndustry(p) {
    const {
        factoriesData, rmData, factoryCells, rmCells,
        countryBonus, regionBonus, qualityPollution, vat, prices, rmPrice,
        hasTycoon, offeredSalary
    } = p;

    let companies = 0, factoryWorkers = 0;
    let output = 0, rmConsumed = 0, revenue = 0;

    for (const fac of factoriesData) {
        const cell = factoryCells[fac.quality] || { companies: 0, workers: 0 };
        const c = cell.companies || 0;
        const w = Math.min(cell.workers || 0, c * fac.maxEmployees);
        companies += c; factoryWorkers += w;

        const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fac.quality) });
        const singleOutput = fac.baseOutput * mult;
        output += singleOutput * w;
        rmConsumed += fac.baseRM * mult * w;
        revenue += (singleOutput * w) * prices[fac.quality] * (1 - vat / 100);
    }

    let rmWorkers = 0, rmProduced = 0;
    for (const rm of rmData) {
        const cell = rmCells[rm.quality] || { companies: 0, workers: 0 };
        const c = cell.companies || 0;
        const w = Math.min(cell.workers || 0, c * rm.maxEmployees);
        companies += c; rmWorkers += w;

        const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
        const singleOutput = (rm.baseOutput / 100) * mult;
        rmProduced += singleOutput * w;
    }

    const netBalance = rmProduced - rmConsumed;
    const rmNetCost = netBalance < 0
        ? (-netBalance) * rmPrice
        : -(netBalance * rmPrice * (1 - vat / 100));

    const salary = (factoryWorkers + rmWorkers) * offeredSalary;
    const workTax = 0;
    const net = revenue - rmNetCost - workTax - salary;

    return { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test holdingsCalc.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add holdingsCalc.mjs holdingsCalc.test.mjs
git commit -m "feat(holdings): computeHiredIndustry profit math"
```

---

## Task 4: sumHolding (aggregate per-industry results)

**Files:**
- Modify: `holdingsCalc.mjs`
- Test: `holdingsCalc.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `holdingsCalc.test.mjs`:

```js
import { sumHolding } from './holdingsCalc.mjs';

test('sumHolding aggregates totals and keeps a per-industry breakdown', () => {
    const sum = sumHolding([
        { key: 'food', label: 'Food', result: { net: 48, revenue: 99, rmNetCost: 50, workTax: 1, salary: 0, companies: 1 } },
        { key: 'weapons', label: 'Weapons', result: { net: 100, revenue: 200, rmNetCost: 80, workTax: 15, salary: 5, companies: 2 } }
    ]);
    assert.equal(sum.net, 148);
    assert.equal(sum.revenue, 299);
    assert.equal(sum.companies, 3);
    assert.equal(sum.perIndustry.length, 2);
    assert.equal(sum.perIndustry[0].key, 'food');
    assert.equal(sum.perIndustry[1].net, 100);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test holdingsCalc.test.mjs`
Expected: FAIL — `sumHolding` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `holdingsCalc.mjs`:

```js
// Sum per-industry results into holding totals.
// `results` is an array of { key, label, result } (result = a compute*Industry return value).
export function sumHolding(results) {
    const totals = { net: 0, revenue: 0, rmNetCost: 0, workTax: 0, salary: 0, companies: 0 };
    const perIndustry = [];
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

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test holdingsCalc.test.mjs`
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add holdingsCalc.mjs holdingsCalc.test.mjs
git commit -m "feat(holdings): sumHolding aggregation"
```

---

## Task 5: Wire shared helpers + `.mjs` MIME (no behavior change)

Make `app.js` import the rounding helpers from `holdingsCalc.mjs` (single source of truth) and let the server serve `.mjs`. The four existing tabs must behave EXACTLY as before.

**Files:**
- Modify: `server.js:15-25` (MIME table)
- Modify: `app.js:3` (imports) and `app.js:83-93` (remove inline `roundNumber`/`gameRawProduction`)

- [ ] **Step 1: Add `.mjs` MIME type**

In `server.js`, inside `MIME_TYPES`, add the `.mjs` entry next to `.js`:

```js
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};
```

- [ ] **Step 2: Import shared helpers into app.js**

In `app.js`, change the top import line (currently `import { countries } from './travelData.js';`) to also pull the helpers:

```js
import { countries } from './travelData.js';
import { roundNumber, gameRawProduction } from './holdingsCalc.mjs';
```

- [ ] **Step 3: Remove the now-duplicated inline helpers**

In `app.js`, delete the inline `roundNumber` and `gameRawProduction` definitions (the block under the comment `// --- eRepublik rounding helpers ...`, currently lines ~81–93). Leave the comment block referencing where they live, e.g.:

```js
// --- eRepublik rounding helpers live in holdingsCalc.mjs (roundNumber, gameRawProduction) ---
// They are imported at the top of this file so the Holdings math and the per-industry
// render() share one rounding implementation.
```

- [ ] **Step 4: Verify the existing app is unchanged (manual)**

Run: `node server.js`
Then in a browser at `http://localhost:8080`:
1. Open DevTools console — expect NO module/404 errors (confirms `holdingsCalc.mjs` loaded with correct MIME).
2. Food tab: set Q1 Food = 5 companies. Confirm Daily Output / Profit numbers are identical to before this change.
3. Switch to Weapons, Houses, Aircraft tabs — each renders without errors and numbers match prior behavior.

Stop the server (Ctrl-C) when done.

- [ ] **Step 5: Commit**

```bash
git add server.js app.js
git commit -m "refactor: share rounding helpers via holdingsCalc.mjs; serve .mjs"
```

---

## Task 6: Holdings state + load/save migration (v10 → v11)

**Files:**
- Modify: `app.js` — state object (~line 156), `STORAGE_KEY` (~line 259), `loadState()` (~line 262), and add holding factory helpers.

- [ ] **Step 1: Add holdings fields to the state object**

In `app.js`, add these fields to the top-level `state` object (alongside `activeModule`, `hasTycoon`, …):

```js
    holdings: [],            // Holding[]: each is one location + a mix of industries
    activeHoldingId: null,   // id of the selected holding, or null
    holdingSeq: 0,           // monotonic counter for stable holding ids (no Date.now)
```

- [ ] **Step 2: Add the blank-industry + createHolding helpers**

In `app.js`, after the `state` object and `activeLoc()` helper, add:

```js
// --- Holdings: builders & lookup -------------------------------------------------
function blankFwIndustry() {
    const ind = {};
    for (let q = 1; q <= 7; q++) ind[q] = { companies: 0, workers: 0 };
    ind.plantations = {};
    for (let q = 1; q <= 5; q++) ind.plantations[q] = { companies: 0, workers: 0 };
    ind.countryBonus = 100; ind.regionBonus = 0;
    ind.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    ind.vat = 1.0;
    return ind;
}

function blankHiredIndustry() {
    const ind = { factories: {}, rm: {} };
    for (let q = 1; q <= 5; q++) { ind.factories[q] = { companies: 0, workers: 0 }; ind.rm[q] = { companies: 0, workers: 0 }; }
    ind.countryBonus = 100; ind.regionBonus = 0;
    ind.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ind.vat = 1.0;
    return ind;
}

function createHolding(name) {
    state.holdingSeq = (state.holdingSeq || 0) + 1;
    return {
        id: "h" + state.holdingSeq,
        name: name,
        selectedCountryId: "", selectedRegionPermalink: "",
        workTaxRate: 1.0, averageSalary: 0.0,
        industries: {
            food: blankFwIndustry(), weapons: blankFwIndustry(),
            houses: blankHiredIndustry(), aircraft: blankHiredIndustry()
        }
    };
}

function activeHolding() {
    return state.holdings.find(h => h.id === state.activeHoldingId) || null;
}
```

- [ ] **Step 3: Bump the storage key**

In `app.js`, change:

```js
const STORAGE_KEY = "erep_calculator_food_factories_v11";
```

- [ ] **Step 4: Load holdings in loadState()**

In `app.js`, inside `loadState()` after the existing per-module load logic (just before the closing of the `if (stored)` block), add a holdings loader that validates/clamps each cell:

```js
            // --- Holdings (v11) ---
            if (typeof parsed.holdingSeq === 'number') state.holdingSeq = parsed.holdingSeq;
            if (typeof parsed.activeHoldingId === 'string') state.activeHoldingId = parsed.activeHoldingId;
            if (Array.isArray(parsed.holdings)) {
                const clampCell = (src, maxEmp) => {
                    let companies = (src && typeof src.companies === 'number') ? Math.max(0, Math.floor(src.companies)) : 0;
                    let workers = (src && typeof src.workers === 'number') ? Math.max(0, Math.floor(src.workers)) : 0;
                    companies = Math.min(companies, 9999);
                    if (workers > companies * maxEmp) workers = companies * maxEmp;
                    return { companies, workers };
                };
                const maxEmpOf = (data, q) => { const row = data.find(x => x.quality === q); return row ? (row.maxEmployees || 0) : 0; };
                state.holdings = parsed.holdings.map(ph => {
                    const h = createHolding(typeof ph.name === 'string' ? ph.name : 'Holding');
                    if (typeof ph.id === 'string') h.id = ph.id;
                    if (typeof ph.selectedCountryId === 'string' || typeof ph.selectedCountryId === 'number') h.selectedCountryId = String(ph.selectedCountryId);
                    if (typeof ph.selectedRegionPermalink === 'string') h.selectedRegionPermalink = ph.selectedRegionPermalink;
                    if (typeof ph.workTaxRate === 'number') h.workTaxRate = ph.workTaxRate;
                    if (typeof ph.averageSalary === 'number') h.averageSalary = ph.averageSalary;
                    const pind = (ph.industries && typeof ph.industries === 'object') ? ph.industries : {};
                    // food + weapons
                    [['food', foodFactoriesData, foodPlantationsData], ['weapons', weaponFactoriesData, weaponPlantationsData]].forEach(([key, facData, plantData]) => {
                        const src = pind[key]; if (!src || typeof src !== 'object') return;
                        for (let q = 1; q <= 7; q++) if (src[q]) h.industries[key][q] = clampCell(src[q], maxEmpOf(facData, q));
                        if (src.plantations) for (let q = 1; q <= 5; q++) if (src.plantations[q]) h.industries[key].plantations[q] = clampCell(src.plantations[q], maxEmpOf(plantData, q));
                        if (typeof src.countryBonus === 'number') h.industries[key].countryBonus = src.countryBonus;
                        if (typeof src.regionBonus === 'number') h.industries[key].regionBonus = src.regionBonus;
                        if (src.qualityPollution) for (let q = 0; q <= 7; q++) if (typeof src.qualityPollution[q] === 'number') h.industries[key].qualityPollution[q] = src.qualityPollution[q];
                        if (typeof src.vat === 'number') h.industries[key].vat = src.vat;
                    });
                    // houses + aircraft
                    [['houses', houseFactoriesData, houseRawMaterialsData], ['aircraft', aircraftFactoriesData, aircraftRawMaterialsData]].forEach(([key, facData, rmData]) => {
                        const src = pind[key]; if (!src || typeof src !== 'object') return;
                        if (src.factories) for (let q = 1; q <= 5; q++) if (src.factories[q]) h.industries[key].factories[q] = clampCell(src.factories[q], maxEmpOf(facData, q));
                        if (src.rm) for (let q = 1; q <= 5; q++) if (src.rm[q]) h.industries[key].rm[q] = clampCell(src.rm[q], maxEmpOf(rmData, q));
                        if (typeof src.countryBonus === 'number') h.industries[key].countryBonus = src.countryBonus;
                        if (typeof src.regionBonus === 'number') h.industries[key].regionBonus = src.regionBonus;
                        if (src.qualityPollution) for (let q = 0; q <= 5; q++) if (typeof src.qualityPollution[q] === 'number') h.industries[key].qualityPollution[q] = src.qualityPollution[q];
                        if (typeof src.vat === 'number') h.industries[key].vat = src.vat;
                    });
                    return h;
                });
                // createHolding bumped holdingSeq while rebuilding; restore the saved value.
                if (typeof parsed.holdingSeq === 'number') state.holdingSeq = parsed.holdingSeq;
            }
```

> Note: `saveState()` already serializes the whole `state` object via `JSON.stringify(state)`, so the new fields persist with no change. `activeModule` may now legitimately be `"holdings"`; the existing `if (typeof parsed.activeModule === 'string')` load already handles that.

- [ ] **Step 5: Verify migration (manual)**

Run: `node server.js`, open `http://localhost:8080`, DevTools console:
```js
// Existing v10 users have no holdings — should default cleanly:
JSON.parse(localStorage.getItem("erep_calculator_food_factories_v11"))
```
Expected: object with `holdings: []`, `activeHoldingId: null`, `holdingSeq: 0`; the four industry tabs still work. No console errors. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat(holdings): state model + v11 load/save migration"
```

---

## Task 7: Holdings markup + styles

**Files:**
- Modify: `index.html` (nav tab; `id` on existing `<main>`; new `#holdings-view`)
- Modify: `styles.css` (append holdings styles)

- [ ] **Step 1: Add the 5th nav tab**

In `index.html`, inside `.nav-container` (after the aircraft tab):

```html
            <button class="nav-tab" id="tab-aircraft">Aircraft Industry</button>
            <button class="nav-tab" id="tab-holdings">🗂️ Holdings</button>
```

- [ ] **Step 2: Give the existing industry view an id**

In `index.html`, change `<main class="app-container">` to:

```html
    <main class="app-container" id="industry-view">
```

- [ ] **Step 3: Add the holdings view markup**

In `index.html`, immediately AFTER the closing `</main>` of `#industry-view` and BEFORE `<footer …>`, add:

```html
    <main class="app-container" id="holdings-view" style="display:none;">
        <div class="holdings-toolbar">
            <div class="holdings-picker">
                <label class="control-label" for="hld-select">Holding</label>
                <select id="hld-select" class="market-input"></select>
            </div>
            <div class="holdings-actions">
                <button id="hld-new" class="btn btn-primary">+ New</button>
                <button id="hld-rename" class="btn btn-secondary">Rename</button>
                <button id="hld-delete" class="btn btn-secondary">Delete</button>
            </div>
        </div>

        <div id="hld-empty" class="holdings-empty">No holdings yet. Click <strong>+ New</strong> to create one.</div>

        <div id="hld-content" class="holdings-content" style="display:none;">
            <section class="holdings-workspace">
                <div class="card">
                    <div class="card-body holdings-location-bar">
                        <div class="control-group">
                            <label class="control-label" for="hld-country">Holding Country</label>
                            <select id="hld-country" class="market-input"><option value="">-- Select Country --</option></select>
                        </div>
                        <div class="control-group">
                            <label class="control-label" for="hld-region">Holding Region</label>
                            <select id="hld-region" class="market-input" disabled><option value="">-- Select Region --</option></select>
                        </div>
                        <div class="control-group toggle-container">
                            <span class="control-label">Tycoon (+20%)</span>
                            <label class="switch"><input type="checkbox" id="hld-tycoon"><span class="switch-slider"></span></label>
                        </div>
                        <div class="control-group toggle-container">
                            <span class="control-label">WAM</span>
                            <label class="switch"><input type="checkbox" id="hld-wam"><span class="switch-slider"></span></label>
                        </div>
                        <div class="control-group">
                            <label class="control-label" for="hld-offered-salary">Offered Salary (CC)</label>
                            <input type="number" id="hld-offered-salary" class="market-input" step="1" min="0" value="0.0">
                        </div>
                        <div class="control-group holdings-sync-col">
                            <span id="hld-sync-status" class="sync-status" style="font-size:11px;font-weight:600;color:var(--text-secondary);">Auto-sync: Not configured</span>
                            <button id="hld-sync-prices" class="btn btn-primary">Sync Live Prices</button>
                        </div>
                    </div>
                </div>
                <div id="hld-sections"></div>
            </section>

            <aside class="holdings-summary">
                <div class="card summary-card">
                    <div class="card-header"><h2>Holding Summary</h2></div>
                    <div class="card-body">
                        <div class="kpi-block">
                            <span class="kpi-label">Net Profit / day</span>
                            <span class="kpi-value" id="hld-net-profit">0.00 CC</span>
                        </div>
                        <hr class="kpi-divider">
                        <div class="kpi-block-inline"><span class="kpi-label">Total Companies</span><span class="kpi-value-small" id="hld-total-companies">0</span></div>
                        <div class="kpi-block"><span class="kpi-label">Daily Revenue</span><span class="kpi-value kpi-blue" id="hld-revenue">0.00 CC</span></div>
                        <div class="kpi-block"><span class="kpi-label">Raw Material (net)</span><span class="kpi-value kpi-gold" id="hld-rm-net">0.00 CC</span></div>
                        <div class="kpi-block"><span class="kpi-label">Work Tax</span><span class="kpi-value kpi-red" id="hld-work-tax">0.00 CC</span></div>
                        <div class="kpi-block"><span class="kpi-label">Salaries</span><span class="kpi-value kpi-red" id="hld-salary">0.00 CC</span></div>
                        <hr class="section-divider">
                        <h3 class="details-title">Per industry</h3>
                        <ul class="breakdown-list" id="hld-breakdown"></ul>
                        <p class="subtitle" style="margin-top:10px;font-size:11px;">Product &amp; raw-material prices are shared with the industry tabs. Use “Sync Live Prices” or edit them on those tabs.</p>
                    </div>
                </div>
            </aside>
        </div>
    </main>
```

- [ ] **Step 4: Add holdings styles**

Append to `styles.css`:

```css
/* --- Holdings mode --- */
#holdings-view { display: block; }
.holdings-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.holdings-picker { display: flex; flex-direction: column; gap: 4px; min-width: 220px; }
.holdings-actions { display: flex; gap: 8px; }
.holdings-empty { padding: 40px; text-align: center; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 10px; }
.holdings-content { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
.holdings-location-bar { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
.holdings-location-bar .control-group { min-width: 150px; }
.holdings-sync-col { display: flex; flex-direction: column; gap: 6px; }
.holdings-summary { position: sticky; top: 16px; }
.hld-section { border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 16px; overflow: hidden; background: var(--bg-card); }
.hld-section-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--bg-header); cursor: pointer; }
.hld-section-head .hld-ind-name { font-weight: 700; }
.hld-section-head .hld-ind-mods { margin-left: auto; font-size: 12px; color: var(--text-secondary); }
.hld-section-head .hld-ind-net { font-weight: 700; margin-left: 12px; }
.hld-section-head .hld-chev { color: var(--text-secondary); transition: transform .15s; }
.hld-section.collapsed .hld-section-body { display: none; }
.hld-section.collapsed .hld-chev { transform: rotate(-90deg); }
.hld-section-body { padding: 8px 10px; }
@media (max-width: 980px) { .holdings-content { grid-template-columns: 1fr; } .holdings-summary { position: static; } }
```

- [ ] **Step 5: Verify markup renders (manual)**

Run `node server.js`, open the app, click the `🗂️ Holdings` tab. (Nothing wires the tab yet — that is Task 8.) For now confirm the page still loads and the four industry tabs work. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "feat(holdings): holdings view markup + styles"
```

---

## Task 8: View toggle, tab wiring, holding CRUD & selector

**Files:**
- Modify: `app.js` — `setActiveTabHighlight()` (~line 494), `switchModule()` (~line 1608), `setupListeners()` (~line 1623); add `HOLDING_INDUSTRIES`, `renderHoldings()` skeleton, CRUD handlers.

- [ ] **Step 1: Add the HOLDING_INDUSTRIES config**

In `app.js`, near the other module configs (after `HIRED_LABOR_MODULES`), add:

```js
// Drives the Holdings view: which industries to render and how to compute each.
const HOLDING_INDUSTRIES = [
    { key: 'food',     label: 'Food',     icon: '🍞', type: 'fw',    isFood: true,  factoriesData: foodFactoriesData,     plantationsData: foodPlantationsData,     rmPriceField: 'frmPrice', rmNoun: 'FRM' },
    { key: 'weapons',  label: 'Weapons',  icon: '⚔️', type: 'fw',    isFood: false, factoriesData: weaponFactoriesData,   plantationsData: weaponPlantationsData,   rmPriceField: 'wrmPrice', rmNoun: 'WRM' },
    { key: 'houses',   label: 'Houses',   icon: '🏠', type: 'hired', factoriesData: houseFactoriesData,    rmData: houseRawMaterialsData,    factoryIconIndustry: 4,  rmBuildingIds: HRM_BUILDING_IDS, rmPriceField: 'hrmPrice', rmNoun: 'HRM' },
    { key: 'aircraft', label: 'Aircraft', icon: '✈️', type: 'hired', factoriesData: aircraftFactoriesData, rmData: aircraftRawMaterialsData, factoryIconIndustry: 23, rmBuildingIds: ARM_BUILDING_IDS, rmPriceField: 'armPrice', rmNoun: 'ARM' }
];
```

- [ ] **Step 2: Import the calc functions**

Extend the `holdingsCalc.mjs` import at the top of `app.js`:

```js
import { roundNumber, gameRawProduction, computeFwIndustry, computeHiredIndustry, sumHolding } from './holdingsCalc.mjs';
```

- [ ] **Step 3: Teach setActiveTabHighlight + render about holdings**

In `app.js`, update `setActiveTabHighlight()` to include the holdings tab:

```js
function setActiveTabHighlight(active) {
    [['food', 'tab-food'], ['weapons', 'tab-weapons'], ['houses', 'tab-houses'], ['aircraft', 'tab-aircraft'], ['holdings', 'tab-holdings']].forEach(([m, id]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', m === active);
    });
}
```

At the very TOP of `render()` (before the existing houses/aircraft early-return), add the holdings branch and the view toggle:

```js
function render() {
    const industryView = document.getElementById("industry-view");
    const holdingsView = document.getElementById("holdings-view");
    if (state.activeModule === "holdings") {
        if (industryView) industryView.style.display = "none";
        if (holdingsView) holdingsView.style.display = "";
        renderHoldings();
        return;
    }
    if (industryView) industryView.style.display = "";
    if (holdingsView) holdingsView.style.display = "none";
    // ... existing render() body continues unchanged ...
```

- [ ] **Step 4: Add renderHoldings() skeleton (selector + empty state + CRUD targets)**

In `app.js`, add (the section/summary rendering is filled in Tasks 9–10; here it wires the toolbar and shows/hides empty state):

```js
function renderHoldings() {
    setActiveTabHighlight("holdings");

    // Populate the holding picker
    const sel = document.getElementById("hld-select");
    if (sel) {
        sel.innerHTML = "";
        state.holdings.forEach(h => {
            const opt = document.createElement("option");
            opt.value = h.id; opt.textContent = h.name;
            sel.appendChild(opt);
        });
        if (state.activeHoldingId) sel.value = state.activeHoldingId;
    }

    const holding = activeHolding();
    const empty = document.getElementById("hld-empty");
    const content = document.getElementById("hld-content");
    if (!holding) {
        if (empty) empty.style.display = "";
        if (content) content.style.display = "none";
        setupListeners();
        return;
    }
    if (empty) empty.style.display = "none";
    if (content) content.style.display = "";

    // Shared global controls
    const tyc = document.getElementById("hld-tycoon"); if (tyc) tyc.checked = state.hasTycoon;
    const wam = document.getElementById("hld-wam"); if (wam) wam.checked = state.wamEnabled;
    const off = document.getElementById("hld-offered-salary"); if (off) off.value = state.offeredSalary.toFixed(2);
    const cty = document.getElementById("hld-country"); if (cty) cty.value = holding.selectedCountryId || "";
    const rgn = document.getElementById("hld-region"); if (rgn) rgn.value = holding.selectedRegionPermalink || "";

    const syncStatus = document.getElementById("hld-sync-status");
    if (syncStatus) {
        if (holding.selectedCountryId && holding.selectedRegionPermalink) {
            syncStatus.textContent = "Auto-sync: Synced";
            syncStatus.style.color = "var(--erep-green, #7ab700)";
        } else if (holding.selectedCountryId) {
            syncStatus.textContent = "Auto-sync: Region not selected";
            syncStatus.style.color = "var(--text-secondary)";
        } else {
            syncStatus.textContent = "Auto-sync: Not configured";
            syncStatus.style.color = "var(--text-secondary)";
        }
    }

    renderHoldingSections(holding);   // Task 9
    renderHoldingSummary(holding);    // Task 10

    setupListeners();
}
```

- [ ] **Step 5: Add a holdings country dropdown populator**

In `app.js`, add (mirrors `populateCountriesDropdown` but targets the holdings select):

```js
function populateHoldingCountriesDropdown() {
    const sel = document.getElementById("hld-country");
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select Country --</option>';
    Object.values(countries).sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id; opt.textContent = c.name;
        sel.appendChild(opt);
    });
}
```

Call it once during bootstrap. In the `DOMContentLoaded` handler (~line 2053), add after `populateCountriesDropdown();`:

```js
    populateHoldingCountriesDropdown();
```

- [ ] **Step 6: Add stub render functions (so the skeleton runs before Tasks 9–10)**

In `app.js`, add temporary no-op stubs (replaced in Tasks 9–10):

```js
function renderHoldingSections(holding) { /* filled in Task 9 */ }
function renderHoldingSummary(holding) { /* filled in Task 10 */ }
```

- [ ] **Step 7: Wire the holdings tab + CRUD in setupListeners()**

In `app.js` `setupListeners()`, after the existing `tab-aircraft` wiring, add:

```js
    const tabHoldings = document.getElementById("tab-holdings");
    if (tabHoldings) tabHoldings.onclick = () => switchModule("holdings");

    // Holding picker
    const hldSelect = document.getElementById("hld-select");
    if (hldSelect) hldSelect.onchange = function () { state.activeHoldingId = this.value; saveState(); render(); };

    // + New
    const hldNew = document.getElementById("hld-new");
    if (hldNew) hldNew.onclick = function () {
        const name = (prompt("New holding name:", "Holding " + (state.holdings.length + 1)) || "").trim();
        if (!name) return;
        const h = createHolding(name);
        state.holdings.push(h);
        state.activeHoldingId = h.id;
        saveState();
        render();
    };

    // Rename
    const hldRename = document.getElementById("hld-rename");
    if (hldRename) hldRename.onclick = function () {
        const h = activeHolding(); if (!h) return;
        const name = (prompt("Rename holding:", h.name) || "").trim();
        if (!name) return;
        h.name = name; saveState(); render();
    };

    // Delete
    const hldDelete = document.getElementById("hld-delete");
    if (hldDelete) hldDelete.onclick = function () {
        const h = activeHolding(); if (!h) return;
        if (!confirm(`Delete holding "${h.name}"? This cannot be undone.`)) return;
        state.holdings = state.holdings.filter(x => x.id !== h.id);
        state.activeHoldingId = state.holdings.length ? state.holdings[0].id : null;
        saveState(); render();
    };

    // Shared global toggles/inputs (also affect the industry tabs — intentional)
    const hldTycoon = document.getElementById("hld-tycoon");
    if (hldTycoon) hldTycoon.onchange = function () { state.hasTycoon = this.checked; saveState(); render(); };
    const hldWam = document.getElementById("hld-wam");
    if (hldWam) hldWam.onchange = function () { state.wamEnabled = this.checked; saveState(); render(); };
    const hldOffered = document.getElementById("hld-offered-salary");
    if (hldOffered) {
        hldOffered.onchange = function () { let v = parseFloat(this.value); if (isNaN(v) || v < 0) v = 0; state.offeredSalary = v; saveState(); render(); };
        hldOffered.onkeydown = function (e) { if (e.key === "Enter") this.blur(); };
    }
```

- [ ] **Step 8: Verify the toggle, tab, and CRUD (manual)**

Run `node server.js`, open the app:
1. Click `🗂️ Holdings` → industry view hides, holdings view shows the empty state.
2. Click `+ New`, name it "Mixed" → empty state disappears; picker shows "Mixed"; location bar + (empty) sections area + summary render with no console errors.
3. Click `Rename` → name updates in the picker. Reload the page → "Mixed" persists.
4. Switch to the Food tab and back → state preserved; Food tab still works.
5. Click `Delete` → confirm → holding removed, empty state returns.

Stop the server.

- [ ] **Step 9: Commit**

```bash
git add app.js
git commit -m "feat(holdings): view toggle, tab wiring, holding CRUD"
```

---

## Task 9: Render industry sections + holding counters

**Files:**
- Modify: `app.js` — replace the `renderHoldingSections` stub; add counter helpers + listeners.

- [ ] **Step 1: Add holding cell/counter helpers**

In `app.js`, add:

```js
// Resolve the {companies,workers} cell for a holding industry counter.
function getHoldingCell(holding, industry, kind, quality) {
    const ind = holding.industries[industry];
    if (kind === 'factory') return ind.factories ? ind.factories[quality] : ind[quality];
    if (kind === 'plantation') return ind.plantations[quality];
    if (kind === 'rm') return ind.rm[quality];
    return null;
}

function holdingMaxEmployees(industry, kind, quality) {
    const cfg = HOLDING_INDUSTRIES.find(c => c.key === industry);
    let data;
    if (kind === 'factory') data = cfg.factoriesData;
    else if (kind === 'plantation') data = cfg.plantationsData;
    else data = cfg.rmData;
    const row = data.find(x => String(x.quality) === String(quality));
    return row ? (row.maxEmployees || 0) : 0;
}

function applyHoldingCounterChange(industry, kind, field, quality, value) {
    const h = activeHolding(); if (!h) return;
    const cell = getHoldingCell(h, industry, kind, quality); if (!cell) return;
    const maxEmp = holdingMaxEmployees(industry, kind, quality);
    if (field === 'companies') {
        cell.companies = Math.max(0, Math.min(value, 9999));
        const cap = cell.companies * maxEmp;
        if (cell.workers > cap) cell.workers = cap;
    } else {
        const cap = (cell.companies || 0) * maxEmp;
        cell.workers = Math.max(0, Math.min(value, cap));
    }
}

// Stacked Companies/Workers counter rows for a holding card.
function hldCounterGroupsHtml(industry, kind, quality, companies, workers, maxWorkers, hideWorkers) {
    const row = (field, value, label, hint) => `
        <div class="house-counter-row">
            <span class="house-counter-label">${label}${hint}</span>
            <div class="counter-group counter-group-sm">
                <button class="btn-counter hld-counter-btn" data-industry="${industry}" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="-1">-</button>
                <input type="text" class="counter-input hld-counter-input" data-industry="${industry}" data-kind="${kind}" data-field="${field}" data-quality="${quality}" value="${value}" inputmode="numeric" pattern="[0-9]*">
                <button class="btn-counter hld-counter-btn" data-industry="${industry}" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="1">+</button>
            </div>
        </div>`;
    let html = `<div class="house-counters">` + row('companies', companies, 'Companies', '');
    if (!hideWorkers) html += row('workers', workers, 'Workers', ` <span class="max-hint">· max ${maxWorkers}</span>`);
    return html + `</div>`;
}

// One compact holding card (icon + title/stars/mods + daily output + counters).
function hldCardHtml(iconHtml, title, quality, pollutionRate, outputText, counterHtml, borderColor) {
    return `<div class="factory-row-card" style="border-left:3px solid ${borderColor};">
        <div class="factory-avatar-area">${iconHtml}</div>
        <div class="factory-info-area">
            <div class="factory-title">${title}</div>
            <div class="stars-container">${generateStarsHtml(quality)}</div>
            <div class="factory-pollution" style="font-size:11px;margin-top:4px;color:${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'};font-weight:500;">Pollution: ${pollutionRate.toFixed(2)}%</div>
        </div>
        <div class="factory-stats-area">
            <div class="stat-item">
                <span class="stat-label">Daily Output</span>
                <span class="stat-value" style="color: var(--erep-blue);">${outputText}</span>
            </div>
        </div>
        <div class="factory-action-area">${counterHtml}</div>
    </div>`;
}
```

- [ ] **Step 2: Implement renderHoldingSections**

In `app.js`, replace the `renderHoldingSections` stub with:

```js
function renderHoldingSections(holding) {
    const container = document.getElementById("hld-sections");
    if (!container) return;
    container.innerHTML = "";

    HOLDING_INDUSTRIES.forEach(cfg => {
        const ind = holding.industries[cfg.key];
        const result = computeHoldingIndustry(holding, cfg);   // defined in Task 10
        const pollAt = (i) => (typeof ind.qualityPollution[i] === 'number' ? ind.qualityPollution[i] : 0);

        let bodyHtml = "";
        if (cfg.type === 'fw') {
            cfg.factoriesData.forEach(fact => {
                const cell = ind[fact.quality] || { companies: 0, workers: 0 };
                const maxW = (cell.companies || 0) * fact.maxEmployees;
                const w = Math.min(cell.workers || 0, maxW);
                const mult = Math.max(0, 1 + ind.countryBonus / 100 + ind.regionBonus / 100 + (state.hasTycoon ? 0.2 : 0) - pollAt(fact.quality) / 100);
                const sessions = (state.wamEnabled ? (cell.companies || 0) : 0) + w;
                const out = roundNumber(fact.baseOutput * mult, 2) * sessions;
                const icon = gameIconHtml(factoryIconUrl(cfg.isFood, fact.quality), "");
                bodyHtml += hldCardHtml(icon, fact.name, fact.quality, pollAt(fact.quality),
                    `${out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} items`,
                    hldCounterGroupsHtml(cfg.key, 'factory', fact.quality, cell.companies || 0, w, maxW, false),
                    cfg.isFood ? 'var(--erep-blue)' : '#7f8c8d');
            });
            cfg.plantationsData.forEach(plant => {
                const cell = ind.plantations[plant.quality] || { companies: 0, workers: 0 };
                const maxW = (cell.companies || 0) * plant.maxEmployees;
                const w = Math.min(cell.workers || 0, maxW);
                const mult = Math.max(0, 1 + ind.countryBonus / 100 + ind.regionBonus / 100 + (state.hasTycoon ? 0.2 : 0) - pollAt(0) / 100);
                const sessions = (state.wamEnabled ? (cell.companies || 0) : 0) + w;
                const out = gameRawProduction((plant.baseOutput / 100) * mult) * sessions;
                const icon = gameIconHtml(plantationIconUrl(cfg.isFood, plant.quality), "");
                bodyHtml += hldCardHtml(icon, plant.name, plant.quality, pollAt(0),
                    `${out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.rmNoun}`,
                    hldCounterGroupsHtml(cfg.key, 'plantation', plant.quality, cell.companies || 0, w, maxW, plant.maxEmployees === 0),
                    cfg.isFood ? '#e67e22' : '#7f8c8d');
            });
        } else {
            cfg.factoriesData.forEach(fac => {
                const cell = ind.factories[fac.quality] || { companies: 0, workers: 0 };
                const maxW = (cell.companies || 0) * fac.maxEmployees;
                const w = Math.min(cell.workers || 0, maxW);
                const mult = Math.max(0, 1 + ind.countryBonus / 100 + ind.regionBonus / 100 + (state.hasTycoon ? 0.2 : 0) - pollAt(fac.quality) / 100);
                const out = fac.baseOutput * mult * w;
                const icon = gameIconHtml(`${EREP_CDN}/icons/industry/${cfg.factoryIconIndustry}/q${fac.quality}.png`, "");
                bodyHtml += hldCardHtml(icon, fac.name, fac.quality, pollAt(fac.quality),
                    `${out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} items`,
                    hldCounterGroupsHtml(cfg.key, 'factory', fac.quality, cell.companies || 0, w, maxW, false),
                    'var(--erep-blue)');
            });
            cfg.rmData.forEach(rm => {
                const cell = ind.rm[rm.quality] || { companies: 0, workers: 0 };
                const maxW = (cell.companies || 0) * rm.maxEmployees;
                const w = Math.min(cell.workers || 0, maxW);
                const mult = Math.max(0, 1 + ind.countryBonus / 100 + ind.regionBonus / 100 + (state.hasTycoon ? 0.2 : 0) - pollAt(0) / 100);
                const out = (rm.baseOutput / 100) * mult * w;
                const icon = gameIconHtml(`${EREP_CDN}/buildings/${cfg.rmBuildingIds[rm.quality]}.png`, "");
                bodyHtml += hldCardHtml(icon, rm.name, rm.quality, pollAt(0),
                    `${out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.rmNoun}`,
                    hldCounterGroupsHtml(cfg.key, 'rm', rm.quality, cell.companies || 0, w, maxW, false),
                    '#78909c');
            });
        }

        const collapsed = result.companies === 0 ? " collapsed" : "";
        const netClass = result.net >= 0 ? "text-success" : "text-danger";
        const section = document.createElement("div");
        section.className = "hld-section" + collapsed;
        section.innerHTML = `
            <div class="hld-section-head">
                <span style="font-size:18px;">${cfg.icon}</span>
                <span class="hld-ind-name">${cfg.label}</span>
                <span class="hld-ind-mods">Country +${ind.countryBonus}% · Region +${ind.regionBonus}% · Pollution ${pollAt(1).toFixed(2)}%</span>
                <span class="hld-ind-net ${netClass}">${result.net >= 0 ? '+' : ''}${result.net.toFixed(2)} CC</span>
                <span class="hld-chev">▾</span>
            </div>
            <div class="hld-section-body">${bodyHtml}</div>`;
        section.querySelector(".hld-section-head").onclick = () => section.classList.toggle("collapsed");
        container.appendChild(section);
    });
}
```

> Note: `gameIconHtml(url, "")` is called with an empty fallback — if the CDN image fails the `<img>` simply shows no glyph, which is acceptable here (the title + stars identify the row). The industry tabs keep their richer SVG fallbacks.

- [ ] **Step 3: Bind holding counters in setupListeners()**

In `app.js` `setupListeners()`, after the holdings CRUD wiring, add:

```js
    document.querySelectorAll(".hld-counter-btn").forEach(btn => {
        btn.onclick = function () {
            const industry = this.getAttribute("data-industry");
            const kind = this.getAttribute("data-kind");
            const field = this.getAttribute("data-field");
            const q = this.getAttribute("data-quality");
            const delta = parseInt(this.getAttribute("data-delta"), 10);
            const cell = getHoldingCell(activeHolding(), industry, kind, q);
            const current = (cell && cell[field]) || 0;
            applyHoldingCounterChange(industry, kind, field, q, current + delta);
            saveState();
            render();
        };
    });
    document.querySelectorAll(".hld-counter-input").forEach(input => {
        input.oninput = function () {
            const valStr = this.value.replace(/[^0-9]/g, '');
            this.value = valStr;
            let val = parseInt(valStr, 10);
            if (isNaN(val)) val = 0;
            applyHoldingCounterChange(this.getAttribute("data-industry"), this.getAttribute("data-kind"), this.getAttribute("data-field"), this.getAttribute("data-quality"), val);
        };
        input.onblur = function () { if (this.value === "") this.value = "0"; saveState(); render(); };
        input.onkeydown = function (e) { if (e.key === "Enter") this.blur(); };
    });
```

- [ ] **Step 4: Verify sections + counters (manual)**

Run `node server.js`, open the app, Holdings tab, select "Mixed":
1. All four industry sections render; with no companies they are collapsed. Click a header to expand.
2. In Food, set Q5 Companies = 3 → the Food section stays expanded, Daily Output appears, and the per-section net updates.
3. The `+`/`−` buttons and typing into the inputs both update counts; workers clamp to companies × max.
4. Reload → counts persist on "Mixed".

(The summary panel still shows zeros until Task 10.) Stop the server.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat(holdings): render industry sections + counters"
```

---

## Task 10: Holding summary computation

**Files:**
- Modify: `app.js` — add `computeHoldingIndustry`; replace `renderHoldingSummary` stub.

- [ ] **Step 1: Add the per-industry compute adapter**

In `app.js`, add (this maps holding state → the pure `holdingsCalc` functions; it is the single source the sections and summary both call):

```js
// Compute one industry of a holding via the pure holdingsCalc functions.
function computeHoldingIndustry(holding, cfg) {
    const ind = holding.industries[cfg.key];
    if (cfg.type === 'fw') {
        return computeFwIndustry({
            factoriesData: cfg.factoriesData, plantationsData: cfg.plantationsData,
            factoryCells: ind, plantationCells: ind.plantations,
            countryBonus: ind.countryBonus, regionBonus: ind.regionBonus,
            qualityPollution: ind.qualityPollution, vat: ind.vat,
            prices: state[cfg.key].prices, rmPrice: state[cfg.rmPriceField],
            hasTycoon: state.hasTycoon, wamEnabled: state.wamEnabled,
            offeredSalary: state.offeredSalary,
            workTaxRate: holding.workTaxRate, averageSalary: holding.averageSalary
        });
    }
    return computeHiredIndustry({
        factoriesData: cfg.factoriesData, rmData: cfg.rmData,
        factoryCells: ind.factories, rmCells: ind.rm,
        countryBonus: ind.countryBonus, regionBonus: ind.regionBonus,
        qualityPollution: ind.qualityPollution, vat: ind.vat,
        prices: state[cfg.key].prices, rmPrice: state[cfg.rmPriceField],
        hasTycoon: state.hasTycoon, offeredSalary: state.offeredSalary
    });
}
```

- [ ] **Step 2: Implement renderHoldingSummary**

In `app.js`, replace the `renderHoldingSummary` stub with:

```js
function renderHoldingSummary(holding) {
    const results = HOLDING_INDUSTRIES.map(cfg => ({
        key: cfg.key, label: cfg.label, result: computeHoldingIndustry(holding, cfg)
    }));
    const sum = sumHolding(results);

    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    const setSigned = (id, val, suffix = " CC") => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = `${val.toFixed(2)}${suffix}`;
        el.classList.remove("text-success", "text-danger");
        el.classList.add(val >= 0 ? "text-success" : "text-danger");
    };

    setSigned("hld-net-profit", sum.net);
    setText("hld-total-companies", String(sum.companies));
    setText("hld-revenue", `${sum.revenue.toFixed(2)} CC`);
    // rmNetCost > 0 means we BUY (a cost); < 0 means net income from selling surplus.
    const rmNet = document.getElementById("hld-rm-net");
    if (rmNet) {
        rmNet.textContent = `${sum.rmNetCost.toFixed(2)} CC`;
        rmNet.className = "kpi-value " + (sum.rmNetCost <= 0 ? "text-success" : "kpi-gold");
    }
    setText("hld-work-tax", `-${sum.workTax.toFixed(2)} CC`);
    setText("hld-salary", `-${sum.salary.toFixed(2)} CC`);

    const list = document.getElementById("hld-breakdown");
    if (list) {
        const rows = sum.perIndustry.filter(p => p.companies > 0);
        list.innerHTML = rows.length ? rows.map(p => {
            const cfg = HOLDING_INDUSTRIES.find(c => c.key === p.key);
            const cls = p.net >= 0 ? "text-success" : "text-danger";
            return `<li class="breakdown-item">
                <span class="breakdown-label">${cfg.icon} ${p.label} (${p.companies}c)</span>
                <span class="breakdown-count ${cls}" style="font-weight:700;">${p.net >= 0 ? '+' : ''}${p.net.toFixed(2)} CC</span>
            </li>`;
        }).join("") : `<li class="info-text" style="text-align:center;font-style:italic;">No companies in this holding yet.</li>`;
    }
}
```

- [ ] **Step 3: Verify the summary (manual, with a hand-checked number)**

Run `node server.js`, open the app, Holdings → "Mixed". Set a known, simple config and confirm against the unit-tested math:
1. Set the holding's **Offered Salary** = 0 and **WAM** ON; leave country unset (so countryBonus stays 100, regionBonus 0, pollution 0, VAT 1, workTax 1, avgSalary 0).
2. On the **Food industry tab**, ensure Q1 Food price = 0.80 (default). Return to Holdings.
3. In the holding's Food section set **Q1 Food Companies = 1**, Workers 0.
   - multiplier = 1 + 100/100 = 2.0; singleOutput = round(100×2)=200; output 200.
   - revenue = 200 × 0.80 × (1 − 0.01) = 158.40.
   - RM consumed = round(1×2)=2 → buy 2 FRM @ 50 = 100.00.
   - workTax = 1 session × (1/100 × 0) = 0; salary = 0.
   - Food net = 158.40 − 100.00 = **58.40 CC**.
4. Confirm the Food section header net and the summary "Net Profit / day" both show **+58.40 CC**, Total Companies = 1, Daily Revenue 158.40 CC, Raw Material (net) 100.00 CC.

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat(holdings): holding summary + per-industry compute adapter"
```

---

## Task 11: Holding location auto-sync (all industries in one pass)

**Files:**
- Modify: `app.js` — generalize `loadRegionsForCountry`; add `syncHoldingModifiers()` + `syncAllPrices()`; wire the holding location/sync controls; bootstrap region load.

- [ ] **Step 1: Generalize loadRegionsForCountry to accept a target select**

In `app.js`, change the `loadRegionsForCountry` signature and the two element references so it can fill either the industry or the holdings region dropdown:

```js
async function loadRegionsForCountry(countryId, selectedPermalink = "", regionSelect = document.getElementById("select-region")) {
    if (!regionSelect) return;
    // ... existing body unchanged, but every later reference to the region <select>
    //     uses the `regionSelect` parameter instead of re-querying "select-region" ...
}
```

(Only the element acquisition changes; the parsing logic is identical.)

- [ ] **Step 2: Add syncHoldingModifiers() — fill all four industries from one fetch**

In `app.js`, add:

```js
// Fetch the holding's country-economy + region pages ONCE and populate the location
// modifiers for ALL FOUR industries of the active holding.
async function syncHoldingModifiers() {
    const holding = activeHolding();
    if (!holding || !holding.selectedCountryId || !holding.selectedRegionPermalink) return;
    const country = countries[holding.selectedCountryId];
    if (!country) return;

    const status = document.getElementById("hld-sync-status");
    if (status) { status.textContent = "Auto-sync: Syncing…"; status.style.color = "var(--erep-gold, #ff9f00)"; }

    // industryId, byToken key, region resource-id set, pollution quality range.
    const cfgs = {
        food:     { id: "1",  token: "FOOD",     resources: [1, 2, 3, 4, 5],      maxQ: 7, label: "Food" },
        weapons:  { id: "2",  token: "WEAPON",   resources: [6, 7, 8, 9, 10],     maxQ: 7, label: "Weapons" },
        houses:   { id: "4",  token: "HOUSE",    resources: [11, 12, 13, 14, 15], maxQ: 5, label: "House" },
        aircraft: { id: "23", token: "AIRCRAFT", resources: [16, 17, 18, 19, 20], maxQ: 5, label: "Aircraft Weapons" }
    };

    try {
        const countryUrl = `https://www.erepublik.com/en/country/economy/${country.permalink}`;
        const regionUrl = `https://www.erepublik.com/en/main/region/${holding.selectedRegionPermalink}`;
        const [countryRes, regionRes] = await Promise.all([fetch(getProxyUrl(countryUrl)), fetch(getProxyUrl(regionUrl))]);
        if (!countryRes.ok || !regionRes.ok) throw new Error("eRepublik server error");
        const countryHtml = await countryRes.text();
        const regionHtml = await regionRes.text();

        // Parse the country-wide productivity-bonus JSON once.
        let bonuses = null;
        const m = countryHtml.match(/var\s+countryProductivityBonuses\s*=\s*([^\n;<]+)/);
        if (m) { try { bonuses = JSON.parse(m[1]); } catch (e) { bonuses = null; } }

        // Parse the region pollution JSON once.
        let pollutionDetails = null;
        const pm = regionHtml.match(/var\s+regionPollutionDetails\s*=\s*([^\n;]+)/);
        if (pm) { try { pollutionDetails = JSON.parse(pm[1]); } catch (e) { pollutionDetails = null; } }

        // Work tax (country-wide; read once off the Food row).
        let workTax = 1.0;
        const wt = countryHtml.match(/Food<\/span>\s*<\/td>\s*<\s*td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)%/i);
        if (wt) workTax = parseFloat(wt[1]) || 0;
        let avgSalary = 0;
        const sal = countryHtml.match(/Average<\/span>\s*<\/td>\s*<\s*td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)/i);
        if (sal) avgSalary = parseFloat(sal[1]) || 0;
        holding.workTaxRate = workTax;
        holding.averageSalary = avgSalary;

        Object.entries(cfgs).forEach(([key, c]) => {
            const ind = holding.industries[key];

            // Country bonus
            let countryBonus = 100;
            if (bonuses) {
                if (bonuses.byToken && typeof bonuses.byToken[c.token] === 'number') countryBonus = bonuses.byToken[c.token];
                else if (bonuses.byId && typeof bonuses.byId[c.id] === 'number') countryBonus = bonuses.byId[c.id];
            } else {
                const hm = new RegExp(`data-industryId="${c.id}"\\s+data-bonus="(\\d+)"`).exec(countryHtml);
                if (hm) countryBonus = parseInt(hm[1], 10);
            }
            ind.countryBonus = countryBonus;

            // Region resource bonus (sum of this industry's resources present in the region)
            let regionBonus = 0;
            const resRegex = new RegExp(`data-resourceId="(${c.resources.join('|')})"\\s+data-bonus="(\\d+)"`, 'g');
            let rmatch;
            while ((rmatch = resRegex.exec(regionHtml)) !== null) regionBonus += parseInt(rmatch[2], 10);
            ind.regionBonus = regionBonus;

            // Pollution per quality
            const qp = {};
            for (let q = 0; q <= c.maxQ; q++) qp[q] = 0;
            if (pollutionDetails) {
                const raw = pollutionDetails[c.id] || [];
                for (let q = 0; q <= c.maxQ; q++) {
                    if (raw[q] && raw[q].pollution && raw[q].pollution !== "N/A") qp[q] = parseFloat(raw[q].pollution) || 0;
                }
            }
            ind.qualityPollution = qp;

            // VAT (per industry)
            const vatRegexStr = 'fakeheight">' + c.label + '<\\/span><\\/td>\\s*<td[^>]*>\\s*<span[^>]*>[^<]*<\\/span>\\s*<\\/td>\\s*<td[^>]*>\\s*<span[^>]*>[^<]*<\\/span>%\\s*<\\/td>\\s*<td[^>]*>\\s*<span[^>]*>([\\d.]*)<\\/span>';
            const vm = countryHtml.match(new RegExp(vatRegexStr, 'i'));
            if (vm && vm[1] !== '') ind.vat = parseFloat(vm[1]) || 0;
        });

        if (status) { status.textContent = "Auto-sync: Synced"; status.style.color = "var(--erep-green, #7ab700)"; }
        saveState();
        render();
    } catch (err) {
        console.error("Holding sync failed:", err);
        if (status) { status.textContent = "Auto-sync: Failed. Using manual values."; status.style.color = "#e74c3c"; }
    }
}
```

- [ ] **Step 3: Add syncAllPrices() (one button → all industries' shared prices)**

In `app.js`, add:

```js
// Holdings "Sync Live Prices" — refresh product + RM prices for ALL industries
// into the shared global price state, then re-render.
async function syncAllPrices() {
    const btn = document.getElementById("hld-sync-prices");
    if (btn) { btn.classList.add("loading"); btn.textContent = "Syncing…"; }
    const pick = async (industry, quality) => {
        try {
            const res = await fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/${industry}/${quality}`));
            if (!res.ok) return null;
            const d = await res.json();
            if (d.status === "ok" && d.offers && d.offers.length > 0) return d.offers[0].gross;
        } catch (e) { /* ignore one failed quality */ }
        return null;
    };
    try {
        // Food aggregate (info.misc Q1-Q7) + FRM
        const foodRes = await fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/1/1`));
        if (foodRes.ok) {
            const fd = await foodRes.json();
            if (fd.status === "ok" && fd.info && fd.info.misc) for (let q = 1; q <= 7; q++) if (fd.info.misc[q] && typeof fd.info.misc[q].gross === 'number') state.food.prices[q] = fd.info.misc[q].gross;
        }
        const frm = await pick(7, 1); if (frm !== null) state.frmPrice = frm;
        // Weapons Q1-7 + WRM
        for (let q = 1; q <= 7; q++) { const p = await pick(2, q); if (p !== null) state.weapons.prices[q] = p; }
        const wrm = await pick(12, 1); if (wrm !== null) state.wrmPrice = wrm;
        // Houses Q1-5 + HRM
        for (let q = 1; q <= 5; q++) { const p = await pick(4, q); if (p !== null) state.houses.prices[q] = p; }
        const hrm = await pick(17, 1); if (hrm !== null) state.hrmPrice = hrm;
        // Aircraft Q1-5 + ARM
        for (let q = 1; q <= 5; q++) { const p = await pick(23, q); if (p !== null) state.aircraft.prices[q] = p; }
        const arm = await pick(24, 1); if (arm !== null) state.armPrice = arm;

        saveState();
        render();
        alert("Prices synced for all industries.");
    } catch (e) {
        console.error("syncAllPrices error:", e);
        alert("Failed to sync prices (proxy/network).");
    } finally {
        if (btn) { btn.classList.remove("loading"); btn.textContent = "Sync Live Prices"; }
    }
}
```

- [ ] **Step 4: Wire the holding location + sync controls in setupListeners()**

In `app.js` `setupListeners()`, after the holding counter wiring, add:

```js
    const hldCountry = document.getElementById("hld-country");
    if (hldCountry) hldCountry.onchange = async function () {
        const h = activeHolding(); if (!h) return;
        h.selectedCountryId = this.value;
        h.selectedRegionPermalink = "";
        saveState();
        render();
        const rgn = document.getElementById("hld-region");
        if (this.value) await loadRegionsForCountry(this.value, "", rgn);
        else if (rgn) { rgn.innerHTML = '<option value="">-- Select Region --</option>'; rgn.disabled = true; }
    };
    const hldRegion = document.getElementById("hld-region");
    if (hldRegion) hldRegion.onchange = function () {
        const h = activeHolding(); if (!h) return;
        h.selectedRegionPermalink = this.value;
        saveState();
        syncHoldingModifiers();
    };
    const hldSyncPrices = document.getElementById("hld-sync-prices");
    if (hldSyncPrices) hldSyncPrices.onclick = syncAllPrices;
```

- [ ] **Step 5: Load the holding's regions on bootstrap + when switching to it**

In `app.js`, update `switchModule()` so selecting the Holdings tab loads the active holding's region list:

```js
async function switchModule(target) {
    if (state.activeModule === target) return;
    state.activeModule = target;
    saveState();
    if (target === "holdings") {
        const h = activeHolding();
        const rgn = document.getElementById("hld-region");
        if (h && h.selectedCountryId) await loadRegionsForCountry(h.selectedCountryId, h.selectedRegionPermalink, rgn);
        else if (rgn) { rgn.innerHTML = '<option value="">-- Select Region --</option>'; rgn.disabled = true; }
        render();
        return;
    }
    const loc = state[target];
    if (loc.selectedCountryId) {
        await loadRegionsForCountry(loc.selectedCountryId, loc.selectedRegionPermalink);
    } else {
        const regionSelect = document.getElementById("select-region");
        if (regionSelect) { regionSelect.innerHTML = '<option value="">-- Select Region --</option>'; regionSelect.disabled = true; }
    }
    render();
}
```

Also, in the `DOMContentLoaded` bootstrap, after the existing industry region load, add a holdings-region load when the app boots directly into holdings mode:

```js
    if (state.activeModule === "holdings") {
        const h = activeHolding();
        const rgn = document.getElementById("hld-region");
        if (h && h.selectedCountryId) await loadRegionsForCountry(h.selectedCountryId, h.selectedRegionPermalink, rgn);
    }
```

- [ ] **Step 6: Verify auto-sync end-to-end (manual)**

Run `node server.js`, open the app, Holdings → "Mixed":
1. Pick a Country (e.g. Poland) → region dropdown loads that country's regions.
2. Pick a Region → status shows "Syncing…" then "Synced"; each industry section header updates its Country/Region/Pollution mods to that region's real values for that specific industry (food vs weapons differ).
3. The summary recomputes using the synced modifiers.
4. Manually... (n/a — modifiers are read-only here; they only change via sync).
5. Click "Sync Live Prices" → prices refresh; summary updates; switch to an industry tab and confirm the same prices appear there (shared).
6. Reload → location + synced modifiers persist on "Mixed".

Stop the server.

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat(holdings): location auto-sync for all industries + shared price sync"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Fifth tab + Variant A layout → Tasks 7, 8, 9, 10. ✓
- Multiple named holdings, switch, CRUD, independent counts → Tasks 6, 8. ✓
- Single location per holding; per-industry country/region/pollution; country-wide work tax/avg salary; per-industry VAT → Tasks 6, 11. ✓
- Actual-configuration profit math (no buy-vs-produce) summed across industries → Tasks 2, 3, 4, 10. ✓
- WAM food/weapons only; houses/aircraft no WAM/work tax → Tasks 2, 3 (and tested). ✓
- Shared global prices/tycoon/WAM/offered salary; "one Sync feeds everything" → Tasks 8 (toggles), 11 (`syncAllPrices`). ✓
- No grand total across holdings → summary is per active holding only (Task 10). ✓
- Persistence v10→v11 with safe migration → Task 6. ✓
- Files: only `index.html`, `app.js`, `server.js`, `styles.css`, plus new `holdingsCalc.mjs`/`.test.mjs`; no deps → matches. ✓

**Placeholder scan:** Task 8 intentionally adds `renderHoldingSections`/`renderHoldingSummary` stubs that are fully replaced in Tasks 9/10 (sequenced, not left as TODO). No other placeholders.

**Type/name consistency:** `computeFwIndustry`/`computeHiredIndustry`/`sumHolding`/`productivityMultiplier`/`pollutionAt` exported in Tasks 1–4 and imported/used in Tasks 8, 10. Holding cell helpers `getHoldingCell`/`holdingMaxEmployees`/`applyHoldingCounterChange` defined in Task 9 and used by listeners in Task 9. `computeHoldingIndustry` defined in Task 10 and called by `renderHoldingSections` (Task 9) — Task 10 must be applied for the sections' per-section net; both are committed before the end-to-end verify in Task 11. DOM ids (`hld-*`) match between Task 7 markup and Tasks 8/10/11 code.

> Sequencing note: `renderHoldingSections` (Task 9) references `computeHoldingIndustry` (Task 10). The section net display is only meaningful once Task 10 lands; Task 9's own verification focuses on card rendering + counters. Execute Tasks 9 and 10 back-to-back.
