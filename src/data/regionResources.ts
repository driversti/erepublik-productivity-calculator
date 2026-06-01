// AUTO-GENERATED region production-bonus data — DO NOT hand-edit row data.
//
// Source: a one-time eRepublik region/resource map dump (resources.json),
// trimmed to the fields this app needs. Snapshot captured 2026-05-31.
// Each region lists the natural resources it contains; a region's production
// bonus for an industry is the SUM of the bonuses of that industry's resources.
//
// To refresh: obtain a new map dump and regenerate this file. `currentCountry`
// reflects ownership at snapshot time and may be stale (regions change hands in war);
// `originalCountry` is stable.

export const SNAPSHOT_DATE = "2026-05-31";

export type Industry = "food" | "weapons" | "houses" | "aircraft";

export interface RegionResource {
  name: string;
  industry: Industry;
  bonus: number;
}

export interface RegionEntry {
  /** eRepublik region id */
  id: number;
  name: string;
  /** URL slug for /en/main/region/{permalink} — stable, never stale. */
  permalink: string;
  /** Historical owner — stable, never stale. */
  originalCountry: string;
  /** Owner at snapshot time — may be stale (war). */
  currentCountry: string;
  resources: RegionResource[];
}

/** Country display name -> eRepublik flag image URL (protocol-relative). */
export const COUNTRY_FLAGS: Record<string, string> = {
  "Argentina": "//www.erepublik.net/images/flags_png/M/Argentina.png",
  "Armenia": "//www.erepublik.net/images/flags_png/M/Armenia.png",
  "Australia": "//www.erepublik.net/images/flags_png/M/Australia.png",
  "Austria": "//www.erepublik.net/images/flags_png/M/Austria.png",
  "Belarus": "//www.erepublik.net/images/flags_png/M/Belarus.png",
  "Belgium": "//www.erepublik.net/images/flags_png/M/Belgium.png",
  "Bosnia and Herzegovina": "//www.erepublik.net/images/flags_png/M/Bosnia-Herzegovina.png",
  "Brazil": "//www.erepublik.net/images/flags_png/M/Brazil.png",
  "Bulgaria": "//www.erepublik.net/images/flags_png/M/Bulgaria.png",
  "Canada": "//www.erepublik.net/images/flags_png/M/Canada.png",
  "Chile": "//www.erepublik.net/images/flags_png/M/Chile.png",
  "China": "//www.erepublik.net/images/flags_png/M/China.png",
  "Colombia": "//www.erepublik.net/images/flags_png/M/Colombia.png",
  "Croatia": "//www.erepublik.net/images/flags_png/M/Croatia.png",
  "Cuba": "//www.erepublik.net/images/flags_png/M/Cuba.png",
  "Cyprus": "//www.erepublik.net/images/flags_png/M/Cyprus.png",
  "Czech Republic": "//www.erepublik.net/images/flags_png/M/Czech-Republic.png",
  "Denmark": "//www.erepublik.net/images/flags_png/M/Denmark.png",
  "Egypt": "//www.erepublik.net/images/flags_png/M/Egypt.png",
  "Estonia": "//www.erepublik.net/images/flags_png/M/Estonia.png",
  "Finland": "//www.erepublik.net/images/flags_png/M/Finland.png",
  "France": "//www.erepublik.net/images/flags_png/M/France.png",
  "Georgia": "//www.erepublik.net/images/flags_png/M/Georgia.png",
  "Germany": "//www.erepublik.net/images/flags_png/M/Germany.png",
  "Greece": "//www.erepublik.net/images/flags_png/M/Greece.png",
  "Hungary": "//www.erepublik.net/images/flags_png/M/Hungary.png",
  "India": "//www.erepublik.net/images/flags_png/M/India.png",
  "Indonesia": "//www.erepublik.net/images/flags_png/M/Indonesia.png",
  "Iran": "//www.erepublik.net/images/flags_png/M/Iran.png",
  "Ireland": "//www.erepublik.net/images/flags_png/M/Ireland.png",
  "Israel": "//www.erepublik.net/images/flags_png/M/Israel.png",
  "Italy": "//www.erepublik.net/images/flags_png/M/Italy.png",
  "Japan": "//www.erepublik.net/images/flags_png/M/Japan.png",
  "Latvia": "//www.erepublik.net/images/flags_png/M/Latvia.png",
  "Lithuania": "//www.erepublik.net/images/flags_png/M/Lithuania.png",
  "Malaysia": "//www.erepublik.net/images/flags_png/M/Malaysia.png",
  "Mexico": "//www.erepublik.net/images/flags_png/M/Mexico.png",
  "Montenegro": "//www.erepublik.net/images/flags_png/M/Montenegro.png",
  "Netherlands": "//www.erepublik.net/images/flags_png/M/Netherlands.png",
  "New Zealand": "//www.erepublik.net/images/flags_png/M/New-Zealand.png",
  "Nigeria": "//www.erepublik.net/images/flags_png/M/Nigeria.png",
  "North Korea": "//www.erepublik.net/images/flags_png/M/North-Korea.png",
  "North Macedonia": "//www.erepublik.net/images/flags_png/M/North-Macedonia.png",
  "Norway": "//www.erepublik.net/images/flags_png/M/Norway.png",
  "Pakistan": "//www.erepublik.net/images/flags_png/M/Pakistan.png",
  "Paraguay": "//www.erepublik.net/images/flags_png/M/Paraguay.png",
  "Peru": "//www.erepublik.net/images/flags_png/M/Peru.png",
  "Philippines": "//www.erepublik.net/images/flags_png/M/Philippines.png",
  "Poland": "//www.erepublik.net/images/flags_png/M/Poland.png",
  "Portugal": "//www.erepublik.net/images/flags_png/M/Portugal.png",
  "Republic of China (Taiwan)": "//www.erepublik.net/images/flags_png/M/Republic-of-China-Taiwan.png",
  "Republic of Moldova": "//www.erepublik.net/images/flags_png/M/Republic-of-Moldova.png",
  "Romania": "//www.erepublik.net/images/flags_png/M/Romania.png",
  "Russia": "//www.erepublik.net/images/flags_png/M/Russia.png",
  "Saudi Arabia": "//www.erepublik.net/images/flags_png/M/Saudi-Arabia.png",
  "Serbia": "//www.erepublik.net/images/flags_png/M/Serbia.png",
  "Singapore": "//www.erepublik.net/images/flags_png/M/Singapore.png",
  "Slovakia": "//www.erepublik.net/images/flags_png/M/Slovakia.png",
  "Slovenia": "//www.erepublik.net/images/flags_png/M/Slovenia.png",
  "South Africa": "//www.erepublik.net/images/flags_png/M/South-Africa.png",
  "South Korea": "//www.erepublik.net/images/flags_png/M/South-Korea.png",
  "Spain": "//www.erepublik.net/images/flags_png/M/Spain.png",
  "Sweden": "//www.erepublik.net/images/flags_png/M/Sweden.png",
  "Switzerland": "//www.erepublik.net/images/flags_png/M/Switzerland.png",
  "Thailand": "//www.erepublik.net/images/flags_png/M/Thailand.png",
  "Turkey": "//www.erepublik.net/images/flags_png/M/Turkey.png",
  "USA": "//www.erepublik.net/images/flags_png/M/USA.png",
  "Ukraine": "//www.erepublik.net/images/flags_png/M/Ukraine.png",
  "United Arab Emirates": "//www.erepublik.net/images/flags_png/M/United-Arab-Emirates.png",
  "United Kingdom": "//www.erepublik.net/images/flags_png/M/United-Kingdom.png",
  "Uruguay": "//www.erepublik.net/images/flags_png/M/Uruguay.png",
  "Venezuela": "//www.erepublik.net/images/flags_png/M/Venezuela.png"
};

export const REGION_RESOURCES: RegionEntry[] = [
  {
    "id": 3,
    "permalink": "Dobrogea",
    "name": "Dobrogea",
    "originalCountry": "Romania",
    "currentCountry": "Romania",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 35,
    "permalink": "Transilvania",
    "name": "Transilvania",
    "originalCountry": "Romania",
    "currentCountry": "Romania",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 37,
    "permalink": "Moldova",
    "name": "Moldova",
    "originalCountry": "Romania",
    "currentCountry": "Romania",
    "resources": [
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 56,
    "permalink": "Kentucky",
    "name": "Kentucky",
    "originalCountry": "USA",
    "currentCountry": "USA",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 85,
    "permalink": "Virginia",
    "name": "Virginia",
    "originalCountry": "USA",
    "currentCountry": "USA",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 87,
    "permalink": "West-Virginia",
    "name": "West Virginia",
    "originalCountry": "USA",
    "currentCountry": "USA",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 90,
    "permalink": "District-of-Columbia",
    "name": "District of Columbia",
    "originalCountry": "USA",
    "currentCountry": "USA",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 91,
    "permalink": "Northern-Basarabia",
    "name": "Northern Basarabia",
    "originalCountry": "Republic of Moldova",
    "currentCountry": "Republic of Moldova",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 92,
    "permalink": "Chisinau",
    "name": "Chisinau",
    "originalCountry": "Republic of Moldova",
    "currentCountry": "Croatia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 93,
    "permalink": "Southern-Basarabia",
    "name": "Southern Basarabia",
    "originalCountry": "Republic of Moldova",
    "currentCountry": "Latvia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 94,
    "permalink": "Transnistria",
    "name": "Transnistria",
    "originalCountry": "Republic of Moldova",
    "currentCountry": "Republic of Moldova",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 104,
    "permalink": "Yukon",
    "name": "Yukon",
    "originalCountry": "Canada",
    "currentCountry": "Canada",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 106,
    "permalink": "Northwest-Territories",
    "name": "Northwest Territories",
    "originalCountry": "Canada",
    "currentCountry": "Canada",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 107,
    "permalink": "Nunavut",
    "name": "Nunavut",
    "originalCountry": "Canada",
    "currentCountry": "Canada",
    "resources": [
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      },
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 108,
    "permalink": "Western-Transdanubia",
    "name": "Western Transdanubia",
    "originalCountry": "Hungary",
    "currentCountry": "Hungary",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 109,
    "permalink": "Southern-Transdanubia",
    "name": "Southern Transdanubia",
    "originalCountry": "Hungary",
    "currentCountry": "Germany",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 110,
    "permalink": "Central-Transdanubia",
    "name": "Central Transdanubia",
    "originalCountry": "Hungary",
    "currentCountry": "Hungary",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 115,
    "permalink": "Valley-of-Mexico",
    "name": "Valley of Mexico",
    "originalCountry": "Mexico",
    "currentCountry": "Mexico",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 117,
    "permalink": "Northwest-of-Mexico",
    "name": "Northwest of Mexico",
    "originalCountry": "Mexico",
    "currentCountry": "Mexico",
    "resources": [
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 118,
    "permalink": "Pacific-Coast-of-Mexico",
    "name": "Pacific Coast of Mexico",
    "originalCountry": "Mexico",
    "currentCountry": "Mexico",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 124,
    "permalink": "Venezuelan-Capital",
    "name": "Venezuelan Capital",
    "originalCountry": "Venezuela",
    "currentCountry": "Venezuela",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 125,
    "permalink": "Central-Venezuela",
    "name": "Central Venezuela",
    "originalCountry": "Venezuela",
    "currentCountry": "Venezuela",
    "resources": [
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      },
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      }
    ]
  },
  {
    "id": 130,
    "permalink": "North-Eastern-Venezuela",
    "name": "North Eastern Venezuela",
    "originalCountry": "Venezuela",
    "currentCountry": "Venezuela",
    "resources": [
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 139,
    "permalink": "Siveria",
    "name": "Siveria",
    "originalCountry": "Ukraine",
    "currentCountry": "Ukraine",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 142,
    "permalink": "Sloboda",
    "name": "Sloboda",
    "originalCountry": "Ukraine",
    "currentCountry": "Ukraine",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 143,
    "permalink": "Donbas",
    "name": "Donbas",
    "originalCountry": "Ukraine",
    "currentCountry": "Ukraine",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 148,
    "permalink": "Northeast-of-Brazil",
    "name": "Northeast of Brazil",
    "originalCountry": "Brazil",
    "currentCountry": "Brazil",
    "resources": [
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      }
    ]
  },
  {
    "id": 149,
    "permalink": "Southeast-of-Brazil",
    "name": "Southeast of Brazil",
    "originalCountry": "Brazil",
    "currentCountry": "Brazil",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 150,
    "permalink": "Parana-and-Santa-Catarina",
    "name": "Parana and Santa Catarina",
    "originalCountry": "Brazil",
    "currentCountry": "Brazil",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 151,
    "permalink": "Pampas",
    "name": "Pampas",
    "originalCountry": "Argentina",
    "currentCountry": "Argentina",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 154,
    "permalink": "Mesopotamia",
    "name": "Mesopotamia",
    "originalCountry": "Argentina",
    "currentCountry": "Argentina",
    "resources": [
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 156,
    "permalink": "Patagonia",
    "name": "Patagonia",
    "originalCountry": "Argentina",
    "currentCountry": "Argentina",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 157,
    "permalink": "Lisboa",
    "name": "Lisboa",
    "originalCountry": "Portugal",
    "currentCountry": "Portugal",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 160,
    "permalink": "Alentejo",
    "name": "Alentejo",
    "originalCountry": "Portugal",
    "currentCountry": "Portugal",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 162,
    "permalink": "Azores",
    "name": "Azores",
    "originalCountry": "Portugal",
    "currentCountry": "Portugal",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      }
    ]
  },
  {
    "id": 163,
    "permalink": "Madeira",
    "name": "Madeira",
    "originalCountry": "Portugal",
    "currentCountry": "Portugal",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      }
    ]
  },
  {
    "id": 167,
    "permalink": "Andalucia",
    "name": "Andalucia",
    "originalCountry": "Spain",
    "currentCountry": "Spain",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 181,
    "permalink": "Castilla-La-Mancha",
    "name": "Castilla La Mancha",
    "originalCountry": "Spain",
    "currentCountry": "Spain",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 183,
    "permalink": "Canary-Islands",
    "name": "Canary Islands",
    "originalCountry": "Spain",
    "currentCountry": "Spain",
    "resources": [
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 186,
    "permalink": "Aquitaine",
    "name": "Aquitaine",
    "originalCountry": "France",
    "currentCountry": "France",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 188,
    "permalink": "Brittany",
    "name": "Brittany",
    "originalCountry": "France",
    "currentCountry": "France",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 198,
    "permalink": "Midi-Pyrenees",
    "name": "Midi-Pyrenees",
    "originalCountry": "France",
    "currentCountry": "France",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 199,
    "permalink": "Paris-Isle-of-France",
    "name": "Paris Isle of France",
    "originalCountry": "France",
    "currentCountry": "France",
    "resources": [
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 200,
    "permalink": "Pays-de-la-Loire",
    "name": "Pays de la Loire",
    "originalCountry": "France",
    "currentCountry": "Nigeria",
    "resources": [
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 209,
    "permalink": "Cork",
    "name": "Cork",
    "originalCountry": "Ireland",
    "currentCountry": "Ireland",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 210,
    "permalink": "Shannon",
    "name": "Shannon",
    "originalCountry": "Ireland",
    "currentCountry": "Ireland",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 212,
    "permalink": "Mayo",
    "name": "Mayo",
    "originalCountry": "Ireland",
    "currentCountry": "Spain",
    "resources": [
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 217,
    "permalink": "Scotland",
    "name": "Scotland",
    "originalCountry": "United Kingdom",
    "currentCountry": "United Kingdom",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 225,
    "permalink": "Yorkshire-Humberside",
    "name": "Yorkshire & Humberside",
    "originalCountry": "United Kingdom",
    "currentCountry": "United Kingdom",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 226,
    "permalink": "North-East-of-England",
    "name": "North East of England",
    "originalCountry": "United Kingdom",
    "currentCountry": "United Kingdom",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 228,
    "permalink": "Brussels",
    "name": "Brussels",
    "originalCountry": "Belgium",
    "currentCountry": "Belgium",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 229,
    "permalink": "Flanders",
    "name": "Flanders",
    "originalCountry": "Belgium",
    "currentCountry": "Republic of China (Taiwan)",
    "resources": [
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      }
    ]
  },
  {
    "id": 230,
    "permalink": "Wallonia",
    "name": "Wallonia",
    "originalCountry": "Belgium",
    "currentCountry": "Belgium",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 232,
    "permalink": "Midtjylland",
    "name": "Midtjylland",
    "originalCountry": "Denmark",
    "currentCountry": "Bulgaria",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 235,
    "permalink": "Sjaelland",
    "name": "Sjaelland",
    "originalCountry": "Denmark",
    "currentCountry": "Bulgaria",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 238,
    "permalink": "Western-Finland",
    "name": "Western Finland",
    "originalCountry": "Finland",
    "currentCountry": "Finland",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 240,
    "permalink": "Oulu",
    "name": "Oulu",
    "originalCountry": "Finland",
    "currentCountry": "Finland",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 241,
    "permalink": "Lapland",
    "name": "Lapland",
    "originalCountry": "Finland",
    "currentCountry": "Finland",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 243,
    "permalink": "Baden-Wurttemberg",
    "name": "Baden-Wurttemberg",
    "originalCountry": "Germany",
    "currentCountry": "Germany",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 246,
    "permalink": "Brandenburg-and-Berlin",
    "name": "Brandenburg and Berlin",
    "originalCountry": "Germany",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 250,
    "permalink": "Mecklenburg",
    "name": "Mecklenburg-Western Pomerania",
    "originalCountry": "Germany",
    "currentCountry": "Germany",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 257,
    "permalink": "Schleswig-Holstein-and-Hamburg",
    "name": "Schleswig-Holstein and Hamburg",
    "originalCountry": "Germany",
    "currentCountry": "Germany",
    "resources": [
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 267,
    "permalink": "Lazio",
    "name": "Lazio",
    "originalCountry": "Italy",
    "currentCountry": "Netherlands",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 273,
    "permalink": "Sardinia",
    "name": "Sardinia",
    "originalCountry": "Italy",
    "currentCountry": "Italy",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 274,
    "permalink": "Sicily",
    "name": "Sicily",
    "originalCountry": "Italy",
    "currentCountry": "Italy",
    "resources": [
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 291,
    "permalink": "Nord-Norge",
    "name": "Nord-Norge",
    "originalCountry": "Norway",
    "currentCountry": "Norway",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 306,
    "permalink": "Pomerania",
    "name": "Pomerania",
    "originalCountry": "Poland",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 307,
    "permalink": "Silesia",
    "name": "Silesia",
    "originalCountry": "Poland",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 312,
    "permalink": "Bratislava",
    "name": "Bratislava",
    "originalCountry": "Slovakia",
    "currentCountry": "Ukraine",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 315,
    "permalink": "Western-Slovakia",
    "name": "Western Slovakia",
    "originalCountry": "Slovakia",
    "currentCountry": "Slovakia",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 316,
    "permalink": "Central-Slovakia",
    "name": "Central Slovakia",
    "originalCountry": "Slovakia",
    "currentCountry": "United Arab Emirates",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 320,
    "permalink": "Svealand",
    "name": "Svealand",
    "originalCountry": "Sweden",
    "currentCountry": "Sweden",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 321,
    "permalink": "Norrland-Sameland",
    "name": "Norrland and Sameland",
    "originalCountry": "Sweden",
    "currentCountry": "Sweden",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 325,
    "permalink": "Gotaland",
    "name": "Gotaland",
    "originalCountry": "Sweden",
    "currentCountry": "Sweden",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 330,
    "permalink": "South-Australia",
    "name": "South Australia",
    "originalCountry": "Australia",
    "currentCountry": "Australia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      }
    ]
  },
  {
    "id": 331,
    "permalink": "Tasmania",
    "name": "Tasmania",
    "originalCountry": "Australia",
    "currentCountry": "Australia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 332,
    "permalink": "Victoria",
    "name": "Victoria",
    "originalCountry": "Australia",
    "currentCountry": "Lithuania",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 333,
    "permalink": "Western-Australia",
    "name": "Western Australia",
    "originalCountry": "Australia",
    "currentCountry": "Latvia",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 336,
    "permalink": "Deutschschweiz",
    "name": "Deutschschweiz",
    "originalCountry": "Switzerland",
    "currentCountry": "Brazil",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 337,
    "permalink": "Romandie",
    "name": "Romandie",
    "originalCountry": "Switzerland",
    "currentCountry": "Switzerland",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 339,
    "permalink": "Graubunden",
    "name": "Graubunden",
    "originalCountry": "Switzerland",
    "currentCountry": "Switzerland",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 343,
    "permalink": "Upper-Austria",
    "name": "Upper Austria",
    "originalCountry": "Austria",
    "currentCountry": "Austria",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 345,
    "permalink": "Styria",
    "name": "Styria",
    "originalCountry": "Austria",
    "currentCountry": "Austria",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 346,
    "permalink": "Tyrol",
    "name": "Tyrol",
    "originalCountry": "Austria",
    "currentCountry": "Austria",
    "resources": [
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 347,
    "permalink": "Vorarlberg",
    "name": "Vorarlberg",
    "originalCountry": "Austria",
    "currentCountry": "Republic of China (Taiwan)",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 352,
    "permalink": "Vidin",
    "name": "Vidin",
    "originalCountry": "Bulgaria",
    "currentCountry": "Netherlands",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 356,
    "permalink": "Varna",
    "name": "Varna",
    "originalCountry": "Bulgaria",
    "currentCountry": "Bulgaria",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 358,
    "permalink": "Ruse",
    "name": "Ruse",
    "originalCountry": "Bulgaria",
    "currentCountry": "Israel",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 380,
    "permalink": "Sichuan",
    "name": "Sichuan",
    "originalCountry": "China",
    "currentCountry": "China",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 382,
    "permalink": "Zhejiang",
    "name": "Zhejiang",
    "originalCountry": "China",
    "currentCountry": "China",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 394,
    "permalink": "Tibet",
    "name": "Tibet",
    "originalCountry": "China",
    "currentCountry": "Croatia",
    "resources": [
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 395,
    "permalink": "Beijing",
    "name": "Beijing",
    "originalCountry": "China",
    "currentCountry": "China",
    "resources": [
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 419,
    "permalink": "Peloponnese",
    "name": "Peloponnese",
    "originalCountry": "Greece",
    "currentCountry": "Greece",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 422,
    "permalink": "Crete",
    "name": "Crete",
    "originalCountry": "Greece",
    "currentCountry": "Argentina",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 424,
    "permalink": "Mazovia",
    "name": "Mazovia",
    "originalCountry": "Poland",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      }
    ]
  },
  {
    "id": 437,
    "permalink": "Southern-Bohemia",
    "name": "Southern Bohemia",
    "originalCountry": "Czech Republic",
    "currentCountry": "Czech Republic",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 442,
    "permalink": "Northern-Bohemia",
    "name": "Northern Bohemia",
    "originalCountry": "Czech Republic",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 449,
    "permalink": "Maharashtra",
    "name": "Maharashtra",
    "originalCountry": "India",
    "currentCountry": "Bulgaria",
    "resources": [
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 451,
    "permalink": "Karnataka",
    "name": "Karnataka",
    "originalCountry": "India",
    "currentCountry": "India",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 452,
    "permalink": "Tamil-Nadu",
    "name": "Tamil Nadu",
    "originalCountry": "India",
    "currentCountry": "India",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 453,
    "permalink": "Kerala",
    "name": "Kerala",
    "originalCountry": "India",
    "currentCountry": "Canada",
    "resources": [
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 460,
    "permalink": "Sumatra",
    "name": "Sumatra",
    "originalCountry": "Indonesia",
    "currentCountry": "Indonesia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 463,
    "permalink": "Lesser-Sunda-Islands",
    "name": "Lesser Sunda Islands",
    "originalCountry": "Indonesia",
    "currentCountry": "Indonesia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 465,
    "permalink": "Maluku-islands",
    "name": "Maluku islands",
    "originalCountry": "Indonesia",
    "currentCountry": "Indonesia",
    "resources": [
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 467,
    "permalink": "Jerusalem-district",
    "name": "Jerusalem district",
    "originalCountry": "Israel",
    "currentCountry": "Israel",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 468,
    "permalink": "Nazareth-North-District",
    "name": "Nazareth North District",
    "originalCountry": "Israel",
    "currentCountry": "Estonia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 471,
    "permalink": "Beersheba-South-District",
    "name": "Beersheba South District",
    "originalCountry": "Israel",
    "currentCountry": "Israel",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 473,
    "permalink": "Sistan-Baluchistan",
    "name": "Sistan and Baluchistan",
    "originalCountry": "Iran",
    "currentCountry": "Iran",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 477,
    "permalink": "Semnan",
    "name": "Semnan",
    "originalCountry": "Iran",
    "currentCountry": "Iran",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 483,
    "permalink": "Mazandaran-and-Golistan",
    "name": "Mazandaran and Golistan",
    "originalCountry": "Iran",
    "currentCountry": "Lithuania",
    "resources": [
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 486,
    "permalink": "Kanto",
    "name": "Kanto",
    "originalCountry": "Japan",
    "currentCountry": "Japan",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 488,
    "permalink": "Kinki",
    "name": "Kinki",
    "originalCountry": "Japan",
    "currentCountry": "Japan",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 489,
    "permalink": "Chugoku",
    "name": "Chugoku",
    "originalCountry": "Japan",
    "currentCountry": "Finland",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 492,
    "permalink": "Balochistan",
    "name": "Balochistan",
    "originalCountry": "Pakistan",
    "currentCountry": "Pakistan",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 493,
    "permalink": "North-West-Frontier",
    "name": "North-West Frontier Province",
    "originalCountry": "Pakistan",
    "currentCountry": "Pakistan",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 494,
    "permalink": "Punjab",
    "name": "Punjab",
    "originalCountry": "Pakistan",
    "currentCountry": "Peru",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 495,
    "permalink": "Sindh",
    "name": "Sindh",
    "originalCountry": "Pakistan",
    "currentCountry": "Israel",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 498,
    "permalink": "Free-State",
    "name": "Free State",
    "originalCountry": "South Africa",
    "currentCountry": "South Africa",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 499,
    "permalink": "Gauteng",
    "name": "Gauteng",
    "originalCountry": "South Africa",
    "currentCountry": "South Africa",
    "resources": [
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 501,
    "permalink": "Limpopo",
    "name": "Limpopo",
    "originalCountry": "South Africa",
    "currentCountry": "South Africa",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 507,
    "permalink": "Central-Thailand",
    "name": "Central Thailand",
    "originalCountry": "Thailand",
    "currentCountry": "Saudi Arabia",
    "resources": [
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 508,
    "permalink": "Northern-Thailand",
    "name": "Northern Thailand",
    "originalCountry": "Thailand",
    "currentCountry": "United Arab Emirates",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 511,
    "permalink": "North-Eastern-Thailand",
    "name": "North-Eastern Thailand",
    "originalCountry": "Thailand",
    "currentCountry": "Thailand",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 512,
    "permalink": "Aegean-Coast-of-Turkey",
    "name": "Aegean Coast of Turkey",
    "originalCountry": "Turkey",
    "currentCountry": "Bosnia and Herzegovina",
    "resources": [
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 522,
    "permalink": "Chungcheongnam",
    "name": "Chungcheongnam-do",
    "originalCountry": "South Korea",
    "currentCountry": "Hungary",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 524,
    "permalink": "Jeollanam",
    "name": "Jeollanam-do",
    "originalCountry": "South Korea",
    "currentCountry": "South Korea",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 526,
    "permalink": "Gyeongsangnam",
    "name": "Gyeongsangnam-do",
    "originalCountry": "South Korea",
    "currentCountry": "South Korea",
    "resources": [
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 527,
    "permalink": "Jeju",
    "name": "Jeju",
    "originalCountry": "South Korea",
    "currentCountry": "South Korea",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 528,
    "permalink": "Western-Netherlands",
    "name": "Western Netherlands",
    "originalCountry": "Netherlands",
    "currentCountry": "Netherlands",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 529,
    "permalink": "Southern-Netherlands",
    "name": "Southern Netherlands",
    "originalCountry": "Netherlands",
    "currentCountry": "Netherlands",
    "resources": [
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 530,
    "permalink": "Eastern-Netherlands",
    "name": "Eastern Netherlands",
    "originalCountry": "Netherlands",
    "currentCountry": "Spain",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 534,
    "permalink": "Eastern-Siberia",
    "name": "Eastern Siberia",
    "originalCountry": "Russia",
    "currentCountry": "Turkey",
    "resources": [
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 541,
    "permalink": "Volga-Vyatka",
    "name": "Volga Vyatka",
    "originalCountry": "Russia",
    "currentCountry": "Russia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 542,
    "permalink": "Western-Siberia",
    "name": "Western Siberia",
    "originalCountry": "Russia",
    "currentCountry": "Russia",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 562,
    "permalink": "Svalbard-Jan-Mayen",
    "name": "Svalbard & Jan Mayen",
    "originalCountry": "Norway",
    "currentCountry": "Norway",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 571,
    "permalink": "Slovenian-Littoral",
    "name": "Slovenian Littoral",
    "originalCountry": "Slovenia",
    "currentCountry": "Slovenia",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 591,
    "permalink": "Upper-Carniola",
    "name": "Upper Carniola",
    "originalCountry": "Slovenia",
    "currentCountry": "Bosnia and Herzegovina",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 601,
    "permalink": "Styria-Carinthia",
    "name": "Styria and Carinthia",
    "originalCountry": "Slovenia",
    "currentCountry": "North Korea",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 611,
    "permalink": "Lower-Carniola",
    "name": "Lower Carniola",
    "originalCountry": "Slovenia",
    "currentCountry": "Uruguay",
    "resources": [
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 621,
    "permalink": "Prekmurje",
    "name": "Prekmurje",
    "originalCountry": "Slovenia",
    "currentCountry": "Slovenia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      }
    ]
  },
  {
    "id": 625,
    "permalink": "Lika-Gorski-Kotar",
    "name": "Lika and Gorski Kotar",
    "originalCountry": "Croatia",
    "currentCountry": "Croatia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 627,
    "permalink": "North-Dalmatia",
    "name": "North Dalmatia",
    "originalCountry": "Croatia",
    "currentCountry": "Croatia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 628,
    "permalink": "South-Dalmatia",
    "name": "South Dalmatia",
    "originalCountry": "Croatia",
    "currentCountry": "Croatia",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 631,
    "permalink": "Zona-Central",
    "name": "Zona Central",
    "originalCountry": "Chile",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 633,
    "permalink": "Zona-Austral",
    "name": "Zona Austral",
    "originalCountry": "Chile",
    "currentCountry": "Serbia",
    "resources": [
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 635,
    "permalink": "Belgrade",
    "name": "Belgrade",
    "originalCountry": "Serbia",
    "currentCountry": "Serbia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 636,
    "permalink": "Sumadija",
    "name": "Sumadija",
    "originalCountry": "Serbia",
    "currentCountry": "Serbia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 639,
    "permalink": "Raska",
    "name": "Raska",
    "originalCountry": "Serbia",
    "currentCountry": "Serbia",
    "resources": [
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 640,
    "permalink": "Southern-Serbia",
    "name": "Southern Serbia",
    "originalCountry": "Serbia",
    "currentCountry": "Serbia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      }
    ]
  },
  {
    "id": 641,
    "permalink": "Sabah",
    "name": "Sabah",
    "originalCountry": "Malaysia",
    "currentCountry": "Republic of China (Taiwan)",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 642,
    "permalink": "Sarawak",
    "name": "Sarawak",
    "originalCountry": "Malaysia",
    "currentCountry": "Malaysia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 643,
    "permalink": "Peninsular-Malaysia",
    "name": "Peninsular Malaysia",
    "originalCountry": "Malaysia",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 644,
    "permalink": "Luzon",
    "name": "Luzon",
    "originalCountry": "Philippines",
    "currentCountry": "Thailand",
    "resources": [
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      }
    ]
  },
  {
    "id": 645,
    "permalink": "Visayas",
    "name": "Visayas",
    "originalCountry": "Philippines",
    "currentCountry": "Philippines",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 646,
    "permalink": "Mindanao",
    "name": "Mindanao",
    "originalCountry": "Philippines",
    "currentCountry": "Philippines",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      }
    ]
  },
  {
    "id": 647,
    "permalink": "Palawan",
    "name": "Palawan",
    "originalCountry": "Philippines",
    "currentCountry": "Philippines",
    "resources": [
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      },
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      }
    ]
  },
  {
    "id": 648,
    "permalink": "Singapore-City",
    "name": "Singapore City",
    "originalCountry": "Singapore",
    "currentCountry": "Singapore",
    "resources": [
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      }
    ]
  },
  {
    "id": 649,
    "permalink": "West-Srpska-Republic",
    "name": "West Srpska Republic",
    "originalCountry": "Bosnia and Herzegovina",
    "currentCountry": "Bosnia and Herzegovina",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 650,
    "permalink": "East-Srpska-Republic",
    "name": "East Srpska Republic",
    "originalCountry": "Bosnia and Herzegovina",
    "currentCountry": "Bosnia and Herzegovina",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      }
    ]
  },
  {
    "id": 652,
    "permalink": "Federation-of-BiH",
    "name": "Federation of BiH",
    "originalCountry": "Bosnia and Herzegovina",
    "currentCountry": "Bulgaria",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 654,
    "permalink": "Pohja-Eesti",
    "name": "Pohja-Eesti",
    "originalCountry": "Estonia",
    "currentCountry": "Estonia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 655,
    "permalink": "Kirde-Eesti",
    "name": "Kirde-Eesti",
    "originalCountry": "Estonia",
    "currentCountry": "Estonia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 658,
    "permalink": "Louna-Eesti",
    "name": "Louna-Eesti",
    "originalCountry": "Estonia",
    "currentCountry": "Estonia",
    "resources": [
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 659,
    "permalink": "Vidzeme",
    "name": "Vidzeme",
    "originalCountry": "Latvia",
    "currentCountry": "Latvia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 660,
    "permalink": "Latgale",
    "name": "Latgale",
    "originalCountry": "Latvia",
    "currentCountry": "France",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 662,
    "permalink": "Kurzeme",
    "name": "Kurzeme",
    "originalCountry": "Latvia",
    "currentCountry": "Latvia",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 663,
    "permalink": "Lithuania-Minor",
    "name": "Lithuania Minor",
    "originalCountry": "Lithuania",
    "currentCountry": "Lithuania",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      }
    ]
  },
  {
    "id": 664,
    "permalink": "Samogitia",
    "name": "Samogitia",
    "originalCountry": "Lithuania",
    "currentCountry": "Lithuania",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 665,
    "permalink": "Lithuanian-Highland",
    "name": "Lithuanian Highland",
    "originalCountry": "Lithuania",
    "currentCountry": "Lithuania",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 670,
    "permalink": "Hwangae",
    "name": "Hwangae",
    "originalCountry": "North Korea",
    "currentCountry": "North Korea",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 671,
    "permalink": "Kangwon",
    "name": "Kangwon",
    "originalCountry": "North Korea",
    "currentCountry": "North Korea",
    "resources": [
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 672,
    "permalink": "Hamgyong",
    "name": "Hamgyong",
    "originalCountry": "North Korea",
    "currentCountry": "Saudi Arabia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 674,
    "permalink": "Charrua",
    "name": "Charrua",
    "originalCountry": "Uruguay",
    "currentCountry": "Uruguay",
    "resources": [
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 675,
    "permalink": "Paranena",
    "name": "Paranena",
    "originalCountry": "Paraguay",
    "currentCountry": "Republic of Moldova",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 676,
    "permalink": "Central-East-Chaco",
    "name": "Central East Chaco",
    "originalCountry": "Paraguay",
    "currentCountry": "Paraguay",
    "resources": [
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 685,
    "permalink": "Chimor",
    "name": "Chimor",
    "originalCountry": "Peru",
    "currentCountry": "Peru",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 686,
    "permalink": "Northern-Low-Amazon",
    "name": "Northern Low Amazon",
    "originalCountry": "Peru",
    "currentCountry": "Peru",
    "resources": [
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 688,
    "permalink": "Lima",
    "name": "Lima",
    "originalCountry": "Peru",
    "currentCountry": "Peru",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 689,
    "permalink": "Amazonica",
    "name": "Amazonica",
    "originalCountry": "Colombia",
    "currentCountry": "Colombia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 690,
    "permalink": "Andina",
    "name": "Andina",
    "originalCountry": "Colombia",
    "currentCountry": "Colombia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 691,
    "permalink": "Caribe-e-Insular",
    "name": "Caribe e Insular",
    "originalCountry": "Colombia",
    "currentCountry": "Latvia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 692,
    "permalink": "Orinoquia",
    "name": "Orinoquia",
    "originalCountry": "Colombia",
    "currentCountry": "Greece",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      }
    ]
  },
  {
    "id": 694,
    "permalink": "Cundiboyacense",
    "name": "Cundiboyacense",
    "originalCountry": "Colombia",
    "currentCountry": "Colombia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 695,
    "permalink": "Povardarie",
    "name": "Povardarie",
    "originalCountry": "North Macedonia",
    "currentCountry": "North Macedonia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 696,
    "permalink": "Western-Macedonia",
    "name": "Western Macedonia",
    "originalCountry": "North Macedonia",
    "currentCountry": "Cuba",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 697,
    "permalink": "Eastern-Macedonia",
    "name": "Eastern Macedonia",
    "originalCountry": "North Macedonia",
    "currentCountry": "North Macedonia",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 698,
    "permalink": "North-Montenegrin-Mountains",
    "name": "North Montenegrin Mountains",
    "originalCountry": "Montenegro",
    "currentCountry": "Montenegro",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 699,
    "permalink": "Central-Montenegro",
    "name": "Central Montenegro",
    "originalCountry": "Montenegro",
    "currentCountry": "Thailand",
    "resources": [
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 700,
    "permalink": "Montenegrin-Coast",
    "name": "Montenegrin Coast",
    "originalCountry": "Montenegro",
    "currentCountry": "Montenegro",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 701,
    "permalink": "Northern-Taiwan",
    "name": "Northern Taiwan",
    "originalCountry": "Republic of China (Taiwan)",
    "currentCountry": "Republic of China (Taiwan)",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 702,
    "permalink": "Central-Taiwan",
    "name": "Central Taiwan",
    "originalCountry": "Republic of China (Taiwan)",
    "currentCountry": "Republic of China (Taiwan)",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 704,
    "permalink": "Southern-Taiwan",
    "name": "Southern Taiwan",
    "originalCountry": "Republic of China (Taiwan)",
    "currentCountry": "Republic of China (Taiwan)",
    "resources": [
      {
        "name": "Aluminum",
        "industry": "weapons",
        "bonus": 15
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 705,
    "permalink": "Southern-Cyprus",
    "name": "Southern Cyprus",
    "originalCountry": "Cyprus",
    "currentCountry": "Cyprus",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 706,
    "permalink": "Northern-Cyprus",
    "name": "Northern Cyprus",
    "originalCountry": "Cyprus",
    "currentCountry": "North Korea",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 708,
    "permalink": "Homelskaya",
    "name": "Homelskaya",
    "originalCountry": "Belarus",
    "currentCountry": "Belarus",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 709,
    "permalink": "Hrodzienskaya",
    "name": "Hrodzienskaya",
    "originalCountry": "Belarus",
    "currentCountry": "Japan",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 711,
    "permalink": "Mahilyowskaya",
    "name": "Mahilyowskaya",
    "originalCountry": "Belarus",
    "currentCountry": "Belarus",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 712,
    "permalink": "Vitsebskaya",
    "name": "Vitsebskaya",
    "originalCountry": "Belarus",
    "currentCountry": "Belarus",
    "resources": [
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 715,
    "permalink": "Canterbury",
    "name": "Canterbury",
    "originalCountry": "New Zealand",
    "currentCountry": "New Zealand",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 716,
    "permalink": "Otago",
    "name": "Otago",
    "originalCountry": "New Zealand",
    "currentCountry": "New Zealand",
    "resources": [
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      },
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 720,
    "permalink": "Al-Jawf",
    "name": "Al Jawf",
    "originalCountry": "Saudi Arabia",
    "currentCountry": "Saudi Arabia",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 729,
    "permalink": "Jizan",
    "name": "Jizan",
    "originalCountry": "Saudi Arabia",
    "currentCountry": "Cyprus",
    "resources": [
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 731,
    "permalink": "Lower-Egypt",
    "name": "Lower Egypt",
    "originalCountry": "Egypt",
    "currentCountry": "Japan",
    "resources": [
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 732,
    "permalink": "Western-Desert",
    "name": "Western Desert",
    "originalCountry": "Egypt",
    "currentCountry": "Poland",
    "resources": [
      {
        "name": "Neodymium",
        "industry": "aircraft",
        "bonus": 30
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      }
    ]
  },
  {
    "id": 733,
    "permalink": "Middle-Egypt",
    "name": "Middle Egypt",
    "originalCountry": "Egypt",
    "currentCountry": "Egypt",
    "resources": [
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 734,
    "permalink": "Upper-Egypt",
    "name": "Upper Egypt",
    "originalCountry": "Egypt",
    "currentCountry": "Egypt",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      }
    ]
  },
  {
    "id": 735,
    "permalink": "Red-Sea-Coast",
    "name": "Red Sea Coast",
    "originalCountry": "Egypt",
    "currentCountry": "Egypt",
    "resources": [
      {
        "name": "Rubber",
        "industry": "weapons",
        "bonus": 30
      }
    ]
  },
  {
    "id": 736,
    "permalink": "Abu-Dhabi",
    "name": "Abu Dhabi",
    "originalCountry": "United Arab Emirates",
    "currentCountry": "United Arab Emirates",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 737,
    "permalink": "Dubai",
    "name": "Dubai",
    "originalCountry": "United Arab Emirates",
    "currentCountry": "United Arab Emirates",
    "resources": [
      {
        "name": "Granite",
        "industry": "houses",
        "bonus": 30
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 739,
    "permalink": "Ajman",
    "name": "Ajman",
    "originalCountry": "United Arab Emirates",
    "currentCountry": "Estonia",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Cobalt",
        "industry": "aircraft",
        "bonus": 25
      }
    ]
  },
  {
    "id": 747,
    "permalink": "Abkhazia",
    "name": "Abkhazia",
    "originalCountry": "Georgia",
    "currentCountry": "Cyprus",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 748,
    "permalink": "West-Georgia",
    "name": "West Georgia",
    "originalCountry": "Georgia",
    "currentCountry": "Georgia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      }
    ]
  },
  {
    "id": 753,
    "permalink": "Central-Armenia",
    "name": "Central Armenia",
    "originalCountry": "Armenia",
    "currentCountry": "Armenia",
    "resources": [
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Magnesium",
        "industry": "aircraft",
        "bonus": 10
      }
    ]
  },
  {
    "id": 754,
    "permalink": "Syunik",
    "name": "Syunik",
    "originalCountry": "Armenia",
    "currentCountry": "Armenia",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Titanium",
        "industry": "aircraft",
        "bonus": 15
      },
      {
        "name": "Wolfram",
        "industry": "aircraft",
        "bonus": 20
      }
    ]
  },
  {
    "id": 755,
    "permalink": "Gegharkunik",
    "name": "Gegharkunik",
    "originalCountry": "Armenia",
    "currentCountry": "Czech Republic",
    "resources": [
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 758,
    "permalink": "North-Central-States",
    "name": "North Central States",
    "originalCountry": "Nigeria",
    "currentCountry": "New Zealand",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      }
    ]
  },
  {
    "id": 759,
    "permalink": "South-West-States",
    "name": "South West States",
    "originalCountry": "Nigeria",
    "currentCountry": "Nigeria",
    "resources": [
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      }
    ]
  },
  {
    "id": 760,
    "permalink": "South-South-States",
    "name": "South South States",
    "originalCountry": "Nigeria",
    "currentCountry": "Nigeria",
    "resources": [
      {
        "name": "Fish",
        "industry": "food",
        "bonus": 10
      },
      {
        "name": "Fruits",
        "industry": "food",
        "bonus": 15
      },
      {
        "name": "Cattle",
        "industry": "food",
        "bonus": 20
      }
    ]
  },
  {
    "id": 762,
    "permalink": "Western-Cuba",
    "name": "Western Cuba",
    "originalCountry": "Cuba",
    "currentCountry": "Cuba",
    "resources": [
      {
        "name": "Grain",
        "industry": "food",
        "bonus": 25
      },
      {
        "name": "Deer",
        "industry": "food",
        "bonus": 30
      },
      {
        "name": "Saltpeter",
        "industry": "weapons",
        "bonus": 25
      }
    ]
  },
  {
    "id": 763,
    "permalink": "Las-Villas",
    "name": "Las Villas",
    "originalCountry": "Cuba",
    "currentCountry": "Greece",
    "resources": [
      {
        "name": "Iron",
        "industry": "weapons",
        "bonus": 10
      },
      {
        "name": "Sand",
        "industry": "houses",
        "bonus": 10
      },
      {
        "name": "Wood",
        "industry": "houses",
        "bonus": 15
      },
      {
        "name": "Limestone",
        "industry": "houses",
        "bonus": 25
      }
    ]
  },
  {
    "id": 764,
    "permalink": "Oriente",
    "name": "Oriente",
    "originalCountry": "Cuba",
    "currentCountry": "Cuba",
    "resources": [
      {
        "name": "Oil",
        "industry": "weapons",
        "bonus": 20
      },
      {
        "name": "Clay",
        "industry": "houses",
        "bonus": 20
      }
    ]
  }
];
