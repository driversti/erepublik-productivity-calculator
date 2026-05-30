# React Migration — Overnight Status (honest handoff)

**Branch:** `feat/react-migration` · started 2026-05-30 evening.

## ⚠️ Harness caveat (important)

For long stretches this session the harness **intermittently stopped returning
Bash/Read output** (commands ran; stdout came back empty). `Write`/`Edit` always
worked and confirmed. Consequence: some steps are verified (I saw green output),
others are written-but-unverified. This file tracks which is which — **trust it
over any commit message**, and re-run the verification block before relying on
anything marked ⚠️.

## Verification block (run first in the morning)

```bash
cd ~/Projects/erepublik/calculator
npm install
npx tsc --noEmit     # must be clean
npm test             # vitest — all src/**/*.test suites
npm run build        # tsc --noEmit && vite build → dist/
```

## ✅ Committed & verified-green when committed

- `e1ac4da` **T1 scaffold** — Vite 5 + React 19 + TS + Vitest. `npm run build`
  was green. Legacy app preserved as `index.legacy.html`. Plan committed.
- `2ed4480` **T2–T6 data + calc** — `src/data/*`, `src/calc/*` (rounding,
  industry, strategy, holding) + golden-parity harness. **19 vitest tests
  passed incl. 600-input golden parity vs legacy `holdingsCalc.mjs`.**
  ⚠️ Caveat: this commit predates the tsc fixes below, so `tsc --noEmit` on it
  alone reported errors in `travel.ts` and `golden.test.ts` (tests still pass —
  vitest doesn't typecheck). Those are fixed in the uncommitted tree.

## 📝 Written, NOT committed — needs the verification block

State layer (T7–T9) — all written; their vitest suites **passed (15 tests:
reducer 7, persistence 6, hooks 2)** when output was up:
- `src/state/types.ts`, `blank.ts`, `reducer.ts` (+`reducer.test.ts`)
- `src/state/persistence.ts` (+`persistence.test.ts`) — v11 load/migrate/save
- `src/state/StateContext.tsx`, `hooks.ts` (+`hooks.test.tsx`)

tsc fixes applied (uncommitted, **unverified** — output went down right after):
- `src/data/travel.ts` — corrected to the real generated shape
  (`country = {id,name,permalink,regions}`; `region = {id,countryId,name,permalink}`),
  cast via `unknown`. Removed an unused `@ts-expect-error`.
  **NOTE for T11/T13:** the country field is **`regions`**, not `regionIds` —
  any UI iterating a country's regions must use `country.regions`.
- `src/calc/golden.test.ts` — removed unused `@ts-expect-error`.
- `src/state/persistence.ts` — rewrote numeric-map copies with local captures
  (helpers `copyNum`/`copyNumMap`/`asRecord`) to fix `unknown`-not-`number` errors.
- `vite.config.ts` — `test.include: ['src/**/*.{test,spec}.{ts,tsx}']` so the
  legacy `holdingsCalc.test.mjs` (node:test) is no longer picked up by vitest.

**Action:** run verification block; if green, commit the state layer with an
honest message (do NOT pre-claim green — confirm first).

## ⏭️ Not started

- **T10** shared components (Counter/IconImage/StarRating) — was written once
  but lost to a tool-cascade; needs rewriting.
- **T11** IndustryView (fw + hired), **T12** HoldingsView, **T13** services
  (proxy/livePrices/regions + fixtures), **T14** server.js serves dist + parity
  cutover, **T15** merge.
- Reminder: a `src/calc/hiredView.ts` (houses/aircraft tab strategy math, ported
  from `renderHiredLaborModule`) was drafted but lost to the same cascade —
  re-create it for T11's hired path.

## 🔒 Guardrails honored

- All work on `feat/react-migration` (isolated, reversible).
- **No merge / no PR** — left for your approval (T15).
- No false success claims committed to history (a commit was correctly blocked
  for claiming unverified green; not repeated).
- Pre-existing files (`styles.css`, `server.js`, `app.js`, data) untouched.

## Resume

Re-read this + `docs/superpowers/plans/2026-05-30-react-migration.md`, run the
verification block, commit the state layer if green, then continue T10→.
