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
npm run dev      # Vite dev server (HMR) on http://localhost:5173; proxies /proxy → 8080
npm run build    # tsc --noEmit && vite build → dist/
node server.js   # serves dist/ + /proxy on http://localhost:8080
npm test         # vitest: calc golden-parity, state, components, views
```

**Dev:** run `npm run dev` and `node server.js` together — Vite serves the UI with
HMR; the Node server provides the `/proxy` endpoint (Vite proxies `/proxy` → 8080).
**Production:** `npm run build`, then `node server.js` serves the built app from
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
│   └── travel.ts              # typed re-export of ../travelData.js (countries/regions)
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
├── components/                # shared: Counter, IconImage, StarRating, FactoryCard, TabBar
└── views/
    ├── IndustryView/          # one industry tab (Summary, Modifiers, Prices, grids)
    └── HoldingsView/          # holdings (toolbar, location bar, per-industry sections, summary)
```

`server.js` is an ESM (`type: module`) ~160-line `http` server: serves `dist/`
(falling back to the repo root for assets outside the build, e.g. `styles.css`),
plus a `/proxy?url=…` GET endpoint allowlisted to `www.erepublik.com` and
`service.erepublik.tools` over https only. PORT 8080 hardcoded. `styles.css` and
`travelData.js` live at the repo root (imported by the React app).

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

## Conventions

- TypeScript strict; `npm run build` runs `tsc --noEmit` before `vite build`.
- Profit math is pure and DOM-free (`src/calc`) and must stay golden-parity green.
- Components reach state only through `src/state/hooks.ts` facades, never raw dispatch.
- All currency display is `.toFixed(2)` CC; company counts cap at 9999 per quality.
- Keep dependencies minimal — React + Vite + Vitest + Testing Library only, unless
  explicitly asked.
```

(The legacy vanilla app — `app.js`, `holdingsCalc.mjs`, `index.legacy.html` — was
removed at cutover; it remains in git history if needed.)
