# Live Region-Data Unification — Part 2 (anonymous Society-page universe)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Source the optimizer's region universe + ownership + permalink from the **Country Society pages** (anonymous), cached server-side; join resource bonuses from the stable seed; drop the map-data/erpk machinery entirely.

**Architecture:** Server enumerates all 74 countries' Society pages anonymously, aggregates a universe `[{permalink, name, currentCountry}]`, caches it to disk with a TTL, and serves `GET /api/universe`. The client fetches it (seed fallback), joins each region's resource bonus from the seed by `permalink`, and ranks. The old `/api/regions` + `/api/regions/refresh` + `trimMapData` map-data path is removed.

**Tech Stack:** Node ESM (server, plain JS), TypeScript (client), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-01-live-region-data-unification-design.md`
**Depends on:** Part 1 (done) — `permalink` is a field on `RegionEntry`.

---

## File structure

- `server/regionList.js` (new) — JS port of `parseRegionList` (Society-page region link parser).
- `server/regionList.test.js` (new).
- `server/buildUniverse.js` (new) — pure `aggregateUniverse(perCountryLists)` + a `fetchUniverse(fetchImpl, countries)` orchestrator.
- `server/buildUniverse.test.js` (new) — tests the pure aggregator with stubbed lists.
- `server.js` — add `GET /api/universe` (disk cache + TTL + background refresh); remove `/api/regions`, `/api/regions/refresh`, `handleRefresh`, and the `trimMapData` import.
- `server/trimMapData.js`, `server/trimMapData.test.js` — deleted.
- `src/services/universe.ts` (new) — `fetchUniverse(): Promise<UniverseRegion[]>` (GET `/api/universe`; seed fallback).
- `src/services/universe.test.ts` (new).
- `src/calc/regionJoin.ts` (new) — `joinUniverseWithSeed(universe, seed)` → `{ regions: RegionEntry[]; skipped: number }`.
- `src/calc/regionJoin.test.ts` (new).
- `src/views/OptimizerView/runScan.ts` — source candidates from the universe+join instead of `fetchRegionData`.
- `src/views/OptimizerView/OptimizerView.tsx` + `ResultsTable`/summary — surface the skipped (no-bonus) count.
- `src/services/regionData.ts` — keep the normalized seed (bonuses + flags) for the Regions tab; remove `refreshRegionData` + the `/api/regions` GET. (Verify the Regions tab still builds.)

---

### Task 1: Port `parseRegionList` to server JS

**Files:** Create `server/regionList.js`, `server/regionList.test.js`.

- [ ] **Step 1: Write the failing test** — `server/regionList.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseRegionList } from './regionList.js';

const HTML = `
  <a href="//www.erepublik.com/en/main/region/Lithuania-Minor" class="x">Lithuania Minor</a>
  <a href="//www.erepublik.com/en/main/region/Samogitia">Samogitia</a>
  <a href="//www.erepublik.com/en/main/region/Samogitia">Samogitia</a>
  <a href="//www.erepublik.com/en/main/region/Whatever">Details</a>
`;

describe('parseRegionList (server)', () => {
  it('extracts unique region {name, permalink}, drops "Details", sorts by name', () => {
    expect(parseRegionList(HTML)).toEqual([
      { name: 'Lithuania Minor', permalink: 'Lithuania-Minor' },
      { name: 'Samogitia', permalink: 'Samogitia' },
    ]);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `npx vitest run server/regionList.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement** — `server/regionList.js` (mirror of `src/services/regions.ts:parseRegionList`):

```js
// JS port of src/services/regions.ts parseRegionList — region links on the
// Country Society page. Kept in sync with the TS original.
export function parseRegionList(html) {
  const regex = /href="\/\/www\.erepublik\.com\/en\/main\/region\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const out = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(html)) !== null) {
    const permalink = match[1];
    const name = match[2].replace(/<[^>]*>/g, '').trim();
    if (name.toLowerCase() === 'details') continue;
    if (seen.has(permalink)) continue;
    seen.add(permalink);
    out.push({ name, permalink });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
```

- [ ] **Step 4: Run it, watch it pass** — `npx vitest run server/regionList.test.js` → PASS.

- [ ] **Step 5: Commit** — `git add server/regionList.js server/regionList.test.js && git commit -m "feat(server): port parseRegionList for universe enumeration"`

---

### Task 2: Universe aggregator

**Files:** Create `server/buildUniverse.js`, `server/buildUniverse.test.js`.

- [ ] **Step 1: Write the failing test** — `server/buildUniverse.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { aggregateUniverse } from './buildUniverse.js';

describe('aggregateUniverse', () => {
  it('tags each region with its owner country, dedupes by permalink, sorts by permalink', () => {
    const out = aggregateUniverse([
      { country: 'Lithuania', regions: [{ name: 'Samogitia', permalink: 'Samogitia' }] },
      { country: 'Poland', regions: [{ name: 'Masovia', permalink: 'Masovia' }] },
      // same region seen under two countries → first owner wins (occupation order)
      { country: 'Russia', regions: [{ name: 'Samogitia', permalink: 'Samogitia' }] },
    ]);
    expect(out).toEqual([
      { permalink: 'Masovia', name: 'Masovia', currentCountry: 'Poland' },
      { permalink: 'Samogitia', name: 'Samogitia', currentCountry: 'Lithuania' },
    ]);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `npx vitest run server/buildUniverse.test.js` → FAIL.

- [ ] **Step 3: Implement** — `server/buildUniverse.js`:

```js
import { parseRegionList } from './regionList.js';

// Pure: per-country region lists -> deduped universe tagged with the owner.
// Input: [{ country, regions: [{name, permalink}] }]. First occurrence of a
// permalink wins (lists are passed in a stable order).
export function aggregateUniverse(perCountry) {
  const byPermalink = new Map();
  for (const { country, regions } of perCountry) {
    for (const r of regions) {
      if (byPermalink.has(r.permalink)) continue;
      byPermalink.set(r.permalink, { permalink: r.permalink, name: r.name, currentCountry: country });
    }
  }
  return [...byPermalink.values()].sort((a, b) => a.permalink.localeCompare(b.permalink));
}

// Orchestrator: fetch each country's Society page and aggregate. `fetchImpl`
// is injected (the server's anonymous fetch). `countries` is [{name, permalink}].
export async function buildUniverse(fetchImpl, countries) {
  const perCountry = [];
  for (const c of countries) {
    try {
      const html = await fetchImpl(`https://www.erepublik.com/en/country/society/${c.permalink}`);
      perCountry.push({ country: c.name, regions: parseRegionList(html) });
    } catch {
      // skip a country whose page failed — partial universe is still useful
    }
  }
  return aggregateUniverse(perCountry);
}
```

- [ ] **Step 4: Run it, watch it pass** — `npx vitest run server/buildUniverse.test.js` → PASS.

- [ ] **Step 5: Commit** — `git add server/buildUniverse.js server/buildUniverse.test.js && git commit -m "feat(server): universe aggregator from Society region lists"`

---

### Task 3: `/api/universe` endpoint (cache + TTL); remove map-data path

**Files:** Modify `server.js`; delete `server/trimMapData.js` + `server/trimMapData.test.js`.

- [ ] **Step 1: Add the endpoint + cache to `server.js`.**

At the top, replace the `trimMapData` import with the universe builder and add config:

```js
import { buildUniverse } from './server/buildUniverse.js';
import countries from './src/data/countries.json' with { type: 'json' };

const UNIVERSE_FILE = path.join(DATA_DIR, 'universe.json');
// The optimizer scans the whole world, so we always enumerate ALL 74 countries
// (no useful subset). One shared 30-min cache keeps the GCP IP at ~74 anonymous
// fetches per window regardless of how many users scan.
const UNIVERSE_TTL_MS = 30 * 60 * 1000; // 30 min
let universeBuilding = null; // in-flight guard (collapse concurrent rebuilds into one)
```

Add an anonymous fetch helper (same headers the `/proxy` handler uses) returning the page text:

```js
function fetchErepText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    } }, (r) => {
      if (r.statusCode !== 200) { r.resume(); reject(new Error(`HTTP ${r.statusCode}`)); return; }
      let body = ''; r.setEncoding('utf8');
      r.on('data', (c) => { body += c; });
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function getUniverse() {
  try {
    const stat = await fs.promises.stat(UNIVERSE_FILE);
    if (Date.now() - stat.mtimeMs < UNIVERSE_TTL_MS) {
      return JSON.parse(await fs.promises.readFile(UNIVERSE_FILE, 'utf8'));
    }
  } catch { /* missing or unreadable — rebuild */ }
  if (!universeBuilding) {
    universeBuilding = (async () => {
      const list = Object.values(countries);
      const regions = await buildUniverse(fetchErepText, list);
      const data = { fetchedAt: new Date().toISOString(), regions };
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${UNIVERSE_FILE}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(data));
      await fs.promises.rename(tmp, UNIVERSE_FILE);
      return data;
    })().finally(() => { universeBuilding = null; });
  }
  return universeBuilding;
}
```

Add the route (near the old `/api/regions` block):

```js
if (pathname === '/api/universe' && req.method === 'GET') {
  getUniverse()
    .then((data) => { sendJson(res, 200, data); })
    .catch(() => { sendJson(res, 502, { error: 'Could not build region universe' }); });
  return;
}
```

- [ ] **Step 2: Remove the map-data path.** Delete the `/api/regions` GET block, the `/api/regions/refresh` block, the `handleRefresh` function, the `trimMapData` import, and the `MAP_DATA_URL`/`REGIONS_FILE`/`REFRESH_COOLDOWN_MS`/`lastRefreshOk` constants that only served it.

- [ ] **Step 3: Delete the map-data transform.** `git rm server/trimMapData.js server/trimMapData.test.js`

- [ ] **Step 4: Smoke-test the endpoint locally.**

Run the server: `node server.js &` then `curl -s localhost:8080/api/universe -w '\nHTTP %{http_code}\n' | head -c 400` ; kill it.
Expected: HTTP 200 with `{"fetchedAt":...,"regions":[{"permalink":...,"name":...,"currentCountry":...}, ...]}` (74 countries enumerated; first call slower). If the network is unavailable in the sandbox, note it and rely on the unit tests instead.

- [ ] **Step 5: Run the suite + commit.**

`npx vitest run` → all pass (no `trimMapData` references remain).
`git add server.js && git commit -m "feat(server): /api/universe (anonymous Society enumeration), remove map-data refresh"`

---

### Task 4: Client `fetchUniverse()` with seed fallback

**Files:** Create `src/services/universe.ts`, `src/services/universe.test.ts`.

- [ ] **Step 1: Write the failing test** — `src/services/universe.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchUniverse } from './universe';

afterEach(() => vi.restoreAllMocks());

describe('fetchUniverse', () => {
  it('returns the server universe + fetchedAt on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ fetchedAt: '2026-06-01T07:00:00.000Z', regions: [{ permalink: 'Samogitia', name: 'Samogitia', currentCountry: 'Lithuania' }] }),
      { status: 200 },
    ));
    const out = await fetchUniverse();
    expect(out.fetchedAt).toBe('2026-06-01T07:00:00.000Z');
    expect(out.regions.find((r) => r.permalink === 'Samogitia')?.currentCountry).toBe('Lithuania');
  });

  it('falls back to a seed-derived universe with fetchedAt=null on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    const out = await fetchUniverse();
    expect(out.fetchedAt).toBeNull(); // null => UI shows the "offline snapshot" note
    expect(out.regions.length).toBeGreaterThan(0);
    expect(out.regions.every((r) => typeof r.permalink === 'string' && r.permalink.length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `npx vitest run src/services/universe.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** — `src/services/universe.ts`:

```ts
import { REGION_RESOURCES } from '../data/regionResources';

export interface UniverseRegion {
  permalink: string;
  name: string;
  currentCountry: string;
}

export interface Universe {
  regions: UniverseRegion[];
  /** ISO timestamp the server last enumerated the Society pages; null when the
   *  seed fallback is used (server unreachable). Drives the UI freshness note. */
  fetchedAt: string | null;
}

function seedUniverse(): Universe {
  return {
    regions: REGION_RESOURCES.map((r) => ({ permalink: r.permalink, name: r.name, currentCountry: r.currentCountry })),
    fetchedAt: null,
  };
}

/** Live region universe from the server; seed-derived fallback on any failure. */
export async function fetchUniverse(): Promise<Universe> {
  try {
    const res = await fetch('/api/universe');
    if (!res.ok) return seedUniverse();
    const data: unknown = await res.json();
    const regions = (data as { regions?: unknown }).regions;
    const fetchedAt = (data as { fetchedAt?: unknown }).fetchedAt;
    if (!Array.isArray(regions)) return seedUniverse();
    return { regions: regions as UniverseRegion[], fetchedAt: typeof fetchedAt === 'string' ? fetchedAt : null };
  } catch {
    return seedUniverse();
  }
}
```

- [ ] **Step 4: Run it, watch it pass** — `npx vitest run src/services/universe.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/services/universe.ts src/services/universe.test.ts && git commit -m "feat(optimizer): fetchUniverse with seed fallback"`

---

### Task 5: Join universe with seed bonuses

**Files:** Create `src/calc/regionJoin.ts`, `src/calc/regionJoin.test.ts`.

- [ ] **Step 1: Write the failing test** — `src/calc/regionJoin.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { joinUniverseWithSeed } from './regionJoin';
import type { RegionEntry } from '../data/regionResources';

const seed: RegionEntry[] = [
  { id: 1, name: 'Samogitia', permalink: 'Samogitia', originalCountry: 'Lithuania', currentCountry: 'Lithuania',
    resources: [{ name: 'Iron', industry: 'weapons', bonus: 2 }] },
];

describe('joinUniverseWithSeed', () => {
  it('uses seed bonuses with the live owner/permalink, counts regions missing from the seed', () => {
    const { regions, skipped } = joinUniverseWithSeed(
      [
        { permalink: 'Samogitia', name: 'Samogitia', currentCountry: 'Russia' }, // occupied
        { permalink: 'BrandNew', name: 'Brand New', currentCountry: 'Poland' },   // not in seed
      ],
      seed,
    );
    expect(skipped).toBe(1);
    expect(regions).toHaveLength(1);
    expect(regions[0].currentCountry).toBe('Russia');       // live owner wins
    expect(regions[0].resources[0].bonus).toBe(2);          // bonus from seed
    expect(regions[0].permalink).toBe('Samogitia');
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `npx vitest run src/calc/regionJoin.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/calc/regionJoin.ts`:

```ts
import type { RegionEntry } from '../data/regionResources';
import type { UniverseRegion } from '../services/universe';

export interface JoinResult {
  regions: RegionEntry[];
  /** universe regions with no matching seed entry (no bonus data) — excluded */
  skipped: number;
}

/**
 * Build candidate RegionEntry[] from the live universe (owner + permalink) joined
 * to the stable seed (resource bonuses) by permalink. Regions absent from the seed
 * have no bonus data and are skipped (counted).
 */
export function joinUniverseWithSeed(universe: UniverseRegion[], seed: RegionEntry[]): JoinResult {
  const byPermalink = new Map(seed.map((r) => [r.permalink, r]));
  const regions: RegionEntry[] = [];
  let skipped = 0;
  for (const u of universe) {
    const s = byPermalink.get(u.permalink);
    if (!s) { skipped++; continue; }
    regions.push({ ...s, name: u.name, permalink: u.permalink, currentCountry: u.currentCountry });
  }
  return { regions, skipped };
}
```

- [ ] **Step 4: Run it, watch it pass** — `npx vitest run src/calc/regionJoin.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/calc/regionJoin.ts src/calc/regionJoin.test.ts && git commit -m "feat(optimizer): join live universe with seed bonuses"`

---

### Task 6: Rewire `runScan` to the universe; surface skipped count

**Files:** Modify `src/views/OptimizerView/runScan.ts`; modify `src/views/OptimizerView/OptimizerView.tsx` (display skipped). Update `src/views/OptimizerView/OptimizerView.test.tsx` if it stubs the dataset.

- [ ] **Step 1: Update `runScan` to source candidates from the universe.**

Replace the dataset/`fetchRegionData` usage with the universe + seed join. At the top of `runScan.ts` add imports:

```ts
import { fetchUniverse } from '../../services/universe';
import { joinUniverseWithSeed } from '../../calc/regionJoin';
import { BUNDLED_DATASET } from '../../services/regionData';
```

Replace the candidate-sourcing lines (currently `const dataset = await fetchRegionData(); const candidates = selectCandidates(dataset.regions, ...)`) with:

```ts
  const universe = await fetchUniverse();
  // BUNDLED_DATASET.regions is the normalized seed (resource bonuses by permalink).
  const { regions, skipped: noBonusCount } = joinUniverseWithSeed(universe.regions, BUNDLED_DATASET.regions);
  const candidates = selectCandidates(regions, industry, { threshold, maxCandidates });
  if (candidates.length === 0) return null;
```

Where the function currently computes `skippedCount` (candidates filtered out by rank) and `ownersSnapshot`, fold in the no-bonus count and thread the universe freshness through. Keep `skippedCount` for below-threshold candidates; report `noBonusCount` and `universeFetchedAt` in the returned `ScanOutcome`:

```ts
  return {
    results: finalRanked,
    baselineNet,
    skippedCount,
    noBonusCount,
    fetchedAt: new Date().toISOString(),     // when this scan ran
    universeFetchedAt: universe.fetchedAt,    // when the cached universe was last built (null = seed fallback)
  };
```

- [ ] **Step 2: Update the `ScanOutcome` type** in `runScan.ts`: add `noBonusCount: number;` and `universeFetchedAt: string | null;`, and remove `ownersSnapshot: string;` (the snapshot-date concept came from map-data). Update `useOptimizer`/state (`src/state/...`) and `OptimizerView` references to `ownersSnapshot` accordingly — remove them; persist/pass `universeFetchedAt` + `noBonusCount` the same way `skippedCount`/`fetchedAt` are.

- [ ] **Step 3: Surface the no-bonus count in `OptimizerView.tsx`.** Where `skippedCount` is shown, add a sibling line when `noBonusCount > 0`:

```tsx
{noBonusCount > 0 && (
  <p className="optimizer-skipped" data-testid="optimizer-no-bonus">
    {t('optimizer.noBonusRegions', { count: noBonusCount })}
  </p>
)}
```

Add the i18n key `optimizer.noBonusRegions` to `src/i18n/locales/en/common.json` (e.g. `"{{count}} live regions not in the resource snapshot (skipped)"`) and to the other 23 locales (English text is acceptable as a placeholder for non-EN — follow the existing pattern; `i18n.test.ts` only checks keys resolve).

- [ ] **Step 4: Typecheck + tests.**

`npx tsc --noEmit` → no errors.
`npx vitest run src/views/OptimizerView src/calc/optimizer.test.ts` → PASS (update `OptimizerView.test.tsx` mocks: it must stub `fetch('/api/universe')` or the `fetchUniverse`/source path; ensure the test provides a universe so a scan yields rows).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(optimizer): source candidates from the live Society universe"`

---

### Task 7: Remove dead map-data client code; final build + test

**Files:** Modify `src/services/regionData.ts`; remove `refreshRegionData` + the `/api/regions` GET if now unused; update `src/services/regionData.test.ts`.

- [ ] **Step 1: Check remaining consumers.**

Run: `grep -rn "fetchRegionData\|refreshRegionData\|/api/regions" src/`
- `BUNDLED_DATASET` is still used (runScan, Regions tab) — KEEP it and `normalizeDataset`.
- `fetchRegionData`/`refreshRegionData`/`/api/regions`: if the Regions tab (`RegionsView`) still calls `fetchRegionData`, leave a thin `fetchRegionData` that just returns `BUNDLED_DATASET` (no network) OR point the Regions tab at `BUNDLED_DATASET` directly. Choose the smaller diff; do NOT keep a call to the now-removed `/api/regions`.

- [ ] **Step 2: Apply the minimal change** so nothing calls the removed `/api/regions`. Remove `refreshRegionData` and the admin-erpk refresh UI if present (search `refreshRegionData` usage in views and remove the control). Keep `BUNDLED_DATASET`/`normalizeDataset`.

- [ ] **Step 3: Full build + suite.**

`npm run build` → clean.
`npx vitest run` → all pass.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "chore: drop dead map-data client code (refresh/api-regions)"`

---

### Task 8: Localized cache-freshness note in the optimizer

**Files:** Create `src/services/freshness.ts` + `src/services/freshness.test.ts`; modify `src/views/OptimizerView/OptimizerView.tsx`; add an i18n key to all 24 `src/i18n/locales/*/common.json`.

Shows, in the active interface language, that region data is cached and when it was last enumerated — e.g. "Region data updated 12 minutes ago" / «Дані регіонів оновлено 12 хвилин тому». Relative wording comes from `Intl.RelativeTimeFormat(locale)` (locale-aware, no per-locale number strings); only the surrounding label is translated.

- [ ] **Step 1: Write the failing test** — `src/services/freshness.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { relativeMinutes } from './freshness';

describe('relativeMinutes', () => {
  it('formats minutes-ago in the given locale via Intl', () => {
    const now = new Date('2026-06-01T07:12:00.000Z').getTime();
    const then = '2026-06-01T07:00:00.000Z'; // 12 min earlier
    // en uses "12 minutes ago"; just assert it mentions 12 and is a non-empty string
    const en = relativeMinutes(then, 'en', now);
    expect(en).toMatch(/12/);
    // unknown/garbage timestamp → null (caller shows the offline note)
    expect(relativeMinutes(null, 'en', now)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `npx vitest run src/services/freshness.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/services/freshness.ts`:

```ts
/** Locale-aware "N minutes ago" for an ISO timestamp; null when absent/invalid.
 *  `now` is injectable for tests. */
export function relativeMinutes(iso: string | null, locale: string, now: number = Date.now()): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const minutes = Math.max(0, Math.round((now - t) / 60000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(-minutes, 'minute');
}
```

- [ ] **Step 4: Run it, watch it pass** — `npx vitest run src/services/freshness.test.ts` → PASS.

- [ ] **Step 5: Render the note in `OptimizerView.tsx`.** Near the existing `fetchedAt`/baseline summary, add (the scan result already carries `universeFetchedAt`):

```tsx
import { useTranslation } from 'react-i18next';
import { relativeMinutes } from '../../services/freshness';
// ...
const { i18n } = useTranslation(); // or reuse the existing t/i18n from the component
const when = relativeMinutes(universeFetchedAt, i18n.language);
// ...in the summary block:
<p className="optimizer-universe-freshness" data-testid="optimizer-universe-freshness">
  {when
    ? t('optimizer.universeFreshness', { when })
    : t('optimizer.universeOffline')}
</p>
```

- [ ] **Step 6: Add i18n keys to every locale.** In each `src/i18n/locales/<code>/common.json`, under the `optimizer` object, add:
  - `"universeFreshness": "Region data updated {{when}}"`
  - `"universeOffline": "Using offline region snapshot"`
  - `"noBonusRegions": "{{count}} live regions not in the resource snapshot (skipped)"` (from Task 6)

Translate for locales you can; English is an acceptable placeholder otherwise (matches existing practice). Provide proper Ukrainian (`uk`): `"universeFreshness": "Дані регіонів оновлено {{when}}"`, `"universeOffline": "Використовується офлайн-знімок регіонів"`, `"noBonusRegions": "{{count}} живих регіонів немає у знімку ресурсів (пропущено)"`.

- [ ] **Step 7: Typecheck, i18n test, suite.**
`npx tsc --noEmit` → clean. `npx vitest run src/i18n` → keys resolve for every locale. `npx vitest run` → all pass.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(optimizer): localized cache-freshness note (updated N min ago)"`

---

## Self-review notes

- **Spec coverage:** universe from Society (Tasks 1-4), seed bonus join (Task 5), optimizer rewiring + skipped surfacing (Task 6), map-data/erpk removal (Tasks 3, 7), localized cache-freshness note (Task 8). Anonymous throughout. Industry tab untouched (already Society-based).
- **Type consistency:** `UniverseRegion {permalink,name,currentCountry}` (Task 4) is consumed by `joinUniverseWithSeed` (Task 5) and produced by the server route (Task 3). `joinUniverseWithSeed` returns `RegionEntry[]` (with `permalink` from Part 1) feeding `selectCandidates` unchanged. `ScanOutcome` gains `noBonusCount`, drops `ownersSnapshot` — update all references (Task 6 Step 2).
- **Open risk:** Task 3's `import ... json with { type: 'json' }` requires a Node version supporting JSON import attributes (Node 22 — repo standard). If unavailable, read `countries.json` via `fs.readFileSync` + `JSON.parse` at startup instead.
- **No placeholders.**
