# House Industry Module — Design Spec

**Date:** 2026-05-30
**Project:** eRepublik Productivity / Profit Calculator (`calculator/`)
**Goal:** Add a third tab — **House Industry** — alongside Food and Weapon, computing daily profit from producing and **selling** houses, mirroring the existing modules where possible.

---

## 1. Summary

Houses belong to eRepublik's **construction industry**. They are produced from **House Raw Materials (HRM)** and sold on the market (before activation). The module reuses the food/weapons layout, formula, and buy-vs-produce strategy comparison, with three deliberate differences:

1. Qualities are **Q1–Q5** (not Q7).
2. Construction companies **cannot be worked by the manager (no WAM)** — only **hired employees** produce. Each company has a per-day worker cap. Daily output is driven by **worker count**, not company count.
3. Labor cost = **salary paid to employees only**. Work tax is deducted from the salary and paid by the worker, so it is **not** an employer cost and is excluded from house-module math.

The module optimizes for **production profit (sell houses)**. Self-use / energy-value calculation is explicitly **out of scope**.

---

## 2. Game data (confirmed against wiki)

### House factories (Q1–Q5)

| Q | Name | HRM/house | work/house | `baseOutput` (houses per worker-session @ ×1.0) | `baseRM` (HRM per worker-session @ ×1.0) | max employees |
|---|------|-----------|------------|--------------------------------------------------|-------------------------------------------|---------------|
| Q1 | House Factory (Q1) | 10 | 5 | 0.2 | 2 | 1 |
| Q2 | House Factory (Q2) | 20 | 10 | 0.1 | 2 | 2 |
| Q3 | House Factory (Q3) | 40 | 20 | 0.05 | 2 | 3 |
| Q4 | House Factory (Q4) | 80 | 40 | 0.025 | 2 | 5 |
| Q5 | House Factory (Q5) | 120 | 60 | 0.0166667 | 2 | 10 |

- `baseOutput = 1 / work` — fraction of a house completed per single worker-session at multiplier 1.0.
- `baseRM = HRM_per_house / work = 2` for every quality (HRM consumed per worker-session at ×1.0).

**Validation against wiki build-times** (confirms the model):
- Q5, 10 workers, +100 % bonus (×2.0): `0.0166667 × 2 × 10 = 0.333` houses/day → 1 house / 3 days ✓ (wiki: Q5 = 3 days @ 100 %).
- Q1, 1 worker, +100 % (×2.0): `0.2 × 2 × 1 = 0.4` → 1 house / 2.5 days ✓.

### HRM raw-material companies (Q1–Q5)

| Q | Name | `baseOutput` (individual units @ ×1.0) | marketplace HRM @ ×1.0 (`/100`) | max employees |
|---|------|----------------------------------------|----------------------------------|---------------|
| Q1 | Sand (Q1) | 35 | 0.35 | 1 |
| Q2 | Clay (Q2) | 70 | 0.70 | 2 |
| Q3 | Wood (Q3) | 125 | 1.25 | 3 |
| Q4 | Limestone (Q4) | 175 | 1.75 | 4 |
| Q5 | Granite (Q5) | 250 | 2.50 | 5 |

- Same output pattern as the existing FRM/WRM plantations (`35/70/125/175/250`). Wiki confirms Sand = 0.35 @ 0 % bonus → 0.70 @ 100 %.
- 1 HRM marketplace unit = 100 individual units (same normalization as FRM).

---

## 3. Formula

```
multiplier = 1 + countryBonus/100 + regionBonus/100 + (hasTycoon ? 0.2 : 0) − pollution/100   // floored at 0

# Per quality:
workers ≤ companies × maxEmployees[quality]

# House factory:
output  = baseOutput × multiplier × workers          // houses/day (fraction, 1, or several)
hrmUsed = baseRM     × multiplier × workers           // HRM consumed/day
revenue = output × housePrice[quality] × (1 − vat/100)

# HRM company:
hrmOutput = (baseOutput / 100) × multiplier × workers // marketplace HRM/day

# Labor (employees only — work tax already inside salary, paid by worker):
houseSalaryCost = (Σ house-factory workers)  × averageSalary
hrmSalaryCost   = (Σ HRM-company workers)     × averageSalary
```

Pollution is quality-specific (`qualityPollution[quality]`; index `0` = HRM/raw-material rate), falling back to the flat `pollution` field — same as the existing modules.

### Production notes (wiki-confirmed, House page)

- **No WAM anywhere in construction:** "You can not work as a manager in your House factories or your House raw material companies." → both labor pools are employees-only. Validates the salary-only labor model.
- **Same-quality pooling:** "If a citizen has two or more companies of the same quality, those companies will contribute to building only one House." This affects the build *queue* (work pools into one house at a time), **not** daily throughput — output stays linear in total workers (`total work ÷ work-per-house`), so the formula above is unchanged. We display steady-state daily throughput, not in-progress houses.
- **Only unactivated houses are sellable** ("A House that has been activated can not be sold on the marketplace"). The sell-profit model assumes unactivated houses — consistent.

### Strategy comparison (sidebar)

- **Option A — Buy HRM:** `profit = Σrevenue − (totalHrmUsed × hrmPrice) − houseSalaryCost`
- **Option B — Produce HRM:** `profit = Σrevenue − houseSalaryCost − hrmSalaryCost + netHrmMarket`
  where `netHrmBalance = totalHrmProduced − totalHrmUsed`; if negative → buy the shortfall at `hrmPrice`; if positive → sell surplus at `hrmPrice × (1 − vat/100)`.

`render()` picks the higher-net-profit option for the headline KPIs and highlights it, identically to food/weapons.

---

## 4. State & persistence

`state.activeModule` gains a third value: `"houses"`.

New top-level field: `hrmPrice` (default `1535.00`), parallel to `frmPrice`/`wrmPrice`.

New module block (note the dual `{companies, workers}` per quality, and Q1–Q5 only):

```js
houses: {
  factories: { 1:{companies:0,workers:0}, 2:{…}, 3:{…}, 4:{…}, 5:{…} },
  rm:        { 1:{companies:0,workers:0}, 2:{…}, 3:{…}, 4:{…}, 5:{…} },  // HRM companies
  countryBonus: 100,
  regionBonus: 0,
  pollution: 0,
  qualityPollution: { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 },                    // 0 = HRM rate
  prices: { 1:29000, 2:63500, 3:129850, 4:263498, 5:315999 }              // editable; seeded from live market 2026-05-30
}
```

- `loadState()` / `saveState()` extended to (de)serialize the `houses` block and `hrmPrice`, clamping `companies`/`workers` to integers, and clamping `workers ≤ companies × maxEmployees[q]`.
- **Bump `STORAGE_KEY` `…_v8` → `…_v9`** (breaking state-shape change). Old state is simply not loaded; the app boots with defaults.

---

## 5. UI

- **Nav:** add a third tab button `#tab-houses` ("House Industry") in `.module-nav`, after Weapon. Tab switching flips `activeModule` and re-renders, same as the existing tabs.
- **Cards:** house and HRM cards carry **two counters** each — *Companies* and *Workers* — instead of one. The Workers counter (and its `+`/text input) is capped at `companies × maxEmployees[q]`; raising it past the cap clamps to the cap. A card shows its per-worker output, total daily output, HRM used (factories), max-employee hint, and estimated profit.
- **Sidebar relabeling** (driven in `render()` like the existing food↔weapon label switching):
  - KPI "Daily Work Tax" → **"Daily Salary Cost"** (value = `houseSalaryCost (+ hrmSalaryCost when Option B wins)`).
  - "Work Tax Rate" control is **hidden** on the Houses tab (irrelevant — tax is inside salary).
  - Output/consumed/strategy labels switch to House / HRM wording.
- DOM access stays by hardcoded IDs in `index.html`; new IDs (e.g. `#tab-houses`) are added in lockstep with the JS that reads them.

### Rendering structure

The existing `render()` is tightly coupled to the 7-quality, single-counter, work-tax food/weapons shape. Houses differ enough (5 qualities, dual counters, salary model) that the implementation should use a **dedicated houses render path** (`renderHouses()`), with `render()` delegating when `activeModule === "houses"`. Shared logic (multiplier, strategy comparison shape, currency formatting, `setupListeners()` rebinding contract) is reused, not duplicated where practical. `setupListeners()` is still called at the end of every render cycle (dynamically-created counter buttons depend on it) — the houses path follows the same contract.

---

## 6. Live data (best-effort)

- **Prices** (`syncLivePrices`): fetch from `service.erepublik.tools/api/v1/market/item/0/{industry}/{quality}`. **Confirmed industry IDs: house = `4`, HRM = `17`.** Houses have **no `info.misc` aggregate** → fetch per-quality (Q1–Q5) like weapons and read `offers[0].gross`. HRM read from `offers[0].gross` on `…/0/17/1`. On any failure, manual entry remains authoritative.
- **Region modifiers** (`syncRegionModifiers` / `loadRegionsForCountry`): extend the industry/resource mapping for construction — `industryToken` (e.g. `"HOUSE"`/`"CONSTRUCTION"`), its `industryId`, and the house-RM `data-resourceId` range — **to be determined** against a fresh capture. Each scraper keeps its JSON-first + regex-HTML fallback. Manually editing any modifier de-syncs the location selection (sets status to "Manual"), exactly as today.
- `server.js` allowlist (`www.erepublik.com`, `service.erepublik.tools`) is unchanged — both hosts are already permitted.

---

## 7. Out of scope (YAGNI)

- Energy-value / self-use house calculator.
- Modeling individual employee salaries that differ per worker (single shared `averageSalary` is used).
- Multi-day build scheduling / partial-house carry-over (steady-state daily output is assumed).
- Any change to the existing Food/Weapon math.

---

## 8. Open items to confirm during implementation

- Market industry IDs are **resolved**: house = `4` (per-quality, no `info.misc`), HRM = `17`. Default `houses.prices` and `hrmPrice` are seeded from the live market (2026-05-30) and editable / re-syncable.
- Still **to be determined** (region-modifier HTML scrapers only): the construction `industryToken` / `industryId` and the house-RM `data-resourceId` range on the country-economy / region pages. Manual modifier entry is the guaranteed fallback if scraping fails.
