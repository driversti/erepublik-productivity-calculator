# Advisor Insights + Liquidity Flag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic plain-language "Bottom line" insights panel to the Advisor tab that adapts to each user's data/play-style, plus a per-quality "can't sell" (liquidity) flag that drops illiquid qualities from recommendations.

**Architecture:** A new pure module `src/calc/advisorInsights.ts` turns the existing `AdvisorReport` + `AppState` into structured `Insight[]` (no i18n, no DOM). A new `excludedQualities` state field (toggled from the table) feeds `computeAdvisor` so excluded finished-good qualities are dropped from `topWam`, RM convert targets, and insights. New view components render insights and the exclude toggle. All math still flows through the unchanged golden-parity `computeFwIndustry`/`computeHiredIndustry`.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest + Testing Library, react-i18next.

**Branch:** continue on `feat/advisor-tab` (the Advisor feature is here, unmerged).
**Spec:** `docs/superpowers/specs/2026-06-01-advisor-insights-design.md`.

---

## Pre-flight (read first, do not skip)

The implementer must read these before Task 1 — they define existing shapes this plan extends:
- `src/calc/advisor.ts` — `AdvisorRow`, `RmVerdict`, `AdvisorReport`, `computeAdvisor`, the per-quality loop and `bestPrimary`/`bestQuality` logic, `topWam`.
- `src/state/types.ts` (`AppState`, `ActiveModule`), `src/state/reducer.ts` (action union + reducer), `src/state/persistence.ts` (load/save), `src/state/hooks.ts` (`useAdvisor`, facade pattern), `src/state/blank.ts` (`initialState`).
- `src/views/AdvisorView/*` (AdvisorView, RecommendationHeadline, ProductionTable), `src/i18n/locales/en/advisor.json`, `styles/advisor.css`, `scripts/gen-i18n-resources.mjs`.

Context memories (background): the target user is WAM-only/no hires/high salary; magnates hire + use Tycoon. The feature must serve both from the same data.

---

## File Structure

**New**
- `src/calc/advisorInsights.ts` — `Insight`, `InsightSeverity`, `generateInsights`.
- `src/calc/advisorInsights.test.ts`
- `src/views/AdvisorView/InsightsPanel.tsx` (+ `.test.tsx`)

**Modified**
- `src/calc/advisor.ts` — add `excluded` to `AdvisorRow`; accept exclusions; drop excluded from `topWam` + `RmVerdict.bestQuality`.
- `src/calc/advisor.test.ts` — cover `excluded`.
- `src/state/types.ts` — `excludedQualities: string[]` on `AppState`.
- `src/state/blank.ts` — default `excludedQualities: []`.
- `src/state/reducer.ts` — `TOGGLE_EXCLUDED_QUALITY` action.
- `src/state/persistence.ts` — persist/restore `excludedQualities`.
- `src/state/hooks.ts` — `useToggleExcludedQuality()`, `useAdvisorInsights()`.
- `src/views/AdvisorView/ProductionTable.tsx` (+ test) — exclude toggle + `excluded` styling.
- `src/views/AdvisorView/AdvisorView.tsx` — render `<InsightsPanel>`.
- `src/i18n/locales/en/advisor.json` (+ copy to all locales) — `insights.*`, `table.excludeToggle`, `table.excludedBadge`.
- `styles/advisor.css` — insights + excluded-row + toggle styles.
- `CLAUDE.md` / `README.md` — mention the insights panel + liquidity flag.

---

## Task 1: State — `excludedQualities` + toggle action + persistence

**Files:** `src/state/types.ts`, `src/state/blank.ts`, `src/state/reducer.ts`, `src/state/persistence.ts`, test `src/state/reducer.test.ts` (or the existing reducer test file — check which exists).

- [ ] **Step 1: Failing reducer test.** Add to the reducer test file:
```ts
it('toggles an excluded quality on and off', () => {
  let s = initialState();
  s = reducer(s, { type: 'TOGGLE_EXCLUDED_QUALITY', industry: 'weapons', quality: 6 });
  expect(s.excludedQualities).toContain('weapons:6');
  s = reducer(s, { type: 'TOGGLE_EXCLUDED_QUALITY', industry: 'weapons', quality: 6 });
  expect(s.excludedQualities).not.toContain('weapons:6');
});
```
- [ ] **Step 2: Run it, expect FAIL** (`excludedQualities`/action missing). `npx vitest run src/state/reducer.test.ts`.
- [ ] **Step 3: Implement.**
  - `types.ts`: add to `AppState`: `excludedQualities: string[];`
  - `blank.ts` `initialState()`: add `excludedQualities: [],`
  - `reducer.ts`: add to the action union `| { type: 'TOGGLE_EXCLUDED_QUALITY'; industry: IndustryKey; quality: number }` and a case:
```ts
    case 'TOGGLE_EXCLUDED_QUALITY': {
      const key = `${action.industry}:${action.quality}`;
      const has = state.excludedQualities.includes(key);
      return { ...state, excludedQualities: has
        ? state.excludedQualities.filter((k) => k !== key)
        : [...state.excludedQualities, key] };
    }
```
  - `persistence.ts`: in save, include `excludedQualities`; in load, add
    `if (Array.isArray(parsed.excludedQualities)) state.excludedQualities = parsed.excludedQualities;`
    (defaults to `[]` from initialState for older saves — no version bump).
- [ ] **Step 4: Run test, expect PASS.**
- [ ] **Step 5: `npx tsc --noEmit`** clean.
- [ ] **Step 6: Commit** `feat(advisor): excludedQualities state + toggle action + persistence`.

## Task 2: `computeAdvisor` — liquidity-aware

**Files:** `src/calc/advisor.ts`, `src/calc/advisor.test.ts`.

- [ ] **Step 1: Failing test.** Add to `advisor.test.ts` (uses `stateForTest` which prices food Q7=1; here exclude it):
```ts
it('drops excluded finished qualities from topWam and rm bestQuality', () => {
  const s = stateForTest();
  s.food.prices = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 2, 7: 1 }; // Q6 & Q7 priced
  s.excludedQualities = ['food:7'];
  const report = computeAdvisor(s);
  const q7 = report.rows.find((r) => r.industry === 'food' && r.quality === 7 && r.kind === 'factory')!;
  expect(q7.excluded).toBe(true);
  // topWam must not be the excluded Q7
  expect(report.topWam ? `${report.topWam.industry}:${report.topWam.quality}` : '').not.toBe('food:7');
  // RM convert verdict must pick a non-excluded quality
  const frm = report.rmVerdicts.find((v) => v.industry === 'food')!;
  expect(frm.bestQuality).not.toBe(7);
});
```
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** in `advisor.ts`:
  - Add `excluded: boolean;` to the `AdvisorRow` interface (after `hasPrice`).
  - At the top of `computeAdvisor`, read exclusions: `const excludedSet = new Set(state.excludedQualities);` and a helper `const isExcluded = (key, q) => excludedSet.has(\`${key}:${q}\`);`
  - Factory row push: set `excluded: isExcluded(key, q)`. RM row push: `excluded: false` (RM rows aren't excludable).
  - In the factory `bestQuality`/`bestMetric` selection guard, require not-excluded:
    change `if (hasPrice && metric > bestMetric)` → `if (hasPrice && !isExcluded(key, q) && metric > bestMetric)`.
  - `topWam` filter: add `&& !r.excluded`.
- [ ] **Step 4: Run `npx vitest run src/calc/advisor.test.ts src/calc/golden.test.ts`**, expect PASS (golden untouched).
- [ ] **Step 5: `npx tsc --noEmit`** clean.
- [ ] **Step 6: Commit** `feat(advisor): liquidity-aware ranking (exclude qualities)`.

## Task 3: Insights generator (the heart)

**Files:** `src/calc/advisorInsights.ts`, `src/calc/advisorInsights.test.ts`.

- [ ] **Step 1: Failing test.** Create `advisorInsights.test.ts` with two fixtures (WAM-only and magnate). Build `AdvisorReport`-shaped rows directly (no need to run computeAdvisor):
```ts
import { describe, it, expect } from 'vitest';
import { generateInsights } from './advisorInsights';
import { initialState } from '../state/blank';
import type { AdvisorReport, AdvisorRow } from './advisor';

const row = (o: Partial<AdvisorRow> & Pick<AdvisorRow,'industry'|'quality'|'kind'>): AdvisorRow => ({
  wamNet: null, hireNet: null, hireNetTycoon: null, roiRm: null, owned: 0, hasPrice: true, excluded: false, ...o,
});
function report(rows: AdvisorRow[], rmVerdicts: AdvisorReport['rmVerdicts'] = []): AdvisorReport {
  const topWam = rows.filter(r => r.hasPrice && !r.excluded && r.wamNet !== null)
    .sort((a,b)=>(b.wamNet as number)-(a.wamNet as number))[0] ?? null;
  return { rows, rmVerdicts, topWam };
}

describe('generateInsights — WAM-only player', () => {
  const s = initialState(); s.wamEnabled = true; s.hasTycoon = false; s.offeredSalary = 7800;
  const rows = [
    row({ industry:'weapons', quality:5, kind:'rm', wamNet:139.78, hireNet:-7573, hireNetTycoon:-7550, owned:200 }),
    row({ industry:'weapons', quality:7, kind:'factory', wamNet:-413.61, hireNet:-8126, hireNetTycoon:-8162, roiRm:-0.24, owned:24 }),
    row({ industry:'weapons', quality:6, kind:'factory', wamNet:681.06, hireNet:-7031, hireNetTycoon:-6958, roiRm:1.18, owned:0 }),
    row({ industry:'houses', quality:5, kind:'factory', wamNet:null, hireNet:-3553, hireNetTycoon:-3119, roiRm:-0.6, owned:1 }),
  ];
  const r = report(rows, [{ industry:'weapons', bestQuality:6, sellRaw:45.5, convert:100.3, convertIsBetter:true, delta:54.8, hasPrice:true }]);
  const ins = generateInsights(r, s);
  const types = ins.map(i => i.type);

  it('flags the owned WAM loss-maker', () => {
    const lm = ins.find(i => i.type === 'lossMaker');
    expect(lm).toBeTruthy();
    expect(lm!.params.industry).toBe('weapons');
    expect(lm!.params.quality).toBe(7);
    expect(Number(lm!.params.total)).toBeLessThan(0);
  });
  it('flags owned hired companies as dead capital', () => {
    expect(types).toContain('deadCapital');
  });
  it('reports hiring unprofitable everywhere', () => {
    const h = ins.find(i => i.type === 'hiring')!;
    expect(h.params.mode).toBe('none');
  });
  it('names the main earner (owned, highest total)', () => {
    const me = ins.find(i => i.type === 'mainEarner')!;
    expect(me.params.industry).toBe('weapons');
    expect(me.params.quality).toBe(5);
  });
  it('suggests a positive best action and always ends with a caveat', () => {
    expect(types).toContain('bestAction');
    expect(types[types.length - 1]).toBe('caveat');
  });
});

describe('generateInsights — magnate (hires + Tycoon)', () => {
  const s = initialState(); s.wamEnabled = false; s.hasTycoon = true; s.offeredSalary = 50;
  const rows = [
    row({ industry:'houses', quality:5, kind:'factory', wamNet:null, hireNet:120, hireNetTycoon:160, roiRm:0.5, owned:3 }),
  ];
  it('reports hiring is viable (with Tycoon) and picks a hire best action', () => {
    const ins = generateInsights(report(rows), s);
    const h = ins.find(i => i.type === 'hiring')!;
    expect(['some','tycoon']).toContain(h.params.mode);
    const ba = ins.find(i => i.type === 'bestAction')!;
    expect(ba.params.mode).toBe('hire');
  });
});
```
- [ ] **Step 2: Run, expect FAIL** (no module).
- [ ] **Step 3: Implement** `src/calc/advisorInsights.ts`:
```ts
// Pure, deterministic plain-language insight generator over an AdvisorReport.
// Returns structured Insight objects (no i18n, no DOM); the view renders + formats.
import type { AppState } from '../state/types';
import type { AdvisorReport, AdvisorRow } from './advisor';
import { getIndustry } from '../data/industries';

export type InsightSeverity = 'good' | 'warn' | 'bad' | 'info';
export interface Insight {
  type: string;
  severity: InsightSeverity;
  params: Record<string, string | number>;
}

type Mode = 'wam' | 'hire' | 'idle';

function achievable(row: AdvisorRow, state: AppState): { net: number; mode: Mode } {
  const cfg = getIndustry(row.industry);
  if (cfg.type === 'fw' && state.wamEnabled && row.wamNet !== null) {
    return { net: row.wamNet, mode: 'wam' };
  }
  const hire = state.hasTycoon ? row.hireNetTycoon : row.hireNet;
  if (hire !== null) return { net: hire, mode: 'hire' };
  return { net: 0, mode: 'idle' };
}

const usable = (r: AdvisorRow) => r.hasPrice && !r.excluded;

export function generateInsights(report: AdvisorReport, state: AppState): Insight[] {
  const out: Insight[] = [];
  const rows = report.rows.filter(usable);

  // bestAction: highest positive achievable net across all usable rows.
  let best: { row: AdvisorRow; net: number; mode: Mode } | null = null;
  for (const r of rows) {
    const a = achievable(r, state);
    if (a.net > 0 && (!best || a.net > best.net)) best = { row: r, net: a.net, mode: a.mode };
  }
  if (best) {
    out.push({ type: 'bestAction', severity: 'good', params: {
      industry: best.row.industry, quality: best.row.quality, kind: best.row.kind,
      net: round(best.net), mode: best.mode,
    } });
  }

  // mainEarner: owned usable row with the highest positive total (count × achievable).
  let earner: { row: AdvisorRow; net: number; total: number } | null = null;
  for (const r of rows) {
    if (!r.owned) continue;
    const net = achievable(r, state).net;
    const total = net * r.owned;
    if (total > 0 && (!earner || total > earner.total)) earner = { row: r, net, total };
  }
  if (earner) {
    out.push({ type: 'mainEarner', severity: 'good', params: {
      industry: earner.row.industry, quality: earner.row.quality, kind: earner.row.kind,
      count: earner.row.owned, perDay: round(earner.net), total: round(earner.total),
    } });
  }

  // lossMakers (owned, WAM mode, negative) — worst first, max 3.
  const losers = rows
    .filter((r) => r.owned > 0)
    .map((r) => ({ r, a: achievable(r, state) }))
    .filter((x) => x.a.mode === 'wam' && x.a.net < 0)
    .sort((p, q) => p.a.net * p.r.owned - q.a.net * q.r.owned)
    .slice(0, 3);
  for (const { r, a } of losers) {
    out.push({ type: 'lossMaker', severity: 'bad', params: {
      industry: r.industry, quality: r.quality, count: r.owned,
      perDay: round(a.net), total: round(a.net * r.owned),
    } });
  }

  // deadCapital (owned, hire/idle mode, ≤ 0) — grouped into one insight if any.
  const dead = rows.filter((r) => {
    if (!r.owned) return false;
    const a = achievable(r, state);
    return (a.mode === 'hire' || a.mode === 'idle') && a.net <= 0;
  });
  if (dead.length) {
    const industries = [...new Set(dead.map((r) => r.industry))];
    out.push({ type: 'deadCapital', severity: 'warn', params: {
      industries: industries.join(','), count: dead.reduce((n, r) => n + r.owned, 0),
    } });
  }

  // rmStrategy: one per RM the player owns (an owned rm-kind row exists for that industry).
  const ownsRm = (industry: string) => report.rows.some((r) => r.kind === 'rm' && r.industry === industry && r.owned > 0);
  for (const v of report.rmVerdicts) {
    if (!v.hasPrice || !ownsRm(v.industry)) continue;
    out.push({ type: 'rmStrategy', severity: 'info', params: {
      industry: v.industry, convert: v.convertIsBetter ? 1 : 0,
      quality: v.bestQuality, delta: round(v.delta),
    } });
  }

  // hiring viability across usable rows.
  const anyHireNoTyc = rows.some((r) => (r.hireNet ?? -Infinity) > 0);
  const anyHireTyc = rows.some((r) => (r.hireNetTycoon ?? -Infinity) > 0);
  const hireMode = anyHireNoTyc ? 'some' : anyHireTyc ? 'tycoon' : 'none';
  out.push({ type: 'hiring', severity: 'info', params: { mode: hireMode, salary: round(state.offeredSalary) } });

  // caveat — always last.
  out.push({ type: 'caveat', severity: 'info', params: {} });
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
```
- [ ] **Step 4: Run `npx vitest run src/calc/advisorInsights.test.ts`**, expect PASS.
- [ ] **Step 5: `npx tsc --noEmit`** clean.
- [ ] **Step 6: Commit** `feat(advisor): deterministic insights generator`.

## Task 4: i18n — insights + exclude toggle strings

**Files:** `src/i18n/locales/en/advisor.json` (+ copy to all locales).

- [ ] **Step 1:** Add to `en/advisor.json` an `"insights"` object and two `table` keys. Use interpolation; `{{product}}` is supplied pre-built by the view (industry+quality), so keys take `{{product}}`, `{{count}}`, `{{perDay}}`, `{{total}}`, `{{quality}}`, `{{delta}}`, `{{salary}}`. Suggested EN copy:
```json
  "insights": {
    "title": "Bottom line",
    "bestAction": "💡 Most profitable to run/build: {{product}} — {{net}} CC/company/day.",
    "mainEarner": "✅ Your main income: {{product}} ×{{count}} — {{total}} CC/day.",
    "lossMaker": "🛑 Your {{count}}× {{product}} lose {{total}} CC/day — you'd earn more selling the raw material.",
    "deadCapital": "⚠️ You own {{count}} companies that can't be worked profitably (no WAM and hiring loses) — idle/dead capital.",
    "rmStrategySell": "ℹ️ Your {{rm}}: better to SELL raw (Δ {{delta}}).",
    "rmStrategyConvert": "ℹ️ Your {{rm}}: better to CONVERT into Q{{quality}} (Δ {{delta}}).",
    "hiringNone": "ℹ️ Hiring is unprofitable everywhere at salary {{salary}} — play WAM-only.",
    "hiringSome": "ℹ️ Hiring is profitable in some companies — see the hire columns.",
    "hiringTycoon": "ℹ️ Hiring only pays with the Tycoon pack — see the Tycoon column.",
    "caveat": "Figures use the prices you entered; mark qualities you can't sell (🚫) to drop them from advice."
  },
```
  And inside `"table"`: `"excludeToggle": "Toggle: I can't sell this quality", "excludedBadge": "won't sell"`.
  (The view maps: `bestAction`/`mainEarner`/`lossMaker` build `{{product}}` via industry+quality; `rmStrategy` chooses `rmStrategySell`/`rmStrategyConvert` by the `convert` param and supplies `{{rm}}` = `cfg.rmName`; `hiring` chooses `hiringNone`/`hiringSome`/`hiringTycoon` by `mode`.)
- [ ] **Step 2:** Re-copy EN to all locales:
```bash
for d in src/i18n/locales/*/; do [ "$d" = "src/i18n/locales/en/" ] || cp src/i18n/locales/en/advisor.json "$d/advisor.json"; done
ls src/i18n/locales/*/advisor.json | wc -l   # → 25
```
- [ ] **Step 3:** `npx vitest run src/i18n/i18n.test.ts` PASS.
- [ ] **Step 4: Commit** `feat(advisor): i18n for insights + exclude toggle`.

## Task 5: InsightsPanel component

**Files:** `src/views/AdvisorView/InsightsPanel.tsx`, `.test.tsx`.

- [ ] **Step 1: Failing smoke test** asserting it renders a loss-maker line and the caveat:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightsPanel } from './InsightsPanel';
import type { Insight } from '../../calc/advisorInsights';

const insights: Insight[] = [
  { type: 'lossMaker', severity: 'bad', params: { industry: 'weapons', quality: 7, count: 24, perDay: -413.61, total: -9927 } },
  { type: 'hiring', severity: 'info', params: { mode: 'none', salary: 7800 } },
  { type: 'caveat', severity: 'info', params: {} },
];
describe('InsightsPanel', () => {
  it('renders insight lines including the loss-maker and caveat', () => {
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText(/Weapons Q7/)).toBeTruthy();
    expect(screen.getByText(/mark qualities you can't sell/i)).toBeTruthy();
  });
});
```
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `InsightsPanel.tsx`. It maps each `Insight` to its i18n key, building `{{product}}` and `{{rm}}` from `getIndustry`, formatting numbers (`.toFixed(0)` for totals/day, `.toFixed(2)` for per-unit/perDay), and choosing the right key for `rmStrategy`/`hiring`:
```tsx
import { useTranslation } from 'react-i18next';
import { getIndustry } from '../../data/industries';
import { industryLabel } from '../../i18n/names';
import type { Insight } from '../../calc/advisorInsights';

const ICON: Record<string, string> = { good: '✅', warn: '⚠️', bad: '🛑', info: 'ℹ️' };

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  const { t } = useTranslation(['common', 'advisor']);
  if (!insights.length) return null;

  const product = (industry: unknown, quality: unknown) => {
    const cfg = getIndustry(industry as Parameters<typeof getIndustry>[0]);
    return `${cfg.icon} ${industryLabel(t, cfg)} Q${quality}`;
  };

  const line = (i: Insight): string => {
    const p = i.params;
    switch (i.type) {
      case 'bestAction':
        return t('advisor:insights.bestAction', { product: product(p.industry, p.quality), net: fmt(p.net) });
      case 'mainEarner':
        return t('advisor:insights.mainEarner', { product: product(p.industry, p.quality), count: p.count, total: fmt0(p.total) });
      case 'lossMaker':
        return t('advisor:insights.lossMaker', { product: product(p.industry, p.quality), count: p.count, total: fmt0(p.total) });
      case 'deadCapital':
        return t('advisor:insights.deadCapital', { count: p.count });
      case 'rmStrategy': {
        const cfg = getIndustry(p.industry as Parameters<typeof getIndustry>[0]);
        return Number(p.convert)
          ? t('advisor:insights.rmStrategyConvert', { rm: cfg.rmName, quality: p.quality, delta: fmt(p.delta) })
          : t('advisor:insights.rmStrategySell', { rm: cfg.rmName, delta: fmt(p.delta) });
      }
      case 'hiring':
        return p.mode === 'none' ? t('advisor:insights.hiringNone', { salary: fmt0(p.salary) })
          : p.mode === 'tycoon' ? t('advisor:insights.hiringTycoon')
          : t('advisor:insights.hiringSome');
      default:
        return t('advisor:insights.caveat');
    }
  };

  return (
    <section className="advisor-insights">
      <h3>{t('advisor:insights.title')}</h3>
      <ul>
        {insights.map((i, idx) => (
          <li key={idx} className={`insight insight-${i.severity}`} data-testid={`insight-${i.type}`}>
            <span className="insight-icon">{ICON[i.severity]}</span> {line(i)}
          </li>
        ))}
      </ul>
    </section>
  );
}

const fmt = (n: unknown) => (typeof n === 'number' ? (n > 0 ? '+' : '') + n.toFixed(2) : String(n));
const fmt0 = (n: unknown) => (typeof n === 'number' ? (n > 0 ? '+' : '') + Math.round(n).toString() : String(n));
```
  (The EN strings include leading emoji; the `insight-icon` duplicates severity — keep the explicit `ICON` span and drop the leading emoji from the EN copy, OR remove the span. Pick one in implementation so icons don't double up; recommended: remove leading emoji from the JSON text and keep the `ICON` span.)
- [ ] **Step 4: Run test, expect PASS.**
- [ ] **Step 5: `npx tsc --noEmit`** clean.
- [ ] **Step 6: Commit** `feat(advisor): InsightsPanel renders plain-language bottom line`.

## Task 6: ProductionTable — exclude toggle + excluded styling

**Files:** `src/views/AdvisorView/ProductionTable.tsx`, `.test.tsx`.

- [ ] **Step 1: Failing test** — render with one finished row, click its exclude toggle, assert callback fired:
```tsx
it('fires onToggleExclude with industry+quality for finished rows', () => {
  const rows = [{ industry:'weapons', quality:7, kind:'factory', wamNet:-413, hireNet:-8000, hireNetTycoon:-8000, roiRm:-0.2, owned:24, hasPrice:true, excluded:false }] as any;
  const spy = vi.fn();
  render(<ProductionTable rows={rows} onToggleExclude={spy} />);
  fireEvent.click(screen.getByTestId('exclude-weapons-7'));
  expect(spy).toHaveBeenCalledWith('weapons', 7);
});
```
(Add `import { vi } from 'vitest';` and `onToggleExclude` to existing fixtures' render calls — make the prop optional so other tests compile.)
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Add prop `onToggleExclude?: (industry: IndustryKey, quality: number) => void;`. For **finished-good rows only** (`r.kind === 'factory'`), render a small toggle button in the product cell (or a new trailing cell) with `data-testid={`exclude-${r.industry}-${r.quality}`}` calling `onToggleExclude?.(r.industry, r.quality)`; title from `t('advisor:table.excludeToggle')`. Add `excluded` to the row `className` builder when `r.excluded`; when excluded show the `t('advisor:table.excludedBadge')` near the product name. (`AdvisorRow` now has `excluded`.)
- [ ] **Step 4: Run test + full `npm test`,** expect PASS (update any existing ProductionTable fixtures to include `excluded:false`).
- [ ] **Step 5: `npx tsc --noEmit`** clean.
- [ ] **Step 6: Commit** `feat(advisor): per-quality exclude toggle in production table`.

## Task 7: Wire into AdvisorView + hooks + styles

**Files:** `src/state/hooks.ts`, `src/views/AdvisorView/AdvisorView.tsx`, `styles/advisor.css`.

- [ ] **Step 1: Hooks.** In `hooks.ts` add:
```ts
import { generateInsights, type Insight } from '../calc/advisorInsights';
export function useToggleExcludedQuality(): (industry: IndustryKey, quality: number) => void {
  const { dispatch } = useAppState();
  return (industry, quality) => dispatch({ type: 'TOGGLE_EXCLUDED_QUALITY', industry, quality });
}
export function useAdvisorInsights(): Insight[] {
  const { state } = useAppState();
  return generateInsights(computeAdvisor(state), state);
}
```
(`computeAdvisor` is already imported in hooks.ts for `useAdvisor`.)
- [ ] **Step 2: AdvisorView.** Import `InsightsPanel`, `useAdvisorInsights`, `useToggleExcludedQuality`. Render `<InsightsPanel insights={useAdvisorInsights()} />` at the top (after the title/intro, before/around `RecommendationHeadline`), and pass `onToggleExclude={useToggleExcludedQuality()}` to `<ProductionTable>`. Avoid calling `computeAdvisor` twice if trivial; acceptable for v1 (consistent with existing non-memoized hooks).
- [ ] **Step 3: Styles.** In `styles/advisor.css` add: `.advisor-insights` card; `.insight-good/.warn/.bad/.info` left-border/colour using existing tokens (reuse `--erep-green`, the red used elsewhere, `--text-secondary`); `.advisor-table tr.excluded td` greyed + `text-decoration: line-through` on the product cell; the exclude toggle button styling (small, muted).
- [ ] **Step 4:** `npx tsc --noEmit` + `npm test` + `npm run build` all green.
- [ ] **Step 5: Manual check** via `npm run dev` (server may already run on :5173): Advisor tab shows the Bottom line; toggling 🚫 on a quality greys it and updates insights/topWam.
- [ ] **Step 6: Commit** `feat(advisor): wire insights panel + exclude toggle into Advisor view`.

## Task 8: Docs + final review

- [ ] **Step 1:** Update `CLAUDE.md` (Advisor description + `src/` tree: `advisorInsights.ts`, `InsightsPanel.tsx`; mention `excludedQualities`) and `README.md` (insights + liquidity flag).
- [ ] **Step 2: Commit** `docs(advisor): document insights panel + liquidity flag`.
- [ ] **Step 3: Final verification:** `npx tsc --noEmit` && `npm test` && `npm run build`.
- [ ] **Step 4:** Dispatch a final holistic code review of the whole diff (spec-compliance + quality), fix any Important findings, then use `superpowers:finishing-a-development-branch`.

## Self-review (author)

- **Spec coverage:** insights generator (Task 3) ✓; adapts via achievable()/wamEnabled/hasTycoon ✓; liquidity flag state+calc+UI (Tasks 1,2,6) ✓; InsightsPanel + wiring (Tasks 5,7) ✓; i18n (Task 4) ✓; tests each task ✓; docs (Task 8) ✓.
- **No placeholders:** code blocks are concrete; the one judgement call (icon emoji duplication) is called out with a chosen resolution.
- **Type consistency:** `Insight`/`InsightSeverity` defined in Task 3 and consumed in Tasks 5/7; `excluded` added to `AdvisorRow` in Task 2 and used in Tasks 3/6; `TOGGLE_EXCLUDED_QUALITY` defined Task 1, used Task 7.
- **Golden parity untouched:** only `computeAdvisor` orchestration changes; `computeFwIndustry`/`computeHiredIndustry` never edited.
