# Calculator Architecture

Reference for how the app is structured. The essentials (build, test, release) live in [`../CLAUDE.md`](../CLAUDE.md).

## Source layout

The app is a single React tree under `src/`, with a strict separation between
**pure profit math** (no DOM, no React) and the UI that renders it.

```
src/
├── main.tsx, App.tsx          # bootstrap + tab router (industry tabs + Holdings + Regions + Optimizer + Advisor)
├── data/                      # static game facts (typed)
│   ├── industries.ts          # factory/plantation/RM arrays + IndustryConfig per industry
│   ├── regionResources.ts     # AUTO-GENERATED region→resource bonus seed (RegionEntry[]) + COUNTRY_FLAGS; snapshot-dated, DO NOT hand-edit rows
│   ├── buildingIds.ts         # CDN icon ids
│   └── travel.ts              # re-exports `countries` from countries.json (region identity lives in regionResources.ts + live /api/universe)
├── calc/                      # PURE math — the heart; golden-parity locked
│   ├── rounding.ts            # roundNumber, gameRawProduction, productivityMultiplier, pollutionAt
│   ├── industry.ts            # computeFwIndustry, computeHiredIndustry
│   ├── strategy.ts            # computeIndustryView (food/weapons buy-vs-produce)
│   ├── hiredView.ts           # computeHiredView (houses/aircraft tab)
│   ├── holding.ts             # sumHolding
│   ├── optimizer.ts           # rankRegions — net profit per candidate region (Optimizer)
│   ├── regionBonus.ts         # selectCandidates — filter/score regions by industry bonus threshold
│   ├── regionJoin.ts          # join live /api/universe ownership with the bonus seed
│   ├── advisor.ts             # ranks industry×quality by profit per work session; liquidity-aware (Advisor tab)
│   ├── advisorInsights.ts     # deterministic plain-language "Bottom line" insight generator over AdvisorReport
│   └── __fixtures__/golden-snapshot.json   # frozen legacy output (parity guard)
├── regions/                   # ranking.ts — pure rankRegions for the Regions browser tab
├── state/                     # one reducer + Context, reached only via facade hooks
│   ├── types.ts, blank.ts     # AppState shape + initialState/blank builders
│   ├── reducer.ts             # pure discriminated-union reducer
│   ├── persistence.ts         # localStorage load/migrate/save (key v12)
│   ├── StateContext.tsx       # StateProvider (useReducer + persist effect)
│   ├── useRegionList.ts       # live country→region dropdown list (Society page, permalink-keyed)
│   └── hooks.ts               # domain facade hooks (components never touch dispatch directly)
├── services/                  # live data via /proxy + /api/universe (pure parsers + thin fetchers)
│   ├── proxy.ts, livePrices.ts, regions.ts
│   ├── universe.ts            # /api/universe region feed (live ownership), seed fallback
│   ├── economySource.ts       # CountryEconomics / RegionLiveDetails interfaces for the optimizer scan
│   ├── liveEconomy.ts         # per-country economics (bonus/salary/tax/VAT) from region pages
│   ├── regionData.ts          # BUNDLED_DATASET + region-bonus dataset access
│   ├── countryNames.ts        # game country id/name mapping
│   ├── concurrency.ts         # bounded parallel fetch pool (rate-limit safe)
│   └── freshness.ts           # "updated N min ago" relative-time helper
├── i18n/                      # react-i18next: synchronous init, bundled JSON catalogs
│   ├── index.ts, config.ts    # global instance + SUPPORTED_LOCALES/loadLocale
│   ├── names.ts               # localized country/region/industry name helpers
│   └── locales/en/*.json      # 4 namespaces: common, industry, holdings, tooltips
├── components/                # shared: Counter, IconImage, StarRating, TabBar, LanguageSwitcher, AppTooltip, Flag
└── views/
    ├── IndustryView/          # one industry tab (Summary, Modifiers, Prices, grids)
    ├── HoldingsView/          # holdings (toolbar, location bar, per-industry sections, summary)
    ├── RegionsView/           # browse/rank regions by production bonus for an industry
    ├── OptimizerView/         # runScan.ts orchestrates the universe scan; ResultsTable renders ranked regions
    └── AdvisorView/           # Advisor tab: headline + InsightsPanel ("Bottom line") + ranked production table (per-quality exclude toggle) + RM convert/sell panel
```

`server.js` is an ESM (`type: module`) ~210-line `http` server: serves `dist/`,
a `/proxy?url=…` GET endpoint allowlisted to **exact** hosts `www.erepublik.com`
and `service.erepublik.tools` over https only (exact-hostname match, not prefix —
to block look-alike/userinfo tricks), and `GET /api/universe` which enumerates
the eRepublik Society pages server-side and serves the result from one shared
**30-min file cache** (`UNIVERSE_TTL_MS`) so the GCP IP makes ~74 anonymous
fetches per window instead of per-client. It reads `src/data/countries.json` at
startup (must be bundled into the image — see Deployment). Port is
`process.env.PORT || 8080`. Styles live in `styles/` (a per-concern split
imported via `styles/index.css` from `main.tsx`).

### Regions & Optimizer

Two features built on the region-bonus dataset:

- **Regions tab** (`views/RegionsView` + `regions/ranking.ts`): pure ranking of
  regions containing an industry's resources, by summed bonus, optionally scoped
  to one country. Read-only browser.
- **Optimizer tab** (`views/OptimizerView/runScan.ts`): a three-phase scan that
  finds the best region to relocate to for the current industry config —
  (1) `selectCandidates` filters the universe by a bonus threshold;
  (2) fetch per-country economics (bonus/salary/tax/VAT) and rank with
  pollution=0 via `calc/optimizer.rankRegions`; (3) fetch real pollution for the
  `topN` finalists from their region pages and re-rank. Region **identity +
  bonuses** come from the bundled seed (`data/regionResources.ts`, snapshot-dated);
  region **ownership** comes live from `/api/universe` and is joined onto the seed
  by `calc/regionJoin` (so a region's `currentCountry` tracks war, while bonuses
  stay stable). Live fetches go through `services/concurrency.ts`'s bounded pool
  to respect the API rate limit. Never re-introduce a static per-country region
  list — ownership is always live.

### Advisor

The **Advisor tab** (`views/AdvisorView` + pure `calc/advisor.ts`) answers "what
should I produce to maximize profit with my *current* factories" — a read-only,
deterministic projection over existing app state with **no new inputs and no LLM**.
It ranks every (industry × quality) by net profit normalized per work session:
**net / WAM session** (per company/day; food & weapons only), **net / hired
session** shown both without and with Tycoon (so you can see whether Tycoon makes
hired labour profitable — relevant for houses/aircraft, which have no WAM), and
**net / 1 CC of raw material** (ROI). It also emits a per-industry
**convert-vs-sell-raw-RM** verdict: is it better to turn raw material into finished
goods, or sell the RM raw? All math reuses the golden-parity
`computeFwIndustry`/`computeHiredIndustry` (no parallel formula), so it stays in
sync with the rest of the calc.

Two additions sit on top of the ranking, both deterministic (no LLM):

- **Insights panel ("Bottom line")** — pure `calc/advisorInsights.ts` turns the
  `AdvisorReport` + `AppState` into structured, colour-coded `Insight[]` findings
  (best action, main earner, loss-makers, dead capital, per-RM sell-vs-convert
  strategy, hiring viability, caveat). It adapts to play-style purely from the data
  via an `achievable()` helper that keys off `wamEnabled`/`hasTycoon` — a WAM-only
  player sees WAM economics and "hiring unprofitable everywhere"; a magnate
  (hires + Tycoon) sees viable hire rows. The generator returns raw values; the
  `InsightsPanel` component maps each `type` to an i18n template and formats numbers.
- **Liquidity / "can't sell" flag** — `state.excludedQualities: string[]` (keys
  `"${industry}:${quality}"`, finished goods only; toggled from the table via
  `useToggleExcludedQuality`, persisted, additive — no version bump). `computeAdvisor`
  sets `AdvisorRow.excluded` and drops excluded qualities from `topWam`, each
  `RmVerdict.bestQuality`, and the insights — while still rendering them greyed +
  struck-through with a 🚫 toggle to re-include.

### State & module model

`state.activeModule` is one of `food | weapons | houses | aircraft | holdings | regions | optimizer | advisor`.
Food/weapons are **fw** modules (owner Work-as-Manager + plantations); houses/
aircraft are **hired** modules (hired workers only, no WAM, work tax always 0).
The reducer is pure and immutable; **components dispatch only through the facade
hooks** in `state/hooks.ts` (`useIndustryView`, `useHiredView`, `useHoldings`,
`useIndustrySync`, …) — this keeps a future store swap (e.g. Zustand) to one file.
Persistence uses `localStorage` key `erep_calculator_food_factories_v12`; the
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
- **`services/universe.ts`** → `GET /api/universe` (server-cached) for live region
  ownership; falls back to the bundled `regionResources` seed when the server is
  unreachable (`fetchedAt: null` signals the fallback for the freshness note).
- **`services/liveEconomy.ts`** → per-country economics for the optimizer
  (productivity bonus, average salary, work-tax, VAT). All optimizer fetches run
  through **`services/concurrency.ts`**'s bounded pool to stay under the rate limit.

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

There are 25 locales. `src/i18n/index.ts` and `src/components/flagUrls.ts` are both
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

## Profit report script (`scripts/profit/`)

`npx vite-node scripts/profit/run.mts [config.json] [--relocate] [--no-open]` loads a personal inventory config (`my-companies.json`, git-ignored; template: `my-companies.example.jsonc`), fetches live prices and location modifiers, runs the app's engine (`computeAdvisor` etc., no duplicated formulas) and renders a self-contained HTML report via `src/profit/render.ts`. Pure helpers live in `src/profit/` (breakeven, ownCost, produceVsBuy, damageCost, jsonc).

## Server files

`server/buildUniverse.js` and `server/regionList.js` (with tests) back `/api/universe` and the region dropdown list. The universe cache file is `$DATA_DIR/universe.json` (`DATA_DIR` defaults to `./data`; docker-compose mounts `./data:/data`).
