# Live Region-Data Unification — Design

Date: 2026-06-01 · Revised 2026-06-01 (pivot to anonymous Society-page enumeration; map-data/erpk dropped)

## Goal

Make the **Region Profit Optimizer** read region ownership + identity from the
same **live** source the rest of the app already uses, so it reflects wartime
occupation automatically and its numbers match the Industry tab. Eliminate the
hardcoded region datasets that drift apart. Keep everything **anonymous** (no
game session / erpk).

## Background / problem

Two static datasets backed region data and drifted apart:

- `src/data/regionResources.ts` — region `id`, `name`, `currentCountry`
  (snapshot), `resources[].bonus`. The optimizer's candidate universe.
- `travelData.js` — region `id` → `permalink`. Used only by
  `liveEconomy.getRegionDetails`.

Trigger: "Lithuania Minor" (id 663) was in `regionResources` but missing from
`travelData`, so `getRegionDetails` silently skipped it → pollution defaulted to
0 → overestimated Net/day with an "estimate" badge. More broadly, hardcoded
`currentCountry` goes stale as regions change hands in war.

The Industry tab is already live and anonymous: its region dropdown comes from
the **Country Society page** (`useRegionList` → `fetchRegionList` →
`parseRegionList`, keyed by `permalink`, fetched through `/proxy`), and selecting
a region scrapes the live region page (bonus + pollution) and economy page.

## Why not map-data

`/en/main/map-data` returns all regions in one request, BUT (verified live
2026-06-01 with a session): its per-region object exposes `id`, `name`,
population/geo — **no region permalink** (only the owner country's permalink) —
and the endpoint **requires an erpk session**. So it cannot supply the permalink
we need and would force credential management. Rejected.

## The source we use instead: Country Society pages

`/en/country/society/{countryPermalink}` lists the regions a country currently
controls, each with its **name + permalink**, and is fetchable **anonymously**
through `/proxy` (already done by `fetchRegionList`). The union across all 74
countries (`countries.json`) is the full set of currently-owned regions — i.e.
the live world map with authoritative permalinks and current ownership, no
session required.

## Decisions (locked during brainstorming)

1. **Region universe + ownership + permalink** come from the **Country Society
   pages** (anonymous), enumerated across all countries.
2. **Resource bonuses** come from the **static seed** (`regionResources.ts`).
   Bonuses are intrinsic to a region's resources and do **not** change with
   occupation, so a stable snapshot is correct. Joined to live regions by
   `permalink`. The seed is regenerated manually (rarely) when the game adds
   regions.
3. **Pollution + country economics** are fetched **live on demand** from the
   region/economy pages by both screens, using the same parsers — this is what
   makes the screens agree.
4. The universe is **cached server-side** (TTL 30 min, shared across users, with
   an in-flight guard so concurrent misses collapse into one rebuild) so the GCP
   IP makes ~74 anonymous fetches per TTL window, not per user-scan. We always
   enumerate ALL countries — the optimizer scans the whole world, so there is no
   useful subset. The server refreshes it on its own — **no credential needed**.
   (The Industry tab still parses one country per selection on demand, cached by
   `useRegionList` — "parse only what's needed" applies there, not to the
   world-wide optimizer scan.)
5. **`travelData.js` is deleted**; `permalink` is a first-class field of the
   region dataset.
6. **No erpk anywhere.** No stored game session, no admin token, no map-data
   refresh, no scheduler that needs a credential. (The earlier erpk/scheduler/
   admin-token plan is abandoned.)

## Data responsibilities

| Data | Nature | Source |
|---|---|---|
| Region `name`, **`permalink`**, **owner** | volatile (war) | Society pages (anonymous, server-cached universe) |
| Region resource **bonuses** | stable (occupation doesn't change them) | static seed `regionResources.ts`, joined by `permalink` |
| **Pollution** | volatile | region page, live on demand |
| Country bonus, salary, work tax, VAT | volatile | economy page, live on demand |

## Architecture

### 1. Server — anonymous universe enumeration + cache

- New endpoint `GET /api/universe`: serves the cached universe — an array of
  `{ permalink, name, currentCountry }` plus `fetchedAt`.
- Builder (anonymous): for each country in `countries.json`, fetch its Society
  page through the same outbound path the `/proxy` handler uses, parse with
  `parseRegionList`, tag each region with that country's display name as
  `currentCountry`. Aggregate, dedupe by permalink, persist to
  `DATA_DIR/universe.json`.
- Refresh policy: build on first request if missing/older than TTL; a debounced
  background refresh keeps it warm. No erpk, no admin token — it is public,
  read-only game data fetched anonymously.
- The old map-data path (`handleRefresh`, `trimMapData`, `/api/regions/refresh`,
  `/api/regions`) is **removed**.

### 2. Client — data layer

- A `fetchUniverse()` service: `GET /api/universe`; on failure, fall back to a
  universe derived from the seed (`regionResources` → `{permalink, name,
  currentCountry}`), so dev and offline still work.
- `permalink` stays a field on `RegionEntry` (seed) — done in Part 1.

### 3. Client — optimizer

- Candidate sourcing: take the live universe; for each region, look up its
  resource bonus from a seed index keyed by `permalink`; the owner is the
  universe's `currentCountry` (live). Pre-filter by bonus threshold.
- Regions present in the universe but absent from the seed (no bonus data) are
  skipped and **counted** (surfaced in the UI — no silent drop).
- Finalists: fetch the region page (live bonus + pollution) and economy page
  (per live owner) — unchanged from Part 1, keyed by `permalink`.

### 4. Industry tab

Unchanged — it already uses Society pages (`useRegionList`). It matches the
optimizer by construction (same source, same permalinks).

## Consistency guarantee

Both screens resolve ownership + permalink from Society pages and pollution +
economics from the same live region/economy parsers. The only static input is
the stable resource-bonus seed, joined by permalink.

## Migration

Part 1 (done): `permalink` on `RegionEntry` + seed backfill;
`getRegionDetails` takes permalink; `travelData.js` deleted.

Part 2 (this revision):
1. Server `/api/universe` builder + cache (anonymous); remove the map-data
   refresh machinery.
2. Client `fetchUniverse()` + seed-derived fallback.
3. Optimizer candidate sourcing from the universe + seed bonus join; surface
   skipped (no-bonus) regions.

## Testing

- `parseRegionList` already fixture-tested; reuse.
- Universe builder: pure aggregation/dedupe/tagging tested with stubbed
  per-country region lists; TTL/staleness logic on a pure helper.
- `fetchUniverse`: 200 → parsed; failure → seed fallback.
- Optimizer: candidates joined from universe + seed by permalink; no-bonus
  regions excluded and counted; existing optimizer behavior preserved via the
  live-source stub.

## Out of scope (YAGNI)

- map-data, erpk sessions, stored credentials, admin tokens, credentialed
  schedulers — all removed/avoided.
- Browser-direct fetching of erepublik pages — blocked by CORS (no
  `Access-Control-Allow-Origin`); the anonymous server `/proxy` is required.
- Replacing the Industry tab's Society dropdown — stays as is.
- Auto-refreshing resource bonuses — bonuses are stable; regenerate the seed
  manually when the game adds regions.

## Resolved open items

- **Does map-data expose a region permalink?** No (verified live). Hence the
  Society-page approach.
