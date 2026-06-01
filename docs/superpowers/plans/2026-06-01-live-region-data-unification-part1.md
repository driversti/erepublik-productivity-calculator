# Live Region-Data Unification — Part 1 (permalink in dataset, kill travelData)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `permalink` a first-class field of the region dataset (from map-data + backfilled seed) and remove the `travelData.js` id→permalink bridge, so the optimizer fetches region pages directly from the dataset and no longer silently skips regions missing from a separate lookup table.

**Architecture:** `RegionEntry` gains `permalink`. The seed (`regionResources.ts`) is regenerated with permalinks backfilled from `travelData.js` (by id) plus the one missing region (Lithuania Minor → `Lithuania-Minor`). `trimMapData` extracts `permalink` from raw map-data so server-refreshed data carries it too. `liveEconomy.getRegionDetails` builds the region URL from `region.permalink` instead of a `travelData` lookup. `travelData.js` and its `regions` re-export are deleted.

**Tech Stack:** TypeScript (strict), Vitest, Node ESM. Pure functions; golden-parity unaffected.

**Spec:** `docs/superpowers/specs/2026-06-01-live-region-data-unification-design.md`

---

## File structure

- `src/data/regionResources.ts` — add `permalink` to `RegionEntry`; regenerate the `REGION_RESOURCES` array with a `permalink` on every region (data file, ~3700 lines).
- `src/data/regionResources.test.ts` — assert every seed region has a non-empty `permalink`.
- `src/data/travel.ts` — drop the `regions` re-export; keep `countries`.
- `server/trimMapData.js` — extract `permalink` from raw map-data.
- `server/trimMapData.test.js` — fixture carries a permalink; assert it survives.
- `src/services/economySource.ts` — `getRegionDetails` takes region refs (id + permalink), not bare ids.
- `src/services/liveEconomy.ts` — build URL from `region.permalink`; drop `regions` import from `travel`.
- `src/services/liveEconomy.test.ts` — pass region refs; rename the "unknown id" case to "empty permalink".
- `src/views/OptimizerView/runScan.ts` — pass region objects to `getRegionDetails`.
- `travelData.js` — **deleted** at the end.
- `server.js` — update the stale comment about serving `travelData.js`.

> **GATE — do Task 1 first.** Task 3 assumes raw map-data exposes a per-region permalink/slug. If Task 1 finds none, STOP and insert a "resolve permalink via Society pages server-side" task before Task 3. Tasks 2, 5, 6 do not depend on the map-data permalink (the seed backfill comes from `travelData.js`), so the bug fix + travelData removal still land regardless.

---

### Task 1: Verify raw map-data exposes a region permalink

**Files:** none (investigation; records a finding).

- [ ] **Step 1: Capture raw map-data with a valid session**

In the calculator session, ask the user to run (the `!` prefix runs it in-session so output lands here):

```
! curl -s 'https://www.erepublik.com/en/main/map-data?updated_at=2007-01-01T00%3A00%3A00-08%3A00' \
    -H 'Cookie: erpk=<PASTE_ERPK>' \
    -H 'X-Requested-With: XMLHttpRequest' \
    -H 'Accept: application/json, text/javascript, */*; q=0.01' \
    -H 'Referer: https://www.erepublik.com/en/military/campaigns' \
    | head -c 2000
```

- [ ] **Step 2: Inspect one region object's keys**

Look at a single region entry's `region` object (and the entry itself) for a permalink/slug/link field. Note the EXACT field path, e.g. `r.region.permalink` or `r.region.link` or a slug embedded in a URL.

- [ ] **Step 3: Record the finding**

Write the field path into Task 3 Step 3 below (replace the `<PERMALINK_FIELD>` marker).
- If a permalink field exists → proceed to Task 2.
- If NONE exists → STOP. The live-refresh path needs a permalink source; insert a server-side Society-page resolution task (fetch each owner country's Society page, match region by `name` → permalink) before Task 3. Tasks 2/5/6 may still proceed (seed backfill is independent).

---

### Task 2: Add `permalink` to `RegionEntry` and backfill the seed

**Files:**
- Modify: `src/data/regionResources.ts` (type + every region object)
- Modify: `src/data/regionResources.test.ts`
- Create (temporary): `scripts/backfill-permalinks.mjs`

- [ ] **Step 1: Write the failing test**

Add to `src/data/regionResources.test.ts` (inside the `describe('regionResources dataset', ...)` block):

```ts
it('every seed region has a non-empty permalink', () => {
  const missing = REGION_RESOURCES.filter((r) => !r.permalink).map((r) => `${r.id} ${r.name}`);
  expect(missing).toEqual([]);
});
```

- [ ] **Step 2: Add `permalink` to the type and run the test to watch it fail**

In `src/data/regionResources.ts`, add the field to `RegionEntry`:

```ts
export interface RegionEntry {
  /** eRepublik region id */
  id: number;
  name: string;
  /** URL slug for /en/main/region/{permalink} — stable, never stale. */
  permalink: string;
  /** Historical owner — stable, never stale. */
  originalCountry: string;
  /** Owner at snapshot time — may be stale (war). */
  currentCountry: string;
  resources: RegionResource[];
}
```

Run: `npx vitest run src/data/regionResources.test.ts`
Expected: FAIL — the new test reports all 221 regions in `missing` (no `permalink` on any region object yet). The build/type also flags missing `permalink` if compiled, but the runtime test failure is the signal.

- [ ] **Step 3: Write the backfill script**

Create `scripts/backfill-permalinks.mjs`:

```js
// One-off: inject a `permalink` into every region object in regionResources.ts,
// sourced from travelData.js by region id, plus the one region missing there.
// Run once: `node scripts/backfill-permalinks.mjs`. Safe to delete afterwards.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { regions as travelRegions } from '../travelData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '../src/data/regionResources.ts');

// id -> permalink from travelData, plus regions absent there (verified live).
const byId = new Map();
for (const r of Object.values(travelRegions)) byId.set(r.id, r.permalink);
byId.set(663, 'Lithuania-Minor'); // absent from travelData; confirmed on the Society page

const text = fs.readFileSync(FILE, 'utf8');
const marker = 'export const REGION_RESOURCES';
const head = text.slice(0, text.indexOf(marker));
const body = text.slice(text.indexOf(marker));

// Insert a permalink line immediately after each region object's `"id": N,`
// line (exactly 4-space indent — resource ids are nested deeper, country flags
// are above the marker and not touched).
const lines = body.split('\n');
const out = [];
const missing = [];
for (const line of lines) {
  out.push(line);
  const m = /^ {4}"id": (\d+),$/.exec(line);
  if (m) {
    const id = Number(m[1]);
    const permalink = byId.get(id);
    if (!permalink) { missing.push(id); continue; }
    out.push(`    "permalink": ${JSON.stringify(permalink)},`);
  }
}
if (missing.length) {
  console.error('No permalink for region ids:', missing.join(', '));
  process.exit(1);
}
fs.writeFileSync(FILE, head + out.join('\n'));
console.log('Backfilled permalinks into regionResources.ts');
```

- [ ] **Step 4: Run the script**

Run: `node scripts/backfill-permalinks.mjs`
Expected: prints `Backfilled permalinks into regionResources.ts` and exits 0 (no "No permalink for region ids"). If it lists ids, those ids are absent from travelData — add them to `byId` with permalinks verified on the Society page, then re-run.

- [ ] **Step 5: Run the test + typecheck to verify green**

Run: `npx vitest run src/data/regionResources.test.ts`
Expected: PASS (all 5+ tests, including the new permalink test).
Run: `npx tsc --noEmit`
Expected: no errors (every region literal now satisfies `RegionEntry`).

- [ ] **Step 6: Delete the one-off script and commit**

```bash
rm scripts/backfill-permalinks.mjs
git add src/data/regionResources.ts src/data/regionResources.test.ts
git commit -m "feat(data): add permalink to RegionEntry, backfill the seed"
```

---

### Task 3: Extract `permalink` in `trimMapData`

**Files:**
- Modify: `server/trimMapData.js`
- Modify: `server/trimMapData.test.js`

- [ ] **Step 1: Write the failing test**

In `server/trimMapData.test.js`, add a `permalink` to the `RAW` fixture's region objects and assert it survives. Edit the `'3'` entry's `region` and add an assertion:

Change `region: { id: '3', name: 'Dobrogea' },` to
`region: { id: '3', name: 'Dobrogea', permalink: 'Dobrogea' },`
and add this test:

```js
it('keeps the region permalink', () => {
  const out = trimMapData(RAW, 'd');
  expect(out.regions.find((r) => r.id === 3).permalink).toBe('Dobrogea');
});
```

- [ ] **Step 2: Run the test to watch it fail**

Run: `npx vitest run server/trimMapData.test.js`
Expected: FAIL — `permalink` is `undefined` (trimMapData doesn't copy it yet).

- [ ] **Step 3: Add the extraction**

In `server/trimMapData.js`, inside the `regions.push({...})`, add the permalink line (use the field path confirmed in Task 1; shown here as `r.region.permalink` — replace `<PERMALINK_FIELD>` if different):

```js
    regions.push({
      id: Number(r.region.id),
      name: r.region.name,
      permalink: r.region.permalink || '', // <PERMALINK_FIELD> confirmed in Task 1
      originalCountry: (oc && oc.name) || '',
      currentCountry: (cc && cc.name) || '',
      resources: res.map((x) => ({
        name: x.name,
        industry: INDUSTRY_MAP[x.industry] || x.industry,
        bonus: Number(x.bonus),
      })),
    });
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run server/trimMapData.test.js`
Expected: PASS (all trimMapData tests).

- [ ] **Step 5: Commit**

```bash
git add server/trimMapData.js server/trimMapData.test.js
git commit -m "feat(server): extract region permalink in trimMapData"
```

---

### Task 4: `getRegionDetails` builds the URL from `region.permalink`

**Files:**
- Modify: `src/services/economySource.ts`
- Modify: `src/services/liveEconomy.ts`
- Modify: `src/services/liveEconomy.test.ts`

- [ ] **Step 1: Update the failing tests first**

In `src/services/liveEconomy.test.ts`, change every `getRegionDetails` call to pass region refs (id + permalink) instead of bare ids, and rename the "unknown id" case. Replace the four call sites:

```ts
// was: source.getRegionDetails('food', [38])
const result = await source.getRegionDetails('food', [{ id: 38, permalink: 'Oltenia' }]);
```
```ts
// was: source.getRegionDetails('food', [38, 39])
await source.getRegionDetails('food', [{ id: 38, permalink: 'Oltenia' }, { id: 39, permalink: 'Muntenia' }], ...)
```
```ts
// was: source.getRegionDetails('food', [])
const result = await source.getRegionDetails('food', []);
```

Replace the "skips an unknown region id" test body with an empty-permalink case:

```ts
it('skips a region with an empty permalink without calling fetch', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse(REGION_HTML));
  const source = new LiveEconomySource();
  const result = await source.getRegionDetails('food', [{ id: 999999, permalink: '' }]);
  expect(result.size).toBe(0);
  expect(fetchMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Update the interface**

In `src/services/economySource.ts`, add a `RegionRef` type and change the signature:

```ts
/** Minimal region reference for fetching its live page. */
export interface RegionRef {
  id: number;
  permalink: string;
}

export interface CountryEconomySource {
  getCountryEconomics(
    industry: IndustryKey,
    countryNames: string[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<string, CountryEconomics>>;

  /** real region bonus + quality-indexed pollution for specific regions (Phase 3) */
  getRegionDetails(
    industry: IndustryKey,
    regions: RegionRef[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, RegionLiveDetails>>;
}
```

- [ ] **Step 3: Run the tests to watch them fail**

Run: `npx vitest run src/services/liveEconomy.test.ts`
Expected: FAIL — `liveEconomy.ts` still types the param as `number[]` / looks regions up in `travel`.

- [ ] **Step 4: Update the implementation**

In `src/services/liveEconomy.ts`: remove `regions` from the `travel` import (keep `countries`), import `RegionRef`, and rewrite `getRegionDetails` to use `region.permalink`:

```ts
import { countries } from '../data/travel';
import type { CountryEconomics, CountryEconomySource, RegionLiveDetails, RegionRef } from './economySource';
```

```ts
  async getRegionDetails(
    industry: IndustryKey,
    regions: RegionRef[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, RegionLiveDetails>> {
    const cfg = SCRAPE_CONFIG[industry];
    const result = new Map<number, RegionLiveDetails>();
    const total = regions.length;
    let done = 0;

    await mapWithLimit(regions, CONCURRENCY, async (region) => {
      try {
        if (!region.permalink) return; // no slug — cannot build the URL
        const url = getProxyUrl(erepUrl.region(region.permalink));
        const res = await fetch(url);
        if (!res.ok) return;
        const html = await res.text();
        result.set(region.id, {
          regionBonus: parseRegionBonus(html, cfg),
          pollution: parseRegionPollution(html, cfg),
        });
      } catch {
        // skip on any network or parse error
      } finally {
        done++;
        onProgress?.(done, total);
      }
    });

    return result;
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/services/liveEconomy.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/economySource.ts src/services/liveEconomy.ts src/services/liveEconomy.test.ts
git commit -m "refactor(optimizer): build region URL from permalink, not travelData id lookup"
```

---

### Task 5: Pass region objects through `runScan`

**Files:**
- Modify: `src/views/OptimizerView/runScan.ts:66-71`

- [ ] **Step 1: Update the call site**

In `runScan.ts`, the finalists already carry full `region` objects (now with `permalink`). Change the `getRegionDetails` argument from ids to the region objects:

```ts
  const topCandidates = top.map((r) => ({ region: r.region, regionBonus: r.regionBonus }));
  const details = await source.getRegionDetails(
    industry,
    top.map((r) => r.region), // RegionEntry has id + permalink
    (done, total) => onProgress({ phase: 'pollution', done, total }),
  );
```

- [ ] **Step 2: Typecheck + run the optimizer/view tests**

Run: `npx tsc --noEmit`
Expected: no errors (`RegionEntry` satisfies `RegionRef`).
Run: `npx vitest run src/calc/optimizer.test.ts src/views/OptimizerView`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/views/OptimizerView/runScan.ts
git commit -m "refactor(optimizer): pass region objects (with permalink) to getRegionDetails"
```

---

### Task 6: Delete `travelData.js` and its `regions` re-export

**Files:**
- Modify: `src/data/travel.ts`
- Delete: `travelData.js`
- Modify: `server.js:20-24` (comment only)

- [ ] **Step 1: Drop the `regions` re-export from `travel.ts`**

In `src/data/travel.ts`, remove the `regions` import + export and the `RegionEntry` interface that mirrored travelData (keep `countries`, `CountryEntry`). Resulting file:

```ts
// Countries are a stable, static fact (id/name/permalink) and live in their own
// `countries.json`. Region identity (id/name/permalink) now lives in the region
// dataset (`regionResources.ts` seed + server-refreshed map-data), so the old
// `regions` map from travelData.js is gone.
import countriesJson from './countries.json';

export interface CountryEntry {
  id: number;
  name: string;
  permalink: string;
}

export const countries = countriesJson as unknown as Record<number, CountryEntry>;
```

- [ ] **Step 2: Confirm nothing else imports `regions` from travel or travelData**

Run: `grep -rn "from '.*travelData'\|regions } from '.*/travel'\|regions as " src/`
Expected: no matches (the test that referenced it was reverted earlier; `liveEconomy` was updated in Task 4).

- [ ] **Step 3: Delete the file and fix the server comment**

```bash
git rm travelData.js
```

In `server.js`, update the comment at lines ~20-24 to drop the `travelData.js` example:

```js
// Serve the Vite production build (run `npm run build` first). Falls back to the
// repo root if dist is absent, and serves static assets referenced by the build.
```

- [ ] **Step 4: Full typecheck, build, and test suite**

Run: `npm run build`
Expected: `tsc --noEmit` clean + `vite build` succeeds.
Run: `npx vitest run`
Expected: all test files pass (no reference to a deleted module).

- [ ] **Step 5: Commit**

```bash
git add src/data/travel.ts server.js
git commit -m "refactor: delete travelData.js — permalink now lives in the region dataset"
```

---

## Self-review notes

- **Spec coverage:** permalink-in-dataset (Tasks 2-3), getRegionDetails off travelData (Task 4-5), travelData deletion (Task 6), seed-as-fallback retained (Task 2). Server scheduler + admin erpk UI are **Part 2** (separate plan), as is the live `stale` flag and the auto-refresh interval.
- **Gate:** Task 1 verifies the map-data permalink field; if absent, Task 3 needs a Society-page resolution sub-task (called out in the GATE box). The bug fix + travelData removal (Tasks 2,4,5,6) do not depend on it.
- **Type consistency:** `RegionRef {id, permalink}` (Task 4) is satisfied by `RegionEntry` (Task 2) and passed in Task 5. `getRegionDetails` signature is identical across `economySource.ts`, `liveEconomy.ts`, tests, and `runScan.ts`.
- **No placeholders** except the deliberate `<PERMALINK_FIELD>` marker in Task 3, which Task 1 resolves.
