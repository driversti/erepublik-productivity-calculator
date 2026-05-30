# Aircraft Weapon Module — Design

**Date:** 2026-05-30
**Status:** Approved (pending user spec review)
**Goal:** Add the fourth and final industry module — **Aircraft Weapons** — to the eRepublik profit calculator, at full parity with the existing Food / Weapons / Houses modules (live price sync + region/country bonus sync included).

## Background

The calculator has three modules today: `food`, `weapons` (shared `render()`), and `houses` (separate `renderHouses()`). Aircraft weapons are the last missing industry.

Aircraft weapons combine two existing patterns:
- **Labor model = houses:** owner cannot work (no WAM). Production comes only from *hired* employees. State is `{companies, workers}` per quality, split into `factories` + raw-material companies.
- **Output formula = weapons:** `output = baseOutput × multiplier × workers`, with a flat quality-independent `baseOutput` and a per-quality raw-material cost. (Houses use a fractional "houses-completed" output; aircraft produce whole weapons like ground weapons.)

So the module is the **houses structure** with **weapons-style numbers**.

## Verified game data

All values cross-checked against three sources: the eRepublik wiki, the local KB (`~/KnowledgeBase/Erepublik/` + `kb/Production_Calculations.md`), and the user's own working `epc/` aircraft module (`epc/src/components/aircraft/aircraftIndustry.js`).

### Aircraft Weapon Factories (Q1–Q5, hired workers only)

| Q | baseOutput | baseRM (ARM/worker, marketplace units) | maxEmployees |
|---|-----------|----------------------------------------|--------------|
| Q1 | 5 | 1 | 1 |
| Q2 | 5 | 2 | 2 |
| Q3 | 5 | 3 | 3 |
| Q4 | 5 | 4 | 4 |
| Q5 | 5 | 5 | 5 |

`baseOutput` is flat 5 (quality-independent, like food=100 / weapons=10). `baseRM` is in **marketplace units** (1 ARM unit = 100 individual), matching the `weaponFactoriesData.baseRM` convention. Note maxEmployees is **1/2/3/4/5** — NOT the ground-weapons 1/2/3/5/10.

### Aircraft Raw Material companies (Q1–Q5, hired workers only)

| Q | name | baseOutput (individual; ÷100 for marketplace) | maxEmployees | building icon id |
|---|------|-----------------------------------------------|--------------|------------------|
| Q1 | Magnesium Refinery | 0.35 | 1 | 24 |
| Q2 | Titanium Refinery | 0.70 | 2 | 25 |
| Q3 | Wolfram Mine | 1.25 | 3 | 26 |
| Q4 | Cobalt Plant | 1.75 | 4 | 27 |
| Q5 | Neodymium Mine | 2.50 | 5 | 28 |

### Live sync identifiers (all confirmed against the live API/pages on 2026-05-30)

- **Market prices:** aircraft weapon = industry **23** (per-quality Q1–Q5, like weapons; no aggregate `misc` map). ARM = industry **24** (Q1 only, like FRM/WRM/HRM).
- **Country bonus:** `countryProductivityBonuses.byToken.AIRCRAFT` / `.byId["23"]`.
- **Region resource bonus:** `data-resourceId="16|17|18|19|20"` (summed, like houses sums 11–15).
- **Pollution:** `regionPollutionDetails["23"]`.
- **Factory product icon:** `https://www.erepublik.net/images/icons/industry/23/q{1..5}.png` (verified 200).
- **RM building icons:** `https://www.erepublik.net/images/buildings/{24..28}.png` (verified 200).

## Architecture: generalize the houses renderer (Approach B)

`renderHouses()` and a future `renderAircraft()` would be ~200 lines of near-identical code — the exact desync trap `CLAUDE.md` warns about. Instead, **extract the houses renderer into a config-driven `renderHiredLaborModule(moduleKey)`** that both `houses` and `aircraft` delegate to. The refactor must keep houses behavior byte-for-byte identical.

### 1. Module config registry

A single source of per-module constants and label strings:

```js
const HIRED_LABOR_MODULES = {
  houses: {
    factoriesData: houseFactoriesData,
    rmData: houseRawMaterialsData,
    rmBuildingIds: HRM_BUILDING_IDS,      // {1:17,...}
    factoryIconIndustry: 4,
    priceField: "hrmPrice",
    productNoun: "House",                 // "House Output:", "+X Houses"
    productNounPlural: "Houses",
    rmNoun: "HRM",                        // "HRM Price (CC)", "HRM Consumed:", ...
    countryBonusLabel: "Country Construction Bonus",
    factoriesTitle: "Your House Factories",
    rmTitle: "Your HRM Companies",
    rmSubtitle: "House Raw Material companies Sand → Granite (Q1–Q5)",
    moduleTitle: "House Industry (Step 1)",
    tabId: "tab-houses",
  },
  aircraft: {
    factoriesData: aircraftFactoriesData,
    rmData: aircraftRawMaterialsData,
    rmBuildingIds: ARM_BUILDING_IDS,      // {1:24,2:25,3:26,4:27,5:28}
    factoryIconIndustry: 23,
    priceField: "armPrice",
    productNoun: "Aircraft Weapon",
    productNounPlural: "Aircraft Weapons",
    rmNoun: "ARM",
    countryBonusLabel: "Country Aircraft Bonus",
    factoriesTitle: "Your Aircraft Weapon Factories",
    rmTitle: "Your ARM Companies",
    rmSubtitle: "Aircraft Raw Material companies Magnesium → Neodymium (Q1–Q5)",
    moduleTitle: "Aircraft Industry (Step 1)",
    tabId: "tab-aircraft",
  },
};
```

(Exact label set finalized during implementation against every `getElementById(...).textContent = ...` line in current `renderHouses`.)

### 2. New data constants (top of `app.js`)

```js
const aircraftFactoriesData = [
  { quality: 1, name: "Aircraft Weapons Factory (Q1)", baseOutput: 5, baseRM: 1, maxEmployees: 1 },
  { quality: 2, name: "Aircraft Weapons Factory (Q2)", baseOutput: 5, baseRM: 2, maxEmployees: 2 },
  { quality: 3, name: "Aircraft Weapons Factory (Q3)", baseOutput: 5, baseRM: 3, maxEmployees: 3 },
  { quality: 4, name: "Aircraft Weapons Factory (Q4)", baseOutput: 5, baseRM: 4, maxEmployees: 4 },
  { quality: 5, name: "Aircraft Weapons Factory (Q5)", baseOutput: 5, baseRM: 5, maxEmployees: 5 },
];
const aircraftRawMaterialsData = [
  { quality: 1, name: "Magnesium Refinery (Q1)", baseOutput: 0.35, maxEmployees: 1 },
  { quality: 2, name: "Titanium Refinery (Q2)",  baseOutput: 0.70, maxEmployees: 2 },
  { quality: 3, name: "Wolfram Mine (Q3)",       baseOutput: 1.25, maxEmployees: 3 },
  { quality: 4, name: "Cobalt Plant (Q4)",       baseOutput: 1.75, maxEmployees: 4 },
  { quality: 5, name: "Neodymium Mine (Q5)",     baseOutput: 2.50, maxEmployees: 5 },
];
const ARM_BUILDING_IDS = { 1: 24, 2: 25, 3: 26, 4: 27, 5: 28 };
```

### 3. State

Add a `state.aircraft` sub-object structurally identical to `state.houses` (`factories{1..5}`, `rm{1..5}`, `countryBonus`, `regionBonus`, `pollution`, `qualityPollution{0..5}`, `prices{1..5}`), plus a top-level `state.armPrice`.

```js
armPrice: 1415.00,            // live ARM Q1 gross at design time
aircraft: {
  factories: { 1:{companies:0,workers:0}, …, 5:{…} },
  rm:        { 1:{companies:0,workers:0}, …, 5:{…} },
  countryBonus: 100, regionBonus: 0, pollution: 0,
  qualityPollution: { 0:0,1:0,2:0,3:0,4:0,5:0 },
  prices: { 1:963, 2:900, 3:1485, 4:1800, 5:2179 },   // live grosses at design time
},
```

**STORAGE_KEY:** stays `v10`. Adding `aircraft`/`armPrice` is purely additive — `loadState()` guards every field, and the initial `state` supplies defaults when a stored blob predates aircraft. No breaking shape change → no version bump.

### 4. `loadState()`

Generalize the existing houses loader to run for both `houses` and `aircraft` (loop over `["houses","aircraft"]`), using the registry's `factoriesData`/`rmData` for per-quality maxEmployees clamping. Add `armPrice` to the scalar-field guards.

### 5. Module-aware cell helpers

`getHouseCell()`, `applyHouseCounterChange()`, `houseMaxEmployees()` currently hardcode `state.houses` / `houseFactoriesData`. Make them read `state.activeModule` and pull data from the registry, so the shared counter listeners drive whichever module is active. (Renaming to `getHiredLaborCell` etc. is optional polish; keeping names is fine to minimize churn.)

### 6. `renderHiredLaborModule(moduleKey)`

Rename `renderHouses` → `renderHiredLaborModule(moduleKey)`, replacing every hardcoded `state.houses` with `state[moduleKey]`, `state.hrmPrice` with `state[cfg.priceField]`, and each literal label/icon with the registry value. The math is unchanged — it already matches aircraft exactly (`singleOutput = baseOutput × mult`, `cardRm = baseRM × mult × workers`, Option A/B strategy comparison, per-card profit `revenue − rmCost − salary − tax`). Card HTML helpers (`houseFactoryCardHtml`, `houseRmCardHtml`, `houseCounterGroupsHtml`) take `cfg` for nouns + icon ids; CSS class names stay as-is (no style changes).

### 7. `render()` routing

```js
if (state.activeModule === "houses" || state.activeModule === "aircraft") {
  renderHiredLaborModule(state.activeModule);
  return;
}
```

### 8. UI tab (index.html)

Add `<button class="nav-tab" id="tab-aircraft">Aircraft Industry</button>` after `tab-houses`. Extend `setActiveTabHighlight()`'s tab list and add a `tab-aircraft` onclick listener mirroring the houses tab (switch `activeModule`, then `syncRegionModifiers()` if a location is selected, else `render()`).

### 9. Live sync

- **`moduleSyncCfg`** (in `syncRegionModifiers`): add
  `aircraft: { industryId: "23", industryToken: "AIRCRAFT", resourceRegexStr: 'data-resourceId="(16|17|18|19|20)"', maxQuality: 5 }`.
  The rest of the scraper (country bonus, region bonus sum, pollution, work tax, salary) is already generic.
- **`syncLivePrices()`**: add an aircraft block — fetch industry 23 per-quality Q1–Q5 → `state.aircraft.prices[q]` (mirroring the weapons per-quality loop), and industry 24 Q1 → `state.armPrice` (mirroring the HRM fetch). Guarded the same way the existing blocks are.
- Price reset/default helpers: include `armPrice` default (1415).

### 10. Behaviors preserved

- Manually editing any price/modifier still clears country/region and flips sync status to "Manual" (logic already generic).
- `setupListeners()` re-runs at the end of every render — aircraft counter buttons rebind each cycle via the shared `.house-counter-*` selectors.
- Work-tax and WAM input groups stay hidden in the aircraft view (no WAM), same as houses.

## Out of scope

- No change to the food/weapons shared `render()` math.
- No new rounding model — aircraft mirrors the current houses output handling (the per-company `gameRawProduction` truncation noted in memory is a pre-existing cross-module concern, not introduced or fixed here).
- No persistence migration beyond additive fields.

## Testing / verification

The project has no test harness. Verify manually via `node server.js` → `http://localhost:8080`:

1. **Houses regression** — switch to House Industry; confirm every label, card, KPI, and the Option A/B strategy badge render exactly as before the refactor (the generalization must not change houses).
2. **Aircraft basics** — Aircraft tab appears and highlights; factory + ARM cards render with correct names, icons, and max-worker caps (Q3 factory caps workers at 3×companies; Neodymium at 5×companies).
3. **Formula spot-check** — 1 company + 1 worker Q5 factory at countryBonus 100 / region 0 / no tycoon / no pollution → multiplier 2.0 → output 10 aircraft weapons, ARM used 10. Cross-check against `epc` for the same inputs.
4. **Strategy comparison** — set ARM price high vs low; confirm Option A (buy ARM) vs Option B (produce ARM) headline flips and the badge/KPIs stay consistent with the per-card breakdown.
5. **Live sync** — pick a country/region; confirm country `AIRCRAFT` bonus, summed region resource bonus (16–20), and pollution populate; click price sync and confirm Q1–Q5 aircraft prices + ARM price update.
6. **Persistence** — set counts/prices, reload; aircraft state restored. Load with a pre-aircraft `v10` blob; no crash, aircraft defaults applied.
