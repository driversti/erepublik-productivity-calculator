# Live Region-Data Unification — Design

Date: 2026-06-01

## Goal

Make the **Region Profit Optimizer** read region data (ownership + bonuses +
identity) from the same **live** source the rest of the app already uses, so it
reflects wartime occupation automatically and its numbers match the Industry
tab. Eliminate the two hardcoded region datasets that drift apart.

## Background / problem

Two static datasets back region data today, and they drift:

- `src/data/regionResources.ts` — region `id`, `name`, `currentCountry`
  (snapshot), `resources[].bonus`. The optimizer's candidate universe.
- `travelData.js` — region `id` → `permalink`. Used **only** by
  `liveEconomy.getRegionDetails` to build the region-page URL.

Symptom that triggered this work: "Lithuania Minor" (id 663) was in
`regionResources` but missing from `travelData`, so `getRegionDetails` silently
skipped it → pollution defaulted to 0 → its optimizer Net/day was overestimated
(+1753 phantom Δ vs baseline, shown with an "estimate" badge). More generally,
hardcoded `currentCountry` goes stale as regions change hands in war.

The Industry tab is already live: its region dropdown comes from the Society
page (`useRegionList`, keyed by `permalink`), and selecting a region scrapes the
live region page (bonus + pollution) and economy page (country bonus, salary,
work tax, VAT). The optimizer is the screen stuck on stale hardcoded data.

## Decisions (locked during brainstorming)

1. **Approach A** — the optimizer's region universe comes from the live
   **map-data** snapshot (`/api/regions`), not the static seed's authority.
2. **Server auto-refreshes map-data every 12 min ± 3 min jitter** (one bulk
   authenticated request; ~5/hour, far under the ~3000/hr limit). Ownership is
   effectively near-real-time.
3. **erpk is supplied through the UI**, not a file. The server remembers the
   supplied session (persisted) and uses it for scheduled refreshes.
4. The set-erpk / refresh action is **protected by an admin token** (`ADMIN_TOKEN`
   env). Without it the POST is rejected (401).
5. **`travelData.js` is deleted.** `permalink` becomes a field of the region
   dataset (from map-data, with a name→permalink fallback).
6. **`regionResources.ts` stays as an emergency fallback seed only** (used before
   the server's first refresh and in dev with no server data), backfilled with
   permalinks. It is no longer the source of truth.

## Data responsibilities

The split is by data *nature* — stable facts live in the periodically-refreshed
snapshot; volatile modifiers are fetched live on demand by both screens using
the **same parsers**, which is what guarantees the screens agree.

| Data | Nature | Source after refactor |
|---|---|---|
| Region `id`, `name`, **`permalink`** | stable | map-data snapshot (`/api/regions`) |
| Region resource **bonuses** | stable (occupation doesn't change them) | map-data snapshot |
| Region **owner** (`current_country`) | volatile (war) | map-data snapshot, auto-refreshed every ~12 min |
| **Pollution** | volatile | region page, live on demand |
| Country bonus, salary, work tax, VAT | volatile | economy page, live on demand |

## Architecture

### 1. Server (`server.js` + `server/trimMapData.js`)

- **`trimMapData`**: additionally extract `permalink` from the raw map-data
  `region` object. (Verification step at implementation start — see Open items.)
- **Stored session**: persist the admin-supplied erpk to `DATA_DIR/session.json`
  so it survives restarts. It is a secret: never logged, never returned to the
  client. Optional `EREPUBLIK_ERPK` env as a bootstrap.
- **Scheduler**: on boot, refresh if `regions.json` is missing or older than the
  interval; then refresh on a `12 min ± 3 min` jittered timer using the stored
  session. The existing 10-min manual-refresh cooldown remains for ad-hoc
  refreshes.
- **`POST /api/regions/refresh`** (extended): requires the admin token; stores
  the supplied erpk, refreshes immediately, resets the scheduled timer.
- **Expired session** (refresh returns 302 / non-200): keep serving the
  last-good `regions.json`; mark the dataset `stale: true` alongside `fetchedAt`.
- **`GET /api/regions`**: unchanged shape + `stale` flag.

### 2. Client — data layer

- `RegionEntry` (`regionResources.ts`) gains `permalink: string`.
- `services/regionData.ts`: dataset carries `permalink` per region and the
  `stale` flag; normalization (÷5 bonus scale) unchanged.
- `services/liveEconomy.ts` `getRegionDetails`: build the region URL from the
  candidate's `permalink` (passed through), **not** a `travelData` id lookup.
  Drop the `regions` import from `data/travel`.
- **Delete** `travelData.js` and the `regions` re-export in `data/travel.ts`.
  `countries` (from `countries.json`) is unaffected.

### 3. Client — optimizer

Minimal: it already consumes `/api/regions` with the static seed as fallback.
- Pre-filter candidates by snapshot bonus (÷5 normalized) — unchanged.
- Finalists still fetch the region page and prefer the live
  `parseRegionBonus` (`details?.regionBonus ?? snapshotBonus`) — the same parser
  the Industry tab uses, so displayed bonuses match.
- The "estimate" badge now means only "pollution couldn't be parsed from the
  region page," not "region id missing from a lookup table."

### 4. Client — admin UI

A small control (location TBD during planning) to paste the admin token + erpk
and trigger a refresh; shows last `fetchedAt` and a "session expired — paste a
fresh erpk" state when `stale`.

## Consistency guarantee

For any region a user actually evaluates, **both screens scrape the same live
region + economy pages with the same parsers** → identical pollution / country
bonus / salary / tax / VAT. The snapshot only governs the stable universe +
ownership, refreshed often enough that the optimizer agrees with the real-time
Society dropdown.

## Migration

1. Backfill `permalink` into the 221 seed regions in `regionResources.ts` from
   `travelData.js` (by id) + add Lithuania-Minor — one-time, before deletion.
2. Add permalink extraction to `trimMapData`.
3. Switch `getRegionDetails` to use `region.permalink`.
4. Delete `travelData.js` + the `travel.ts` regions import.
5. Add server scheduler + stored-session + admin-token.

## Testing

- `trimMapData`: extracts `permalink`; tolerates its absence (fallback).
- `regionResources`: every seed region has a non-empty `permalink` (replaces the
  current cross-file "resolves to travelData permalink" guard).
- `getRegionDetails`: builds the URL from `region.permalink`; no travelData dep.
- Server scheduler/session: pure helpers unit-tested (jitter bounds, stale flag,
  admin-token rejection); time-based scheduling kept thin and injectable.
- Optimizer tests: unchanged behavior via the live-source stub.

## Out of scope (YAGNI)

- Auto-login (username/password) to renew the session — ToS / Cloudflare /
  captcha risk. Admin re-pastes erpk on expiry instead.
- Replacing the Industry tab's real-time Society dropdown — it stays as is.
- Per-user sessions — single shared service session only.

## Open items (verify at implementation start)

- **Does raw map-data include a `permalink`/slug field per region?** Confirm on a
  live session (one authenticated `map-data` fetch). If present → use it
  directly. If absent → derive `permalink` by matching map-data region `name`
  against the Society-page list (both screens already have this), since deriving
  from name alone is unsafe (~4% of permalinks differ: "and"/"&"/"-do"/apostrophes).
