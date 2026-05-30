# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

eRepublik **Productivity / Profit Calculator** — a zero-dependency, single-page web app that estimates daily profit for food and weapon factories. Pure vanilla JS (ES modules), no framework, no build step, no tests, no `package.json`. Calculation runs entirely client-side; the bundled Node server exists only to serve files and proxy game requests around CORS.

## Run

```bash
node server.js   # serves the app + /proxy on http://localhost:8080
```

The app needs the server: `app.js` is loaded as `<script type="module">` (so opening `index.html` via `file://` breaks ES-module imports), and all live data fetches go through the server's `/proxy` endpoint to bypass CORS. There is no install, build, lint, or test command — open `http://localhost:8080` and reload after edits.

## Architecture

Four files do the real work:

- **`index.html`** — static shell. All factory/plantation rows and the sidebar breakdown are rendered into empty containers (`#factories-container`, `#plantations-container`, `#factory-breakdown-list`) by JS; the rest of the DOM (modifier inputs, KPI spans, strategy cards) is fixed markup that `app.js` reads from and writes to **by element ID**.
- **`app.js`** — the entire application. Single mutable `state` object → `saveState()`/`loadState()` persist it to `localStorage` (key `erep_calculator_food_factories_v8` — bump the version suffix on breaking state-shape changes). The `render()` function is the one source of truth: it recomputes every number and rewrites the DOM on each change. `setupListeners()` is **called at the end of every `render()`**, so listeners are rebound each cycle (dynamically-created counter buttons require this) — don't move binding to one-time init.
- **`travelData.js`** — static `countries` and `regions` maps (id → name/permalink/regionIds), exported for the location dropdowns. Generated data, not hand-edited.
- **`server.js`** — ~100-line `http` server. Static file serving + a `/proxy?url=…` GET endpoint allowlisted to `www.erepublik.com` and `service.erepublik.tools` only. PORT 8080 hardcoded.

### State & module model

`state.activeModule` is `"food"` or `"weapons"`; almost everything keys off it (`state[active]`). The food/weapons sub-objects are structurally identical (`{1..7}` factory counts, `plantations{1..5}`, `countryBonus`, `regionBonus`, `pollution`, `qualityPollution{0..7}`, `prices`). Shared top-level fields: `hasTycoon`, `workTaxRate`, `averageSalary`, `vat`, `frmPrice`/`wrmPrice`, selected country/region. Tab switching just flips `activeModule` and re-renders; `render()` rewrites all the food↔weapon labels/titles inline.

The four static `*FactoriesData` / `*PlantationsData` arrays at the top of `app.js` hold game constants (`baseOutput`, `baseRM`, `energyPerItem`). **`baseRM` is in marketplace units** (1 FRM unit = 100 individual grain); plantation `baseOutput` is in individual units and divided by 100 to get marketplace units.

### The core formula (game mechanics)

Per building, in `render()`:

```
multiplier = 1 + countryBonus/100 + regionBonus/100 + (tycoon ? 0.2 : 0) − pollution/100   // floored at 0
output  = baseOutput × multiplier × qty
rmUsed  = baseRM     × multiplier × qty        // factories only
revenue = output × price × (1 − vat/100)
```

Pollution is **quality-specific** (`qualityPollution[quality]`; index `0` is the raw-material/plantation rate), falling back to the flat `pollution` field. The summary then runs a **buy-vs-produce strategy comparison**: Option A buys all raw material at market; Option B runs your plantations and buys/sells only the net balance, adding plantation work tax. `render()` picks the higher-net-profit option for the headline KPIs and highlights it. When touching profit math, keep Option A, Option B, and the per-card breakdown consistent — they share inputs and are easy to desync.

### Live data scraping (via `/proxy`)

- **`syncLivePrices()`** → `service.erepublik.tools/api/v1/market/item/0/{industry}/{quality}` for market prices (food has an aggregate `info.misc` map for Q1–Q7; weapons must be fetched per-quality). Industry IDs: food `1`, FRM `7`, weapons `2`, WRM `12`.
- **`loadRegionsForCountry()` / `syncRegionModifiers()`** → scrape `erepublik.com` country-society / country-economy / region pages with **regex over raw HTML** (`countryProductivityBonuses`, `regionPollutionDetails`, work-tax/salary table cells). These regexes are brittle by nature — when the game's markup changes, update them against a freshly captured page. Each scraper has a JSON-first path with a regex-HTML fallback.

Manually editing any modifier input **de-syncs** the location selection (clears country/region, sets the sync-status to "Manual") — this is intentional; preserve it.

## Conventions

- No external dependencies anywhere — keep it that way unless explicitly asked. No transpilation; write browser-native ES2020+.
- DOM access is by `getElementById` against IDs hardcoded in `index.html`. Adding a field means touching both files in lockstep (markup + the read/write/render code).
- All currency display is `.toFixed(2)` CC; counts cap at 9999 per quality.
