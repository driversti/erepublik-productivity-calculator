# Region Production-Bonus "Regions" Tab — Design

**Date:** 2026-05-31
**Status:** Approved (brainstorming) — data layer already implemented

## Goal

Add a read-only **Regions** tab to the calculator that helps the player decide
**where to base production**. For a chosen industry it lists the regions whose
natural resources give the highest production bonus, ranked globally and
filterable by country. The data is a one-time static snapshot of the eRepublik
world map — no live fetching.

## Background

A region's production bonus for an industry equals the **sum of the bonuses of
that industry's resources present in the region** (e.g. Dobrogea =
Magnesium 10 + Cobalt 25 + Titanium 15 + Wolfram 20 = **+70% aircraft RM**).
Resource placement is geographically fixed, so this ranking is genuinely static.
Only *ownership* (`currentCountry`) drifts as regions change hands in war; the
snapshot records that ownership for reference but it may go stale.

This differs from the existing `services/regions.ts`, which live-scrapes
*country-level* bonuses and pollution — that stays untouched. This feature is a
new, separate, static dataset.

## Decisions (locked during brainstorming)

| Question | Decision |
|----------|----------|
| What "best regions" shows | **Global ranking + per-country filter** (the filter is the per-country view) |
| Interaction model | **Passive reference** — read-only; no integration with calculator modifier fields |
| Placement | **New top-level `Regions` tab** (separate from the calculators), with its own industry switcher |
| List size | **All regions** that carry the industry's resources, sorted desc by total bonus, with a country filter |
| Country attribution | Store **both** `originalCountry` (stable) and `currentCountry` (snapshot, may be stale) |
| Raw source | Trimmed once; **raw `resources.json` deleted** — only the slim dataset is committed |
| Pipeline | **Build-time trim → committed static module → runtime ranking** (no precomputed rankings; sorting 221 rows is trivial) |

## Architecture

```
src/
├── data/
│   └── regionResources.ts        # ✅ DONE — committed static dataset (221 regions)
├── regions/
│   └── ranking.ts                # NEW — pure ranking helper (outside calc/, golden-test untouched)
├── views/
│   └── RegionsView/              # NEW — the tab UI
│       ├── RegionsView.tsx
│       └── RegionsView.test.tsx
├── App.tsx                       # add 'regions' to the tab router
└── i18n/locales/<loc>/common.json # add a `regions` block (no new namespace)
```

### 1. Data layer — `src/data/regionResources.ts` (DONE)

Already generated and committed (`feat(data): add static region production-bonus dataset`).

```ts
export const SNAPSHOT_DATE = "2026-05-31";
export type Industry = "food" | "weapons" | "houses" | "aircraft";
export interface RegionResource { name: string; industry: Industry; bonus: number; }
export interface RegionEntry {
  id: number; name: string;
  originalCountry: string; currentCountry: string;
  resources: RegionResource[];
}
export const COUNTRY_FLAGS: Record<string, string>;   // country name -> flag URL (deduped)
export const REGION_RESOURCES: RegionEntry[];          // 221 regions, sorted by id
```

Trimming dropped: the 353 resourceless regions, coordinates/bbox/area/population,
city, past/active battle info, resource image paths and ids. `weapon`/`house`
were mapped to `weapons`/`houses` to match the calculator's industry keys.

### 2. Ranking — `src/regions/ranking.ts` (pure)

Kept **outside** `calc/` so the golden-parity snapshot is never at risk.

```ts
export interface RankedRegion {
  region: RegionEntry;
  totalBonus: number;                 // Σ bonus of this industry's resources
  matched: RegionResource[];          // the contributing resources (for the chips)
}
export function rankRegions(
  industry: Industry,
  opts?: { country?: string },        // matches currentCountry; undefined = all
): RankedRegion[];                     // sorted desc by totalBonus, then region name
```

Logic: filter regions that contain ≥1 resource of `industry`; sum those bonuses;
optional country filter on `currentCountry`; stable sort by `totalBonus` desc,
tie-break by `name` asc.

### 3. UI — `src/views/RegionsView/RegionsView.tsx`

- **Industry switcher** — 4 options (food / weapons / houses / aircraft), styled
  like the existing tab buttons; local `useState`, default `food`.
- **Country filter** — dropdown built from the distinct `currentCountry` values
  present for the selected industry, plus an "All" option; local `useState`.
- **List** — one row per ranked region:
  `rank · region name · flag + country · total bonus % · resource chips`
  (e.g. `Magnesium +10`, `Cobalt +25`). Flag from `COUNTRY_FLAGS`.
- **Header note** — shows `SNAPSHOT_DATE` and a caption that `currentCountry`
  reflects ownership at snapshot time and may be stale.
- **No persistence** — the tab's selection state is local component state; it does
  not touch the reducer or `localStorage`, so no persistence-version bump.

### 4. Router — `src/App.tsx`

Add `'regions'` to the `activeModule` union and the tab bar; render `RegionsView`
when active. The Regions tab does not participate in the food/weapons/houses/
aircraft/holdings calculation state.

### 5. i18n

Add a `regions` block to the **`common`** namespace (already loaded for every
locale) rather than introducing a new namespace across all 24 locales. Strings:
tab label, industry-switcher labels (reuse existing industry names where
possible), country-filter "All" label, column headers, the snapshot/staleness
note. **Country names** render through the existing `i18n/names.ts` helper.
**Region and resource names stay literal** (game-canonical English, like
"Tycoon") — not translated.

## Data flow

```
REGION_RESOURCES (static) ─▶ rankRegions(industry, {country}) ─▶ RankedRegion[]
                                                                   │
RegionsView (local state: industry, country) ──────────────────────┘ renders rows
COUNTRY_FLAGS ─▶ flag <img> per row
```

## Error handling

Pure, bundled data — no network, no async, no failure modes. Edge cases:
- Industry with regions but country filter yields none → empty-state message.
- Missing flag for a country → render country name without an image (graceful).

## Testing

- **`ranking.test.ts`** (unit): correct bonus summation, desc sort + name
  tie-break, country filter, only matching-industry resources counted, empty
  result for absent country.
- **Data-integrity test**: every `RegionEntry.resources[].industry` ∈ the union
  and every `bonus` ∈ {10,15,20,25,30}; ids unique.
- **`RegionsView.test.tsx`** (component): renders a ranked list, switching
  industry changes rows, country filter narrows rows, empty state shows.
- **i18n test** (existing): every new `common.regions.*` key resolves in every
  locale.

## Out of scope (YAGNI)

- No write-back / "apply to calculator" interaction (explicitly chose passive).
- No precomputed rankings, no live refresh, no regeneration script (raw dump
  removed; refresh = drop a new dump and regenerate by hand).
- No translation of region/resource names.
- No Holdings integration.
