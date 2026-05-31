# Live Region-Data Refresh — Design

**Date:** 2026-05-31
**Status:** Approved (brainstorming)

## Goal

Stop region data from going stale (region ownership changes via war) without
manual code commits + releases. Let the running app **refresh the region dataset
on demand** by fetching it directly from eRepublik, and serve it from a
server-side store rather than a hard-coded bundle. The bundled
`src/data/regionResources.ts` (the 2026-05-31 snapshot) stays only as an
offline **seed / fallback**.

## Background

The Regions tab (shipped in `2026-05-31-region-resources-tab-design.md`) ranks
regions by a static dataset. Resource placement is fixed, but `currentCountry`
drifts with war, so the table loses accuracy over time. eRepublik exposes the
exact data we need at a single authenticated endpoint, confirmed via the
`erepublik-api-expert` agent.

### The eRepublik source (verified)

- `GET https://www.erepublik.com/en/main/map-data?updated_at=2007-01-01T00%3A00%3A00-08%3A00`
- The pre-epoch `updated_at` returns **all 574 regions** in one call (~620 KB).
  (A recent timestamp would return only a delta — not used here.)
- **Auth is mandatory.** Required request headers for a Node fetch:
  - `Cookie: erpk=<token>`
  - `X-Requested-With: XMLHttpRequest` (else returns full HTML, not JSON)
  - `User-Agent: <realistic browser UA>` (anti-bot), `Referer: https://www.erepublik.com/en/military/campaigns`
  - `Accept: application/json, text/javascript, */*; q=0.01`
  - No CSRF `_token` (it's a GET).
- Response is a JSON object **keyed by region id**, each value matching the shape
  we already trimmed once: `resources[].{name, industry, bonus}` (industry is the
  string `"food"|"weapon"|"house"|"aircraft"`, bonus a string `"10".."30"`),
  plus `original_country`, `current_country`, `region.{id,name}`, `city`,
  `*_battle_info`. **Our existing trim logic already handles this exact shape.**
- Stable unofficial JSON API (used by `battle-stats`, `ePlus`, `euberbot` for years).

## Decisions (locked during brainstorming)

| Question | Decision |
|----------|----------|
| Scope | **Server-shared** — one refresh updates data for all users |
| Data source | **Server-side fetch** from `/en/main/map-data` (not a file upload) |
| Refresh cadence | **Manual, on-demand** — no cron, no scheduled auto-refresh |
| Credential | Admin pastes their **`erpk`** cookie per refresh; used once, **never stored** |
| Endpoint auth | **`erpk` only** — no separate admin secret (see Security) |
| Storage | Server-side JSON file on a **bind mount** (not a named volume) |
| Bundled data | Kept as **seed / fallback** only; live data lives in the bind mount |
| Trim | Reuse the existing one-off trim logic, moved into a server module |

## Security rationale ("erpk only" is safe)

The client never supplies the data — it supplies only a session cookie, and the
**server** fetches the data straight from eRepublik. No caller can inject a
forged dataset; anyone who triggers a refresh gets the same real game data. The
only abuse vector is triggering refreshes too often (load on our server +
eRepublik), mitigated by a server-side **debounce**: at most one *successful*
refresh per **10 minutes** (a failed attempt — e.g. expired `erpk` — does NOT
start the cooldown, so the admin can immediately retry with a fresh cookie). A
separate admin token would add no integrity guarantee, so it is omitted. The `erpk` is read from the request body, used for the single outbound
fetch, and discarded — never logged, never persisted.

## Architecture

```
Browser (RegionsView)                     Node server.js                 eRepublik
  │ GET /api/regions ───────────────▶ read ${DATA_DIR}/regions.json
  │ ◀── { fetchedAt, regions, countryFlags }   (or 204 → client uses bundled seed)
  │
  │ POST /api/regions/refresh {erpk} ▶ debounce-check
  │                                    GET /en/main/map-data (erpk + headers) ──▶
  │                                    ◀────────────────── ~620KB raw map JSON
  │                                    trimMapData(raw) → slim
  │                                    write ${DATA_DIR}/regions.json
  │ ◀── { fetchedAt, regions, countryFlags, count }
```

### 1. Server — `server.js` + `server/trimMapData.js`

- **`server/trimMapData.js`** (new, plain ESM, pure + unit-tested): `trimMapData(raw) → { fetchedAt, regions, countryFlags }`. Filters regions that have resources; maps `weapon→weapons`, `house→houses`; keeps `id (number), name, originalCountry, currentCountry, resources[{name, industry, bonus:number}]`; builds a deduped `countryFlags` map; `fetchedAt` is the caller-supplied timestamp. Mirrors the original one-off trim exactly so the slim shape stays identical to `regionResources.ts`.
- **`GET /api/regions`** — reads `${DATA_DIR}/regions.json`; returns it as JSON, or `204 No Content` when absent.
- **`POST /api/regions/refresh`** — body `{ erpk }`. Debounce (reject with `429` if a *successful* refresh happened < 10 minutes ago; failed attempts don't count). Fetch map-data with the recipe above; on non-200 (e.g. 302 → bad/expired `erpk`) return `502`/`401` with a clear message. Trim, write the file atomically (write temp + rename), return the slim payload. Never store `erpk`.
- `DATA_DIR` from env (default `/data`). `MAP_DATA` host `www.erepublik.com` is already allow-listed; the refresh uses a dedicated authenticated handler, not the generic `/proxy`.

### 2. Storage / deployment

- `docker-compose.yml`: add a **bind mount** and env:
  ```yaml
      volumes:
        - ./data:/data
      environment:
        - PORT=8080
        - DATA_DIR=/data
  ```
- On the server the data lives at `~/docker/erep-calculator/data/regions.json` —
  visible on the host, survives `compose up -d` recreates, easy to back up.
- **Permissions gotcha:** the image runs as non-root `appuser`. The bind-mounted
  host dir must be writable by that user. Handle by pre-creating `data/` on the
  host with permissions the container UID can write (documented in the plan),
  and have the server fail gracefully (clear error, keep serving old/seed data)
  if the write fails.

### 3. Client

- **`src/services/regionData.ts`** (new): `fetchRegionData(): Promise<RegionDataSet>` → `GET /api/regions`; on `204`/error falls back to the bundled seed (`REGION_RESOURCES`, `COUNTRY_FLAGS`, `SNAPSHOT_DATE`). `refreshRegionData(erpk): Promise<RegionDataSet>` → `POST /api/regions/refresh`. `RegionDataSet = { fetchedAt: string; regions: RegionEntry[]; countryFlags: Record<string,string> }`.
- **`src/regions/ranking.ts` refactor**: `rankRegions` and `allCountries` (and `countriesForIndustry`) take a `regions: RegionEntry[]` argument instead of importing `REGION_RESOURCES` directly — keeps them pure and decoupled from the data source. Update their tests to pass data in.
- **`RegionsView`**: loads the dataset into state via `useEffect` (fallback to seed on failure); shows **"updated: {fetchedAt}"** instead of the static snapshot note. Adds an **"Update data"** control: clicking reveals an `erpk` password field; submitting calls `refreshRegionData`, shows in-progress / success / error status, and replaces the in-state dataset on success. This is the token-gated action living in the Regions tab.

## Error handling

- Bad/expired `erpk` → map-data returns 302; server responds `401` with "session expired / invalid erpk"; UI shows it, keeps showing current data.
- map-data unreachable / non-JSON → server `502`; UI message; current data retained.
- Debounced refresh → `429` "try again in a few minutes" (with seconds remaining).
- Bind-mount not writable → server logs + returns `500`; keeps serving last good / seed data.
- `GET /api/regions` 204 or fetch failure on the client → silently use the bundled seed (the app always renders).

## Testing

- **`trimMapData` (unit)**: a fixture of raw map-data → expected slim shape; verifies `weapon→weapons`/`house→houses`, resourceless regions dropped, numeric coercion, `countryFlags` dedupe.
- **`ranking.ts` (updated unit)**: same assertions as today but with `regions` passed in.
- **`regionData` service (unit)**: mock `fetch` — success parses payload; `204`/error falls back to the bundled seed; refresh posts `{erpk}` and returns parsed data.
- **`RegionsView` (component)**: renders with a mocked `regionData` service; the Update-data control prompts for `erpk` and invokes refresh; success updates the list; error shows a message.
- **Server**: `trimMapData` is the main pure unit; the HTTP handlers verified by a focused test if the project gains a server test harness, otherwise a manual smoke (documented) — no live `erpk` in tests; map-data fetch is mocked.

## Out of scope (YAGNI)

- No cron / scheduled auto-refresh; no stored `erpk`; no separate admin secret.
- No per-region fallback fetching; no delta (`updated_at`) incremental sync.
- No multi-user auth / accounts.
