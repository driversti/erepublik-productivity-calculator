# React Migration — Status / Handoff

**Branch:** `feat/react-migration` (do NOT merge — that's reserved for your approval).

## ⚠️ Why this run paused

The harness's Bash/Read **output capture failed repeatedly** this session
(commands run; their stdout returns empty — intermittently for minutes at a
time). `Write`/`Edit` always work. I made a rule for myself after a commit was
correctly blocked for an over-optimistic message: **commit only what I've seen
pass.** When output went down for good, I stopped committing UI I couldn't
typecheck/test rather than risk broken, unverifiable code in history. The whole
non-UI foundation is committed and was green when committed.

## Verify first (when output is reliable)

```bash
cd ~/Projects/erepublik/calculator
npm install
npx tsc --noEmit     # expect: clean
npm test             # expect: all src/**/*.test green (calc incl. 600-input golden parity)
npm run build        # tsc --noEmit && vite build → dist/
```

## ✅ Committed & verified green when committed

| Commit | Scope | Evidence seen |
|--------|-------|---------------|
| `e1ac4da` | T1 scaffold (Vite 5 + React 19 + TS + Vitest); legacy → `index.legacy.html`; plan | `npm run build` green |
| `2ed4480` | T2–T6 `src/data` + `src/calc` (rounding, industry, strategy, holding) + golden parity | 19 tests pass |
| `4f9be62` | T7–T9 state (types/blank/reducer/persistence/Context/hooks) + tsc fixes | tsc clean; 34 tests pass |
| `3471…`  | T10 components (Counter/IconImage/StarRating/FactoryCard) + `calc/hiredView.ts` | tsc clean; 6 new tests pass |

The math is the crown and it's **locked by `src/calc/golden.test.ts`** (600
randomized inputs proving `src/calc` == legacy `holdingsCalc.mjs`).

## 📝 Uncommitted (in working tree) — needs the verify block

- `src/state/hooks.ts` — **rewritten wholesale** to add `useHiredView` (houses/
  aircraft tab) and `holdingFactoryCell` helper, alongside the existing
  `useIndustryView`/`useHoldings`/`computeHoldingIndustry`. Written via `Write`
  (couldn't capture the tsc result afterward). If tsc is clean, commit it as part
  of T11.

## ⏭️ Remaining (need reliable read/verify loops — do NOT do blind)

- **T11 IndustryView** (fw + hired tabs): `src/views/IndustryView/*` —
  `IndustryView.tsx`, `SummarySidebar.tsx`, `ModifiersPanel.tsx`,
  `PricesPanel.tsx`, `icons.ts`, `IndustryView.test.tsx`. Port the markup from
  `index.legacy.html` lines 44–320 and the display formatting from `app.js`
  `render()` / `renderHiredLaborModule`. **Gotcha:** country regions field is
  `country.regions` (number[]), not `regionIds`.
- **T12 HoldingsView**: `src/views/HoldingsView/*` — toolbar (new/rename/switch/
  clear), per-industry sections (reuse FactoryCard), summary via
  `useHoldingSummary`. Preserve manual section collapse across re-renders
  (legacy commit 428dcc2). Source: `app.js` 1538–1818.
- **T13 services**: `src/services/{proxy,livePrices,regions}.ts` + HTML/JSON
  fixtures + parser tests. Source: `app.js` 628–944 (scrapers) and 2421–2700
  (prices). Then wire the Sync buttons (currently no-ops in the views).
- **T14**: point `server.js` at `dist/`; **parity-check before deleting
  anything**; swap `golden.test.ts`'s legacy import to a committed snapshot;
  then remove `app.js`/`holdingsCalc.*`/`index.legacy.html`; update CLAUDE.md +
  README (record that zero-build was intentionally dropped).
- **T15**: leave merge/PR to the user.

Plan with full code: `docs/superpowers/plans/2026-05-30-react-migration.md`.
Spec: `docs/superpowers/specs/2026-05-30-react-migration-design.md`.

## 🔒 Guardrails honored

- All work isolated on `feat/react-migration`; main untouched; no PR/merge.
- No false-success claims in committed history.
- Pre-existing files (`styles.css`, `server.js`, `app.js`, `travelData.js`,
  `holdingsCalc.*`) left intact for the parity cutover.
