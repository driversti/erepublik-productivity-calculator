// holdingsCalc.mjs — pure profit math for the Holdings mode. No DOM access, so it is
// importable both by the browser (app.js) and by the node test runner (node --test).

// Standard round-to-N-decimals, identical to the game's roundNumber().
export function roundNumber(number, digits = 2) {
    const multiplier = Math.pow(10, digits);
    return Math.round(parseFloat(number) * multiplier) / multiplier;
}

// Raw-material production per company: the game rounds to 3 decimals then drops the
// 3rd decimal (floor to 2dp). e.g. 3.685 -> 3.68 (NOT 3.69).
export function gameRawProduction(value) {
    return Number(roundNumber(value, 3).toFixed(3).slice(0, -1));
}

// eRepublik productivity multiplier, floored at 0. Deliberately NOT rounded — the game
// (and app.js render()) rounds the PRODUCT (baseOutput × multiplier), not the multiplier
// itself, so leaving this raw keeps Holdings numbers identical to the industry tabs.
export function productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate }) {
    return Math.max(0, 1 + (countryBonus / 100) + (regionBonus / 100) + (hasTycoon ? 0.2 : 0) - (pollutionRate / 100));
}

// Quality-indexed pollution lookup (index 0 = raw-material rate); 0 if absent.
export function pollutionAt(qualityPollution, index) {
    return (qualityPollution && typeof qualityPollution[index] === 'number') ? qualityPollution[index] : 0;
}

// One food/weapons-style industry inside a holding (owner WAM + plantations).
// Returns { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net }.
export function computeFwIndustry(p) {
    const {
        factoriesData, plantationsData, factoryCells, plantationCells,
        countryBonus, regionBonus, qualityPollution, vat, prices, rmPrice,
        hasTycoon, wamEnabled, offeredSalary, workTaxRate, averageSalary
    } = p;

    let companies = 0, factoryWorkers = 0, wamSessions = 0;
    let output = 0, rmConsumed = 0, revenue = 0;

    for (const fact of factoriesData) {
        const cell = factoryCells[fact.quality] || { companies: 0, workers: 0 };
        const c = cell.companies || 0;
        const w = Math.min(cell.workers || 0, c * fact.maxEmployees);
        const sessions = (wamEnabled ? c : 0) + w;
        companies += c; factoryWorkers += w; wamSessions += (wamEnabled ? c : 0);

        const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, fact.quality) });
        const singleOutput = roundNumber(fact.baseOutput * mult, 2);
        const singleRM = roundNumber(fact.baseRM * mult, 2);
        output += singleOutput * sessions;
        rmConsumed += singleRM * sessions;
        revenue += (singleOutput * sessions) * prices[fact.quality] * (1 - vat / 100);
    }

    let plantWorkers = 0, plantWamSessions = 0, rmProduced = 0;
    for (const plant of plantationsData) {
        const cell = plantationCells[plant.quality] || { companies: 0, workers: 0 };
        const c = cell.companies || 0;
        const w = Math.min(cell.workers || 0, c * plant.maxEmployees);
        const sessions = (wamEnabled ? c : 0) + w;
        companies += c; plantWorkers += w; plantWamSessions += (wamEnabled ? c : 0);

        const mult = productivityMultiplier({ countryBonus, regionBonus, hasTycoon, pollutionRate: pollutionAt(qualityPollution, 0) });
        const singleOutput = gameRawProduction((plant.baseOutput / 100) * mult);
        rmProduced += singleOutput * sessions;
    }

    output = roundNumber(output, 2);
    rmConsumed = roundNumber(rmConsumed, 2);
    rmProduced = roundNumber(rmProduced, 2);

    const netBalance = rmProduced - rmConsumed;
    const rmNetCost = netBalance < 0
        ? (-netBalance) * rmPrice
        : -(netBalance * rmPrice * (1 - vat / 100));

    const workTax = (wamSessions + plantWamSessions) * (workTaxRate / 100) * averageSalary;
    const salary = (factoryWorkers + plantWorkers) * offeredSalary;
    const net = revenue - rmNetCost - workTax - salary;

    return { companies, output, rmConsumed, rmProduced, netBalance, revenue, rmNetCost, workTax, salary, net };
}
