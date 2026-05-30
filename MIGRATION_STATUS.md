# React Migration — Status / Handoff

**Branch:** `feat/react-migration` (do NOT merge — reserved for your approval).

## ⚠️ Harness caveat

Bash/Read **output capture failed intermittently** all session (commands run;
stdout returns empty for minutes at a time, then recovers). `Write`/`Edit`
always work. Rule I adopted after a commit was correctly blocked for an
over-optimistic message: **commit only what I've actually seen pass.** So
progress is real but paced by when output is up.

## Verify first

```bash
cd ~/Projects/erepublik/calculator
npm install
npx tsc --noEmit     # expect clean
npm test             # expect all src/**/*.test green (incl. 600-input golden parity)
npm run build        # tsc --noEmit && vite build → dist/
```

## ✅ Committed & verified green when committed

| Commit | Scope | Evidence |
|--------|-------|----------|
| `e1ac4da` | T1 scaffold (Vite 5 + React 19 + TS + Vitest); legacy → `index.legacy.html`; plan | build green |
| `2ed4480` | T2–T6 `src/data` + `src/calc` + golden parity | 19 tests pass |
| `c87f2cf` | T7–T9 state (types/blank/reducer/persistence/Context/hooks) + tsc fixes | tsc clean; 34 tests |
| `4c81178` | T10 components (Counter/IconImage/StarRating/FactoryCard) + `calc/hiredView` | tsc clean; +tests |
| `9446255` | useHiredView + holdingFactoryCell facade hooks | tsc clean; 38 tests |

Math is locked by `src/calc/golden.test.ts` (600 inputs == legacy `holdingsCalc.mjs`).

## 📝 T11 IndustryView — WRITTEN, tsc-clean, tests NOT yet seen green

Files written (`src/views/IndustryView/`): `IndustryView.tsx`, `SummarySidebar.tsx`,
`ModifiersPanel.tsx`, `PricesPanel.tsx`, `icons.ts`, `IndustryView.test.tsx`.
- **`npx tsc --noEmit` = 0 errors** (confirmed this session).
- The 4 component tests in `IndustryView.test.tsx` were written but I could not
  capture their run output before it went down again, so they are **uncommitted**
  pending a green run. Run `npm test src/views/IndustryView` first; if green,
  commit T11.
- Known simplification to review: per-card single-session output omits tycoon/WAM
  at the *card* level (those fold into the totals via the calc views) — matches
  legacy card display intent but worth an eyeball during review.

## ⏭️ Remaining

- **T11 finish**: confirm IndustryView tests green → commit. Wire it into
  `App.tsx` behind a TabBar (App is still the placeholder `<h1>`), smoke-test in
  browser (`npm run dev` + `node server.js` for `/proxy`).
- **T12 HoldingsView**: `src/views/HoldingsView/*` — toolbar (new/rename/switch/
  clear), per-industry sections (reuse FactoryCard + `holdingFactoryCell` +
  `useHoldings.setCell`), summary via `useHoldingSummary`. Preserve manual
  section collapse across re-renders (legacy commit 428dcc2). Source: app.js
  1538–1818.
- **T13 services**: `src/services/{proxy,livePrices,regions}.ts` + fixtures +
  parser tests; then wire the (currently no-op) Sync buttons + country/region
  selects. Source: app.js 628–944, 2421–2700. **Gotcha:** country field is
  `country.regions` (number[]).
- **T14**: server.js → serve `dist/`; **parity-check before deleting**; swap
  golden test's legacy import to a committed snapshot; remove app.js/
  holdingsCalc.*/index.legacy.html; update CLAUDE.md + README.
- **T15**: leave merge/PR to you.

Plan (full code): `docs/superpowers/plans/2026-05-30-react-migration.md`.
Spec: `docs/superpowers/specs/2026-05-30-react-migration-design.md`.

## 🔒 Guardrails honored

- Isolated on `feat/react-migration`; main untouched; no PR/merge.
- No false-success claims in committed history.
- Pre-existing files (`styles.css`, `server.js`, `app.js`, `travelData.js`,
  `holdingsCalc.*`) intact for the parity cutover.
