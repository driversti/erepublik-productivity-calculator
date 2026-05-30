# Per-Module Location & Country Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each industry module (food / weapons / houses / aircraft) its own independent country + region selection and its own country-derived metrics (work tax rate, average salary, VAT), with those three metrics shown read-only and populated by sync.

**Architecture:** Move `selectedCountryId`, `selectedRegionPermalink`, `workTaxRate`, `averageSalary`, `vat` from top-level `state` into each of the four module sub-objects. `loadState()` migrates legacy top-level values into all modules (no storage-key bump). `syncRegionModifiers()` writes those metrics into the active module and additionally scrapes per-industry VAT. The three metric inputs become read-only. Tab switching renders from stored per-module state (no network re-sync) and repopulates the region dropdown for the active module's country.

**Tech Stack:** Vanilla ES-module JS (`app.js`), static `index.html`, `node server.js` for serving + `/proxy`. No test framework — verification is browser-driven via Playwright MCP with localStorage state injection + reload, plus `node --check app.js` for syntax.

**Design spec:** `docs/superpowers/specs/2026-05-30-per-module-location-design.md`

**Convention note:** All JS edits are expressed as exact `old` → `new` string replacements so line drift between tasks does not matter. After every JS task run `node --check app.js` (expect no output = OK) before committing. Do **not** push; commit locally only.

---

## Task 1: De-risk VAT scraping (capture economy page, finalize VAT regex)

VAT is per-industry and is **not** currently scraped. Before writing scraper code we must confirm the economy-page markup. **This task gates Task 5.**

**Files:**
- Create: `scratch_country_economy.html` (saved live reference, like the existing `scratch_society_lithuania.html`)
- Update: this plan's "VAT scrape recipe" note at the end of Task 1

- [x] **Step 1: Start the server**

```bash
node server.js >/tmp/erep_calc_server.log 2>&1 &
sleep 1 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```
Expected: `200`

- [x] **Step 2: Capture a live economy page through the proxy**

Use a country that controls regions (Lithuania, permalink `Lithuania`, matches the existing society scratch). Drive it through the app's own `/proxy` so headers/Cloudflare handling match production:

```bash
curl -s "http://localhost:8080/proxy?url=https%3A%2F%2Fwww.erepublik.com%2Fen%2Fcountry%2Feconomy%2FLithuania" -o scratch_country_economy.html
wc -l scratch_country_economy.html
```
Expected: a non-trivial HTML file (hundreds+ of lines). If it is a Cloudflare challenge / tiny error page, try another country permalink from `travelData.js` (e.g. `Poland`, `Romania`) until a real economy page is captured.

- [x] **Step 3: Inspect VAT + industry-row markup**

```bash
grep -n -i "vat\|class=\"special\"\|Work Tax\|Import Tax\|Construction\|Aircraft\|Weapons\|Food" scratch_country_economy.html | head -60
```
Identify, for each industry, the row label text and which `<span class="special">…%</span>` cell is VAT (relative to Work Tax / Import Tax columns). Record the exact industry-row labels (Food / Weapons / Construction-or-Houses / Aircraft-Weapons-or-Aircraft).

- [x] **Step 4: Confirm a working VAT regex against the captured file**

Prototype with node against the saved file (adjust until it extracts the right number — do not guess):

```bash
node -e '
const fs=require("fs");const html=fs.readFileSync("scratch_country_economy.html","utf8");
// CANDIDATE — refine column index/anchor against the real markup from Step 3.
// VAT is typically the 3rd <span class="special"> cell in an industry row (Work Tax, Import Tax, VAT).
const re=/Food<\/span>\s*<\/td>(?:\s*<td[^>]*>\s*<span\s+class="special"\s*>[\d.]+%?<\/span>\s*<\/td>){2}\s*<td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)%/i;
const m=html.match(re);console.log("Food VAT =", m?m[1]:"NO MATCH");
'
```
Expected: a sensible VAT percentage (e.g. `1.00`, `3.00`). Repeat for the other three industry labels.

- [x] **Step 5: CHECKPOINT — record recipe or escalate**

If a reliable VAT regex + per-industry label map is found, write it into the note block below and proceed. **If VAT cannot be parsed reliably, STOP and report to the user** (do not silently default VAT) — the design's fallback decision is required before continuing.

> **VAT scrape recipe (confirmed against `scratch_country_economy.html`, Lithuania, Day 6766):**
>
> **Industry-row labels (exact text in `<span class="fakeheight">…</span>`):**
> - food = `Food`
> - weapons = `Weapons`
> - houses = `House`
> - aircraft = `Aircraft Weapons`
>
> **Table structure** (columns, left-to-right per row): icon | label | Work Tax | Import Tax | VAT
> - Work Tax cell: `<td><span class="special">X.XX%</span></td>` (percent sign inside span)
> - Import Tax cell: `<td><span class="special">N</span>%</td>` (percent sign outside span)
> - VAT cell: `<td>\n    <span class="special">N</span>%\n</td>` (integer, percent outside span; **empty for raw-material rows**)
>
> **VAT regex template** (replace `INDUSTRY_LABEL` with the exact label string above; use `new RegExp(template, 'i')`):
> ```
> fakeheight">INDUSTRY_LABEL<\/span><\/td>\s*<td[^>]*>\s*<span[^>]*>[^<]*<\/span>\s*<\/td>\s*<td[^>]*>\s*<span[^>]*>[^<]*<\/span>%\s*<\/td>\s*<td[^>]*>\s*<span[^>]*>([\d.]*)<\/span>
> ```
> Capture group 1 = the VAT integer (e.g. `"1"`, `"3"`). Empty string means no VAT (raw materials). Parse with `parseFloat(match[1]) || 0`.
>
> **JSON-first source available? NO.** The page has a `countryProductivityBonuses` JS var (productivity bonuses only) and historical daily aggregate revenue arrays (`chartDataJSON`, `tableDataJSON`). Neither exposes per-industry VAT rates. Only the HTML tax table carries them. HTML-regex is the only parse path.
>
> **Sample extracted values (Lithuania):** food=1%, weapons=1%, houses=1%, aircraft=1%.

- [x] **Step 6: Commit the reference capture**

```bash
git add scratch_country_economy.html docs/superpowers/plans/2026-05-30-per-module-location.md
git commit -m "chore: capture economy page reference + VAT scrape recipe"
```

---

## Task 2: Make Work Tax / Average Salary / VAT inputs read-only

**Files:**
- Modify: `index.html:209`, `index.html:213`, `index.html:236`

- [ ] **Step 1: Make Work Tax Rate read-only**

Replace:
```html
                            <input type="number" id="input-work-tax" class="market-input" step="0.5" min="1" max="25" value="1.0">
```
With:
```html
                            <input type="number" id="input-work-tax" class="market-input info-readonly" step="0.5" min="1" max="25" value="1.0" readonly tabindex="-1" title="From selected country — read-only">
```

- [ ] **Step 2: Make Average Salary read-only**

Replace:
```html
                            <input type="number" id="input-average-salary" class="market-input" step="10" min="0" value="0.0">
```
With:
```html
                            <input type="number" id="input-average-salary" class="market-input info-readonly" step="10" min="0" value="0.0" readonly tabindex="-1" title="From selected country — read-only">
```

- [ ] **Step 3: Make VAT read-only**

Replace:
```html
                            <input type="number" id="input-vat" class="market-input" step="0.5" min="0" max="50" value="1.0">
```
With:
```html
                            <input type="number" id="input-vat" class="market-input info-readonly" step="0.5" min="0" max="50" value="1.0" readonly tabindex="-1" title="From selected country — read-only">
```

- [ ] **Step 4: Add a subtle read-only style**

Append to `styles.css`:
```css
/* Country-derived, non-editable metric fields */
.market-input.info-readonly {
    background: var(--bg-header, #f2f2f2);
    color: var(--text-secondary, #777);
    cursor: not-allowed;
    opacity: 0.85;
}
```

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "feat: make work tax / average salary / VAT inputs read-only informational"
```

---

## Task 3: Add per-module location fields, remove top-level ones

**Files:**
- Modify: `app.js` `state` initializer (~155–254)

- [ ] **Step 1: Remove the five top-level fields**

Replace:
```javascript
    hasTycoon: false,
    wamEnabled: true,
    workTaxRate: 1.0,
    averageSalary: 0.0,
    offeredSalary: 0.0,
    selectedCountryId: "",
    selectedRegionPermalink: "",
    frmPrice: 50.00,
    wrmPrice: 50.00,
    hrmPrice: 1535.00,
    armPrice: 1415.00,
    vat: 1.0,
```
With:
```javascript
    hasTycoon: false,
    wamEnabled: true,
    offeredSalary: 0.0,
    frmPrice: 50.00,
    wrmPrice: 50.00,
    hrmPrice: 1535.00,
    armPrice: 1415.00,
```

- [ ] **Step 2: Add the five per-module fields to `food`**

In the `food: {` object, replace its `prices: {...}` line:
```javascript
        prices: { 1: 0.80, 2: 1.60, 3: 2.40, 4: 3.20, 5: 4.00, 6: 5.00, 7: 9.90 }
    },
```
With:
```javascript
        prices: { 1: 0.80, 2: 1.60, 3: 2.40, 4: 3.20, 5: 4.00, 6: 5.00, 7: 9.90 },
        selectedCountryId: "", selectedRegionPermalink: "", workTaxRate: 1.0, averageSalary: 0.0, vat: 1.0
    },
```

- [ ] **Step 3: Add the five per-module fields to `weapons`**

Replace:
```javascript
        prices: { 1: 1.20, 2: 2.40, 3: 3.60, 4: 4.80, 5: 6.00, 6: 8.00, 7: 15.00 }
    },
```
With:
```javascript
        prices: { 1: 1.20, 2: 2.40, 3: 3.60, 4: 4.80, 5: 6.00, 6: 8.00, 7: 15.00 },
        selectedCountryId: "", selectedRegionPermalink: "", workTaxRate: 1.0, averageSalary: 0.0, vat: 1.0
    },
```

- [ ] **Step 4: Add the five per-module fields to `houses`**

Replace:
```javascript
        prices: { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 }
    },
```
With:
```javascript
        prices: { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 },
        selectedCountryId: "", selectedRegionPermalink: "", workTaxRate: 1.0, averageSalary: 0.0, vat: 1.0
    },
```

- [ ] **Step 5: Add the five per-module fields to `aircraft`**

Replace:
```javascript
        prices: { 1: 963.00, 2: 900.00, 3: 1485.00, 4: 1800.00, 5: 2179.00 }
    }
};
```
With:
```javascript
        prices: { 1: 963.00, 2: 900.00, 3: 1485.00, 4: 1800.00, 5: 2179.00 },
        selectedCountryId: "", selectedRegionPermalink: "", workTaxRate: 1.0, averageSalary: 0.0, vat: 1.0
    }
};
```

- [ ] **Step 6: Add a shared accessor helper (used by later tasks)**

Immediately after the `state = {…};` block and before `const STORAGE_KEY`, add:
```javascript
// The active module's sub-state (food/weapons/houses/aircraft) — holds its own location & country metrics.
function activeLoc() { return state[state.activeModule]; }
```

- [ ] **Step 7: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "refactor: move location & country metrics into per-module state"
```
Expected: `node --check` prints nothing.

---

## Task 4: Migrate location/metrics on load (no key bump)

**Files:**
- Modify: `app.js` `loadState()` (~260–375)

- [ ] **Step 1: Remove the five top-level loads**

Replace:
```javascript
            if (typeof parsed.hasTycoon === 'boolean') state.hasTycoon = parsed.hasTycoon;
            if (typeof parsed.wamEnabled === 'boolean') state.wamEnabled = parsed.wamEnabled;
            if (typeof parsed.workTaxRate === 'number') state.workTaxRate = parsed.workTaxRate;
            if (typeof parsed.averageSalary === 'number') state.averageSalary = parsed.averageSalary;
            if (typeof parsed.offeredSalary === 'number') state.offeredSalary = parsed.offeredSalary;
            if (typeof parsed.selectedCountryId === 'string' || typeof parsed.selectedCountryId === 'number') {
                state.selectedCountryId = String(parsed.selectedCountryId);
            }
            if (typeof parsed.selectedRegionPermalink === 'string') state.selectedRegionPermalink = parsed.selectedRegionPermalink;
            if (typeof parsed.frmPrice === 'number') state.frmPrice = parsed.frmPrice;
            if (typeof parsed.wrmPrice === 'number') state.wrmPrice = parsed.wrmPrice;
            if (typeof parsed.hrmPrice === 'number') state.hrmPrice = parsed.hrmPrice;
            if (typeof parsed.armPrice === 'number') state.armPrice = parsed.armPrice;
            if (typeof parsed.vat === 'number') state.vat = parsed.vat;
```
With:
```javascript
            if (typeof parsed.hasTycoon === 'boolean') state.hasTycoon = parsed.hasTycoon;
            if (typeof parsed.wamEnabled === 'boolean') state.wamEnabled = parsed.wamEnabled;
            if (typeof parsed.offeredSalary === 'number') state.offeredSalary = parsed.offeredSalary;
            if (typeof parsed.frmPrice === 'number') state.frmPrice = parsed.frmPrice;
            if (typeof parsed.wrmPrice === 'number') state.wrmPrice = parsed.wrmPrice;
            if (typeof parsed.hrmPrice === 'number') state.hrmPrice = parsed.hrmPrice;
            if (typeof parsed.armPrice === 'number') state.armPrice = parsed.armPrice;
```

- [ ] **Step 2: Add per-module location load + legacy migration**

Immediately after the `});` that closes the houses/aircraft `.forEach(...)` loop (right before the closing `}` of the `if (stored) {` block), insert:
```javascript
            // Per-module location & country metrics, migrating any legacy top-level values.
            const legacyCountry = (typeof parsed.selectedCountryId === 'string' || typeof parsed.selectedCountryId === 'number') ? String(parsed.selectedCountryId) : "";
            const legacyRegion = (typeof parsed.selectedRegionPermalink === 'string') ? parsed.selectedRegionPermalink : "";
            const legacyWorkTax = (typeof parsed.workTaxRate === 'number') ? parsed.workTaxRate : null;
            const legacyAvgSalary = (typeof parsed.averageSalary === 'number') ? parsed.averageSalary : null;
            const legacyVat = (typeof parsed.vat === 'number') ? parsed.vat : null;
            ['food', 'weapons', 'houses', 'aircraft'].forEach(key => {
                const pm = (parsed[key] && typeof parsed[key] === 'object') ? parsed[key] : {};
                if (typeof pm.selectedCountryId === 'string' || typeof pm.selectedCountryId === 'number') {
                    state[key].selectedCountryId = String(pm.selectedCountryId);
                } else if (legacyCountry) {
                    state[key].selectedCountryId = legacyCountry;
                }
                if (typeof pm.selectedRegionPermalink === 'string') state[key].selectedRegionPermalink = pm.selectedRegionPermalink;
                else if (legacyRegion) state[key].selectedRegionPermalink = legacyRegion;
                if (typeof pm.workTaxRate === 'number') state[key].workTaxRate = pm.workTaxRate;
                else if (legacyWorkTax !== null) state[key].workTaxRate = legacyWorkTax;
                if (typeof pm.averageSalary === 'number') state[key].averageSalary = pm.averageSalary;
                else if (legacyAvgSalary !== null) state[key].averageSalary = legacyAvgSalary;
                if (typeof pm.vat === 'number') state[key].vat = pm.vat;
                else if (legacyVat !== null) state[key].vat = legacyVat;
            });
```

- [ ] **Step 3: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "feat: load per-module location with legacy top-level migration"
```

---

## Task 5: Update `syncRegionModifiers()` — per-module reads/writes + VAT scrape

**Files:**
- Modify: `app.js` `syncRegionModifiers()` (~567–715)

- [ ] **Step 1: Read location from the active module**

Replace:
```javascript
    const countryId = state.selectedCountryId;
    const regionPermalink = state.selectedRegionPermalink;
```
With:
```javascript
    const loc = activeLoc();
    const countryId = loc.selectedCountryId;
    const regionPermalink = loc.selectedRegionPermalink;
```

- [ ] **Step 2: Add a per-industry VAT label to `moduleSyncCfg`**

Replace each cfg entry's closing so it carries `industryLabel` (use the exact labels confirmed in Task 1; the values below are the expected defaults — correct them if Task 1 found different text):
```javascript
    const moduleSyncCfg = {
        food:    { industryId: "1", industryToken: "FOOD",   resourceRegexStr: 'data-resourceId="([1-5])"',          maxQuality: 7, industryLabel: "Food" },
        weapons: { industryId: "2", industryToken: "WEAPON", resourceRegexStr: 'data-resourceId="(6|7|8|9|10)"',     maxQuality: 7, industryLabel: "Weapons" },
        houses:  { industryId: "4", industryToken: "HOUSE",  resourceRegexStr: 'data-resourceId="(11|12|13|14|15)"', maxQuality: 5, industryLabel: "House" },
        aircraft: { industryId: "23", industryToken: "AIRCRAFT", resourceRegexStr: 'data-resourceId="(16|17|18|19|20)"', maxQuality: 5, industryLabel: "Aircraft Weapons" }
    };
```
(This replaces the existing 4-line `moduleSyncCfg` block; keep the surrounding `const cfg = …` line.)

- [ ] **Step 3: Parse VAT (insert after the Average Salary parse, before "Update active module state")**

Insert after the `avgSalaryValue` block (the lines that set `avgSalaryValue`) and before `// Update active module state`. The regex below is the **confirmed** template from Task 1 (verified against `scratch_country_economy.html` for all four industries — capture group 1 is the VAT integer; columns are Work-Tax / Import-Tax / VAT; an empty capture means raw-material row, which we ignore):
```javascript
        // 6. Parse Industry VAT (per-industry). Recipe confirmed against scratch_country_economy.html (plan Task 1).
        let vatValue = (typeof loc.vat === 'number') ? loc.vat : 1.0;
        const vatRegexStr = 'fakeheight">' + cfg.industryLabel + '<\\/span><\\/td>\\s*<td[^>]*>\\s*<span[^>]*>[^<]*<\\/span>\\s*<\\/td>\\s*<td[^>]*>\\s*<span[^>]*>[^<]*<\\/span>%\\s*<\\/td>\\s*<td[^>]*>\\s*<span[^>]*>([\\d.]*)<\\/span>';
        const vatMatch = countryHtml.match(new RegExp(vatRegexStr, 'i'));
        if (vatMatch && vatMatch[1] !== '') {
            vatValue = parseFloat(vatMatch[1]) || 0;
        }
```
Note: `loc` is already defined at the top of the function (Step 1). The regex is built by concatenating the `fakeheight">` prefix + the module's `industryLabel` + the structural tail — no separate placeholder template constant is needed.

- [ ] **Step 4: Write metrics into the active module instead of top-level**

Replace:
```javascript
        // Update active module state
        const moduleKey = state.activeModule;
        state[moduleKey].countryBonus = countryBonusValue;
        state[moduleKey].regionBonus = regionBonusValue;
        state[moduleKey].qualityPollution = qPollution;
        state[moduleKey].pollution = qPollution[1];
        
        state.workTaxRate = workTaxValue;
        state.averageSalary = avgSalaryValue;
```
With:
```javascript
        // Update active module state
        const moduleKey = state.activeModule;
        state[moduleKey].countryBonus = countryBonusValue;
        state[moduleKey].regionBonus = regionBonusValue;
        state[moduleKey].qualityPollution = qPollution;
        state[moduleKey].pollution = qPollution[1];
        state[moduleKey].workTaxRate = workTaxValue;
        state[moduleKey].averageSalary = avgSalaryValue;
        state[moduleKey].vat = vatValue;
```

- [ ] **Step 5: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "feat: sync per-module location metrics + scrape industry VAT"
```

---

## Task 6: Update `render()` (food/weapons) reads

**Files:**
- Modify: `app.js` `render()` (~810–895, ~1074, ~1093)

- [ ] **Step 1: Metric input displays + dropdowns from module state**

Replace:
```javascript
    document.getElementById("input-work-tax").value = state.workTaxRate.toFixed(2);
    document.getElementById("input-average-salary").value = state.averageSalary.toFixed(2);
```
With:
```javascript
    document.getElementById("input-work-tax").value = moduleState.workTaxRate.toFixed(2);
    document.getElementById("input-average-salary").value = moduleState.averageSalary.toFixed(2);
```

- [ ] **Step 2: Country/region dropdown values**

Replace:
```javascript
    document.getElementById("select-country").value = state.selectedCountryId || "";
    document.getElementById("select-region").value = state.selectedRegionPermalink || "";
```
With:
```javascript
    document.getElementById("select-country").value = moduleState.selectedCountryId || "";
    document.getElementById("select-region").value = moduleState.selectedRegionPermalink || "";
```

- [ ] **Step 3: Sync-status conditionals (the block at ~828–834)**

Replace:
```javascript
        if (state.selectedCountryId && state.selectedRegionPermalink) {
```
…and the two sibling conditions in that same block:
```javascript
        } else if (state.selectedCountryId && !state.selectedRegionPermalink) {
```
```javascript
        } else if (!state.selectedCountryId) {
```
With (respectively):
```javascript
        if (moduleState.selectedCountryId && moduleState.selectedRegionPermalink) {
```
```javascript
        } else if (moduleState.selectedCountryId && !moduleState.selectedRegionPermalink) {
```
```javascript
        } else if (!moduleState.selectedCountryId) {
```

- [ ] **Step 4: VAT input display**

Replace:
```javascript
    document.getElementById("input-vat").value = state.vat.toFixed(1);
```
With:
```javascript
    document.getElementById("input-vat").value = moduleState.vat.toFixed(1);
```

- [ ] **Step 5: VAT in factory-card revenue**

Replace:
```javascript
        const cardRevenue = cardOutput * productPrice * (1 - state.vat / 100);
```
With:
```javascript
        const cardRevenue = cardOutput * productPrice * (1 - moduleState.vat / 100);
```
(There is one such line in `render()` at ~889 — the factory-card loop. The plantation/strategy VAT line is Step 7.)

- [ ] **Step 6: Work tax base uses module metrics**

Replace:
```javascript
    const taxPerSession = (state.workTaxRate / 100) * state.averageSalary;
```
With:
```javascript
    const taxPerSession = (moduleState.workTaxRate / 100) * moduleState.averageSalary;
```

- [ ] **Step 7: VAT in Option B market revenue**

Replace:
```javascript
        marketRevenueOptionB = netGrainBalance * rmPrice * (1 - state.vat / 100);
```
With:
```javascript
        marketRevenueOptionB = netGrainBalance * rmPrice * (1 - moduleState.vat / 100);
```

- [ ] **Step 8: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "refactor: render() food/weapons reads location & metrics from module state"
```

---

## Task 7: Update `renderHiredLaborModule()` (houses/aircraft) reads

**Files:**
- Modify: `app.js` `renderHiredLaborModule()` (~1376–1498). Note: the module sub-state local is named `h`.

- [ ] **Step 1: Average-salary display**

Replace:
```javascript
    document.getElementById("input-average-salary").value = state.averageSalary.toFixed(2);
```
With:
```javascript
    document.getElementById("input-average-salary").value = h.averageSalary.toFixed(2);
```

- [ ] **Step 2: Country/region dropdowns**

Replace:
```javascript
    document.getElementById("select-country").value = state.selectedCountryId || "";
    document.getElementById("select-region").value = state.selectedRegionPermalink || "";
```
With:
```javascript
    document.getElementById("select-country").value = h.selectedCountryId || "";
    document.getElementById("select-region").value = h.selectedRegionPermalink || "";
```

- [ ] **Step 3: VAT display**

Replace:
```javascript
    document.getElementById("input-vat").value = state.vat.toFixed(1);
```
With:
```javascript
    document.getElementById("input-vat").value = h.vat.toFixed(1);
```

- [ ] **Step 4: Sync-status conditionals (~1394, ~1397)**

Replace:
```javascript
        if (state.selectedCountryId && state.selectedRegionPermalink) {
```
```javascript
        } else if (state.selectedCountryId) {
```
With:
```javascript
        if (h.selectedCountryId && h.selectedRegionPermalink) {
```
```javascript
        } else if (h.selectedCountryId) {
```

- [ ] **Step 5: VAT in house-factory card revenue (~1430)**

Replace:
```javascript
        const cardRevenue = cardOutput * productPrice * (1 - state.vat / 100);
```
With:
```javascript
        const cardRevenue = cardOutput * productPrice * (1 - h.vat / 100);
```

- [ ] **Step 6: VAT in HRM Option B market revenue (~1498)**

Replace:
```javascript
    else marketRevenueB = netHrmBalance * rmPrice * (1 - state.vat / 100);
```
With:
```javascript
    else marketRevenueB = netHrmBalance * rmPrice * (1 - h.vat / 100);
```

- [ ] **Step 7: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "refactor: houses/aircraft render reads location & metrics from module state"
```

---

## Task 8: Selection handlers + remove read-only field handlers + de-sync scope

**Files:**
- Modify: `app.js` `setupListeners()` (~1720–1930)

- [ ] **Step 1: Country select handler writes to active module**

Replace:
```javascript
            state.selectedCountryId = countryId;
            state.selectedRegionPermalink = ""; // Reset region selection
```
With:
```javascript
            activeLoc().selectedCountryId = countryId;
            activeLoc().selectedRegionPermalink = ""; // Reset region selection
```

- [ ] **Step 2: Region select handler writes to active module**

Replace:
```javascript
            state.selectedRegionPermalink = this.value;
```
With:
```javascript
            activeLoc().selectedRegionPermalink = this.value;
```

- [ ] **Step 3: Country-bonus slider de-sync clears only active module**

Replace (the de-sync pair inside the `slider.oninput` handler):
```javascript
            // De-sync location since user modified manual inputs
            state.selectedCountryId = "";
            state.selectedRegionPermalink = "";
            const syncStatus = document.getElementById("sync-status");
            if (syncStatus) {
                syncStatus.textContent = "Auto-sync: De-synced (Manual)";
                syncStatus.style.color = "var(--text-secondary)";
            }
            
            saveState();
            render();
        };
    }

    // Tycoon Pack Toggle
```
With:
```javascript
            // De-sync location since user modified manual inputs (active module only)
            activeLoc().selectedCountryId = "";
            activeLoc().selectedRegionPermalink = "";
            const syncStatus = document.getElementById("sync-status");
            if (syncStatus) {
                syncStatus.textContent = "Auto-sync: De-synced (Manual)";
                syncStatus.style.color = "var(--text-secondary)";
            }
            
            saveState();
            render();
        };
    }

    // Tycoon Pack Toggle
```

- [ ] **Step 4: Region-bonus input de-sync clears only active module**

Replace (the de-sync pair inside the `regionBonusInput.onchange` handler):
```javascript
            // De-sync location since user modified manual inputs
            state.selectedCountryId = "";
            state.selectedRegionPermalink = "";
            const syncStatus = document.getElementById("sync-status");
            if (syncStatus) {
                syncStatus.textContent = "Auto-sync: De-synced (Manual)";
                syncStatus.style.color = "var(--text-secondary)";
            }
            
            saveState();
            render();
        };
        regionBonusInput.onkeydown = function(e) {
```
With:
```javascript
            // De-sync location since user modified manual inputs (active module only)
            activeLoc().selectedCountryId = "";
            activeLoc().selectedRegionPermalink = "";
            const syncStatus = document.getElementById("sync-status");
            if (syncStatus) {
                syncStatus.textContent = "Auto-sync: De-synced (Manual)";
                syncStatus.style.color = "var(--text-secondary)";
            }
            
            saveState();
            render();
        };
        regionBonusInput.onkeydown = function(e) {
```

- [ ] **Step 5: Remove the Work Tax input handler (now read-only)**

Delete the entire block:
```javascript
    // Work Tax Input
    const workTaxInput = document.getElementById("input-work-tax");
    if (workTaxInput) {
        workTaxInput.onchange = function() {
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) {
                val = 1.0;
            }
            state.workTaxRate = Math.min(val, 25.0);
            
            // De-sync location since user modified manual inputs
            state.selectedCountryId = "";
            state.selectedRegionPermalink = "";
            const syncStatus = document.getElementById("sync-status");
            if (syncStatus) {
                syncStatus.textContent = "Auto-sync: De-synced (Manual)";
                syncStatus.style.color = "var(--text-secondary)";
            }
            
            saveState();
            render();
        };
        workTaxInput.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    }

```

- [ ] **Step 6: Remove the Average Salary input handler (now read-only)**

Delete the entire block:
```javascript
    // Average Salary Input
    const avgSalaryInput = document.getElementById("input-average-salary");
    if (avgSalaryInput) {
        avgSalaryInput.onchange = function() {
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) {
                val = 0.0;
            }
            state.averageSalary = val;
            
            // De-sync location since user modified manual inputs
            state.selectedCountryId = "";
            state.selectedRegionPermalink = "";
            const syncStatus = document.getElementById("sync-status");
            if (syncStatus) {
                syncStatus.textContent = "Auto-sync: De-synced (Manual)";
                syncStatus.style.color = "var(--text-secondary)";
            }
            
            saveState();
            render();
        };
        avgSalaryInput.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    }

```

- [ ] **Step 7: Remove the VAT input handler (now read-only)**

Find the VAT input handler block (around the line `state.vat = Math.min(val, 50.0);`) and delete the whole `const vatInput = document.getElementById("input-vat"); if (vatInput) { … }` block including its `onchange` and any `onkeydown`. Read the surrounding lines first to capture the exact block, then remove it in full.

- [ ] **Step 8: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "feat: per-module selection handlers; drop read-only field handlers"
```

---

## Task 9: Tab switch (no re-sync), reset handlers, bootstrap

**Files:**
- Modify: `app.js` tab handlers (~1593–1648), reset handlers (~2095–2178), bootstrap (~2181–2188)

- [ ] **Step 1: Add a `switchModule()` helper**

Immediately before `function setupListeners() {`, add:
```javascript
// Switch active industry module: persist, repopulate the region dropdown for THIS module's
// country, then render from stored per-module state (no network re-sync).
async function switchModule(target) {
    if (state.activeModule === target) return;
    state.activeModule = target;
    saveState();
    const loc = state[target];
    if (loc.selectedCountryId) {
        await loadRegionsForCountry(loc.selectedCountryId, loc.selectedRegionPermalink);
    } else {
        const regionSelect = document.getElementById("select-region");
        if (regionSelect) { regionSelect.innerHTML = '<option value="">-- Select Region --</option>'; regionSelect.disabled = true; }
    }
    render();
}
```

- [ ] **Step 2: Rewrite the four tab handlers to use `switchModule()`**

Replace:
```javascript
    const tabFood = document.getElementById("tab-food");
    if (tabFood) {
        tabFood.onclick = function() {
            if (state.activeModule !== "food") {
                state.activeModule = "food";
                saveState();
                if (state.selectedCountryId && state.selectedRegionPermalink) {
                    syncRegionModifiers();
                } else {
                    render();
                }
            }
        };
    }
    const tabWeapons = document.getElementById("tab-weapons");
    if (tabWeapons) {
        tabWeapons.onclick = function() {
            if (state.activeModule !== "weapons") {
                state.activeModule = "weapons";
                saveState();
                if (state.selectedCountryId && state.selectedRegionPermalink) {
                    syncRegionModifiers();
                } else {
                    render();
                }
            }
        };
    }
    const tabHouses = document.getElementById("tab-houses");
    if (tabHouses) {
        tabHouses.onclick = function() {
            if (state.activeModule !== "houses") {
                state.activeModule = "houses";
                saveState();
                if (state.selectedCountryId && state.selectedRegionPermalink) {
                    syncRegionModifiers();
                } else {
                    render();
                }
            }
        };
    }
    const tabAircraft = document.getElementById("tab-aircraft");
    if (tabAircraft) {
        tabAircraft.onclick = function() {
            if (state.activeModule !== "aircraft") {
                state.activeModule = "aircraft";
                saveState();
                if (state.selectedCountryId && state.selectedRegionPermalink) {
                    syncRegionModifiers();
                } else {
                    render();
                }
            }
        };
    }
```
With:
```javascript
    const tabFood = document.getElementById("tab-food");
    if (tabFood) tabFood.onclick = () => switchModule("food");
    const tabWeapons = document.getElementById("tab-weapons");
    if (tabWeapons) tabWeapons.onclick = () => switchModule("weapons");
    const tabHouses = document.getElementById("tab-houses");
    if (tabHouses) tabHouses.onclick = () => switchModule("houses");
    const tabAircraft = document.getElementById("tab-aircraft");
    if (tabAircraft) tabAircraft.onclick = () => switchModule("aircraft");
```

- [ ] **Step 3: Houses/aircraft reset handler — per-module location/metrics**

Replace:
```javascript
        state.hasTycoon = false;
        state.averageSalary = 0.0;
        state.selectedCountryId = "";
        state.selectedRegionPermalink = "";
        state.vat = 1.0;
        const syncStatusH = document.getElementById("sync-status");
```
With:
```javascript
        state.hasTycoon = false;
        m.averageSalary = 0.0;
        m.workTaxRate = 1.0;
        m.selectedCountryId = "";
        m.selectedRegionPermalink = "";
        m.vat = 1.0;
        const syncStatusH = document.getElementById("sync-status");
```

- [ ] **Step 4: Food/weapons reset handler — per-module location/metrics**

Replace:
```javascript
    // Reset shared state
    state.hasTycoon = false;
    state.workTaxRate = 1.0;
    state.averageSalary = 0.0;
    state.selectedCountryId = "";
    state.selectedRegionPermalink = "";
    state.vat = 1.0;
```
With:
```javascript
    // Reset shared state
    state.hasTycoon = false;
    state[active].workTaxRate = 1.0;
    state[active].averageSalary = 0.0;
    state[active].selectedCountryId = "";
    state[active].selectedRegionPermalink = "";
    state[active].vat = 1.0;
```

- [ ] **Step 5: Bootstrap loads regions for the active module's country**

Replace:
```javascript
    populateCountriesDropdown();
    loadState();
    if (state.selectedCountryId) {
        await loadRegionsForCountry(state.selectedCountryId, state.selectedRegionPermalink);
    }
    render();
```
With:
```javascript
    populateCountriesDropdown();
    loadState();
    const bootLoc = state[state.activeModule];
    if (bootLoc.selectedCountryId) {
        await loadRegionsForCountry(bootLoc.selectedCountryId, bootLoc.selectedRegionPermalink);
    }
    render();
```

- [ ] **Step 6: Syntax check + commit**

```bash
node --check app.js && git add app.js && git commit -m "feat: per-module tab switching (render from stored), reset & bootstrap"
```

---

## Task 10: Full browser verification

**Files:**
- No code changes — verify behavior end-to-end. Storage key is `erep_calculator_food_factories_v10`.

- [ ] **Step 1: Ensure server is running**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/ || (node server.js >/tmp/erep_calc_server.log 2>&1 & sleep 1)
```
Expected: `200`.

- [ ] **Step 2: Inject a two-country state via Playwright and reload**

Navigate to `http://localhost:8080/`, then `browser_evaluate` to set localStorage key `erep_calculator_food_factories_v10` with: food → `selectedCountryId/region` of country A, `countryBonus:50, regionBonus:10, workTaxRate:5, averageSalary:80, vat:3`, one Q1 factory `{companies:1,workers:1}`, `wamEnabled:true`; weapons → country B with `countryBonus:200, regionBonus:20, workTaxRate:1, averageSalary:200, vat:1`. Reload.

- [ ] **Step 3: Assert food tab shows food's metrics**

`browser_evaluate` reading `#input-work-tax`, `#input-average-salary`, `#input-vat`, `#select-country`, `#country-bonus-value`.
Expected: work tax `5.00`, avg salary `80.00`, VAT `3.0`, country = A, bonus `50%`.

- [ ] **Step 4: Switch to weapons tab, assert weapons' metrics (no bleed)**

Click `#tab-weapons` (or set `activeModule` + reload), read the same fields.
Expected: work tax `1.00`, avg salary `200.00`, VAT `1.0`, country = B, bonus `200%`. Confirms no cross-module bleed.

- [ ] **Step 5: Assert the three metric inputs are non-editable**

`browser_evaluate`: `["input-work-tax","input-average-salary","input-vat"].map(id => document.getElementById(id).readOnly)`.
Expected: `[true, true, true]`.

- [ ] **Step 6: Manual country-bonus edit de-syncs only the active module**

On weapons tab, move `#country-bonus-slider` (dispatch `input` event) and read both modules' `selectedCountryId` from localStorage after `saveState`.
Expected: weapons `selectedCountryId` cleared (`""`), food `selectedCountryId` still = A.

- [ ] **Step 7: Legacy migration**

Set localStorage to a legacy-shaped state: top-level `selectedCountryId:"A-id"`, `selectedRegionPermalink:"A-region"`, `workTaxRate:7`, `averageSalary:90`, `vat:4`, and module objects WITHOUT those fields. Reload, then read each module's fields from localStorage (after load+save) .
Expected: all four modules have `selectedCountryId:"A-id"`, `workTaxRate:7`, `averageSalary:90`, `vat:4`.

- [ ] **Step 8: Live sync smoke test (network)**

On the food tab, select a real country + region via the dropdowns and confirm `#input-work-tax`, `#input-average-salary`, and `#input-vat` populate to non-default values and the sync status reads "Synced". Confirms the VAT scrape from Task 1/5 works against the live page.

- [ ] **Step 9: Stop the server**

```bash
pkill -f "node server.js"; echo stopped
```

- [ ] **Step 10: Final commit (if any verification-driven fixes were made)**

```bash
git add -A && git commit -m "test: verify per-module location across modules, migration, read-only metrics"
```

---

## Self-Review Notes

- **Spec coverage:** Decision 1 (per-module fields) → Tasks 3–4; Decision 2 (globals stay) → Task 3 Step 1; Decision 3 (read-only metrics) → Task 2 + Task 8 Steps 5–7; Decision 4 (VAT scrape) → Task 1 + Task 5; Decision 5 (backward-compat load) → Task 4; Decision 6 (tab switch no re-sync) → Task 9. Verification section → Task 10.
- **Risk gate:** VAT scraping is isolated to Task 1 with an explicit STOP-and-escalate checkpoint; Task 5 consumes its recipe.
- **Naming consistency:** `activeLoc()` (Task 3) used in Tasks 5 & 8; `switchModule()` (Task 9) used by all four tab handlers; module-state locals are `moduleState` (food/weapons) and `h` (houses/aircraft) per existing code.
- **Storage key:** intentionally NOT bumped (`v10`) — migration handles the shape change.
