# Kickoff prompt — Advisor Insights (paste this into the new session)

---

Implement the **Advisor Insights ("Bottom line") + per-quality liquidity flag** feature for the eRepublik calculator.

**Read these first (they are self-contained):**
- Spec: `docs/superpowers/specs/2026-06-01-advisor-insights-design.md`
- Plan: `docs/superpowers/plans/2026-06-01-advisor-insights.md`

**Branch:** work on `feat/advisor-tab` (the Advisor tab lives there and is NOT yet merged to main). Run `git checkout feat/advisor-tab` first; do not branch off main.

**How to execute:** use the `superpowers:subagent-driven-development` skill — dispatch a fresh subagent per task from the plan, with a two-stage review (spec-compliance, then code quality) after each task, fixing findings before moving on. Execute all 8 tasks continuously. Keep the calc pure and golden-parity green (`computeFwIndustry`/`computeHiredIndustry` must never be edited; `src/calc/golden.test.ts` is the guard).

**What this builds (one-paragraph context):** The Advisor tab already ranks every (industry × quality) and raw-material company by net profit per work session. This follow-up adds (1) a deterministic, no-LLM **insights generator** (`src/calc/advisorInsights.ts`) that turns the `AdvisorReport` + `AppState` into plain-language, colour-coded findings rendered above the table — adapting to the player's data and play-style (WAM-only vs. magnates who hire + use the Tycoon pack); and (2) a **"can't sell this quality"** exclusion flag so illiquid qualities (e.g. weapons Q6, which has no buyers in some markets) are dropped from recommendations.

**Real-data sanity check (the motivating case — use it to gut-check the result):** a WAM-only player in Lithuania with 24× Weapons Q7 (losing ~−413/day each at WRM=46), 200× WRM Q5 mines (+139/day each, their main income), 29×Q4 + 30×Q5 food plantations, and small idle Houses/Aircraft, salary 7800, no Tycoon. The insights should: flag Weapons Q7 as a loss-maker, name WRM mines as the main earner, mark Houses/Aircraft as dead capital, say hiring is unprofitable everywhere at that salary, and (after the user excludes the illiquid Q6) recommend selling WRM raw rather than converting. A magnate fixture (`hasTycoon=true`, low salary) should instead surface viable hiring.

**Background memory** (already in your auto-memory): `advisor-feature`, `user-gameplay-style`, `user-erep-holdings`. They explain why the design is per-session/WAM-aware and capture the user's real setup.

**Conventions:** TypeScript strict (`npx tsc --noEmit` must pass), all user-facing text in `src/i18n/locales/*` (English authored, copied to all 25 locales via the loop in the plan; never hardcode UI strings), components reach state only through `src/state/hooks.ts` facades. **Ask before any `git push`/PR/merge** (commits per task during implementation are fine — the plan's commit steps are pre-authorized).

**Finish:** after all tasks pass and a final holistic review is clean, use `superpowers:finishing-a-development-branch` to present merge/PR/keep options (the whole Advisor feature, base + insights, is still on `feat/advisor-tab` awaiting a decision).

---
