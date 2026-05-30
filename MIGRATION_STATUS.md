# React Migration — COMPLETE

**Branch:** `feat/react-migration` · **Status:** ✅ Done. Only the merge to `main`
remains (left for you — git-workflow rule: always ask before merging).

## Summary

The eRepublik Productivity / Profit Calculator has been fully rewritten from the
zero-build vanilla-JS app to **Vite + React 19 + TypeScript**, and the legacy
app has been removed at cutover. All four industry tabs (food, weapons, houses,
aircraft) + Holdings work, with live price/modifier Sync wired in.

## Final verification (all green)

```
npx tsc --noEmit   → 0 errors
npm test           → 58 tests pass (15 files)
npm run build      → green
node server.js     → GET / 200 (built app), /assets/*.js 200, /favicon.svg 200, /proxy host-guard 400
```

Working tree clean (only gitignored `node_modules/` + `dist/` untracked).

## What "done" includes

- **Math parity preserved through deletion.** Before removing `holdingsCalc.mjs`,
  its output over 600 deterministic inputs was frozen to
  `src/calc/__fixtures__/golden-snapshot.json` (generator:
  `scripts/gen-golden-snapshot.mjs`). `src/calc/golden.test.ts` now asserts the
  React calc is bit-identical to that snapshot. The snapshot test was verified
  passing *while the legacy module still existed*, proving equivalence before
  cutover.
- **Legacy removed:** `app.js`, `holdingsCalc.mjs`, `holdingsCalc.test.mjs`,
  `index.legacy.html` deleted (recoverable from git history). `server.js` (now
  ESM) serves `dist/`.
- **Docs updated:** `CLAUDE.md` and `README.md` describe the React/Vite/TS
  architecture; provenance comments in `src/calc/*` still cite the original
  source lines.

## Remaining: merge only

Open a PR or fast-forward `main` — your call. Nothing else is outstanding.

Spec: `docs/superpowers/specs/2026-05-30-react-migration-design.md`
Plan: `docs/superpowers/plans/2026-05-30-react-migration.md`
