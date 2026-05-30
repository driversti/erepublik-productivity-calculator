# Per-Module Location & Country Metrics — Design

**Date:** 2026-05-30
**Status:** Approved (design phase)
**Project:** eRepublik Productivity Calculator (`app.js`, `index.html`)

## Problem

Country and region selection is **global** (top-level `state.selectedCountryId` /
`state.selectedRegionPermalink`), shared across all four industry modules (food,
weapons, houses, aircraft). In real play each industry usually sits in a
**different region — often a different country**. The per-industry production
bonuses (`countryBonus`, `regionBonus`, `pollution`, `qualityPollution`) are
already stored per-module, but the **location selection** and the
**country-derived economic metrics** (`workTaxRate`, `averageSalary`, `vat`) are
not — so picking a country for one industry wrongly affects the others.

## Goal

Each of the four modules owns its **own independent location** and its **own
country-derived metrics**. Selecting/syncing a location for one industry must not
disturb the other three.

## Decisions

1. **Per-module fields.** Move into each of `state.food` / `state.weapons` /
   `state.houses` / `state.aircraft`:
   - `selectedCountryId`
   - `selectedRegionPermalink`
   - `workTaxRate`
   - `averageSalary`
   - `vat`

   Remove the top-level versions of all five.

2. **Stay global** (not country-dependent — player- or market-level):
   `hasTycoon`, `wamEnabled`, `offeredSalary`, and the RM prices
   `frmPrice` / `wrmPrice` / `hrmPrice` / `armPrice`.

3. **Work Tax Rate, Average Salary, VAT become read-only informational.** They
   are facts of the chosen country, never user-entered. The three inputs
   (`#input-work-tax`, `#input-average-salary`, `#input-vat`) become non-editable
   (disabled/readonly display). Their `onchange` de-sync handlers are removed.
   Only the **Country Bonus slider** and **Region Bonus input** remain editable;
   their manual override still de-syncs the active module's location (unchanged).

4. **VAT is now scraped.** `syncRegionModifiers()` already parses country bonus,
   region bonus, pollution, work tax, and average salary from the country economy
   page. Add **VAT**. VAT is **per-industry**, so its regex must anchor on the
   active module's industry row (Food / Weapon / House / Aircraft) — unlike the
   current work-tax regex which always anchors on "Food" (acceptable for work tax
   because it is country-wide, but wrong for VAT).

5. **Backward-compatible load (no key bump).** Keep `STORAGE_KEY` at `v10`. In
   `loadState()`, if the parsed state still has the legacy top-level
   `selectedCountryId` / `selectedRegionPermalink` / `workTaxRate` /
   `averageSalary` / `vat`, copy each into all four modules that lack it. Existing
   saved state is preserved and upgraded in place.

6. **Tab switch = render from stored state, no network re-sync.** Today switching
   tabs triggers a full network re-sync. With per-module persisted bonuses/metrics
   that is redundant and slow. On switch: repopulate the region dropdown for the
   active module's country (lightweight society-page fetch via
   `loadRegionsForCountry`), then `render()` from stored values. A full sync still
   runs when the user selects a country or region.

## Risks

- **VAT regex brittleness.** No saved economy-page reference exists (only
  `scratch_society_lithuania.html`, which is a *society* page). During
  implementation, capture a live economy page via `/proxy`, build the VAT regex
  against it, and add a JSON-first path with an HTML-regex fallback (matching the
  existing scraper style). Save a `scratch_*economy*.html` reference for future
  regex maintenance. **Fallback:** if VAT cannot be parsed reliably, surface it to
  the user before shipping — do not silently leave VAT at a default.

## Touch Points (`app.js` unless noted)

| Area | Change |
|------|--------|
| `state` init (~155) | Add 5 per-module fields to each module; remove 5 top-level fields |
| `loadState()` (~260) | Load per-module fields; migrate legacy top-level → all modules |
| `syncRegionModifiers()` (~567) | Read `state[active].selected*`; scrape VAT (per-industry anchor); write `workTaxRate`/`averageSalary`/`vat` into `state[active]` |
| `render()` food/weapons (~810) | Dropdowns + work-tax/avg-salary/vat displays read from `state[active]` |
| `renderHiredLaborModule()` houses/aircraft (~1376) | Same per-module reads |
| Country/region select handlers (~1720) | Write to `state[active]` |
| De-sync handlers (~1755) | Country-bonus & region-bonus handlers clear only `state[active]` location. Remove work-tax / avg-salary / vat handlers (now read-only) |
| Tab-switch handlers ×4 (~1595) | Load regions for active module's country; render from stored (no auto re-sync) |
| Reset handlers (~2090, ~2156) | Clear/reset per-module location + metrics for the active module only |
| Bootstrap (~2181) | Load regions for the active module's country |
| `index.html` | Make `#input-work-tax`, `#input-average-salary`, `#input-vat` read-only informational |

## Out of Scope

- Changing how country/region **bonuses** are stored (already per-module).
- The employee-vs-citizenship nuance of work tax (the tool already models work
  tax from the workplace country; per-module-country is consistent and, for the
  GM/WAM case the calculator now uses, defensible).
- Caching region lists across tab switches (one lightweight fetch per switch is
  acceptable).

## Verification

Browser-driven (per existing convention), via localStorage state injection + reload:
1. Set food → country A, weapons → country B with different bonuses/work-tax/VAT;
   confirm each tab shows its own values and switching does not bleed across.
2. Manual country-bonus edit on one module de-syncs only that module.
3. work-tax / avg-salary / vat inputs are non-editable.
4. Legacy v10 state with top-level location loads and migrates into all modules.
