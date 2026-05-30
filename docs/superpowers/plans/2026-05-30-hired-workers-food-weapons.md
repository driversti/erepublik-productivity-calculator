# Hired Workers for Food & Weapons (+ Houses salary fix) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let food/weapons factories and plantations be worked by the owner (WAM) **plus** hired employees, and fix the houses module so labor is paid from a configurable offered salary (average salary stays tax-only).

**Architecture:** Convert `state.food[q]` / `state.weapons[q]` and their `plantations[q]` from plain numbers to `{ companies, workers }` (the shape houses already use). Each company contributes one WAM session; `sessions = companies + workers` drives output, RM, and work tax; `workers × offeredSalary` is the labor cost. A new global `offeredSalary` field and `Daily Salary` KPI are added. Houses are migrated to the same salary/tax model.

**Tech Stack:** Vanilla ES2020 modules, no dependencies, no build step. Verification = `node --check app.js` (syntax) + manual browser checks against `node server.js` on `http://localhost:8080`.

**Spec:** `docs/superpowers/specs/2026-05-30-hired-workers-food-weapons-design.md`

**Conventions for this plan:**
- Work on a feature branch; each task ends with `node --check`, a manual browser **Checkpoint**, and a commit.
- DOM is accessed by hardcoded IDs; new IDs are added to `index.html` in lockstep with the JS that reads them.
- `setupListeners()` is re-invoked at the end of every `render()` / `renderHouses()` cycle — new counter listeners follow that contract (bound each cycle, never one-time).
- All currency display uses `.toFixed(2)`; counts cap at 9999; workers cap at `companies × maxEmployees`.
- `mult = max(0, 1 + countryBonus/100 + regionBonus/100 + (tycoon?0.2:0) − pollution/100)`.
- Commit message trailer for every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 0: Feature branch

**Files:** none

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feat/hired-workers-food-weapons
```

- [ ] **Step 2: Confirm clean tree on the new branch**

Run: `git status`
Expected: "On branch feat/hired-workers-food-weapons", nothing to commit.

---

### Task 1: Game constants + global offeredSalary + storage version

**Files:**
- Modify: `app.js:5-39` (the four `*Data` arrays)
- Modify: `app.js:62-72` (state top-level fields)
- Modify: `app.js:173` (`STORAGE_KEY`)

- [ ] **Step 1: Add `maxEmployees` to food/weapon factory arrays**

Replace `foodFactoriesData` (`app.js:5-13`) and `weaponFactoriesData` (`app.js:23-31`) so every row gains `maxEmployees`. Food and weapons share the same caps: Q1:1, Q2:2, Q3:3, Q4:5, Q5–Q7:10.

```javascript
const foodFactoriesData = [
    { quality: 1, name: "Grain Bakery (Q1)", baseOutput: 100, baseRM: 1, energyPerItem: 2, maxEmployees: 1 },
    { quality: 2, name: "Food Factory (Q2)", baseOutput: 100, baseRM: 2, energyPerItem: 4, maxEmployees: 2 },
    { quality: 3, name: "Food Factory (Q3)", baseOutput: 100, baseRM: 3, energyPerItem: 6, maxEmployees: 3 },
    { quality: 4, name: "Food Factory (Q4)", baseOutput: 100, baseRM: 4, energyPerItem: 8, maxEmployees: 5 },
    { quality: 5, name: "Food Factory (Q5)", baseOutput: 100, baseRM: 5, energyPerItem: 10, maxEmployees: 10 },
    { quality: 6, name: "Food Factory (Q6)", baseOutput: 100, baseRM: 6, energyPerItem: 12, maxEmployees: 10 },
    { quality: 7, name: "Food Factory (Q7)", baseOutput: 100, baseRM: 20, energyPerItem: 20, maxEmployees: 10 }
];
```

```javascript
const weaponFactoriesData = [
    { quality: 1, name: "Weapons Factory (Q1)", baseOutput: 10, baseRM: 1, energyPerItem: 10, maxEmployees: 1 },
    { quality: 2, name: "Weapons Factory (Q2)", baseOutput: 10, baseRM: 2, energyPerItem: 20, maxEmployees: 2 },
    { quality: 3, name: "Weapons Factory (Q3)", baseOutput: 10, baseRM: 3, energyPerItem: 30, maxEmployees: 3 },
    { quality: 4, name: "Weapons Factory (Q4)", baseOutput: 10, baseRM: 4, energyPerItem: 40, maxEmployees: 5 },
    { quality: 5, name: "Weapons Factory (Q5)", baseOutput: 10, baseRM: 5, energyPerItem: 50, maxEmployees: 10 },
    { quality: 6, name: "Weapons Factory (Q6)", baseOutput: 10, baseRM: 6, energyPerItem: 60, maxEmployees: 10 },
    { quality: 7, name: "Weapons Factory (Q7)", baseOutput: 10, baseRM: 20, energyPerItem: 100, maxEmployees: 10 }
];
```

- [ ] **Step 2: Add `maxEmployees` to food/weapon plantation arrays**

Replace `foodPlantationsData` (`app.js:15-21`) and `weaponPlantationsData` (`app.js:33-39`). Plantations: Q1:0, Q2:0, Q3:1, Q4:1, Q5:4 (Q1/Q2 = owner WAM only).

```javascript
const foodPlantationsData = [
    { quality: 1, name: "Grain Farm (Q1)", baseOutput: 35, energyPerItem: 10, maxEmployees: 0 },
    { quality: 2, name: "Fruit Orchard (Q2)", baseOutput: 70, energyPerItem: 10, maxEmployees: 0 },
    { quality: 3, name: "Fishery (Q3)", baseOutput: 125, energyPerItem: 10, maxEmployees: 1 },
    { quality: 4, name: "Cattle Farm (Q4)", baseOutput: 175, energyPerItem: 10, maxEmployees: 1 },
    { quality: 5, name: "Hunting Lodge (Q5)", baseOutput: 250, energyPerItem: 10, maxEmployees: 4 }
];
```

```javascript
const weaponPlantationsData = [
    { quality: 1, name: "Iron Mine (Q1)", baseOutput: 35, energyPerItem: 10, maxEmployees: 0 },
    { quality: 2, name: "Oil Spring (Q2)", baseOutput: 70, energyPerItem: 10, maxEmployees: 0 },
    { quality: 3, name: "Aluminum Mine (Q3)", baseOutput: 125, energyPerItem: 10, maxEmployees: 1 },
    { quality: 4, name: "Saltpeter Mine (Q4)", baseOutput: 175, energyPerItem: 10, maxEmployees: 1 },
    { quality: 5, name: "Rubber Plantation (Q5)", baseOutput: 250, energyPerItem: 10, maxEmployees: 4 }
];
```

- [ ] **Step 3: Add `offeredSalary` to state**

In the top-level state object, after `averageSalary: 0.0,` (`app.js:66`) add:

```javascript
    offeredSalary: 0.0,
```

- [ ] **Step 4: Bump the storage key**

Change `app.js:173` from `v8`/`v9` to `v10`:

```javascript
const STORAGE_KEY = "erep_calculator_food_factories_v10";
```

- [ ] **Step 5: Syntax check**

Run: `node --check app.js`
Expected: no output (exit 0).

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: add maxEmployees constants, offeredSalary state, bump storage to v10

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: State shape `{companies, workers}` + migration + persistence + reset

Convert food/weapons factories and plantations from numbers to `{companies, workers}`, migrate old saved state, persist `offeredSalary`, and fix the reset handler.

**Files:**
- Modify: `app.js:73-148` (food & weapons state init)
- Modify: `app.js:184` (load offeredSalary)
- Modify: `app.js:195-220` (`loadModule` migration)
- Modify: `app.js:1955-1959` (reset handler)

- [ ] **Step 1: Initialize food/weapons cells as objects**

In the `food` block (`app.js:73-110`), replace the seven `q: 0` lines and the `plantations` block with object cells:

```javascript
    food: {
        1: { companies: 0, workers: 0 },
        2: { companies: 0, workers: 0 },
        3: { companies: 0, workers: 0 },
        4: { companies: 0, workers: 0 },
        5: { companies: 0, workers: 0 },
        6: { companies: 0, workers: 0 },
        7: { companies: 0, workers: 0 },
        plantations: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        prices: { 1: 0.80, 2: 1.60, 3: 2.40, 4: 3.20, 5: 4.00, 6: 5.00, 7: 9.90 }
    },
```

- [ ] **Step 2: Initialize the weapons cells the same way**

In the `weapons` block (`app.js:111-148`), make the identical structural change, keeping the weapons `prices` values:

```javascript
    weapons: {
        1: { companies: 0, workers: 0 },
        2: { companies: 0, workers: 0 },
        3: { companies: 0, workers: 0 },
        4: { companies: 0, workers: 0 },
        5: { companies: 0, workers: 0 },
        6: { companies: 0, workers: 0 },
        7: { companies: 0, workers: 0 },
        plantations: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        prices: { 1: 1.20, 2: 2.40, 3: 3.60, 4: 4.80, 5: 6.00, 6: 8.00, 7: 15.00 }
    },
```

- [ ] **Step 3: Persist `offeredSalary` on load**

After the `averageSalary` load line (`app.js:184`) add:

```javascript
            if (typeof parsed.offeredSalary === 'number') state.offeredSalary = parsed.offeredSalary;
```

(`saveState` uses `JSON.stringify(state)`, so `offeredSalary` saves automatically — no change needed there.)

- [ ] **Step 4: Migrate food/weapons cells in `loadModule`**

Replace the factory loop (`app.js:198-200`) and the plantation loop (`app.js:201-205`) inside `loadModule` with migration logic that accepts both the old number form and the new object form, clamping workers to the per-quality cap. `loadModule` must know which data arrays apply, so derive them from `key`:

```javascript
            const loadModule = (key) => {
                if (parsed[key] && typeof parsed[key] === 'object') {
                    const m = parsed[key];
                    const facData = key === 'food' ? foodFactoriesData : weaponFactoriesData;
                    const plantData = key === 'food' ? foodPlantationsData : weaponPlantationsData;
                    const migrateCell = (src, maxEmp) => {
                        let companies = 0, workers = 0;
                        if (typeof src === 'number') {
                            companies = Math.max(0, Math.floor(src));
                        } else if (src && typeof src === 'object') {
                            companies = (typeof src.companies === 'number') ? Math.max(0, Math.floor(src.companies)) : 0;
                            workers = (typeof src.workers === 'number') ? Math.max(0, Math.floor(src.workers)) : 0;
                        }
                        companies = Math.min(companies, 9999);
                        const cap = companies * maxEmp;
                        if (workers > cap) workers = cap;
                        return { companies, workers };
                    };
                    for (let q = 1; q <= 7; q++) {
                        if (m[q] !== undefined) {
                            const row = facData.find(x => x.quality === q);
                            state[key][q] = migrateCell(m[q], row ? row.maxEmployees : 0);
                        }
                    }
                    if (m.plantations && typeof m.plantations === 'object') {
                        for (let q = 1; q <= 5; q++) {
                            if (m.plantations[q] !== undefined) {
                                const row = plantData.find(x => x.quality === q);
                                state[key].plantations[q] = migrateCell(m.plantations[q], row ? row.maxEmployees : 0);
                            }
                        }
                    }
```

Leave the rest of `loadModule` (countryBonus … prices, `app.js:206-219`) unchanged.

- [ ] **Step 5: Fix the reset handler for the new shape**

Replace the food/weapons reset block (`app.js:1954-1959`) with:

```javascript
    // Reset factories
    for (let q = 1; q <= 7; q++) {
        state[active][q] = { companies: 0, workers: 0 };
    }
    // Reset plantations
    state[active].plantations = {
        1: { companies: 0, workers: 0 },
        2: { companies: 0, workers: 0 },
        3: { companies: 0, workers: 0 },
        4: { companies: 0, workers: 0 },
        5: { companies: 0, workers: 0 }
    };
```

- [ ] **Step 6: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 7: Checkpoint — old saved state migrates without crashing**

1. Start the server: `node server.js`
2. In the browser console at `http://localhost:8080`, seed a legacy v9 value and reload:
   ```js
   localStorage.setItem('erep_calculator_food_factories_v9', JSON.stringify({activeModule:'food', food:{1:3, plantations:{1:2}}}));
   ```
   (v10 is a fresh key, so the app starts clean; this just confirms no crash on a missing/legacy key.)
3. Reload. Expected: app loads, no console errors, Food tab renders with all cards at 0 (v10 starts fresh).

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "feat: migrate food/weapons state to {companies, workers} cells

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: index.html — Offered Salary input + Daily Salary KPI

**Files:**
- Modify: `index.html` (modifier inputs near `input-average-salary`; KPI list near `total-work-tax`)

- [ ] **Step 1: Add the Offered Salary input**

Immediately after the Average Salary `control-group` (the `<div class="control-group">` containing `input-average-salary`, `index.html:204-205`), insert:

```html
                        <div class="control-group" id="offered-salary-group">
                            <label for="input-offered-salary" class="control-label">Offered Salary (CC)</label>
                            <input type="number" id="input-offered-salary" class="market-input" step="1" min="0" value="0.0">
                        </div>
```

- [ ] **Step 2: Add the Daily Salary KPI block**

After the Daily Work Tax KPI block (`index.html:77-80`, the one containing `total-work-tax`), insert:

```html
                        <div class="kpi-block">
                            <span class="kpi-label" id="label-salary-kpi">Daily Salary</span>
                            <span class="kpi-value kpi-red" id="total-salary">0.00 CC</span>
                        </div>
```

- [ ] **Step 3: Checkpoint — new controls render**

Reload `http://localhost:8080`. Expected: "Offered Salary (CC)" input appears under Average Salary; a "Daily Salary" line (0.00 CC) appears under "Daily Work Tax" in the summary. No console errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Offered Salary input and Daily Salary KPI to markup

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Food/weapons counter helpers

Add helpers mirroring the houses counter helpers (`app.js:287-310`, `houseCounterGroupsHtml` at `app.js:1048-1063`) but for food/weapons cells. Reuse the existing `.house-counters` / `.house-counter-row` / `.house-counter-label` / `.max-hint` CSS (no new styles).

**Files:**
- Modify: `app.js` — add helpers after `applyHouseCounterChange` (`app.js:310`)

- [ ] **Step 1: Add cell accessor, max-employees lookup, clamp, and counter markup**

Insert after line `app.js:310` (end of `applyHouseCounterChange`):

```javascript
// --- Food/Weapon employee helpers (companies + hired workers) ---
function fwMaxEmployees(active, kind, quality) {
    const data = kind === 'factory'
        ? (active === 'food' ? foodFactoriesData : weaponFactoriesData)
        : (active === 'food' ? foodPlantationsData : weaponPlantationsData);
    const row = data.find(x => String(x.quality) === String(quality));
    return row ? (row.maxEmployees || 0) : 0;
}

function getFwCell(active, kind, quality) {
    return kind === 'factory' ? state[active][quality] : state[active].plantations[quality];
}

// Clamp companies to 0..9999 and workers to 0..(companies * maxEmployees)
function applyFwCounterChange(active, kind, field, quality, value) {
    const cell = getFwCell(active, kind, quality);
    const maxEmp = fwMaxEmployees(active, kind, quality);
    if (field === 'companies') {
        cell.companies = Math.max(0, Math.min(value, 9999));
        const cap = cell.companies * maxEmp;
        if (cell.workers > cap) cell.workers = cap;
    } else {
        const cap = (cell.companies || 0) * maxEmp;
        cell.workers = Math.max(0, Math.min(value, cap));
    }
}

// Stacked Companies / Workers counter rows for a food/weapon card.
// Workers row is hidden when hideWorkers is true (e.g. plantations with maxEmployees 0).
function fwCounterGroupsHtml(kind, quality, companies, workers, maxWorkers, hideWorkers) {
    const row = (field, value, label, hint) => `
        <div class="house-counter-row">
            <span class="house-counter-label">${label}${hint}</span>
            <div class="counter-group counter-group-sm">
                <button class="btn-counter fw-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="-1">-</button>
                <input type="text" class="counter-input fw-counter-input" data-kind="${kind}" data-field="${field}" data-quality="${quality}" value="${value}" inputmode="numeric" pattern="[0-9]*">
                <button class="btn-counter fw-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="1">+</button>
            </div>
        </div>`;
    let html = `<div class="house-counters">` + row('companies', companies, 'Companies', '');
    if (!hideWorkers) {
        html += row('workers', workers, 'Workers', ` <span class="max-hint">· max ${maxWorkers}</span>`);
    }
    return html + `</div>`;
}
```

- [ ] **Step 2: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add food/weapon employee helpers (cell, clamp, counter markup)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Factory render loop — sessions, output, RM, counters

Drive factory output/RM by `sessions = companies + workers` and swap the single counter for the paired Companies/Workers group. Accumulate session and worker totals for Task 7.

**Files:**
- Modify: `app.js:682-795` (the `factoriesData.forEach` block in `render()`)

- [ ] **Step 1: Add session/worker accumulators**

Replace the accumulator declarations at `app.js:682-687`:

```javascript
    let totalFactories = 0;       // total companies (for the "Total Factories" KPI)
    let factorySessions = 0;      // WAM + hired sessions (for work tax)
    let factoryWorkers = 0;       // hired only (for labor salary)
    let totalOutput = 0;
    let totalRM = 0;
    let sumRevenue = 0;
    let sumGrainCost = 0;
    let breakdownHtml = "";
```

- [ ] **Step 2: Read the cell and compute sessions**

Replace `app.js:691-692`:

```javascript
        const cell = moduleState[fact.quality] || { companies: 0, workers: 0 };
        const companies = cell.companies || 0;
        const workers = Math.min(cell.workers || 0, companies * fact.maxEmployees);
        const sessions = companies + workers;
        totalFactories += companies;
        factorySessions += sessions;
        factoryWorkers += workers;
```

- [ ] **Step 3: Drive output/RM by sessions**

Replace `app.js:707-708`:

```javascript
        const cardOutput = singleOutput * sessions;
        const cardRM = singleRM * sessions;
```

- [ ] **Step 4: Update the breakdown gate and label**

Replace `app.js:726` (`if (qty > 0) {`) and the breakdown label at `app.js:729`:

```javascript
        if (companies > 0 || workers > 0) {
```

```javascript
                    <span class="breakdown-label">Q${fact.quality} (${companies}c / ${workers}w)</span>
```

- [ ] **Step 5: Replace the single counter with paired counters**

Replace the per-bldg hint at `app.js:772`:

```javascript
                    <span style="font-size: 10px; color: var(--text-secondary);">${singleOutput.toFixed(2)} / session</span>
```

Replace the entire `factory-action-area` block (`app.js:785-791`) with:

```javascript
            <div class="factory-action-area">
                ${fwCounterGroupsHtml('factory', fact.quality, companies, workers, companies * fact.maxEmployees, false)}
            </div>
```

- [ ] **Step 6: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 7: Checkpoint — factory output scales with workers**

On the Food tab at `http://localhost:8080`:
1. Set Country Bonus 0, Region Bonus 0, Tycoon off, pollution 0 (so `mult = 1`).
2. On Grain Bakery (Q1): Companies = 1. Expected Daily Output = 100 items (1 session).
3. Increase Workers to 1 (max shows `· max 1`). Expected Daily Output = 200 items (2 sessions); Daily Grain (FRM) = 2.00.
4. Try to set Workers = 2 — it clamps back to 1 (cap = companies×1).

No console errors. (Sidebar profit numbers are wired in Task 7.)

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "feat: factory output/RM driven by WAM + hired sessions; paired counters

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Plantation render loop — sessions, output, counters

Same treatment for plantations; hide the Workers row when `maxEmployees === 0` (Q1/Q2).

**Files:**
- Modify: `app.js:799-885` (the `plantationsData.forEach` block)

- [ ] **Step 1: Add plantation session/worker accumulators**

Replace `app.js:799-800`:

```javascript
    let totalPlantations = 0;     // total companies
    let plantSessions = 0;        // WAM + hired
    let plantWorkers = 0;         // hired only
    let totalGrainProduced = 0;
```

- [ ] **Step 2: Read the cell and compute sessions**

Replace `app.js:806-807`:

```javascript
            const cell = moduleState.plantations[plant.quality] || { companies: 0, workers: 0 };
            const companies = cell.companies || 0;
            const workers = Math.min(cell.workers || 0, companies * plant.maxEmployees);
            const sessions = companies + workers;
            totalPlantations += companies;
            plantSessions += sessions;
            plantWorkers += workers;
```

- [ ] **Step 3: Drive plantation output by sessions**

Replace `app.js:819`:

```javascript
            const cardOutput = singleOutput * sessions;
```

- [ ] **Step 4: Update the per-bldg hint and counter markup**

Replace the per-bldg hint at `app.js:854`:

```javascript
                        <span style="font-size: 10px; color: var(--text-secondary);">${singleOutput.toFixed(2)} / session</span>
```

Replace the entire `factory-action-area` block (`app.js:863-869`) with:

```javascript
                <div class="factory-action-area">
                    ${fwCounterGroupsHtml('plantation', plant.quality, companies, workers, companies * plant.maxEmployees, plant.maxEmployees === 0)}
                </div>
```

- [ ] **Step 5: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 6: Checkpoint — plantation employees behave per quality**

On the Food tab (mult = 1 as in Task 5):
1. Grain Farm (Q1): shows **only** a Companies row (no Workers row). Set Companies = 1 → Daily Output 0.35 FRM (35/100 × 1 session).
2. Hunting Lodge (Q5): set Companies = 1 → Workers row shows `· max 4`. Set Workers = 4 → 5 sessions → Daily Output = 2.50 × 5 = 12.50 FRM. Workers = 5 clamps to 4.

No console errors. (Counters still need listeners — added in Task 8; for now verify by editing `state` via console or proceed to Task 8 before this checkpoint if buttons are unresponsive.)

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat: plantation output driven by sessions; Workers hidden for Q1/Q2

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Strategy A/B math + Work Tax/Daily Salary KPIs

Rebuild the cost terms to use all sessions for work tax and hired workers for labor, and render the new Daily Salary KPI.

**Files:**
- Modify: `app.js:889-936` (strategy math)
- Modify: `app.js:938-960` area (summary KPI writes)

- [ ] **Step 1: Replace the strategy cost terms**

Replace `app.js:889` and `app.js:898-909` with session/worker-based costs:

```javascript
    // STRATEGY MATH & COMPARISON
    const taxPerSession = (state.workTaxRate / 100) * state.averageSalary;
    const factoryTax = factorySessions * taxPerSession;
    const factoryLabor = factoryWorkers * state.offeredSalary;

    const totalGrainRequiredVal = totalRM;
    const netGrainBalance = totalGrainProduced - totalGrainRequiredVal;

    // Option A: buy 100% of raw material
    const grainExpenseOptionA = totalGrainRequiredVal * rmPrice;
    const netProfitOptionA = sumRevenue - factoryTax - factoryLabor - grainExpenseOptionA;

    // Option B: run plantations
    const plantTax = plantSessions * taxPerSession;
    const plantLabor = plantWorkers * state.offeredSalary;

    let marketExpenseOptionB = 0;
    let marketRevenueOptionB = 0;
    if (netGrainBalance < 0) {
        marketExpenseOptionB = (-netGrainBalance) * rmPrice;
    } else {
        marketRevenueOptionB = netGrainBalance * rmPrice * (1 - state.vat / 100);
    }

    const netProfitOptionB = sumRevenue - factoryTax - factoryLabor - plantTax - plantLabor
        - marketExpenseOptionB + marketRevenueOptionB;
```

- [ ] **Step 2: Update the optimal-option display variables**

The block at `app.js:911-936` selects the winning option and sets `displayGrainCost`, `displayWorkTax`, `displayNetProfit`. Replace it so it also tracks the displayed **work tax** (all sessions) and **salary** (labor) separately:

```javascript
    // Determine Optimal Option
    const isOptionBBetter = netProfitOptionB > netProfitOptionA;

    let displayGrainCost = 0;
    let displayWorkTax = 0;   // total work tax for the chosen option
    let displaySalary = 0;    // total labor salary for the chosen option
    let displayNetProfit = 0;
    const badge = document.getElementById("summary-strategy-badge");

    if (isOptionBBetter) {
        displayGrainCost = marketExpenseOptionB - marketRevenueOptionB;
        displayWorkTax = factoryTax + plantTax;
        displaySalary = factoryLabor + plantLabor;
        displayNetProfit = netProfitOptionB;
        if (badge) {
            badge.textContent = "Option B: Produce";
            badge.style.background = isFood ? "#e67e22" : "#7f8c8d";
        }
    } else {
        displayGrainCost = grainExpenseOptionA;
        displayWorkTax = factoryTax;
        displaySalary = factoryLabor;
        displayNetProfit = netProfitOptionA;
        if (badge) {
            badge.textContent = "Option A: Buy";
            badge.style.background = "var(--erep-blue)";
        }
    }
```

- [ ] **Step 3: Render the Work Tax and new Daily Salary KPIs**

The existing Work Tax KPI write is at `app.js` where `total-work-tax` is set (search for `getElementById("total-work-tax")`). Replace that single write with both lines, and ensure `displayNetProfit` already subtracts salary (it does, via `factoryLabor`/`plantLabor`). Find the line:

```javascript
    document.getElementById("total-work-tax").textContent = `${displayWorkTax.toFixed(2)} CC`;
```

(or the current equivalent) and replace with:

```javascript
    document.getElementById("total-work-tax").textContent = `-${displayWorkTax.toFixed(2)} CC`;
    document.getElementById("total-salary").textContent = `-${displaySalary.toFixed(2)} CC`;
```

> Note: `displayNetProfit` already nets out tax + labor; the headline net profit write (`total-net-profit`) needs no change beyond using `displayNetProfit`. Confirm the existing net-profit write uses `displayNetProfit`.

- [ ] **Step 4: Keep the strategy comparison panel consistent**

The Option A/Option B panel (search `strategy-buy-profit`, `strategy-produce-profit`) prints `netProfitOptionA` / `netProfitOptionB`. Verify those variables still feed the panel (they are unchanged names). The Option-B "WaM Tax:" sub-line (`strategy-produce-tax`) should now show `(factoryTax + plantTax).toFixed(2)`; update that write if it currently references the old `dailyWorkTaxOptionB`:

```javascript
    document.getElementById("strategy-produce-tax").textContent = (factoryTax + plantTax).toFixed(2);
```

- [ ] **Step 5: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 6: Checkpoint — costs reflect tax + salary**

Food tab, mult = 1, Work Tax Rate = 10%, Average Salary = 50, Offered Salary = 30, VAT = 0, FRM price = 50:
1. Grain Bakery Q1: Companies = 1, Workers = 1 → 2 sessions.
2. Expected **Daily Work Tax** = 2 × (10% × 50) = **-10.00 CC**.
3. Expected **Daily Salary** = 1 worker × 30 = **-30.00 CC**.
4. Daily Output = 200 food; Revenue = 200 × 0.80 = 160.00 CC.
5. Grain needed = 2.00 FRM; Option A grain cost = 2 × 50 = 100.00 CC.
6. Net (Option A) = 160 − 10 − 30 − 100 = **20.00 CC** → matches "Est. Daily Net Profit".

No console errors.

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat: work tax over all sessions + offeredSalary labor; Daily Salary KPI

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Listeners — fw counters + Offered Salary input

Replace the old single-counter food/weapons listeners with paired-counter listeners modeled on the houses counter listeners (`app.js:1536-1566`), and wire the Offered Salary input.

**Files:**
- Modify: `app.js:1432-1533` (food/weapons plus/minus/input + plantation listeners)
- Modify: `app.js:1721-1746` (after Average Salary listener)

- [ ] **Step 1: Remove the obsolete single-counter listeners**

Delete these four blocks entirely (they operate on the old number shape):
- `.btn-plus` (`app.js:1432-1441`)
- `.btn-minus` (`app.js:1443-1452`)
- `.counter-input:not(.plantation-counter-input)` (`app.js:1454-1481`)
- `.btn-plant-plus`, `.btn-plant-minus`, `.plantation-counter-input` (`app.js:1483-1533`)

- [ ] **Step 2: Add fw counter button + input listeners**

In their place insert (mirrors the houses counter listeners):

```javascript
    // Food/Weapon counter buttons (companies / workers, factory / plantation)
    document.querySelectorAll(".fw-counter-btn").forEach(btn => {
        btn.onclick = function() {
            const active = state.activeModule;
            const kind = this.getAttribute("data-kind");
            const field = this.getAttribute("data-field");
            const q = this.getAttribute("data-quality");
            const delta = parseInt(this.getAttribute("data-delta"), 10);
            const current = getFwCell(active, kind, q)[field] || 0;
            applyFwCounterChange(active, kind, field, q, current + delta);
            saveState();
            render();
        };
    });

    // Food/Weapon counter text inputs
    document.querySelectorAll(".fw-counter-input").forEach(input => {
        input.oninput = function() {
            const valStr = this.value.replace(/[^0-9]/g, '');
            this.value = valStr;
            let val = parseInt(valStr, 10);
            if (isNaN(val)) val = 0;
            applyFwCounterChange(state.activeModule, this.getAttribute("data-kind"), this.getAttribute("data-field"), this.getAttribute("data-quality"), val);
        };
        input.onblur = function() {
            if (this.value === "") this.value = "0";
            saveState();
            render();
        };
        input.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    });
```

- [ ] **Step 3: Add the Offered Salary input listener**

After the Average Salary listener block (`app.js:1721-1746`) insert. Note: editing Offered Salary is **not** a location modifier, so it does **not** de-sync the country/region selection (unlike Average Salary):

```javascript
    // Offered Salary Input (labor paid to hired workers; does not de-sync location)
    const offeredSalaryInput = document.getElementById("input-offered-salary");
    if (offeredSalaryInput) {
        offeredSalaryInput.onchange = function() {
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) val = 0.0;
            state.offeredSalary = val;
            saveState();
            render();
        };
        offeredSalaryInput.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    }
```

- [ ] **Step 4: Reflect the stored value into the input each render**

Both `render()` and `renderHouses()` set `input-average-salary`'s value (`app.js:650`, `app.js:1184`). Add an Offered Salary line next to each:

In `render()` after `app.js:650`:

```javascript
    document.getElementById("input-offered-salary").value = state.offeredSalary.toFixed(2);
```

In `renderHouses()` after `app.js:1184`:

```javascript
    document.getElementById("input-offered-salary").value = state.offeredSalary.toFixed(2);
```

- [ ] **Step 5: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 6: Checkpoint — counters and salary input are interactive**

Reload. On the Food tab:
1. Click `+` on a factory's Companies row → count rises, output updates, persists across reload.
2. Click `+` on Workers → rises up to `max`, then stops; output and Daily Salary update.
3. Edit Offered Salary to 25, press Enter → Daily Salary recomputes (workers × 25). Country/region selection is **unchanged** (no de-sync).
4. Reload → all values persist (v10).

No console errors.

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat: paired-counter listeners for food/weapons + Offered Salary input

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Houses salary fix (offeredSalary labor + work tax)

Apply the same model to houses: pay labor from `offeredSalary`, and add work tax = `workers × (workTaxRate/100) × averageSalary` (houses have no WAM, so sessions = workers).

**Files:**
- Modify: `app.js:1283-1310` (houses strategy math)
- Modify: `app.js:1327` and `app.js:1347` (houses KPI/strategy writes)

- [ ] **Step 1: Recompute houses labor and add work tax**

Replace `app.js:1283-1295`:

```javascript
    // --- Strategy math ---
    const houseTaxPerSession = (state.workTaxRate / 100) * state.averageSalary;
    const houseSalaryCost = totalWorkers * state.offeredSalary;      // house-factory labor
    const hrmSalaryCost = totalRmWorkers * state.offeredSalary;      // HRM labor
    const houseWorkTax = totalWorkers * houseTaxPerSession;          // no WAM in houses
    const hrmWorkTax = totalRmWorkers * houseTaxPerSession;
    const netHrmBalance = totalHrmProduced - totalHrmUsed;

    // Option A: buy all HRM, run no RM companies
    const optionA_hrmCost = totalHrmUsed * hrmPrice;
    const netA = sumRevenue - optionA_hrmCost - houseSalaryCost - houseWorkTax;

    // Option B: produce HRM
    let marketExpenseB = 0, marketRevenueB = 0;
    if (netHrmBalance < 0) marketExpenseB = (-netHrmBalance) * hrmPrice;
    else marketRevenueB = netHrmBalance * hrmPrice * (1 - state.vat / 100);
    const netB = sumRevenue - houseSalaryCost - hrmSalaryCost - houseWorkTax - hrmWorkTax
        - marketExpenseB + marketRevenueB;
```

- [ ] **Step 2: Update the option-display selection**

Replace `app.js:1297-1310` so it tracks salary and tax separately:

```javascript
    const isBbetter = netB > netA;
    let displayHrmCost, displaySalary, displayTax, displayNet;
    const badge = document.getElementById("summary-strategy-badge");
    if (isBbetter) {
        displayHrmCost = marketExpenseB - marketRevenueB;
        displaySalary = houseSalaryCost + hrmSalaryCost;
        displayTax = houseWorkTax + hrmWorkTax;
        displayNet = netB;
        if (badge) { badge.textContent = "Option B: Produce"; badge.style.background = "#78909c"; }
    } else {
        displayHrmCost = optionA_hrmCost;
        displaySalary = houseSalaryCost;
        displayTax = houseWorkTax;
        displayNet = netA;
        if (badge) { badge.textContent = "Option A: Buy"; badge.style.background = "var(--erep-blue)"; }
    }
```

- [ ] **Step 3: Write both Work Tax and Daily Salary KPIs for houses**

Replace `app.js:1327` (`total-work-tax`) with both writes:

```javascript
    document.getElementById("total-work-tax").textContent = `-${displayTax.toFixed(2)} CC`;
    document.getElementById("total-salary").textContent = `-${displaySalary.toFixed(2)} CC`;
```

- [ ] **Step 4: Fix the Option-B strategy sub-line for houses**

`app.js:1347` currently shows `hrmSalaryCost`. Make it the HRM-side tax + labor so the panel matches the new model:

```javascript
    document.getElementById("strategy-produce-tax").textContent = (hrmWorkTax + hrmSalaryCost).toFixed(2);
```

- [ ] **Step 5: Confirm the houses sub-labels still make sense**

`renderHouses()` sets the Work Tax KPI label to "Daily Salary Cost" (search `label-work-tax-kpi` in `renderHouses`). Change it back to "Daily Work Tax" so the split Work Tax / Daily Salary lines read correctly:

Find the line setting the houses Work Tax label (e.g. `labelWorkTaxKpi.textContent = "Daily Salary Cost";`) and set:

```javascript
    if (labelWorkTaxKpi) labelWorkTaxKpi.textContent = "Daily Work Tax";
```

Also ensure the new `label-salary-kpi` ("Daily Salary") is visible on the houses tab (it is, since both KPI blocks are always present).

- [ ] **Step 6: Syntax check**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 7: Checkpoint — houses use offered salary + tax**

House Industry tab, mult = 1, Work Tax Rate = 10%, Average Salary = 50, Offered Salary = 30, VAT = 0:
1. House Factory Q1: Companies = 1, Workers = 1.
2. Expected **Daily Salary** = 1 × 30 = **-30.00 CC**.
3. Expected **Daily Work Tax** = 1 × (10% × 50) = **-5.00 CC**.
4. Net profit drops by both vs. the previous (salary-only) behavior.

No console errors.

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "fix: houses pay offeredSalary labor + averageSalary-based work tax

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Full integration pass

**Files:** none (verification only)

- [ ] **Step 1: Syntax check the whole file**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 2: Cross-tab manual sweep**

With `node server.js` running, for **each** of Food, Weapons, Houses:
1. Add companies + workers on a factory and (food/weapons) a Q5 plantation; confirm output, RM/HRM, Work Tax, Daily Salary, and Net Profit all update coherently and Option A/B highlights the higher net.
2. Confirm plantation Q1/Q2 show no Workers row (food/weapons).
3. Confirm worker caps clamp at `companies × maxEmployees`.
4. Reset (the active tab's reset button) returns all cells to 0.
5. Reload and confirm persistence.
6. Confirm a fresh profile (clear `localStorage`) starts clean with no console errors.

- [ ] **Step 3: De-sync rule intact**

On Food/Weapons, edit a country/region modifier input → sync-status reads "De-synced (Manual)". Editing **Offered Salary** does **not** de-sync. (Average Salary still de-syncs, unchanged.)

- [ ] **Step 4: Final commit (if any touch-ups were needed)**

```bash
git add -A
git commit -m "chore: integration fixes for hired-workers feature

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review notes

- **Spec coverage:** constants (Task 1), state+migration (Task 2), offeredSalary field/UI (Tasks 1,3,8), paired counters (Tasks 4,5,6,8), session-based output/RM (Tasks 5,6), tax-over-sessions + labor math + A/B (Task 7), houses fix (Task 9), de-sync preserved (Tasks 8,10). All spec sections map to a task.
- **Plantation Q1/Q2 (maxEmployees 0):** Workers row hidden via `hideWorkers` flag (Task 6 Step 4); clamp keeps workers at 0.
- **Listener rebinding:** new `.fw-counter-*` listeners live in `setupListeners()`, which `render()` calls every cycle — consistent with the houses pattern.
- **Naming consistency:** `getFwCell` / `fwMaxEmployees` / `applyFwCounterChange` / `fwCounterGroupsHtml` / `.fw-counter-btn` / `.fw-counter-input` used identically across Tasks 4, 5, 6, 8.
