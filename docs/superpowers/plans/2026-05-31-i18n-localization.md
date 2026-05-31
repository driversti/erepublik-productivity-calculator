# i18n Localization + Field Tooltips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract every user-facing string into a `react-i18next` catalog (English only for now) and add hover tooltips to every input/output field via `react-tooltip`, with the architecture ready to add more languages later.

**Architecture:** A synchronous, provider-less i18next instance (global, `initReactI18next`) holds four EN namespaces (`common`, `industry`, `holdings`, `tooltips`). Components read strings via `useTranslation()`. A single global `<AppTooltip />` (react-tooltip) renders hints; elements opt in by spreading a `tip(content)` helper. A `<LanguageSwitcher>` is wired but hidden while only one locale exists. English catalog values are byte-identical to today's strings, so the existing component tests act as the parity guard.

**Tech Stack:** React 19, TypeScript (strict), Vite, Vitest + Testing Library, `i18next`, `react-i18next`, `react-tooltip`.

> **Commit policy:** The user's global rule is *always ask before creating commits.* Each task ends with a commit step — get the user's go-ahead before running it (or ask once for blanket approval to commit per-task).

> **Parity rule (read before every extraction task):** When you move a string into a catalog, the English value MUST be byte-for-byte identical to what the component renders today (including punctuation, `&`, `…`, `%`, casing, trailing spaces). The catalog is the single source; never "improve" wording during extraction. Tooltips are the only *new* text.

---

## File Structure

**New files**
- `src/i18n/config.ts` — supported locales, default, storage key, `loadLocale()`.
- `src/i18n/index.ts` — synchronous i18next init; exports the instance + `resources`.
- `src/i18n/i18next.d.ts` — type augmentation so `t()` keys are checked.
- `src/i18n/names.ts` — `industryLabel(t,cfg)` / `industryRm(t,cfg)` helpers.
- `src/i18n/locales/en/common.json`
- `src/i18n/locales/en/industry.json`
- `src/i18n/locales/en/holdings.json`
- `src/i18n/locales/en/tooltips.json`
- `src/i18n/i18n.test.ts` — namespace/key coverage test.
- `src/components/tooltip.ts` — `TIP_ID` + `tip(content)` helper.
- `src/components/AppTooltip.tsx` — mounts the single react-tooltip instance.
- `src/components/LanguageSwitcher.tsx` — locale picker (hidden when ≤1 locale).
- `styles/tooltip.css` — themed react-tooltip overrides.

**Modified files**
- `package.json` (deps), `src/main.tsx`, `src/test/setup.ts`, `styles/index.css`
- `src/App.tsx`, `src/components/TabBar.tsx`, `src/components/Counter.tsx`
- `src/views/IndustryView/ModifiersPanel.tsx`, `PricesPanel.tsx`, `IndustryView.tsx`, `SummarySidebar.tsx`
- `src/views/HoldingsView/HoldingToolbar.tsx`, `HoldingLocationBar.tsx`, `HoldingSummary.tsx`, `HoldingSection.tsx`

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime libraries**

Run:
```bash
npm install i18next react-i18next react-tooltip
```
Expected: three packages added to `dependencies`; `npm install` exits 0.

- [ ] **Step 2: Verify the app still builds & tests pass (baseline untouched)**

Run: `npm run build && npm test`
Expected: `tsc --noEmit` clean, `vite build` succeeds, all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(i18n): add i18next, react-i18next, react-tooltip deps"
```

---

## Task 2: i18n scaffold + full English catalogs

This task creates the entire string catalog up front so later tasks only swap JSX → `t()` keys. The catalog values are the current English strings (parity) plus the new tooltip copy.

**Files:**
- Create: `src/i18n/config.ts`, `src/i18n/index.ts`, `src/i18n/i18next.d.ts`, `src/i18n/names.ts`
- Create: `src/i18n/locales/en/common.json`, `industry.json`, `holdings.json`, `tooltips.json`
- Modify: `src/main.tsx`, `src/test/setup.ts`

- [ ] **Step 1: `src/i18n/config.ts`**

```ts
export const LOCALE_STORAGE_KEY = 'erep_locale';

// Add new locale codes here; the LanguageSwitcher appears automatically once
// this list has more than one entry.
export const SUPPORTED_LOCALES = ['en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function loadLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  return (SUPPORTED_LOCALES as readonly string[]).includes(saved ?? '')
    ? (saved as Locale)
    : DEFAULT_LOCALE;
}
```

- [ ] **Step 2: `src/i18n/locales/en/common.json`**

```json
{
  "header": {
    "title": "eRepublik Productivity & Profit Calculator",
    "subtitle": "Estimate daily profit across food, weapons, houses, aircraft & holdings"
  },
  "footer": "eRepublik Productivity Calculator",
  "theme": {
    "toggleAria": "Toggle theme",
    "toDark": "🌙 Dark Mode",
    "toLight": "☀️ Light Mode"
  },
  "language": { "label": "Language" },
  "tabs": { "holdings": "🗂️ Holdings" },
  "labels": { "companies": "Companies", "workers": "Workers" },
  "counter": { "minusAria": "{{label}} minus", "plusAria": "{{label}} plus" },
  "buttons": { "syncLivePrices": "Sync Live Prices", "syncing": "Syncing…" }
}
```

- [ ] **Step 3: `src/i18n/locales/en/industry.json`**

```json
{
  "modifiers": {
    "country": "Country",
    "region": "Region",
    "selectCountry": "Select country",
    "selectRegion": "Select region",
    "countryBonus": "Country Bonus (%)",
    "regionBonus": "Region Bonus (%)",
    "workTax": "Work Tax (%)",
    "vat": "VAT (%)",
    "avgSalary": "Avg Salary",
    "offeredCc": "Offered CC",
    "tycoon": "Tycoon (+20%)",
    "tycoonAria": "Tycoon Pack",
    "wam": "WAM",
    "wamAria": "Work as Manager"
  },
  "prices": {
    "header": "{{label}} Market Prices (CC)",
    "qLabel": "Q{{q}}"
  },
  "tables": {
    "factoriesHeader": "Your {{label}} Factories",
    "rmHeader": "Your {{rm}} Companies",
    "factoriesHeaderShort": "{{label}} Factories",
    "rmHeaderShort": "{{rm}} Companies",
    "headers": {
      "quality": "Quality",
      "companies": "Companies",
      "workers": "Workers",
      "output": "Output/Session",
      "netProfit": "Daily Net Profit"
    },
    "outputSession": "{{value}} / session",
    "outputSessionRm": "{{value}} {{rm}} / session"
  },
  "summary": {
    "title": "Summary",
    "optionABadge": "Option A",
    "optionBBadge": "Option B",
    "netProfit": "Est. Daily Net Profit",
    "totalCompanies": "Total Companies",
    "output": "{{label}} Output",
    "rmConsumed": "{{rm}} Consumed",
    "revenue": "Daily Revenue",
    "rmCost": "Daily {{rm}} Cost",
    "grossProfit": "Gross Profit",
    "workTax": "Daily Work Tax",
    "salary": "Daily Salary",
    "breakdownTitle": "Inventory breakdown:",
    "noFactories": "No factories configured yet.",
    "breakdownItem": "Q{{q}} ({{companies}}c / {{workers}}w)",
    "comparisonTitle": "{{rm}} Strategy Comparison",
    "rmProduced": "{{rm}} Produced",
    "rmNetBalance": "{{rm}} Net Balance",
    "optionABuyTitle": "Option A: Buy {{rm}}",
    "optionAMarketCost": "Market Cost: {{cost}} CC",
    "optionBProduceTitle": "Option B: Produce {{rm}}",
    "optionBBalance": "Balance: {{balance}} {{rm}}",
    "netProfitInline": "Net Profit:",
    "recommendA": "Recommendation: Option A (Buy {{rm}}) is more profitable by {{delta}} CC/day",
    "recommendB": "Recommendation: Option B (Produce) is more profitable by {{delta}} CC/day",
    "recommendEqual": "Recommendation: Both options are equally profitable"
  }
}
```

- [ ] **Step 4: `src/i18n/locales/en/holdings.json`**

```json
{
  "tab": "🗂️ Holdings",
  "toolbar": {
    "holding": "Holding",
    "none": "— none —",
    "new": "+ New",
    "rename": "Rename",
    "delete": "Delete",
    "clearCompanies": "Clear Companies",
    "newPrompt": "New holding name:",
    "newDefault": "Holding {{n}}",
    "renamePrompt": "Rename holding:",
    "deleteConfirm": "Delete holding \"{{name}}\"?",
    "clearConfirm": "Clear all companies in this holding? Location and synced bonuses are kept."
  },
  "location": {
    "country": "Holding Country",
    "region": "Holding Region",
    "selectCountry": "— Select country —",
    "selectRegion": "— Select region —",
    "statusSynced": "Auto-sync: Synced",
    "statusNoRegion": "Auto-sync: Region not selected",
    "statusNotConfigured": "Auto-sync: Not configured"
  },
  "summary": {
    "title": "Holding Summary",
    "netProfit": "Total Net Profit",
    "totalCompanies": "Total Companies",
    "revenue": "Daily Revenue",
    "rmNet": "Raw Material (net)",
    "workTax": "Work Tax",
    "salaries": "Salaries",
    "perIndustry": "Per industry",
    "empty": "No companies in this holding yet.",
    "breakdownItem": "{{icon}} {{label}} ({{companies}}c)"
  },
  "section": {
    "mods": "Country +{{country}}% · Region +{{region}}% · Pollution {{pollution}}%"
  }
}
```

- [ ] **Step 5: `src/i18n/locales/en/tooltips.json`** (NEW copy — not parity-constrained)

```json
{
  "country": "Country whose production bonus and economy (work tax, VAT, average salary) apply to these companies.",
  "region": "Region whose production bonus and pollution apply. Select the country first.",
  "countryBonus": "Production bonus from the selected country. Set automatically — pick a country to change it.",
  "regionBonus": "Production bonus from the selected region. Set automatically — pick a region to change it.",
  "workTax": "Percent of the average salary paid as tax per Work-as-Manager session. Set by the selected country.",
  "vat": "Value-added tax deducted from sales revenue. Set by the selected country.",
  "avgSalary": "Average market salary in the selected country — the basis for the work-tax cost per WAM session.",
  "offeredCc": "Daily wage you pay each hired worker, in CC. Your main labour cost.",
  "tycoon": "Tycoon pack bonus: +20% production on every company.",
  "wam": "Work as Manager: you personally work one extra session per company (food & weapons only).",
  "syncPrices": "Fetch the latest market prices for this industry from the game.",
  "productPrice": "Market sell price per unit of this quality, in CC. Drives revenue.",
  "rmPrice": "Market price per unit of raw material, in CC. Used both to buy it and to value what you produce.",
  "colQuality": "Company quality tier. The percentage is its pollution penalty.",
  "colCompanies": "Number of companies you own at this quality.",
  "colWorkers": "Hired workers assigned. Capped at companies × max employees per company.",
  "colOutput": "Units produced per work session at this quality, after all modifiers.",
  "colNetProfit": "Estimated daily net profit for this row: revenue minus raw material, work tax and salaries.",
  "sumNetProfit": "Estimated total daily net profit across all companies in this industry.",
  "sumTotalCompanies": "Total number of companies configured in this industry.",
  "sumOutput": "Total units produced per day across all companies.",
  "sumRmConsumed": "Total raw material your factories consume per day.",
  "sumRevenue": "Total daily sales revenue, after VAT.",
  "sumRmCost": "Daily raw-material cost (Option B: net balance only). Negative means you sell a surplus.",
  "sumGrossProfit": "Daily revenue minus raw-material cost, before tax and salaries.",
  "sumWorkTax": "Daily work tax paid on Work-as-Manager sessions.",
  "sumSalary": "Daily wages paid to hired workers.",
  "sumRmProduced": "Raw material your own companies produce per day.",
  "sumRmNetBalance": "Raw material produced minus consumed. Positive means a surplus you can sell.",
  "strategyBadge": "Accounting mode for the headline numbers: Option A (buy raw material) or Option B (produce it).",
  "optionA": "Buy all raw material on the market and run only your factories.",
  "optionB": "Run your own raw-material companies and buy/sell only the net balance.",
  "hldPicker": "Switch between your saved holdings.",
  "hldCountry": "Country applied to every industry in this holding.",
  "hldRegion": "Region applied to every industry in this holding. Select the country first.",
  "hldStatus": "Whether this holding's bonuses are synced from a selected country and region.",
  "hldNetProfit": "Combined daily net profit across every industry in this holding.",
  "hldRevenue": "Combined daily sales revenue across the holding, after VAT.",
  "hldRmNet": "Net raw-material cost across the holding. Negative means a net surplus sold.",
  "hldWorkTax": "Total daily work tax across the holding.",
  "hldSalary": "Total daily wages across the holding."
}
```

- [ ] **Step 6: `src/i18n/index.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, loadLocale } from './config';
import enCommon from './locales/en/common.json';
import enIndustry from './locales/en/industry.json';
import enHoldings from './locales/en/holdings.json';
import enTooltips from './locales/en/tooltips.json';

export const resources = {
  en: {
    common: enCommon,
    industry: enIndustry,
    holdings: enHoldings,
    tooltips: enTooltips,
  },
} as const;

// Synchronous init: resources are bundled JSON, so translated text is present on
// first render (no Suspense, no key flash, tests render immediately). Uses the
// global instance via initReactI18next — components need no <I18nextProvider>.
i18n.use(initReactI18next).init({
  resources,
  lng: loadLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: ['common', 'industry', 'holdings', 'tooltips'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
```

- [ ] **Step 7: `src/i18n/i18next.d.ts`** (typed keys)

```ts
import 'i18next';
import type { resources } from './index';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en'];
  }
}
```

- [ ] **Step 8: `src/i18n/names.ts`** (industry/RM display names)

```ts
import type { TFunction } from 'i18next';
import type { IndustryConfig } from '../data/types';

// Industry & raw-material display names stay canonical in data/industries.ts for
// English. We resolve them through i18next with the data value as defaultValue,
// so EN is always byte-identical and other locales can override via
// `industry:names.<key>.label` / `.rm`. The key is cast because these names are
// intentionally absent from the typed EN resources.
export const industryLabel = (t: TFunction, cfg: IndustryConfig): string =>
  t(`industry:names.${cfg.key}.label` as never, { defaultValue: cfg.label });

export const industryRm = (t: TFunction, cfg: IndustryConfig): string =>
  t(`industry:names.${cfg.key}.rm` as never, { defaultValue: cfg.rmName });
```

- [ ] **Step 9: Wire init into `src/main.tsx`**

Add the import (side-effect) near the top, after the React imports:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './i18n';
import '../styles/index.css';
```

- [ ] **Step 10: Init i18n for tests — `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '../i18n';

// Unmount React trees between tests so queries never see a previous test's DOM.
afterEach(() => {
  cleanup();
});
```

- [ ] **Step 11: Verify build & existing tests still pass**

Run: `npm run build && npm test`
Expected: `tsc --noEmit` clean (JSON typing + augmentation compile), all tests PASS (no component changed yet, so still green).

- [ ] **Step 12: Commit**

```bash
git add src/i18n src/main.tsx src/test/setup.ts
git commit -m "feat(i18n): add react-i18next scaffold + full English catalogs"
```

---

## Task 3: Tooltip infrastructure

**Files:**
- Create: `src/components/tooltip.ts`, `src/components/AppTooltip.tsx`, `styles/tooltip.css`
- Modify: `styles/index.css`, `src/App.tsx`
- Test: `src/components/tooltip.test.ts`

- [ ] **Step 1: Write the failing test — `src/components/tooltip.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { tip, TIP_ID } from './tooltip';

describe('tip()', () => {
  it('returns react-tooltip anchor attributes for the given content', () => {
    expect(tip('Hello')).toEqual({
      'data-tooltip-id': TIP_ID,
      'data-tooltip-content': 'Hello',
    });
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm test -- src/components/tooltip.test.ts`
Expected: FAIL — cannot resolve `./tooltip`.

- [ ] **Step 3: `src/components/tooltip.ts`**

```ts
// Single shared react-tooltip anchor id. Spread tip(content) onto any element to
// give it a themed hover tooltip rendered by the global <AppTooltip />.
export const TIP_ID = 'app-tip';

export function tip(content: string) {
  return { 'data-tooltip-id': TIP_ID, 'data-tooltip-content': content } as const;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tooltip.test.ts`
Expected: PASS.

- [ ] **Step 5: `src/components/AppTooltip.tsx`**

```tsx
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { TIP_ID } from './tooltip';

// One global tooltip instance for the whole app. Anchored elements opt in via
// the tip() helper (data-tooltip-id / data-tooltip-content).
export function AppTooltip() {
  return <Tooltip id={TIP_ID} className="app-tooltip" place="top" />;
}
```

- [ ] **Step 6: `styles/tooltip.css`** (theme to match app vars)

```css
/* Override react-tooltip v5 theme to match the app's light/dark surfaces. */
.app-tooltip.app-tooltip {
  background: var(--bg-header, #1f2937);
  color: var(--text-primary, #f9fafb);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  max-width: 260px;
  padding: 7px 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  opacity: 1;
  z-index: 9999;
}
.app-tooltip.app-tooltip .react-tooltip-arrow {
  background: var(--bg-header, #1f2937);
  border-right: 1px solid var(--border-color, rgba(0, 0, 0, 0.15));
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.15));
}
```

- [ ] **Step 7: Import the stylesheet in `styles/index.css`**

Add this line alongside the other per-concern imports (order does not matter, keep grouped near the end):

```css
@import './tooltip.css';
```

- [ ] **Step 8: Mount `<AppTooltip />` in `src/App.tsx`**

Add the import:
```tsx
import { AppTooltip } from './components/AppTooltip';
```
Render it once inside `<StateProvider>`, just before the closing `</StateProvider>` (after `<footer>`):
```tsx
      <footer className="game-footer">
        eRepublik Productivity Calculator
      </footer>
      <AppTooltip />
    </StateProvider>
```
(The footer text is extracted in Task 5 — leave it as-is for now.)

- [ ] **Step 9: Verify build & all tests**

Run: `npm run build && npm test`
Expected: clean build, all tests PASS (tooltip.test included).

- [ ] **Step 10: Commit**

```bash
git add src/components/tooltip.ts src/components/tooltip.test.ts src/components/AppTooltip.tsx styles/tooltip.css styles/index.css src/App.tsx
git commit -m "feat(i18n): add global react-tooltip instance + tip() helper"
```

---

## Task 4: LanguageSwitcher (hidden while one locale)

**Files:**
- Create: `src/components/LanguageSwitcher.tsx`
- Test: `src/components/LanguageSwitcher.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing test — `src/components/LanguageSwitcher.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SUPPORTED_LOCALES } from '../i18n/config';

describe('LanguageSwitcher', () => {
  it('renders nothing while only one locale is configured', () => {
    // Guard: this test encodes the current single-locale behaviour.
    expect(SUPPORTED_LOCALES.length).toBe(1);
    const { container } = render(<LanguageSwitcher />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm test -- src/components/LanguageSwitcher.test.tsx`
Expected: FAIL — cannot resolve `./LanguageSwitcher`.

- [ ] **Step 3: `src/components/LanguageSwitcher.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, LOCALE_STORAGE_KEY } from '../i18n/config';

// Locale picker for the header. Returns null while only one locale exists, so it
// stays invisible today but needs no extra wiring when a second locale is added.
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  if (SUPPORTED_LOCALES.length <= 1) return null;

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  };

  return (
    <select
      className="market-input"
      aria-label={t('language.label')}
      value={i18n.resolvedLanguage}
      onChange={onChange}
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/LanguageSwitcher.test.tsx`
Expected: PASS (renders nothing).

- [ ] **Step 5: Render it in the `App` header**

In `src/App.tsx`, add the import:
```tsx
import { LanguageSwitcher } from './components/LanguageSwitcher';
```
Place it next to the theme toggle button:
```tsx
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LanguageSwitcher />
            <button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
```
(Replace the existing standalone `<button … theme-toggle-btn …>` element with the wrapper above. The aria-label/labels here are extracted in Task 5.)

- [ ] **Step 6: Verify build & all tests**

Run: `npm run build && npm test`
Expected: clean build, all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/LanguageSwitcher.tsx src/components/LanguageSwitcher.test.tsx src/App.tsx
git commit -m "feat(i18n): add LanguageSwitcher (hidden while single locale)"
```

---

## Task 5: Extract `common` strings (App, TabBar, Counter)

Parity rule applies. Use `const { t } = useTranslation();` (add the import where missing).

**Files:**
- Modify: `src/App.tsx`, `src/components/TabBar.tsx`, `src/components/Counter.tsx`

- [ ] **Step 1: `src/App.tsx` — use translations**

Add at the top:
```tsx
import { useTranslation } from 'react-i18next';
```
Inside `App()` add `const { t } = useTranslation();`. Apply these exact swaps:

- Header title/subtitle:
```tsx
              <h1>{t('header.title')}</h1>
              <p>{t('header.subtitle')}</p>
```
- Theme button (and its aria):
```tsx
            <button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label={t('theme.toggleAria')}>
              {theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
            </button>
```
- Footer:
```tsx
      <footer className="game-footer">
        {t('footer')}
      </footer>
```

- [ ] **Step 2: `src/components/TabBar.tsx` — translate industry names + Holdings tab**

Replace the body with:
```tsx
import { INDUSTRIES } from '../data/industries';
import { useActiveModule, useSwitchModule } from '../state/hooks';
import { useTranslation } from 'react-i18next';
import { industryLabel } from '../i18n/names';

// Industry tabs + the Holdings tab. Mirrors the legacy .module-nav / .nav-tab markup.
export function TabBar() {
  const active = useActiveModule();
  const switchTo = useSwitchModule();
  const { t } = useTranslation();
  return (
    <nav className="module-nav">
      <div className="nav-container">
        {INDUSTRIES.map((cfg) => (
          <button
            key={cfg.key}
            type="button"
            className={`nav-tab tab-${cfg.key}${active === cfg.key ? ' active' : ''}`}
            data-testid={`tab-${cfg.key}`}
            onClick={() => switchTo(cfg.key)}
          >
            {cfg.icon} {industryLabel(t, cfg)}
          </button>
        ))}
        <button
          type="button"
          className={`nav-tab${active === 'holdings' ? ' active' : ''}`}
          data-testid="tab-holdings"
          onClick={() => switchTo('holdings')}
        >
          {t('tabs.holdings')}
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: `src/components/Counter.tsx` — translate aria labels**

Add `import { useTranslation } from 'react-i18next';`. In `Counter`, add `const { t } = useTranslation();` and swap the three aria strings:
```tsx
        <button type="button" className="btn-counter" aria-label={t('counter.minusAria', { label })} onClick={() => onChange(clamp(value - 1))}>
          −
        </button>
        <input
          type="number"
          className="counter-input"
          aria-label={label}
          value={value}
          min={0}
          max={max}
          onChange={(e) => onChange(clamp(parseInt(e.target.value || '0', 10)))}
        />
        <button type="button" className="btn-counter" aria-label={t('counter.plusAria', { label })} onClick={() => onChange(clamp(value + 1))}>
          +
        </button>
```
Note: `label` is the (already-translated) prop passed by parents in Task 6/7; keep `aria-label={label}` on the input. The `CounterGroup` export keeps passing literal `"Companies"`/`"Workers"` — leave it, those literals are replaced at the real call sites which use `<Counter>` directly.

- [ ] **Step 4: Verify build & all tests**

Run: `npm run build && npm test`
Expected: clean build; tests PASS. The aria `'Companies plus'` / `'Companies minus'` still match because parents pass `label="Companies"` until Task 6, and EN `counter.plusAria` renders `"Companies plus"`.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/TabBar.tsx src/components/Counter.tsx
git commit -m "feat(i18n): localize app shell, tabs and counter aria"
```

---

## Task 6: Extract `industry` strings + tooltips (IndustryView side)

**Files:**
- Modify: `src/views/IndustryView/ModifiersPanel.tsx`, `PricesPanel.tsx`, `IndustryView.tsx`, `SummarySidebar.tsx`

- [ ] **Step 1: `ModifiersPanel.tsx`**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
```
Add `const { t } = useTranslation();` at the top of the component. Apply swaps (labels → `t('industry:modifiers.*')`, the existing hard-coded `title=` → `tip(t('tooltips:*'))`):

- Country group:
```tsx
        <label className="control-label">{t('industry:modifiers.country')}</label>
        <select className="market-input" style={{ width: '130px' }} value={mod.selectedCountryId} onChange={(e) => onSelectCountry(e.target.value)} {...tip(t('tooltips:country'))}>
          <option value="">{t('industry:modifiers.selectCountry')}</option>
```
- Region group:
```tsx
        <label className="control-label">{t('industry:modifiers.region')}</label>
        <select className="market-input" style={{ width: '130px' }} value={mod.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => onSelectRegion(e.target.value)} {...tip(t('tooltips:region'))}>
          <option value="">{t('industry:modifiers.selectRegion')}</option>
```
- Country Bonus:
```tsx
          <label className="control-label">{t('industry:modifiers.countryBonus')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '60px' }} value={mod.countryBonus} readOnly tabIndex={-1} {...tip(t('tooltips:countryBonus'))} />
```
- Region Bonus:
```tsx
          <label className="control-label">{t('industry:modifiers.regionBonus')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '60px' }} value={mod.regionBonus} readOnly tabIndex={-1} {...tip(t('tooltips:regionBonus'))} />
```
- Work Tax:
```tsx
          <label className="control-label">{t('industry:modifiers.workTax')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '55px' }} value={mod.workTaxRate} readOnly tabIndex={-1} {...tip(t('tooltips:workTax'))} />
```
- VAT:
```tsx
          <label className="control-label">{t('industry:modifiers.vat')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '55px' }} value={mod.vat} readOnly tabIndex={-1} {...tip(t('tooltips:vat'))} />
```
- Avg Salary:
```tsx
          <label className="control-label">{t('industry:modifiers.avgSalary')}</label>
          <input type="number" className="market-input readonly-display" style={{ width: '80px' }} value={mod.averageSalary} readOnly tabIndex={-1} {...tip(t('tooltips:avgSalary'))} />
```
- Offered CC:
```tsx
        <label className="control-label">{t('industry:modifiers.offeredCc')}</label>
        <input type="number" className="market-input" style={{ width: '65px' }} step="1" min="0" value={shared.offeredSalary}
          onChange={(e) => shared.setShared('offeredSalary', parseFloat(e.target.value || '0'))} {...tip(t('tooltips:offeredCc'))} />
```
- Tycoon + WAM toggles:
```tsx
        <label className="checkbox-label" aria-label={t('industry:modifiers.tycoonAria')} {...tip(t('tooltips:tycoon'))}>
          <input type="checkbox" checked={shared.hasTycoon} onChange={shared.toggleTycoon} />
          {t('industry:modifiers.tycoon')}
        </label>
        {isFw && (
          <label className="checkbox-label" aria-label={t('industry:modifiers.wamAria')} {...tip(t('tooltips:wam'))}>
            <input type="checkbox" checked={shared.wamEnabled} onChange={shared.toggleWam} />
            {t('industry:modifiers.wam')}
          </label>
        )}
```
- Sync button:
```tsx
      <button type="button" className={`btn btn-primary${syncing ? ' loading' : ''}`} style={{ marginLeft: 'auto', width: 'auto', padding: '6px 12px', height: '30px' }} onClick={onSyncPrices} disabled={syncing} {...tip(t('tooltips:syncPrices'))}>
        {syncing ? t('buttons.syncing') : t('buttons.syncLivePrices')}
      </button>
```

- [ ] **Step 2: `PricesPanel.tsx`**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
import { industryRm } from '../../i18n/names';
```
Add `const { t } = useTranslation();`. Swaps:
- Card header:
```tsx
        <h2>{t('industry:prices.header', { label: cfg.label })}</h2>
```
- Product price group (label + tooltip on input):
```tsx
              <label className="price-inline-label">{t('industry:prices.qLabel', { q })}</label>
              <input
                type="number"
                className="food-price-input"
                step="0.01"
                min="0"
                value={mod.prices[q] ?? 0}
                onChange={(e) => setPrice(cfg.key, q, parseFloat(e.target.value || '0'))}
                {...tip(t('tooltips:productPrice'))}
              />
```
- RM price group:
```tsx
            <label className="price-inline-label">{industryRm(t, cfg)}</label>
            <input
              type="number"
              className="food-price-input"
              step="0.01"
              min="0"
              value={rmPriceValue}
              onChange={(e) => shared.setShared(cfg.rmPriceKey, parseFloat(e.target.value || '0'))}
              {...tip(t('tooltips:rmPrice'))}
            />
```
Note: `cfg.label` in the header could also use `industryLabel(t, cfg)`; keep `cfg.label` here to match the catalog header which already interpolates the canonical label (parity-identical in EN).

- [ ] **Step 3: `IndustryView.tsx` — table headers, output suffix, card headers**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
import { industryLabel, industryRm } from '../../i18n/names';
```
Add `const { t } = useTranslation();` near the other hooks. Swaps:

- Factories card header:
```tsx
              <h2>{t('industry:tables.factoriesHeader', { label: industryLabel(t, cfg) })}</h2>
```
- Factories table header row (add `tip` per column):
```tsx
                  <tr>
                    <th style={{ width: '180px' }} {...tip(t('tooltips:colQuality'))}>{t('industry:tables.headers.quality')}</th>
                    <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colCompanies'))}>{t('industry:tables.headers.companies')}</th>
                    <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colWorkers'))}>{t('industry:tables.headers.workers')}</th>
                    <th className="align-right" {...tip(t('tooltips:colOutput'))}>{t('industry:tables.headers.output')}</th>
                    <th className="align-right" {...tip(t('tooltips:colNetProfit'))}>{t('industry:tables.headers.netProfit')}</th>
                  </tr>
```
- Factory Companies/Workers counters — pass translated labels:
```tsx
                          <Counter
                            label={t('labels.companies')}
                            value={cell.companies || 0}
                            max={9999}
                            hideLabel
                            onChange={(v) => setCell(industryKey, 'factory', def.quality, 'companies', v)}
                          />
```
```tsx
                          <Counter
                            label={t('labels.workers')}
                            value={cell.workers || 0}
                            max={maxWorkers}
                            hideLabel
                            onChange={(v) => setCell(industryKey, 'factory', def.quality, 'workers', v)}
                          />
```
- Factory output cell:
```tsx
                        <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                          {t('industry:tables.outputSession', { value: num(singleOutput) })}
                        </td>
```
- Factory net-profit cell (keep the `—` / `CC` formatting; add tooltip):
```tsx
                        <td className={`align-right ${companies === 0 ? 'text-muted' : factoryNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                          {companies === 0 ? '—' : `${factoryNetProfit >= 0 ? '+' : ''}${num(factoryNetProfit)} CC`}
                        </td>
```
- RM card header:
```tsx
              <h2>{t('industry:tables.rmHeader', { rm: industryRm(t, cfg) })}</h2>
```
- RM table header row: identical to the factories header row above (same five `tip`+`t` headers — repeat it verbatim).
- RM Companies/Workers counters — same translated-label pattern as the factory counters (use `t('labels.companies')` / `t('labels.workers')`).
- RM output cell:
```tsx
                        <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                          {t('industry:tables.outputSessionRm', { value: num(singleOutput), rm: industryRm(t, cfg) })}
                        </td>
```
- RM net-profit cell:
```tsx
                        <td className={`align-right ${companies === 0 ? 'text-muted' : plantNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                          {companies === 0 ? '—' : `${plantNetProfit >= 0 ? '+' : ''}${num(plantNetProfit)} CC`}
                        </td>
```

- [ ] **Step 4: `SummarySidebar.tsx`**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { tip } from '../../components/tooltip';
```
Change the `recommendation` helper to take `t` (so its strings come from the catalog):
```tsx
function recommendation(t: TFunction, a: number, b: number, rm: string): string {
  if (a > b) return t('industry:summary.recommendA', { rm, delta: (a - b).toFixed(2) });
  if (b > a) return t('industry:summary.recommendB', { delta: (b - a).toFixed(2) });
  return t('industry:summary.recommendEqual');
}
```
In `SummarySidebar`, add `const { t } = useTranslation();`. Swaps:

- Header + badge:
```tsx
        <h2>{t('industry:summary.title')}</h2>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 4, color: 'white', textTransform: 'uppercase', background: v.producing ? 'var(--erep-gold)' : 'var(--erep-blue)' }} {...tip(t('tooltips:strategyBadge'))}>
          {v.producing ? t('industry:summary.optionBBadge') : t('industry:summary.optionABadge')}
        </span>
```
- KPI rows (label → `t`, tooltip on the row container):
```tsx
          <div className="kpi-block" {...tip(t('tooltips:sumNetProfit'))}>
            <span className="kpi-label">{t('industry:summary.netProfit')}</span>
            <span className={`kpi-value ${v.companies === 0 ? 'text-muted' : v.net >= 0 ? 'text-success' : 'text-danger'}`} data-testid="total-net-profit">{cc(v.net)}</span>
          </div>
          <hr className="kpi-divider" />
          <div className="kpi-block-inline" {...tip(t('tooltips:sumTotalCompanies'))}>
            <span className="kpi-label">{t('industry:summary.totalCompanies')}</span>
            <span className="kpi-value-small" data-testid="total-factories-count">{v.companies}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumOutput'))}>
            <span className="kpi-label">{t('industry:summary.output', { label: cfg.label })}</span>
            <span className="kpi-value-small" data-testid="total-output">{num(v.output)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumRmConsumed'))}>
            <span className="kpi-label">{t('industry:summary.rmConsumed', { rm })}</span>
            <span className="kpi-value-small" data-testid="total-rm-required">{num(v.rmUsed)} {rm}</span>
          </div>
          <hr className="kpi-divider" />
          <div className="kpi-block-inline" {...tip(t('tooltips:sumRevenue'))}>
            <span className="kpi-label">{t('industry:summary.revenue')}</span>
            <span className={`kpi-value-small ${v.revenue === 0 ? 'text-muted' : 'kpi-blue'}`} data-testid="total-gross-revenue">{cc(v.revenue)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumRmCost'))}>
            <span className="kpi-label">{t('industry:summary.rmCost', { rm })}</span>
            <span className={`kpi-value-small ${v.rmCost === 0 ? 'text-muted' : v.rmCost < 0 ? 'text-success' : 'kpi-gold'}`} data-testid="total-rm-cost">{cc(v.rmCost)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumGrossProfit'))}>
            <span className="kpi-label">{t('industry:summary.grossProfit')}</span>
            <span className={`kpi-value-small ${grossProfit === 0 ? 'text-muted' : grossProfit >= 0 ? 'text-success' : 'text-danger'}`} data-testid="total-gross-profit">{cc(grossProfit)}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumWorkTax'))}>
            <span className="kpi-label">{t('industry:summary.workTax')}</span>
            <span className={`kpi-value-small ${v.workTax === 0 ? 'text-muted' : 'kpi-red'}`} data-testid="total-work-tax">{v.workTax === 0 ? cc(0) : `-${cc(v.workTax)}`}</span>
          </div>
          <div className="kpi-block-inline" {...tip(t('tooltips:sumSalary'))}>
            <span className="kpi-label">{t('industry:summary.salary')}</span>
            <span className={`kpi-value-small ${v.salary === 0 ? 'text-muted' : 'kpi-red'}`} data-testid="total-salary">{v.salary === 0 ? cc(0) : `-${cc(v.salary)}`}</span>
          </div>
```
Note: `summary.output` interpolates `cfg.label` and `rmConsumed/rmCost` interpolate `rm` (= `cfg.rmName`). Keep using `cfg.label` / `rm` here (parity-identical in EN; these match the existing `{cfg.label} Output` / `{rm} Consumed`).

- Inventory breakdown:
```tsx
          <h3 className="details-title">{t('industry:summary.breakdownTitle')}</h3>
          <ul className="breakdown-list" data-testid="breakdown-list">
            {v.breakdown.length === 0 ? (
              <li className="info-text" style={{ textAlign: 'center', fontStyle: 'italic' }}>{t('industry:summary.noFactories')}</li>
            ) : (
              v.breakdown.map((b) => (
                <li className="breakdown-item" key={b.quality}>
                  <span className="breakdown-label">{t('industry:summary.breakdownItem', { q: b.quality, companies: b.companies, workers: b.workers })}</span>
```
- Strategy comparison block:
```tsx
          <h3 className="details-title">{t('industry:summary.comparisonTitle', { rm })}</h3>
          <div className="kpi-block-inline" style={{ marginBottom: 4 }}>
            <span className="kpi-label">{t('industry:summary.rmProduced', { rm })}</span>
            <span className="kpi-value-small kpi-gold">{v.rmProduced.toFixed(2)} {rm}</span>
          </div>
          <div className="kpi-block-inline" style={{ marginBottom: 10 }}>
            <span className="kpi-label">{t('industry:summary.rmNetBalance', { rm })}</span>
            <span className={`kpi-value-small ${v.netBalance >= 0 ? 'text-success' : 'text-danger'}`} data-testid="rm-net-balance">
              {v.netBalance >= 0 ? '+' : ''}{v.netBalance.toFixed(2)} {rm}
            </span>
          </div>
          <div className="strategy-card-wrapper">
            <div className="strategy-option-card" data-testid="strategy-buy-card" {...tip(t('tooltips:optionA'))} style={buyHighlight ? { borderColor: 'var(--erep-green)', background: 'rgba(122,183,0,0.05)' } : undefined}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t('industry:summary.optionABuyTitle', { rm })}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>{t('industry:summary.optionAMarketCost', { cost: v.optionABuy.toFixed(2) })}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{t('industry:summary.netProfitInline')} <span className={v.optionANet >= 0 ? 'text-success' : 'text-danger'}>{cc(v.optionANet)}</span></div>
            </div>
            <div className="strategy-option-card" data-testid="strategy-produce-card" {...tip(t('tooltips:optionB'))} style={produceHighlight ? { borderColor: 'var(--erep-green)', background: 'rgba(122,183,0,0.05)' } : undefined}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t('industry:summary.optionBProduceTitle', { rm })}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>{t('industry:summary.optionBBalance', { balance: v.netBalance.toFixed(2), rm })}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{t('industry:summary.netProfitInline')} <span className={v.optionBNet >= 0 ? 'text-success' : 'text-danger'}>{cc(v.optionBNet)}</span></div>
            </div>
          </div>
          <div data-testid="strategy-recommendation" style={{ marginTop: 10, fontSize: 11, fontWeight: 700, padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-header)' }}>
            {recommendation(t, v.optionANet, v.optionBNet, rm)}
          </div>
```

- [ ] **Step 5: Verify build & all tests**

Run: `npm run build && npm test`
Expected: clean build; `IndustryView.test` and others PASS (EN text identical). If a test fails on text, diff the catalog value against the original string — fix the catalog, not the test.

- [ ] **Step 6: Commit**

```bash
git add src/views/IndustryView
git commit -m "feat(i18n): localize IndustryView panels + add field tooltips"
```

---

## Task 7: Extract `holdings` strings + tooltips

**Files:**
- Modify: `src/views/HoldingsView/HoldingToolbar.tsx`, `HoldingLocationBar.tsx`, `HoldingSummary.tsx`, `HoldingSection.tsx`

- [ ] **Step 1: `HoldingToolbar.tsx`**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
```
Add `const { t } = useTranslation();`. Swaps — prompts/confirms first:
```tsx
  const onNew = () => {
    const name = window.prompt(t('holdings:toolbar.newPrompt'), t('holdings:toolbar.newDefault', { n: holdings.length + 1 }));
    if (name && name.trim()) api.create(name.trim());
  };
  const onRename = () => {
    if (!activeHolding) return;
    const name = window.prompt(t('holdings:toolbar.renamePrompt'), activeHolding.name);
    if (name && name.trim()) api.rename(activeHolding.id, name.trim());
  };
  const onDelete = () => {
    if (!activeHolding) return;
    if (window.confirm(t('holdings:toolbar.deleteConfirm', { name: activeHolding.name }))) api.remove(activeHolding.id);
  };
  const onClear = () => {
    if (!activeHolding) return;
    if (window.confirm(t('holdings:toolbar.clearConfirm'))) {
      api.clearCompanies(activeHolding.id);
    }
  };
```
Then the markup:
```tsx
        <label className="control-label" htmlFor="hld-select">{t('holdings:toolbar.holding')}</label>
        <select
          id="hld-select"
          className="market-input"
          data-testid="hld-picker"
          value={activeHoldingId}
          disabled={holdings.length === 0}
          onChange={(e) => api.switchTo(e.target.value)}
          {...tip(t('tooltips:hldPicker'))}
        >
          {holdings.length === 0 && <option value="">{t('holdings:toolbar.none')}</option>}
          {holdings.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>
      <div className="holdings-actions">
        <button type="button" className="btn btn-primary" onClick={onNew}>{t('holdings:toolbar.new')}</button>
        <button type="button" className="btn btn-secondary" onClick={onRename} disabled={!activeHolding}>{t('holdings:toolbar.rename')}</button>
        <button type="button" className="btn btn-secondary" onClick={onDelete} disabled={!activeHolding}>{t('holdings:toolbar.delete')}</button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={!activeHolding}>{t('holdings:toolbar.clearCompanies')}</button>
      </div>
```

- [ ] **Step 2: `HoldingLocationBar.tsx`**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
```
Add `const { t } = useTranslation();`. Replace the `status` computation:
```tsx
  const status = holding.selectedCountryId && holding.selectedRegionPermalink
    ? t('holdings:location.statusSynced')
    : holding.selectedCountryId
      ? t('holdings:location.statusNoRegion')
      : t('holdings:location.statusNotConfigured');
```
Markup swaps:
```tsx
          <label className="control-label">{t('holdings:location.country')}</label>
          <select className="market-input" value={holding.selectedCountryId} onChange={(e) => sync.selectCountry(holding.id, e.target.value)} {...tip(t('tooltips:hldCountry'))}>
            <option value="">{t('holdings:location.selectCountry')}</option>
            {countryEntries.map(([id, c]) => (<option key={id} value={id}>{c.name}</option>))}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">{t('holdings:location.region')}</label>
          <select className="market-input" value={holding.selectedRegionPermalink} disabled={!selectedCountry} onChange={(e) => sync.selectRegion(holding.id, e.target.value)} {...tip(t('tooltips:hldRegion'))}>
            <option value="">{t('holdings:location.selectRegion')}</option>
            {regionEntries.map(([id, r]) => (<option key={id} value={r.permalink}>{r.name}</option>))}
          </select>
        </div>
        <div className="holdings-sync-col">
          <span className="sync-status text-muted" {...tip(t('tooltips:hldStatus'))}>{status}</span>
          <button type="button" className={`btn btn-primary${syncing ? ' loading' : ''}`} onClick={onSyncPrices} disabled={syncing} {...tip(t('tooltips:syncPrices'))}>
            {syncing ? t('buttons.syncing') : t('buttons.syncLivePrices')}
          </button>
        </div>
```

- [ ] **Step 3: `HoldingSummary.tsx`**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
import { industryLabel } from '../../i18n/names';
```
Add `const { t } = useTranslation();`. Swaps:
```tsx
        <div className="card-header"><h2>{t('holdings:summary.title')}</h2></div>
        <div className="card-body">
          <div className="kpi-list">
            <div className="kpi-block" {...tip(t('tooltips:hldNetProfit'))}>
              <span className="kpi-label">{t('holdings:summary.netProfit')}</span>
              <span className={sum.net >= 0 ? 'kpi-value text-success' : 'kpi-value text-danger'} data-testid="hld-net-profit">{cc(sum.net)}</span>
            </div>
            <div className="kpi-block-inline" {...tip(t('tooltips:sumTotalCompanies'))}>
              <span className="kpi-label">{t('holdings:summary.totalCompanies')}</span>
              <span className="kpi-value-small" data-testid="hld-total-companies">{sum.companies}</span>
            </div>
            <div className="kpi-block" {...tip(t('tooltips:hldRevenue'))}><span className="kpi-label">{t('holdings:summary.revenue')}</span><span className="kpi-value kpi-blue" data-testid="hld-revenue">{cc(sum.revenue)}</span></div>
            <div className="kpi-block" {...tip(t('tooltips:hldRmNet'))}><span className="kpi-label">{t('holdings:summary.rmNet')}</span><span className={sum.rmNetCost <= 0 ? 'kpi-value text-success' : 'kpi-value kpi-gold'} data-testid="hld-rm-net">{cc(sum.rmNetCost)}</span></div>
            <div className="kpi-block" {...tip(t('tooltips:hldWorkTax'))}><span className="kpi-label">{t('holdings:summary.workTax')}</span><span className="kpi-value kpi-red" data-testid="hld-work-tax">-{cc(sum.workTax)}</span></div>
            <div className="kpi-block" {...tip(t('tooltips:hldSalary'))}><span className="kpi-label">{t('holdings:summary.salaries')}</span><span className="kpi-value kpi-red" data-testid="hld-salary">-{cc(sum.salary)}</span></div>
          </div>
          <hr className="section-divider" />
          <div className="summary-details">
            <h3 className="details-title">{t('holdings:summary.perIndustry')}</h3>
            <ul className="breakdown-list" data-testid="hld-breakdown">
              {rows.length === 0 ? (
                <li className="info-text">{t('holdings:summary.empty')}</li>
              ) : (
                rows.map((p) => {
                  const cfg = INDUSTRIES.find((c) => c.key === p.key)!;
                  return (
                    <li className="breakdown-item" key={p.key}>
                      <span className="breakdown-label">{t('holdings:summary.breakdownItem', { icon: cfg.icon, label: industryLabel(t, cfg), companies: p.companies })}</span>
```
Note: the original breakdown used `p.label`; `industryLabel(t, cfg)` resolves to the same EN value (`cfg.label`). If `p.label` and `cfg.label` could differ, keep `label: p.label` instead to preserve exact parity. Verify against `useHoldingSummary`; default to `p.label` if unsure.

- [ ] **Step 4: `HoldingSection.tsx` — section head + tables**

Add imports:
```tsx
import { useTranslation } from 'react-i18next';
import { tip } from '../../components/tooltip';
import { industryLabel, industryRm } from '../../i18n/names';
```
Add `const { t } = useTranslation();`. Swaps:

- Section head modifiers line:
```tsx
        <span className="hld-ind-name">{industryLabel(t, cfg)}</span>
        <span className="hld-ind-mods">{t('holdings:section.mods', { country: ind.countryBonus, region: ind.regionBonus, pollution: poll(1).toFixed(2) })}</span>
```
- Factories sub-card header:
```tsx
              <h2 style={{ fontSize: 11 }}>{t('industry:tables.factoriesHeaderShort', { label: industryLabel(t, cfg) })}</h2>
```
- Both table header rows (factories + RM) — use the same five `tip`+`t` headers as Task 6 Step 3:
```tsx
                <tr>
                  <th style={{ width: '180px' }} {...tip(t('tooltips:colQuality'))}>{t('industry:tables.headers.quality')}</th>
                  <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colCompanies'))}>{t('industry:tables.headers.companies')}</th>
                  <th className="align-center" style={{ width: '120px' }} {...tip(t('tooltips:colWorkers'))}>{t('industry:tables.headers.workers')}</th>
                  <th className="align-right" {...tip(t('tooltips:colOutput'))}>{t('industry:tables.headers.output')}</th>
                  <th className="align-right" {...tip(t('tooltips:colNetProfit'))}>{t('industry:tables.headers.netProfit')}</th>
                </tr>
```
- Counters — translated labels (both tables, companies & workers):
```tsx
                          label={t('labels.companies')}
```
```tsx
                          label={t('labels.workers')}
```
- Factory output cell:
```tsx
                      <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                        {t('industry:tables.outputSession', { value: num(singleOutput) })}
                      </td>
```
- Factory net-profit cell:
```tsx
                      <td className={`align-right ${factoryNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                        {factoryNetProfit >= 0 ? '+' : ''}{num(factoryNetProfit)} CC
                      </td>
```
- RM sub-card header:
```tsx
              <h2 style={{ fontSize: 11 }}>{t('industry:tables.rmHeaderShort', { rm: industryRm(t, cfg) })}</h2>
```
- RM output cell:
```tsx
                      <td className="align-right" style={{ color: 'var(--erep-blue)', fontWeight: 600 }} {...tip(t('tooltips:colOutput'))}>
                        {t('industry:tables.outputSessionRm', { value: num(singleOutput), rm: industryRm(t, cfg) })}
                      </td>
```
- RM net-profit cell:
```tsx
                      <td className={`align-right ${plantNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }} {...tip(t('tooltips:colNetProfit'))}>
                        {plantNetProfit >= 0 ? '+' : ''}{num(plantNetProfit)} CC
                      </td>
```

- [ ] **Step 5: Verify build & all tests**

Run: `npm run build && npm test`
Expected: clean build; `HoldingsView.test` and all others PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/HoldingsView
git commit -m "feat(i18n): localize HoldingsView + add field tooltips"
```

---

## Task 8: i18n key-coverage test

**Files:**
- Create: `src/i18n/i18n.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import i18n, { resources } from './index';

describe('i18n catalog', () => {
  it('registers all four namespaces for English', () => {
    expect(Object.keys(resources.en).sort()).toEqual(
      ['common', 'holdings', 'industry', 'tooltips'],
    );
  });

  it('resolves representative keys to real (non-key) strings', () => {
    const keys = [
      'common:header.title',
      'common:buttons.syncLivePrices',
      'industry:summary.netProfit',
      'industry:tables.headers.quality',
      'holdings:summary.title',
      'tooltips:offeredCc',
    ];
    for (const k of keys) {
      const value = i18n.t(k);
      expect(value, k).not.toBe(k);
      expect(value.length, k).toBeGreaterThan(0);
    }
  });

  it('interpolates dynamic values', () => {
    expect(i18n.t('industry:tables.outputSession', { value: '12.50' })).toBe('12.50 / session');
    expect(i18n.t('holdings:toolbar.deleteConfirm', { name: 'Alpha' })).toBe('Delete holding "Alpha"?');
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- src/i18n/i18n.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/i18n.test.ts
git commit -m "test(i18n): assert namespaces load and keys resolve"
```

---

## Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full build + test suite**

Run: `npm run build && npm test`
Expected: `tsc --noEmit` clean, `vite build` succeeds, **all** suites green (calc golden parity, state, components, views, i18n).

- [ ] **Step 2: Manual smoke check**

Run `npm run dev` (and `node server.js` if not auto-started). In the browser:
- Hover the modifier inputs, price inputs, table headers, output/profit cells, and every Summary KPI row → a themed tooltip appears with the expected text.
- Toggle dark mode → tooltip colours follow the theme.
- Visit each industry tab and the Holdings tab → no raw `t()` keys (e.g. `industry:summary.netProfit`) leak into the UI; all visible text reads exactly as before.
- Confirm the language switcher is **not** visible (single locale).

- [ ] **Step 3: Commit (if any manual fixes were needed)**

```bash
git add -A
git commit -m "fix(i18n): polish tooltip copy / parity after manual smoke check"
```

---

## Self-Review notes (author)

- **Spec coverage:** infra (T2), tooltips via react-tooltip (T3), language switcher hidden at 1 locale (T4), full-UI extraction across all listed components (T5–T7), prompts/confirms translated (T7), industry/RM names via defaultValue helper (T2 `names.ts`), parity guard via existing tests + key-coverage test (T8), final verification (T9). All spec sections map to a task.
- **Parity risk:** `HoldingSummary` breakdown originally uses `p.label`; the plan flags using `p.label` if it can differ from `cfg.label`. Verify during T7.
- **Type note:** `names.ts` casts the dynamic key to `never` because `industry:names.*` is intentionally not in the typed EN resources (defaultValue supplies EN).
