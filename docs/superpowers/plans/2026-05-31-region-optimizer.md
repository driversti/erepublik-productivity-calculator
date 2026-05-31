# Region Profit Optimizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Optimizer" tab that ranks world regions by estimated daily net profit for the player's current factory setup, combining offline region bonuses with live country economics (avg salary, work tax, VAT, country bonus).

**Architecture:** Four phases — (0) offline bonus pre-filter, (1) live economics for only the owner-countries of the surviving candidates, (2) rank at pollution 0 reusing the existing view-level calc, (3) refine pollution for the top-N finalists. Data transport is abstracted behind a `CountryEconomySource` so the optimizer is agnostic to whether economics arrive browser-direct from erepublik.tools (Approach B, primary) or from a server-side shared cache (Approach C, fallback).

**Tech Stack:** Vite + React 19 + TypeScript + Vitest. Pure calc in `src/calc` (DOM-free, golden-parity locked). State via the existing reducer + facade hooks. i18n via react-i18next.

**Spec:** `docs/superpowers/specs/2026-05-31-region-optimizer-design.md`

**Reuse note:** Ranking calls the **view-level** functions the UI already shows —
`computeIndustryView(...).displayNet` for `fw` industries (food/weapons) and
`computeHiredView(...).displayNet` for `hired` (houses/aircraft) — so the ranked
net matches the headline KPI the user sees. No new profit math is written;
`calc/golden.test.ts` must stay green throughout.

---

## Task 1: Recon spike — erepublik.tools economics + CORS (GATING) ✅ DONE

> **RESOLVED 2026-05-31:** Ran from the GCP VM. `service.erepublik.tools` sends
> **no CORS header** → Approach B (browser-direct) is **dead**. A GCP datacenter IP
> fetches erepublik.com economy pages fine (real HTML, no Cloudflare challenge).
> **Decision: server-side fetch through the existing `/proxy`** (prod now runs on
> GCP, so this egresses from the GCP IP and hides the home IP). No userscript, no
> new `server.js` endpoint, no separate server cache for v1. Task 5 below uses the
> single server-side path (the 5a Tools client and the 5b cache endpoint are NOT
> built); the economy "source" is a thin client-side wrapper over the existing
> `services/regions.ts` fetchers + parsers, called via `/proxy`, concurrency-capped.
> The remaining tasks (2,3,4,6,7,8,9) are unchanged.

This decides Approach B vs C. It is investigation, not production code; no test.

**Files:**
- Create: `docs/superpowers/notes/2026-05-31-tools-api-recon.md` (findings)

- [ ] **Step 1: Probe candidate Tools endpoints**

From a browser devtools console on `https://service.erepublik.tools` (so the
request origin is the Tools site itself), and separately via the app's `/proxy`,
try to locate JSON for country economics and region data. Known working base:
`https://service.erepublik.tools/api/v1/market/item/0/{industry}/{quality}`.
Look for sibling endpoints (e.g. `/api/v1/country/...`, `/api/v1/region/...`)
exposing: per-industry country **bonus**, **average salary**, **work tax**, **VAT**,
and region **bonus** / **pollution**.

- [ ] **Step 2: Test CORS from the app origin**

Run this from the app (dev server, origin `http://localhost:5173`) in the browser console:

```js
fetch('https://service.erepublik.tools/<candidate-endpoint>')
  .then(r => r.json()).then(d => console.log('CORS OK', d))
  .catch(e => console.error('CORS/blocked', e));
```

Expected (Approach B viable): resolves with JSON, no CORS error.
Expected (B not viable): `TypeError: Failed to fetch` / CORS policy error.

- [ ] **Step 3: Record the decision**

Write findings to the notes file: which endpoints exist, exact JSON shape (paste a
sample), and whether CORS is open. Conclude **B** (browser-direct) or **C**
(server cache + VPN). Tasks 5a/5b branch on this.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/notes/2026-05-31-tools-api-recon.md
git commit -m "docs(optimizer): record tools.com economics/CORS recon findings"
```

---

## Task 2: Phase 0 — region bonus + candidate selection (PURE)

**Files:**
- Create: `src/calc/regionBonus.ts`
- Test: `src/calc/regionBonus.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { regionBonusFor, selectCandidates } from './regionBonus';
import type { RegionEntry } from '../data/regionResources';

const region = (id: number, currentCountry: string, res: Array<[ 'food'|'weapons'|'houses'|'aircraft', number ]>): RegionEntry => ({
  id, name: `R${id}`, originalCountry: currentCountry, currentCountry,
  resources: res.map(([industry, bonus]) => ({ name: `${industry}-res`, industry, bonus })),
});

describe('regionBonusFor', () => {
  it('sums only the chosen industry resource bonuses', () => {
    const r = region(1, 'Poland', [['food', 10], ['food', 5], ['weapons', 20]]);
    expect(regionBonusFor(r, 'food')).toBe(15);
    expect(regionBonusFor(r, 'weapons')).toBe(20);
    expect(regionBonusFor(r, 'houses')).toBe(0);
  });
});

describe('selectCandidates', () => {
  const regions = [
    region(1, 'Poland', [['food', 40]]),
    region(2, 'Spain',  [['food', 25]]),
    region(3, 'Cuba',   [['food', 5]]),
    region(4, 'Peru',   [['food', 0]]),
  ];

  it('keeps regions at or above the threshold, sorted by bonus desc', () => {
    const out = selectCandidates(regions, 'food', { threshold: 25, maxCandidates: 10 });
    expect(out.map(c => c.region.id)).toEqual([1, 2]);
    expect(out[0].regionBonus).toBe(40);
  });

  it('caps to maxCandidates by highest bonus', () => {
    const out = selectCandidates(regions, 'food', { threshold: 0, maxCandidates: 2 });
    expect(out.map(c => c.region.id)).toEqual([1, 2]);
  });

  it('drops zero-bonus regions even when threshold is 0', () => {
    const out = selectCandidates(regions, 'food', { threshold: 0, maxCandidates: 10 });
    expect(out.map(c => c.region.id)).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/calc/regionBonus.test.ts`
Expected: FAIL — module `./regionBonus` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { IndustryKey } from '../data/types';
import type { RegionEntry } from '../data/regionResources';

export interface RegionCandidate {
  region: RegionEntry;
  regionBonus: number;
}

export interface CandidateOptions {
  /** keep regions with regionBonus >= threshold */
  threshold: number;
  /** hard ceiling on how many candidates survive (highest bonus wins) */
  maxCandidates: number;
}

export function regionBonusFor(region: RegionEntry, industry: IndustryKey): number {
  let sum = 0;
  for (const r of region.resources) if (r.industry === industry) sum += r.bonus;
  return sum;
}

export function selectCandidates(
  regions: RegionEntry[],
  industry: IndustryKey,
  { threshold, maxCandidates }: CandidateOptions,
): RegionCandidate[] {
  return regions
    .map((region) => ({ region, regionBonus: regionBonusFor(region, industry) }))
    .filter((c) => c.regionBonus > 0 && c.regionBonus >= threshold)
    .sort((a, b) => b.regionBonus - a.regionBonus)
    .slice(0, maxCandidates);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/calc/regionBonus.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/calc/regionBonus.ts src/calc/regionBonus.test.ts
git commit -m "feat(optimizer): offline region-bonus filter (Phase 0)"
```

---

## Task 3: Phase 2 — rankRegions calc (PURE)

**Files:**
- Create: `src/calc/optimizer.ts`
- Test: `src/calc/optimizer.test.ts`

`rankRegions` holds the player's config constant and varies only location
economics. It dispatches on `industry.type` and reads `displayNet` from the
existing view calc, so results match the on-screen headline.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { rankRegions, type OptimizerConfig } from './optimizer';
import type { CountryEconomics } from '../services/economySource';
import type { RegionCandidate } from './regionBonus';
import { INDUSTRIES } from '../data/industries';
import type { RegionEntry } from '../data/regionResources';

const foodCfg = INDUSTRIES.find(i => i.key === 'food')!;

const candidate = (id: number, country: string, bonus: number): RegionCandidate => ({
  region: { id, name: `R${id}`, originalCountry: country, currentCountry: country, resources: [] } as RegionEntry,
  regionBonus: bonus,
});

const econ = (countryBonus: number, averageSalary: number, workTaxRate: number, vat: number): CountryEconomics =>
  ({ countryBonus, averageSalary, workTaxRate, vat });

const baseConfig: OptimizerConfig = {
  industry: foodCfg,
  factoryCells: { 1: { companies: 1, workers: 0 } }, // 1 WAM Q1 factory
  rmCells: {},
  prices: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 },
  rmPrice: 0.01,
  hasTycoon: false,
  wamEnabled: true,
  offeredSalary: 0,
};

describe('rankRegions', () => {
  it('ranks higher net first and pairs region->owner economics', () => {
    const candidates = [candidate(1, 'HighTax', 50), candidate(2, 'LowTax', 50)];
    const economics = new Map<string, CountryEconomics>([
      ['HighTax', econ(20, 100, 25, 1)], // high avg salary -> high work tax
      ['LowTax', econ(20, 1, 1, 1)],     // low avg salary -> low work tax
    ]);
    const out = rankRegions(baseConfig, economics, candidates);
    expect(out[0].region.currentCountry).toBe('LowTax');
    expect(out[0].net).toBeGreaterThan(out[1].net);
  });

  it('skips candidates whose owner has no economics', () => {
    const candidates = [candidate(1, 'Known', 50), candidate(2, 'Unknown', 50)];
    const economics = new Map<string, CountryEconomics>([['Known', econ(20, 1, 1, 1)]]);
    const out = rankRegions(baseConfig, economics, candidates);
    expect(out.map(r => r.region.id)).toEqual([1]);
  });

  it('applies per-region pollution override when supplied', () => {
    const candidates = [candidate(1, 'C', 50)];
    const economics = new Map([['C', econ(20, 1, 1, 1)]]);
    const clean = rankRegions(baseConfig, economics, candidates);
    const polluted = rankRegions(baseConfig, economics, candidates, new Map([[1, { 0: 0, 1: 50 }]]));
    expect(polluted[0].net).toBeLessThan(clean[0].net);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/calc/optimizer.test.ts`
Expected: FAIL — module `./optimizer` not found (and `../services/economySource` not found — created in Task 4; if running this task standalone, define `CountryEconomics` inline temporarily, but the plan creates Task 4 first in practice — reorder if needed).

- [ ] **Step 3: Write minimal implementation**

```ts
import { computeIndustryView } from './strategy';
import { computeHiredView } from './hiredView';
import type { IndustryConfig } from '../data/types';
import type { Cells } from './types';
import type { RegionEntry } from '../data/regionResources';
import type { RegionCandidate } from './regionBonus';
import type { CountryEconomics } from '../services/economySource';

export interface OptimizerConfig {
  industry: IndustryConfig;
  /** finished-goods factory companies/workers per quality */
  factoryCells: Cells;
  /** plantations (fw) or RM companies (hired) per quality */
  rmCells: Cells;
  prices: Record<number, number>;
  rmPrice: number;
  hasTycoon: boolean;
  wamEnabled: boolean;     // fw only; ignored for hired
  offeredSalary: number;
}

export interface RankedRegion {
  region: RegionEntry;
  regionBonus: number;
  economics: CountryEconomics;
  pollution: Record<number, number> | null; // null => estimated at 0
  net: number;
}

const ZERO_POLLUTION: Record<number, number> = {};

export function rankRegions(
  config: OptimizerConfig,
  economicsByCountry: Map<string, CountryEconomics>,
  candidates: RegionCandidate[],
  pollutionByRegion?: Map<number, Record<number, number>>,
): RankedRegion[] {
  const out: RankedRegion[] = [];
  for (const { region, regionBonus } of candidates) {
    const economics = economicsByCountry.get(region.currentCountry);
    if (!economics) continue;
    const pollution = pollutionByRegion?.get(region.id) ?? null;
    const qualityPollution = pollution ?? ZERO_POLLUTION;

    let net: number;
    if (config.industry.type === 'fw') {
      net = computeIndustryView({
        industry: config.industry,
        factoryCells: config.factoryCells,
        plantationCells: config.rmCells,
        countryBonus: economics.countryBonus,
        regionBonus,
        qualityPollution,
        vat: economics.vat,
        prices: config.prices,
        rmPrice: config.rmPrice,
        hasTycoon: config.hasTycoon,
        wamEnabled: config.wamEnabled,
        offeredSalary: config.offeredSalary,
        workTaxRate: economics.workTaxRate,
        averageSalary: economics.averageSalary,
      }).displayNet;
    } else {
      net = computeHiredView({
        industry: config.industry,
        factoryCells: config.factoryCells,
        rmCells: config.rmCells,
        countryBonus: economics.countryBonus,
        regionBonus,
        qualityPollution,
        vat: economics.vat,
        prices: config.prices,
        rmPrice: config.rmPrice,
        hasTycoon: config.hasTycoon,
        offeredSalary: config.offeredSalary,
      }).displayNet;
    }
    out.push({ region, regionBonus, economics, pollution, net });
  }
  out.sort((a, b) => b.net - a.net);
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/calc/optimizer.test.ts src/calc/golden.test.ts`
Expected: PASS (3 optimizer tests; golden still green).

- [ ] **Step 5: Commit**

```bash
git add src/calc/optimizer.ts src/calc/optimizer.test.ts
git commit -m "feat(optimizer): rankRegions reuses view calc for displayNet (Phase 2)"
```

---

## Task 4: CountryEconomySource interface + name normalization

**Files:**
- Create: `src/services/economySource.ts`
- Create: `src/services/countryNames.ts`
- Test: `src/services/countryNames.test.ts`

- [ ] **Step 1: Write the failing test (name normalization)**

```ts
import { describe, it, expect } from 'vitest';
import { normalizeCountryName } from './countryNames';

describe('normalizeCountryName', () => {
  it('maps known aliases to the travel-data canonical name', () => {
    expect(normalizeCountryName('USA')).toBe('United States of America');
    expect(normalizeCountryName('UK')).toBe('United Kingdom');
  });
  it('passes through names that already match', () => {
    expect(normalizeCountryName('Poland')).toBe('Poland');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/countryNames.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the interface + normalizer**

`economySource.ts`:

```ts
import type { IndustryKey } from '../data/types';

export interface CountryEconomics {
  countryBonus: number;   // per-industry productivity bonus (e.g. 20 for +20%)
  averageSalary: number;
  workTaxRate: number;    // percent (e.g. 1.0 for 1%)
  vat: number;            // per-industry percent
}

export interface CountryEconomySource {
  /** economics for the given owner countries, keyed by the SAME country string used in regionResources.currentCountry */
  getCountryEconomics(
    industry: IndustryKey,
    countryNames: string[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<string, CountryEconomics>>;

  /** real quality-indexed pollution for specific regions (Phase 3) */
  getRegionPollution(
    industry: IndustryKey,
    regionIds: number[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<number, Record<number, number>>>;
}
```

`countryNames.ts` — bridges `regionResources` country display names to the keys
the chosen transport needs (and vice-versa). Seed with the known mismatches found
during Task 1; extend as the join surfaces "skipped" regions.

```ts
// regionResources display name -> canonical name used by travel data / transport.
const ALIASES: Record<string, string> = {
  USA: 'United States of America',
  UK: 'United Kingdom',
  // extend after the Task 1 recon reveals the transport's exact country keys
};

export function normalizeCountryName(name: string): string {
  return ALIASES[name] ?? name;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/countryNames.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/economySource.ts src/services/countryNames.ts src/services/countryNames.test.ts
git commit -m "feat(optimizer): CountryEconomySource interface + country-name normalizer"
```

---

## Task 5: Transport implementation (BRANCHES on Task 1 outcome)

> The exact request URLs and JSON parsing depend on the Task 1 recon. Implement
> **5a** if Approach B is viable, otherwise **5b**. Both satisfy the
> `CountryEconomySource` interface from Task 4 and reuse the existing pure parsers
> where possible. Write fixture-backed parser tests mirroring the existing
> `services/regions.test.ts` / `services/livePrices.test.ts` style: a pure
> `parse*` function per response shape, tested against a saved sample, plus a thin
> fetch wrapper with a concurrency cap (reuse the pattern below).

**Files:**
- Create (5a): `src/services/toolsEconomy.ts` + `src/services/toolsEconomy.test.ts`
- Create (5b): `src/services/cachedEconomy.ts` + `src/services/cachedEconomy.test.ts`; modify `server.js` to add `/api/economy`.
- Create: `src/services/concurrency.ts` + test (shared helper).

- [ ] **Step 1: Shared concurrency helper — failing test**

```ts
import { describe, it, expect } from 'vitest';
import { mapWithLimit } from './concurrency';

describe('mapWithLimit', () => {
  it('runs at most `limit` tasks at once and preserves order', async () => {
    let active = 0, maxActive = 0;
    const items = [1, 2, 3, 4, 5];
    const out = await mapWithLimit(items, 2, async (n) => {
      active++; maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active--; return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run → fail**

Run: `npx vitest run src/services/concurrency.test.ts` — FAIL (module missing).

- [ ] **Step 3: Implement helper**

```ts
export async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
```

- [ ] **Step 4: Run → pass**

Run: `npx vitest run src/services/concurrency.test.ts` — PASS.

- [ ] **Step 5: Implement 5a OR 5b**

**5a — `toolsEconomy.ts` (Approach B, browser-direct):** pure `parseCountryEconomics(json, industry)` and `parseRegionPollution(json, industry)` over the Tools JSON shape captured in Task 1; `ToolsApiSource` implements `CountryEconomySource` by fetching the Tools endpoints **directly** (no `/proxy`), wrapping the batch in `mapWithLimit(..., 5, ...)`, applying `normalizeCountryName` to keys, and skipping failed/empty entries. Reuse `parseFoodMisc`-style `status === 'ok'` guards. On a per-item `fetch` rejection, omit that entry (don't reject the batch).

**5b — `cachedEconomy.ts` + `server.js /api/economy` (Approach C, fallback):**
server scrapes erepublik.com country-economy pages once per refresh window using
the existing `parseCountryBonus / parseAverageSalary / parseWorkTax / parseVat`
from `src/services/regions.ts` (the same parsers, run server-side), caches the
result keyed by `{industry, fetchedAt}`, and serves it from `/api/economy?industry=food`.
`CachedProxySource` GETs that endpoint. Region pollution (Phase 3) reuses
`fetchCountryRegionHtml` + `parseRegionPollution` via the existing `/proxy`,
behind the same concurrency cap. Run the server behind a VPN exit (deployment
concern, documented in the deploy note, not code).

- [ ] **Step 6: Parser tests against a saved fixture**

Save a real sample response (from Task 1 for 5a, or a captured economy page for
5b) under `src/services/__fixtures__/` and assert the parser extracts
`{ countryBonus, averageSalary, workTaxRate, vat }` and pollution maps correctly,
plus a partial-failure case (one country missing → omitted, batch still resolves).

- [ ] **Step 7: Run → pass**

Run: `npx vitest run src/services/` — PASS.

- [ ] **Step 8: Source factory (B→C fallback)**

Add to `economySource.ts`:

```ts
import { ToolsApiSource } from './toolsEconomy';     // 5a (if built)
// import { CachedProxySource } from './cachedEconomy'; // 5b (if built)

export function makeEconomySource(): CountryEconomySource {
  // Per Task 1: return ToolsApiSource when Approach B verified; else CachedProxySource.
  return new ToolsApiSource();
}
```

- [ ] **Step 9: Commit**

```bash
git add src/services/concurrency.* src/services/toolsEconomy.* src/services/economySource.ts src/services/__fixtures__/ 2>/dev/null
git commit -m "feat(optimizer): economy data source (Approach B/C per recon) + concurrency cap"
```

---

## Task 6: Optimizer state slice + `useOptimizer` facade hook

**Files:**
- Modify: `src/state/types.ts` (add `optimizer` to `AppState`)
- Modify: `src/state/blank.ts` (initial optimizer state)
- Modify: `src/state/reducer.ts` (optimizer actions)
- Modify: `src/state/hooks.ts` (add `useOptimizer`)
- Modify: `src/state/persistence.ts` (bump key suffix; migrate; cache economics with `fetchedAt`)
- Test: `src/state/reducer.test.ts` (extend)

- [ ] **Step 1: Extend reducer test (failing)**

Add a test asserting `SET_OPTIMIZER_PARAMS` updates `industry/threshold/maxCandidates/topN`
and `SET_OPTIMIZER_RESULTS` stores `{ results, baselineNet, skippedCount, fetchedAt }`
immutably (new object refs, prior state untouched). Follow the existing
`reducer.test.ts` patterns.

- [ ] **Step 2: Run → fail**

Run: `npx vitest run src/state/reducer.test.ts` — FAIL on the new actions.

- [ ] **Step 3: Implement state shape + actions + hook**

`types.ts` — add:

```ts
export interface OptimizerState {
  industry: IndustryKey;
  threshold: number;
  maxCandidates: number;
  topN: number;
  // cached so switching tabs doesn't refetch
  results: import('../calc/optimizer').RankedRegion[];
  baselineNet: number | null;
  skippedCount: number;
  fetchedAt: string | null;
}
```

Add `optimizer: OptimizerState` to `AppState`. `blank.ts`: default
`{ industry: 'food', threshold: 20, maxCandidates: 60, topN: 15, results: [], baselineNet: null, skippedCount: 0, fetchedAt: null }`.
Add `SET_OPTIMIZER_PARAMS` / `SET_OPTIMIZER_RESULTS` to the reducer's
discriminated union (pure, immutable). `hooks.ts`: `useOptimizer()` returns the
slice plus `setParams(partial)` and `setResults(payload)` dispatchers — components
never touch `dispatch` directly. `persistence.ts`: bump the key suffix
(`erep_calculator_food_factories_v11` → `_v12`), migrate older shapes by injecting
the optimizer default, and treat cached economics/results as best-effort (drop if
`fetchedAt` is stale on load if desired).

- [ ] **Step 4: Run → pass**

Run: `npx vitest run src/state/` — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/
git commit -m "feat(optimizer): optimizer state slice + useOptimizer facade (persist v12)"
```

---

## Task 7: OptimizerView UI + tab registration

**Files:**
- Create: `src/views/OptimizerView/OptimizerView.tsx`
- Create: `src/views/OptimizerView/index.ts`
- Create: `src/views/OptimizerView/OptimizerView.test.tsx`
- Modify: `src/App.tsx` (route the `optimizer` module)
- Modify: `src/components/TabBar.tsx` (add the tab)

- [ ] **Step 1: Component test (failing)**

Render `OptimizerView` inside the app's test providers (StateProvider + i18n —
mirror an existing view test, e.g. `HoldingsView` tests). Mock `makeEconomySource`
to return a fixed `Map`. Assert: industry selector renders; clicking "Scan" runs
the phases and renders a results table whose first row has the highest net; the
baseline row shows the current-location net; a "N skipped" note appears when a
candidate owner has no economics.

- [ ] **Step 2: Run → fail**

Run: `npx vitest run src/views/OptimizerView/OptimizerView.test.tsx` — FAIL (component missing).

- [ ] **Step 3: Implement the view**

Compose the phases for the selected industry: read the module's saved config via
the existing facade hooks to build `OptimizerConfig`; `selectCandidates(regions, industry, { threshold, maxCandidates })`;
`source.getCountryEconomics(industry, distinct owners, onProgress)`;
`rankRegions(...)`; take `topN`; `source.getRegionPollution(industry, topN ids, onProgress)`;
`rankRegions(..., pollutionMap)`; store via `useOptimizer().setResults`. Render:
industry selector, threshold + maxCandidates + topN controls, a "Scan" button, a
phase progress indicator (driven by `onProgress`), and the results table
(columns per spec §6: Rank, Region, 🏳 Country, regionBonus, countryBonus, avg
salary, work tax, VAT, **Net/day**, Δ vs current). Mark non-finalist rows
"pollution = 0 (estimate)". All strings via `useTranslation` (Task 8 keys).
Regions come from the live `regionData` service (`fetchRegionData()`), falling
back to the bundled dataset.

`App.tsx` / `TabBar.tsx`: add `optimizer` alongside `holdings` in the tab list and
render `OptimizerView` when `state.activeModule === 'optimizer'`. (Note:
`activeModule`'s union type in `state/types.ts` must include `'optimizer'` — add
it there as part of this task.)

- [ ] **Step 4: Run → pass**

Run: `npx vitest run src/views/OptimizerView/` — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/OptimizerView/ src/App.tsx src/components/TabBar.tsx src/state/types.ts
git commit -m "feat(optimizer): OptimizerView tab — scan + ranked results table"
```

---

## Task 8: i18n strings

**Files:**
- Modify: `src/i18n/locales/en/common.json`
- Test: `src/i18n/i18n.test.ts` (already asserts namespaces load + keys resolve)

- [ ] **Step 1: Add an `optimizer` section to EN `common.json`**

Add keys for: tab label, industry selector label, threshold/maxCandidates/topN
labels + help, "Scan" button, phase progress messages (filtering / fetching
economics N/M / refining pollution N/M), table column headers, baseline-row label,
"pollution estimate" badge, "N regions skipped (no economics)", "No candidates
above threshold — lower it", and a 429/rate-limit error message. EN-only is fine;
other locales fall back to EN until translated (do **not** hand-edit generated
`index.ts`).

- [ ] **Step 2: Run i18n + a smoke build**

Run: `npx vitest run src/i18n/i18n.test.ts` — PASS (all namespaces load, keys resolve).

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/en/common.json
git commit -m "i18n(en): optimizer tab strings"
```

---

## Task 9: End-to-end wiring + manual verification

**Files:**
- (verification only)

- [ ] **Step 1: Full test + typecheck**

Run: `npm test && npm run build`
Expected: all suites green; `tsc --noEmit` clean; `golden.test.ts` green.

- [ ] **Step 2: Manual smoke (dev)**

Run: `npm run dev`, open the Optimizer tab, configure a food setup, click Scan.
Expected: candidates filter offline instantly; economics fetch shows progress;
ranked table renders with a sensible top region; pollution refines the top-N; Δ
vs current is shown. Confirm requests in the Network tab originate per the chosen
transport (Approach B: browser → erepublik.tools, no `/proxy`).

- [ ] **Step 3: Commit any fixups**

```bash
git add -A && git commit -m "chore(optimizer): e2e wiring + verification fixups"
```

---

## Self-Review

- **Spec coverage:** Phase 0 → Task 2; Phase 1 → Tasks 4+5; Phase 2 → Task 3;
  Phase 3 → Tasks 5+7; transport B/C abstraction → Tasks 4+5; recon spike → Task 1;
  state/caching → Task 6; UI/tab/results table → Task 7; i18n → Task 8; edge cases
  (stale owner, name join, partial failure, rate limit, no candidates) → Tasks 4,5,7,8.
- **Type consistency:** `CountryEconomics` defined once (Task 4) and consumed in
  Tasks 3/5/6; `RegionCandidate`/`regionBonusFor`/`selectCandidates` (Task 2) used
  in Tasks 3/7; `OptimizerConfig`/`RankedRegion`/`rankRegions` (Task 3) used in 6/7;
  `CountryEconomySource` (Task 4) implemented in Task 5 and called in Task 7.
- **Ordering caveat:** Task 3's test imports `CountryEconomics` from
  `services/economySource` (Task 4) — build Task 4 before Task 3, or stub the type.
- **Note:** Task 1 is gating; Task 5's concrete request/parse code is finalized
  only after Task 1, by design (the spec's recon spike). All other tasks are
  transport-independent and fully specified.
```
