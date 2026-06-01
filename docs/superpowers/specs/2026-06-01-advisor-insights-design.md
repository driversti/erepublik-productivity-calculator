# Advisor Insights ("Bottom line" / Підсумок словами) + Liquidity flag

**Date:** 2026-06-01
**Status:** Approved design, ready for implementation plan
**Branch:** `feat/advisor-tab` (the Advisor feature lives here, currently unmerged)
**Builds on:** `2026-06-01-advisor-design.md` (the Advisor tab)

## Problem

The Advisor tab ranks every (industry × quality) and raw-material company by net
profit per work session. It works and produces strong signals — but real users
(validated on Yurii's live account) found the **table alone is not self-explanatory**:

- The numbers require interpretation ("why is my owned Q7 losing money? what do I
  actually do?"). The user asked for the analysis **in words**.
- Different players have different setups and play-styles: Yurii is **WAM-only, no
  hired workers** (so the hire columns are all ~−7800 noise for him); but many
  players are **magnates who hire workers and buy the Tycoon pack**
  (https://wiki.erepublik.com/index.php/Tycoon_pack) for +productivity — for them
  the hire/Tycoon columns are the relevant ones. A hardcoded explanation can't serve
  both; the summary must be **generated per-user from their own data**.
- The calculator only knows the **price you entered**, not market **liquidity/demand**.
  It recommended Weapons Q6 (highest net) — but in Yurii's market **only Q7 sells**,
  so the recommendation was market-blind. Users need a way to say "I can't sell this
  quality" so it's excluded from recommendations.

## Solution

Two additions to the Advisor tab, both **deterministic** (no LLM — same rationale as
the base feature: free, instant, consistent, offline, no API keys):

1. **Insights panel ("Bottom line")** — a pure generator turns the `AdvisorReport`
   + the user's settings + owned companies into a short list of plain-language,
   colour-coded findings that adapt to the player. Rendered above the production table.
2. **Liquidity / "can't sell" flag** — a per-(industry, quality) exclusion the user
   toggles from the table; excluded finished-good qualities are dropped from
   recommendations (topWam, RM convert target, and insights) while still shown
   (greyed, struck) so the user can re-include them.

### Why deterministic, not LLM

The domain is finite (4 industries × {WAM, hire, hire+Tycoon} × {sell raw, convert}
× owned/not). A rules engine over the report covers every case and returns instant,
stable, free results that work offline and in the 25 bundled locales. An optional
"AI explanation" (user-supplied API key) could be added later as an *add-on*, never
the base.

## Part 1 — Insights generator

New pure module `src/calc/advisorInsights.ts`:

```ts
export type InsightSeverity = 'good' | 'warn' | 'bad' | 'info';
export interface Insight {
  type: string;                              // → i18n key advisor:insights.<type>
  severity: InsightSeverity;
  params: Record<string, string | number>;  // interpolation values (numbers raw; view formats)
}
export function generateInsights(report: AdvisorReport, state: AppState): Insight[];
```

The generator stays out of i18n: it returns structured `Insight` objects; the
`InsightsPanel` component maps `type` → an i18n template and formats the numbers.

### "Achievable net" per row (respects play-style)

The core helper decides how the player would actually run a company:

- **fw (food/weapons) row + `state.wamEnabled`** → run via **WAM**: `net = wamNet`, `mode = 'wam'`.
- **otherwise** (hired industry, or WAM disabled) → run via **hire**:
  `net = state.hasTycoon ? hireNetTycoon : hireNet`, `mode = 'hire'`.
- If that value is `null` (e.g. RM company with no hire slots and no WAM) → `mode = 'idle'`, `net = 0`.

A row is **usable** when `hasPrice && !excluded`.

### Insight rules (deterministic, emitted in this order)

| type | severity | When | Example rendered text |
|---|---|---|---|
| `bestAction` | good | The usable row with the highest positive achievable net | "Most profitable to run/build: ⚔️ Weapons Q6 — +681 CC/company/day (WAM)." |
| `mainEarner` | good | Owned usable row with the highest positive **total** (count × achievable net) | "Your main income: ⚔️ WRM mines ×200 — +27,956 CC/day." |
| `lossMaker` | bad | Owned usable rows, `mode='wam'`, achievable net < 0 (one insight per row, worst first, max 3) | "Your 24× Weapons Q7 lose 9,927 CC/day — you'd earn more selling the raw material." |
| `deadCapital` | warn | Owned usable rows, `mode∈{hire,idle}`, achievable net ≤ 0 (grouped into one insight) | "Houses & Aircraft can't be WAMed and lose money when hired — idle/dead capital at your salary." |
| `rmStrategy` | info | One per RM the player **owns** (FRM/WRM/HRM/ARM), using the (liquidity-aware) RM verdict | "Your WRM: better to SELL raw (only Q7 sells, and converting into it loses)." / "Your FRM: better to CONVERT into Q6 (+28/unit)." |
| `hiring` | info | Whole-report hiring viability: none positive / some positive / positive only with Tycoon | "Hiring is unprofitable everywhere at salary 7800 — play WAM-only." OR "Hiring pays in: 🏠 HRM Q5 (with Tycoon)." |
| `caveat` | info | Always last | "Figures use the prices you entered. Mark qualities you can't sell (🚫) to drop them from advice." |

Rules detail:
- `bestAction` is computed across **all** usable rows (owned or not) — it answers
  "what's the most profitable thing to do/build right now." It is suppressed if no
  usable row has positive achievable net.
- `mainEarner` looks only at **owned** rows and uses `count × achievable net`.
- `lossMaker` vs `deadCapital` split on `mode`: a fw company losing under WAM is a
  `lossMaker` (actionable: switch quality / sell RM); a hired company that can't be
  run profitably is `deadCapital`.
- `rmStrategy` per owned RM uses the report's `RmVerdict` — which must become
  **liquidity-aware** (its convert `bestQuality` skips excluded qualities; if no
  usable finished quality remains, the verdict is "sell raw"). The text names the
  convert target quality when converting wins.
- `hiring` reads whether any usable row has positive `hireNet` (no-Tycoon) vs only
  positive `hireNetTycoon`.

### Adapts automatically

- **WAM-only player (Yurii):** `wamEnabled=true`, hires nothing, salary high →
  `bestAction`/`mainEarner` are WAM rows; `hiring` says "unprofitable everywhere";
  houses/aircraft surface as `deadCapital`.
- **Magnate (hires + Tycoon):** `hasTycoon=true`; if hire nets are positive, `hiring`
  lists where, and `bestAction` may be a hire row. Same engine, different sentences —
  purely from the data. No play-style toggle required in v1 (achievable-net already
  keys off `wamEnabled`/`hasTycoon`). A future toggle could refine emphasis.

## Part 2 — Liquidity / "can't sell" flag

- New optional state field `excludedQualities: string[]` — keys `"${industry}:${quality}"`,
  **finished goods only** (RM rows represent selling raw, which is the fallback, so
  they're never "excluded").
- Reducer action `TOGGLE_EXCLUDED_QUALITY { industry, quality }`; facade hook
  `useToggleExcludedQuality()`. Persisted via the existing localStorage loader
  (add to the persisted shape; loader defaults to `[]` for older saves — **no version
  bump needed**, it's an additive optional field).
- `computeAdvisor(state)` reads it and sets `AdvisorRow.excluded`. Excluded rows are:
  - omitted from `topWam`,
  - skipped when choosing each `RmVerdict.bestQuality` (so convert verdicts respect
    liquidity),
  - treated as **not usable** by the insights generator,
  - still **rendered** in the table, greyed + struck-through, with a toggle to re-include.
- `ProductionTable`: each **finished-good** row gets a small toggle (🚫 / "sells?")
  to exclude/include; excluded rows get an `excluded` class. RM rows have no toggle.

## UI

- New `src/views/AdvisorView/InsightsPanel.tsx` — renders `Insight[]` as a "Bottom
  line" card at the top of the Advisor view (above `RecommendationHeadline` or
  replacing its prose role; keep the 🏆 headline as the one-line topper, put the
  fuller bullet list in InsightsPanel). Each insight: severity icon (✅/⚠️/🛑/ℹ️) +
  text. All text via i18n with interpolation.
- `AdvisorView` renders `<InsightsPanel insights={...} />` using a new
  `useAdvisorInsights()` hook (or compute inside `useAdvisor`).
- Styles in `styles/advisor.css`: `.advisor-insights`, severity colour classes,
  `.advisor-table tr.excluded` (greyed + line-through on the product cell), the
  exclude toggle button.

## i18n

- Add an `insights` block to `src/i18n/locales/en/advisor.json` with one key per
  `Insight.type`, using interpolation (`{{product}}`, `{{count}}`, `{{total}}`,
  `{{perDay}}`, `{{quality}}`, `{{delta}}`, `{{salary}}`, `{{mode}}`). Add table keys
  `excludeToggle` / `excludedBadge`. Re-copy EN to all 25 locales (English fallback),
  per the established workflow. No hardcoded UI strings in components.

## Testing

- `src/calc/advisorInsights.test.ts` — fixture-driven, the heart. Cover:
  - WAM-only player (Yurii-like): asserts a `lossMaker` for owned losing fw, a
    `deadCapital` for owned hired, `hiring` = none-positive, `mainEarner` = the big
    owned earner, `bestAction` positive.
  - Magnate fixture: `hasTycoon=true`, salary low enough that a hire row is positive →
    asserts `hiring` lists it and `bestAction`/achievable picks a hire row.
  - Excluded quality: excluding the top finished quality changes `bestAction` and the
    RM `rmStrategy` flips to "sell raw".
- `src/calc/advisor.test.ts` — extend: `excluded` field on rows; excluded rows
  dropped from `topWam` and from `RmVerdict.bestQuality`.
- Reducer test for `TOGGLE_EXCLUDED_QUALITY` + persistence round-trip of
  `excludedQualities`.
- `InsightsPanel` + `ProductionTable` exclude-toggle component smoke tests.
- i18n test already asserts every namespace/locale loads (covers new keys once copied).

## Edge cases

- No usable rows (no prices synced): InsightsPanel shows only the `caveat` + a
  "sync prices" hint (reuse existing). No crash.
- All owned companies losing: `lossMaker`/`deadCapital` fire; `bestAction` still
  suggests the best buildable.
- Excluding every quality of an industry: that industry contributes nothing to
  `bestAction`; its RM verdict becomes "sell raw".
- Liquidity flag must not break golden parity — `computeAdvisor` still only consumes
  the unchanged `computeFwIndustry`/`computeHiredIndustry`.

## Out of scope (deliberate)

- LLM/AI prose (possible later add-on with user API key).
- Modeling true market demand/volume — we only know entered prices; the exclusion
  flag is the manual proxy.
- A separate play-style toggle (the achievable-net helper already adapts via
  `wamEnabled`/`hasTycoon`); revisit only if users want different emphasis.
- Energy/WAM-budget or multi-region portfolio optimization.
