---
name: erep-profit
description: Generate a live eRepublik profit report for the user's own companies — ranks what is most profitable to produce, flags loss-making and idle factories, computes hiring break-even salaries (produce vs buy), gives a convert-vs-sell-raw verdict, and (with --relocate) compares region productivity. Use when the user asks "what should I produce", "is anything worth running", "should I hire / at what salary", "should I relocate", "analyse my companies", or "профіт/прибуток/що виробляти".
---

# eRepublik Profit Report

Produces a self-contained, light-theme **HTML report** (auto-opened in the browser)
that analyses the user's *current* companies with **live** market prices and location
modifiers. All profit math reuses the app's golden-parity engine (`src/calc/*`) — no
formula is duplicated.

## Run

```bash
cd /Users/driversti/Projects/erepublik/calculator
npx vite-node scripts/profit/run.mts                 # default config, opens report
npx vite-node scripts/profit/run.mts --relocate      # also scan higher-productivity regions
npx vite-node scripts/profit/run.mts --no-open        # write file, don't open
npx vite-node scripts/profit/run.mts path/to/cfg.json # custom inventory file
```

RM is always valued at **market price** (the correct opportunity cost of self-produced
RM — what you forgo by not selling it). Your WAM/hire production cost (собівартість) is
shown per industry **for reference only**; charging factories that cost would double-count
the plantation's margin. `offeredSalary` in the config (when > 0) drives the hiring
analysis (ranking + break-even verdict); 0 means WAM-only and uses the country average.

Output: `reports/profit-YYYY-MM-DD-HHMM.html` (git-ignored).

## Inventory config

Edit `scripts/profit/my-companies.json` (git-ignored) whenever your companies change.
`factories`/`plantations`/`rm` map **quality → company count**; omit what you don't own.
`country` is a permalink from `src/data/countries.json`; `region` is a region permalink
(see `src/data/regionResources.ts`). `offeredSalary: 0` models WAM-only; set a value to
model hiring cost globally. Houses & aircraft have **no WAM** — they show as idle unless
you hire (the report says so explicitly).

## What the report answers

- **Current daily profit** (per-company × owned), with Tycoon on/off.
- **Per-company transparent breakdown** — every number derivable by hand
  (`base → multiplier → units → ×price ×(1−VAT) → −RM −tax → net/session → ×count`).
- **What to produce** — every (industry × quality) ranked by net per session.
- **Hiring break-even** — for hired industries, the max salary at which producing
  beats buying (self-use) or still nets ≥ 0 (resale), vs the country average salary.
- **Convert vs sell raw** — per industry, per raw-material unit.
- **Relocation** (`--relocate`) — top region-bonus regions per industry. For a full
  profit-based scan of the whole universe, use the app's **Optimizer** tab.

## How it works

`scripts/profit/run.mts` (orchestrator) → `fetch.mts` (live prices + modifiers via the
GCP proxy `epc.yurii.live`, reusing `src/services` parsers) → engine
(`computeFwIndustry`/`computeHiredIndustry` via `computeAdvisor`) → pure
`src/profit/breakeven.ts` + `src/profit/render.ts` → HTML. The pure modules are
unit-tested (`src/profit/*.test.ts`); run `npx vitest run src/profit/` after edits.

Override the proxy with `EREP_PROXY=https://host` (default `https://epc.yurii.live`).
A local `npm run dev`/`npm run serve` also exposes `/proxy` if you prefer self-hosting.
