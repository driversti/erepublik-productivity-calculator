# Aircraft Weapon Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the fourth industry module — Aircraft Weapons — to the calculator at full parity with food/weapons/houses (live price + region/country bonus sync).

**Architecture:** Approach B. Generalize the existing `renderHouses()` into a config-driven `renderHiredLaborModule(moduleKey)` (driven by a `HIRED_LABOR_MODULES` registry) that both `houses` and `aircraft` delegate to. Aircraft reuses the houses labor model (companies + hired workers, no WAM) with the weapons output formula (`output = baseOutput × multiplier × workers`).

**Tech Stack:** Vanilla ES2020 modules, no build/test tooling. `node server.js` serves the app on `http://localhost:8080` and proxies game requests via `/proxy`.

---

## Testing approach (no automated harness)

This project has **no test framework** (per `CLAUDE.md`). "Verify" steps are **manual browser checks** against a running `node server.js`. Keep the server running in a terminal and **hard-reload** (Cmd+Shift+R) after each edit. The critical invariant across the refactor tasks: **the House Industry tab must look and behave exactly as before.** Open DevTools console — any red error is a failure.

Reference data for spot-checks lives in `docs/superpowers/specs/2026-05-30-aircraft-weapon-module-design.md`.

---

## File structure

| File | Responsibility | Changes |
|------|----------------|---------|
| `app.js` | All app logic | data constants, `state.aircraft`/`armPrice`, registry, generalized renderer + helpers, sync, listeners |
| `index.html` | Static shell | one new `tab-aircraft` button |

No new files. CSS classes are reused unchanged (no `styles.css` edits).

---

## Task 1: Aircraft data constants

**Files:**
- Modify: `app.js` (after `houseRawMaterialsData`, ~line 59)
- Modify: `app.js` (`HRM_BUILDING_IDS` block, ~line 82)

- [ ] **Step 1: Add the two data arrays** immediately after the `houseRawMaterialsData` array (after line 59):

```js
// Aircraft Weapon Factories (Q1-Q5). Owner cannot work — hired employees only (like houses).
// baseOutput is flat 5 (quality-independent, like food=100/weapon=10).
// baseRM is in Marketplace Units (1 ARM unit = 100 individual), per-quality like ground weapons.
const aircraftFactoriesData = [
    { quality: 1, name: "Aircraft Weapons Factory (Q1)", baseOutput: 5, baseRM: 1, maxEmployees: 1 },
    { quality: 2, name: "Aircraft Weapons Factory (Q2)", baseOutput: 5, baseRM: 2, maxEmployees: 2 },
    { quality: 3, name: "Aircraft Weapons Factory (Q3)", baseOutput: 5, baseRM: 3, maxEmployees: 3 },
    { quality: 4, name: "Aircraft Weapons Factory (Q4)", baseOutput: 5, baseRM: 4, maxEmployees: 4 },
    { quality: 5, name: "Aircraft Weapons Factory (Q5)", baseOutput: 5, baseRM: 5, maxEmployees: 5 }
];

// Aircraft Raw Material companies. baseOutput is in individual units (÷100 for marketplace ARM units).
const aircraftRawMaterialsData = [
    { quality: 1, name: "Magnesium Refinery (Q1)", baseOutput: 0.35, maxEmployees: 1 },
    { quality: 2, name: "Titanium Refinery (Q2)",  baseOutput: 0.70, maxEmployees: 2 },
    { quality: 3, name: "Wolfram Mine (Q3)",       baseOutput: 1.25, maxEmployees: 3 },
    { quality: 4, name: "Cobalt Plant (Q4)",       baseOutput: 1.75, maxEmployees: 4 },
    { quality: 5, name: "Neodymium Mine (Q5)",     baseOutput: 2.50, maxEmployees: 5 }
];
```

- [ ] **Step 2: Add the ARM building-icon id map** right after the `HRM_BUILDING_IDS` line (~line 82):

```js
const ARM_BUILDING_IDS = { 1: 24, 2: 25, 3: 26, 4: 27, 5: 28 }; // Magnesium … Neodymium
```

- [ ] **Step 3: Verify** — `node server.js`, reload `http://localhost:8080`. App loads, no console errors. (New constants are unused so far.)

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat(aircraft): add aircraft factory + ARM data constants"
```

---

## Task 2: Aircraft state, persistence, and defaults

**Files:**
- Modify: `app.js` — `state` object (after the `houses:` block, ~line 171)
- Modify: `app.js` — `state.armPrice` scalar (near `hrmPrice`, ~line 107)
- Modify: `app.js` — `loadState()` (~lines 195, 251-283)

- [ ] **Step 1: Add `armPrice` scalar** right after the `hrmPrice: 1535.00,` line (~line 107):

```js
    armPrice: 1415.00,
```

- [ ] **Step 2: Add the `aircraft` sub-object** right after the closing `}` of the `houses:` block (after line 171, before the final `};` of `state`). Add a comma after the houses block's closing brace:

```js
    aircraft: {
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
        prices: { 1: 963.00, 2: 900.00, 3: 1485.00, 4: 1800.00, 5: 2179.00 }
    }
```

- [ ] **Step 3: Load `armPrice`** — in `loadState()`, after the `hrmPrice` guard (~line 195):

```js
            if (typeof parsed.armPrice === 'number') state.armPrice = parsed.armPrice;
```

- [ ] **Step 4: Generalize the houses loader to also load aircraft.** In `loadState()`, the block that starts `if (parsed.houses && typeof parsed.houses === 'object') {` (~line 251) currently hardcodes `houses`/`houseFactoriesData`/`houseRawMaterialsData`. Replace that whole block with a loop over both modules:

```js
            // Houses + Aircraft share a shape: {factories{1..5}, rm{1..5}, bonuses, prices}, hired-worker cells.
            [
                { key: 'houses',   facData: houseFactoriesData,    rmData: houseRawMaterialsData },
                { key: 'aircraft', facData: aircraftFactoriesData, rmData: aircraftRawMaterialsData }
            ].forEach(({ key, facData, rmData }) => {
                const pm = parsed[key];
                if (!pm || typeof pm !== 'object') return;
                const loadGroup = (groupKey, data) => {
                    if (pm[groupKey] && typeof pm[groupKey] === 'object') {
                        for (let q = 1; q <= 5; q++) {
                            const src = pm[groupKey][q];
                            if (src && typeof src === 'object') {
                                const row = data.find(x => x.quality === q);
                                const maxEmp = row ? row.maxEmployees : 0;
                                const companies = (typeof src.companies === 'number') ? Math.max(0, Math.floor(src.companies)) : 0;
                                let workers = (typeof src.workers === 'number') ? Math.max(0, Math.floor(src.workers)) : 0;
                                if (workers > companies * maxEmp) workers = companies * maxEmp;
                                state[key][groupKey][q] = { companies, workers };
                            }
                        }
                    }
                };
                loadGroup('factories', facData);
                loadGroup('rm', rmData);
                if (typeof pm.countryBonus === 'number') state[key].countryBonus = pm.countryBonus;
                if (typeof pm.regionBonus === 'number') state[key].regionBonus = pm.regionBonus;
                if (typeof pm.pollution === 'number') state[key].pollution = pm.pollution;
                if (pm.qualityPollution && typeof pm.qualityPollution === 'object') {
                    for (let q = 0; q <= 5; q++) {
                        if (typeof pm.qualityPollution[q] === 'number') state[key].qualityPollution[q] = pm.qualityPollution[q];
                    }
                }
                if (pm.prices && typeof pm.prices === 'object') {
                    for (let q = 1; q <= 5; q++) {
                        if (typeof pm.prices[q] === 'number') state[key].prices[q] = pm.prices[q];
                    }
                }
            });
```

- [ ] **Step 5: Verify** — reload the app. House Industry tab still restores saved counts/prices (set a Q3 house factory to 2 companies, reload, confirm it persists). No console errors. `STORAGE_KEY` stays `v10` (additive change).

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat(aircraft): add aircraft state, armPrice, and persistence"
```

---

## Task 3: Module-aware cell + counter helpers

Make the house cell helpers and counter listeners operate on whichever hired-labor module is active, so the same `.house-counter-*` controls drive aircraft too. Only `houses` is reachable until Task 6, so houses behavior must stay identical.

**Files:**
- Modify: `app.js` — `getHouseCell`, `houseMaxEmployees` (~lines 313-321)

- [ ] **Step 1: Replace `getHouseCell` and `houseMaxEmployees`** (lines 313-321) with module-aware versions that read `state.activeModule`:

```js
function hiredLaborData(kind) {
    const isHouses = state.activeModule === 'houses';
    return kind === 'factory'
        ? (isHouses ? houseFactoriesData : aircraftFactoriesData)
        : (isHouses ? houseRawMaterialsData : aircraftRawMaterialsData);
}

function getHouseCell(kind, quality) {
    return state[state.activeModule][kind === 'factory' ? 'factories' : 'rm'][quality];
}

function houseMaxEmployees(kind, quality) {
    const row = hiredLaborData(kind).find(x => String(x.quality) === String(quality));
    return row ? row.maxEmployees : 0;
}
```

`applyHouseCounterChange` (lines 324-335) is unchanged — it already calls `getHouseCell`/`houseMaxEmployees`.

- [ ] **Step 2: Verify** — reload, House Industry tab. Increment/decrement company + worker counters on a house factory and an HRM company; worker cap still respects `companies × maxEmployees`. No console errors.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "refactor(aircraft): make house cell helpers module-aware"
```

---

## Task 4: Parameterize the card-HTML helpers

Drive the three house card builders from a config object so aircraft can supply its own nouns + icon ids. Houses passes its existing config; output is byte-identical.

**Files:**
- Modify: `app.js` — `houseCounterGroupsHtml`, `houseFactoryCardHtml`, `houseRmCardHtml` (~lines 1146-1219)

- [ ] **Step 1: Add a `cfg` parameter to `houseFactoryCardHtml`** and use it for the icon industry, output noun, and RM noun. Replace the signature and the three literals:

Change signature (line 1162) to:
```js
function houseFactoryCardHtml(fac, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cardHrm, cardProfit, cardRevenue, cfg) {
```
Replace the icon line (1169) `${EREP_CDN}/icons/industry/4/q${fac.quality}.png` with:
```js
            ${gameIconHtml(`${EREP_CDN}/icons/industry/${cfg.factoryIconIndustry}/q${fac.quality}.png`, fallbackSvg)}
```
Replace `} houses</span>` (line 1179) with:
```js
                <span class="stat-value" style="color: var(--erep-blue);">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.productNounPluralCard.toLowerCase()}</span>
```
Replace the "Daily HRM" label + value (lines 1183-1184) with:
```js
                <span class="stat-label">Daily ${cfg.rmNoun}</span>
                <span class="stat-value" style="color: var(--erep-gold);">${cardHrm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.rmNoun}</span>
```

- [ ] **Step 2: Add `cfg` to `houseRmCardHtml`** (line 1195). Change signature to:
```js
function houseRmCardHtml(rm, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cfg) {
```
Replace the building-icon line (1202) `${EREP_CDN}/buildings/${HRM_BUILDING_IDS[rm.quality]}.png` with:
```js
            ${gameIconHtml(`${EREP_CDN}/buildings/${cfg.rmBuildingIds[rm.quality]}.png`, fallbackSvg)}
```
Replace the `} HRM</span>` output line (1212) with:
```js
                <span class="stat-value" style="color:#78909c;">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.rmNoun}</span>
```

`houseCounterGroupsHtml` needs no change (uses generic class names + kind/quality only).

- [ ] **Step 3: Update both call sites in `renderHouses`** to pass a temporary inline cfg (will be replaced by the registry in Task 5; this keeps the app working between commits). At line ~1358:
```js
        card.innerHTML = houseFactoryCardHtml(fac, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cardHrm, cardProfit, cardRevenue, { factoryIconIndustry: 4, productNounPluralCard: "Houses", rmNoun: "HRM", rmBuildingIds: HRM_BUILDING_IDS });
```
At line ~1382:
```js
        card.innerHTML = houseRmCardHtml(rm, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, { rmNoun: "HRM", rmBuildingIds: HRM_BUILDING_IDS });
```

- [ ] **Step 4: Verify** — reload, House Industry tab. Factory cards still show "… houses", "Daily HRM", real house/HRM icons; HRM cards show "… HRM" with Sand→Granite building icons. Identical to before.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "refactor(aircraft): parameterize house card-HTML helpers with cfg"
```

---

## Task 5: Registry + generalized renderer

Introduce the config registry, rename `renderHouses` → `renderHiredLaborModule(moduleKey)`, and route both modules through it. This is the core of Approach B.

**Files:**
- Modify: `app.js` — add `HIRED_LABOR_MODULES` (after `ARM_BUILDING_IDS`, ~line 83)
- Modify: `app.js` — `render()` routing (~line 625)
- Modify: `app.js` — `renderHouses` body (~lines 1221-1490)

- [ ] **Step 1: Add the registry** after `ARM_BUILDING_IDS` (~line 83). The label strings are copied verbatim from the current `renderHouses` (lines 1229-1274); each value below already matches what houses renders today:

```js
const HIRED_LABOR_MODULES = {
    houses: {
        moduleKey: "houses", priceField: "hrmPrice",
        factoriesData: houseFactoriesData, rmData: houseRawMaterialsData,
        rmBuildingIds: HRM_BUILDING_IDS, factoryIconIndustry: 4,
        productNounPlural: "House",            // "House Output:"
        productNounPluralCard: "Houses",       // "+X Houses", "X houses" on cards
        rmNoun: "HRM",
        moduleTitle: "House Industry (Step 1)",
        countryBonusLabel: "Country Construction Bonus",
        factoriesTitle: "Your House Factories",
        factoriesSubtitle: "Set companies + workers (Q1–Q5). Only hired employees produce — no WAM.",
        rmTitle: "Your HRM Companies",
        rmSubtitle: "House Raw Material companies Sand → Granite (Q1–Q5)",
        priceHeader: "House Prices (CC)",
        priceRowLabel: "House",                // "Q{n} House"
        strategyBuyTitle: "Option A: Buy HRM",
        strategyProduceTitle: "Option B: Produce HRM"
    },
    aircraft: {
        moduleKey: "aircraft", priceField: "armPrice",
        factoriesData: aircraftFactoriesData, rmData: aircraftRawMaterialsData,
        rmBuildingIds: ARM_BUILDING_IDS, factoryIconIndustry: 23,
        productNounPlural: "Aircraft Weapon",
        productNounPluralCard: "Aircraft Weapons",
        rmNoun: "ARM",
        moduleTitle: "Aircraft Industry (Step 1)",
        countryBonusLabel: "Country Aircraft Bonus",
        factoriesTitle: "Your Aircraft Weapon Factories",
        factoriesSubtitle: "Set companies + workers (Q1–Q5). Only hired employees produce — no WAM.",
        rmTitle: "Your ARM Companies",
        rmSubtitle: "Aircraft Raw Material companies Magnesium → Neodymium (Q1–Q5)",
        priceHeader: "Aircraft Weapon Prices (CC)",
        priceRowLabel: "Aircraft",             // "Q{n} Aircraft"
        strategyBuyTitle: "Option A: Buy ARM",
        strategyProduceTitle: "Option B: Produce ARM"
    }
};
```

- [ ] **Step 2: Rename the function and bind cfg.** Change `function renderHouses() {` (line 1221) to:
```js
function renderHiredLaborModule(moduleKey) {
    const cfg = HIRED_LABOR_MODULES[moduleKey];
```
Then change line 1222 `setActiveTabHighlight("houses");` to:
```js
    setActiveTabHighlight(moduleKey);
```
And line 1224 `const h = state.houses;` to:
```js
    const h = state[moduleKey];
```
And line 1225 `const hrmPrice = state.hrmPrice;` to:
```js
    const rmPrice = state[cfg.priceField];
```

- [ ] **Step 3: Replace every hardcoded label literal in the body** (lines 1229-1274) with the cfg value. Apply these exact substitutions:

| Current literal (RHS of `.textContent =`) | Replace with |
|---|---|
| `"House Industry (Step 1)"` | `cfg.moduleTitle` |
| `"Country Construction Bonus"` | `cfg.countryBonusLabel` |
| `"HRM Price (CC)"` | `` `${cfg.rmNoun} Price (CC)` `` |
| `"House Prices (CC)"` | `cfg.priceHeader` |
| `` `Q${q} House` `` (price labels) | `` `Q${q} ${cfg.priceRowLabel}` `` |
| `"Your House Factories"` | `cfg.factoriesTitle` |
| `"Set companies + workers (Q1–Q5). Only hired employees produce — no WAM."` | `cfg.factoriesSubtitle` |
| `"Your HRM Companies"` | `cfg.rmTitle` |
| `"House Raw Material companies Sand → Granite (Q1–Q5)"` | `cfg.rmSubtitle` |
| `"House Output:"` | `` `${cfg.productNounPlural} Output:` `` |
| `"HRM Consumed:"` | `` `${cfg.rmNoun} Consumed:` `` |
| `"Daily HRM Cost"` | `` `Daily ${cfg.rmNoun} Cost` `` |
| `"HRM Strategy Comparison"` | `` `${cfg.rmNoun} Strategy Comparison` `` |
| `"HRM Produced:"` | `` `${cfg.rmNoun} Produced:` `` |
| `"HRM Net Balance:"` | `` `${cfg.rmNoun} Net Balance:` `` |
| `"Option A: Buy HRM"` | `cfg.strategyBuyTitle` |
| `"Option B: Produce HRM"` | `cfg.strategyProduceTitle` |
| `"HRM Cost:"` (produce tax label) | `` `${cfg.rmNoun} Cost:` `` |

Leave "Daily Work Tax" and "Total Companies:" as-is (module-independent).

- [ ] **Step 4: Replace remaining `state.houses` / `hrmPrice` references in the body** (lines 1282-1419): change `h.countryBonus`-style refs already use `h` (fine). Replace the four `hrmPrice` usages in the strategy math (cards + Option A/B, lines ~1336, 1395, 1400, 1401) and the price input sync (line 1290) with `rmPrice`. Replace the `data-quality` card render calls to pass `cfg`:
  - Factory call (~1358): append `, cfg` as the final argument to `houseFactoryCardHtml(...)`.
  - RM call (~1382): append `, cfg` as the final argument to `houseRmCardHtml(...)`.
  Also update the breakdown line `+X Houses` (line 1350) to use `${cfg.productNounPluralCard}`.

- [ ] **Step 5: Update the badge text** (lines 1412, 1418): `"Option B: Produce"` → `` `Option B: Produce` `` stays, but for clarity replace with cfg-driven short titles is optional; leave as-is (module-independent wording).

- [ ] **Step 6: Route `render()`.** Replace the houses branch in `render()` (lines 625-628):
```js
    if (state.activeModule === "houses" || state.activeModule === "aircraft") {
        renderHiredLaborModule(state.activeModule);
        return;
    }
```

- [ ] **Step 7: Verify houses regression (critical).** Reload, House Industry tab. Compare against memory of pre-refactor: module title "House Industry (Step 1)", all labels, factory/HRM cards, KPI rows, and Option A/B strategy badge must be **identical**. Set some companies+workers, change HRM price, confirm profit math and badge flip behave as before. Zero console errors. (Aircraft tab does not exist yet — that's Task 6.)

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "refactor(aircraft): generalize renderHouses into renderHiredLaborModule"
```

---

## Task 6: Aircraft tab (UI + switching)

**Files:**
- Modify: `index.html` (~line 36)
- Modify: `app.js` — `setActiveTabHighlight` (~line 385), tab listeners (~line 1526)

- [ ] **Step 1: Add the tab button** in `index.html` after the `tab-houses` button (line 36):
```html
            <button class="nav-tab" id="tab-aircraft">Aircraft Industry</button>
```

- [ ] **Step 2: Register the tab in the highlighter.** In `setActiveTabHighlight` (line 385), extend the array:
```js
    [['food', 'tab-food'], ['weapons', 'tab-weapons'], ['houses', 'tab-houses'], ['aircraft', 'tab-aircraft']].forEach(([m, id]) => {
```

- [ ] **Step 3: Add the tab click listener.** In `setupListeners`, right after the `tab-houses` listener block (ends ~line 1538), add:
```js
    const tabAircraft = document.getElementById("tab-aircraft");
    if (tabAircraft) {
        tabAircraft.onclick = function() {
            if (state.activeModule !== "aircraft") {
                state.activeModule = "aircraft";
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

- [ ] **Step 4: Verify** — reload. Click "Aircraft Industry". Tab highlights; module title shows "Aircraft Industry (Step 1)"; 5 aircraft factory cards (Q1–Q5, max workers 1/2/3/4/5) and 5 ARM cards (Magnesium→Neodymium) render with real icons. **Spot-check formula:** 1 company + 1 worker on the Q5 factory, Country Bonus 100, Region 0, no Tycoon, pollution 0 → Daily Output **10.00 aircraft weapons**, Daily ARM **10.00**. Increment counters; caps respected. No console errors.

- [ ] **Step 5: Commit**

```bash
git add app.js index.html
git commit -m "feat(aircraft): add Aircraft Industry tab and module switching"
```

---

## Task 7: Region/country bonus sync + price-input wiring

**Files:**
- Modify: `app.js` — `moduleSyncCfg` (~line 492)
- Modify: `app.js` — grain-price input handler (~line 1786-1794)
- Modify: `app.js` — reset handler (~line 1961)

- [ ] **Step 1: Add aircraft to `moduleSyncCfg`** (after the `houses:` line, ~492):
```js
        aircraft: { industryId: "23", industryToken: "AIRCRAFT", resourceRegexStr: 'data-resourceId="(16|17|18|19|20)"', maxQuality: 5 }
```
(Add a comma after the `houses` entry.) The rest of `syncRegionModifiers` is already generic — it writes to `state[state.activeModule]`.

- [ ] **Step 2: Wire the ARM price input.** In the grain-price `onchange` handler, replace the default fallback (line 1786) and the module branch (1788-1794):
```js
            if (isNaN(val) || val < 0) {
                val = state.activeModule === "houses" ? 1535.00
                    : state.activeModule === "aircraft" ? 1415.00 : 50.00;
            }
            if (state.activeModule === "food") {
                state.frmPrice = val;
            } else if (state.activeModule === "weapons") {
                state.wrmPrice = val;
            } else if (state.activeModule === "houses") {
                state.hrmPrice = val;
            } else {
                state.armPrice = val;
            }
```
(The per-quality `.food-price-input` handler at line 1829 already writes `state[active].prices[quality]` — works for aircraft unchanged.)

- [ ] **Step 3: Extend the reset handler** to cover aircraft. In `btn-reset-all.onclick`, change the `if (active === "houses")` branch (line 1961) to `if (active === "houses" || active === "aircraft")` and make the hardcoded `state.houses` / `state.hrmPrice` / houses-price-defaults module-aware:
```js
    if (active === "houses" || active === "aircraft") {
        const m = state[active];
        for (let q = 1; q <= 5; q++) {
            m.factories[q] = { companies: 0, workers: 0 };
            m.rm[q] = { companies: 0, workers: 0 };
        }
        m.countryBonus = 100;
        m.regionBonus = 0;
        m.pollution = 0;
        m.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (active === "houses") {
            m.prices = { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 };
            state.hrmPrice = 1535.00;
        } else {
            m.prices = { 1: 963.00, 2: 900.00, 3: 1485.00, 4: 1800.00, 5: 2179.00 };
            state.armPrice = 1415.00;
        }
        state.hasTycoon = false;
        state.averageSalary = 0.0;
        state.selectedCountryId = "";
        state.selectedRegionPermalink = "";
        state.vat = 1.0;
        // ...existing syncStatus/regionSelect reset lines below stay unchanged...
```
Keep the remaining lines of that branch (the `syncStatusH` / `regionSelectH` reset, lines 1977-1980) as they are.

- [ ] **Step 4: Verify** — Aircraft tab. Pick a country + region in the location dropdowns. Confirm the country **Aircraft** bonus, summed region resource bonus, and pollution populate (sync status turns green). Edit the ARM price manually → sync status flips to "Manual" and country/region clear. Click Reset → aircraft state clears to defaults. No console errors.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat(aircraft): region/country bonus sync + ARM price wiring + reset"
```

---

## Task 8: Live market price sync

**Files:**
- Modify: `app.js` — `syncLivePrices()` (after the `houses` branch, ~line 1943)

- [ ] **Step 1: Add the aircraft branch** to `syncLivePrices`, right after the `else if (state.activeModule === "houses") { … }` block closes (line 1943), before the closing of the `try`:
```js
        } else if (state.activeModule === "aircraft") {
            // Aircraft: industry 23 (per-quality, no info.misc); ARM: industry 24 (Q1 only)
            const aircraftRequests = [1, 2, 3, 4, 5].map(q =>
                fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/23/${q}`))
            );
            const armRequest = fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/24/1`));
            const [armRes, ...aircraftResponses] = await Promise.all([armRequest, ...aircraftRequests]);

            if (armRes.ok) {
                const armData = await armRes.json();
                if (armData.status === "ok" && armData.offers && armData.offers.length > 0) {
                    state.armPrice = armData.offers[0].gross;
                }
            }
            for (let i = 0; i < aircraftResponses.length; i++) {
                const q = i + 1;
                const res = aircraftResponses[i];
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "ok" && data.offers && data.offers.length > 0) {
                        state.aircraft.prices[q] = data.offers[0].gross;
                    }
                }
            }
        }
```

- [ ] **Step 2: Verify** — Aircraft tab, click "Sync Live Prices". Success alert; the five aircraft Q1–Q5 price inputs and the ARM price input update to live market grosses (non-zero). Profit KPIs recompute. No console errors. (Cross-check one value against `curl -s "https://service.erepublik.tools/api/v1/market/item/0/23/5"`.)

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat(aircraft): live market price sync (industry 23 + ARM 24)"
```

---

## Task 9: Full end-to-end verification & docs

**Files:**
- Modify: `kb/Production_Calculations.md` (the "no aircraft module" caveat, line ~60)

- [ ] **Step 1: Regression sweep.** With `node server.js` running, click through all four tabs in order. For each: labels correct, cards render, no console errors, profit math sane. Confirm Food/Weapons (WAM toggle visible) and Houses/Aircraft (WAM + work-tax groups hidden) each behave correctly.

- [ ] **Step 2: Aircraft acceptance checks** (from the spec's Testing section):
  - Q5 factory, 1 company / 1 worker, bonus 100 / region 0 / no tycoon / pollution 0 → output 10.00, ARM 10.00.
  - Strategy: set ARM price very high → Option A (Buy) wins; very low → Option B (Produce) wins; badge + KPIs consistent with the per-card breakdown.
  - Persistence: set counts + prices, reload → restored. Load a pre-aircraft `v10` localStorage blob (or clear the `aircraft` key) → no crash, defaults applied.

- [ ] **Step 3: Update the KB caveat.** In `kb/Production_Calculations.md`, the note at ~line 60 says "The **Aircraft** industry has no module in the calculator at all." Replace that sentence with:
```
The **Aircraft** industry now has a module in the calculator (`renderHiredLaborModule('aircraft')`, added 2026-05-30) — houses labor model + weapons output formula. Houses still uses the simpler per-card multiplication in `renderHiredLaborModule` (the `Math.round(200 * houseProduction)` game formula remains unapplied to both).
```

- [ ] **Step 4: Final commit**

```bash
git add kb/Production_Calculations.md
git commit -m "docs(aircraft): note aircraft module now exists in the calculator"
```

---

## Self-review notes

- **Spec coverage:** data (T1), state/persistence (T2), generalized renderer (T3–T5), tab/switching (T6), region+price wiring (T7), live price sync (T8), verification + docs (T9). All spec sections mapped.
- **Type consistency:** `cfg` fields (`factoryIconIndustry`, `productNounPlural`, `productNounPluralCard`, `rmNoun`, `rmBuildingIds`, `priceField`, label strings) are defined in the T5 registry and consumed by the T4 card helpers + T5 renderer. `renderHiredLaborModule(moduleKey)` is the single render entry for both modules. `state.aircraft` mirrors `state.houses` shape exactly; `state.armPrice` parallels `state.hrmPrice`.
- **No new tests:** project has no harness; verification is manual + browser-console clean, per `CLAUDE.md`.
