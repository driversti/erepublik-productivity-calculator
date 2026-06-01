# Advisor ("Радник") — Production Profitability Advisor

**Date:** 2026-06-01
**Status:** Approved design, ready for implementation plan
**Author:** brainstormed with Yurii

## Problem

The calculator computes net daily profit per industry, a buy-vs-produce-RM comparison,
and a Holdings rollup — but none of it answers the player's actual operational question:

> "What is the most profitable thing for me to produce right now to maximize profit?"

The existing numbers are scattered across four industry tabs and a Holdings summary,
none normalized to a comparable unit, and none surface a clear recommendation. The user
has **no hired workers** — they only **Work as Manager (WAM)** in their own food/weapons
companies — and wants to know:

1. Where to spend WAM (which industry × quality earns most per company/day).
2. Whether **hired workers are ever profitable** (e.g. only with a Tycoon Pack, and only
   for houses/aircraft which cannot WAM).
3. Per industry, whether to **convert raw material into finished goods or sell the raw RM**.

This is a **deterministic optimization** over data the app already holds. No LLM is needed
or wanted — all profit math already lives in `src/calc/` and is golden-parity locked.

## Solution overview

A new read-only **Advisor** tab (module key `advisor`), peer to Regions/Optimizer. It reads
the current state of all four industry modules (shared location/bonus/tax/salary + each
industry's own prices/VAT/pollution) and renders a ranked, normalized comparison plus a
headline recommendation. It introduces **no new user inputs** and makes **no network calls**
of its own (other than reusing the existing per-industry price-sync via a convenience
"sync all prices" button). It is a pure projection over existing state.

## Computation model

### Unit of comparison: a single work **session**

Because the user staffs companies only via WAM (no hires), the meaningful unit is one
**work session**, of which there are two kinds:

- **WAM session** (owner): food/weapons only. No salary; pays **work tax**. The user has
  enough energy to WAM every company they own, so **1 WAM session = 1 company/day** — the
  two metrics collapse into one.
- **Hired session**: any industry. Costs `offeredSalary`; no work tax. Not energy-limited.
  This is the *alternative* labor source whose viability we are testing.

### Per (industry × quality), reuse existing golden-parity math

For every quality in every industry (Food/Weapons Q1–Q7, Houses/Aircraft Q1–Q5) we isolate
the economics of a single session by calling the existing pure calculators with a
one-company cell, **buying RM at market** (RM sourcing is a separate question the user
chose to keep out of the Advisor):

| Column | How computed | Applies to |
|---|---|---|
| **net / WAM / day** | `computeFwIndustry`, `{companies:1, workers:0, wamEnabled:true}` | Food, Weapons (`—` for Houses/Aircraft) |
| **net / hired (no Tycoon)** | `compute*Industry`, `{companies:1, workers:1, wamEnabled:false}`, `hasTycoon:false` | all |
| **net / hired (Tycoon)** | same, `hasTycoon:true` | all |
| **net / 1 CC in RM** | `net ÷ rmCost` of that single-session run | all (factories consume RM) |

- The **WAM** and **net/CC** columns honor the user's *actual* `hasTycoon` flag (Tycoon is a
  global +0.2 multiplier that benefits WAM production too).
- The two **hired** columns always show *both* Tycoon scenarios regardless of the flag —
  that side-by-side is the whole point of "are hires worth it, and does Tycoon flip them?"
- All four reuse `computeFwIndustry` / `computeHiredIndustry` unchanged, so the Advisor stays
  consistent with golden-parity and never forks the profit math.

### Convert vs. sell raw RM (per industry, RM-unit basis)

For each of the four industries, on a per-1-RM-unit basis:

- **Sell raw** = `rmPrice × (1 − VAT/100)` — value realized selling one RM unit on the market.
- **Convert** = `(sessionRevenue − sessionTaxes) ÷ sessionRmConsumed` — value the factory adds
  per RM unit consumed (revenue already net of VAT; uses the best-earning quality's session).
  The cost to *produce* the RM is identical in both paths and cancels out of the marginal
  decision.
- **Verdict**: convert if convert > sell-raw, else sell raw; show the Δ.

The "best quality" used for an industry's convert verdict is that industry's top-ranked
quality by net/WAM (fw) or net/hired-with-Tycoon (hired).

### Headline recommendation

Derived purely from the table + RM analysis:
- Top row by net/WAM/day → "Best for your WAM: 🔫 Weapons Q7 → +X CC/company/day".
- Hired viability: list which (if any) qualities have a positive hired column, distinguishing
  no-Tycoon vs Tycoon-only.
- Per-industry RM verdict summary (sell raw vs convert + Δ).

## UI

New `src/views/AdvisorView/`:

- **`AdvisorView.tsx`** — container; pulls everything from a new `useAdvisor()` facade hook.
- **`RecommendationHeadline.tsx`** — the 🏆 summary card (top WAM pick, hired-viability verdict,
  RM verdicts).
- **`ProductionTable.tsx`** — sortable table, one row per (industry × quality); columns as
  above. Default sort: net/WAM/day descending (Houses/Aircraft, lacking WAM, fall to the
  bottom under this sort but carry real values in the hired columns — a footnote explains).
  Rows for qualities the user owns are highlighted and badged `×N`. Pattern mirrors
  `OptimizerView/ResultsTable`.
- **`RmStrategyPanel.tsx`** — four convert-vs-sell cards with verdict + Δ.
- A location/price bar showing the shared location and a **"↻ sync all prices"** button that
  runs the existing per-industry price sync across all four modules through the bounded pool
  in `services/concurrency.ts`.

All profit math stays in `src/calc/advisor.ts`; components only render. No `innerHTML` —
standard React (the mockup's `innerHTML` was throwaway).

## Files

**New**
- `src/calc/advisor.ts` — pure: `computeAdvisor(state) → AdvisorReport` (ranked rows + RM
  verdicts + headline-ready fields). Unit-tested.
- `src/views/AdvisorView/{AdvisorView,RecommendationHeadline,ProductionTable,RmStrategyPanel}.tsx`
- `src/i18n/locales/en/advisor.json` (new namespace) — all Advisor strings.

**Modified**
- `src/state/types.ts` — add `'advisor'` to the `activeModule` union.
- `src/state/hooks.ts` — add `useAdvisor()` facade.
- `src/App.tsx` — route `activeModule === 'advisor'` → `AdvisorView`.
- `src/components/TabBar.tsx` — add the Advisor tab.
- `src/i18n/*` — register the `advisor` namespace; run `scripts/gen-i18n-resources.mjs` so
  all 25 locales get the namespace (English authored; others fall back to EN keys initially).
- `CLAUDE.md` / `README.md` — document the new tab.

## Edge cases

- **Missing prices** for an industry (user hasn't synced): that industry's rows render greyed
  with a "sync prices" hint; the "sync all prices" button resolves it. The headline ignores
  industries without prices and notes if any were skipped.
- **Negative-everywhere hired**: expected and informative — the hired columns simply show red;
  the headline states hires aren't viable.
- **No owned factories at all**: the Advisor still works (it's a potential analysis); the
  `×N` badges are just absent.
- **Houses/Aircraft**: `—` in the WAM column; never crash on the missing WAM path.

## Testing

- `src/calc/advisor.test.ts` — fixture-based: feed a known `AppState`, assert ranked order,
  per-column values, RM verdicts, and headline selection. Include a Tycoon-flips-hired case
  and a missing-prices case.
- Reuse existing golden snapshot indirectly: Advisor must call the unchanged
  `computeFwIndustry`/`computeHiredIndustry`, so a regression there is already caught by
  `calc/golden.test.ts`.
- Component smoke tests (Testing Library) for `ProductionTable` sorting and the headline.
- i18n test already asserts every namespace loads for every locale — the new `advisor`
  namespace is covered once registered.

## Out of scope (deliberate)

- Buy-vs-grow RM sourcing (stays in the per-industry views; user excluded it from the Advisor).
- Energy/WAM-budget modeling (user has surplus energy; 1 WAM = 1 company/day).
- Suggesting *what to build/buy next* or full portfolio optimization (a future, separate
  feature — this Advisor only evaluates per-unit potential of the current configuration).
- Any LLM/AI component — the recommendation is fully deterministic.
