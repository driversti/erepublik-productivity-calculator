# eRepublik Productivity & Profit Calculator

A zero-dependency, single-page web app that estimates **daily profit** for your
[eRepublik](https://www.erepublik.com) companies across all four industries —
food, weapons, houses, and aircraft weapons. Pure vanilla JavaScript (ES
modules), no framework, no build step. All calculations run client-side; the
tiny bundled Node server only serves the files and proxies game requests around
CORS.

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

Requires [Node.js](https://nodejs.org) (v18+ for the built-in test runner).

```bash
node server.js
```

Then open <http://localhost:8080>.

> The app needs the server: `app.js` is loaded as an ES module (so opening
> `index.html` over `file://` breaks imports), and live data fetches go through
> the server's `/proxy` endpoint to bypass CORS.

## Tests

The profit math lives in a pure, DOM-free module (`holdingsCalc.mjs`) covered by
the built-in Node test runner — no dependencies, no config:

```bash
node --test holdingsCalc.test.mjs
```

## Architecture

| File | Responsibility |
|------|----------------|
| `index.html` | Static shell; rows, sections and KPIs are populated by JS by element id. |
| `app.js` | The whole app: mutable `state` → `localStorage`, a single `render()` source of truth, the four industry modules + Holdings mode, live scrapers. |
| `holdingsCalc.mjs` | Pure profit math for Holdings (rounding, productivity multiplier, per-industry & summed profit). Importable in the browser and in `node --test`. |
| `travelData.js` | Static countries/regions maps for the location dropdowns. |
| `server.js` | ~100-line HTTP server: static files + an allowlisted `/proxy` GET endpoint. |
| `styles.css` | All styling. |

Design notes and per-feature specs/plans live under `docs/superpowers/`.

## Disclaimer

This is an unofficial fan-made tool and is not affiliated with or endorsed by
eRepublik Labs. Game mechanics and markup change over time; the live scrapers
fall back to manual input when the game's HTML changes.

## License

[MIT](LICENSE) © Yurii Chekhotskyi
