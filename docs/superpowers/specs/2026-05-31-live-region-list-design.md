# Live Region List (per-country dropdown) — Design

**Date:** 2026-05-31
**Status:** Approved in advance by the user (delegated implementation + deploy; user offline).

## Problem

The country → region dropdowns (industry tabs `ModifiersPanel`, `HoldingsView`
`HoldingLocationBar`) are populated from a **static, stale snapshot**:
`travelData.js` `countries[id].regions` (numeric region ids) joined against the
static `regions` map. That snapshot was captured once and never refreshes, so:

- Regions that changed hands in war are wrong (e.g. Lithuania still "owns"
  New Mexico, Arizona, Victoria, Pacifica, Mazandaran in the snapshot).
- Currently-controlled regions are **missing entirely** — the trigger for this
  work was **Lithuania Minor**, which is absent from the 573-region snapshot
  although the live game shows Lithuania controlling it today.

## Key findings (de-risk the change)

1. **Both dropdowns already key on `permalink`, not id.** The option `value` is
   `r.permalink`; selection stores `selectedRegionPermalink`; the numeric id is
   used only as a React `key` and to look up `{name, permalink}` in the static
   map. So the entire downstream flow (select permalink → scrape
   `/region/{permalink}` for bonuses/pollution) is already permalink-driven and
   **does not change**.
2. **The live fetcher already exists but is dead code.**
   `services/regions.ts` → `fetchRegionList(countryId)` fetches the Country
   Society page via `/proxy` and returns `parseRegionList(html)` →
   `{ name, permalink }[]`. Nothing imports it. `parseRegionList` is already
   fixture-tested.
3. The Society page returns region **name + permalink only** (no numeric id) —
   confirmed live (`HTTP 200` from this host; includes `Lithuania-Minor`).
   permalink is therefore the natural key, which matches finding (1).

## Decision: identity = permalink (option A)

Regions in the picker are identified by **permalink** — the stable natural key
the game uses in URLs and the value the app already persists. No permalink↔id
mapping table is introduced.

## Scope (what changes)

- **`src/data/countries.json`** (already created): 74 countries, `{id, name,
  permalink}` only, sorted by id. The stale `regions: number[]` array is dropped.
- **`src/data/travel.ts`**: source `countries` from `countries.json`; drop
  `regions: number[]` from `CountryEntry`. Keep re-exporting the `regions` map
  from `travelData.js` (still used by `liveEconomy.getRegionDetails` for the
  **optimizer's** region-id → permalink lookup — a separate feature).
- **New `src/state/useRegionList.ts`**: a React hook
  `useRegionList(countryId)` → `{ regions: ParsedRegion[]; loading: boolean;
  error: boolean }`. Calls `fetchRegionList`, with a module-level
  `Map<countryId, ParsedRegion[]>` cache so re-selecting a country is instant.
  Empty list when no country selected.
- **`ModifiersPanel.tsx` / `HoldingLocationBar.tsx`**: replace the static
  `selectedCountry.regions.map(id => regions[id])` with `useRegionList(...)`.
  Region `<select>` is disabled while no country is selected **or** while
  loading; options render from the live list (`value={r.permalink}`,
  label `r.name`). No new i18n keys — reuse the existing `selectRegion`
  placeholder while loading/empty.

## Out of scope (explicitly NOT touched)

- **Profit math** (`src/calc/*`) — golden-parity stays bit-identical. The
  `golden.test.ts` snapshot is the canary.
- **Optimizer / Regions tab** (`regionResources.ts`, `regionData.ts`,
  `runScan.ts`) — keyed by numeric region id, independent of the picker.
- **The region-modifier scrape** (`selectRegion` in `state/hooks.ts`,
  `fetchCountryRegionHtml`) — already permalink-driven, unchanged.

## Data flow (after)

```
country <select>  ──select──▶  useRegionList(countryId)
                                   └─ fetchRegionList → /proxy → society page
                                      → parseRegionList → {name, permalink}[]
region <select>   ──select permalink──▶ hooks.selectRegion(permalink)   [unchanged]
                                          └─ fetchCountryRegionHtml(country, permalink)
                                             → parseRegionModifiers → dispatch bonuses
```

## Error / loading behaviour

- Loading: region select disabled, existing placeholder shown.
- Fetch/proxy error: empty list + `console.error`, select stays enabled with
  placeholder (consistent with the app's other online-only features — prices,
  bonuses). No blocking modal.
- Offline / first paint after reload: list refetches when a persisted
  `selectedCountryId` is present; the persisted `selectedRegionPermalink` value
  shows blank until the list resolves, then its name renders. Acceptable.

## Testing

- `useRegionList` hook test (mock `fetchRegionList`): empty when no country →
  loading → loaded; cache hit on re-select; error path yields empty + `error`.
- Update `ModifiersPanel` / `HoldingLocationBar` tests: region options come from
  a mocked `useRegionList` (no longer from the static map).
- `fetchRegionList` already covered transitively via `parseRegionList`; add a
  thin fetch-wrapper test if missing.
- `golden.test.ts`, calc/state/i18n suites: unchanged, must stay green.
- `npm run build` (tsc --noEmit + vite build) green.

## Deployment

Bump `package.json` version (1.5.2 → 1.5.3), commit to `main`, push origin,
`./release.sh` (host build + buildx multi-arch → Docker Hub
`driversti/erep-calculator:{version,latest}`), then on the GCP VM
(`ssh epc@34.56.7.107`, `~/erep-calculator`) `docker compose pull && docker
compose up -d`. Verify https://epc.yurii.live shows the new region list (spot
check Lithuania → Lithuania Minor present).
