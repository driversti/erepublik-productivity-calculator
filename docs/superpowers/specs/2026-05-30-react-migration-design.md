# React Migration — Design Spec

**Date:** 2026-05-30
**Status:** Approved (design), pending implementation plan
**Topic:** Migrate the eRepublik Productivity / Profit Calculator from vanilla JS to React.

## 1. Goal & Scope

Rewrite the UI from vanilla JS to React **without changing behavior**: identical
features and the **same numeric result to the cent**. No new features during the
migration. The most valuable asset — the profit math — is extracted and covered
by tests **first**, before any UI work begins.

### Why migrate

The two pain points driving this are *current-code pain*, not *missing
capabilities*:

- `app.js` has grown to ~2700 lines / 141 KB — a single monolith that is
  expensive to read and risky to edit.
- Manual DOM work hurts: `render()` rewrites the whole DOM every change and
  `setupListeners()` rebinds every listener each cycle. The project's own
  CLAUDE.md notes that Option A / Option B / breakdown are *easy to desync* —
  exactly the class of regression a declarative render eliminates.

### Decisions (locked)

| Decision | Choice |
|----------|--------|
| Strategy | **Clean rewrite on a branch** (`feat/react-migration`); single cutover at the end |
| Build | **Vite + React 19 + JSX + TypeScript** (deliberately drops the zero-build philosophy) |
| Library | **React 19** (matches sibling projects: `epc` 19, `battle-stats`/`erep-hq` 18) |
| State | **useReducer + Context**, accessed via domain facade hooks |
| Persistence | **Same `localStorage` key + same v11 state shape** — existing data survives cutover |
| Scope | **Behavior-preserving** — zero new features |
| Tests | **Vitest + Testing Library**; port existing `node:test` calc tests |
| Deploy | **`server.js` serves `dist/` + keeps the `/proxy` allowlist** |

## 2. Stack & File Structure

```
calculator/
├── server.js              # kept: serves dist/ + /proxy (allowlist unchanged)
├── package.json           # new: vite, react, react-dom, typescript, vitest, @testing-library/*
├── vite.config.ts         # dev-proxy /proxy → server.js; build → dist/
├── tsconfig.json
├── index.html             # new thin Vite entry (<div id="root">)
├── src/
│   ├── main.tsx           # bootstrap
│   ├── App.tsx
│   ├── data/              # typed game facts: factories, plantations, building IDs, travelData
│   ├── calc/              # PURE math (TS, no DOM) — heart of the system
│   │   ├── rounding.ts    # roundNumber, gameRawProduction, productivityMultiplier, pollutionAt
│   │   ├── industry.ts    # computeFwIndustry, computeHiredIndustry
│   │   ├── strategy.ts    # buy-vs-produce (Option A/B) — currently inline in render()
│   │   └── holding.ts     # computeHoldingIndustry, sumHolding
│   ├── state/             # reducer + Context + types + persistence(v11) + facade hooks
│   ├── services/          # proxy, livePrices, regions (brittle regexes, with fixture tests)
│   ├── components/        # shared: Counter, IconImage, StarRating
│   └── views/             # IndustryView/*, HoldingsView/*
└── docs/superpowers/...   # spec + plan (unchanged convention)
```

The current `app.js`, `holdingsCalc.mjs`, `holdingsCalc.test.mjs`, `styles.css`,
and `travelData.js` stay in place during migration and are removed/ported at
cutover. `styles.css` is reused (imported by Vite); the existing element-ID-based
markup in the old `index.html` is replaced by components.

## 3. State (useReducer + Context + facade hooks)

- The entire current `state` object → one typed reducer. Actions like
  `INCREMENT_FACTORY`, `SET_COUNTRY_BONUS`, `CREATE_HOLDING`, `SWITCH_MODULE`, …
- `Context` distributes `state` + `dispatch`.
- **Key rule:** components do **not** touch `useContext`/`dispatch` directly.
  They go through domain hooks (`useIndustry('food')`, `useHolding(id)`, action
  hooks). This is cleaner for learning and makes a future swap to Zustand
  trivial — only the hook internals change, not the components.
- **Persistence:** port the existing v11 load/migration logic (current `app.js`
  lines ~320–492) into TypeScript. A `useEffect` writes to `localStorage` on
  change. Same key (`erep_calculator_food_factories_v11`), same shape → saved
  holdings and settings survive the cutover.

## 4. Component Tree (mapped to current UI)

```
App
├─ TabBar (food/weapons/houses/aircraft/🗂️ holdings)
├─ IndustryView
│  ├─ SummarySidebar  (KPI + breakdown + strategy A/B cards)
│  ├─ ModifiersPanel  (country/region, bonuses, tycoon, WAM, tax, salary, VAT, sync)
│  ├─ PricesPanel     (Q1–Q7)
│  ├─ FactoriesGrid → FactoryCard → Counter
│  └─ PlantationsGrid / RmGrid (houses/aircraft) → Card → Counter
└─ HoldingsView
   ├─ HoldingToolbar  (new/rename/switch/clear, location, sync)
   ├─ HoldingSections (per industry) → Card → Counter
   └─ HoldingSummary  (KPI + per-industry breakdown)
```

The four industry tabs (food/weapons/houses/aircraft) share `IndustryView` and
its child components, parameterized by industry config — replacing the current
inline food↔weapon label/title rewriting in `render()`.

## 5. Services (live data / proxy)

- `proxy.ts` — builds `/proxy?url=…` requests (allowlist enforced server-side).
- `livePrices.ts` — `service.erepublik.tools` market prices (food aggregate
  `info.misc` Q1–Q7; weapons per-quality). Industry IDs: food 1, FRM 7, weapons
  2, WRM 12.
- `regions.ts` — the brittle regex scrapers over erepublik.com raw HTML
  (`countryProductivityBonuses`, `regionPollutionDetails`, work-tax/salary
  cells). **Ported as-is**, but with unit tests over **saved HTML fixtures** so
  parsing breakage is caught without network access. Manual edits to a modifier
  still de-sync the location selection (sets status "Manual") — preserved.

## 6. Dev / Build / Deploy

- `npm run dev` → Vite (HMR); Vite dev-server proxies `/proxy` to the running
  `server.js`.
- `npm run build` → `dist/`; `node server.js` in production serves `dist/` and
  keeps the allowlist proxy.
- `npm test` → Vitest.

## 7. Migration Sequence (math-first, on `feat/react-migration`)

1. Scaffold Vite + React + TS + Vitest (old files remain).
2. Port `data/` + types.
3. **Port `calc/` + golden-parity tests** — freeze current numbers as the
   reference. Math is now protected.
4. State layer (reducer / context / persistence / facade hooks).
5. Shared components (Counter / IconImage / StarRating).
6. IndustryView (one tab → the other three reuse the same components).
7. HoldingsView.
8. Services (proxy / prices / scrapers).
9. `server.js` → serve `dist/`.
10. **Parity check** (before == after on representative inputs) → cutover:
    delete old `app.js`, update CLAUDE.md + README.
11. Merge the branch.

## 8. Testing (lean, no over-testing)

- **calc** — exhaustive + golden-parity (the crown of the system).
- **state** — reducer on key actions; round-trip persistence (load v11 → save →
  reload yields identical state).
- **components** — a few integration tests on critical interactions (counter
  updates KPI; tab switching; strategy picks the higher net; holding CRUD). Not
  every component.
- **services** — parsers against HTML fixtures.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Numeric divergence | golden-parity tests + behavior-preserving scope |
| Brittle scrapers break | port as-is + fixture tests |
| Data loss on cutover | same localStorage key + v11 shape |
| Scope creep | frozen: 0 new features during migration |
| Drops zero-build philosophy | intentional & documented; recorded in CLAUDE.md update at cutover |
