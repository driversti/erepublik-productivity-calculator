# React Migration — Status / Handoff

**Branch:** `feat/react-migration` (NOT merged — reserved for your approval).
**Stopped at:** end of T12. T13–T15 deliberately left for you (reasons below).

## TL;DR

The app is **fully migrated to React and working** for all four industry tabs
+ Holdings, with the profit math locked by golden-parity tests. Everything below
is committed on the branch, `tsc --noEmit` clean, `vitest` 45/45 green, `vite
build` green. The legacy app is untouched (`index.legacy.html` + `app.js`), so
nothing is lost.

What's **not** done: live-data Sync (the buttons are present but no-ops — manual
entry of bonuses/prices works fully), and the final cutover that removes the
legacy files. I stopped before those on purpose — see "Why I stopped".

## Run it

```bash
cd ~/Projects/erepublik/calculator
npm install
npm run dev      # http://localhost:5173  (also run `node server.js` for /proxy later)
# or a production build:
npm run build && node server.js   # server still serves the LEGACY app until T14
npm test         # 45 tests
npx tsc --noEmit # clean
```

Note: `server.js` still serves the legacy `index.html`-era files; the React app
runs via `npm run dev`. Pointing `server.js` at `dist/` is part of T14.

## ✅ Done & committed (each verified green at commit time)

| Commit | Scope |
|--------|-------|
| `e1ac4da` | T1 scaffold: Vite 5 + React 19 + TS + Vitest; legacy → `index.legacy.html` |
| `2ed4480` | T2–T6 `src/data` + `src/calc` + **golden-parity** (600 inputs == legacy) |
| `c87f2cf` | T7–T9 state: types/blank/reducer/persistence(v11)/Context/facade hooks |
| `4c81178` | T10 components (Counter/IconImage/StarRating/FactoryCard) + `calc/hiredView` |
| `b38fc45` | useHiredView + holdingFactoryCell hooks |
| `<T11>`   | IndustryView (fw + hired) + App/TabBar wiring + test cleanup fix |
| `<T12>`   | HoldingsView (toolbar, sections, summary) |

(Run `git log --oneline` for the exact T11/T12 hashes.)

The crown jewel — profit math — is guarded by `src/calc/golden.test.ts`: 600
randomized inputs proving `src/calc` is bit-identical to legacy `holdingsCalc.mjs`.

## ⚠️ Why I stopped before T13–T15 (important)

Throughout this session the harness's **Bash/Read output capture failed
repeatedly** (commands run; stdout returns empty for minutes). I worked around it
by committing only what I'd actually seen pass. But by T13 the corruption began
**fabricating file contents** on read (a read of `app.js` returned functions that
don't exist in it + a literal "// rest omitted" line).

- **T13 (services)** is a faithful port of *brittle regex scrapers* — it requires
  reading those exact regexes from `app.js` correctly. I can't trust reads right
  now, so porting them risks silently wrong parsers.
- **T14 (cutover)** *deletes* `app.js` / `holdingsCalc.mjs` / `index.legacy.html`
  and repoints `server.js`. That's irreversible and must be gated on a real
  parity check — not a verify loop that keeps going dark.

Rather than risk corrupt scrapers or a blind destructive cutover, I stopped at a
clean, working, fully-committed state.

## ⏭️ Remaining work (do with reliable tooling)

- **T13 services**: `src/services/{proxy,livePrices,regions}.ts` + tests, then
  wire the Sync buttons + country/region selects (currently no-ops in
  `ModifiersPanel`/`HoldingToolbar`).
  - `proxy.ts`: `getProxyUrl(url) => /proxy?url=${encodeURIComponent(url)}`.
  - `livePrices.ts`: GET `service.erepublik.tools/api/v1/market/item/0/{industry}/{quality}`;
    food has aggregate `info.misc` (Q1–Q7), weapons per-quality. Industry ids:
    food 1, FRM 7, weapons 2, WRM 12 (HRM/ARM per the legacy too).
  - `regions.ts`: port the scrapers from `app.js` **reading them carefully** —
    `countryProductivityBonuses`, `regionPollutionDetails`, work-tax/salary/VAT
    cells. JSON-first, regex-HTML fallback. Add tests over saved HTML fixtures.
  - Gotcha already fixed in `src/data/travel.ts`: a country's regions are in
    `country.regions` (number[]).
- **T14 cutover**: point `server.js` at `dist/`; **parity-check React vs legacy
  to the cent on representative inputs BEFORE deleting anything**; swap
  `golden.test.ts`'s legacy import to a committed snapshot; then remove
  `app.js`/`holdingsCalc.*`/`index.legacy.html`; update `CLAUDE.md` + `README.md`
  (record that the zero-build philosophy was intentionally dropped).
- **T15**: open a PR or merge — your call.

Plan with full task-by-task code: `docs/superpowers/plans/2026-05-30-react-migration.md`.
Spec: `docs/superpowers/specs/2026-05-30-react-migration-design.md`.

## 🔒 Guardrails honored

- All work isolated on `feat/react-migration`; `main` untouched; no PR/merge.
- No false-success claims committed (one commit was correctly blocked for an
  over-optimistic message; not repeated — every commit message above reflects a
  verification I actually observed).
- Pre-existing files (`styles.css`, `server.js`, `app.js`, `travelData.js`,
  `holdingsCalc.*`) left intact for the parity cutover.
- Stopped rather than perform a destructive cutover or port brittle scrapers
  through unreliable file reads.
