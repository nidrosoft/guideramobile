/** Regional daily cost assumptions (USD) when APIs are missing or need sanity checks */

export interface DestinationCostProfile {
  foodPerPersonDay: { low: number; high: number };
  miscPerPersonDay: { low: number; high: number };
  hotelFallbackPerNight: { low: number; high: number };
  /** Cap sanitized API hotel rates — prevents mis-converted local currency */
  hotelSanityMaxPerNight: number;
  experienceMultiplier: number;
}

const AFRICA_SUBSAHARAN = new Set([
  'cameroon', 'nigeria', 'ghana', 'kenya', 'senegal', "côte d'ivoire", 'ivory coast',
  'tanzania', 'uganda', 'ethiopia', 'rwanda', 'benin', 'togo', 'mali', 'niger',
  'burkina faso', 'chad', 'gabon', 'congo', 'democratic republic of the congo', 'drc',
  'angola', 'zambia', 'zimbabwe', 'mozambique', 'madagascar', 'malawi', 'botswana',
  'namibia', 'liberia', 'sierra leone', 'guinea', 'gambia', 'mauritania',
]);

const SOUTH_ASIA = new Set([
  'india', 'nepal', 'bangladesh', 'sri lanka', 'pakistan', 'myanmar', 'cambodia', 'laos',
]);

const SOUTHEAST_ASIA = new Set([
  'vietnam', 'thailand', 'indonesia', 'philippines', 'malaysia',
]);

const LATAM_BUDGET = new Set([
  'colombia', 'peru', 'ecuador', 'bolivia', 'guatemala', 'honduras', 'nicaragua',
  'el salvador', 'paraguay',
]);

const DEFAULT_PROFILE: DestinationCostProfile = {
  foodPerPersonDay: { low: 30, high: 70 },
  miscPerPersonDay: { low: 15, high: 40 },
  hotelFallbackPerNight: { low: 40, high: 100 },
  hotelSanityMaxPerNight: 500,
  experienceMultiplier: 1,
};

const BUDGET_PROFILE: DestinationCostProfile = {
  foodPerPersonDay: { low: 10, high: 28 },
  miscPerPersonDay: { low: 5, high: 18 },
  hotelFallbackPerNight: { low: 22, high: 55 },
  hotelSanityMaxPerNight: 95,
  experienceMultiplier: 0.65,
};

const MID_BUDGET_PROFILE: DestinationCostProfile = {
  foodPerPersonDay: { low: 18, high: 45 },
  miscPerPersonDay: { low: 8, high: 25 },
  hotelFallbackPerNight: { low: 35, high: 85 },
  hotelSanityMaxPerNight: 180,
  experienceMultiplier: 0.8,
};

/** South Africa — mid-range vs Sub-Saharan budget, below Western defaults */
const SOUTH_AFRICA_PROFILE: DestinationCostProfile = {
  foodPerPersonDay: { low: 15, high: 38 },
  miscPerPersonDay: { low: 8, high: 22 },
  hotelFallbackPerNight: { low: 28, high: 68 },
  hotelSanityMaxPerNight: 140,
  experienceMultiplier: 0.85,
};

function normalizeCountry(country?: string): string {
  return (country || '').toLowerCase().trim();
}

export function getCostProfile(country?: string): DestinationCostProfile {
  const c = normalizeCountry(country);
  if (!c) return DEFAULT_PROFILE;
  if (c === 'south africa') return SOUTH_AFRICA_PROFILE;
  if (AFRICA_SUBSAHARAN.has(c)) return BUDGET_PROFILE;
  if (SOUTH_ASIA.has(c)) return BUDGET_PROFILE;
  if (SOUTHEAST_ASIA.has(c)) return MID_BUDGET_PROFILE;
  if (LATAM_BUDGET.has(c)) return MID_BUDGET_PROFILE;
  return DEFAULT_PROFILE;
}

export function sanitizeHotelNightlyRate(usdPerNight: number, profile: DestinationCostProfile): number {
  if (!Number.isFinite(usdPerNight) || usdPerNight <= 0) return 0;
  return Math.min(usdPerNight, profile.hotelSanityMaxPerNight);
}

/** XAF/XOF countries where APIs sometimes return local amounts tagged as USD */
export function isXafZone(country?: string): boolean {
  const c = normalizeCountry(country);
  return AFRICA_SUBSAHARAN.has(c) || c === 'senegal' || c.includes('ivoire');
}
