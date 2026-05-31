# Live Region-Data Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the running app refresh the Regions dataset on demand by fetching `/main/map-data` from eRepublik server-side (admin pastes their `erpk` once per refresh), storing the trimmed result on a bind-mounted JSON file; the bundled dataset becomes an offline seed/fallback.

**Architecture:** A pure `trimMapData` module turns raw map-data into the slim shape. `server.js` gains `GET /api/regions` (serve the stored file) and `POST /api/regions/refresh` (fetch eRepublik → trim → write file, debounced). The client gains a `regionData` service (fetch + fallback to the bundled seed) and `ranking.ts` becomes data-source-agnostic (takes `regions` as a param). `RegionsView` loads the dataset into state and offers an "Update data" control.

**Tech Stack:** Node 20 (`server.js`, global `fetch`), Vite + React 19 + TypeScript strict, Vitest + Testing Library.

---

## File Structure

- **Create** `server/trimMapData.js` — pure raw→slim transform (server-only, ESM).
- **Create** `server/trimMapData.test.js` — unit test for the transform.
- **Modify** `vite.config.ts` — add `server/**/*.test.js` to vitest `include`; add `/api` to the dev proxy.
- **Modify** `server.js` — `DATA_DIR`/`REGIONS_FILE` consts, `GET /api/regions`, `POST /api/regions/refresh`, allow POST in CORS, `import { trimMapData }`.
- **Create** `src/services/regionData.ts` — `RegionDataSet`, `BUNDLED_DATASET`, `fetchRegionData`, `refreshRegionData`.
- **Create** `src/services/regionData.test.ts` — service unit tests (mock `fetch`).
- **Modify** `src/regions/ranking.ts` — functions take `regions: RegionEntry[]`.
- **Modify** `src/regions/ranking.test.ts` — pass `REGION_RESOURCES` in.
- **Modify** `src/i18n/locales/en/common.json` — refresh-UI strings under `regions`.
- **Modify** `src/views/RegionsView/RegionsView.tsx` — load dataset into state + "Update data" UI.
- **Modify** `src/views/RegionsView/RegionsView.test.tsx` — mock the `regionData` service; add a refresh test.
- **Modify** `styles/regions.css` — refresh-control styles.
- **Modify** `docker-compose.yml` — bind mount `./data:/data` + `DATA_DIR` env.

The bundled `src/data/regionResources.ts` is unchanged (it stays the seed/fallback).

---

## Task 1: `trimMapData` pure transform

**Files:**
- Create: `server/trimMapData.js`
- Test: `server/trimMapData.test.js`
- Modify: `vite.config.ts` (vitest `include`)

- [ ] **Step 1: Let vitest discover server tests**

In `vite.config.ts`, change the `include` line (currently `include: ['src/**/*.{test,spec}.{ts,tsx}'],`) to:

```ts
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server/**/*.test.js'],
```

- [ ] **Step 2: Write the failing test**

Create `server/trimMapData.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { trimMapData } from './trimMapData.js';

const RAW = {
  '3': {
    resources: [
      { id: '31', name: 'Magnesium', industry: 'aircraft', bonus: '10' },
      { id: '34', name: 'Cobalt', industry: 'aircraft', bonus: '25' },
    ],
    original_country: { name: 'Romania', flag: '//flags/Romania.png' },
    current_country: { name: 'Hungary', flag: '//flags/Hungary.png' },
    region: { id: '3', name: 'Dobrogea' },
  },
  '99': {
    resources: [{ id: '11', name: 'Iron', industry: 'weapon', bonus: '15' }],
    original_country: { name: 'Serbia', flag: '//flags/Serbia.png' },
    current_country: { name: 'Serbia', flag: '//flags/Serbia.png' },
    region: { id: '99', name: 'Sumadija' },
  },
  '7': {
    resources: [],
    region: { id: '7', name: 'Empty' },
    original_country: { name: 'X', flag: '//x' },
    current_country: { name: 'X', flag: '//x' },
  },
};

describe('trimMapData', () => {
  it('drops resourceless regions, sorts by id, maps industry keys, coerces numbers', () => {
    const out = trimMapData(RAW, '2026-06-01');
    expect(out.fetchedAt).toBe('2026-06-01');
    expect(out.regions.map((r) => r.id)).toEqual([3, 99]); // '7' dropped, sorted asc
    const iron = out.regions.find((r) => r.id === 99).resources[0];
    expect(iron.industry).toBe('weapons'); // weapon -> weapons
    expect(iron.bonus).toBe(15); // string -> number
    expect(typeof out.regions[0].id).toBe('number');
  });

  it('keeps original + current country and dedupes/sorts flags', () => {
    const out = trimMapData(RAW, 'd');
    const dobrogea = out.regions.find((r) => r.id === 3);
    expect(dobrogea.originalCountry).toBe('Romania');
    expect(dobrogea.currentCountry).toBe('Hungary');
    expect(out.countryFlags).toEqual({
      Hungary: '//flags/Hungary.png',
      Romania: '//flags/Romania.png',
      Serbia: '//flags/Serbia.png',
    });
  });

  it('maps house -> houses', () => {
    const raw = {
      '5': {
        resources: [{ id: '21', name: 'Sand', industry: 'house', bonus: '20' }],
        region: { id: '5', name: 'R' },
        original_country: { name: 'A', flag: '//a' },
        current_country: { name: 'A', flag: '//a' },
      },
    };
    expect(trimMapData(raw, 'd').regions[0].resources[0].industry).toBe('houses');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run server/trimMapData.test.js`
Expected: FAIL — cannot resolve `./trimMapData.js`.

- [ ] **Step 4: Implement the transform**

Create `server/trimMapData.js`:

```js
// Pure transform: raw eRepublik /main/map-data JSON -> the slim dataset the app
// serves. Mirrors the original one-off trim so the shape stays identical to the
// bundled src/data/regionResources.ts seed.
const INDUSTRY_MAP = { food: 'food', weapon: 'weapons', house: 'houses', aircraft: 'aircraft' };

export function trimMapData(raw, fetchedAt) {
  const flags = {};
  const regions = [];
  for (const key of Object.keys(raw)) {
    const r = raw[key];
    const res = (r && r.resources) || [];
    if (!res.length) continue;
    const oc = r.original_country;
    const cc = r.current_country;
    if (oc && oc.name && oc.flag) flags[oc.name] = oc.flag;
    if (cc && cc.name && cc.flag) flags[cc.name] = cc.flag;
    regions.push({
      id: Number(r.region.id),
      name: r.region.name,
      originalCountry: (oc && oc.name) || '',
      currentCountry: (cc && cc.name) || '',
      resources: res.map((x) => ({
        name: x.name,
        industry: INDUSTRY_MAP[x.industry] || x.industry,
        bonus: Number(x.bonus),
      })),
    });
  }
  regions.sort((a, b) => a.id - b.id);
  const countryFlags = {};
  for (const k of Object.keys(flags).sort()) countryFlags[k] = flags[k];
  return { fetchedAt, regions, countryFlags };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run server/trimMapData.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/trimMapData.js server/trimMapData.test.js vite.config.ts
git commit -m "feat(regions): add pure map-data trim transform"
```

---

## Task 2: Make `ranking.ts` data-source-agnostic

**Files:**
- Modify: `src/regions/ranking.ts`
- Modify: `src/regions/ranking.test.ts`

- [ ] **Step 1: Update the tests to pass regions in**

Replace the entire contents of `src/regions/ranking.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { rankRegions, countriesForIndustry, allCountries } from './ranking';
import { REGION_RESOURCES } from '../data/regionResources';

describe('rankRegions', () => {
  it('sums an industry\'s resource bonuses per region', () => {
    const aircraft = rankRegions(REGION_RESOURCES, 'aircraft');
    const dobrogea = aircraft.find((r) => r.region.name === 'Dobrogea');
    expect(dobrogea).toBeTruthy();
    expect(dobrogea!.totalBonus).toBe(70);
    expect(dobrogea!.matched.map((m) => m.name).sort()).toEqual(
      ['Cobalt', 'Magnesium', 'Titanium', 'Wolfram'],
    );
  });

  it('returns only regions that have the industry, sorted desc with name tie-break', () => {
    const food = rankRegions(REGION_RESOURCES, 'food');
    expect(food.length).toBeGreaterThan(0);
    for (const row of food) {
      expect(row.matched.length).toBeGreaterThan(0);
      expect(row.matched.every((m) => m.industry === 'food')).toBe(true);
    }
    for (let i = 1; i < food.length; i++) {
      expect(food[i - 1].totalBonus).toBeGreaterThanOrEqual(food[i].totalBonus);
      if (food[i - 1].totalBonus === food[i].totalBonus) {
        expect(food[i - 1].region.name.localeCompare(food[i].region.name, 'en')).toBeLessThanOrEqual(0);
      }
    }
  });

  it('filters by current country when given', () => {
    const ro = rankRegions(REGION_RESOURCES, 'aircraft', { country: 'Romania' });
    expect(ro.length).toBeGreaterThan(0);
    expect(ro.every((r) => r.region.currentCountry === 'Romania')).toBe(true);
  });

  it('returns an empty array when the country filter matches no region with the industry', () => {
    expect(rankRegions(REGION_RESOURCES, 'aircraft', { country: '__no_such_country__' })).toHaveLength(0);
  });
});

describe('countriesForIndustry', () => {
  it('lists distinct current countries that have the industry, sorted', () => {
    const list = countriesForIndustry(REGION_RESOURCES, 'aircraft');
    expect(list).toContain('Romania');
    expect(new Set(list).size).toBe(list.length);
    expect([...list]).toEqual([...list].sort((a, b) => a.localeCompare(b, 'en')));
  });
});

describe('allCountries', () => {
  it('is a sorted, distinct superset of any single industry\'s country list', () => {
    const all = allCountries(REGION_RESOURCES);
    expect(new Set(all).size).toBe(all.length);
    expect([...all]).toEqual([...all].sort((a, b) => a.localeCompare(b, 'en')));
    for (const c of countriesForIndustry(REGION_RESOURCES, 'aircraft')) {
      expect(all).toContain(c);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/regions/ranking.test.ts`
Expected: FAIL — current `rankRegions(industry)` signature doesn't accept the array; type/arity errors.

- [ ] **Step 3: Refactor the implementation**

Replace the entire contents of `src/regions/ranking.ts` with:

```ts
import type { Industry, RegionEntry, RegionResource } from '../data/regionResources';

export interface RankedRegion {
  region: RegionEntry;
  /** Sum of the bonuses of this industry's resources in the region. */
  totalBonus: number;
  /** The resources that contributed (for display chips). */
  matched: RegionResource[];
}

/**
 * Regions (from the supplied dataset) that contain at least one resource of
 * `industry`, ranked by total bonus (desc), tie-broken by region name (asc).
 * Optionally restricted to a single `currentCountry`. Pure — the caller passes
 * the data so it can come from the bundled seed or a live refresh.
 */
export function rankRegions(
  regions: RegionEntry[],
  industry: Industry,
  opts?: { country?: string },
): RankedRegion[] {
  const country = opts?.country;
  const ranked: RankedRegion[] = [];
  for (const region of regions) {
    if (country && region.currentCountry !== country) continue;
    const matched = region.resources.filter((r) => r.industry === industry);
    if (matched.length === 0) continue;
    const totalBonus = matched.reduce((sum, r) => sum + r.bonus, 0);
    ranked.push({ region, totalBonus, matched });
  }
  ranked.sort(
    (a, b) => b.totalBonus - a.totalBonus || a.region.name.localeCompare(b.region.name, 'en'),
  );
  return ranked;
}

/** Distinct `currentCountry` values that have ≥1 region for the industry, sorted. */
export function countriesForIndustry(regions: RegionEntry[], industry: Industry): string[] {
  const set = new Set<string>();
  for (const region of regions) {
    if (region.resources.some((r) => r.industry === industry)) set.add(region.currentCountry);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'en'));
}

/** All distinct `currentCountry` values in the dataset, sorted (stable filter list). */
export function allCountries(regions: RegionEntry[]): string[] {
  const set = new Set<string>();
  for (const region of regions) set.add(region.currentCountry);
  return [...set].sort((a, b) => a.localeCompare(b, 'en'));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/regions/ranking.test.ts`
Expected: PASS (6 tests). (`RegionsView` won't compile yet — it still calls the old signature; fixed in Task 6. Don't run the full build here.)

- [ ] **Step 5: Commit**

```bash
git add src/regions/ranking.ts src/regions/ranking.test.ts
git commit -m "refactor(regions): rank from a passed-in dataset, not a global import"
```

---

## Task 3: `regionData` client service

**Files:**
- Create: `src/services/regionData.ts`
- Test: `src/services/regionData.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/services/regionData.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchRegionData, refreshRegionData, BUNDLED_DATASET } from './regionData';

afterEach(() => vi.restoreAllMocks());

const PAYLOAD = {
  fetchedAt: '2026-06-01',
  regions: [{ id: 1, name: 'R', originalCountry: 'A', currentCountry: 'A', resources: [] }],
  countryFlags: { A: '//a' },
};

describe('fetchRegionData', () => {
  it('returns server data when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => PAYLOAD }) as Response));
    const data = await fetchRegionData();
    expect(data.fetchedAt).toBe('2026-06-01');
    expect(data.regions).toHaveLength(1);
  });

  it('falls back to the bundled seed on 204', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 204, json: async () => null }) as Response));
    expect(await fetchRegionData()).toBe(BUNDLED_DATASET);
  });

  it('falls back to the bundled seed on network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchRegionData()).toBe(BUNDLED_DATASET);
  });
});

describe('refreshRegionData', () => {
  it('posts erpk and returns parsed data', async () => {
    const spy = vi.fn(async () => ({ ok: true, status: 200, json: async () => PAYLOAD }) as Response);
    vi.stubGlobal('fetch', spy);
    const data = await refreshRegionData('ERPK123');
    expect(data.fetchedAt).toBe('2026-06-01');
    expect(spy).toHaveBeenCalledWith('/api/regions/refresh', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ erpk: 'ERPK123' });
  });

  it('throws with the server error message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'session expired' }) }) as Response));
    await expect(refreshRegionData('bad')).rejects.toThrow('session expired');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/regionData.test.ts`
Expected: FAIL — cannot resolve `./regionData`.

- [ ] **Step 3: Implement the service**

Create `src/services/regionData.ts`:

```ts
import { REGION_RESOURCES, COUNTRY_FLAGS, SNAPSHOT_DATE, type RegionEntry } from '../data/regionResources';

export interface RegionDataSet {
  fetchedAt: string;
  regions: RegionEntry[];
  countryFlags: Record<string, string>;
}

// Offline default — used until/unless the server has a refreshed dataset.
export const BUNDLED_DATASET: RegionDataSet = {
  fetchedAt: SNAPSHOT_DATE,
  regions: REGION_RESOURCES,
  countryFlags: COUNTRY_FLAGS,
};

function isDataSet(v: unknown): v is RegionDataSet {
  return (
    !!v &&
    typeof v === 'object' &&
    Array.isArray((v as RegionDataSet).regions) &&
    typeof (v as RegionDataSet).fetchedAt === 'string' &&
    typeof (v as RegionDataSet).countryFlags === 'object'
  );
}

// GET the server-stored dataset; fall back to the bundled seed on 204/any error.
export async function fetchRegionData(): Promise<RegionDataSet> {
  try {
    const res = await fetch('/api/regions');
    if (res.status === 204 || !res.ok) return BUNDLED_DATASET;
    const data: unknown = await res.json();
    return isDataSet(data) ? data : BUNDLED_DATASET;
  } catch {
    return BUNDLED_DATASET;
  }
}

// Trigger a server-side refresh from eRepublik using the admin's erpk cookie.
export async function refreshRegionData(erpk: string): Promise<RegionDataSet> {
  const res = await fetch('/api/regions/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ erpk }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Refresh failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  if (!isDataSet(data)) throw new Error('Refresh returned malformed data');
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/regionData.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/regionData.ts src/services/regionData.test.ts
git commit -m "feat(regions): add regionData service with bundled fallback"
```

---

## Task 4: i18n strings for the refresh UI

**Files:**
- Modify: `src/i18n/locales/en/common.json`

- [ ] **Step 1: Replace the `snapshotNote` key with refresh strings**

In `src/i18n/locales/en/common.json`, inside the `regions` block, replace this line:

```json
    "snapshotNote": "Snapshot {{date}} · current ownership may be stale (regions change hands in war).",
```

with:

```json
    "updated": "Updated {{date}} · current ownership may change in war",
    "updateData": "Update data",
    "erpkLabel": "Your eRepublik session cookie (erpk)",
    "erpkPlaceholder": "Paste erpk…",
    "refresh": "Refresh",
    "refreshing": "Refreshing…",
    "refreshOk": "Updated — {{count}} regions",
    "refreshError": "Refresh failed: {{message}}",
```

(Keep `empty`, `country`, `allCountries`, `bonusValue`, and the `columns` block as they are.)

- [ ] **Step 2: Verify JSON parses and i18n tests pass**

Run: `node -e "require('./src/i18n/locales/en/common.json'); console.log('json ok')"`
Expected: `json ok`.

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/en/common.json
git commit -m "i18n(en): add region refresh-UI strings"
```

---

## Task 5: Server endpoints (`GET`/`POST /api/regions`)

**Files:**
- Modify: `server.js`
- Modify: `vite.config.ts` (dev proxy)

This task has no automated test (the project has no server test harness and `server.js` self-listens on import). The risky logic — `trimMapData` — is unit-tested in Task 1. Verify via the manual smoke in Step 5.

- [ ] **Step 1: Add the dev proxy for `/api`**

In `vite.config.ts`, extend the `server.proxy` map so dev requests reach `server.js`:

```ts
    proxy: {
      // Live data still flows through the existing Node allowlist proxy on 8080.
      '/proxy': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    },
```

- [ ] **Step 2: Import the trim + add config constants**

In `server.js`, after the existing imports (after line 6), add:

```js
import { trimMapData } from './server/trimMapData.js';
```

After the `PORT` line (line 11), add:

```js
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const REGIONS_FILE = path.join(DATA_DIR, 'regions.json');
const MAP_DATA_URL =
  'https://www.erepublik.com/en/main/map-data?updated_at=2007-01-01T00%3A00%3A00-08%3A00';
const REFRESH_COOLDOWN_MS = 10 * 60 * 1000; // one successful refresh / 10 min
let lastRefreshOk = 0;
```

- [ ] **Step 3: Add helpers + the refresh handler (module scope)**

In `server.js`, immediately before `const server = http.createServer(...)` (line 37), add:

```js
function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// POST /api/regions/refresh — fetch map-data from eRepublik with the caller's
// erpk, trim, and persist. The erpk is used for the single outbound request and
// never stored. Debounced to one successful refresh per cooldown window.
async function handleRefresh(req, res) {
  const now = Date.now();
  if (now - lastRefreshOk < REFRESH_COOLDOWN_MS) {
    const retryIn = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastRefreshOk)) / 1000);
    sendJson(res, 429, { error: `Recently refreshed — try again in ${retryIn}s` });
    return;
  }
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy(); // guard against oversized bodies
  });
  req.on('end', async () => {
    let erpk;
    try {
      erpk = JSON.parse(body).erpk;
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }
    if (!erpk || typeof erpk !== 'string') {
      sendJson(res, 400, { error: 'Missing erpk' });
      return;
    }
    try {
      const mapRes = await fetch(MAP_DATA_URL, {
        redirect: 'manual', // a 302 means the session was rejected — don't follow it
        headers: {
          Cookie: `erpk=${erpk}`,
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
          Referer: 'https://www.erepublik.com/en/military/campaigns',
        },
      });
      if (mapRes.status !== 200) {
        sendJson(res, 401, { error: 'eRepublik rejected the session (expired or invalid erpk)' });
        return;
      }
      const raw = await mapRes.json();
      const dataset = trimMapData(raw, new Date().toISOString().slice(0, 10));
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${REGIONS_FILE}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(dataset));
      await fs.promises.rename(tmp, REGIONS_FILE); // atomic replace
      lastRefreshOk = Date.now();
      sendJson(res, 200, { ...dataset, count: dataset.regions.length });
    } catch (err) {
      console.error('Refresh failed:', err.message);
      sendJson(res, 502, { error: 'Could not fetch map-data from eRepublik' });
    }
  });
}
```

- [ ] **Step 4: Wire the routes + allow POST**

In `server.js`, change the CORS methods line (line 52) from:

```js
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
```

to:

```js
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
```

Then, immediately after the `/proxy` block's closing `}` (after line 105, before the "Serve static files" comment), add:

```js
    // Serve the stored region dataset (refreshed from eRepublik), if any.
    if (pathname === '/api/regions' && req.method === 'GET') {
        fs.readFile(REGIONS_FILE, (err, content) => {
            if (err) {
                res.writeHead(204); // no stored data yet — client uses the bundled seed
                res.end();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
            res.end(content);
        });
        return;
    }

    if (pathname === '/api/regions/refresh' && req.method === 'POST') {
        handleRefresh(req, res);
        return;
    }
```

- [ ] **Step 5: Manual smoke test**

Start the server with a local data dir. (No `npm run build` here — the `/api`
smoke doesn't need `dist/`, and the client doesn't type-check until Task 6.
`server.js` serves from the repo root when `dist/` is absent.)

```bash
DATA_DIR=./.smoke-data node server.js &
SERVER_PID=$!
sleep 1
# No data yet -> 204
curl -s -o /dev/null -w 'GET /api/regions (empty): %{http_code}\n' http://localhost:8080/api/regions
# Bad erpk -> 401 (real outbound call to eRepublik, expects a 302 redirect)
curl -s -X POST http://localhost:8080/api/regions/refresh \
  -H 'Content-Type: application/json' -d '{"erpk":"definitely-not-valid"}' \
  -w '\nPOST refresh (bad erpk): %{http_code}\n'
kill $SERVER_PID
rm -rf ./.smoke-data
```

Expected: `GET /api/regions (empty): 204`, and the POST returns `401` with the "session rejected" JSON (eRepublik 302s an invalid session). A real refresh with a valid `erpk` is verified by the user in Task 8.

- [ ] **Step 6: Commit**

```bash
git add server.js vite.config.ts
git commit -m "feat(regions): serve + refresh region data via /api/regions"
```

---

## Task 6: `RegionsView` — load dataset + refresh control

**Files:**
- Modify: `src/views/RegionsView/RegionsView.tsx`
- Modify: `src/views/RegionsView/RegionsView.test.tsx`
- Modify: `styles/regions.css`

- [ ] **Step 1: Update the component test (mock the service, add a refresh test)**

Replace the entire contents of `src/views/RegionsView/RegionsView.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the data service: fetch returns the bundled seed; refresh is a spy.
vi.mock('../../services/regionData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/regionData')>();
  return {
    ...actual,
    fetchRegionData: vi.fn(async () => actual.BUNDLED_DATASET),
    refreshRegionData: vi.fn(),
  };
});

import { RegionsView } from './RegionsView';
import { BUNDLED_DATASET, refreshRegionData } from '../../services/regionData';
import { allCountries, countriesForIndustry } from '../../regions/ranking';

beforeEach(() => vi.clearAllMocks());

function setup() {
  return render(<RegionsView />);
}

describe('RegionsView', () => {
  it('renders a ranked list with the updated-date note', () => {
    setup();
    expect(screen.getByTestId('regions-view')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Updated ${BUNDLED_DATASET.fetchedAt}`))).toBeInTheDocument();
    expect(screen.getAllByTestId('regions-row').length).toBeGreaterThan(0);
  });

  it('switching industry to aircraft shows Dobrogea at +70%', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    const dobrogea = screen.getByText('Dobrogea').closest('tr') as HTMLElement;
    expect(within(dobrogea).getByText('+70%')).toBeInTheDocument();
  });

  it('keeps the country filter when switching industries', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    await userEvent.selectOptions(screen.getByTestId('regions-country'), 'Romania');
    await userEvent.click(screen.getByTestId('regions-ind-food'));
    expect(screen.getByTestId('regions-country')).toHaveValue('Romania');
    const rows = screen.getAllByTestId('regions-row');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(within(row).getByTestId('regions-country-cell')).toHaveTextContent('Romania');
    }
  });

  it('shows the empty state when the chosen country has no regions for the industry', async () => {
    const aircraftCountries = new Set(countriesForIndustry(BUNDLED_DATASET.regions, 'aircraft'));
    const missing = allCountries(BUNDLED_DATASET.regions).find((c) => !aircraftCountries.has(c));
    expect(missing, 'dataset should contain a country with no aircraft regions').toBeTruthy();
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    await userEvent.selectOptions(screen.getByTestId('regions-country'), missing!);
    expect(screen.getByTestId('regions-empty')).toBeInTheDocument();
    expect(screen.queryAllByTestId('regions-row')).toHaveLength(0);
  });

  it('refreshes data via the erpk form and updates the list', async () => {
    vi.mocked(refreshRegionData).mockResolvedValue({
      fetchedAt: '2026-06-09',
      regions: [{ id: 1, name: 'Testland', originalCountry: 'Testia', currentCountry: 'Testia', resources: [{ name: 'Grain', industry: 'food', bonus: 30 }] }],
      countryFlags: {},
    });
    setup();
    await userEvent.click(screen.getByTestId('regions-refresh-toggle'));
    await userEvent.type(screen.getByTestId('regions-erpk'), 'ERPK-XYZ');
    await userEvent.click(screen.getByTestId('regions-refresh-submit'));
    await waitFor(() => expect(refreshRegionData).toHaveBeenCalledWith('ERPK-XYZ'));
    // Food tab (default) now shows the refreshed single region.
    expect(await screen.findByText('Testland')).toBeInTheDocument();
    expect(screen.getByText(/Updated 2026-06-09/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/views/RegionsView/RegionsView.test.tsx`
Expected: FAIL — the component still uses the static import / old ranking signature and has no refresh control (`regions-refresh-toggle` not found).

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/views/RegionsView/RegionsView.tsx` with:

```tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { INDUSTRIES } from '../../data/industries';
import type { IndustryKey } from '../../data/types';
import { industryLabel } from '../../i18n/names';
import { rankRegions, allCountries } from '../../regions/ranking';
import {
  fetchRegionData,
  refreshRegionData,
  BUNDLED_DATASET,
  type RegionDataSet,
} from '../../services/regionData';

// eRepublik flag URLs are protocol-relative ("//..."); make them absolute https.
const flagSrc = (url?: string): string | undefined =>
  url ? (url.startsWith('//') ? `https:${url}` : url) : undefined;

type RefreshStatus = { kind: 'idle' | 'loading' | 'ok' | 'error'; message?: string };

export function RegionsView() {
  const { t } = useTranslation();
  const [industry, setIndustry] = useState<IndustryKey>('food');
  const [country, setCountry] = useState<string>('');
  const [dataset, setDataset] = useState<RegionDataSet>(BUNDLED_DATASET);

  const [showRefresh, setShowRefresh] = useState(false);
  const [erpk, setErpk] = useState('');
  const [status, setStatus] = useState<RefreshStatus>({ kind: 'idle' });

  // Load the server-stored dataset on mount; falls back to the bundled seed.
  useEffect(() => {
    let live = true;
    fetchRegionData().then((d) => { if (live) setDataset(d); });
    return () => { live = false; };
  }, []);

  const ranked = rankRegions(dataset.regions, industry, country ? { country } : undefined);
  const countries = allCountries(dataset.regions);

  const submitRefresh = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: 'loading' });
    try {
      const data = await refreshRegionData(erpk);
      setDataset(data);
      setErpk('');
      setStatus({ kind: 'ok', message: t('regions.refreshOk', { count: data.regions.length }) });
    } catch (err) {
      setStatus({ kind: 'error', message: t('regions.refreshError', { message: (err as Error).message }) });
    }
  };

  return (
    <section className="regions-view" data-testid="regions-view">
      <div className="regions-toolbar">
        <div className="regions-industry-switch">
          {INDUSTRIES.map((cfg) => (
            <button
              key={cfg.key}
              type="button"
              className={`regions-ind-btn${industry === cfg.key ? ' active' : ''}`}
              data-testid={`regions-ind-${cfg.key}`}
              onClick={() => setIndustry(cfg.key)}
            >
              {cfg.icon} {industryLabel(t, cfg)}
            </button>
          ))}
        </div>
        <label className="regions-country-filter">
          {t('regions.country')}
          <select
            data-testid="regions-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">{t('regions.allCountries')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="regions-status-bar">
        <p className="regions-snapshot-note">{t('regions.updated', { date: dataset.fetchedAt })}</p>
        <button
          type="button"
          className="regions-refresh-toggle"
          data-testid="regions-refresh-toggle"
          onClick={() => setShowRefresh((s) => !s)}
        >
          {t('regions.updateData')}
        </button>
      </div>

      {showRefresh && (
        <form className="regions-refresh-form" onSubmit={submitRefresh}>
          <label className="regions-erpk-label" htmlFor="regions-erpk-input">
            {t('regions.erpkLabel')}
          </label>
          <input
            id="regions-erpk-input"
            data-testid="regions-erpk"
            type="password"
            autoComplete="off"
            placeholder={t('regions.erpkPlaceholder')}
            value={erpk}
            onChange={(e) => setErpk(e.target.value)}
          />
          <button
            type="submit"
            data-testid="regions-refresh-submit"
            disabled={status.kind === 'loading' || erpk.trim() === ''}
          >
            {status.kind === 'loading' ? t('regions.refreshing') : t('regions.refresh')}
          </button>
          {status.kind === 'ok' && <span className="regions-refresh-ok">{status.message}</span>}
          {status.kind === 'error' && <span className="regions-refresh-error">{status.message}</span>}
        </form>
      )}

      {ranked.length === 0 ? (
        <p className="regions-empty" data-testid="regions-empty">
          {t('regions.empty')}
        </p>
      ) : (
        <table className="regions-table">
          <thead>
            <tr>
              <th scope="col">{t('regions.columns.rank')}</th>
              <th scope="col">{t('regions.columns.region')}</th>
              <th scope="col">{t('regions.columns.country')}</th>
              <th scope="col">{t('regions.columns.bonus')}</th>
              <th scope="col">{t('regions.columns.resources')}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, i) => {
              const src = flagSrc(dataset.countryFlags[row.region.currentCountry]);
              return (
                <tr key={row.region.id} data-testid="regions-row">
                  <td className="regions-rank">{i + 1}</td>
                  <td>{row.region.name}</td>
                  <td data-testid="regions-country-cell">
                    <span className="regions-country-cell">
                      {src && <img className="regions-flag" src={src} alt="" aria-hidden="true" />}
                      {row.region.currentCountry}
                    </span>
                  </td>
                  <td className="regions-bonus">{t('regions.bonusValue', { value: row.totalBonus })}</td>
                  <td>
                    <span className="regions-chips">
                      {row.matched.map((res) => (
                        <span key={res.name} className="regions-chip">
                          {res.name} +{res.bonus}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/views/RegionsView/RegionsView.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Add styles for the refresh control**

In `styles/regions.css`, append at the end of the file:

```css
.regions-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.regions-refresh-toggle {
  padding: 4px 10px;
  border: 1px solid var(--border-color, #d0d0d0);
  border-radius: 6px;
  background: var(--card-bg, #fff);
  color: inherit;
  cursor: pointer;
  font-size: 0.85em;
}

.regions-refresh-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 4px 0 12px;
  padding: 10px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
}

.regions-refresh-form input {
  flex: 1 1 240px;
  padding: 5px 8px;
}

.regions-erpk-label {
  flex-basis: 100%;
  font-size: 0.85em;
  opacity: 0.8;
}

.regions-refresh-ok {
  color: #2e7d32;
  font-size: 0.85em;
}

.regions-refresh-error {
  color: #c62828;
  font-size: 0.85em;
}
```

- [ ] **Step 6: Run the whole suite + build**

Run: `npm test`
Expected: all suites green (trim, ranking, regionData, RegionsView, App, i18n, calc golden, …).

Run: `npm run build`
Expected: `tsc --noEmit` clean + `vite build` success.

- [ ] **Step 7: Commit**

```bash
git add src/views/RegionsView/RegionsView.tsx src/views/RegionsView/RegionsView.test.tsx styles/regions.css
git commit -m "feat(regions): load live dataset + add erpk refresh control"
```

---

## Task 7: Bind-mount storage in docker-compose

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add the bind mount + DATA_DIR**

Replace the contents of `docker-compose.yml` with:

```yaml
services:
  calculator:
    image: registry.yurii.live/erep-calculator:latest
    container_name: erep-calculator
    restart: unless-stopped
    ports:
      - "8085:8080"
    volumes:
      - ./data:/data
    environment:
      - PORT=8080
      - DATA_DIR=/data
```

- [ ] **Step 2: Document the server-side prep (deploy note — not run now)**

The image runs as the non-root `appuser`, so the bind-mounted host directory must be writable by it. At deploy time, on the server (`192.168.10.18`), before `docker compose up -d`:

```bash
# on the server, in ~/docker/erep-calculator
mkdir -p data
chmod 777 data   # data holds only public region JSON; 777 lets the container's appuser write it
```

(Alternative if stricter perms are wanted: `chown` the dir to the container's uid — inspect with `docker run --rm registry.yurii.live/erep-calculator:latest id appuser`.) If the dir is not writable, `POST /api/regions/refresh` returns 502 and the app keeps serving the bundled seed — no crash.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore(deploy): bind-mount region data dir into the calculator"
```

---

## Task 8: Full verification + manual smoke

- [ ] **Step 1: Type-check + build**

Run: `npm run build`
Expected: `tsc --noEmit` clean, `vite build` produces `dist/` with no errors.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all green — including the new `trimMapData`, `regionData`, refactored `ranking`, and `RegionsView` refresh tests, plus the unchanged calc golden-parity canary.

- [ ] **Step 3: Local end-to-end smoke (dev)**

Run `npm run dev`, open the Regions tab. Confirm the table renders from the bundled seed and the note reads "Updated 2026-05-31". Click **Update data**, paste a real `erpk` cookie, submit, and confirm the list re-ranks and the note shows today's date. (This is the one step that needs a real session cookie — performed by the user.)

- [ ] **Step 4: Final commit (only if Steps 1-2 required fixes)**

```bash
git add -A
git commit -m "chore(regions): verification fixups"
```
