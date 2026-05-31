# eRepublik Productivity & Profit Calculator

A single-page web app that estimates **daily profit** for your
[eRepublik](https://www.erepublik.com) companies across all four industries —
food, weapons, houses, and aircraft weapons. Built with **Vite + React 19 +
TypeScript**. All calculations run client-side; the bundled Node server serves
the production build and proxies game requests around CORS.

## Features

- **Four industry modules** — Food, Weapons, Houses, and Aircraft Weapons, each
  with Q1–Q7 (or Q1–Q5) factories and their raw-material companies
  (plantations / mines / RM refineries).
- **Holdings mode** 🗂️ — model a *holding company*: one location containing a
  **mix of companies across all industries**, with combined per-holding profit.
  Each industry's productivity uses that region's **industry-specific** bonuses
  (country bonus per token, region resource bonus, per-quality pollution).
  Create, rename, switch, and clear holdings.
- **Game-accurate math** — mirrors eRepublik's own rounding (raw production
  truncated to 2 decimals, per-company values summed), Work-as-Manager sessions,
  per-industry VAT, work tax, and offered-salary labor cost.
- **Buy-vs-produce strategy** (industry tabs) — compares buying raw material on
  the market against running your own RM companies and recommends the cheaper
  path.
- **Live data sync** — pulls current market prices from
  `service.erepublik.tools` and scrapes country/region productivity bonuses,
  pollution, work tax, and VAT from `erepublik.com` (via the local proxy).
- **Persistent** — all input is saved to `localStorage`.

## Screenshots

**Holdings mode** — a single holding in one region with a mix of Food and Weapon
companies; each industry uses that region's own bonuses, and the left summary
shows the combined daily profit with a per-industry breakdown.

![Holdings mode](docs/screenshots/holdings-mode.png)

**Industry view** — the Food module with factories, plantations, the live
buy-vs-produce strategy comparison, and location/market modifiers.

![Food industry view](docs/screenshots/industry-food.png)

## Run

Requires [Node.js](https://nodejs.org) (v18+).

```bash
npm install
npm run dev      # Vite dev server (HMR) on http://localhost:5173
node server.js   # /proxy endpoint + serves the production build on http://localhost:8080
```

For development, run `npm run dev` (UI with hot reload) alongside `node
server.js` (provides `/proxy` for live data). For production, `npm run build`
then `node server.js` serves the built app from `dist/` at
<http://localhost:8080>. Live data fetches go through the server's `/proxy`
endpoint to bypass CORS.

## Tests

```bash
npm test         # Vitest — calc golden-parity, state, components, views
```

The profit math is covered by a golden-parity suite that asserts the React
calc layer is bit-identical to the original `holdingsCalc.mjs`.

## Architecture

A single React tree under `src/`, with a strict separation between **pure profit
math** (no DOM, no React) and the UI that renders it.

| Path | Responsibility |
|------|----------------|
| `src/calc/` | **Pure profit math** — rounding, productivity multiplier, per-industry & summed profit. Golden-parity locked (`calc/golden.test.ts`). |
| `src/state/` | One immutable reducer + Context, reached only via facade hooks (`state/hooks.ts`); `localStorage` load/migrate/save. |
| `src/data/` | Static, typed game facts (factory/plantation/RM configs, building icon ids). |
| `src/services/` | Live data via `/proxy` — pure parsers + thin fetchers for market prices and country/region modifiers. |
| `src/components/` | Shared UI (Counter, IconImage, StarRating, FactoryCard, TabBar). |
| `src/views/` | `IndustryView/` (one industry tab) and `HoldingsView/` (holdings mode). |
| `server.js` | ESM `http` server: serves `dist/` + an allowlisted `/proxy` GET endpoint. |
| `travelData.js` | Static countries/regions maps for the location dropdowns. |
| `styles/` | Per-concern stylesheets, composed via `styles/index.css`. |

Profit math is DOM-free and must stay golden-parity green; components reach state
only through the `src/state/hooks.ts` facades, never raw dispatch. Design notes
and per-feature specs/plans live under `docs/superpowers/`.

## Acknowledgements

Live market prices come from the excellent **[eRepublik Tools](https://erepublik.tools)**
API (`service.erepublik.tools`). Huge thanks to its authors for their work and
for keeping it available — without it, up-to-date prices simply wouldn't be
reachable and users would have to look up and enter every Q1–Q7 price by hand.
Please support and respect their service; use it responsibly.

## Disclaimer

This is an unofficial fan-made tool and is not affiliated with or endorsed by
eRepublik Labs. Game mechanics and markup change over time; the live scrapers
fall back to manual input when the game's HTML changes.

## License

[MIT](LICENSE) © Yurii Chekhotskyi
