# House Industry Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third "House Industry" tab to the eRepublik Productivity Calculator that computes daily profit from producing and selling houses (Q1–Q5), mirroring the Food/Weapon modules.

**Architecture:** A new `houses` block in the single `state` object plus a dedicated `renderHouses()` path (the existing `render()` early-returns to it when `activeModule === "houses"`). House and HRM companies use **dual counters** (companies + workers); daily output is driven by worker count (`base × bonus × workers`, capped at `companies × maxEmployees`); labor cost is salary-only (no work tax). The same sidebar DOM is reused with relabeling, exactly as Food↔Weapon already do.

**Tech Stack:** Vanilla ES2020 modules, no dependencies, no build step. Verification = `node --check` (built-in) + manual browser checks against `node server.js` on `http://localhost:8080`.

**Spec:** `docs/superpowers/specs/2026-05-30-houses-module-design.md`

**Conventions for this plan:**
- This repo is **not** a git repository → there are no commit steps. Each task ends with a verification "Checkpoint".
- DOM is accessed by hardcoded IDs; new IDs are added to `index.html` in lockstep with the JS that reads them.
- `setupListeners()` is re-invoked at the end of every render cycle — `renderHouses()` follows the same contract.
- All currency display uses `.toFixed(2)`; counts cap at 9999.

---

### Task 1: index.html structural hooks

**Files:**
- Modify: `index.html`

These edits add the third nav tab and the element IDs that `renderHouses()` (and the restored Food/Weapon path) need to relabel/hide shared DOM. No behavior changes yet.

- [ ] **Step 1: Add the House Industry nav tab**

In the `.module-nav` block, after the weapons tab:

```html
            <button class="nav-tab" id="tab-weapons">Weapon Industry</button>
            <button class="nav-tab" id="tab-houses">House Industry</button>
```

- [ ] **Step 2: Add an ID to the "Total Factories:" label**

```html
                        <div class="kpi-block-inline">
                            <span class="kpi-label" id="label-total-count">Total Factories:</span>
                            <span class="kpi-value-small" id="total-factories-count">0</span>
                        </div>
```

- [ ] **Step 3: Add an ID to the "Daily Work Tax" label**

```html
                        <div class="kpi-block">
                            <span class="kpi-label" id="label-work-tax-kpi">Daily Work Tax</span>
                            <span class="kpi-value kpi-red" id="total-work-tax">0.00 CC</span>
                        </div>
```

- [ ] **Step 4: Add an ID to the Work Tax control-group (so it can be hidden on the houses tab)**

```html
                        <div class="control-group" id="work-tax-group">
                            <label for="input-work-tax" class="control-label">Work Tax Rate (%)</label>
                            <input type="number" id="input-work-tax" class="market-input" step="0.5" min="1" max="25" value="1.0">
                        </div>
```

- [ ] **Step 5: Wrap the Option-B "WaM Tax:" text in a relabelable span**

```html
                                <div style="font-size: 11px; margin-top: 2px; color: var(--text-secondary);"><span id="strategy-produce-tax-label">WaM Tax:</span> <span id="strategy-produce-tax">0.00</span> CC | Balance: <span id="strategy-produce-balance">0.00</span> CC</div>
```

- [ ] **Step 6: Add IDs to all seven price-input rows (so Q6/Q7 can be hidden on the houses tab)**

Change each of the seven `<div class="price-input-row">` opening tags to include a unique id `price-row-q1` … `price-row-q7`. Example for the first and last:

```html
                        <div class="price-input-row" id="price-row-q1">
                            <label for="price-q1" class="food-price-label" data-quality="1">Q1 Food</label>
                            <input type="number" id="price-q1" class="food-price-input" data-quality="1" step="0.05" min="0" value="0.80">
                        </div>
```
```html
                        <div class="price-input-row" id="price-row-q7">
                            <label for="price-q7" class="food-price-label" data-quality="7">Q7 Food</label>
                            <input type="number" id="price-q7" class="food-price-input" data-quality="7" step="0.05" min="0" value="9.90">
                        </div>
```

- [ ] **Step 7: Checkpoint — visual sanity**

Run: `node server.js` then open `http://localhost:8080`.
Expected: page still loads; a new (non-functional) "House Industry" tab is visible next to Weapon Industry; Food/Weapon tabs behave exactly as before.

---

### Task 2: House game-data constants

**Files:**
- Modify: `app.js` (top, after the existing `weaponPlantationsData` array, around line 39)

- [ ] **Step 1: Add the house factory and HRM company data arrays**

```javascript
// House factories (construction industry). Q1-Q5 only.
// baseOutput = 1/work = fraction of a house completed per worker-session at multiplier 1.0.
// baseRM = HRM_per_house / work = 2 for every quality (HRM consumed per worker-session at x1.0).
const houseFactoriesData = [
    { quality: 1, name: "House Factory (Q1)", baseOutput: 1 / 5,  baseRM: 2, maxEmployees: 1 },
    { quality: 2, name: "House Factory (Q2)", baseOutput: 1 / 10, baseRM: 2, maxEmployees: 2 },
    { quality: 3, name: "House Factory (Q3)", baseOutput: 1 / 20, baseRM: 2, maxEmployees: 3 },
    { quality: 4, name: "House Factory (Q4)", baseOutput: 1 / 40, baseRM: 2, maxEmployees: 5 },
    { quality: 5, name: "House Factory (Q5)", baseOutput: 1 / 60, baseRM: 2, maxEmployees: 10 }
];

// House Raw Material companies. baseOutput is in individual units (divided by 100 for marketplace HRM units).
const houseRawMaterialsData = [
    { quality: 1, name: "Sand (Q1)",      baseOutput: 35,  maxEmployees: 1 },
    { quality: 2, name: "Clay (Q2)",      baseOutput: 70,  maxEmployees: 2 },
    { quality: 3, name: "Wood (Q3)",      baseOutput: 125, maxEmployees: 3 },
    { quality: 4, name: "Limestone (Q4)", baseOutput: 175, maxEmployees: 4 },
    { quality: 5, name: "Granite (Q5)",   baseOutput: 250, maxEmployees: 5 }
];
```

- [ ] **Step 2: Checkpoint**

Run: `node --check app.js`
Expected: no output (exit 0 = syntactically valid).

---

### Task 3: State shape, storage version bump, load/save

**Files:**
- Modify: `app.js` — `state` object (~line 42), `STORAGE_KEY` (~line 131), `loadState()` (~line 134), `saveState()` (unchanged, but verify).

- [ ] **Step 1: Add `hrmPrice` and the `houses` block to `state`**

In the `state` object, add `hrmPrice` next to `frmPrice`/`wrmPrice`:

```javascript
    frmPrice: 50.00,
    wrmPrice: 50.00,
    hrmPrice: 1535.00,
```

And add the `houses` block after the `weapons` block (before the closing `}` of `state`):

```javascript
    weapons: {
        // ... existing weapons block unchanged ...
    },
    houses: {
        factories: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        rm: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        prices: { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 }
    }
```

- [ ] **Step 2: Bump the storage key v8 → v9**

```javascript
const STORAGE_KEY = "erep_calculator_food_factories_v9";
```

- [ ] **Step 3: Load `hrmPrice` and the `houses` block in `loadState()`**

In `loadState()`, after the `if (typeof parsed.wrmPrice === 'number') state.wrmPrice = parsed.wrmPrice;` line, add:

```javascript
            if (typeof parsed.hrmPrice === 'number') state.hrmPrice = parsed.hrmPrice;
```

Then, after the two existing `loadModule('food'); loadModule('weapons');` calls, add a dedicated houses loader (its shape differs, so it is not reused from `loadModule`):

```javascript
            // Houses has a different shape ({companies, workers} per quality, Q1-Q5)
            if (parsed.houses && typeof parsed.houses === 'object') {
                const ph = parsed.houses;
                const loadHouseGroup = (groupKey, data) => {
                    if (ph[groupKey] && typeof ph[groupKey] === 'object') {
                        for (let q = 1; q <= 5; q++) {
                            const src = ph[groupKey][q];
                            if (src && typeof src === 'object') {
                                const row = data.find(x => x.quality === q);
                                const maxEmp = row ? row.maxEmployees : 0;
                                const companies = (typeof src.companies === 'number') ? Math.max(0, Math.floor(src.companies)) : 0;
                                let workers = (typeof src.workers === 'number') ? Math.max(0, Math.floor(src.workers)) : 0;
                                if (workers > companies * maxEmp) workers = companies * maxEmp;
                                state.houses[groupKey][q] = { companies, workers };
                            }
                        }
                    }
                };
                loadHouseGroup('factories', houseFactoriesData);
                loadHouseGroup('rm', houseRawMaterialsData);
                if (typeof ph.countryBonus === 'number') state.houses.countryBonus = ph.countryBonus;
                if (typeof ph.regionBonus === 'number') state.houses.regionBonus = ph.regionBonus;
                if (typeof ph.pollution === 'number') state.houses.pollution = ph.pollution;
                if (ph.qualityPollution && typeof ph.qualityPollution === 'object') {
                    for (let q = 0; q <= 5; q++) {
                        if (typeof ph.qualityPollution[q] === 'number') state.houses.qualityPollution[q] = ph.qualityPollution[q];
                    }
                }
                if (ph.prices && typeof ph.prices === 'object') {
                    for (let q = 1; q <= 5; q++) {
                        if (typeof ph.prices[q] === 'number') state.houses.prices[q] = ph.prices[q];
                    }
                }
            }
```

`saveState()` serializes the whole `state` object, so it already persists `houses`/`hrmPrice` — no change needed.

- [ ] **Step 4: Checkpoint**

Run: `node --check app.js`
Expected: no output.

Then in the browser console (`http://localhost:8080`), run `localStorage.clear()` once and reload to discard any old v8 state.

---

### Task 4: Shared helpers + 3-way tab highlight + `render()` delegation

**Files:**
- Modify: `app.js` — add helpers near the other top-level helpers (after `generateStarsHtml`, ~line 207); edit `render()` (~line 435); edit the tab-active block inside `render()`.

- [ ] **Step 1: Add house counter state helpers**

Add after `generateStarsHtml()`:

```javascript
// --- House module helpers ---
function getHouseCell(kind, quality) {
    return state.houses[kind === 'factory' ? 'factories' : 'rm'][quality];
}

function houseMaxEmployees(kind, quality) {
    const data = kind === 'factory' ? houseFactoriesData : houseRawMaterialsData;
    const row = data.find(x => String(x.quality) === String(quality));
    return row ? row.maxEmployees : 0;
}

// Clamp companies to 0..9999 and workers to 0..(companies * maxEmployees)
function applyHouseCounterChange(kind, field, quality, value) {
    const cell = getHouseCell(kind, quality);
    const maxEmp = houseMaxEmployees(kind, quality);
    if (field === 'companies') {
        cell.companies = Math.max(0, Math.min(value, 9999));
        const cap = cell.companies * maxEmp;
        if (cell.workers > cap) cell.workers = cap;
    } else {
        const cap = (cell.companies || 0) * maxEmp;
        cell.workers = Math.max(0, Math.min(value, cap));
    }
}

// Highlight the active tab across all three modules
function setActiveTabHighlight(active) {
    [['food', 'tab-food'], ['weapons', 'tab-weapons'], ['houses', 'tab-houses']].forEach(([m, id]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', m === active);
    });
}
```

- [ ] **Step 2: Make `render()` delegate to houses, restore shared DOM for food/weapons, and use the 3-way highlight**

At the very top of `render()`, before any DOM reads, add the delegation guard:

```javascript
function render() {
    if (state.activeModule === "houses") {
        renderHouses();
        return;
    }

    const container = document.getElementById("factories-container");
    // ... rest of existing render() ...
```

Replace the existing tab-toggle block:

```javascript
    // Toggle active tab header classes
    const tabFood = document.getElementById("tab-food");
    const tabWeapons = document.getElementById("tab-weapons");
    if (tabFood && tabWeapons) {
        if (isFood) {
            tabFood.classList.add("active");
            tabWeapons.classList.remove("active");
        } else {
            tabFood.classList.remove("active");
            tabWeapons.classList.add("active");
        }
    }
```

with:

```javascript
    // Toggle active tab header classes (3-way)
    setActiveTabHighlight(active);

    // Restore DOM that the houses path hides/relabels
    const workTaxGroupFW = document.getElementById("work-tax-group");
    if (workTaxGroupFW) workTaxGroupFW.style.display = "";
    const labelWorkTaxKpiFW = document.getElementById("label-work-tax-kpi");
    if (labelWorkTaxKpiFW) labelWorkTaxKpiFW.textContent = "Daily Work Tax";
    const labelTotalCountFW = document.getElementById("label-total-count");
    if (labelTotalCountFW) labelTotalCountFW.textContent = "Total Factories:";
    const produceTaxLabelFW = document.getElementById("strategy-produce-tax-label");
    if (produceTaxLabelFW) produceTaxLabelFW.textContent = "WaM Tax:";
    for (let q = 1; q <= 7; q++) {
        const row = document.getElementById(`price-row-q${q}`);
        if (row) row.style.display = "";
    }
```

- [ ] **Step 3: Add a temporary minimal `renderHouses()` stub** (replaced fully in Task 5)

Add a new function (e.g. directly after `render()`):

```javascript
function renderHouses() {
    setActiveTabHighlight("houses");
    const activeModuleSpan = document.querySelector(".active-module .module-name");
    if (activeModuleSpan) activeModuleSpan.textContent = "House Industry (Step 1)";
    document.getElementById("factories-container").innerHTML = "<p class='info-text'>House rendering coming in Task 5.</p>";
    document.getElementById("plantations-container").innerHTML = "";
    setupListeners();
}
```

- [ ] **Step 4: Wire the houses tab button in `setupListeners()`**

In `setupListeners()`, after the existing `tab-weapons` handler block, add:

```javascript
    const tabHouses = document.getElementById("tab-houses");
    if (tabHouses) {
        tabHouses.onclick = function() {
            if (state.activeModule !== "houses") {
                state.activeModule = "houses";
                saveState();
                if (state.selectedCountryId && state.selectedRegionPermalink) {
                    syncRegionModifiers();
                } else {
                    render();
                }
            }
        };
    }
```

- [ ] **Step 5: Checkpoint**

Run: `node --check app.js` → no output.
Browser: reload, click **House Industry**. Expected: tab highlights, header shows "House Industry (Step 1)", workspace shows the placeholder text, Work Tax control disappears, switching back to Food/Weapon restores everything (Work Tax control reappears, labels reset).

---

### Task 5: Full `renderHouses()` — cards, sidebar, strategy

**Files:**
- Modify: `app.js` — replace the `renderHouses()` stub from Task 4 with the full implementation; add two card-HTML helpers above it.

- [ ] **Step 1: Add card-HTML helpers** (place directly above `renderHouses()`)

```javascript
// Two stacked counter rows (Companies / Workers) for a house or HRM card
function houseCounterGroupsHtml(kind, quality, companies, workers, maxWorkers) {
    const mk = (field, value, label, extra) => `
        <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:4px;">
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-secondary);">${label}${extra}</span>
            <div class="counter-group">
                <button class="btn-counter house-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="-1">-</button>
                <input type="text" class="counter-input house-counter-input" data-kind="${kind}" data-field="${field}" data-quality="${quality}" value="${value}" inputmode="numeric" pattern="[0-9]*">
                <button class="btn-counter house-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="1">+</button>
            </div>
        </div>`;
    return mk('companies', companies, 'Companies', '') + mk('workers', workers, 'Workers', ` (max ${maxWorkers})`);
}

function houseFactoryCardHtml(fac, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cardHrm, cardProfit, cardRevenue) {
    return `
        <div class="factory-avatar-area">
            <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#8e7cc3;fill:rgba(142,124,195,0.1);">
                <path d="M3 11l9-7 9 7M5 10v10h14V10M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="factory-info-area">
            <div class="factory-title">${fac.name}</div>
            <div class="stars-container">${generateStarsHtml(fac.quality)}</div>
            <div class="factory-pollution" style="font-size:11px;margin-top:4px;color:${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'};font-weight:500;">Pollution: ${pollutionRate.toFixed(2)}%</div>
        </div>
        <div class="factory-stats-area">
            <div class="stat-item">
                <span class="stat-label">Daily Output</span>
                <span class="stat-value" style="color: var(--erep-blue);">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} houses</span>
                <span style="font-size:10px;color:var(--text-secondary);">${singleOutput.toFixed(4)} / worker</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Daily HRM</span>
                <span class="stat-value" style="color: var(--erep-gold);">${cardHrm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HRM</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Est. Daily Profit</span>
                <span class="stat-value ${cardProfit >= 0 ? 'text-success' : 'text-danger'}">${cardProfit.toFixed(2)} CC</span>
                <span style="font-size:10px;color:var(--text-secondary);">Rev: ${cardRevenue.toFixed(2)} CC</span>
            </div>
        </div>
        <div class="factory-action-area">${houseCounterGroupsHtml('factory', fac.quality, companies, workers, maxWorkers)}</div>`;
}

function houseRmCardHtml(rm, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput) {
    return `
        <div class="factory-avatar-area" style="background:rgba(120,144,156,0.1);color:#78909c;border-radius:4px;padding:4px;">
            <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#78909c;fill:rgba(120,144,156,0.1);">
                <path d="M3 20h18L17 8l-4 5-3-4-4 6z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="factory-info-area">
            <div class="factory-title">${rm.name}</div>
            <div class="stars-container">${generateStarsHtml(rm.quality)}</div>
            <div class="factory-pollution" style="font-size:11px;margin-top:4px;color:${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'};font-weight:500;">Pollution: ${pollutionRate.toFixed(2)}%</div>
        </div>
        <div class="factory-stats-area">
            <div class="stat-item">
                <span class="stat-label">Daily Output</span>
                <span class="stat-value" style="color:#78909c;">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HRM</span>
                <span style="font-size:10px;color:var(--text-secondary);">${singleOutput.toFixed(4)} / worker</span>
            </div>
            <div class="stat-item" style="opacity:0.5;"></div>
            <div class="stat-item"></div>
        </div>
        <div class="factory-action-area">${houseCounterGroupsHtml('rm', rm.quality, companies, workers, maxWorkers)}</div>`;
}
```

- [ ] **Step 2: Replace the `renderHouses()` stub with the full implementation**

```javascript
function renderHouses() {
    setActiveTabHighlight("houses");

    const h = state.houses;
    const hrmPrice = state.hrmPrice;

    // --- Labels / titles ---
    const activeModuleSpan = document.querySelector(".active-module .module-name");
    if (activeModuleSpan) activeModuleSpan.textContent = "House Industry (Step 1)";
    const countryBonusLabel = document.getElementById("country-bonus-label");
    if (countryBonusLabel) countryBonusLabel.textContent = "Country Construction Bonus";
    const grainPriceLabel = document.getElementById("label-grain-price");
    if (grainPriceLabel) grainPriceLabel.textContent = "HRM Price (CC)";
    const foodPricesHeader = document.getElementById("food-prices-header");
    if (foodPricesHeader) foodPricesHeader.textContent = "House Prices (CC)";
    document.querySelectorAll(".food-price-label").forEach(label => {
        const q = label.getAttribute("data-quality");
        label.textContent = `Q${q} House`;
    });
    for (let q = 1; q <= 5; q++) { const r = document.getElementById(`price-row-q${q}`); if (r) r.style.display = ""; }
    for (let q = 6; q <= 7; q++) { const r = document.getElementById(`price-row-q${q}`); if (r) r.style.display = "none"; }

    const factoriesTitle = document.getElementById("factories-main-title");
    if (factoriesTitle) factoriesTitle.textContent = "Your House Factories";
    const factoriesSub = document.getElementById("factories-subtitle");
    if (factoriesSub) factoriesSub.textContent = "Set companies + workers (Q1–Q5). Only hired employees produce — no WAM.";
    const plantationsTitle = document.getElementById("plantations-main-title");
    if (plantationsTitle) plantationsTitle.textContent = "Your HRM Companies";
    const plantationsSub = document.getElementById("plantations-subtitle");
    if (plantationsSub) plantationsSub.textContent = "House Raw Material companies Sand → Granite (Q1–Q5)";

    const labelOutput = document.getElementById("label-total-output");
    if (labelOutput) labelOutput.textContent = "House Output:";
    const labelConsumed = document.getElementById("label-total-consumed");
    if (labelConsumed) labelConsumed.textContent = "HRM Consumed:";
    const labelCostKpi = document.getElementById("label-daily-cost-kpi");
    if (labelCostKpi) labelCostKpi.textContent = "Daily HRM Cost";
    const labelWorkTaxKpi = document.getElementById("label-work-tax-kpi");
    if (labelWorkTaxKpi) labelWorkTaxKpi.textContent = "Daily Salary Cost";
    const labelTotalCount = document.getElementById("label-total-count");
    if (labelTotalCount) labelTotalCount.textContent = "Total Companies:";

    const stratHeader = document.getElementById("strategy-comparison-header");
    if (stratHeader) stratHeader.textContent = "HRM Strategy Comparison";
    const labelProduced = document.getElementById("label-total-produced");
    if (labelProduced) labelProduced.textContent = "HRM Produced:";
    const labelBalance = document.getElementById("label-net-balance");
    if (labelBalance) labelBalance.textContent = "HRM Net Balance:";
    const stratBuyTitle = document.getElementById("strategy-buy-title");
    if (stratBuyTitle) stratBuyTitle.textContent = "Option A: Buy HRM";
    const stratProduceTitle = document.getElementById("strategy-produce-title");
    if (stratProduceTitle) stratProduceTitle.textContent = "Option B: Produce HRM";
    const produceTaxLabel = document.getElementById("strategy-produce-tax-label");
    if (produceTaxLabel) produceTaxLabel.textContent = "HRM Salary:";

    const workTaxGroup = document.getElementById("work-tax-group");
    if (workTaxGroup) workTaxGroup.style.display = "none";

    // --- Sync modifier/market inputs with houses state ---
    document.getElementById("country-bonus-slider").value = h.countryBonus;
    document.getElementById("country-bonus-value").textContent = `${h.countryBonus}%`;
    document.getElementById("tycoon-toggle").checked = state.hasTycoon;
    document.getElementById("input-region-bonus").value = h.regionBonus;
    document.getElementById("input-pollution").value = h.pollution;
    document.getElementById("input-average-salary").value = state.averageSalary.toFixed(2);
    document.getElementById("select-country").value = state.selectedCountryId || "";
    document.getElementById("select-region").value = state.selectedRegionPermalink || "";
    document.getElementById("input-grain-price").value = hrmPrice.toFixed(2);
    document.getElementById("input-vat").value = state.vat.toFixed(1);
    for (let q = 1; q <= 5; q++) {
        const el = document.getElementById(`price-q${q}`);
        if (el) el.value = h.prices[q].toFixed(2);
    }

    const syncStatus = document.getElementById("sync-status");
    if (syncStatus) {
        if (state.selectedCountryId && state.selectedRegionPermalink) {
            syncStatus.textContent = `Auto-sync: Synced (Country: +${h.countryBonus}%, Region: +${h.regionBonus}%)`;
            syncStatus.style.color = "var(--erep-green, #7ab700)";
        } else if (state.selectedCountryId) {
            syncStatus.textContent = "Auto-sync: Region not selected";
            syncStatus.style.color = "var(--text-secondary)";
        } else {
            syncStatus.textContent = "Auto-sync: Not configured";
            syncStatus.style.color = "var(--text-secondary)";
        }
    }

    const multiplierFor = (qualityIndex) => {
        const pollutionRate = (typeof h.qualityPollution[qualityIndex] === 'number') ? h.qualityPollution[qualityIndex] : h.pollution;
        return { mult: Math.max(0, 1 + (h.countryBonus / 100) + (h.regionBonus / 100) + (state.hasTycoon ? 0.2 : 0) - (pollutionRate / 100)), pollutionRate };
    };

    // --- House factory cards ---
    const container = document.getElementById("factories-container");
    container.innerHTML = "";
    let totalCompanies = 0, totalWorkers = 0, totalOutput = 0, totalHrmUsed = 0, sumRevenue = 0;
    let breakdownHtml = "";

    houseFactoriesData.forEach(fac => {
        const cell = h.factories[fac.quality];
        const companies = cell.companies || 0;
        const maxWorkers = companies * fac.maxEmployees;
        const workers = Math.min(cell.workers || 0, maxWorkers);
        totalCompanies += companies;
        totalWorkers += workers;

        const { mult, pollutionRate } = multiplierFor(fac.quality);
        const singleOutput = fac.baseOutput * mult;
        const cardOutput = singleOutput * workers;
        const cardHrm = fac.baseRM * mult * workers;
        const productPrice = h.prices[fac.quality];
        const cardRevenue = cardOutput * productPrice * (1 - state.vat / 100);
        const cardHrmCost = cardHrm * hrmPrice;
        const cardSalary = workers * state.averageSalary;
        const cardProfit = cardRevenue - cardHrmCost - cardSalary;

        totalOutput += cardOutput;
        totalHrmUsed += cardHrm;
        sumRevenue += cardRevenue;

        if (companies > 0 || workers > 0) {
            breakdownHtml += `
                <li class="breakdown-item">
                    <span class="breakdown-label">Q${fac.quality} (${companies}c / ${workers}w)</span>
                    <span class="breakdown-count" style="display:flex;flex-direction:column;align-items:flex-end;">
                        <span>+${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Houses</span>
                        <span class="${cardProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-size:11px;font-weight:700;">${cardProfit >= 0 ? '+' : ''}${cardProfit.toFixed(2)} CC</span>
                    </span>
                </li>`;
        }

        const card = document.createElement("div");
        card.className = "factory-row-card";
        card.innerHTML = houseFactoryCardHtml(fac, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cardHrm, cardProfit, cardRevenue);
        container.appendChild(card);
    });

    // --- HRM company cards ---
    const rmContainer = document.getElementById("plantations-container");
    rmContainer.innerHTML = "";
    let totalRmWorkers = 0, totalHrmProduced = 0;

    houseRawMaterialsData.forEach(rm => {
        const cell = h.rm[rm.quality];
        const companies = cell.companies || 0;
        const maxWorkers = companies * rm.maxEmployees;
        const workers = Math.min(cell.workers || 0, maxWorkers);
        totalRmWorkers += workers;

        const { mult, pollutionRate } = multiplierFor(0); // index 0 = raw-material pollution
        const singleOutput = (rm.baseOutput / 100) * mult;
        const cardOutput = singleOutput * workers;
        totalHrmProduced += cardOutput;

        const card = document.createElement("div");
        card.className = "factory-row-card";
        card.style.borderLeft = "3px solid #78909c";
        card.innerHTML = houseRmCardHtml(rm, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput);
        rmContainer.appendChild(card);
    });

    // --- Strategy math ---
    const houseSalaryCost = totalWorkers * state.averageSalary;
    const hrmSalaryCost = totalRmWorkers * state.averageSalary;
    const netHrmBalance = totalHrmProduced - totalHrmUsed;

    // Option A: buy all HRM, run no RM companies
    const optionA_hrmCost = totalHrmUsed * hrmPrice;
    const netA = sumRevenue - optionA_hrmCost - houseSalaryCost;

    // Option B: produce HRM
    let marketExpenseB = 0, marketRevenueB = 0;
    if (netHrmBalance < 0) marketExpenseB = (-netHrmBalance) * hrmPrice;
    else marketRevenueB = netHrmBalance * hrmPrice * (1 - state.vat / 100);
    const netB = sumRevenue - houseSalaryCost - hrmSalaryCost - marketExpenseB + marketRevenueB;

    const isBbetter = netB > netA;
    let displayHrmCost, displaySalary, displayNet;
    const badge = document.getElementById("summary-strategy-badge");
    if (isBbetter) {
        displayHrmCost = marketExpenseB - marketRevenueB;
        displaySalary = houseSalaryCost + hrmSalaryCost;
        displayNet = netB;
        if (badge) { badge.textContent = "Option B: Produce"; badge.style.background = "#78909c"; }
    } else {
        displayHrmCost = optionA_hrmCost;
        displaySalary = houseSalaryCost;
        displayNet = netA;
        if (badge) { badge.textContent = "Option A: Buy"; badge.style.background = "var(--erep-blue)"; }
    }
    const grossDailyProfit = sumRevenue - displayHrmCost;

    // --- Summary KPIs ---
    document.getElementById("total-factories-count").textContent = totalCompanies;
    document.getElementById("total-food-output").textContent = totalOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("total-grain-required").textContent = `${totalHrmUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HRM`;
    document.getElementById("total-gross-revenue").textContent = `${sumRevenue.toFixed(2)} CC`;

    const totalGrainCostEl = document.getElementById("total-grain-cost");
    totalGrainCostEl.textContent = `${displayHrmCost.toFixed(2)} CC`;
    totalGrainCostEl.className = displayHrmCost < 0 ? "kpi-value text-success" : "kpi-value kpi-gold";

    const grossProfitEl = document.getElementById("total-gross-profit");
    grossProfitEl.textContent = `${grossDailyProfit.toFixed(2)} CC`;
    grossProfitEl.className = grossDailyProfit >= 0 ? "kpi-value text-success" : "kpi-value text-danger";

    document.getElementById("total-work-tax").textContent = `-${displaySalary.toFixed(2)} CC`;

    const netProfitEl = document.getElementById("total-net-profit");
    netProfitEl.textContent = `${displayNet.toFixed(2)} CC`;
    netProfitEl.className = displayNet >= 0 ? "kpi-value text-success" : "kpi-value text-danger";

    const breakdownList = document.getElementById("factory-breakdown-list");
    breakdownList.innerHTML = breakdownHtml === "" ? `<li class="info-text" style="text-align:center;font-style:italic;">No house companies configured yet.</li>` : breakdownHtml;

    // --- Strategy comparison panel ---
    document.getElementById("total-grain-produced").textContent = `${totalHrmProduced.toFixed(2)} HRM`;
    const balanceSpan = document.getElementById("grain-net-balance");
    balanceSpan.textContent = `${netHrmBalance >= 0 ? "+" : ""}${netHrmBalance.toFixed(2)} HRM`;
    balanceSpan.className = netHrmBalance >= 0 ? "kpi-value-small text-success" : "kpi-value-small text-danger";

    document.getElementById("strategy-buy-cost").textContent = optionA_hrmCost.toFixed(2);
    const profitBuySpan = document.getElementById("strategy-buy-profit");
    profitBuySpan.textContent = `${netA.toFixed(2)} CC`;
    profitBuySpan.className = netA >= 0 ? "text-success" : "text-danger";

    document.getElementById("strategy-produce-tax").textContent = hrmSalaryCost.toFixed(2);
    document.getElementById("strategy-produce-balance").textContent = `${netHrmBalance >= 0 ? "+" : ""}${netHrmBalance.toFixed(2)}`;
    const profitProduceSpan = document.getElementById("strategy-produce-profit");
    profitProduceSpan.textContent = `${netB.toFixed(2)} CC`;
    profitProduceSpan.className = netB >= 0 ? "text-success" : "text-danger";

    const buyCard = document.getElementById("strategy-buy-card");
    const produceCard = document.getElementById("strategy-produce-card");
    const recommendationDiv = document.getElementById("strategy-recommendation");
    buyCard.style.borderColor = "var(--border-color)";
    buyCard.style.backgroundColor = "var(--bg-card)";
    produceCard.style.borderColor = "var(--border-color)";
    produceCard.style.backgroundColor = "var(--bg-card)";

    if (netA > netB) {
        buyCard.style.borderColor = "var(--erep-green)";
        buyCard.style.backgroundColor = "rgba(122, 183, 0, 0.05)";
        recommendationDiv.textContent = `Recommendation: Option A (Buy HRM) is more profitable by ${(netA - netB).toFixed(2)} CC/day`;
        recommendationDiv.style.borderColor = "var(--erep-green)";
        recommendationDiv.style.color = "var(--erep-green-border)";
        recommendationDiv.style.backgroundColor = "rgba(122, 183, 0, 0.08)";
    } else if (netB > netA) {
        produceCard.style.borderColor = "var(--erep-green)";
        produceCard.style.backgroundColor = "rgba(122, 183, 0, 0.05)";
        recommendationDiv.textContent = `Recommendation: Option B (Produce) is more profitable by ${(netB - netA).toFixed(2)} CC/day`;
        recommendationDiv.style.borderColor = "var(--erep-green)";
        recommendationDiv.style.color = "var(--erep-green-border)";
        recommendationDiv.style.backgroundColor = "rgba(122, 183, 0, 0.08)";
    } else {
        recommendationDiv.textContent = "Recommendation: Both options are equally profitable";
        recommendationDiv.style.borderColor = "var(--border-color)";
        recommendationDiv.style.color = "var(--text-primary)";
        recommendationDiv.style.backgroundColor = "var(--bg-header)";
    }

    setupListeners();
}
```

- [ ] **Step 3: Checkpoint — syntax**

Run: `node --check app.js`
Expected: no output.

- [ ] **Step 4: Checkpoint — math (browser)**

With `node server.js` running, open `http://localhost:8080`, switch to **House Industry**, then in the **Modifiers** card set Country Construction Bonus = 100%, Region 0, Tycoon off, Pollution 0, Average Salary = 100; in **Market Parameters** set HRM Price = 1535, VAT = 1; keep default House Prices. Enter House Q5 = **1 company / 10 workers** and Granite (Q5 HRM) = **1 company / 5 workers**.

Expected summary values (multiplier = 2.0):
- Total Companies: **1** (counts house factories only, mirroring how Food/Weapon "Total Factories" excludes raw-material companies)
- House Output: **0.33**
- HRM Consumed: **40.00 HRM**
- HRM Produced: **25.00 HRM**, Net Balance **−15.00 HRM**
- Daily Revenue: **104279.67 CC**
- Option A (Buy HRM) net: **41879.67 CC**; Option B (Produce HRM) net: **79754.67 CC**
- Badge = **Option B: Produce**; Daily Salary Cost = **−1500.00 CC**; Est. Daily Net Profit = **79754.67 CC**

If the workers field is raised above `companies × maxEmployees`, it must clamp on blur (e.g. Q5 with 1 company clamps workers to 10).

---

### Task 6: House counter listeners + price/reset/visibility wiring

**Files:**
- Modify: `app.js` — `setupListeners()` (~line 922) and the reset handler (~line 1390); extend the existing grain-price handler.

- [ ] **Step 1: Bind house counter buttons and inputs**

In `setupListeners()`, after the plantation input block (before the country dropdown listener), add:

```javascript
    // House counter buttons (companies / workers, factory / rm)
    document.querySelectorAll(".house-counter-btn").forEach(btn => {
        btn.onclick = function() {
            const kind = this.getAttribute("data-kind");
            const field = this.getAttribute("data-field");
            const q = this.getAttribute("data-quality");
            const delta = parseInt(this.getAttribute("data-delta"), 10);
            const current = getHouseCell(kind, q)[field] || 0;
            applyHouseCounterChange(kind, field, q, current + delta);
            saveState();
            render();
        };
    });

    // House counter text inputs
    document.querySelectorAll(".house-counter-input").forEach(input => {
        input.oninput = function() {
            const valStr = this.value.replace(/[^0-9]/g, '');
            this.value = valStr;
            let val = parseInt(valStr, 10);
            if (isNaN(val)) val = 0;
            applyHouseCounterChange(this.getAttribute("data-kind"), this.getAttribute("data-field"), this.getAttribute("data-quality"), val);
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

- [ ] **Step 2: Route the HRM price through the existing grain-price handler**

In the `grainPriceInput.onchange` handler, replace the food/weapons branch:

```javascript
            if (state.activeModule === "food") {
                state.frmPrice = val;
            } else {
                state.wrmPrice = val;
            }
```

with:

```javascript
            if (state.activeModule === "food") {
                state.frmPrice = val;
            } else if (state.activeModule === "weapons") {
                state.wrmPrice = val;
            } else {
                state.hrmPrice = val;
            }
```

- [ ] **Step 3: Handle the houses branch in the reset button**

At the start of the `btn-reset-all` onclick handler, before the existing food/weapons reset code, branch on houses and return early:

```javascript
document.getElementById("btn-reset-all").onclick = function() {
    const active = state.activeModule;

    if (active === "houses") {
        for (let q = 1; q <= 5; q++) {
            state.houses.factories[q] = { companies: 0, workers: 0 };
            state.houses.rm[q] = { companies: 0, workers: 0 };
        }
        state.houses.countryBonus = 100;
        state.houses.regionBonus = 0;
        state.houses.pollution = 0;
        state.houses.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        state.houses.prices = { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 };
        state.hrmPrice = 1535.00;
        state.hasTycoon = false;
        state.averageSalary = 0.0;
        state.selectedCountryId = "";
        state.selectedRegionPermalink = "";
        state.vat = 1.0;
        const syncStatusH = document.getElementById("sync-status");
        if (syncStatusH) { syncStatusH.textContent = "Auto-sync: Not configured"; syncStatusH.style.color = "var(--text-secondary)"; }
        const regionSelectH = document.getElementById("select-region");
        if (regionSelectH) { regionSelectH.innerHTML = '<option value="">-- Select Region --</option>'; regionSelectH.disabled = true; }
        saveState();
        render();
        return;
    }

    // ... existing food/weapons reset code unchanged ...
```

- [ ] **Step 4: Checkpoint**

Run: `node --check app.js` → no output.
Browser: on the House tab, the +/− buttons and text inputs for both Companies and Workers update output live; Workers clamps to `companies × max`; the HRM Price field updates HRM cost; "Clear All Factories" resets the houses tab to empty + defaults. Switching to Food/Weapon and editing still works unchanged.

---

### Task 7: Live price sync for houses

**Files:**
- Modify: `app.js` — `syncLivePrices()` (~line 1300).

- [ ] **Step 1: Add the houses branch**

`syncLivePrices()` currently has `if (isFood) { … } else { … }`. Change the dispatch so houses is handled explicitly. Replace the opening `const isFood = state.activeModule === "food";` and the `if (isFood) {` line with a three-way structure; the houses branch:

```javascript
        } else if (state.activeModule === "houses") {
            // Houses: industry 4 (per-quality, no info.misc); HRM: industry 17
            const houseRequests = [1, 2, 3, 4, 5].map(q =>
                fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/4/${q}`))
            );
            const hrmRequest = fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/17/1`));
            const [hrmRes, ...houseResponses] = await Promise.all([hrmRequest, ...houseRequests]);

            if (hrmRes.ok) {
                const hrmData = await hrmRes.json();
                if (hrmData.status === "ok" && hrmData.offers && hrmData.offers.length > 0) {
                    state.hrmPrice = hrmData.offers[0].gross;
                }
            }
            for (let i = 0; i < houseResponses.length; i++) {
                const q = i + 1;
                const res = houseResponses[i];
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "ok" && data.offers && data.offers.length > 0) {
                        state.houses.prices[q] = data.offers[0].gross;
                    }
                }
            }
        }
```

Concretely, restructure the dispatch like this (keep the existing food and weapons bodies intact):

```javascript
    try {
        if (state.activeModule === "food") {
            // ... existing food body ...
        } else if (state.activeModule === "weapons") {
            // ... existing weapons body ...
        } else if (state.activeModule === "houses") {
            // ... houses body from above ...
        }

        saveState();
        render();
        alert("Prices synced successfully with eRepublik Tools API!");
```

(Remove the now-unused `const isFood = …` line in this function.)

- [ ] **Step 2: Checkpoint**

Run: `node --check app.js` → no output.
Browser: on the House tab with `node server.js` running, click **Sync Live Prices**. Expected: success alert; House Prices Q1–Q5 update to live market values (Q1 in the tens of thousands), HRM Price updates (~1500+). On network failure the existing catch shows the failure alert and manual values persist.

---

### Task 8: Region/country modifier sync for houses (best-effort)

**Files:**
- Modify: `app.js` — `syncRegionModifiers()` (~line 292).

This generalizes the food/weapons-only scraper to three modules. The construction industry token/id and house-RM resource IDs are **unverified guesses** (`HOUSE` / `4` / resources `11`–`15`); if the live markup differs, the function leaves defaults and the user enters modifiers manually — it must never throw.

- [ ] **Step 1: Replace the food/weapons-only config with a 3-module config map**

Replace this block:

```javascript
    const isFood = state.activeModule === "food";
    const industryId = isFood ? "1" : "2";
    const industryToken = isFood ? "FOOD" : "WEAPON";
    const resourceRegexStr = isFood ? 'data-resourceId="([1-5])"' : 'data-resourceId="(6|7|8|9|10)"';
```

with:

```javascript
    const moduleSyncCfg = {
        food:    { industryId: "1", industryToken: "FOOD",   resourceRegexStr: 'data-resourceId="([1-5])"',        maxQuality: 7 },
        weapons: { industryId: "2", industryToken: "WEAPON", resourceRegexStr: 'data-resourceId="(6|7|8|9|10)"',   maxQuality: 7 },
        houses:  { industryId: "4", industryToken: "HOUSE",  resourceRegexStr: 'data-resourceId="(11|12|13|14|15)"', maxQuality: 5 }
    };
    const cfg = moduleSyncCfg[state.activeModule] || moduleSyncCfg.food;
    const industryId = cfg.industryId;
    const industryToken = cfg.industryToken;
    const resourceRegexStr = cfg.resourceRegexStr;
    const maxQuality = cfg.maxQuality;
```

- [ ] **Step 2: Bound the pollution-parsing loops by `maxQuality`**

In `syncRegionModifiers()` the pollution object is built with `const qPollution = { 0: 0, 1: 0, ... 7: 0 };` and two loops `for (let q = 0; q <= 7; q++)`. Replace the hard-coded `7` in **both** pollution loops with `maxQuality`, and build the object dynamically:

```javascript
        const qPollution = {};
        for (let q = 0; q <= maxQuality; q++) qPollution[q] = 0;
```

(The two `for (let q = 0; q <= 7; q++)` pollution loops become `for (let q = 0; q <= maxQuality; q++)`.)

- [ ] **Step 3: Checkpoint**

Run: `node --check app.js` → no output.
Browser: on the House tab, pick a Holding Country + Region. Expected: it attempts a sync and never crashes the page. If construction markup is found, Country Construction Bonus / Region / Pollution populate; if not, values stay at defaults and can be edited manually (status reflects sync result). Food/Weapon location sync still works exactly as before.

---

### Task 9: Final end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Persistence + migration**

In the browser console run `localStorage.getItem("erep_calculator_food_factories_v9")` after configuring the House tab. Expected: JSON includes a `houses` object with `factories`/`rm` `{companies,workers}` per quality and `hrmPrice`. Reload the page — House tab values persist. Confirm no `…_v8` key is read (old state ignored).

- [ ] **Step 2: Cross-tab integrity**

Configure all three tabs with different values, switch between them repeatedly. Expected: each tab keeps its own state; Food/Weapon math/labels are unchanged from before this feature; the Work Tax control and Q6/Q7 price rows appear on Food/Weapon and are hidden on Houses; KPI labels switch correctly ("Daily Work Tax" ↔ "Daily Salary Cost", "Total Factories:" ↔ "Total Companies:").

- [ ] **Step 3: Spec cross-check**

Re-read `docs/superpowers/specs/2026-05-30-houses-module-design.md` §2–§5 and confirm each is implemented: Q1–Q5 data + max employees (factories 1/2/3/5/10, HRM 1/2/3/4/5); `output = base × mult × workers`; `hrmUsed = baseRM × mult × workers`; salary-only labor; Option A/B strategy; v9 storage; `renderHouses()` separation.

- [ ] **Step 4: Done**

All checkboxes ticked, `node --check app.js` clean, browser scenario in Task 5 matches expected numbers.
