# React Migration — Status / Handoff

**Branch:** `feat/react-migration` (NOT merged — reserved for your approval).
**State:** Functionally complete. Only the destructive final cutover + merge remain.

## TL;DR

The calculator is **fully rewritten in React** — all four industry tabs (food,
weapons, houses, aircraft) + Holdings, with live price/modifier Sync wired in and
profit math locked by a 600-input golden-parity suite. `npm run build` + `node
server.js` serves the React app from `dist/` on :8080. The legacy vanilla app is
**still on disk** (`app.js`, `holdingsCalc.mjs`, `index.legacy.html`) as a
rollback + parity safety net — nothing is lost.

## Run

```bash
cd ~/Projects/erepublik/calculator
npm install
npm run dev       # http://localhost:5173 (HMR) — run `node server.js` too for /proxy
# production:
npm run build && node server.js   # serves dist/ + /proxy on http://localhost:8080
npm test          # 58 tests
npx tsc --noEmit  # clean
```

## ✅ Done & committed (each verified green at commit time)

| Scope | Status |
|-------|--------|
| T1 scaffold (Vite 5 + React 19 + TS + Vitest); legacy → `index.legacy.html` | ✅ |
| T2–T6 `src/data` + `src/calc` + **golden parity** (600 inputs == legacy) | ✅ |
| T7–T9 state: types/blank/reducer/persistence(v11)/Context/facade hooks | ✅ |
| T10 shared components (Counter/IconImage/StarRating/FactoryCard) + `hiredView` | ✅ |
| T11 IndustryView (fw + hired) + App/TabBar | ✅ |
| T12 HoldingsView (toolbar, sections, summary, location bar) | ✅ |
| T13 services (proxy/livePrices/regions) + **Sync wired** into both views | ✅ |
| T14a `server.js` serves `dist/` + CLAUDE.md/README updated (non-destructive) | ✅ |

Total: **58 vitest tests**, `tsc --noEmit` clean, `vite build` green, and a curl
of `/` against `node server.js` returns the React app (`#root` + `/assets`).

Profit math is guarded by `src/calc/golden.test.ts` — 600 randomized inputs prove
`src/calc` is bit-identical to the legacy `holdingsCalc.mjs`.

## ⏭️ Remaining — deliberately left for you (destructive / your call)

### T14b — final cutover (irreversible; do after a hand parity check)
1. **Parity check.** With `npm run dev` (React) and the legacy app
   (`index.legacy.html` served from repo root, or git-stash the dist repoint),
   compare headline net profit + KPIs to the cent on ~3 setups (all-food Q7×10
   WAM+tycoon; a mixed holding; houses with hired workers). The calc golden tests
   already prove the math; this confirms the UI wiring.
2. **Swap the golden test's legacy import** to a committed snapshot
   (`src/calc/__fixtures__/golden-snapshot.json`, generated from a legacy run) so
   the parity guard survives without `holdingsCalc.mjs`.
3. `git rm app.js holdingsCalc.mjs holdingsCalc.test.mjs index.legacy.html`.
4. Prune the now-stale "legacy architecture" sections from `CLAUDE.md`.

### T15 — merge (your call)
Open a PR or fast-forward `main`. I did not merge — per your workflow + the
"always ask before merging" guardrail.

## Why I stopped here

T14b deletes files and removes the parity safety net; T15 is an outward step you
reserved. Both warrant your sign-off, especially since the harness's file reads
were intermittently corrupting this session (I verified every commit against
fresh `tsc`/`vitest`/`build` runs and committed only confirmed-green work). The
app is in a clean, working, fully-committed state — safe to demo, safe to roll
back.

Plan: `docs/superpowers/plans/2026-05-30-react-migration.md`.
Spec: `docs/superpowers/specs/2026-05-30-react-migration-design.md`.
