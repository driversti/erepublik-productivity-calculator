# Profit Advisor Skill — Design

**Date:** 2026-06-13
**Status:** Approved-pending-review
**Author:** Yurii + Claude

## Purpose

A reproducible, on-demand tool that answers: *"Given my current factories, what is
most profitable to produce right now — and is anything not worth running at all?"*
It also tells me **whether/at what salary hiring beats buying** for hired industries
(Q5 aircraft weapons, Q1 houses), gives a **convert-vs-sell-raw** verdict per industry,
and — on request — whether I should **relocate** production to a higher-bonus region.

It is delivered as a project-local **Claude Code skill** (`erep-profit`) in the
calculator repo, because it reuses the repo's golden-parity calc engine
(`src/calc/*`) and live-data parsers (`src/services/*`). No parallel profit formula
is ever written — the skill is a thin orchestration layer over the existing engine.

## Why this design

- **Trust through transparency, not a second opinion.** The user has not validated
  the in-app Advisor; the concern is "unverified", not "known-wrong". The core
  production math is already golden-parity locked to the original `holdingsCalc.mjs`
  (itself matched to the game's `myCompanies` JS). So the trust mechanism is a
  **fully auditable per-company breakdown** in the report — every number derivable
  by hand — rather than a cross-check against the same-logic web app.
- **Config-file input, not live scraping of My Companies.** No auth/session
  handling; the user maintains a small JSON file. Simple, private, deterministic.
- **Reuse, don't fork.** Computation calls `computeFwIndustry` /
  `computeHiredIndustry` (and `computeAdvisor` for ranking) directly.

## Inputs

A git-ignored `my-companies.json` (path passed to the script; default
`scripts/profit/my-companies.json`):

```jsonc
{
  "hasTycoon": false,
  "wamEnabled": true,
  "offeredSalary": 0,                 // 0 = WAM-only; set to model hiring cost
  "industries": {
    "food":     { "country": "Lithuania", "region": "Samogitia",
                  "factories": {}, "plantations": { "5": 30, "4": 29 } },
    "weapons":  { "country": "Lithuania", "region": "Lithuania-Minor",
                  "factories": { "7": 24 }, "plantations": { "5": 200 } },
    "houses":   { "country": "Poland", "region": "Mazovia",
                  "factories": { "1": 1, "5": 1 }, "rm": { "5": 10 } },
    "aircraft": { "country": "Romania", "region": "Dobrogea",
                  "factories": { "5": 2 }, "rm": { "5": 10 } }
  }
}
```

- `factories`/`plantations`/`rm` map quality→company count. Missing = 0.
- `country` is a permalink in `src/data/countries.json`; `region` is a region
  permalink (as in `src/data/regionResources.ts`).

## Data sources (live, via GCP proxy)

All fetches go through `https://epc.yurii.live/proxy?url=…` (the GCP IP is not
Cloudflare-blocked; verified working for both `service.erepublik.tools` and
`www.erepublik.com`). The script reuses the repo's **pure parsers**:

- **Prices**: tools.com market API → `parseFoodMisc` / `parseCheapestOffer`
  (finished goods Q1..maxQ + the RM) per industry.
- **Location modifiers**: country-economy + region pages →
  `parseRegionModifiers` (countryBonus, regionBonus, qualityPollution, workTaxRate,
  averageSalary, vat) using `SCRAPE_CONFIG[industry]`.

These are assembled into an `AppState` (via `initialState()` + the inventory).

## Computation

1. Build `AppState`, apply live modifiers + prices + inventory counts.
2. **WAM ranking** (food/weapons): `computeAdvisor` twice — `hasTycoon:false` and
   `:true` — read `wamNet` per (industry×quality), and plantation `rm` rows.
3. **Hired ranking** (houses/aircraft, no WAM): `computeAdvisor` with
   `offeredSalary` set to the location's average salary; read `hireNet` (Tycoon off)
   and `hireNetTycoon`.
4. **Current daily profit**: per owned company, per-session net × count, summed.
   Note explicitly that houses/aircraft yield **0 under WAM-only** (owner cannot WAM
   them) — they are idle capital unless hired.
5. **Hiring break-even** (the user's explicit ask). For each hired quality, compute
   **two** break-even salaries, from base values (not via the VAT-applying engine):
   - **Self-use** (primary; matches "produce vs buy for my own use"):
     `salaryMax = unitsPerSession × finishedGrossPrice − rmConsumed × rmGrossPrice`.
     Hire at ≤ this and producing for own consumption is cheaper than buying.
   - **Resale** (secondary): max salary where producing-to-sell still nets ≥ 0 =
     `unitsPerSession × finishedPrice × (1−VAT) − rmConsumed × rmNetCost`.
   Report both, plus the verdict at the current average salary.
6. **Convert-vs-sell-raw**: `rmVerdicts` from `computeAdvisor` per industry.
7. **Relocation** (only with `--relocate`): reuse the Optimizer
   (`calc/optimizer.rankRegions` + `runScan`-style three-phase scan) per industry to
   surface the top higher-net regions vs the current location's baseline.

## Output: HTML report (light theme), auto-opened

A single self-contained `reports/profit-YYYY-MM-DD-HHMM.html` (git-ignored),
opened automatically (`open` on macOS). Light theme, no external assets. Sections:

1. **Per-company transparent breakdown** (trust anchor): for each owned quality,
   `base → multiplier (1 + country% + region% + Tycoon − pollution%) → units/session
   → ×price ×(1−VAT) → − RM cost → − work tax → NET/session → × count = /day`.
2. **Current daily profit** — total + per industry, Tycoon on/off.
3. **What to produce** — ranked net/session (WAM and hired), Tycoon on/off, with
   illiquid/loss rows flagged.
4. **Hiring break-even** — table per hired quality (self-use + resale salary caps,
   verdict at avg salary).
5. **Convert vs sell raw RM** — verdict per industry.
6. **Relocation** (if `--relocate`) — top regions per industry vs current baseline.
7. **Footer** — data timestamps, prices used, assumptions.

## File layout

```
src/profit/
  types.ts             # ReportModel + sub-types (contract between run and render)
  breakeven.ts         # hiring self-use/resale break-even (pure, unit-tested)
  breakeven.test.ts
  render.ts            # HTML (light theme) builder (pure: ReportModel → string)
  render.test.ts
scripts/profit/
  run.mts              # orchestrator: load config → fetch → compute → render → open
  fetch.mts            # proxy fetchers (prices + modifiers) over pure parsers
  my-companies.json    # git-ignored user inventory
.claude/skills/erep-profit/SKILL.md   # how to run, flags (--relocate), config doc
reports/                              # git-ignored output
```

The pure, tested modules live under **`src/profit/`** (not `scripts/`) so vitest's
existing `src/**/*.test.ts` include picks them up and `tsc --noEmit` type-checks
them — cleaner than widening the vitest glob. `fetch.mts`/`run.mts` are thin I/O
glue and tested only at the parser boundary (parsers already have fixture tests in
`src/services`). Relocation reuses `regions/ranking.rankRegions` over the bundled
seed (region-bonus ranking); the full profit-based universe scan stays in the
app's Optimizer tab (not duplicated).

## Testing

- `breakeven.mts`: golden cases (known base/price/RM → expected salary caps).
- `render.mts`: snapshot of HTML for a fixed results object (deterministic).
- Reuse existing parser tests; no new network tests.
- A smoke run against live data is a manual step (the skill itself).

## Trust strategy (recap)

Transparency-first: the per-company breakdown is the proof. Ground-truth vs the
game's My Companies page and a Playwright cross-check of the web app are **out of
scope** by the user's choice (core is already golden-parity tested).

## Out of scope / YAGNI

- Live scraping of the user's company list (auth).
- Browser automation in the skill.
- Persisting historical reports / trend charts.
- Multi-account support.

## Open questions

None blocking.
