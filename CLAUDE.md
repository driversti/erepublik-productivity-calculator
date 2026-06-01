# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

eRepublik **Productivity / Profit Calculator** — a single-page web app that estimates daily profit across four industries (food, weapons, houses, aircraft) plus a multi-industry **Holdings** mode. Built with **Vite + React 19 + TypeScript**. Calculation runs entirely client-side; the bundled Node server serves the production build and proxies game requests around CORS.

> Migrated from a zero-build vanilla-JS app to React (Nov 2025). The original
> philosophy of "no build step, no dependencies" was intentionally dropped — see
> `docs/superpowers/specs/2026-05-30-react-migration-design.md` for the rationale
> and `docs/superpowers/plans/2026-05-30-react-migration.md` for the task plan.

## Run

```bash
npm install
npm run dev               # Vite (HMR) on :5173; auto-spawns server.js on :8080, proxies /proxy → 8080
npm run build             # tsc --noEmit && vite build → dist/
npm run serve             # node server.js — serves dist/ + /proxy on :8080 (production)
npm test                  # vitest run: calc golden-parity, state, components, views, i18n
npm run test:watch        # vitest watch mode
npx vitest run src/calc/golden.test.ts   # run a single test file
```

**Dev:** just `npm run dev`. A `vite.config.ts` plugin (`proxyServerPlugin`) boots
`server.js` on :8080 for you and tears it down on exit — it skips spawning if
something is already listening on 8080, so a manually started server is reused.
**Production:** `npm run build`, then `npm run serve` (or `node server.js`) serves
`dist/`. All live data fetches go through `/proxy` to bypass CORS.

## Architecture

The app is a single React tree under `src/`, with a strict separation between
**pure profit math** (no DOM, no React) and the UI that renders it.

```
src/
├── main.tsx, App.tsx          # bootstrap + tab router (industry tabs + Holdings)
├── data/                      # static game facts (typed)
│   ├── industries.ts          # factory/plantation/RM arrays + IndustryConfig per industry
│   ├── buildingIds.ts         # CDN icon ids
│   └── travel.ts              # re-exports `countries` from countries.json (region identity lives in regionResources.ts + live /api/universe)
├── calc/                      # PURE math — the heart; golden-parity locked
│   ├── rounding.ts            # roundNumber, gameRawProduction, productivityMultiplier, pollutionAt
│   ├── industry.ts            # computeFwIndustry, computeHiredIndustry
│   ├── strategy.ts            # computeIndustryView (food/weapons buy-vs-produce)
│   ├── hiredView.ts           # computeHiredView (houses/aircraft tab)
│   ├── holding.ts             # sumHolding
│   └── __fixtures__/golden-snapshot.json   # frozen legacy output (parity guard)
├── state/                     # one reducer + Context, reached only via facade hooks
│   ├── types.ts, blank.ts     # AppState shape + initialState/blank builders
│   ├── reducer.ts             # pure discriminated-union reducer
│   ├── persistence.ts         # localStorage load/migrate/save (key v11)
│   ├── StateContext.tsx       # StateProvider (useReducer + persist effect)
│   └── hooks.ts               # domain facade hooks (components never touch dispatch directly)
├── services/                  # live data via /proxy (pure parsers + thin fetchers)
│   ├── proxy.ts, livePrices.ts, regions.ts
├── i18n/                      # react-i18next: synchronous init, bundled JSON catalogs
│   ├── index.ts, config.ts    # global instance + SUPPORTED_LOCALES/loadLocale
│   ├── names.ts               # localized country/region/industry name helpers
│   └── locales/en/*.json      # 4 namespaces: common, industry, holdings, tooltips
├── components/                # shared: Counter, IconImage, StarRating, TabBar, LanguageSwitcher, AppTooltip
└── views/
    ├── IndustryView/          # one industry tab (Summary, Modifiers, Prices, grids)
    └── HoldingsView/          # holdings (toolbar, location bar, per-industry sections, summary)
```

`server.js` is an ESM (`type: module`) ~160-line `http` server: serves `dist/`,
plus a `/proxy?url=…` GET endpoint allowlisted to `www.erepublik.com` and
`service.erepublik.tools` over https only. Port is `process.env.PORT || 8080`.
Styles live in `styles/` (a per-concern split imported via
`styles/index.css` from `main.tsx`).

### State & module model

`state.activeModule` is one of `food | weapons | houses | aircraft | holdings`.
Food/weapons are **fw** modules (owner Work-as-Manager + plantations); houses/
aircraft are **hired** modules (hired workers only, no WAM, work tax always 0).
The reducer is pure and immutable; **components dispatch only through the facade
hooks** in `state/hooks.ts` (`useIndustryView`, `useHiredView`, `useHoldings`,
`useIndustrySync`, …) — this keeps a future store swap (e.g. Zustand) to one file.
Persistence uses `localStorage` key `erep_calculator_food_factories_v11`; the
loader migrates older shapes. Bump the version suffix on breaking state-shape
changes.

Game constants live in `data/industries.ts`. **`baseRM` on factories is in
marketplace units** (1 FRM unit = 100 individual grain); raw-material companies
store `baseOutput` in individual units (÷100 → marketplace units).

### The core formula (game mechanics)

Per building, in `calc/`:

```
multiplier = max(0, 1 + countryBonus/100 + regionBonus/100 + (tycoon ? 0.2 : 0) − pollution/100)
output  = baseOutput × multiplier × sessions
rmUsed  = baseRM     × multiplier × sessions   // factories only
revenue = output × price × (1 − vat/100)
```

Pollution is **quality-specific** (`qualityPollution[quality]`; index `0` is the
raw-material/plantation rate). The summary runs a **buy-vs-produce comparison**:
Option A buys all raw material at market; Option B runs your plantations and
buys/sells only the net balance, adding plantation work tax. The headline KPIs
use Option B accounting (collapsing to A when no plantations are staffed); the
comparison panel recommends the higher-net option. When touching profit math,
keep Option A, Option B, and the per-card breakdown consistent — they share
inputs and are easy to desync.

The game's rounding is mirrored exactly: raw production truncates the 3rd decimal
(`gameRawProduction`, e.g. 3.685 → 3.68), per-company values round to 2dp then
sum. **`calc/golden.test.ts` asserts the calc is bit-identical to the original
`holdingsCalc.mjs`** via a committed snapshot (`calc/__fixtures__/golden-snapshot.json`,
regenerated by `scripts/gen-golden-snapshot.mjs`). Treat that test as the
canary when changing any math.

### Live data scraping (via `/proxy`)

- **`services/livePrices.ts`** → `service.erepublik.tools/api/v1/market/item/0/{industry}/{quality}`
  for market prices (food has an aggregate `info.misc` map for Q1–Q7; others are
  fetched per-quality). Pure parsers (`parseFoodMisc`, `parseCheapestOffer`) +
  `fetchPrices`.
- **`services/regions.ts`** → scrape `erepublik.com` country-society / economy /
  region pages with **regex over raw HTML** (`countryProductivityBonuses`,
  `regionPollutionDetails`, work-tax/salary/VAT table cells). Each is a pure
  `parse*` function (JSON-first, regex-HTML fallback) with fixture-backed tests,
  plus thin `fetch*` wrappers. These regexes are brittle by nature — when the
  game's markup changes, update them and their tests against a freshly captured
  page.

Manually editing any modifier input **de-syncs** the location selection (clears
country/region) — this is intentional (`SET_MODULE_FIELD` in the reducer);
preserve it. A bulk price sync does NOT de-sync.

### Localization (i18n)

`src/i18n/index.ts` inits a single global `react-i18next` instance **synchronously**
from bundled JSON (no Suspense, no `<I18nextProvider>`, no key-flash — tests render
immediately). Four namespaces: `common`, `industry`, `holdings`, `tooltips`
(`defaultNS: 'common'`). UI text comes from `useTranslation(ns)`; `i18n/names.ts`
maps raw game country/region/industry codes to display names. Tooltips use
`react-tooltip` via the global `AppTooltip` + the `tip()` helper in
`components/tooltip.ts`.

There are 24 locales. `src/i18n/index.ts` and `src/components/flagUrls.ts` are both
**generated** — don't hand-edit them. To add a locale: (1) create
`locales/<code>/{common,industry,holdings,tooltips}.json` (the non-English
`industry.json` prepends a `names` block overriding industry/RM labels; EN omits it
and resolves names from `data/industries.ts`); (2) add the code to `SUPPORTED_LOCALES`
and a flag (ISO 3166-1 alpha-2) to `LOCALE_FLAG` in `i18n/config.ts` — plus
`RTL_LOCALES` if it's right-to-left; (3) run `node scripts/gen-i18n-resources.mjs`,
which regenerates `index.ts`, regenerates `flagUrls.ts`, and normalizes the
`language` native-name map across every `common.json` (keeping each file's own
`label`). Flags render from **flag-icons** SVGs — `flagUrls.ts` imports only the
ones used (one per locale) as Vite assets, so no world-sprite CSS ships; `Flag.tsx`
sets them as a `background-image`. `App.tsx` syncs `<html lang>` and `dir` to the
active locale. The `LanguageSwitcher` sorts entries alphabetically by native name and
hides itself while only one locale exists. "Tycoon" is a fixed bonus name — keep it
literal in every locale, never translated. Persisted under `localStorage` key
`erep_locale`. **Add user-facing strings to the catalogs, never hard-code them in
components**; `i18n/i18n.test.ts` asserts every namespace loads for every locale and
keys resolve.

## Deployment

Dockerized like the rest of the monorepo. `release.sh` builds the Vite bundle **on
the host** (`npm ci && npm run build`) — esbuild is fragile inside buildkit/QEMU —
then `docker buildx` builds a multi-arch (`amd64,arm64`) image that just *copies*
`dist/` + `server.js` (no node_modules, no in-image compile) and pushes
`registry.yurii.live/erep-calculator:{version,latest}`. Version comes from
`package.json`. `docker-compose.yml` runs it as `erep-calculator`, host `:8085` →
container `:8080`. `server.js` honors `PORT` (defaults 8080).

## Conventions

- TypeScript strict; `npm run build` runs `tsc --noEmit` before `vite build`.
- Profit math is pure and DOM-free (`src/calc`) and must stay golden-parity green.
- Components reach state only through `src/state/hooks.ts` facades, never raw dispatch.
- All currency display is `.toFixed(2)` CC; company counts cap at 9999 per quality.
- Keep dependencies minimal — React + Vite + Vitest + Testing Library, plus
  `i18next`/`react-i18next` (localization) and `react-tooltip` (tooltips). Add
  nothing else unless explicitly asked.
- User-facing text lives in `src/i18n/locales/*` catalogs, never inline in JSX.
```

(The legacy vanilla app — `app.js`, `holdingsCalc.mjs`, `index.legacy.html` — was
removed at cutover; it remains in git history if needed.)
