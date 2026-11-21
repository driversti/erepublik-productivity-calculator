# eRepublik Productivity / Profit Calculator

Single source of truth for every coding agent: `AGENTS.md` and `GEMINI.md` are symlinks to this file.

Single-page web app (Vite + React 19 + TypeScript) estimating daily profit for food, weapons, houses and aircraft, plus Holdings, Regions, Optimizer and Advisor modes. Calculation is entirely client-side; `server.js` (Node built-ins only) serves `dist/`, proxies game requests (`/proxy`) and serves a cached `/api/universe`. Details: [`docs/architecture.md`](docs/architecture.md); user-facing overview: [`README.md`](README.md).

## Build & run

```bash
npm install
npm run dev      # Vite on :5173; vite.config.ts plugin auto-spawns server.js on :8080 (reuses one already running)
npm run build    # tsc --noEmit && vite build -> dist/
npm run serve    # node server.js: dist/ + /proxy + /api/universe on :8080 (PORT overridable)
```

## Test

```bash
npm test                                  # vitest run (calc golden parity, state, components, views, i18n, server/*.test.js)
npx vitest run src/calc/golden.test.ts    # single file
```

`src/calc/golden.test.ts` asserts the calc is bit-identical to the legacy engine via `src/calc/__fixtures__/golden-snapshot.json` (regenerate with `scripts/gen-golden-snapshot.mjs`). Treat it as the canary for any math change. Local end-to-end: `npm run dev`, or `npm run build && npm run serve`.

## Release & deploy

- Version source: `package.json`. `./release.sh` runs `npm ci && npm run build` on the host (esbuild is fragile in buildkit/QEMU), then `docker buildx` builds a multi-arch (amd64, arm64) image that only copies `dist/`, `server.js`, `server/` and `src/data/countries.json`, and pushes `docker.io/driversti/erep-calculator:{version,latest}`.
- `docker-compose.yml` runs `erep-calculator` (`driversti/erep-calculator:latest`), host `:8085` -> container `:8080`, `./data` mounted at `/data` (`DATA_DIR`).
- Live: GCP VM behind a `cloudflared` tunnel at `epc.yurii.live` (not the home server). No deploy host/command is recorded in this repo; ask before deploying.
- The image must bundle `src/data/countries.json`: `server.js` reads it at startup and crashes without it.

## Conventions & gotchas

- TypeScript strict. Profit math (`src/calc`) is pure and DOM-free; keep it golden-parity green.
- Components reach state only through `src/state/hooks.ts` facades, never raw dispatch.
- State persists in `localStorage` key `erep_calculator_food_factories_v12`; bump the suffix on breaking shape changes (loader migrates old shapes).
- `baseRM` on factories is in marketplace units (1 FRM unit = 100 grain); raw-material `baseOutput` is in individual units.
- Game rounding is mirrored exactly (`gameRawProduction` truncates the 3rd decimal; per-company values round to 2dp, then sum). Keep Option A, Option B and per-card breakdown consistent when touching profit math.
- Editing a modifier input intentionally clears the country/region selection (`SET_MODULE_FIELD`); a bulk price sync does not.
- Region identity and bonuses come from the generated seed `src/data/regionResources.ts` (do not hand-edit rows); ownership is always live via `/api/universe`. Never reintroduce a static per-country region list.
- `src/i18n/index.ts` and `src/components/flagUrls.ts` are generated: add locales via `node scripts/gen-i18n-resources.mjs` (steps in `docs/architecture.md`). All UI text goes in `src/i18n/locales/*` catalogs, never inline in JSX. Keep "Tycoon" untranslated.
- `/proxy` allowlists exact hosts `www.erepublik.com` and `service.erepublik.tools` over https; keep exact-hostname matching.
- Scraping in `services/regions.ts` is regex over raw HTML and brittle; update parsers plus fixture tests against a fresh capture when markup changes.
- Currency display is `.toFixed(2)` CC; company counts cap at 9999 per quality.
- Keep dependencies minimal (React, Vite, Vitest, Testing Library, i18next/react-i18next, react-tooltip); add nothing else unless asked.
- `scripts/profit/my-companies.json` is personal and git-ignored; never commit it.
