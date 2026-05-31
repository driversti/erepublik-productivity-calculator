# i18n Localization + Field Tooltips — Design

**Date:** 2026-05-31
**Status:** Approved (brainstorming)

## Goal

Make the entire UI translatable and add hover tooltips (`title=`) to every input
and output field that explain what each piece of data means. The work starts the
calculator on a path to full multi-language support; this first increment ships
**English only** but extracts all user-facing strings into a translation catalog
so additional languages drop in later without touching components.

## Decisions (locked during brainstorming)

| Question | Decision |
|----------|----------|
| Tooltip mechanism | **Custom tooltip via `react-tooltip` (v5)** — themed, instant, one global instance |
| Coverage | All fields everywhere — both `IndustryView` and `HoldingsView` |
| i18n scope | **Whole UI** (labels, buttons, headers, KPIs, tabs) **+ tooltips** |
| Languages at launch | **English only** — build infra, extract strings; add locales later |
| Implementation | **`react-i18next`** |
| Namespaces | `common` / `industry` / `holdings` / `tooltips` |
| Language switcher | Built, but **hidden while only one locale is configured** |
| `window.prompt`/`confirm` text | **Translated** too |

> **Dependency note (explicit exception):** `i18next` + `react-i18next` +
> `react-tooltip` are new production dependencies. The project's `CLAUDE.md` asks
> to keep dependencies minimal (React + Vite + Vitest + Testing Library only
> "unless explicitly asked"). The user explicitly chose `react-i18next` for i18n
> and a tooltip library for the hints (leaving the specific pick to us →
> `react-tooltip`), which satisfies that exception. Recorded here so the
> deviation is intentional and traceable.

## Architecture

New dependencies (production): `i18next`, `react-i18next`, `react-tooltip`.

```
src/i18n/
├── index.ts             # synchronous i18next init (resources passed inline)
├── config.ts            # SUPPORTED_LOCALES, defaultLocale, LOCALE_STORAGE_KEY
├── locales/
│   └── en/
│       ├── common.json      # header, footer, tabs, generic buttons, sync statuses
│       ├── industry.json    # tables, modifiers, prices, summary KPIs, strategy
│       ├── holdings.json     # toolbar, location bar, summary, sections, prompts
│       └── tooltips.json     # every tooltip string
└── i18next.d.ts         # module augmentation → typed t() keys under TS strict

src/components/
├── AppTooltip.tsx       # mounts the single global <Tooltip id> (themed)
└── tooltip.ts           # TIP_ID + tip(content) helper → data-attribute object
```

### Initialization model

- **Synchronous, no Suspense.** `resources` are imported JSON passed inline to
  `i18next.init({ resources, react: { useSuspense: false } })`. There is no HTTP
  backend and no async load, so translated text is present on first render — no
  key flash, and tests render immediately.
- **Global instance via `initReactI18next`.** Components call `useTranslation()`
  and resolve against the default i18next instance — **no `<I18nextProvider>`
  wrapper is required**. `import './i18n'` is done once in `main.tsx` (and in
  `src/test/setup.ts` for tests).
- **Locale persistence:** stored in `localStorage` under `erep_locale`. Default
  and fallback language is `en`. Changing locale calls `i18n.changeLanguage(...)`
  and writes the key. (Mirrors the existing `theme` persistence pattern in
  `App.tsx`; kept independent of the app-state reducer, like `theme`.)

### Key naming convention

Namespace separated by `:`, dotted path within:

```
common:header.title
common:tabs.holdings
industry:tables.headers.companies
industry:summary.netProfit.label
industry:summary.netProfit.tip
industry:names.food.label
industry:names.food.rm
tooltips:workTax
```

- Output/KPI rows that carry both a label and a hover hint use a `.label` /
  `.tip` pair (the `.tip` resolves the `title=`), or a `tooltips:*` key where the
  element has no visible label.
- Dynamic values use interpolation, e.g.
  `t('industry:summary.rmConsumed', { rm })`,
  `t('industry:tables.outputSession')`,
  and the strategy recommendation strings interpolate the CC delta and RM name.

## Tooltips (`react-tooltip`) placement

One global `<AppTooltip />` (wrapping react-tooltip's `<Tooltip id={TIP_ID} />`)
is mounted once in `App`. Any element opts in by spreading the `tip(content)`
helper, which returns `{ 'data-tooltip-id': TIP_ID, 'data-tooltip-content':
content }`. Content comes from `t('tooltips:...')`. Default placement `top`,
react-tooltip handles edge collision/flipping; themed to match dark/light via the
app's CSS variables (react-tooltip v5 `className` + CSS-var overrides).

- **KPI rows** (`SummarySidebar`, `HoldingSummary`): `tip(...)` on the row
  container (`.kpi-block-inline` / `.kpi-block`) so the hint appears on hover
  anywhere in the row.
- **Tables** (`IndustryView`, `HoldingSection`): `tip(...)` on each `<th>` to
  explain the column, plus on the Output/Session and Daily Net Profit cells, and
  on the counter `<input>`s.
- **Modifier/price inputs, selects, checkboxes, buttons:** `tip(...)` directly.
  The existing hard-coded English `title=` strings in `ModifiersPanel` are
  removed and replaced with `tip(t('tooltips:...'))`.

## Industry / RM names

`cfg.label` and `cfg.rmName` in `data/industries.ts` stay as the canonical
English fallback — the data layer is **not** modified (keeps `calc/` golden
tests untouched). Display sites resolve names via
`t('industry:names.${cfg.key}.label', { defaultValue: cfg.label })` and the RM
equivalent. The `defaultValue` guarantees parity even before a name key exists.

## Language switcher

`<LanguageSwitcher>` rendered in the header next to the theme toggle, but it
returns `null` when `SUPPORTED_LOCALES.length <= 1`. With English-only it is
invisible; the wiring (read current locale, list options, `changeLanguage`,
persist) is implemented and exercised so adding a second locale needs no new
plumbing.

## Parity guarantee & testing

- **EN catalog values must be byte-for-byte identical to the current strings.**
  The migration is a pure extraction; rendered text must not change.
- Existing component tests are the parity guards — they assert exact text and
  aria labels (e.g. `/Work as Manager/i`, aria `'Companies plus'`, testid row
  text). They stay green only if extraction preserves the English exactly.
- `src/test/setup.ts` adds `import '../i18n';` so i18next is initialized for
  every test with no change to the existing `render(<StateProvider>…)` calls.
- `calc/` golden-parity tests are untouched (pure math, no strings).
- New `src/i18n/i18n.test.ts`: asserts (a) every namespace loads, and (b) a
  representative set of used keys resolves to a non-key string in `en` — guards
  against orphaned/missing keys.
- **react-tooltip is hover-activated and renders into a portal**, so it does not
  affect existing assertions (they target visible labels/values, not tooltip
  bubbles). The global `<AppTooltip />` lives in `App`; component tests that
  render sub-views without `App` simply have inert `data-tooltip-*` attributes —
  harmless. No test needs to open a tooltip; the `tip()` helper's output can be
  unit-tested directly if desired.

## Components touched (string extraction)

`App` (also mounts `<AppTooltip />` + renders `<LanguageSwitcher />`), `TabBar`,
`Counter` (aria labels), `ModifiersPanel`, `PricesPanel`, `IndustryView` (table
headers, "/ session", empty states, card headers), `SummarySidebar`,
`HoldingToolbar` (incl. `window.prompt` / `window.confirm` text),
`HoldingLocationBar` (sync statuses), `HoldingSummary`, `HoldingSection`.

New files: `src/components/AppTooltip.tsx`, `src/components/tooltip.ts`,
`src/components/LanguageSwitcher.tsx`, plus the `src/i18n/` tree.

Estimated ~150–180 keys including tooltips.

## Out of scope

- Locales beyond English (infra is ready; catalogs are added later).
- Pluralization rules beyond what i18next provides out of the box (no plural
  forms are needed for the current English strings).
- Number/currency locale formatting — currency stays `.toFixed(2)` CC as today;
  revisited only when a non-English locale is added.
- Translating game data sourced from the live API (region/country names from
  `travelData.js` remain as provided by the game).
