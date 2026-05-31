# Region Profit Optimizer — Design Spec

**Date:** 2026-05-31
**Status:** Design — pending implementation plan (implementation deferred by user)
**Topic:** A new "Optimizer" tab that finds the most profitable region in the
world for the player's current factory setup, by combining offline region
bonuses with live country economics (average salary, work tax, VAT, country
bonus).

## 1. Goal & Scope

Given the player's **current factory configuration** for one industry (company
counts per quality, plantations/RM, offered salary, tycoon, WAM, market prices),
rank regions by **estimated daily net profit** and surface the best place to
relocate.

The driving insight (player's own): work tax is a function of the country's
**average salary**, so the most profitable region is a trade-off between
**high production bonus** (country + region) and **low salary/tax/VAT**. The app
already computes net profit per location; this feature sweeps that computation
across many candidate locations and ranks them.

### Core formula (already implemented, reused verbatim)

Per the existing pure calc (`src/calc/industry.ts`):

```
multiplier = max(0, 1 + countryBonus/100 + regionBonus/100 + (tycoon?0.2:0) − pollution/100)
output     = baseOutput × multiplier × sessions
revenue    = output × price × (1 − vat/100)
workTax    = (WAM company-sessions) × (workTaxRate/100) × averageSalary
net        = revenue − rmNetCost − workTax − salary
```

Every term except `regionBonus` (offline) and `countryBonus/averageSalary/
workTax/vat/pollution` (live, per country/region) is already part of the user's
module state. The optimizer **builds the input set per candidate region and calls
the existing `computeFwIndustry` / `computeHiredIndustry`** — no new profit math,
golden-parity untouched.

### Out of scope

- **No userscript / browser extension** — the user ruled out anything requiring
  an install (Approach A below is rejected).
- **No bulk per-region pollution** — hundreds of requests; pollution is fetched
  only for the top-N finalists (Phase 3).
- **"Apply this location" button** (write a result back into the module) — nice
  future addition, deferred (YAGNI for v1).
- **Per-user historical tracking** of region economics.

## 2. Decisions (locked via brainstorming)

| Topic | Decision |
|-------|----------|
| Scan scope | Pre-filter regions by offline bonus first — do **not** scan all ~574 regions |
| Bonus filter | **Threshold + ceiling cap**: `regionBonus ≥ threshold` AND at most N regions (default cap ~60), so a low threshold can't accidentally fan out to 200 requests |
| Pollution | Two-phase: rank at **pollution = 0**, then fetch real pollution for **top-N finalists** (default 15) and re-rank |
| What varies | Only **location**; the player's current company config, prices, salary, tycoon, WAM are held constant |
| Industry | The Optimizer has **its own industry selector**; it reads that module's saved config from state |
| UI placement | A **separate top-level "Optimizer" tab** (alongside Holdings) |
| Result unit | **Top regions worldwide**, each row showing region + owning country + key drivers + net + Δ-vs-current |
| **Data transport** | **Primary B** (browser-direct to `service.erepublik.tools`); **fallback C** (server-side shared cache) with the server run behind a **VPN** to avoid IP bans. **Approach A (userscript) rejected.** |

> **UPDATE 2026-05-31 (post-recon, RESOLVED):** The §7 recon spike was run from the
> GCP VM. Findings: (a) `service.erepublik.tools` sends **no CORS header** →
> **Approach B (browser-direct) is dead**; (b) a GCP datacenter IP fetches
> erepublik.com economy pages fine (real HTML, no Cloudflare challenge). The app
> now runs on GCP (prod moved off the home server), so **the path is server-side
> fetch through the existing `/proxy`** — which already egresses from the GCP IP,
> satisfying both "works against Cloudflare" and "home IP hidden". No userscript,
> no new server endpoint, no separate cache required for v1: the client calls
> `/proxy?url=<economy page>` and parses with the existing `services/regions.ts`
> parsers. Client-side `localStorage` (the state slice) caches results so re-scans
> don't refetch. Tasks 1 and the B/C branch in Task 5 collapse accordingly.

## 3. The data-transport problem (central constraint)

`erepublik.com` sends no CORS headers, so the browser cannot read its HTML
directly — which is why today's `/proxy` makes the request **server-side** (the
host's IP). A world sweep is ~tens of requests **per user**, which risks getting
the server's IP banned. The requests must originate from the **user's IP**.

Approaches considered:

- **A — Userscript + relay** (the `erep-hq` pattern): a Tampermonkey script on
  erepublik.com fetches from the user's browser/IP and relays JSON to the app.
  **REJECTED** — requires the user to install something.
- **B — Browser-direct to `service.erepublik.tools`** *(primary)*: if the Tools
  site exposes the needed economics as JSON **with an open CORS header**, the app
  fetches it **directly from the browser** (user's IP), no proxy, no install.
  Tools.com is a community data site built to be queried; the app already uses its
  market API. **Requires a recon spike** (§7) to confirm endpoints + CORS.
- **C — Shared server-side cache** *(fallback)*: the server scrapes erepublik.com
  **once per refresh window** (e.g. daily) and serves the cached dataset to all
  users. Requests become O(countries)/day total instead of per-user, and the
  server is run **behind a VPN** so a ban hits a disposable exit IP, not the host.
  This still uses the existing HTML parsers in `services/regions.ts`.

### Transport abstraction

To keep the optimizer independent of how data arrives, introduce a small
`CountryEconomySource` interface:

```ts
interface CountryEconomySource {
  // For the given industry, return economics for the requested countries.
  getCountryEconomics(industry: IndustryKey, countryKeys: string[])
    : Promise<Map<string, CountryEconomics>>;
  // Real pollution for specific regions (Phase 3).
  getRegionPollution(industry: IndustryKey, regionIds: number[])
    : Promise<Map<number, Record<number, number>>>;
}

interface CountryEconomics {
  countryBonus: number;   // per-industry productivity bonus
  averageSalary: number;
  workTaxRate: number;
  vat: number;            // per-industry
}
```

Two implementations:
- `ToolsApiSource` — Approach B, browser-direct `fetch` to erepublik.tools.
- `CachedProxySource` — Approach C, reads `/api/economy` (server cache populated
  by the existing HTML parsers behind a VPN).

The view picks the source (B first; on failure or missing data, fall back to C).
The optimizer calc never sees the transport.

## 4. Data flow — four phases

```
Phase 0 — Bonus pre-filter            (OFFLINE, instant, 0 requests)
  regionBonus(R, industry) = Σ bonus of that industry's resources in R
  (from regionResources.ts; same semantics as parseRegionBonus)
  keep R where regionBonus ≥ threshold, then cap to ≤ maxCandidates by bonus desc
  → candidates[]  (default cap ~60)

Phase 1 — Country economics           (LIVE, only owners of candidates)
  ownerKeys = distinct candidates[].currentCountry
  source.getCountryEconomics(industry, ownerKeys)
  → typically 10–25 countries, NOT all ~70

Phase 2 — Rank at pollution 0         (OFFLINE compute, 0 requests)
  for each candidate R with known owner economics:
    input = { ...userConfig, regionBonus, ...ownerEconomics, qualityPollution: {0..} }
    net   = computeFwIndustry|computeHiredIndustry(input).net
  sort by net desc → take top-N (default 15)

Phase 3 — Pollution refine            (LIVE, top-N only)
  source.getRegionPollution(industry, topN[].id)
  recompute net with real pollution → re-sort → final table
```

`regionBonus` (Phase 0) is fully offline, so the filter is free regardless of the
chosen transport. Only Phases 1 and 3 hit the network, and both are minimized by
the Phase-0 filter and the top-N cap.

## 5. Components & files

| File | Purpose |
|------|---------|
| `src/calc/optimizer.ts` | **PURE.** `rankRegions(config, economicsByCountry, candidates, industry, pollutionByRegion?) → RankedRegion[]`. Builds the calc input per region, dispatches to `computeFwIndustry`/`computeHiredIndustry`, returns sorted results. Unit-tested. |
| `src/calc/regionBonus.ts` (or add to optimizer) | `regionBonusFor(region, industry)` + `selectCandidates(regions, industry, {threshold, maxCandidates})` — Phase 0. Pure. |
| `src/services/economySource.ts` | `CountryEconomySource` interface + factory that picks B→C. |
| `src/services/toolsEconomy.ts` | Approach B: browser-direct erepublik.tools client + parsers. |
| `src/services/cachedEconomy.ts` | Approach C: client for the server cache endpoint. |
| `src/services/regions.ts` | *(reuse)* existing HTML parsers feed the Approach-C server cache. |
| `server.js` | *(fallback only)* add `/api/economy` shared-cache endpoint (scrape-once, VPN-fronted). |
| `src/views/OptimizerView/` | Tab UI: industry selector, threshold + cap controls, "Scan" button, phase progress, ranked results table, current-location baseline row. |
| `src/state/` | `optimizer` slice (cached economics + last results + params) reached via `useOptimizer` facade hook; economics cached to `localStorage` with `fetchedAt`. |
| `App.tsx`, `TabBar` | Register the new tab. |
| `src/i18n/locales/en/common.json` | UI strings (EN first; other locales fall back to EN until translated). |

## 6. Results table

Baseline header row = the player's **current** location net (for reference).
Per result row:

| Rank | Region | 🏳 Country | regionBonus | countryBonus | avg salary | work tax | VAT | **Net / day** | Δ vs current |

Sorted by Net desc. Phase-3 finalists show real pollution; the rest are clearly
marked "pollution = 0 (estimate)".

## 7. Recon spike (must run FIRST in implementation)

Before committing to Approach B, verify against `service.erepublik.tools`:

1. Is there an endpoint exposing **country economics** — per-industry country
   bonus, average salary, work tax, VAT?
2. Is there an endpoint exposing **region** bonus and/or **pollution**?
3. Do those endpoints send `Access-Control-Allow-Origin` permitting a browser
   `fetch` from the app's origin (today even the market API is routed through
   `/proxy` — confirm whether that was a CORS necessity or just legacy uniformity)?

If (1)+(3) hold → Approach B is the data source. If not → Approach C (server cache
+ VPN) using the existing `services/regions.ts` parsers. Phase 0 (offline bonus
filter) and the calc are identical either way, so the spike does not block the
bulk of the work.

## 8. Edge cases

- **Stale `currentCountry`** — regions change owners in war; the offline snapshot
  may lag. Show the snapshot date and pair region→owner from offline data; note
  results are estimates.
- **Country-name join** — `regionResources` country display names vs the
  transport's country keys/ids may differ (e.g. "USA" vs "United States"). Build a
  normalization map; count and surface "N regions skipped (no economics)".
- **Per-country fetch failure** — skip that country's regions, don't fail the run;
  report how many were skipped.
- **Rate limiting / ban** — concurrency cap on Phase 1/3; on Approach C, the VPN
  exit absorbs bans; friendly message on 429.
- **No candidates above threshold** — prompt to lower the threshold.

## 9. Testing

- `optimizer.test.ts` — deterministic ranking on fixture economics; correct
  fw-vs-hired dispatch; pollution 0 vs real changes order as expected.
- `regionBonus.test.ts` — `regionBonusFor` sums the right resources;
  `selectCandidates` honors threshold and cap.
- `economySource` parsers — unit tests over saved fixtures (Approach B JSON and/or
  Approach C HTML), including partial-failure handling.
- Golden-parity untouched: the optimizer only **combines** existing pure functions;
  `calc/golden.test.ts` must stay green.

## 10. Open questions

- Exact erepublik.tools endpoints + CORS (resolved by the §7 recon spike).
- Default `threshold` and `maxCandidates` values — tune after seeing the bonus
  distribution per industry (start: cap ~60, top-N finalists 15).
