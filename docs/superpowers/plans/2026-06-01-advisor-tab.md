# Advisor Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only **Advisor** tab that ranks every (industry × quality) by net profit per work session (WAM = per company/day, plus hired with/without Tycoon) and gives a convert-vs-sell-raw-RM verdict per industry, so the player sees at a glance what is most profitable to produce.

**Architecture:** A pure calc module (`src/calc/advisor.ts`) projects the current `AppState` into an `AdvisorReport` by re-running the existing golden-parity `computeFwIndustry`/`computeHiredIndustry` for single isolated sessions. A facade hook `useAdvisor()` exposes the report. A new `views/AdvisorView/` renders a headline card, a sortable production table, and an RM-strategy panel. No new user inputs; no new network code (price sync reuses the existing per-industry fetch).

**Tech Stack:** Vite + React 19 + TypeScript, Vitest + Testing Library, react-i18next.

Spec: `docs/superpowers/specs/2026-06-01-advisor-design.md`.

---

## File Structure

**New**
- `src/calc/advisor.ts` — pure: types + `computeAdvisor(state) → AdvisorReport`.
- `src/calc/advisor.test.ts` — unit tests for the calc.
- `src/views/AdvisorView/AdvisorView.tsx` — container.
- `src/views/AdvisorView/RecommendationHeadline.tsx` — summary card.
- `src/views/AdvisorView/ProductionTable.tsx` — sortable ranked table.
- `src/views/AdvisorView/ProductionTable.test.tsx` — sorting smoke test.
- `src/views/AdvisorView/RmStrategyPanel.tsx` — convert-vs-sell cards.
- `src/views/AdvisorView/index.ts` — re-export `AdvisorView`.
- `src/i18n/locales/en/advisor.json` — English strings (copied to all locales).

**Modified**
- `src/state/types.ts` — add `'advisor'` to `ActiveModule`.
- `src/state/hooks.ts` — add `useAdvisor()`.
- `src/components/TabBar.tsx` — add the Advisor tab button.
- `src/App.tsx` — route `activeModule === 'advisor'` → `AdvisorView`.
- `scripts/gen-i18n-resources.mjs` — register the `advisor` namespace.
- `src/i18n/index.ts` — regenerated (do not hand-edit).
- `CLAUDE.md`, `README.md` — document the new tab.

---

## Task 1: Pure calc — `computeAdvisor`

**Files:**
- Create: `src/calc/advisor.ts`
- Test: `src/calc/advisor.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/calc/advisor.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeAdvisor } from './advisor';
import { initialState } from '../state/blank';
import type { AppState } from '../state/types';

// A deterministic state: zero bonuses → productivity multiplier = 1.0, so outputs
// are the raw base values and the arithmetic is hand-checkable.
function stateForTest(): AppState {
  const s = initialState();
  s.wamEnabled = true;
  s.hasTycoon = false;
  s.offeredSalary = 90;
  s.frmPrice = 1;
  // Food: only Q7 is priced; bonuses/vat/tax all zero.
  s.food.countryBonus = 0;
  s.food.regionBonus = 0;
  s.food.vat = 0;
  s.food.workTaxRate = 0;
  s.food.averageSalary = 0;
  s.food.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1 };
  return s;
}

describe('computeAdvisor', () => {
  it('computes per-session economics for a priced fw quality', () => {
    const report = computeAdvisor(stateForTest());
    const q7 = report.rows.find((r) => r.industry === 'food' && r.quality === 7)!;
    // Food Q7 at x1.0: output 100, RM consumed 20, finished price 1, frmPrice 1.
    // WAM session: revenue 100 − RM 20 − tax 0 − salary 0 = 80.
    expect(q7.wamNet).toBeCloseTo(80, 5);
    // Hired session (no Tycoon): revenue 100 − RM 20 − salary 90 = −10.
    expect(q7.hireNet).toBeCloseTo(-10, 5);
    // Hired session (Tycoon, mult 1.2): output 120, RM 24, revenue 120 − 24 − 90 = 6.
    expect(q7.hireNetTycoon).toBeCloseTo(6, 5);
    // ROI per CC of RM (primary = WAM session): 80 / 20 = 4.0.
    expect(q7.roiRm).toBeCloseTo(4, 5);
    expect(q7.owned).toBe(0);
    expect(q7.hasPrice).toBe(true);
  });

  it('marks hired industries with null wamNet', () => {
    const report = computeAdvisor(stateForTest());
    const house = report.rows.find((r) => r.industry === 'houses')!;
    expect(house.wamNet).toBeNull();
  });

  it('flags unpriced qualities and excludes them from topWam', () => {
    const report = computeAdvisor(stateForTest());
    const q6 = report.rows.find((r) => r.industry === 'food' && r.quality === 6)!;
    expect(q6.hasPrice).toBe(false);
    expect(report.topWam?.industry).toBe('food');
    expect(report.topWam?.quality).toBe(7);
  });

  it('gives a convert-vs-sell verdict per priced industry', () => {
    const report = computeAdvisor(stateForTest());
    const food = report.rmVerdicts.find((v) => v.industry === 'food')!;
    // sell raw = frmPrice × (1 − vat) = 1. convert = (net + rmCost)/rmConsumed = (80+20)/20 = 5.
    expect(food.sellRaw).toBeCloseTo(1, 5);
    expect(food.convert).toBeCloseTo(5, 5);
    expect(food.convertIsBetter).toBe(true);
    expect(food.delta).toBeCloseTo(4, 5);
    expect(food.bestQuality).toBe(7);
  });

  it('emits a row for every quality of every industry (24 total)', () => {
    const report = computeAdvisor(stateForTest());
    expect(report.rows).toHaveLength(7 + 7 + 5 + 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/calc/advisor.test.ts`
Expected: FAIL — "Failed to resolve import './advisor'".

- [ ] **Step 3: Write the implementation**

Create `src/calc/advisor.ts`:

```ts
// Pure production-profitability advisor. Re-runs the golden-parity per-industry
// math (computeFwIndustry / computeHiredIndustry) for single isolated work
// sessions, so it never forks the profit arithmetic. No DOM, no fetch.
import type { AppState, FwModule, HiredModule } from '../state/types';
import type { IndustryKey } from '../data/types';
import type { Cells, IndustryResult } from './types';
import { INDUSTRIES, getIndustry } from '../data/industries';
import { computeFwIndustry, computeHiredIndustry } from './industry';

export interface AdvisorRow {
  industry: IndustryKey;
  quality: number;
  wamNet: number | null; // net per WAM session (= per company/day); null for hired industries
  hireNet: number; // net per hired worker-session, Tycoon OFF
  hireNetTycoon: number; // net per hired worker-session, Tycoon ON
  roiRm: number; // net per 1 CC spent on raw material (primary session); 0 if no RM cost
  owned: number; // companies owned of this quality
  hasPrice: boolean; // finished-good price available for this quality
}

export interface RmVerdict {
  industry: IndustryKey;
  bestQuality: number; // quality whose conversion is evaluated
  sellRaw: number; // value realized per 1 RM unit sold raw (net of VAT)
  convert: number; // value added per 1 RM unit converted into finished goods
  convertIsBetter: boolean;
  delta: number; // |convert − sellRaw|
  hasPrice: boolean; // at least one priced quality exists for this industry
}

export interface AdvisorReport {
  rows: AdvisorRow[]; // every (industry × quality); UI sorts
  rmVerdicts: RmVerdict[]; // one per industry
  topWam: AdvisorRow | null; // highest wamNet among priced rows
}

// One isolated session of a single fw factory. wam=true → 1 owner WAM session,
// 0 hired. wam=false → 1 hired worker, 0 WAM (buying all RM from market).
function fwSession(state: AppState, key: IndustryKey, mod: FwModule, quality: number, wam: boolean, hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const factoryCells: Cells = { [quality]: { companies: 1, workers: wam ? 0 : 1 } };
  return computeFwIndustry({
    factoriesData: cfg.factoriesData,
    plantationsData: cfg.rmData,
    factoryCells,
    plantationCells: {},
    countryBonus: mod.countryBonus,
    regionBonus: mod.regionBonus,
    qualityPollution: mod.qualityPollution,
    vat: mod.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon,
    wamEnabled: wam,
    offeredSalary: state.offeredSalary,
    workTaxRate: mod.workTaxRate,
    averageSalary: mod.averageSalary,
  });
}

// One isolated hired worker-session of a single hired (houses/aircraft) factory.
function hiredSession(state: AppState, key: IndustryKey, mod: HiredModule, quality: number, hasTycoon: boolean): IndustryResult {
  const cfg = getIndustry(key);
  const factoryCells: Cells = { [quality]: { companies: 1, workers: 1 } };
  return computeHiredIndustry({
    factoriesData: cfg.factoriesData,
    rmData: cfg.rmData,
    factoryCells,
    rmCells: {},
    countryBonus: mod.countryBonus,
    regionBonus: mod.regionBonus,
    qualityPollution: mod.qualityPollution,
    vat: mod.vat,
    prices: mod.prices,
    rmPrice: state[cfg.rmPriceKey],
    hasTycoon,
    offeredSalary: state.offeredSalary,
  });
}

function roi(primary: IndustryResult): number {
  return primary.rmNetCost > 0 ? primary.net / primary.rmNetCost : 0;
}

export function computeAdvisor(state: AppState): AdvisorReport {
  const rows: AdvisorRow[] = [];
  const rmVerdicts: RmVerdict[] = [];

  for (const cfg of INDUSTRIES) {
    const key = cfg.key;
    const rmPrice = state[cfg.rmPriceKey];
    // Track the best priced quality and its primary session for the RM verdict.
    let bestQuality = 0;
    let bestPrimary: IndustryResult | null = null;
    let bestMetric = -Infinity;

    for (let q = 1; q <= cfg.maxFactoryQuality; q++) {
      const hasPrice = (state[key].prices[q] ?? 0) > 0;

      let wamNet: number | null;
      let hireNet: number;
      let hireNetTycoon: number;
      let primary: IndustryResult;
      let owned: number;

      if (cfg.type === 'fw') {
        const mod = state[key] as FwModule;
        const wamRes = fwSession(state, key, mod, q, true, state.hasTycoon);
        wamNet = wamRes.net;
        hireNet = fwSession(state, key, mod, q, false, false).net;
        hireNetTycoon = fwSession(state, key, mod, q, false, true).net;
        primary = wamRes;
        owned = mod[q]?.companies ?? 0;
      } else {
        const mod = state[key] as HiredModule;
        wamNet = null;
        hireNet = hiredSession(state, key, mod, q, false).net;
        hireNetTycoon = hiredSession(state, key, mod, q, true).net;
        primary = hiredSession(state, key, mod, q, state.hasTycoon);
        owned = mod.factories[q]?.companies ?? 0;
      }

      rows.push({ industry: key, quality: q, wamNet, hireNet, hireNetTycoon, roiRm: roi(primary), owned, hasPrice });

      const metric = cfg.type === 'fw' ? (wamNet ?? -Infinity) : hireNetTycoon;
      if (hasPrice && metric > bestMetric) {
        bestMetric = metric;
        bestQuality = q;
        bestPrimary = primary;
      }
    }

    const hasPrice = bestPrimary !== null && rmPrice > 0;
    const sellRaw = rmPrice * (1 - state[key].vat / 100);
    // convert = (revenue − session taxes) / RM consumed = (net + rmNetCost) / rmConsumed.
    const convert = bestPrimary && bestPrimary.rmConsumed > 0
      ? (bestPrimary.net + bestPrimary.rmNetCost) / bestPrimary.rmConsumed
      : 0;
    rmVerdicts.push({
      industry: key,
      bestQuality,
      sellRaw,
      convert,
      convertIsBetter: convert > sellRaw,
      delta: Math.abs(convert - sellRaw),
      hasPrice,
    });
  }

  const topWam = rows
    .filter((r) => r.hasPrice && r.wamNet !== null)
    .sort((a, b) => (b.wamNet as number) - (a.wamNet as number))[0] ?? null;

  return { rows, rmVerdicts, topWam };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/calc/advisor.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Verify golden parity is untouched**

Run: `npx vitest run src/calc/golden.test.ts`
Expected: PASS (we only call the existing functions, never change them).

- [ ] **Step 6: Commit**

```bash
git add src/calc/advisor.ts src/calc/advisor.test.ts
git commit -m "feat(advisor): pure computeAdvisor over existing golden-parity math"
```

---

## Task 2: Wire `'advisor'` into the module union + `useAdvisor` hook

**Files:**
- Modify: `src/state/types.ts:85`
- Modify: `src/state/hooks.ts` (append a hook)

- [ ] **Step 1: Extend the ActiveModule union**

In `src/state/types.ts`, change line 85 from:

```ts
export type ActiveModule = IndustryKey | 'holdings' | 'regions' | 'optimizer';
```

to:

```ts
export type ActiveModule = IndustryKey | 'holdings' | 'regions' | 'optimizer' | 'advisor';
```

(`SWITCH_MODULE` in `reducer.ts:95` sets the module verbatim and `persistence.ts:149`
accepts any string, so no reducer or migration change is needed.)

- [ ] **Step 2: Add the `useAdvisor` facade hook**

Append to `src/state/hooks.ts`. First extend the calc import on line 11–12 — change:

```ts
import { computeFwIndustry, computeHiredIndustry } from '../calc/industry';
```

to add the advisor import right after it:

```ts
import { computeFwIndustry, computeHiredIndustry } from '../calc/industry';
import { computeAdvisor, type AdvisorReport } from '../calc/advisor';
```

Then append this hook at the end of the file:

```ts
// Read-only production advisor: ranks every (industry × quality) by net profit
// per work session and gives a convert-vs-sell-raw-RM verdict per industry.
export function useAdvisor(): AdvisorReport {
  return computeAdvisor(useAppState().state);
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/state/types.ts src/state/hooks.ts
git commit -m "feat(advisor): add 'advisor' module + useAdvisor hook"
```

---

## Task 3: i18n — register the `advisor` namespace

The i18n loader imports `<ns>.json` for every locale, so a new namespace needs a
file in **every** locale folder. Non-English files are copies of English (English
fallback for now). The generator and the init `ns:` list must both learn the namespace.

**Files:**
- Create: `src/i18n/locales/en/advisor.json`
- Modify: `scripts/gen-i18n-resources.mjs:28` and the template `ns:` line
- Regenerate: `src/i18n/index.ts` (do not hand-edit)

- [ ] **Step 1: Author the English catalog**

Create `src/i18n/locales/en/advisor.json`:

```json
{
  "tab": "💡 Advisor",
  "title": "Advisor",
  "intro": "What is most profitable to produce right now — based on your bonuses, prices and taxes. With no hired workers the key metric is net profit per WAM session (= per company/day).",
  "headline": {
    "topWam": "Best for your WAM",
    "perDay": "/ company / day",
    "hiredViable": "Hired workers: positive only here",
    "hiredViableTycoon": "with Tycoon",
    "hiredNone": "Hired workers are unprofitable everywhere right now.",
    "sellRaw": "cheaper to SELL raw",
    "convert": "better to CONVERT"
  },
  "table": {
    "title": "Production ranking — click a column to sort",
    "rank": "#",
    "product": "Product",
    "wam": "net / WAM / day",
    "hire": "net / hired (no Tycoon)",
    "hireTycoon": "net / hired (Tycoon)",
    "roi": "net / 1 CC in RM",
    "owned": "you own",
    "noWamNote": "“—” = industry has no WAM (Houses/Aircraft use hired labour only). Your factories are highlighted.",
    "noPrice": "Prices not synced for this industry."
  },
  "rm": {
    "title": "Convert raw material, or sell it raw?",
    "sellRaw": "Sell raw",
    "convert": "Convert",
    "verdictSell": "SELL raw",
    "verdictConvert": "CONVERT"
  },
  "syncPrices": "↻ Sync all prices",
  "syncing": "Syncing…"
}
```

- [ ] **Step 2: Copy the catalog into every other locale**

Run from repo root:

```bash
for d in src/i18n/locales/*/; do
  [ "$d" = "src/i18n/locales/en/" ] || cp src/i18n/locales/en/advisor.json "$d/advisor.json";
done
ls src/i18n/locales/*/advisor.json | wc -l
```

Expected: `25` (one per locale).

- [ ] **Step 3: Teach the generator the namespace**

In `scripts/gen-i18n-resources.mjs`, change line 28 from:

```js
const NS = ['common', 'industry', 'holdings', 'tooltips'];
```

to:

```js
const NS = ['common', 'industry', 'holdings', 'tooltips', 'advisor'];
```

And in the generated template string further down, change:

```js
  ns: ['common', 'industry', 'holdings', 'tooltips'],
```

to:

```js
  ns: ['common', 'industry', 'holdings', 'tooltips', 'advisor'],
```

- [ ] **Step 4: Regenerate**

Run: `node scripts/gen-i18n-resources.mjs`
Expected: prints `Wrote index.ts (25 locales) …`. `src/i18n/index.ts` now imports
`*Advisor` for every locale and `ns:` includes `'advisor'`.

- [ ] **Step 5: Verify i18n tests pass**

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: PASS (every namespace, including `advisor`, loads for every locale).

- [ ] **Step 6: Commit**

```bash
git add scripts/gen-i18n-resources.mjs src/i18n/index.ts src/i18n/locales
git commit -m "feat(advisor): register advisor i18n namespace (en authored, copied to all locales)"
```

---

## Task 4: AdvisorView container + tab + route (with price sync)

**Files:**
- Create: `src/views/AdvisorView/AdvisorView.tsx`, `src/views/AdvisorView/index.ts`
- Modify: `src/components/TabBar.tsx`, `src/App.tsx`

- [ ] **Step 1: Create the container**

Create `src/views/AdvisorView/AdvisorView.tsx`. It reads the report, renders the
three child panels, and offers a "sync all prices" button that reuses the existing
per-industry price fetch already wired in `useHoldingSync().syncPrices` (which is
industry-generic: it dispatches `SET_MODULE_PRICES` + the shared RM price for all four
industries):

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdvisor, useHoldingSync } from '../../state/hooks';
import { RecommendationHeadline } from './RecommendationHeadline';
import { ProductionTable } from './ProductionTable';
import { RmStrategyPanel } from './RmStrategyPanel';

export function AdvisorView() {
  const { t } = useTranslation('advisor');
  const report = useAdvisor();
  const { syncPrices } = useHoldingSync();
  const [syncing, setSyncing] = useState(false);

  const onSync = async () => {
    setSyncing(true);
    try {
      await syncPrices();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="advisor-view">
      <h2>{t('title')}</h2>
      <p className="advisor-intro">{t('intro')}</p>
      <div className="advisor-toolbar">
        <button type="button" className="btn-sync" onClick={onSync} disabled={syncing} data-testid="advisor-sync">
          {syncing ? t('syncing') : t('syncPrices')}
        </button>
      </div>
      <RecommendationHeadline report={report} />
      <ProductionTable rows={report.rows} />
      <RmStrategyPanel verdicts={report.rmVerdicts} />
    </main>
  );
}
```

Create `src/views/AdvisorView/index.ts`:

```ts
export { AdvisorView } from './AdvisorView';
```

(`RecommendationHeadline`, `ProductionTable`, `RmStrategyPanel` are created in
Tasks 5–7. To compile this task standalone, do Step 1 of each of those tasks—creating
the component files—before type-checking; or implement Tasks 5–7 first. The recommended
subagent flow implements tasks in order, so create stub-free real components in 5–7.)

- [ ] **Step 2: Add the tab button**

In `src/components/TabBar.tsx`, add a button after the optimizer button (after line 48,
before the closing `</div>`):

```tsx
        <button
          type="button"
          className={`nav-tab${active === 'advisor' ? ' active' : ''}`}
          data-testid="tab-advisor"
          onClick={() => switchTo('advisor')}
        >
          {t('advisor:tab')}
        </button>
```

- [ ] **Step 3: Route to the view**

In `src/App.tsx`, add the import after line 7:

```tsx
import { AdvisorView } from './views/AdvisorView';
```

And in `ActiveView()` (around line 14-20), add a branch before the final return:

```tsx
  if (active === 'advisor') return <AdvisorView />;
```

- [ ] **Step 4: Type-check (after Tasks 5–7 exist) and run**

Run: `npx tsc --noEmit`
Expected: no errors once the three child components exist.

- [ ] **Step 5: Commit**

```bash
git add src/views/AdvisorView/AdvisorView.tsx src/views/AdvisorView/index.ts src/components/TabBar.tsx src/App.tsx
git commit -m "feat(advisor): AdvisorView container, tab button, and route"
```

---

## Task 5: RecommendationHeadline component

**Files:**
- Create: `src/views/AdvisorView/RecommendationHeadline.tsx`

- [ ] **Step 1: Implement**

Create `src/views/AdvisorView/RecommendationHeadline.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { AdvisorReport } from '../../calc/advisor';

function productName(t: ReturnType<typeof useTranslation>['t'], industry: string, quality: number): string {
  const cfg = getIndustry(industry as Parameters<typeof getIndustry>[0]);
  return `${cfg.icon} ${industryLabel(t, cfg)} Q${quality}`;
}

export function RecommendationHeadline({ report }: { report: AdvisorReport }) {
  const { t } = useTranslation('advisor');
  const top = report.topWam;

  // Hired viability: any quality whose Tycoon hired-session is positive.
  const hiredPositive = report.rows.filter((r) => r.hasPrice && r.hireNetTycoon > 0);

  return (
    <section className="advisor-headline">
      {top && (
        <div className="advisor-headline-top">
          🏆 {t('headline.topWam')}:&nbsp;
          <strong>{productName(t, top.industry, top.quality)}</strong>
          &nbsp;→&nbsp;
          <span className="pos">+{(top.wamNet as number).toFixed(2)} CC</span> {t('headline.perDay')}
        </div>
      )}
      <ul className="advisor-headline-list">
        <li>
          👷{' '}
          {hiredPositive.length === 0
            ? t('headline.hiredNone')
            : `${t('headline.hiredViable')} (${t('headline.hiredViableTycoon')}): ` +
              hiredPositive.map((r) => productName(t, r.industry, r.quality)).join(', ')}
        </li>
        {report.rmVerdicts
          .filter((v) => v.hasPrice)
          .map((v) => {
            const cfg = getIndustry(v.industry);
            return (
              <li key={v.industry}>
                {cfg.icon} {cfg.rmName}:{' '}
                <span className={v.convertIsBetter ? 'pos' : 'neg'}>
                  {v.convertIsBetter ? t('headline.convert') : t('headline.sellRaw')}
                </span>{' '}
                (Δ {v.delta.toFixed(2)})
              </li>
            );
          })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (component is self-contained; container wires it in Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/views/AdvisorView/RecommendationHeadline.tsx
git commit -m "feat(advisor): recommendation headline card"
```

---

## Task 6: ProductionTable component (sortable) + smoke test

**Files:**
- Create: `src/views/AdvisorView/ProductionTable.tsx`
- Test: `src/views/AdvisorView/ProductionTable.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/views/AdvisorView/ProductionTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductionTable } from './ProductionTable';
import type { AdvisorRow } from '../../calc/advisor';

const rows: AdvisorRow[] = [
  { industry: 'food', quality: 7, wamNet: 10, hireNet: -1, hireNetTycoon: 0.3, roiRm: 0.28, owned: 5, hasPrice: true },
  { industry: 'weapons', quality: 7, wamNet: 12, hireNet: -1.2, hireNetTycoon: 0.9, roiRm: 0.34, owned: 0, hasPrice: true },
  { industry: 'houses', quality: 5, wamNet: null, hireNet: -0.4, hireNetTycoon: 1.6, roiRm: 0.21, owned: 0, hasPrice: true },
];

describe('ProductionTable', () => {
  it('defaults to sorting by net/WAM descending (weapons Q7 first)', () => {
    render(<ProductionTable rows={rows} />);
    const first = screen.getAllByTestId('advisor-row')[0];
    expect(within(first).getByText(/Weapons Q7/)).toBeTruthy();
  });

  it('re-sorts when a column header is clicked (net/hired Tycoon → houses Q5 first)', () => {
    render(<ProductionTable rows={rows} />);
    fireEvent.click(screen.getByTestId('sort-hireTycoon'));
    const first = screen.getAllByTestId('advisor-row')[0];
    expect(within(first).getByText(/Houses Q5/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/AdvisorView/ProductionTable.test.tsx`
Expected: FAIL — cannot resolve `./ProductionTable`.

- [ ] **Step 3: Implement**

Create `src/views/AdvisorView/ProductionTable.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { AdvisorRow } from '../../calc/advisor';

type SortKey = 'wam' | 'hire' | 'hireTycoon' | 'roi';

// null (no WAM) always sorts to the bottom regardless of direction.
function valueOf(row: AdvisorRow, key: SortKey): number {
  if (key === 'wam') return row.wamNet ?? -Infinity;
  if (key === 'hire') return row.hireNet;
  if (key === 'hireTycoon') return row.hireNetTycoon;
  return row.roiRm;
}

function num(v: number | null): string {
  return v === null ? '—' : (v > 0 ? '+' : '') + v.toFixed(2);
}

function cls(v: number | null): string {
  if (v === null) return 'dim';
  return v > 0 ? 'pos' : v < 0 ? 'neg' : 'dim';
}

export function ProductionTable({ rows }: { rows: AdvisorRow[] }) {
  const { t } = useTranslation('advisor');
  const [sortKey, setSortKey] = useState<SortKey>('wam');
  const [desc, setDesc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    const d = valueOf(b, sortKey) - valueOf(a, sortKey);
    return desc ? d : -d;
  });

  const onSort = (key: SortKey) => {
    if (key === sortKey) setDesc((d) => !d);
    else { setSortKey(key); setDesc(true); }
  };

  const header = (key: SortKey, label: string) => (
    <th
      data-testid={`sort-${key}`}
      className={`sortable${sortKey === key ? ' active' : ''}`}
      onClick={() => onSort(key)}
    >
      {label} <span className="ar">{sortKey === key ? (desc ? '▼' : '▲') : ''}</span>
    </th>
  );

  return (
    <section className="advisor-table-panel">
      <h3>{t('table.title')}</h3>
      <table className="advisor-table">
        <thead>
          <tr>
            <th className="l">{t('table.rank')}</th>
            <th className="l">{t('table.product')}</th>
            {header('wam', t('table.wam'))}
            {header('hire', t('table.hire'))}
            {header('hireTycoon', t('table.hireTycoon'))}
            {header('roi', t('table.roi'))}
            <th className="l">{t('table.owned')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const cfg = getIndustry(r.industry);
            return (
              <tr key={`${r.industry}-${r.quality}`} className={r.owned ? 'own' : ''} data-testid="advisor-row">
                <td className="l dim">{i + 1}</td>
                <td className="l">{cfg.icon} {industryLabel(t, cfg)} Q{r.quality}</td>
                <td className={cls(r.wamNet)}>{num(r.wamNet)}</td>
                <td className={cls(r.hireNet)}>{num(r.hireNet)}</td>
                <td className={cls(r.hireNetTycoon)}>{num(r.hireNetTycoon)}</td>
                <td className="dim">{r.roiRm.toFixed(2)}</td>
                <td className="l">{r.owned ? `×${r.owned}` : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="advisor-note">{t('table.noWamNote')}</p>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/AdvisorView/ProductionTable.test.tsx`
Expected: PASS (2 tests). `industryLabel` resolves "Weapons"/"Houses" from the EN
catalog, which i18n loads synchronously in tests.

- [ ] **Step 5: Commit**

```bash
git add src/views/AdvisorView/ProductionTable.tsx src/views/AdvisorView/ProductionTable.test.tsx
git commit -m "feat(advisor): sortable production ranking table"
```

---

## Task 7: RmStrategyPanel component

**Files:**
- Create: `src/views/AdvisorView/RmStrategyPanel.tsx`

- [ ] **Step 1: Implement**

Create `src/views/AdvisorView/RmStrategyPanel.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import type { RmVerdict } from '../../calc/advisor';

export function RmStrategyPanel({ verdicts }: { verdicts: RmVerdict[] }) {
  const { t } = useTranslation('advisor');
  const priced = verdicts.filter((v) => v.hasPrice);
  if (priced.length === 0) return null;

  return (
    <section className="advisor-rm-panel">
      <h3>{t('rm.title')}</h3>
      <div className="advisor-rm-grid">
        {priced.map((v) => {
          const cfg = getIndustry(v.industry);
          return (
            <div className="advisor-rm-card" key={v.industry} data-testid={`rm-${v.industry}`}>
              <div className="advisor-rm-head">{cfg.icon} {cfg.rmName}</div>
              <div className="advisor-rm-row"><span>{t('rm.sellRaw')}</span><b>{v.sellRaw.toFixed(2)}</b></div>
              <div className="advisor-rm-row"><span>{t('rm.convert')}</span><b>{v.convert.toFixed(2)}</b></div>
              <div className={`advisor-rm-verdict ${v.convertIsBetter ? 'pos' : 'neg'}`}>
                → {v.convertIsBetter ? t('rm.verdictConvert') : t('rm.verdictSell')} (+{v.delta.toFixed(2)})
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Full type-check + full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: TypeScript clean; all tests pass (calc parity, advisor calc, table, i18n, existing suites).

- [ ] **Step 3: Add minimal styles**

Append to the appropriate per-concern file under `styles/` (create `styles/advisor.css`
and import it from `styles/index.css`). Keep it minimal — reuse existing table/card
tokens. Add at least: `.advisor-view` padding, `.advisor-headline` card, `.advisor-table th.sortable{cursor:pointer}`,
`.pos{color:var(--positive,#3fb950)}`, `.neg{color:var(--negative,#f85149)}`, `.advisor-rm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}`.
Match the variable names already used in `styles/` (check an existing file for the
positive/negative colour tokens and reuse them rather than hard-coding hex).

In `styles/index.css`, add: `@import './advisor.css';`

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open the app, click the **💡 Advisor** tab. Sync prices for at
least one industry (or via the Advisor's "sync all prices"), confirm the headline,
sortable table, and RM cards render and that column sorting works.

- [ ] **Step 5: Commit**

```bash
git add src/views/AdvisorView/RmStrategyPanel.tsx styles/advisor.css styles/index.css
git commit -m "feat(advisor): RM convert-vs-sell panel + styles"
```

---

## Task 8: Documentation

**Files:**
- Modify: `CLAUDE.md`, `README.md`

- [ ] **Step 1: Update CLAUDE.md**

In `CLAUDE.md`, add `advisor` to the `state.activeModule` list and add a bullet under
the architecture section describing the Advisor tab (pure `calc/advisor.ts`, reuses
`computeFwIndustry`/`computeHiredIndustry`, no new inputs). Add `calc/advisor.ts` and
`views/AdvisorView/` to the `src/` tree diagram.

- [ ] **Step 2: Update README.md**

Add a short "Advisor" feature paragraph alongside the Regions & Optimizer descriptions:
ranks every industry×quality by net profit per work session (WAM and hired/Tycoon),
plus a convert-vs-sell-raw-RM verdict.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs(advisor): document the Advisor tab"
```

---

## Final verification

- [ ] `npx tsc --noEmit` — clean.
- [ ] `npm test` — all green (golden parity, advisor calc, table smoke, i18n).
- [ ] `npm run build` — production build succeeds.
- [ ] Manual: every tab still works; Advisor renders, sorts, and reflects synced prices.

## Notes for the implementer

- **Never modify** `computeFwIndustry`/`computeHiredIndustry` — the Advisor must stay a
  pure consumer so `calc/golden.test.ts` keeps guarding the math.
- The `wamNet`/`hireNet`/`roiRm` columns use the user's actual `hasTycoon` flag where it
  applies; the two hired columns deliberately show **both** Tycoon scenarios so the user
  can see whether Tycoon flips hires into profit.
- `useHoldingSync().syncPrices` is industry-generic despite its name (it syncs all four
  modules' prices into shared state); reuse it rather than writing a new fetcher.
- Standard React only — no `innerHTML` (the brainstorm mockup's `innerHTML` was throwaway).
```
