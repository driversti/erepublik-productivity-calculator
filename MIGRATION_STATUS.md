# React Migration — Overnight Status (handoff)

**Branch:** `feat/react-migration` · **Date:** 2026-05-30 (overnight run)

## ⚠️ Important caveat for the morning

Partway through this session the harness **stopped returning Bash/Read output**
(commands ran, but their stdout came back empty). Write operations kept working
and confirming. As a result:

- Everything **committed** below was build/test-verified *before* the output
  failure (I saw green output).
- Everything **written but uncommitted** after that point is a faithful port I
  have high confidence in, but I could **not run `tsc`/`vitest` to prove it**.
  Treat it as "needs a verification pass."

**First thing to run in the morning:**

```bash
cd ~/Projects/erepublik/calculator
npm install        # if needed
npm test           # vitest — calc + golden parity are the key suites
npm run build      # tsc --noEmit && vite build
```

If anything is red, it will almost certainly be a small import/type fix in the
uncommitted `src/calc/*` files — the arithmetic is a line-for-line port of the
already-proven `holdingsCalc.mjs`, guarded by `src/calc/golden.test.ts`.

## ✅ Committed & verified

- `c7a40f9` — **T1 scaffold**: Vite 5 + React 19 + TS + Vitest. `npm run build`
  was green (tsc --noEmit + vite build → dist/). Legacy app preserved as
  `index.legacy.html`. Plan at `docs/superpowers/plans/2026-05-30-react-migration.md`.

## 📝 Written, NOT yet committed (needs verification pass)

- **T2 data layer** — `src/data/{types,buildingIds,industries,travel}.ts` +
  `industries.test.ts`. Real values copied from `app.js:6-79` (note: I caught and
  discarded an earlier draft with fabricated numbers — these are the real ones:
  food/weapon factories all share baseOutput 100/10 with per-quality baseRM;
  aircraft has 5 factories; plantations have no baseRM).
- **T3–T6 calc layer** — `src/calc/{rounding,types,industry,strategy,holding}.ts`
  + tests, **plus `golden.test.ts`** (300+300 randomized inputs vs legacy
  `holdingsCalc.mjs`). This is the migration's correctness anchor.

## ⏭️ Not started (remaining plan tasks)

- T7 state (types/blank/reducer), T8 persistence (v11 load/migrate/save),
  T9 Context + facade hooks, T10 shared components, T11 IndustryView,
  T12 HoldingsView, T13 services, T14 server.js serves dist + parity cutover,
  T15 merge.

## 🔒 Guardrails honored

- All work on `feat/react-migration` (isolated, reversible).
- **No merge to main / no PR** — left for your approval (plan T15).
- `styles.css` and other pre-existing files untouched.

## Resume command

Re-read this file + the plan, run the verification block above, fix any red,
commit T2 and the calc layer, then continue from T7.
