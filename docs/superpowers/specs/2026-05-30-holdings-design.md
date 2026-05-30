# Holdings Mode — Design Spec

**Date:** 2026-05-30
**Status:** Approved-pending-review
**Project:** eRepublik Productivity / Profit Calculator (`calculator/`)

## Problem

The calculator is organized **by industry**: four tabs (Food / Weapons / Houses / Aircraft),
each tab carrying its **own** location (country + region) and its own modifiers. This is the
common case, because players usually build a holding in a region tuned for one industry (best
bonuses).

But occasionally a single region has high bonuses for **two** industries (e.g. food + weapons,
or weapons + houses), so a player puts companies of **different industries into one holding**.
In eRepublik a holding company lives in **one region**, and every company inside it shares that
location. The per-industry tabs cannot express "these mixed-industry companies share one
location, show me their combined profit." This feature adds that.

## Goal

Let the user create named **holdings**, each pinned to **one location**, containing a mix of
companies across all four industries, and see the holding's **combined productivity and daily
profit** — with each industry's productivity computed using **that region's bonuses for that
specific industry**.

## Game mechanics (authoritative constraints)

- A holding occupies **one region**. All its companies use that region's location data.
- Productivity is **per-industry** even within one region:
  - **Country bonus** is per industry (by token: `FOOD`/`WEAPON`/`HOUSE`/`AIRCRAFT`).
  - **Region resource bonus** is the sum of the region's bonuses for that industry's resources
    (food = resources 1–5, weapons = 6–10, houses = 11–15, aircraft = 16–20).
  - **Pollution** is per industry **and** per quality (index 0 = raw-material rate).
- **Work tax** and **average salary** are country-wide (same for every industry in the holding).
- **VAT** is per-industry (per country).
- **WAM (Work as Manager)** applies to food/weapons only; houses/aircraft have no WAM (hired
  workers only). This rule is unchanged and applies inside holdings too.

These mirror the existing `render()` / `renderHiredLaborModule()` / `syncRegionModifiers()` math.

## Decisions (from brainstorming)

1. **Coexistence:** keep the four industry tabs **unchanged**; **add** a fifth `🗂️ Holdings`
   tab. Multiple named holdings, switchable. Industry-tab company counts and holding company
   counts are **independent** datasets.
2. **Profit math:** **actual configuration only** — no buy-vs-produce strategy comparison.
   For each industry: factories + the holding's own RM/plantation companies; the net RM balance
   per RM type is sold (surplus, minus VAT) or bought (deficit) at market.
3. **Layout:** **Variant A** — single screen. One location header on top; industry sections
   stacked one below another (empty industries collapsed); holding summary on the right.
4. **Grand total across holdings:** **No.** Summary reflects the **currently selected holding only**.
5. **Market prices:** **shared/global** (same prices as the industry tabs; one `Sync Live Prices`
   feeds everything). Holdings store only location + company counts, not prices.

## Data model

New top-level state:

```js
state.holdings = [ /* Holding[] */ ];   // empty by default
state.activeHoldingId = null;           // id of the selected holding (or null)
state.activeModule = "food" | "weapons" | "houses" | "aircraft" | "holdings";
```

A `Holding`:

```js
{
  id,                              // stable unique id (e.g. "h" + counter, NOT Date.now — see note)
  name,                            // user-editable label
  selectedCountryId,               // single location for the whole holding
  selectedRegionPermalink,
  workTaxRate,                     // country-wide
  averageSalary,                   // country-wide
  industries: {
    food: {
      1..7: { companies, workers },          // factories per quality
      plantations: { 1..5: { companies, workers } },
      countryBonus, regionBonus,
      qualityPollution: { 0..7 },
      vat
    },
    weapons: { /* same shape as food */ },
    houses: {
      factories: { 1..5: { companies, workers } },
      rm:        { 1..5: { companies, workers } },
      countryBonus, regionBonus,
      qualityPollution: { 0..5 },
      vat
    },
    aircraft: { /* same shape as houses */ }
  }
}
```

**Shared/global (NOT per-holding):** `hasTycoon`, `wamEnabled`, `offeredSalary`, all product
prices (`state.food.prices` … `state.aircraft.prices`) and RM prices
(`frmPrice`/`wrmPrice`/`hrmPrice`/`armPrice`). The holding reads these globals when computing.

> Note: ids are generated from a monotonically increasing counter persisted in state, not
> `Date.now()` (consistency with the no-`Date.now` constraint used elsewhere and to keep ids
> stable/testable).

## Location & auto-sync

When the holding's region is selected, run **one** sync that fetches the
`country/economy/{country}` and `main/region/{region}` pages **once** and parses data for **all
four industries**:

- per-industry `countryBonus` (from `countryProductivityBonuses.byToken`/`byId`),
- per-industry `regionBonus` (sum of `data-resourceId` bonuses for that industry's resource set),
- per-industry `qualityPollution` (from `regionPollutionDetails[industryId]`),
- country-wide `workTaxRate` + `averageSalary`,
- per-industry `vat`.

This generalizes the existing `syncRegionModifiers()` (which today fills only the active module)
into a "fill every industry of this holding" pass, reusing the same regexes/JSON paths and the
`moduleSyncCfg` table. Manual edit of any modifier de-syncs the location → status "Manual"
(unchanged behavior).

## Profit math (per holding)

For each industry present in the holding, reuse the existing per-module formulas, then **sum**:

- `multiplier = max(0, 1 + countryBonus/100 + regionBonus/100 + (tycoon?0.2:0) − pollution/100)`
  (pollution is quality-specific; index 0 for RM/plantations).
- Factory output / RM consumed use the game's rounding helpers (`roundNumber`,
  `gameRawProduction`) exactly as today.
- `sessions = (wamEnabled ? companies : 0) + workers` for food/weapons; houses/aircraft use
  `workers` only (no WAM).
- **Net RM balance** per RM type = produced − consumed. `< 0` → buy deficit × rmPrice;
  `> 0` → sell surplus × rmPrice × (1 − vat/100).
- **Revenue** = Σ(output × productPrice × (1 − vat/100)).
- **Work tax** = (food+weapons WAM sessions) × (workTaxRate/100 × averageSalary). Houses/aircraft
  contribute 0 (no WAM).
- **Salary** = (all hired workers across all industries) × offeredSalary.
- **Industry net** = revenue − RM-net-cost − workTax − salary.
- **Holding net** = Σ industry nets.

This is the same "actual configuration" accounting the tabs already use for their headline KPI;
the holding just runs it for each industry and sums.

## UI (Variant A)

`🗂️ Holdings` tab renders:

- **Holdings control bar:** holding selector (dropdown of names) + `+ New`, `Rename`, `Delete`.
  Creating with no holdings yet shows an empty-state prompt.
- **Location bar:** country + region dropdowns (single location for the holding) + sync status +
  `Sync Live Prices` (shared prices).
- **Industry sections (stacked):** Food, Weapons, Houses, Aircraft. Each section header shows the
  industry's `country/region/pollution` mods for this region; body reuses the existing company
  cards (factory cards with Companies/Workers counters; plantation/RM cards). Industries with
  **zero** companies render **collapsed**.
- **Summary (right):** headline **Net profit / day (this holding)**; then Total companies, Gross
  revenue, RM (net), Work tax, Salaries; then a **per-industry** profit breakdown. No
  across-holdings grand total.

## Persistence & migration

- Bump `STORAGE_KEY` `..._v10` → `..._v11`.
- `loadState()` migrates existing v10 data unchanged; `holdings` defaults to `[]`,
  `activeHoldingId` to `null`. Each loaded holding is validated/clamped the same way module cells
  are (companies 0–9999, workers ≤ companies × maxEmployees).
- `saveState()` serializes the new fields.

## Files touched

- **`index.html`** — add the `tab-holdings` tab button; add holdings-view containers (control
  bar, location bar, stacked-sections container, summary panel). No removal of existing markup.
- **`app.js`** — holdings state + load/save migration; `renderHoldings()`; a "sync all
  industries for this holding" function (generalized `syncRegionModifiers`); holding CRUD
  (create/rename/delete/select); counter listeners scoped to holdings (rebind in the holdings
  render, consistent with the existing "setupListeners at end of render" pattern).
- No new dependencies; browser-native ES2020+, no build step.

## Out of scope (YAGNI)

- Buy-vs-produce strategy comparison inside holdings.
- Grand total across all holdings.
- Per-holding market prices.
- Importing the live list of a player's actual holdings from the game API.
- Moving/duplicating companies between the industry tabs and holdings.
