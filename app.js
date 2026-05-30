// eRepublik Food Factories Data Structure
// baseRM is normalized to Marketplace Units (1 unit of FRM = 100 individual Grain)
import { countries } from './travelData.js';

const foodFactoriesData = [
    { quality: 1, name: "Grain Bakery (Q1)", baseOutput: 100, baseRM: 1, energyPerItem: 2, maxEmployees: 1 },
    { quality: 2, name: "Food Factory (Q2)", baseOutput: 100, baseRM: 2, energyPerItem: 4, maxEmployees: 2 },
    { quality: 3, name: "Food Factory (Q3)", baseOutput: 100, baseRM: 3, energyPerItem: 6, maxEmployees: 3 },
    { quality: 4, name: "Food Factory (Q4)", baseOutput: 100, baseRM: 4, energyPerItem: 8, maxEmployees: 5 },
    { quality: 5, name: "Food Factory (Q5)", baseOutput: 100, baseRM: 5, energyPerItem: 10, maxEmployees: 10 },
    { quality: 6, name: "Food Factory (Q6)", baseOutput: 100, baseRM: 6, energyPerItem: 12, maxEmployees: 10 },
    { quality: 7, name: "Food Factory (Q7)", baseOutput: 100, baseRM: 20, energyPerItem: 20, maxEmployees: 10 }
];

const foodPlantationsData = [
    { quality: 1, name: "Grain Farm (Q1)", baseOutput: 35, energyPerItem: 10, maxEmployees: 0 },
    { quality: 2, name: "Fruit Orchard (Q2)", baseOutput: 70, energyPerItem: 10, maxEmployees: 0 },
    { quality: 3, name: "Fishery (Q3)", baseOutput: 125, energyPerItem: 10, maxEmployees: 1 },
    { quality: 4, name: "Cattle Farm (Q4)", baseOutput: 175, energyPerItem: 10, maxEmployees: 1 },
    { quality: 5, name: "Hunting Lodge (Q5)", baseOutput: 250, energyPerItem: 10, maxEmployees: 4 }
];

const weaponFactoriesData = [
    { quality: 1, name: "Weapons Factory (Q1)", baseOutput: 10, baseRM: 1, energyPerItem: 10, maxEmployees: 1 },
    { quality: 2, name: "Weapons Factory (Q2)", baseOutput: 10, baseRM: 2, energyPerItem: 20, maxEmployees: 2 },
    { quality: 3, name: "Weapons Factory (Q3)", baseOutput: 10, baseRM: 3, energyPerItem: 30, maxEmployees: 3 },
    { quality: 4, name: "Weapons Factory (Q4)", baseOutput: 10, baseRM: 4, energyPerItem: 40, maxEmployees: 5 },
    { quality: 5, name: "Weapons Factory (Q5)", baseOutput: 10, baseRM: 5, energyPerItem: 50, maxEmployees: 10 },
    { quality: 6, name: "Weapons Factory (Q6)", baseOutput: 10, baseRM: 6, energyPerItem: 60, maxEmployees: 10 },
    { quality: 7, name: "Weapons Factory (Q7)", baseOutput: 10, baseRM: 20, energyPerItem: 100, maxEmployees: 10 }
];

const weaponPlantationsData = [
    { quality: 1, name: "Iron Mine (Q1)", baseOutput: 35, energyPerItem: 10, maxEmployees: 0 },
    { quality: 2, name: "Oil Spring (Q2)", baseOutput: 70, energyPerItem: 10, maxEmployees: 0 },
    { quality: 3, name: "Aluminum Mine (Q3)", baseOutput: 125, energyPerItem: 10, maxEmployees: 1 },
    { quality: 4, name: "Saltpeter Mine (Q4)", baseOutput: 175, energyPerItem: 10, maxEmployees: 1 },
    { quality: 5, name: "Rubber Plantation (Q5)", baseOutput: 250, energyPerItem: 10, maxEmployees: 4 }
];

// House factories (construction industry). Q1-Q5 only.
// baseOutput = 1/work = fraction of a house completed per worker-session at multiplier 1.0.
// baseRM = HRM_per_house / work = 2 for every quality (HRM consumed per worker-session at x1.0).
const houseFactoriesData = [
    { quality: 1, name: "House Factory (Q1)", baseOutput: 1 / 5,  baseRM: 2, maxEmployees: 1 },
    { quality: 2, name: "House Factory (Q2)", baseOutput: 1 / 10, baseRM: 2, maxEmployees: 2 },
    { quality: 3, name: "House Factory (Q3)", baseOutput: 1 / 20, baseRM: 2, maxEmployees: 3 },
    { quality: 4, name: "House Factory (Q4)", baseOutput: 1 / 40, baseRM: 2, maxEmployees: 5 },
    { quality: 5, name: "House Factory (Q5)", baseOutput: 1 / 60, baseRM: 2, maxEmployees: 10 }
];

// House Raw Material companies. baseOutput is in individual units (divided by 100 for marketplace HRM units).
const houseRawMaterialsData = [
    { quality: 1, name: "Sand (Q1)",      baseOutput: 35,  maxEmployees: 1 },
    { quality: 2, name: "Clay (Q2)",      baseOutput: 70,  maxEmployees: 2 },
    { quality: 3, name: "Wood (Q3)",      baseOutput: 125, maxEmployees: 3 },
    { quality: 4, name: "Limestone (Q4)", baseOutput: 175, maxEmployees: 4 },
    { quality: 5, name: "Granite (Q5)",   baseOutput: 250, maxEmployees: 5 }
];

// Aircraft Weapon Factories (Q1-Q5). Owner cannot work — hired employees only (like houses).
// baseOutput is flat 5 (quality-independent, like food=100/weapon=10).
// baseRM is in Marketplace Units (1 ARM unit = 100 individual), per-quality like ground weapons.
const aircraftFactoriesData = [
    { quality: 1, name: "Aircraft Weapons Factory (Q1)", baseOutput: 5, baseRM: 1, maxEmployees: 1 },
    { quality: 2, name: "Aircraft Weapons Factory (Q2)", baseOutput: 5, baseRM: 2, maxEmployees: 2 },
    { quality: 3, name: "Aircraft Weapons Factory (Q3)", baseOutput: 5, baseRM: 3, maxEmployees: 3 },
    { quality: 4, name: "Aircraft Weapons Factory (Q4)", baseOutput: 5, baseRM: 4, maxEmployees: 4 },
    { quality: 5, name: "Aircraft Weapons Factory (Q5)", baseOutput: 5, baseRM: 5, maxEmployees: 5 }
];

// Aircraft Raw Material companies. baseOutput is in individual units (÷100 for marketplace ARM units).
const aircraftRawMaterialsData = [
    { quality: 1, name: "Magnesium Refinery (Q1)", baseOutput: 0.35, maxEmployees: 1 },
    { quality: 2, name: "Titanium Refinery (Q2)",  baseOutput: 0.70, maxEmployees: 2 },
    { quality: 3, name: "Wolfram Mine (Q3)",       baseOutput: 1.25, maxEmployees: 3 },
    { quality: 4, name: "Cobalt Plant (Q4)",       baseOutput: 1.75, maxEmployees: 4 },
    { quality: 5, name: "Neodymium Mine (Q5)",     baseOutput: 2.50, maxEmployees: 5 }
];

// --- eRepublik rounding helpers (mirror the game's own myCompanies math) ---
// Standard round-to-N-decimals, identical to the game's roundNumber().
function roundNumber(number, digits = 2) {
    const multiplier = Math.pow(10, digits);
    return Math.round(parseFloat(number) * multiplier) / multiplier;
}

// Raw-material production per company: the game rounds to 3 decimals then drops the
// 3rd decimal (floor to 2dp), i.e. roundNumber(x,3).toFixed(3).slice(0,-1).
// e.g. 3.685 -> "3.68" (NOT 3.69). See calculateProduction() on /economy/myCompanies.
function gameRawProduction(value) {
    return Number(roundNumber(value, 3).toFixed(3).slice(0, -1));
}

// --- Real eRepublik building/product icons (served from its CDN, no auth) ---
// Finished products use the quality-tiered industry icon; raw-material companies
// have a distinct building illustration per quality under /images/buildings/{id}.png.
const EREP_CDN = "https://www.erepublik.net/images";
// Plantation/mine building ids by quality (Q1..Q5). Matches the `epc` project's mapping.
const FRM_BUILDING_IDS = { 1: 7, 2: 8, 3: 9, 4: 10, 5: 11 };    // Grain Farm … Hunting Lodge
const WRM_BUILDING_IDS = { 1: 12, 2: 13, 3: 14, 4: 15, 5: 16 }; // Iron Mine … Rubber Plantation
const HRM_BUILDING_IDS = { 1: 17, 2: 18, 3: 19, 4: 21, 5: 22 }; // Sand … Granite (id 20 unused)
const ARM_BUILDING_IDS = { 1: 24, 2: 25, 3: 26, 4: 27, 5: 28 }; // Magnesium … Neodymium

const HIRED_LABOR_MODULES = {
    houses: {
        moduleKey: "houses", priceField: "hrmPrice",
        factoriesData: houseFactoriesData, rmData: houseRawMaterialsData,
        rmBuildingIds: HRM_BUILDING_IDS, factoryIconIndustry: 4,
        productNounPlural: "House",
        productNounPluralCard: "Houses",
        rmNoun: "HRM",
        moduleTitle: "House Industry (Step 1)",
        countryBonusLabel: "Country Construction Bonus",
        factoriesTitle: "Your House Factories",
        factoriesSubtitle: "Set companies + workers (Q1–Q5). Only hired employees produce — no WAM.",
        rmTitle: "Your HRM Companies",
        rmSubtitle: "House Raw Material companies Sand → Granite (Q1–Q5)",
        priceHeader: "House Prices (CC)",
        priceRowLabel: "House",
        strategyBuyTitle: "Option A: Buy HRM",
        strategyProduceTitle: "Option B: Produce HRM"
    },
    aircraft: {
        moduleKey: "aircraft", priceField: "armPrice",
        factoriesData: aircraftFactoriesData, rmData: aircraftRawMaterialsData,
        rmBuildingIds: ARM_BUILDING_IDS, factoryIconIndustry: 23,
        productNounPlural: "Aircraft Weapon",
        productNounPluralCard: "Aircraft Weapons",
        rmNoun: "ARM",
        moduleTitle: "Aircraft Industry (Step 1)",
        countryBonusLabel: "Country Aircraft Bonus",
        factoriesTitle: "Your Aircraft Weapon Factories",
        factoriesSubtitle: "Set companies + workers (Q1–Q5). Only hired employees produce — no WAM.",
        rmTitle: "Your ARM Companies",
        rmSubtitle: "Aircraft Raw Material companies Magnesium → Neodymium (Q1–Q5)",
        priceHeader: "Aircraft Weapon Prices (CC)",
        priceRowLabel: "Aircraft",
        strategyBuyTitle: "Option A: Buy ARM",
        strategyProduceTitle: "Option B: Produce ARM"
    }
};

const factoryIconUrl = (isFood, quality) => `${EREP_CDN}/icons/industry/${isFood ? 1 : 2}/q${quality}.png`;
const plantationIconUrl = (isFood, quality) => `${EREP_CDN}/buildings/${(isFood ? FRM_BUILDING_IDS : WRM_BUILDING_IDS)[quality]}.png`;

// Build an <img> that shows the real game icon, falling back to the inline SVG if the
// CDN is unreachable. The SVG is embedded in onerror (double quotes -> &quot;, collapsed
// to one line) so the HTML parser decodes it back to a valid JS string at error time.
function gameIconHtml(iconUrl, fallbackSvg) {
    const fallback = fallbackSvg.replace(/"/g, "&quot;").replace(/\s+/g, " ").trim();
    return `<img class="factory-img" src="${iconUrl}" alt="" loading="lazy" onerror="this.outerHTML='${fallback}'">`;
}

// Initialize Application State
let state = {
    activeModule: "food", // "food", "weapons", or "houses"
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
    food: {
        1: { companies: 0, workers: 0 },
        2: { companies: 0, workers: 0 },
        3: { companies: 0, workers: 0 },
        4: { companies: 0, workers: 0 },
        5: { companies: 0, workers: 0 },
        6: { companies: 0, workers: 0 },
        7: { companies: 0, workers: 0 },
        plantations: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        prices: { 1: 0.80, 2: 1.60, 3: 2.40, 4: 3.20, 5: 4.00, 6: 5.00, 7: 9.90 }
    },
    weapons: {
        1: { companies: 0, workers: 0 },
        2: { companies: 0, workers: 0 },
        3: { companies: 0, workers: 0 },
        4: { companies: 0, workers: 0 },
        5: { companies: 0, workers: 0 },
        6: { companies: 0, workers: 0 },
        7: { companies: 0, workers: 0 },
        plantations: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        prices: { 1: 1.20, 2: 2.40, 3: 3.60, 4: 4.80, 5: 6.00, 6: 8.00, 7: 15.00 }
    },
    houses: {
        factories: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        rm: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        prices: { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 }
    },
    aircraft: {
        factories: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        rm: {
            1: { companies: 0, workers: 0 },
            2: { companies: 0, workers: 0 },
            3: { companies: 0, workers: 0 },
            4: { companies: 0, workers: 0 },
            5: { companies: 0, workers: 0 }
        },
        countryBonus: 100,
        regionBonus: 0,
        pollution: 0,
        qualityPollution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        prices: { 1: 963.00, 2: 900.00, 3: 1485.00, 4: 1800.00, 5: 2179.00 }
    }
};

// LocalStorage key name (v9)
const STORAGE_KEY = "erep_calculator_food_factories_v10";

// Load values from localStorage on startup
function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (typeof parsed.activeModule === 'string') state.activeModule = parsed.activeModule;
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
            
            // Helper to populate a module's nested state
            const loadModule = (key) => {
                if (parsed[key] && typeof parsed[key] === 'object') {
                    const m = parsed[key];
                    const facData = key === 'food' ? foodFactoriesData : weaponFactoriesData;
                    const plantData = key === 'food' ? foodPlantationsData : weaponPlantationsData;
                    const migrateCell = (src, maxEmp) => {
                        let companies = 0, workers = 0;
                        if (typeof src === 'number') {
                            companies = Math.max(0, Math.floor(src));
                        } else if (src && typeof src === 'object') {
                            companies = (typeof src.companies === 'number') ? Math.max(0, Math.floor(src.companies)) : 0;
                            workers = (typeof src.workers === 'number') ? Math.max(0, Math.floor(src.workers)) : 0;
                        }
                        companies = Math.min(companies, 9999);
                        const cap = companies * maxEmp;
                        if (workers > cap) workers = cap;
                        return { companies, workers };
                    };
                    for (let q = 1; q <= 7; q++) {
                        if (m[q] !== undefined) {
                            const row = facData.find(x => x.quality === q);
                            state[key][q] = migrateCell(m[q], row ? row.maxEmployees : 0);
                        }
                    }
                    if (m.plantations && typeof m.plantations === 'object') {
                        for (let q = 1; q <= 5; q++) {
                            if (m.plantations[q] !== undefined) {
                                const row = plantData.find(x => x.quality === q);
                                state[key].plantations[q] = migrateCell(m.plantations[q], row ? row.maxEmployees : 0);
                            }
                        }
                    }
                    if (typeof m.countryBonus === 'number') state[key].countryBonus = m.countryBonus;
                    if (typeof m.regionBonus === 'number') state[key].regionBonus = m.regionBonus;
                    if (typeof m.pollution === 'number') state[key].pollution = m.pollution;
                    if (m.qualityPollution && typeof m.qualityPollution === 'object') {
                        for (let q = 0; q <= 7; q++) {
                            if (typeof m.qualityPollution[q] === 'number') state[key].qualityPollution[q] = m.qualityPollution[q];
                        }
                    }
                    if (m.prices && typeof m.prices === 'object') {
                        for (let q = 1; q <= 7; q++) {
                            if (typeof m.prices[q] === 'number') state[key].prices[q] = m.prices[q];
                        }
                    }
                }
            };
            
            loadModule('food');
            loadModule('weapons');

            // Houses + Aircraft share a shape: {factories{1..5}, rm{1..5}, bonuses, prices}, hired-worker cells.
            [
                { key: 'houses',   facData: houseFactoriesData,    rmData: houseRawMaterialsData },
                { key: 'aircraft', facData: aircraftFactoriesData, rmData: aircraftRawMaterialsData }
            ].forEach(({ key, facData, rmData }) => {
                const pm = parsed[key];
                if (!pm || typeof pm !== 'object') return;
                const loadGroup = (groupKey, data) => {
                    if (pm[groupKey] && typeof pm[groupKey] === 'object') {
                        for (let q = 1; q <= 5; q++) {
                            const src = pm[groupKey][q];
                            if (src && typeof src === 'object') {
                                const row = data.find(x => x.quality === q);
                                const maxEmp = row ? row.maxEmployees : 0;
                                const companies = (typeof src.companies === 'number') ? Math.max(0, Math.floor(src.companies)) : 0;
                                let workers = (typeof src.workers === 'number') ? Math.max(0, Math.floor(src.workers)) : 0;
                                if (workers > companies * maxEmp) workers = companies * maxEmp;
                                state[key][groupKey][q] = { companies, workers };
                            }
                        }
                    }
                };
                loadGroup('factories', facData);
                loadGroup('rm', rmData);
                if (typeof pm.countryBonus === 'number') state[key].countryBonus = pm.countryBonus;
                if (typeof pm.regionBonus === 'number') state[key].regionBonus = pm.regionBonus;
                if (typeof pm.pollution === 'number') state[key].pollution = pm.pollution;
                if (pm.qualityPollution && typeof pm.qualityPollution === 'object') {
                    for (let q = 0; q <= 5; q++) {
                        if (typeof pm.qualityPollution[q] === 'number') state[key].qualityPollution[q] = pm.qualityPollution[q];
                    }
                }
                if (pm.prices && typeof pm.prices === 'object') {
                    for (let q = 1; q <= 5; q++) {
                        if (typeof pm.prices[q] === 'number') state[key].prices[q] = pm.prices[q];
                    }
                }
            });
        }
    } catch (e) {
        console.error("Failed to load factory state from localStorage:", e);
    }
}

// Save values to localStorage
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save factory state to localStorage:", e);
    }
}

// Generate stars for a factory card
function generateStarsHtml(quality) {
    let starsHtml = "";
    for (let i = 0; i < quality; i++) {
        starsHtml += `
            <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        `;
    }
    return starsHtml;
}

// --- Hired-labor module helpers (houses + aircraft share the same shape) ---
function hiredLaborData(kind) {
    const isHouses = state.activeModule === 'houses';
    return kind === 'factory'
        ? (isHouses ? houseFactoriesData : aircraftFactoriesData)
        : (isHouses ? houseRawMaterialsData : aircraftRawMaterialsData);
}

function getHouseCell(kind, quality) {
    return state[state.activeModule][kind === 'factory' ? 'factories' : 'rm'][quality];
}

function houseMaxEmployees(kind, quality) {
    const row = hiredLaborData(kind).find(x => String(x.quality) === String(quality));
    return row ? row.maxEmployees : 0;
}

// Clamp companies to 0..9999 and workers to 0..(companies * maxEmployees)
function applyHouseCounterChange(kind, field, quality, value) {
    const cell = getHouseCell(kind, quality);
    const maxEmp = houseMaxEmployees(kind, quality);
    if (field === 'companies') {
        cell.companies = Math.max(0, Math.min(value, 9999));
        const cap = cell.companies * maxEmp;
        if (cell.workers > cap) cell.workers = cap;
    } else {
        const cap = (cell.companies || 0) * maxEmp;
        cell.workers = Math.max(0, Math.min(value, cap));
    }
}

// --- Food/Weapon employee helpers (companies + hired workers) ---
function fwMaxEmployees(active, kind, quality) {
    const data = kind === 'factory'
        ? (active === 'food' ? foodFactoriesData : weaponFactoriesData)
        : (active === 'food' ? foodPlantationsData : weaponPlantationsData);
    const row = data.find(x => String(x.quality) === String(quality));
    return row ? (row.maxEmployees || 0) : 0;
}

function getFwCell(active, kind, quality) {
    return kind === 'factory' ? state[active][quality] : state[active].plantations[quality];
}

// Clamp companies to 0..9999 and workers to 0..(companies * maxEmployees)
function applyFwCounterChange(active, kind, field, quality, value) {
    const cell = getFwCell(active, kind, quality);
    const maxEmp = fwMaxEmployees(active, kind, quality);
    if (field === 'companies') {
        cell.companies = Math.max(0, Math.min(value, 9999));
        const cap = cell.companies * maxEmp;
        if (cell.workers > cap) cell.workers = cap;
    } else {
        const cap = (cell.companies || 0) * maxEmp;
        cell.workers = Math.max(0, Math.min(value, cap));
    }
}

// Stacked Companies / Workers counter rows for a food/weapon card.
// Workers row is hidden when hideWorkers is true (e.g. plantations with maxEmployees 0).
function fwCounterGroupsHtml(kind, quality, companies, workers, maxWorkers, hideWorkers) {
    const row = (field, value, label, hint) => `
        <div class="house-counter-row">
            <span class="house-counter-label">${label}${hint}</span>
            <div class="counter-group counter-group-sm">
                <button class="btn-counter fw-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="-1">-</button>
                <input type="text" class="counter-input fw-counter-input" data-kind="${kind}" data-field="${field}" data-quality="${quality}" value="${value}" inputmode="numeric" pattern="[0-9]*">
                <button class="btn-counter fw-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="1">+</button>
            </div>
        </div>`;
    let html = `<div class="house-counters">` + row('companies', companies, 'Companies', '');
    if (!hideWorkers) {
        html += row('workers', workers, 'Workers', ` <span class="max-hint">· max ${maxWorkers}</span>`);
    }
    return html + `</div>`;
}

// Highlight the active tab across all three modules
function setActiveTabHighlight(active) {
    [['food', 'tab-food'], ['weapons', 'tab-weapons'], ['houses', 'tab-houses'], ['aircraft', 'tab-aircraft']].forEach(([m, id]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', m === active);
    });
}

// Populate countries selection dropdown
function populateCountriesDropdown() {
    const countrySelect = document.getElementById("select-country");
    if (!countrySelect) return;
    countrySelect.innerHTML = '<option value="">-- Select Country --</option>';
    
    const sortedCountries = Object.values(countries).sort((a, b) => a.name.localeCompare(b.name));
    sortedCountries.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        countrySelect.appendChild(opt);
    });
}

// Helper for CORS proxy url wrapping
function getProxyUrl(targetUrl) {
    return `/proxy?url=${encodeURIComponent(targetUrl)}`;
}

// Fetch and parse controlled regions from the Country Society page dynamically
async function loadRegionsForCountry(countryId, selectedPermalink = "") {
    const regionSelect = document.getElementById("select-region");
    if (!regionSelect) return;
    
    regionSelect.innerHTML = '<option value="">-- Loading Regions... --</option>';
    regionSelect.disabled = true;
    
    const country = countries[countryId];
    if (!country) {
        regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
        return;
    }
    
    try {
        // Fetch Country Society page
        const societyUrl = `https://www.erepublik.com/en/country/society/${country.permalink}`;
        const res = await fetch(getProxyUrl(societyUrl));
        if (!res.ok) throw new Error("Failed to load country society page");
        
        const html = await res.text();
        
        // Parse regions (extracting links like /en/main/region/Samogitia)
        const regex = /href="\/\/www\.erepublik\.com\/en\/main\/region\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
        let match;
        const parsedRegions = [];
        const seen = new Set();
        
        while ((match = regex.exec(html)) !== null) {
            const permalink = match[1];
            let name = match[2].replace(/<[^>]*>/g, '').trim();
            
            if (name.toLowerCase() === "details") continue;
            if (seen.has(permalink)) continue;
            
            seen.add(permalink);
            parsedRegions.push({ name, permalink });
        }
        
        regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
        if (parsedRegions.length > 0) {
            parsedRegions.sort((a, b) => a.name.localeCompare(b.name));
            parsedRegions.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.permalink;
                opt.textContent = r.name;
                regionSelect.appendChild(opt);
            });
            regionSelect.disabled = false;
            if (selectedPermalink) {
                regionSelect.value = selectedPermalink;
            }
        } else {
            regionSelect.innerHTML = '<option value="">-- No regions controlled --</option>';
        }
    } catch (e) {
        console.error("Failed to load regions dynamically:", e);
        regionSelect.innerHTML = '<option value="">-- Error loading regions --</option>';
        regionSelect.disabled = true;
    }
}

// Fetch region statistics (bonuses and pollution rates) directly
async function syncRegionModifiers() {
    const countryId = state.selectedCountryId;
    const regionPermalink = state.selectedRegionPermalink;
    
    if (!countryId || !regionPermalink) return;
    
    const country = countries[countryId];
    if (!country) return;
    
    const syncStatus = document.getElementById("sync-status");
    if (syncStatus) {
        syncStatus.textContent = "Auto-sync: Syncing data...";
        syncStatus.style.color = "var(--erep-gold, #ff9f00)";
    }
    
    const moduleSyncCfg = {
        food:    { industryId: "1", industryToken: "FOOD",   resourceRegexStr: 'data-resourceId="([1-5])"',          maxQuality: 7 },
        weapons: { industryId: "2", industryToken: "WEAPON", resourceRegexStr: 'data-resourceId="(6|7|8|9|10)"',     maxQuality: 7 },
        houses:  { industryId: "4", industryToken: "HOUSE",  resourceRegexStr: 'data-resourceId="(11|12|13|14|15)"', maxQuality: 5 },
        aircraft: { industryId: "23", industryToken: "AIRCRAFT", resourceRegexStr: 'data-resourceId="(16|17|18|19|20)"', maxQuality: 5 }
    };
    const cfg = moduleSyncCfg[state.activeModule] || moduleSyncCfg.food;
    const industryId = cfg.industryId;
    const industryToken = cfg.industryToken;
    const resourceRegexStr = cfg.resourceRegexStr;
    const maxQuality = cfg.maxQuality;
    
    try {
        const countryUrl = `https://www.erepublik.com/en/country/economy/${country.permalink}`;
        const regionUrl = `https://www.erepublik.com/en/main/region/${regionPermalink}`;
        
        const [countryRes, regionRes] = await Promise.all([
            fetch(getProxyUrl(countryUrl)),
            fetch(getProxyUrl(regionUrl))
        ]);
        
        if (!countryRes.ok || !regionRes.ok) {
            throw new Error("eRepublik server returned an error.");
        }
        
        const countryHtml = await countryRes.text();
        const regionHtml = await regionRes.text();
        
        // 1. Parse Country Industry Bonus
        let countryBonusValue = 100;
        const countryBonusJsonMatch = countryHtml.match(/var\s+countryProductivityBonuses\s*=\s*([^\n;]+)/);
        if (countryBonusJsonMatch) {
            try {
                const bonuses = JSON.parse(countryBonusJsonMatch[1]);
                if (bonuses.byToken && typeof bonuses.byToken[industryToken] === 'number') {
                    countryBonusValue = bonuses.byToken[industryToken];
                } else if (bonuses.byId && typeof bonuses.byId[industryId] === 'number') {
                    countryBonusValue = bonuses.byId[industryId];
                }
            } catch (e) {
                console.error("JSON parse of country bonuses failed, trying regex fallback:", e);
                const htmlMatch = new RegExp(`data-industryId="${industryId}"\\s+data-bonus="(\\d+)"`).exec(countryHtml);
                if (htmlMatch) {
                    countryBonusValue = parseInt(htmlMatch[1], 10);
                }
            }
        } else {
            const htmlMatch = new RegExp(`data-industryId="${industryId}"\\s+data-bonus="(\\d+)"`).exec(countryHtml);
            if (htmlMatch) {
                countryBonusValue = parseInt(htmlMatch[1], 10);
            }
        }
        
        // 2. Parse Region Resource Bonus
        let regionBonusValue = 0;
        const resourceRegex = new RegExp(resourceRegexStr + '\\s+data-bonus="(\\d+)"', 'g');
        let match;
        while ((match = resourceRegex.exec(regionHtml)) !== null) {
            regionBonusValue += parseInt(match[2], 10);
        }
        
        // 3. Parse Quality-Specific Pollution
        const qPollution = {};
        for (let q = 0; q <= maxQuality; q++) qPollution[q] = 0;
        const pollutionJsonMatch = regionHtml.match(/var\s+regionPollutionDetails\s*=\s*([^\n;]+)/);
        if (pollutionJsonMatch) {
            try {
                const details = JSON.parse(pollutionJsonMatch[1]);
                const rawPollution = details[industryId] || [];
                for (let q = 0; q <= maxQuality; q++) {
                    if (rawPollution[q] && rawPollution[q].pollution) {
                        const pollutionStr = rawPollution[q].pollution;
                        if (pollutionStr !== "N/A") {
                            qPollution[q] = parseFloat(pollutionStr) || 0;
                        }
                    }
                }
            } catch (e) {
                console.error("JSON parse of pollution details failed, trying regex fallback:", e);
                for (let q = 0; q <= maxQuality; q++) {
                    const cellMatch = new RegExp(`industry-${industryId}\\s+quality-${q}[^>]*><span>([^<]+)%?</span>`).exec(regionHtml);
                    if (cellMatch && cellMatch[1] !== "N/A") {
                        qPollution[q] = parseFloat(cellMatch[1]) || 0;
                    }
                }
            }
        } else {
            for (let q = 0; q <= maxQuality; q++) {
                const cellMatch = new RegExp(`industry-${industryId}\\s+quality-${q}[^>]*><span>([^<]+)%?</span>`).exec(regionHtml);
                if (cellMatch && cellMatch[1] !== "N/A") {
                    qPollution[q] = parseFloat(cellMatch[1]) || 0;
                }
            }
        }

        // 4. Parse Work Tax Rate
        let workTaxValue = 1.0;
        const wtMatch = countryHtml.match(/Food<\/span>\s*<\/td>\s*<\s*td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)%/i);
        if (wtMatch) {
            workTaxValue = parseFloat(wtMatch[1]) || 0;
        }

        // 5. Parse Average Salary
        let avgSalaryValue = 0;
        const salMatch = countryHtml.match(/Average<\/span>\s*<\/td>\s*<\s*td[^>]*>\s*<span\s+class="special"\s*>([\d.]+)/i);
        if (salMatch) {
            avgSalaryValue = parseFloat(salMatch[1]) || 0;
        }
        
        // Update active module state
        const moduleKey = state.activeModule;
        state[moduleKey].countryBonus = countryBonusValue;
        state[moduleKey].regionBonus = regionBonusValue;
        state[moduleKey].qualityPollution = qPollution;
        state[moduleKey].pollution = qPollution[1];
        
        state.workTaxRate = workTaxValue;
        state.averageSalary = avgSalaryValue;
        
        if (syncStatus) {
            syncStatus.textContent = `Auto-sync: Synced (Country: +${countryBonusValue}%, Region: +${regionBonusValue}%)`;
            syncStatus.style.color = "var(--erep-green, #7ab700)";
        }
        
        saveState();
        render();
    } catch (err) {
        console.error("Location auto sync failed:", err);
        if (syncStatus) {
            syncStatus.textContent = "Auto-sync: Failed to sync. Using manual input.";
            syncStatus.style.color = "#e74c3c";
        }
    }
}

// Render factories grid and update summary
function render() {
    if (state.activeModule === "houses" || state.activeModule === "aircraft") {
        renderHiredLaborModule(state.activeModule);
        return;
    }

    const container = document.getElementById("factories-container");
    const breakdownList = document.getElementById("factory-breakdown-list");
    const totalFactoriesCount = document.getElementById("total-factories-count");
    const totalFoodOutput = document.getElementById("total-food-output");
    const totalGrainRequired = document.getElementById("total-grain-required");
    const totalGrossRevenue = document.getElementById("total-gross-revenue");
    const totalGrainCost = document.getElementById("total-grain-cost");
    const totalGrossProfit = document.getElementById("total-gross-profit");
    
    const active = state.activeModule; // "food" or "weapons"
    const isFood = active === "food";
    const moduleState = state[active];
    const factoriesData = isFood ? foodFactoriesData : weaponFactoriesData;
    const plantationsData = isFood ? foodPlantationsData : weaponPlantationsData;
    const rmPrice = isFood ? state.frmPrice : state.wrmPrice;
    
    // Toggle active tab header classes (3-way)
    setActiveTabHighlight(active);

    // Restore DOM that the houses path hides/relabels
    const workTaxGroupFW = document.getElementById("work-tax-group");
    if (workTaxGroupFW) workTaxGroupFW.style.display = "";
    const wamGroupFW = document.getElementById("wam-group");
    if (wamGroupFW) wamGroupFW.style.display = "";
    const labelWorkTaxKpiFW = document.getElementById("label-work-tax-kpi");
    if (labelWorkTaxKpiFW) labelWorkTaxKpiFW.textContent = "Daily Work Tax";
    const labelTotalCountFW = document.getElementById("label-total-count");
    if (labelTotalCountFW) labelTotalCountFW.textContent = "Total Factories:";
    const produceTaxLabelFW = document.getElementById("strategy-produce-tax-label");
    if (produceTaxLabelFW) produceTaxLabelFW.textContent = "Work Tax:";
    for (let q = 1; q <= 7; q++) {
        const row = document.getElementById(`price-row-q${q}`);
        if (row) row.style.display = "";
    }
    
    // Dynamic headers and labels switching
    const activeModuleSpan = document.querySelector(".active-module .module-name");
    if (activeModuleSpan) {
        activeModuleSpan.textContent = isFood ? "Food Industry (Step 1)" : "Weapon Industry (Step 1)";
    }
    const countryBonusLabel = document.getElementById("country-bonus-label");
    if (countryBonusLabel) {
        countryBonusLabel.textContent = isFood ? "Country Food Bonus" : "Country Weapon Bonus";
    }
    const grainPriceLabel = document.getElementById("label-grain-price");
    if (grainPriceLabel) {
        grainPriceLabel.textContent = isFood ? "Grain Price (CC)" : "WRM Price (CC)";
    }
    const foodPricesHeader = document.getElementById("food-prices-header");
    if (foodPricesHeader) {
        foodPricesHeader.textContent = isFood ? "Food Prices (CC)" : "Weapon Prices (CC)";
    }
    document.querySelectorAll(".food-price-label").forEach(label => {
        const q = label.getAttribute("data-quality");
        label.textContent = isFood ? `Q${q} Food` : `Q${q} Weapon`;
    });
    
    const factoriesTitle = document.getElementById("factories-main-title");
    const factoriesSub = document.getElementById("factories-subtitle");
    const plantationsTitle = document.getElementById("plantations-main-title");
    const plantationsSub = document.getElementById("plantations-subtitle");
    
    if (factoriesTitle) factoriesTitle.textContent = isFood ? "Your Food Factories" : "Your Weapon Factories";
    if (factoriesSub) factoriesSub.textContent = isFood ? "Specify the number of Q1 to Q7 companies you own" : "Specify the number of Q1 to Q7 companies you own";
    if (plantationsTitle) plantationsTitle.textContent = isFood ? "Your Grain Plantations" : "Your Weapon Plantations";
    if (plantationsSub) plantationsSub.textContent = isFood ? "Specify the number of Q1 to Q5 Food Raw Material (FRM) companies you own" : "Specify the number of Q1 to Q5 Weapon Raw Material (WRM) companies you own";
    
    const labelOutput = document.getElementById("label-total-output");
    if (labelOutput) labelOutput.textContent = isFood ? "Food Output:" : "Weapon Output:";
    const labelConsumed = document.getElementById("label-total-consumed");
    if (labelConsumed) labelConsumed.textContent = isFood ? "Grain Consumed:" : "WRM Consumed:";
    const labelCostKpi = document.getElementById("label-daily-cost-kpi");
    if (labelCostKpi) labelCostKpi.textContent = isFood ? "Daily Grain Cost" : "Daily WRM Cost";
    
    const stratHeader = document.getElementById("strategy-comparison-header");
    if (stratHeader) stratHeader.textContent = isFood ? "Grain Strategy Comparison" : "Weapon Strategy Comparison";
    const labelProduced = document.getElementById("label-total-produced");
    if (labelProduced) labelProduced.textContent = isFood ? "Grain Produced:" : "WRM Produced:";
    const labelBalance = document.getElementById("label-net-balance");
    if (labelBalance) labelBalance.textContent = isFood ? "Grain Net Balance:" : "WRM Net Balance:";
    
    const stratBuyTitle = document.getElementById("strategy-buy-title");
    if (stratBuyTitle) stratBuyTitle.textContent = isFood ? "Option A: Buy Grain" : "Option A: Buy WRM";
    const stratProduceTitle = document.getElementById("strategy-produce-title");
    if (stratProduceTitle) stratProduceTitle.textContent = isFood ? "Option B: Produce Grain" : "Option B: Produce WRM";
    
    // Sync modifier inputs visuals with state
    document.getElementById("country-bonus-slider").value = moduleState.countryBonus;
    document.getElementById("country-bonus-value").textContent = `${moduleState.countryBonus}%`;
    document.getElementById("tycoon-toggle").checked = state.hasTycoon;
    const wamToggleFW = document.getElementById("wam-toggle");
    if (wamToggleFW) wamToggleFW.checked = state.wamEnabled;
    document.getElementById("input-region-bonus").value = moduleState.regionBonus;
    document.getElementById("input-work-tax").value = state.workTaxRate.toFixed(2);
    document.getElementById("input-average-salary").value = state.averageSalary.toFixed(2);
    document.getElementById("input-offered-salary").value = state.offeredSalary.toFixed(2);

    // Sync location dropdown selections
    document.getElementById("select-country").value = state.selectedCountryId || "";
    document.getElementById("select-region").value = state.selectedRegionPermalink || "";
    
    // Update sync status text color if synced successfully or manually overridden
    const syncStatus = document.getElementById("sync-status");
    if (syncStatus) {
        if (state.selectedCountryId && state.selectedRegionPermalink) {
            syncStatus.textContent = `Auto-sync: Synced (Country: +${moduleState.countryBonus}%, Region: +${moduleState.regionBonus}%)`;
            syncStatus.style.color = "var(--erep-green, #7ab700)";
        } else if (state.selectedCountryId && !state.selectedRegionPermalink) {
            syncStatus.textContent = "Auto-sync: Region not selected";
            syncStatus.style.color = "var(--text-secondary)";
        } else if (!state.selectedCountryId) {
            syncStatus.textContent = "Auto-sync: Not configured";
            syncStatus.style.color = "var(--text-secondary)";
        }
    }
    
    // Sync market input visuals with state
    document.getElementById("input-grain-price").value = rmPrice.toFixed(2);
    document.getElementById("input-vat").value = state.vat.toFixed(1);
    for (let q = 1; q <= 7; q++) {
        document.getElementById(`price-q${q}`).value = moduleState.prices[q].toFixed(2);
    }
    
    // Clear dynamic elements
    container.innerHTML = "";
    breakdownList.innerHTML = "";
    
    let totalFactories = 0;       // total companies (for the "Total Factories" KPI)
    let factorySessions = 0;      // WAM + hired sessions (for work tax)
    let factoryWorkers = 0;       // hired only (for labor salary)
    let totalOutput = 0;
    let totalRM = 0;
    let sumRevenue = 0;
    let sumGrainCost = 0;
    let breakdownHtml = "";
    
    // Render factory rows
    factoriesData.forEach(fact => {
        const cell = moduleState[fact.quality] || { companies: 0, workers: 0 };
        const companies = cell.companies || 0;
        const workers = Math.min(cell.workers || 0, companies * fact.maxEmployees);
        const sessions = (state.wamEnabled ? companies : 0) + workers;
        totalFactories += companies;
        factorySessions += sessions;
        factoryWorkers += workers;
        
        // Quality-specific pollution (fall back to manual general pollution if not populated)
        const pollutionRate = (moduleState.qualityPollution && typeof moduleState.qualityPollution[fact.quality] === 'number') 
            ? moduleState.qualityPollution[fact.quality] 
            : moduleState.pollution;
        
        // eRepublik Productivity Formula
        // Total Bonus multiplier = 1 + Country Bonus + Region Bonus + Tycoon Pack Bonus - Region Pollution
        const multiplier = 1 + (moduleState.countryBonus / 100) + (moduleState.regionBonus / 100) + (state.hasTycoon ? 0.2 : 0) - (pollutionRate / 100);
        const cardMultiplier = Math.max(0, multiplier);
        
        // Calculations for this card.
        // Match eRepublik: round each company's value to 2dp, then sum across companies.
        const singleOutput = roundNumber(fact.baseOutput * cardMultiplier, 2);
        const singleRM = roundNumber(fact.baseRM * cardMultiplier, 2);
        const cardOutput = singleOutput * sessions;
        const cardRM = singleRM * sessions;
        
        // Revenue after VAT
        const productPrice = moduleState.prices[fact.quality];
        const cardRevenue = cardOutput * productPrice * (1 - state.vat / 100);
        
        // Raw Material Cost
        const cardRMCost = cardRM * rmPrice;
        
        // Est. Gross Profit
        const cardGrossProfit = cardRevenue - cardRMCost;
        
        totalOutput += cardOutput;
        totalRM += cardRM;
        sumRevenue += cardRevenue;
        sumGrainCost += cardRMCost;
        
        // Add to sidebar breakdown list if user has at least 1
        if (companies > 0 || workers > 0) {
            breakdownHtml += `
                <li class="breakdown-item">
                    <span class="breakdown-label">Q${fact.quality} (${companies}c / ${workers}w)</span>
                    <span class="breakdown-count" style="display: flex; flex-direction: column; align-items: flex-end;">
                        <span>+${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isFood ? 'Food' : 'Weapon'}</span>
                        <span class="${cardGrossProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-size: 11px; font-weight: 700;">
                            ${cardGrossProfit >= 0 ? '+' : ''}${cardGrossProfit.toFixed(2)} CC
                        </span>
                    </span>
                </li>
            `;
        }
        
        // Real game product icon, with the inline SVG as offline fallback
        const fallbackSvg = isFood ? `
            <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 20h20M3 20v-8l4 3v-3l4 3v-3l4 3V6l5 4v10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 10h1M18 13h1M18 16h1M5 16h2M9 16h2" stroke-linecap="round"/>
            </svg>
        ` : `
            <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #7f8c8d; fill: rgba(127, 140, 141, 0.1);">
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l2 2M19 13l2-2M15 15l4 4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        const iconHtml = gameIconHtml(factoryIconUrl(isFood, fact.quality), fallbackSvg);
        
        // Create Factory Card DOM
        const card = document.createElement("div");
        card.className = "factory-row-card";
        card.innerHTML = `
            <div class="factory-avatar-area">
                ${iconHtml}
            </div>
            <div class="factory-info-area">
                <div class="factory-title">${fact.name}</div>
                <div class="stars-container">
                    ${generateStarsHtml(fact.quality)}
                </div>
                <div class="factory-pollution" style="font-size: 11px; margin-top: 4px; color: ${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'}; font-weight: 500;">
                    Pollution: ${pollutionRate.toFixed(2)}%
                </div>
            </div>
            <div class="factory-stats-area">
                <div class="stat-item">
                    <span class="stat-label">Daily Output</span>
                    <span class="stat-value" style="color: var(--erep-blue);">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} items</span>
                    <span style="font-size: 10px; color: var(--text-secondary);">${singleOutput.toFixed(2)} / session</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Daily ${isFood ? 'Grain' : 'WRM'}</span>
                    <span class="stat-value" style="color: var(--erep-gold);">${cardRM.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isFood ? 'FRM' : 'WRM'}</span>
                    <span style="font-size: 10px; color: var(--text-secondary);">${singleRM.toFixed(2)} / bldg</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Est. Daily Profit</span>
                    <span class="stat-value ${cardGrossProfit >= 0 ? 'text-success' : 'text-danger'}">${cardGrossProfit.toFixed(2)} CC</span>
                    <span style="font-size: 10px; color: var(--text-secondary);">Rev: ${cardRevenue.toFixed(2)} CC</span>
                </div>
            </div>
            <div class="factory-action-area">
                ${fwCounterGroupsHtml('factory', fact.quality, companies, workers, companies * fact.maxEmployees, false)}
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Render plantation rows
    const plantationsContainer = document.getElementById("plantations-container");
    let totalPlantations = 0;     // total companies
    let plantSessions = 0;        // WAM + hired
    let plantWorkers = 0;         // hired only
    let totalGrainProduced = 0;
    
    if (plantationsContainer) {
        plantationsContainer.innerHTML = "";
        
        plantationsData.forEach(plant => {
            const cell = moduleState.plantations[plant.quality] || { companies: 0, workers: 0 };
            const companies = cell.companies || 0;
            const workers = Math.min(cell.workers || 0, companies * plant.maxEmployees);
            const sessions = (state.wamEnabled ? companies : 0) + workers;
            totalPlantations += companies;
            plantSessions += sessions;
            plantWorkers += workers;
            
            // Raw materials pollution is at index 0 of qualityPollution
            const pollutionRate = (moduleState.qualityPollution && typeof moduleState.qualityPollution[0] === 'number') 
                ? moduleState.qualityPollution[0] 
                : moduleState.pollution;
            
            // Output Multiplier
            const multiplier = 1 + (moduleState.countryBonus / 100) + (moduleState.regionBonus / 100) + (state.hasTycoon ? 0.2 : 0) - (pollutionRate / 100);
            const cardMultiplier = Math.max(0, multiplier);
            
            // Raw production: the game rounds to 3dp then truncates the 3rd (floor to 2dp),
            // per company, then sums those truncated values.
            const singleOutput = gameRawProduction((plant.baseOutput / 100) * cardMultiplier);
            const cardOutput = singleOutput * sessions;
            totalGrainProduced += cardOutput;
            
            // Create Plantation Card DOM
            const card = document.createElement("div");
            card.className = "factory-row-card";
            card.style.borderLeft = isFood ? "3px solid #e67e22" : "3px solid #7f8c8d";
            
            const plantFallbackSvg = isFood ? `
                <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #e67e22; fill: rgba(230, 126, 34, 0.1);">
                    <path d="M12 2v20M17 5l-5 5M7 5l5 5M17 10l-5 5M7 10l5 5M17 15l-5 5M7 15l5 5" stroke-linecap="round"/>
                </svg>
            ` : `
                <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #7f8c8d; fill: rgba(127, 140, 141, 0.1);">
                    <path d="M4 22V4h16v18M12 4v18M4 10h16M4 16h16" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            const plantIconHtml = gameIconHtml(plantationIconUrl(isFood, plant.quality), plantFallbackSvg);
            
            card.innerHTML = `
                <div class="factory-avatar-area" style="background: ${isFood ? 'rgba(230, 126, 34, 0.1)' : 'rgba(127, 140, 141, 0.1)'}; color: ${isFood ? '#e67e22' : '#7f8c8d'}; border-radius: 4px; padding: 4px;">
                    ${plantIconHtml}
                </div>
                <div class="factory-info-area">
                    <div class="factory-title">${plant.name}</div>
                    <div class="stars-container">
                        ${generateStarsHtml(plant.quality)}
                    </div>
                    <div class="factory-pollution" style="font-size: 11px; margin-top: 4px; color: ${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'}; font-weight: 500;">
                        Pollution: ${pollutionRate.toFixed(2)}%
                    </div>
                </div>
                <div class="factory-stats-area">
                    <div class="stat-item">
                        <span class="stat-label">Daily Output</span>
                        <span class="stat-value" style="color: ${isFood ? '#e67e22' : '#7f8c8d'};">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isFood ? 'FRM' : 'WRM'}</span>
                        <span style="font-size: 10px; color: var(--text-secondary);">${singleOutput.toFixed(2)} / session</span>
                    </div>
                    <div class="stat-item" style="opacity: 0.5;">
                        <!-- Placeholder to align with factory cards -->
                    </div>
                    <div class="stat-item">
                        <!-- Placeholder to align with factory cards -->
                    </div>
                </div>
                <div class="factory-action-area">
                    ${fwCounterGroupsHtml('plantation', plant.quality, companies, workers, companies * plant.maxEmployees, plant.maxEmployees === 0)}
                </div>
            `;
            
            // Hover styling for plantation rows
            card.onmouseenter = () => {
                card.style.borderColor = isFood ? "#e67e22" : "#7f8c8d";
                card.style.boxShadow = isFood ? "0 2px 5px rgba(230, 126, 34, 0.15)" : "0 2px 5px rgba(127, 140, 141, 0.15)";
                card.style.transform = "translateX(4px)";
            };
            card.onmouseleave = () => {
                card.style.borderColor = "var(--border-color)";
                card.style.boxShadow = "none";
                card.style.transform = "none";
            };
            
            plantationsContainer.appendChild(card);
        });
    }
    
    // Mirror eRepublik's totals: sum of the per-company displayed values, rounded to 2dp.
    totalOutput = roundNumber(totalOutput, 2);
    totalRM = roundNumber(totalRM, 2);
    totalGrainProduced = roundNumber(totalGrainProduced, 2);

    // STRATEGY MATH & COMPARISON
    const taxPerSession = (state.workTaxRate / 100) * state.averageSalary;
    const factoryTax = factorySessions * taxPerSession;
    const factoryLabor = factoryWorkers * state.offeredSalary;
    const totalGrainRequiredVal = totalRM;
    const netGrainBalance = totalGrainProduced - totalGrainRequiredVal;

    // Option A: Buy 100% of raw material
    const grainExpenseOptionA = totalGrainRequiredVal * rmPrice;
    const netProfitOptionA = sumRevenue - factoryTax - factoryLabor - grainExpenseOptionA;

    // Option B: Produce (run plantations)
    const plantTax = plantSessions * taxPerSession;
    const plantLabor = plantWorkers * state.offeredSalary;

    let marketExpenseOptionB = 0;
    let marketRevenueOptionB = 0;
    if (netGrainBalance < 0) {
        marketExpenseOptionB = (-netGrainBalance) * rmPrice;
    } else {
        marketRevenueOptionB = netGrainBalance * rmPrice * (1 - state.vat / 100);
    }

    const netProfitOptionB = sumRevenue - factoryTax - factoryLabor - plantTax - plantLabor - marketExpenseOptionB + marketRevenueOptionB;
    
    // Determine Optimal Option
    const isOptionBBetter = netProfitOptionB > netProfitOptionA;
    
    // Set Main summary variables based on optimal option
    let displayGrainCost = 0;
    let displayWorkTax = 0;   // total work tax (all sessions) for the chosen option
    let displaySalary = 0;    // total hired-worker labor for the chosen option
    let displayNetProfit = 0;
    const badge = document.getElementById("summary-strategy-badge");

    if (isOptionBBetter) {
        displayGrainCost = marketExpenseOptionB - marketRevenueOptionB;
        displayWorkTax = factoryTax + plantTax;
        displaySalary = factoryLabor + plantLabor;
        displayNetProfit = netProfitOptionB;
        if (badge) {
            badge.textContent = "Option B: Produce";
            badge.style.background = isFood ? "#e67e22" : "#7f8c8d";
        }
    } else {
        displayGrainCost = grainExpenseOptionA;
        displayWorkTax = factoryTax;
        displaySalary = factoryLabor;
        displayNetProfit = netProfitOptionA;
        if (badge) {
            badge.textContent = "Option A: Buy";
            badge.style.background = "var(--erep-blue)";
        }
    }
    
    // Update main summary DOM
    const grossDailyProfit = sumRevenue - displayGrainCost;
    
    totalFactoriesCount.textContent = totalFactories;
    totalFoodOutput.textContent = totalOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    totalGrainRequired.textContent = `${totalRM.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isFood ? 'FRM' : 'WRM'}`;
    totalGrossRevenue.textContent = `${sumRevenue.toFixed(2)} CC`;
    
    const totalGrainCostEl = document.getElementById("total-grain-cost");
    totalGrainCostEl.textContent = `${displayGrainCost.toFixed(2)} CC`;
    if (displayGrainCost < 0) {
        totalGrainCostEl.className = "kpi-value text-success";
    } else {
        totalGrainCostEl.className = "kpi-value kpi-gold";
    }
    
    totalGrossProfit.textContent = `${grossDailyProfit.toFixed(2)} CC`;
    if (grossDailyProfit >= 0) {
        totalGrossProfit.className = "kpi-value text-success";
    } else {
        totalGrossProfit.className = "kpi-value text-danger";
    }
    
    document.getElementById("total-work-tax").textContent = `-${displayWorkTax.toFixed(2)} CC`;
    document.getElementById("total-salary").textContent = `-${displaySalary.toFixed(2)} CC`;

    const totalNetProfit = document.getElementById("total-net-profit");
    totalNetProfit.textContent = `${displayNetProfit.toFixed(2)} CC`;
    if (displayNetProfit >= 0) {
        totalNetProfit.className = "kpi-value text-success";
    } else {
        totalNetProfit.className = "kpi-value text-danger";
    }
    
    if (breakdownHtml === "") {
        breakdownList.innerHTML = `<li class="info-text" style="text-align: center; font-style: italic;">No factories configured yet.</li>`;
    } else {
        breakdownList.innerHTML = breakdownHtml;
    }
    
    // Update comparison elements
    document.getElementById("total-grain-produced").textContent = `${totalGrainProduced.toFixed(2)} ${isFood ? 'FRM' : 'WRM'}`;
    
    const balanceSpan = document.getElementById("grain-net-balance");
    balanceSpan.textContent = `${(netGrainBalance >= 0 ? "+" : "")}${netGrainBalance.toFixed(2)} ${isFood ? 'FRM' : 'WRM'}`;
    if (netGrainBalance >= 0) {
        balanceSpan.className = "kpi-value-small text-success";
    } else {
        balanceSpan.className = "kpi-value-small text-danger";
    }
    
    document.getElementById("strategy-buy-cost").textContent = grainExpenseOptionA.toFixed(2);
    const profitBuySpan = document.getElementById("strategy-buy-profit");
    profitBuySpan.textContent = `${netProfitOptionA.toFixed(2)} CC`;
    if (netProfitOptionA >= 0) {
        profitBuySpan.className = "text-success";
    } else {
        profitBuySpan.className = "text-danger";
    }
    
    document.getElementById("strategy-produce-tax").textContent = (factoryTax + plantTax).toFixed(2);
    document.getElementById("strategy-produce-balance").textContent = `${(netGrainBalance >= 0 ? "+" : "")}${netGrainBalance.toFixed(2)}`;
    const profitProduceSpan = document.getElementById("strategy-produce-profit");
    profitProduceSpan.textContent = `${netProfitOptionB.toFixed(2)} CC`;
    if (netProfitOptionB >= 0) {
        profitProduceSpan.className = "text-success";
    } else {
        profitProduceSpan.className = "text-danger";
    }
    
    const buyCard = document.getElementById("strategy-buy-card");
    const produceCard = document.getElementById("strategy-produce-card");
    const recommendationDiv = document.getElementById("strategy-recommendation");
    
    // Reset styles
    buyCard.style.borderColor = "var(--border-color)";
    buyCard.style.backgroundColor = "var(--bg-card)";
    produceCard.style.borderColor = "var(--border-color)";
    produceCard.style.backgroundColor = "var(--bg-card)";
    
    if (netProfitOptionA > netProfitOptionB) {
        // Highlight Option A
        buyCard.style.borderColor = "var(--erep-green)";
        buyCard.style.backgroundColor = "rgba(122, 183, 0, 0.05)";
        
        const diff = netProfitOptionA - netProfitOptionB;
        recommendationDiv.textContent = `Recommendation: Option A (Buy ${isFood ? 'Grain' : 'WRM'}) is more profitable by ${diff.toFixed(2)} CC/day`;
        recommendationDiv.style.borderColor = "var(--erep-green)";
        recommendationDiv.style.color = "var(--erep-green-border)";
        recommendationDiv.style.backgroundColor = "rgba(122, 183, 0, 0.08)";
    } else if (netProfitOptionB > netProfitOptionA) {
        // Highlight Option B
        produceCard.style.borderColor = "var(--erep-green)";
        produceCard.style.backgroundColor = "rgba(122, 183, 0, 0.05)";
        
        const diff = netProfitOptionB - netProfitOptionA;
        recommendationDiv.textContent = `Recommendation: Option B (Produce) is more profitable by ${diff.toFixed(2)} CC/day`;
        recommendationDiv.style.borderColor = "var(--erep-green)";
        recommendationDiv.style.color = "var(--erep-green-border)";
        recommendationDiv.style.backgroundColor = "rgba(122, 183, 0, 0.08)";
    } else {
        recommendationDiv.textContent = "Recommendation: Both options are equally profitable";
        recommendationDiv.style.borderColor = "var(--border-color)";
        recommendationDiv.style.color = "var(--text-primary)";
        recommendationDiv.style.backgroundColor = "var(--bg-header)";
    }
    
    // Set up listeners for the newly rendered buttons
    setupListeners();
}

// Two compact, vertically-stacked counter rows (Companies / Workers) for a house or HRM card
function houseCounterGroupsHtml(kind, quality, companies, workers, maxWorkers) {
    const row = (field, value, label, hint) => `
        <div class="house-counter-row">
            <span class="house-counter-label">${label}${hint}</span>
            <div class="counter-group counter-group-sm">
                <button class="btn-counter house-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="-1">-</button>
                <input type="text" class="counter-input house-counter-input" data-kind="${kind}" data-field="${field}" data-quality="${quality}" value="${value}" inputmode="numeric" pattern="[0-9]*">
                <button class="btn-counter house-counter-btn" data-kind="${kind}" data-field="${field}" data-quality="${quality}" data-delta="1">+</button>
            </div>
        </div>`;
    return `<div class="house-counters">`
        + row('companies', companies, 'Companies', '')
        + row('workers', workers, 'Workers', ` <span class="max-hint">· max ${maxWorkers}</span>`)
        + `</div>`;
}

function houseFactoryCardHtml(fac, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cardHrm, cardProfit, cardRevenue, cfg) {
    const fallbackSvg = `
            <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#8e7cc3;fill:rgba(142,124,195,0.1);">
                <path d="M3 11l9-7 9 7M5 10v10h14V10M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
    return `
        <div class="factory-avatar-area">
            ${gameIconHtml(`${EREP_CDN}/icons/industry/${cfg.factoryIconIndustry}/q${fac.quality}.png`, fallbackSvg)}
        </div>
        <div class="factory-info-area">
            <div class="factory-title">${fac.name}</div>
            <div class="stars-container">${generateStarsHtml(fac.quality)}</div>
            <div class="factory-pollution" style="font-size:11px;margin-top:4px;color:${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'};font-weight:500;">Pollution: ${pollutionRate.toFixed(2)}%</div>
        </div>
        <div class="factory-stats-area">
            <div class="stat-item">
                <span class="stat-label">Daily Output</span>
                <span class="stat-value" style="color: var(--erep-blue);">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.productNounPluralCard.toLowerCase()}</span>
                <span style="font-size:10px;color:var(--text-secondary);">${singleOutput.toFixed(4)} / worker</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Daily ${cfg.rmNoun}</span>
                <span class="stat-value" style="color: var(--erep-gold);">${cardHrm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.rmNoun}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Est. Daily Profit</span>
                <span class="stat-value ${cardProfit >= 0 ? 'text-success' : 'text-danger'}">${cardProfit.toFixed(2)} CC</span>
                <span style="font-size:10px;color:var(--text-secondary);">Rev: ${cardRevenue.toFixed(2)} CC</span>
            </div>
        </div>
        <div class="factory-action-area">${houseCounterGroupsHtml('factory', fac.quality, companies, workers, maxWorkers)}</div>`;
}

function houseRmCardHtml(rm, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cfg) {
    const fallbackSvg = `
            <svg class="factory-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#78909c;fill:rgba(120,144,156,0.1);">
                <path d="M3 20h18L17 8l-4 5-3-4-4 6z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
    return `
        <div class="factory-avatar-area" style="background:rgba(120,144,156,0.1);color:#78909c;border-radius:4px;padding:4px;">
            ${gameIconHtml(`${EREP_CDN}/buildings/${cfg.rmBuildingIds[rm.quality]}.png`, fallbackSvg)}
        </div>
        <div class="factory-info-area">
            <div class="factory-title">${rm.name}</div>
            <div class="stars-container">${generateStarsHtml(rm.quality)}</div>
            <div class="factory-pollution" style="font-size:11px;margin-top:4px;color:${pollutionRate > 0 ? '#e74c3c' : 'var(--text-secondary)'};font-weight:500;">Pollution: ${pollutionRate.toFixed(2)}%</div>
        </div>
        <div class="factory-stats-area">
            <div class="stat-item">
                <span class="stat-label">Daily Output</span>
                <span class="stat-value" style="color:#78909c;">${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.rmNoun}</span>
                <span style="font-size:10px;color:var(--text-secondary);">${singleOutput.toFixed(4)} / worker</span>
            </div>
            <div class="stat-item" style="opacity:0.5;"></div>
            <div class="stat-item"></div>
        </div>
        <div class="factory-action-area">${houseCounterGroupsHtml('rm', rm.quality, companies, workers, maxWorkers)}</div>`;
}

function renderHiredLaborModule(moduleKey) {
    const cfg = HIRED_LABOR_MODULES[moduleKey];
    setActiveTabHighlight(moduleKey);

    const h = state[moduleKey];
    const rmPrice = state[cfg.priceField];

    // --- Labels / titles ---
    const activeModuleSpan = document.querySelector(".active-module .module-name");
    if (activeModuleSpan) activeModuleSpan.textContent = cfg.moduleTitle;
    const countryBonusLabel = document.getElementById("country-bonus-label");
    if (countryBonusLabel) countryBonusLabel.textContent = cfg.countryBonusLabel;
    const grainPriceLabel = document.getElementById("label-grain-price");
    if (grainPriceLabel) grainPriceLabel.textContent = `${cfg.rmNoun} Price (CC)`;
    const foodPricesHeader = document.getElementById("food-prices-header");
    if (foodPricesHeader) foodPricesHeader.textContent = cfg.priceHeader;
    document.querySelectorAll(".food-price-label").forEach(label => {
        const q = label.getAttribute("data-quality");
        label.textContent = `Q${q} ${cfg.priceRowLabel}`;
    });
    for (let q = 1; q <= 5; q++) { const r = document.getElementById(`price-row-q${q}`); if (r) r.style.display = ""; }
    for (let q = 6; q <= 7; q++) { const r = document.getElementById(`price-row-q${q}`); if (r) r.style.display = "none"; }

    const factoriesTitle = document.getElementById("factories-main-title");
    if (factoriesTitle) factoriesTitle.textContent = cfg.factoriesTitle;
    const factoriesSub = document.getElementById("factories-subtitle");
    if (factoriesSub) factoriesSub.textContent = cfg.factoriesSubtitle;
    const plantationsTitle = document.getElementById("plantations-main-title");
    if (plantationsTitle) plantationsTitle.textContent = cfg.rmTitle;
    const plantationsSub = document.getElementById("plantations-subtitle");
    if (plantationsSub) plantationsSub.textContent = cfg.rmSubtitle;

    const labelOutput = document.getElementById("label-total-output");
    if (labelOutput) labelOutput.textContent = `${cfg.productNounPlural} Output:`;
    const labelConsumed = document.getElementById("label-total-consumed");
    if (labelConsumed) labelConsumed.textContent = `${cfg.rmNoun} Consumed:`;
    const labelCostKpi = document.getElementById("label-daily-cost-kpi");
    if (labelCostKpi) labelCostKpi.textContent = `Daily ${cfg.rmNoun} Cost`;
    const labelWorkTaxKpi = document.getElementById("label-work-tax-kpi");
    if (labelWorkTaxKpi) labelWorkTaxKpi.textContent = "Daily Work Tax";
    const labelTotalCount = document.getElementById("label-total-count");
    if (labelTotalCount) labelTotalCount.textContent = "Total Companies:";

    const stratHeader = document.getElementById("strategy-comparison-header");
    if (stratHeader) stratHeader.textContent = `${cfg.rmNoun} Strategy Comparison`;
    const labelProduced = document.getElementById("label-total-produced");
    if (labelProduced) labelProduced.textContent = `${cfg.rmNoun} Produced:`;
    const labelBalance = document.getElementById("label-net-balance");
    if (labelBalance) labelBalance.textContent = `${cfg.rmNoun} Net Balance:`;
    const stratBuyTitle = document.getElementById("strategy-buy-title");
    if (stratBuyTitle) stratBuyTitle.textContent = cfg.strategyBuyTitle;
    const stratProduceTitle = document.getElementById("strategy-produce-title");
    if (stratProduceTitle) stratProduceTitle.textContent = cfg.strategyProduceTitle;
    const produceTaxLabel = document.getElementById("strategy-produce-tax-label");
    if (produceTaxLabel) produceTaxLabel.textContent = `${cfg.rmNoun} Cost:`;

    const workTaxGroup = document.getElementById("work-tax-group");
    if (workTaxGroup) workTaxGroup.style.display = "none";
    const wamGroupH = document.getElementById("wam-group");
    if (wamGroupH) wamGroupH.style.display = "none";

    // --- Sync modifier/market inputs with houses state ---
    document.getElementById("country-bonus-slider").value = h.countryBonus;
    document.getElementById("country-bonus-value").textContent = `${h.countryBonus}%`;
    document.getElementById("tycoon-toggle").checked = state.hasTycoon;
    document.getElementById("input-region-bonus").value = h.regionBonus;
    document.getElementById("input-average-salary").value = state.averageSalary.toFixed(2);
    document.getElementById("input-offered-salary").value = state.offeredSalary.toFixed(2);
    document.getElementById("select-country").value = state.selectedCountryId || "";
    document.getElementById("select-region").value = state.selectedRegionPermalink || "";
    document.getElementById("input-grain-price").value = rmPrice.toFixed(2);
    document.getElementById("input-vat").value = state.vat.toFixed(1);
    for (let q = 1; q <= 5; q++) {
        const el = document.getElementById(`price-q${q}`);
        if (el) el.value = h.prices[q].toFixed(2);
    }

    const syncStatus = document.getElementById("sync-status");
    if (syncStatus) {
        if (state.selectedCountryId && state.selectedRegionPermalink) {
            syncStatus.textContent = `Auto-sync: Synced (Country: +${h.countryBonus}%, Region: +${h.regionBonus}%)`;
            syncStatus.style.color = "var(--erep-green, #7ab700)";
        } else if (state.selectedCountryId) {
            syncStatus.textContent = "Auto-sync: Region not selected";
            syncStatus.style.color = "var(--text-secondary)";
        } else {
            syncStatus.textContent = "Auto-sync: Not configured";
            syncStatus.style.color = "var(--text-secondary)";
        }
    }

    const multiplierFor = (qualityIndex) => {
        const pollutionRate = (typeof h.qualityPollution[qualityIndex] === 'number') ? h.qualityPollution[qualityIndex] : h.pollution;
        return { mult: Math.max(0, 1 + (h.countryBonus / 100) + (h.regionBonus / 100) + (state.hasTycoon ? 0.2 : 0) - (pollutionRate / 100)), pollutionRate };
    };

    // --- House factory cards ---
    const container = document.getElementById("factories-container");
    container.innerHTML = "";
    let totalCompanies = 0, totalWorkers = 0, totalOutput = 0, totalHrmUsed = 0, sumRevenue = 0;
    let breakdownHtml = "";

    cfg.factoriesData.forEach(fac => {
        const cell = h.factories[fac.quality];
        const companies = cell.companies || 0;
        const maxWorkers = companies * fac.maxEmployees;
        const workers = Math.min(cell.workers || 0, maxWorkers);
        totalCompanies += companies;
        totalWorkers += workers;

        const { mult, pollutionRate } = multiplierFor(fac.quality);
        const singleOutput = fac.baseOutput * mult;
        const cardOutput = singleOutput * workers;
        const cardHrm = fac.baseRM * mult * workers;
        const productPrice = h.prices[fac.quality];
        const cardRevenue = cardOutput * productPrice * (1 - state.vat / 100);
        const cardHrmCost = cardHrm * rmPrice;
        const cardSalary = workers * state.offeredSalary;
        const cardTax = workers * (state.workTaxRate / 100) * state.averageSalary;
        const cardProfit = cardRevenue - cardHrmCost - cardSalary - cardTax;

        totalOutput += cardOutput;
        totalHrmUsed += cardHrm;
        sumRevenue += cardRevenue;

        if (companies > 0 || workers > 0) {
            breakdownHtml += `
                <li class="breakdown-item">
                    <span class="breakdown-label">Q${fac.quality} (${companies}c / ${workers}w)</span>
                    <span class="breakdown-count" style="display:flex;flex-direction:column;align-items:flex-end;">
                        <span>+${cardOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cfg.productNounPluralCard}</span>
                        <span class="${cardProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-size:11px;font-weight:700;">${cardProfit >= 0 ? '+' : ''}${cardProfit.toFixed(2)} CC</span>
                    </span>
                </li>`;
        }

        const card = document.createElement("div");
        card.className = "factory-row-card";
        card.innerHTML = houseFactoryCardHtml(fac, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cardHrm, cardProfit, cardRevenue, cfg);
        container.appendChild(card);
    });

    // --- HRM company cards ---
    const rmContainer = document.getElementById("plantations-container");
    rmContainer.innerHTML = "";
    let totalRmWorkers = 0, totalHrmProduced = 0;

    cfg.rmData.forEach(rm => {
        const cell = h.rm[rm.quality];
        const companies = cell.companies || 0;
        const maxWorkers = companies * rm.maxEmployees;
        const workers = Math.min(cell.workers || 0, maxWorkers);
        totalRmWorkers += workers;

        const { mult, pollutionRate } = multiplierFor(0); // index 0 = raw-material pollution
        const singleOutput = (rm.baseOutput / 100) * mult;
        const cardOutput = singleOutput * workers;
        totalHrmProduced += cardOutput;

        const card = document.createElement("div");
        card.className = "factory-row-card";
        card.style.borderLeft = "3px solid #78909c";
        card.innerHTML = houseRmCardHtml(rm, companies, workers, maxWorkers, pollutionRate, singleOutput, cardOutput, cfg);
        rmContainer.appendChild(card);
    });

    // --- Strategy math ---
    const houseTaxPerSession = (state.workTaxRate / 100) * state.averageSalary;
    const houseSalaryCost = totalWorkers * state.offeredSalary;      // house-factory labor
    const hrmSalaryCost = totalRmWorkers * state.offeredSalary;      // HRM labor
    const houseWorkTax = totalWorkers * houseTaxPerSession;          // no WAM in houses
    const hrmWorkTax = totalRmWorkers * houseTaxPerSession;
    const netHrmBalance = totalHrmProduced - totalHrmUsed;

    // Option A: buy all HRM, run no RM companies
    const optionA_hrmCost = totalHrmUsed * rmPrice;
    const netA = sumRevenue - optionA_hrmCost - houseSalaryCost - houseWorkTax;

    // Option B: produce HRM
    let marketExpenseB = 0, marketRevenueB = 0;
    if (netHrmBalance < 0) marketExpenseB = (-netHrmBalance) * rmPrice;
    else marketRevenueB = netHrmBalance * rmPrice * (1 - state.vat / 100);
    const netB = sumRevenue - houseSalaryCost - hrmSalaryCost - houseWorkTax - hrmWorkTax - marketExpenseB + marketRevenueB;

    const isBbetter = netB > netA;
    let displayHrmCost, displaySalary, displayTax, displayNet;
    const badge = document.getElementById("summary-strategy-badge");
    if (isBbetter) {
        displayHrmCost = marketExpenseB - marketRevenueB;
        displaySalary = houseSalaryCost + hrmSalaryCost;
        displayTax = houseWorkTax + hrmWorkTax;
        displayNet = netB;
        if (badge) { badge.textContent = "Option B: Produce"; badge.style.background = "#78909c"; }
    } else {
        displayHrmCost = optionA_hrmCost;
        displaySalary = houseSalaryCost;
        displayTax = houseWorkTax;
        displayNet = netA;
        if (badge) { badge.textContent = "Option A: Buy"; badge.style.background = "var(--erep-blue)"; }
    }
    const grossDailyProfit = sumRevenue - displayHrmCost;

    // --- Summary KPIs ---
    document.getElementById("total-factories-count").textContent = totalCompanies;
    document.getElementById("total-food-output").textContent = totalOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("total-grain-required").textContent = `${totalHrmUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HRM`;
    document.getElementById("total-gross-revenue").textContent = `${sumRevenue.toFixed(2)} CC`;

    const totalGrainCostEl = document.getElementById("total-grain-cost");
    totalGrainCostEl.textContent = `${displayHrmCost.toFixed(2)} CC`;
    totalGrainCostEl.className = displayHrmCost < 0 ? "kpi-value text-success" : "kpi-value kpi-gold";

    const grossProfitEl = document.getElementById("total-gross-profit");
    grossProfitEl.textContent = `${grossDailyProfit.toFixed(2)} CC`;
    grossProfitEl.className = grossDailyProfit >= 0 ? "kpi-value text-success" : "kpi-value text-danger";

    document.getElementById("total-work-tax").textContent = `-${displayTax.toFixed(2)} CC`;
    document.getElementById("total-salary").textContent = `-${displaySalary.toFixed(2)} CC`;

    const netProfitEl = document.getElementById("total-net-profit");
    netProfitEl.textContent = `${displayNet.toFixed(2)} CC`;
    netProfitEl.className = displayNet >= 0 ? "kpi-value text-success" : "kpi-value text-danger";

    const breakdownList = document.getElementById("factory-breakdown-list");
    breakdownList.innerHTML = breakdownHtml === "" ? `<li class="info-text" style="text-align:center;font-style:italic;">No house companies configured yet.</li>` : breakdownHtml;

    // --- Strategy comparison panel ---
    document.getElementById("total-grain-produced").textContent = `${totalHrmProduced.toFixed(2)} HRM`;
    const balanceSpan = document.getElementById("grain-net-balance");
    balanceSpan.textContent = `${netHrmBalance >= 0 ? "+" : ""}${netHrmBalance.toFixed(2)} HRM`;
    balanceSpan.className = netHrmBalance >= 0 ? "kpi-value-small text-success" : "kpi-value-small text-danger";

    document.getElementById("strategy-buy-cost").textContent = optionA_hrmCost.toFixed(2);
    const profitBuySpan = document.getElementById("strategy-buy-profit");
    profitBuySpan.textContent = `${netA.toFixed(2)} CC`;
    profitBuySpan.className = netA >= 0 ? "text-success" : "text-danger";

    document.getElementById("strategy-produce-tax").textContent = (hrmWorkTax + hrmSalaryCost).toFixed(2);
    document.getElementById("strategy-produce-balance").textContent = `${netHrmBalance >= 0 ? "+" : ""}${netHrmBalance.toFixed(2)}`;
    const profitProduceSpan = document.getElementById("strategy-produce-profit");
    profitProduceSpan.textContent = `${netB.toFixed(2)} CC`;
    profitProduceSpan.className = netB >= 0 ? "text-success" : "text-danger";

    const buyCard = document.getElementById("strategy-buy-card");
    const produceCard = document.getElementById("strategy-produce-card");
    const recommendationDiv = document.getElementById("strategy-recommendation");
    buyCard.style.borderColor = "var(--border-color)";
    buyCard.style.backgroundColor = "var(--bg-card)";
    produceCard.style.borderColor = "var(--border-color)";
    produceCard.style.backgroundColor = "var(--bg-card)";

    if (netA > netB) {
        buyCard.style.borderColor = "var(--erep-green)";
        buyCard.style.backgroundColor = "rgba(122, 183, 0, 0.05)";
        recommendationDiv.textContent = `Recommendation: Option A (Buy HRM) is more profitable by ${(netA - netB).toFixed(2)} CC/day`;
        recommendationDiv.style.borderColor = "var(--erep-green)";
        recommendationDiv.style.color = "var(--erep-green-border)";
        recommendationDiv.style.backgroundColor = "rgba(122, 183, 0, 0.08)";
    } else if (netB > netA) {
        produceCard.style.borderColor = "var(--erep-green)";
        produceCard.style.backgroundColor = "rgba(122, 183, 0, 0.05)";
        recommendationDiv.textContent = `Recommendation: Option B (Produce) is more profitable by ${(netB - netA).toFixed(2)} CC/day`;
        recommendationDiv.style.borderColor = "var(--erep-green)";
        recommendationDiv.style.color = "var(--erep-green-border)";
        recommendationDiv.style.backgroundColor = "rgba(122, 183, 0, 0.08)";
    } else {
        recommendationDiv.textContent = "Recommendation: Both options are equally profitable";
        recommendationDiv.style.borderColor = "var(--border-color)";
        recommendationDiv.style.color = "var(--text-primary)";
        recommendationDiv.style.backgroundColor = "var(--bg-header)";
    }

    setupListeners();
}

// Bind events to interactive controls
function setupListeners() {
    // Tab switching
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

    // Food/Weapon counter buttons (companies / workers, factory / plantation)
    document.querySelectorAll(".fw-counter-btn").forEach(btn => {
        btn.onclick = function() {
            const active = state.activeModule;
            const kind = this.getAttribute("data-kind");
            const field = this.getAttribute("data-field");
            const q = this.getAttribute("data-quality");
            const delta = parseInt(this.getAttribute("data-delta"), 10);
            const current = getFwCell(active, kind, q)[field] || 0;
            applyFwCounterChange(active, kind, field, q, current + delta);
            saveState();
            render();
        };
    });

    // Food/Weapon counter text inputs
    document.querySelectorAll(".fw-counter-input").forEach(input => {
        input.oninput = function() {
            const valStr = this.value.replace(/[^0-9]/g, '');
            this.value = valStr;
            let val = parseInt(valStr, 10);
            if (isNaN(val)) val = 0;
            applyFwCounterChange(state.activeModule, this.getAttribute("data-kind"), this.getAttribute("data-field"), this.getAttribute("data-quality"), val);
        };
        input.onblur = function() {
            if (this.value === "") this.value = "0";
            saveState();
            render();
        };
        input.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    });

    // House counter buttons (companies / workers, factory / rm)
    document.querySelectorAll(".house-counter-btn").forEach(btn => {
        btn.onclick = function() {
            const kind = this.getAttribute("data-kind");
            const field = this.getAttribute("data-field");
            const q = this.getAttribute("data-quality");
            const delta = parseInt(this.getAttribute("data-delta"), 10);
            const current = getHouseCell(kind, q)[field] || 0;
            applyHouseCounterChange(kind, field, q, current + delta);
            saveState();
            render();
        };
    });

    // House counter text inputs
    document.querySelectorAll(".house-counter-input").forEach(input => {
        input.oninput = function() {
            const valStr = this.value.replace(/[^0-9]/g, '');
            this.value = valStr;
            let val = parseInt(valStr, 10);
            if (isNaN(val)) val = 0;
            applyHouseCounterChange(this.getAttribute("data-kind"), this.getAttribute("data-field"), this.getAttribute("data-quality"), val);
        };
        input.onblur = function() {
            if (this.value === "") this.value = "0";
            saveState();
            render();
        };
        input.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    });

    // Country Dropdown Change listener
    const selectCountry = document.getElementById("select-country");
    if (selectCountry) {
        selectCountry.onchange = async function() {
            const countryId = this.value;
            state.selectedCountryId = countryId;
            state.selectedRegionPermalink = ""; // Reset region selection
            
            saveState();
            render();
            
            if (countryId) {
                await loadRegionsForCountry(countryId);
            } else {
                const regionSelect = document.getElementById("select-region");
                if (regionSelect) {
                    regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
                    regionSelect.disabled = true;
                }
            }
        };
    }

    // Region Dropdown Change listener
    const selectRegion = document.getElementById("select-region");
    if (selectRegion) {
        selectRegion.onchange = function() {
            state.selectedRegionPermalink = this.value;
            saveState();
            syncRegionModifiers();
        };
    }

    // Country Bonus Slider
    const slider = document.getElementById("country-bonus-slider");
    if (slider) {
        slider.oninput = function() {
            const active = state.activeModule;
            state[active].countryBonus = parseInt(this.value, 10);
            document.getElementById("country-bonus-value").textContent = `${this.value}%`;
            
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
    const toggle = document.getElementById("tycoon-toggle");
    if (toggle) {
        toggle.onchange = function() {
            state.hasTycoon = this.checked;
            saveState();
            render();
        };
    }

    // Work-as-Manager Toggle (counts the owner's 1 WAM session per company when on)
    const wamToggle = document.getElementById("wam-toggle");
    if (wamToggle) {
        wamToggle.onchange = function() {
            state.wamEnabled = this.checked;
            saveState();
            render();
        };
    }

    // Region Bonus Input
    const regionBonusInput = document.getElementById("input-region-bonus");
    if (regionBonusInput) {
        regionBonusInput.onchange = function() {
            const active = state.activeModule;
            let val = parseInt(this.value, 10);
            if (isNaN(val) || val < 0) {
                val = 0;
            }
            state[active].regionBonus = Math.min(val, 100);
            
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
            if (e.key === "Enter") this.blur();
        };
    }

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

    // Offered Salary Input (labor paid to hired workers; does not de-sync location)
    const offeredSalaryInput = document.getElementById("input-offered-salary");
    if (offeredSalaryInput) {
        offeredSalaryInput.onchange = function() {
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) val = 0.0;
            state.offeredSalary = val;
            saveState();
            render();
        };
        offeredSalaryInput.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    }

    // Grain Price Input
    const grainPriceInput = document.getElementById("input-grain-price");
    if (grainPriceInput) {
        grainPriceInput.onchange = function() {
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) {
                val = state.activeModule === "houses" ? 1535.00
                    : state.activeModule === "aircraft" ? 1415.00 : 50.00;
            }
            if (state.activeModule === "food") {
                state.frmPrice = val;
            } else if (state.activeModule === "weapons") {
                state.wrmPrice = val;
            } else if (state.activeModule === "houses") {
                state.hrmPrice = val;
            } else {
                state.armPrice = val;
            }
            saveState();
            render();
        };
        grainPriceInput.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    }

    // VAT Input
    const vatInput = document.getElementById("input-vat");
    if (vatInput) {
        vatInput.onchange = function() {
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) {
                val = 1.0;
            }
            state.vat = Math.min(val, 50.0);
            saveState();
            render();
        };
        vatInput.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    }

    // Food/Weapon Prices Inputs
    document.querySelectorAll(".food-price-input").forEach(input => {
        input.onchange = function() {
            const quality = this.getAttribute("data-quality");
            const active = state.activeModule;
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) {
                val = 0.00;
            }
            state[active].prices[quality] = val;
            saveState();
            render();
        };
        input.onkeydown = function(e) {
            if (e.key === "Enter") this.blur();
        };
    });

    // Sync button
    const btnSync = document.getElementById("btn-sync-prices");
    if (btnSync) {
        btnSync.onclick = syncLivePrices;
    }
}

// Fetch live prices from eRepublik Tools API
async function syncLivePrices() {
    const btn = document.getElementById("btn-sync-prices");
    if (!btn) return;

    btn.classList.add("loading");
    btn.textContent = "Syncing...";

    try {
        if (state.activeModule === "food") {
            // Food module: fetch aggregate food prices (/0/1/1 has misc with Q1-Q7),
            // and FRM price from /0/7/1
            const foodUrl = `https://service.erepublik.tools/api/v1/market/item/0/1/1`;
            const frmUrl = `https://service.erepublik.tools/api/v1/market/item/0/7/1`;

            const [foodRes, frmRes] = await Promise.all([
                fetch(getProxyUrl(foodUrl)),
                fetch(getProxyUrl(frmUrl))
            ]);

            if (!foodRes.ok || !frmRes.ok) throw new Error("Server returned an error.");

            const foodData = await foodRes.json();
            const frmData = await frmRes.json();

            // Parse Food Prices from info.misc if available, else fall back to offers[0]
            if (foodData.status === "ok") {
                if (foodData.info && foodData.info.misc) {
                    const misc = foodData.info.misc;
                    for (let q = 1; q <= 7; q++) {
                        if (misc[q] && typeof misc[q].gross === 'number') {
                            state.food.prices[q] = misc[q].gross;
                        }
                    }
                } else if (foodData.offers && foodData.offers.length > 0) {
                    // Fallback: set Q1 from this request only
                    state.food.prices[1] = foodData.offers[0].gross;
                }
            }

            // Parse FRM price from the cheapest offer
            if (frmData.status === "ok" && frmData.offers && frmData.offers.length > 0) {
                state.frmPrice = frmData.offers[0].gross;
            }

        } else if (state.activeModule === "weapons") {
            // Weapon module: no misc aggregation available — fetch Q1-Q7 separately in parallel
            // WRM uses industry ID 12
            const weaponRequests = [1, 2, 3, 4, 5, 6, 7].map(q =>
                fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/2/${q}`))
            );
            const wrmRequest = fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/12/1`));

            const [wrmRes, ...weaponResponses] = await Promise.all([wrmRequest, ...weaponRequests]);

            // Parse WRM price from cheapest offer
            if (wrmRes.ok) {
                const wrmData = await wrmRes.json();
                if (wrmData.status === "ok" && wrmData.offers && wrmData.offers.length > 0) {
                    state.wrmPrice = wrmData.offers[0].gross;
                }
            }

            // Parse weapon prices Q1-Q7 from cheapest offer of each quality request
            for (let i = 0; i < weaponResponses.length; i++) {
                const q = i + 1;
                const res = weaponResponses[i];
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "ok" && data.offers && data.offers.length > 0) {
                        state.weapons.prices[q] = data.offers[0].gross;
                    }
                }
            }
        } else if (state.activeModule === "houses") {
            // Houses: industry 4 (per-quality, no info.misc); HRM: industry 17
            const houseRequests = [1, 2, 3, 4, 5].map(q =>
                fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/4/${q}`))
            );
            const hrmRequest = fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/17/1`));
            const [hrmRes, ...houseResponses] = await Promise.all([hrmRequest, ...houseRequests]);

            if (hrmRes.ok) {
                const hrmData = await hrmRes.json();
                if (hrmData.status === "ok" && hrmData.offers && hrmData.offers.length > 0) {
                    state.hrmPrice = hrmData.offers[0].gross;
                }
            }
            for (let i = 0; i < houseResponses.length; i++) {
                const q = i + 1;
                const res = houseResponses[i];
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "ok" && data.offers && data.offers.length > 0) {
                        state.houses.prices[q] = data.offers[0].gross;
                    }
                }
            }
        } else if (state.activeModule === "aircraft") {
            // Aircraft: industry 23 (per-quality, no info.misc); ARM: industry 24 (Q1 only)
            const aircraftRequests = [1, 2, 3, 4, 5].map(q =>
                fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/23/${q}`))
            );
            const armRequest = fetch(getProxyUrl(`https://service.erepublik.tools/api/v1/market/item/0/24/1`));
            const [armRes, ...aircraftResponses] = await Promise.all([armRequest, ...aircraftRequests]);

            if (armRes.ok) {
                const armData = await armRes.json();
                if (armData.status === "ok" && armData.offers && armData.offers.length > 0) {
                    state.armPrice = armData.offers[0].gross;
                }
            }
            for (let i = 0; i < aircraftResponses.length; i++) {
                const q = i + 1;
                const res = aircraftResponses[i];
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "ok" && data.offers && data.offers.length > 0) {
                        state.aircraft.prices[q] = data.offers[0].gross;
                    }
                }
            }
        }

        saveState();
        render();
        alert("Prices synced successfully with eRepublik Tools API!");
    } catch (e) {
        console.error("Price sync error:", e);
        alert("Failed to sync prices. This might be due to a proxy connection error or network issues.");
    } finally {
        btn.classList.remove("loading");
        btn.textContent = "Sync Live Prices";
    }
}

// Reset button handler
document.getElementById("btn-reset-all").onclick = function() {
    const active = state.activeModule;

    if (active === "houses" || active === "aircraft") {
        const m = state[active];
        for (let q = 1; q <= 5; q++) {
            m.factories[q] = { companies: 0, workers: 0 };
            m.rm[q] = { companies: 0, workers: 0 };
        }
        m.countryBonus = 100;
        m.regionBonus = 0;
        m.pollution = 0;
        m.qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (active === "houses") {
            m.prices = { 1: 29000, 2: 63500, 3: 129850, 4: 263498, 5: 315999 };
            state.hrmPrice = 1535.00;
        } else {
            m.prices = { 1: 963.00, 2: 900.00, 3: 1485.00, 4: 1800.00, 5: 2179.00 };
            state.armPrice = 1415.00;
        }
        state.hasTycoon = false;
        state.averageSalary = 0.0;
        state.selectedCountryId = "";
        state.selectedRegionPermalink = "";
        state.vat = 1.0;
        const syncStatusH = document.getElementById("sync-status");
        if (syncStatusH) { syncStatusH.textContent = "Auto-sync: Not configured"; syncStatusH.style.color = "var(--text-secondary)"; }
        const regionSelectH = document.getElementById("select-region");
        if (regionSelectH) { regionSelectH.innerHTML = '<option value="">-- Select Region --</option>'; regionSelectH.disabled = true; }
        saveState();
        render();
        return;
    }

    // Reset factories
    for (let q = 1; q <= 7; q++) {
        state[active][q] = { companies: 0, workers: 0 };
    }
    // Reset plantations
    state[active].plantations = {
        1: { companies: 0, workers: 0 },
        2: { companies: 0, workers: 0 },
        3: { companies: 0, workers: 0 },
        4: { companies: 0, workers: 0 },
        5: { companies: 0, workers: 0 }
    };
    // Reset modifiers
    state[active].countryBonus = 100;
    state[active].regionBonus = 0;
    state[active].pollution = 0;
    state[active].qualityPollution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    
    if (active === "food") {
        state.frmPrice = 50.00;
        state.food.prices = { 1: 0.80, 2: 1.60, 3: 2.40, 4: 3.20, 5: 4.00, 6: 5.00, 7: 9.90 };
    } else {
        state.wrmPrice = 50.00;
        state.weapons.prices = { 1: 1.20, 2: 2.40, 3: 3.60, 4: 4.80, 5: 6.00, 6: 8.00, 7: 15.00 };
    }
    
    // Reset shared state
    state.hasTycoon = false;
    state.workTaxRate = 1.0;
    state.averageSalary = 0.0;
    state.selectedCountryId = "";
    state.selectedRegionPermalink = "";
    state.vat = 1.0;
    
    const syncStatus = document.getElementById("sync-status");
    if (syncStatus) {
        syncStatus.textContent = "Auto-sync: Not configured";
        syncStatus.style.color = "var(--text-secondary)";
    }
    
    const regionSelect = document.getElementById("select-region");
    if (regionSelect) {
        regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
        regionSelect.disabled = true;
    }
    
    saveState();
    render();
};

// Initial App Bootstrapping
document.addEventListener("DOMContentLoaded", async () => {
    populateCountriesDropdown();
    loadState();
    if (state.selectedCountryId) {
        await loadRegionsForCountry(state.selectedCountryId, state.selectedRegionPermalink);
    }
    render();
});
