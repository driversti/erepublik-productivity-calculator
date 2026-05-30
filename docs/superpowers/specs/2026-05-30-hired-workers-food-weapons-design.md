# Hired Workers for Food & Weapons (and Houses fix) — Design

**Date:** 2026-05-30
**Status:** Approved (pending spec review)

## Goal

Let the calculator model **hired employees** on food and weapons **factories and
plantations**, the same way employees already work in the houses module. Each
company is worked once per day by the owner (WAM) **plus** up to a quality-capped
number of hired employees. As part of the same change, **fix the houses module**
so labor is paid from a configurable offered salary rather than the average
salary.

## Background (current state)

- `state.food[q]` / `state.weapons[q]` are plain **numbers** (factory count); each
  factory implies exactly one WAM session. `plantations[q]` is likewise a number.
- Houses already use `{companies, workers}` per quality, with
  `workers ≤ companies × maxEmployees`. Houses currently charge labor as
  `workers × averageSalary` and add **no** separate work tax — this is wrong and
  will be fixed here.
- `averageSalary` and `workTaxRate` are global top-level fields; `workTaxRate`
  feeds the per-session work tax, `averageSalary` is the salary the tax is
  computed against.

## Decisions (from brainstorming)

1. **Production model:** WAM **+** employees. Every company = 1 WAM session +
   up to N hired employees. (Not the houses "employees only" model.)
2. **Salary model:** `averageSalary` is used **only** to compute work tax. A new
   global **`offeredSalary`** field pays hired employees. The owner's WAM costs
   work tax but no salary. This same model is applied to houses.
3. **Salary field scope:** one global `offeredSalary` input for all modules.
4. **UI:** paired `Companies / Workers` counters per card, matching houses.

## Game constants (max employees, owner WAM excluded)

Source: [eRepublik Wiki — Buildings](https://wiki.erepublik.com/index.php/Buildings),
[Economy Guide: WAM vs Employees](https://www.erepublik.com/en/article/2665941).

| Quality | Food/Weapon Factory | Food/Weapon Plantation |
|---------|---------------------|------------------------|
| Q1      | 1                   | 0 (WAM only)           |
| Q2      | 2                   | 0 (WAM only)           |
| Q3      | 3                   | 1                      |
| Q4      | 5                   | 1                      |
| Q5      | 10                  | 4                      |
| Q6      | 10                  | —                      |
| Q7      | 10                  | —                      |

Owner WAM is allowed in all four building types here (unlike house RM/factories,
where the owner cannot work). Plantation Q1/Q2 accept no employees — the Workers
counter is hidden/disabled for them.

## Math model (per quality)

```
sessions = companies + workers                    // WAM (1 per company) + hired
output   = baseOutput × mult × sessions
rmUsed   = baseRM     × mult × sessions            // factories only
workTax  = sessions × (workTaxRate / 100) × averageSalary   // both WAM and hired
labor    = workers   × offeredSalary               // hired only; WAM is unpaid
```

`mult` is the existing productivity multiplier
(`1 + countryBonus/100 + regionBonus/100 + (tycoon ? 0.2 : 0) − pollution/100`,
floored at 0). Plantation `output` keeps the existing `baseOutput / 100`
marketplace-unit conversion.

### Strategy A / B comparison (unchanged structure, extended cost terms)

Let factory totals (summed across qualities):
`factorySessions`, `factoryWorkers`, `totalOutput`, `totalRM`, `sumRevenue`.
Let plantation totals: `plantSessions`, `plantWorkers`, `totalRmProduced`.

```
factoryTax   = factorySessions × (workTaxRate/100) × averageSalary
factoryLabor = factoryWorkers  × offeredSalary
plantTax     = plantSessions   × (workTaxRate/100) × averageSalary
plantLabor   = plantWorkers    × offeredSalary

Option A (buy all RM):
  netA = sumRevenue − factoryTax − factoryLabor − totalRM × rmPrice

Option B (run plantations):
  netBalance      = totalRmProduced − totalRM
  marketExpenseB  = netBalance < 0 ? (−netBalance) × rmPrice : 0
  marketRevenueB  = netBalance > 0 ? netBalance × rmPrice × (1 − vat/100) : 0
  netB = sumRevenue − factoryTax − factoryLabor − plantTax − plantLabor
         − marketExpenseB + marketRevenueB
```

The headline KPIs follow `max(netA, netB)`, highlighting the winner exactly as
today. The per-card breakdown, Option A, and Option B must stay consistent — they
share `sessions`, `workTax`, and `labor`.

## State & migration

- Add global `state.offeredSalary` (default `0.00`).
- Change `state.food[q]`, `state.weapons[q]`, and their `plantations[q]` from
  numbers to `{ companies, workers }`.
- Bump `STORAGE_KEY` **v9 → v10**.
- `loadState` migration: a stored number `n` becomes `{ companies: n, workers: 0 }`;
  an already-object value is kept. After load, clamp every cell:
  `workers = clamp(workers, 0, companies × maxEmployees(industry, kind, quality))`.
  `companies` keeps the existing 0..9999 cap.
- Persist `offeredSalary` (number) in `saveState`/`loadState`.

## Data structures

Add `maxEmployees` to the four constant arrays:

```
foodFactoriesData / weaponFactoriesData:   [1, 2, 3, 5, 10, 10, 10]   // Q1..Q7
foodPlantationsData / weaponPlantationsData:[0, 0, 1, 1, 4]            // Q1..Q5
```

## UI / KPI

- **Counters:** each food/weapon factory and plantation card gets the houses-style
  stacked `Companies / Workers` counter group. Reuse / generalize the existing
  houses counter renderer and clamp helper rather than duplicating. Workers row
  shows `· max {companies × maxEmployees}`; hidden when `maxEmployees === 0`
  (plantation Q1/Q2).
- **Inputs:** add an **Offered Salary (CC)** input next to Average Salary
  (`input-average-salary`), id `input-offered-salary`.
- **KPIs:** add a **Daily Salary** (labor) KPI block beside **Daily Work Tax**.
  Work Tax now reflects all sessions (WAM + hired); Daily Salary reflects
  `workers × offeredSalary`. Net profit subtracts both.
- **De-sync rule preserved:** manually editing a modifier still clears the
  location selection and sets sync-status to "Manual".

## Houses module fix (same change)

- Labor cost: `workers × offeredSalary` (was `workers × averageSalary`).
- Add work tax: `workers × (workTaxRate/100) × averageSalary` (houses have no WAM,
  so sessions = workers). Surface it consistently with food/weapons (Work Tax +
  Daily Salary lines, or the existing "Daily Salary Cost" label split into the two
  components).
- The Option A/B comparison for houses gains the same `offeredSalary` labor term.

## Out of scope

- Aircraft weapons and aircraft raw materials (not modeled in the calculator).
- Per-company or per-quality salary fields (one global field only).
- Productivity-tier employee variation; all sessions use the same company `mult`.

## Risks / notes

- `render()` rebinds listeners every cycle (`setupListeners()` at the end) — the
  new counter buttons must follow that pattern, not one-time init.
- Many `state[active][q]` reads in `render()` assume a number; all must move to
  `.companies` / `.workers`. This is the bulk of the work and the main desync risk
  with Strategy A/B and the breakdown.
- Default `offeredSalary = 0` means hired workers initially show zero labor cost
  until the user fills it — intentional.
```
