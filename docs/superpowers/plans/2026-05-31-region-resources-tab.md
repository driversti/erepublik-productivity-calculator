# Regions Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only **Regions** tab that ranks world regions by their static production bonus for a chosen industry, filterable by country.

**Architecture:** A pure ranking helper (`src/regions/ranking.ts`) reads the already-committed static dataset (`src/data/regionResources.ts`) and returns regions sorted by total industry bonus. A new `RegionsView` component renders the ranking with an industry switcher and country filter, using local component state only (no reducer, no persistence). It is wired in as a new top-level tab alongside the calculators and Holdings.

**Tech Stack:** React 19 + TypeScript (strict), Vitest + Testing Library, react-i18next.

---

## File Structure

- **Create** `src/regions/ranking.ts` — pure ranking + country-list helpers.
- **Create** `src/regions/ranking.test.ts` — unit tests for the helpers.
- **Create** `src/data/regionResources.test.ts` — data-integrity guard.
- **Create** `src/views/RegionsView/RegionsView.tsx` — the tab UI.
- **Create** `src/views/RegionsView/RegionsView.test.tsx` — component tests.
- **Create** `src/App.test.tsx` — wiring test (clicking the tab renders the view).
- **Create** `styles/regions.css` — tab styles.
- **Modify** `src/state/types.ts:71` — add `'regions'` to `ActiveModule`.
- **Modify** `src/App.tsx:12-16` — render `RegionsView` for the `regions` module.
- **Modify** `src/components/TabBar.tsx:25-32` — add the Regions tab button.
- **Modify** `src/i18n/locales/en/common.json` — add `tabs.regions` + a `regions` block.
- **Modify** `styles/index.css` — import `regions.css`.

Already done (committed): `src/data/regionResources.ts` (the static dataset).

Notes carried from the spec, refined against the code:
- **Country names render literally** from the dataset (game-canonical English, like region/resource names). There is no country-name i18n helper in `src/i18n/names.ts` (only `industryLabel`/`industryRm`), and inventing one is out of scope.
- **No empty-state branch:** the country dropdown is built only from countries that have ≥1 region for the selected industry, so a valid selection can never yield zero rows. Don't add dead empty-state UI.
- **EN-only strings:** the i18n test (`src/i18n/i18n.test.ts`) checks representative keys + namespace presence, not per-locale key coverage. Missing keys fall back to EN, so only `en/common.json` is edited. No `gen-i18n-resources.mjs` run is needed (it imports the JSON directly).

---

## Task 1: Ranking helper

**Files:**
- Create: `src/regions/ranking.ts`
- Test: `src/regions/ranking.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/regions/ranking.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rankRegions, countriesForIndustry } from './ranking';

describe('rankRegions', () => {
  it('sums an industry\'s resource bonuses per region', () => {
    const aircraft = rankRegions('aircraft');
    const dobrogea = aircraft.find((r) => r.region.name === 'Dobrogea');
    expect(dobrogea).toBeTruthy();
    // Magnesium 10 + Cobalt 25 + Titanium 15 + Wolfram 20
    expect(dobrogea!.totalBonus).toBe(70);
    expect(dobrogea!.matched.map((m) => m.name).sort()).toEqual(
      ['Cobalt', 'Magnesium', 'Titanium', 'Wolfram'],
    );
  });

  it('returns only regions that have the industry, sorted desc with name tie-break', () => {
    const food = rankRegions('food');
    expect(food.length).toBeGreaterThan(0);
    for (const row of food) {
      expect(row.matched.length).toBeGreaterThan(0);
      expect(row.matched.every((m) => m.industry === 'food')).toBe(true);
    }
    for (let i = 1; i < food.length; i++) {
      const prev = food[i - 1];
      const cur = food[i];
      expect(prev.totalBonus).toBeGreaterThanOrEqual(cur.totalBonus);
      if (prev.totalBonus === cur.totalBonus) {
        expect(prev.region.name.localeCompare(cur.region.name)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('filters by current country when given', () => {
    const all = rankRegions('aircraft');
    const ro = rankRegions('aircraft', { country: 'Romania' });
    expect(ro.length).toBeGreaterThan(0);
    expect(ro.length).toBeLessThanOrEqual(all.length);
    expect(ro.every((r) => r.region.currentCountry === 'Romania')).toBe(true);
  });
});

describe('countriesForIndustry', () => {
  it('lists distinct current countries that have the industry, sorted', () => {
    const list = countriesForIndustry('aircraft');
    expect(list).toContain('Romania');
    expect(new Set(list).size).toBe(list.length); // no dupes
    expect([...list]).toEqual([...list].sort((a, b) => a.localeCompare(b)));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/regions/ranking.test.ts`
Expected: FAIL — `Failed to resolve import "./ranking"` / module not found.

- [ ] **Step 3: Write the implementation**

Create `src/regions/ranking.ts`:

```ts
import {
  REGION_RESOURCES,
  type Industry,
  type RegionEntry,
  type RegionResource,
} from '../data/regionResources';

export interface RankedRegion {
  region: RegionEntry;
  /** Sum of the bonuses of this industry's resources in the region. */
  totalBonus: number;
  /** The resources that contributed (for display chips). */
  matched: RegionResource[];
}

/**
 * Regions that contain at least one resource of `industry`, ranked by total
 * bonus (desc), tie-broken by region name (asc). Optionally restricted to a
 * single `currentCountry`.
 */
export function rankRegions(
  industry: Industry,
  opts?: { country?: string },
): RankedRegion[] {
  const country = opts?.country;
  const ranked: RankedRegion[] = [];
  for (const region of REGION_RESOURCES) {
    if (country && region.currentCountry !== country) continue;
    const matched = region.resources.filter((r) => r.industry === industry);
    if (matched.length === 0) continue;
    const totalBonus = matched.reduce((sum, r) => sum + r.bonus, 0);
    ranked.push({ region, totalBonus, matched });
  }
  ranked.sort(
    (a, b) => b.totalBonus - a.totalBonus || a.region.name.localeCompare(b.region.name),
  );
  return ranked;
}

/** Distinct `currentCountry` values that have ≥1 region for the industry, sorted. */
export function countriesForIndustry(industry: Industry): string[] {
  const set = new Set<string>();
  for (const region of REGION_RESOURCES) {
    if (region.resources.some((r) => r.industry === industry)) {
      set.add(region.currentCountry);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/regions/ranking.test.ts`
Expected: PASS (3 + 1 tests).

- [ ] **Step 5: Commit**

```bash
git add src/regions/ranking.ts src/regions/ranking.test.ts
git commit -m "feat(regions): add region ranking helper"
```

---

## Task 2: Data-integrity guard

**Files:**
- Test: `src/data/regionResources.test.ts`

- [ ] **Step 1: Write the test**

Create `src/data/regionResources.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  REGION_RESOURCES,
  COUNTRY_FLAGS,
  SNAPSHOT_DATE,
  type Industry,
} from './regionResources';

const INDUSTRIES: readonly Industry[] = ['food', 'weapons', 'houses', 'aircraft'];
const BONUSES = new Set([10, 15, 20, 25, 30]);

describe('regionResources dataset', () => {
  it('is non-empty and every region carries at least one resource', () => {
    expect(REGION_RESOURCES.length).toBeGreaterThan(0);
    for (const r of REGION_RESOURCES) {
      expect(r.resources.length, `${r.name} has resources`).toBeGreaterThan(0);
    }
  });

  it('uses only known industries and bonus tiers', () => {
    for (const region of REGION_RESOURCES) {
      for (const res of region.resources) {
        expect(INDUSTRIES, `${region.name}/${res.name} industry`).toContain(res.industry);
        expect(BONUSES.has(res.bonus), `${region.name}/${res.name} bonus ${res.bonus}`).toBe(true);
      }
    }
  });

  it('has unique region ids', () => {
    const ids = REGION_RESOURCES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a valid snapshot date and string flag URLs', () => {
    expect(SNAPSHOT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const url of Object.values(COUNTRY_FLAGS)) {
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/data/regionResources.test.ts`
Expected: PASS (the dataset is already committed and valid).

- [ ] **Step 3: Commit**

```bash
git add src/data/regionResources.test.ts
git commit -m "test(regions): guard regionResources dataset integrity"
```

---

## Task 3: i18n strings (English)

**Files:**
- Modify: `src/i18n/locales/en/common.json`

- [ ] **Step 1: Add the Regions tab label and a `regions` block**

In `src/i18n/locales/en/common.json`, change the `tabs` object from:

```json
  "tabs": {
    "holdings": "🗂️ Holdings"
  },
```

to:

```json
  "tabs": {
    "holdings": "🗂️ Holdings",
    "regions": "🌍 Regions"
  },
  "regions": {
    "country": "Country",
    "allCountries": "All countries",
    "bonusValue": "+{{value}}%",
    "snapshotNote": "Snapshot {{date}} · current ownership may be stale (regions change hands in war).",
    "columns": {
      "rank": "#",
      "region": "Region",
      "country": "Country",
      "bonus": "Bonus",
      "resources": "Resources"
    }
  },
```

(Insert the `regions` block immediately after the closing brace of `tabs`. Keep the rest of the file unchanged and valid JSON — mind the trailing comma rules relative to the following key.)

- [ ] **Step 2: Verify the JSON still parses and i18n tests pass**

Run: `node -e "require('./src/i18n/locales/en/common.json'); console.log('ok')"`
Expected: prints `ok`.

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/en/common.json
git commit -m "i18n(en): add Regions tab strings"
```

---

## Task 4: RegionsView component + styles

**Files:**
- Create: `src/views/RegionsView/RegionsView.tsx`
- Create: `styles/regions.css`
- Modify: `styles/index.css`
- Test: `src/views/RegionsView/RegionsView.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create `src/views/RegionsView/RegionsView.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionsView } from './RegionsView';

function setup() {
  return render(<RegionsView />);
}

describe('RegionsView', () => {
  it('renders a ranked list with the snapshot note', () => {
    setup();
    expect(screen.getByTestId('regions-view')).toBeInTheDocument();
    expect(screen.getByText(/Snapshot 2026-05-31/)).toBeInTheDocument();
    expect(screen.getAllByTestId('regions-row').length).toBeGreaterThan(0);
  });

  it('switching industry to aircraft shows Dobrogea at +70%', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    const dobrogea = screen.getByText('Dobrogea').closest('tr') as HTMLElement;
    expect(within(dobrogea).getByText('+70%')).toBeInTheDocument();
  });

  it('country filter narrows rows to the chosen country', async () => {
    setup();
    await userEvent.click(screen.getByTestId('regions-ind-aircraft'));
    await userEvent.selectOptions(screen.getByTestId('regions-country'), 'Romania');
    const rows = screen.getAllByTestId('regions-row');
    for (const row of rows) {
      expect(within(row).getByTestId('regions-country-cell')).toHaveTextContent('Romania');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/RegionsView/RegionsView.test.tsx`
Expected: FAIL — cannot resolve `./RegionsView`.

- [ ] **Step 3: Write the component**

Create `src/views/RegionsView/RegionsView.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INDUSTRIES } from '../../data/industries';
import type { IndustryKey } from '../../data/types';
import { industryLabel } from '../../i18n/names';
import { SNAPSHOT_DATE, COUNTRY_FLAGS } from '../../data/regionResources';
import { rankRegions, countriesForIndustry } from '../../regions/ranking';

// eRepublik flag URLs are protocol-relative ("//..."); make them absolute https.
const flagSrc = (url?: string): string | undefined =>
  url ? (url.startsWith('//') ? `https:${url}` : url) : undefined;

export function RegionsView() {
  const { t } = useTranslation();
  const [industry, setIndustry] = useState<IndustryKey>('food');
  const [country, setCountry] = useState<string>('');

  const ranked = rankRegions(industry, country ? { country } : undefined);
  const countries = countriesForIndustry(industry);

  // Available countries differ per industry, so reset the filter on switch.
  const changeIndustry = (key: IndustryKey) => {
    setIndustry(key);
    setCountry('');
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
              onClick={() => changeIndustry(cfg.key)}
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

      <p className="regions-snapshot-note">
        {t('regions.snapshotNote', { date: SNAPSHOT_DATE })}
      </p>

      <table className="regions-table">
        <thead>
          <tr>
            <th>{t('regions.columns.rank')}</th>
            <th>{t('regions.columns.region')}</th>
            <th>{t('regions.columns.country')}</th>
            <th>{t('regions.columns.bonus')}</th>
            <th>{t('regions.columns.resources')}</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, i) => {
            const src = flagSrc(COUNTRY_FLAGS[row.region.currentCountry]);
            return (
              <tr key={row.region.id} data-testid="regions-row">
                <td className="regions-rank">{i + 1}</td>
                <td>{row.region.name}</td>
                <td className="regions-country-cell" data-testid="regions-country-cell">
                  {src && <img className="regions-flag" src={src} alt="" aria-hidden="true" />}
                  {row.region.currentCountry}
                </td>
                <td className="regions-bonus">
                  {t('regions.bonusValue', { value: row.totalBonus })}
                </td>
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
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/RegionsView/RegionsView.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Add styles**

Create `styles/regions.css`:

```css
.regions-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

.regions-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.regions-industry-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.regions-ind-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #d0d0d0);
  border-radius: 6px;
  background: var(--card-bg, #fff);
  color: inherit;
  cursor: pointer;
}

.regions-ind-btn.active {
  background: var(--accent, #2e7d32);
  color: #fff;
  border-color: var(--accent, #2e7d32);
}

.regions-country-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.regions-country-filter select {
  padding: 5px 8px;
}

.regions-snapshot-note {
  font-size: 0.85em;
  opacity: 0.75;
  margin: 4px 0 12px;
}

.regions-table {
  width: 100%;
  border-collapse: collapse;
}

.regions-table th,
.regions-table td {
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #eee);
}

.regions-rank {
  width: 2.5em;
  opacity: 0.7;
}

.regions-bonus {
  font-weight: 600;
  white-space: nowrap;
}

.regions-country-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.regions-flag {
  width: 18px;
  height: auto;
  border-radius: 2px;
}

.regions-chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.regions-chip {
  font-size: 0.8em;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--chip-bg, #eef3ee);
  white-space: nowrap;
}
```

Then add its import to `styles/index.css` (after `holdings.css`, before `tooltip.css`):

```css
@import './holdings.css';
@import './regions.css';
@import './tooltip.css';
```

- [ ] **Step 6: Commit**

```bash
git add src/views/RegionsView/RegionsView.tsx src/views/RegionsView/RegionsView.test.tsx styles/regions.css styles/index.css
git commit -m "feat(regions): add RegionsView tab UI"
```

---

## Task 5: Wire the tab into the app

**Files:**
- Modify: `src/state/types.ts:71`
- Modify: `src/App.tsx`
- Modify: `src/components/TabBar.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing wiring test**

Create `src/App.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => localStorage.clear());

describe('App tab routing', () => {
  it('shows the Regions tab and renders RegionsView when clicked', async () => {
    render(<App />);
    const tab = screen.getByTestId('tab-regions');
    expect(tab).toBeInTheDocument();
    await userEvent.click(tab);
    expect(screen.getByTestId('regions-view')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `Unable to find an element by: [data-testid="tab-regions"]`.

- [ ] **Step 3: Extend the `ActiveModule` type**

In `src/state/types.ts`, change line 71 from:

```ts
export type ActiveModule = IndustryKey | 'holdings';
```

to:

```ts
export type ActiveModule = IndustryKey | 'holdings' | 'regions';
```

- [ ] **Step 4: Render `RegionsView` for the `regions` module**

In `src/App.tsx`, add the import after the `HoldingsView` import (line 5):

```ts
import { RegionsView } from './views/RegionsView/RegionsView';
```

Then change the `ActiveView` function (lines 12-16) from:

```tsx
function ActiveView() {
  const active = useActiveModule();
  if (active === 'holdings') return <HoldingsView />;
  return <IndustryView industryKey={active} />;
}
```

to:

```tsx
function ActiveView() {
  const active = useActiveModule();
  if (active === 'holdings') return <HoldingsView />;
  if (active === 'regions') return <RegionsView />;
  return <IndustryView industryKey={active} />;
}
```

(After both guards TypeScript narrows `active` to `IndustryKey`, so the
`IndustryView` prop still type-checks with no cast.)

- [ ] **Step 5: Add the Regions tab button**

In `src/components/TabBar.tsx`, add a button immediately after the Holdings
button (after line 32's closing `</button>`, still inside `.nav-container`):

```tsx
        <button
          type="button"
          className={`nav-tab${active === 'regions' ? ' active' : ''}`}
          data-testid="tab-regions"
          onClick={() => switchTo('regions')}
        >
          {t('tabs.regions')}
        </button>
```

- [ ] **Step 6: Run the wiring test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/state/types.ts src/App.tsx src/components/TabBar.tsx src/App.test.tsx
git commit -m "feat(regions): wire Regions tab into app router"
```

---

## Task 6: Full verification

- [ ] **Step 1: Type-check + build**

Run: `npm run build`
Expected: `tsc --noEmit` passes, `vite build` produces `dist/` with no errors.

- [ ] **Step 2: Run the whole test suite**

Run: `npm test`
Expected: all tests pass (golden parity, state, components, views, i18n, plus the
new ranking/data/RegionsView/App tests).

- [ ] **Step 3: Manual smoke (optional)**

Run: `npm run dev`, open the Regions tab, switch industries, pick a country, and
confirm rows re-rank and flags render.

- [ ] **Step 4: Final commit (only if Steps 1-2 required fixes)**

```bash
git add -A
git commit -m "chore(regions): verification fixups"
```
```
