/**
 * AIRPORT → CITY RESOLVER
 *
 * Travel documents (boarding passes, e-tickets) name the *airport*, not the
 * *city*. Users travel to see the city, and every downstream feature — trip
 * cards, the home page, cached destination images — needs the real city name
 * to fetch a representative photo (a Paris skyline, not "Charles de Gaulle").
 *
 * Resolution is deterministic-first for sharpness:
 *   1. IATA airport code → curated { city, country } map (most reliable).
 *   2. Otherwise, clean an airport-style name into a city (strip "Airport",
 *      "International", terminals, trailing country).
 *   3. Fall back to whatever city/country we were given.
 *
 * Shared by scan-ticket (resolve at extraction time) and resolve-city-image
 * (defensive cleaning, since images are reused across the app).
 */

export interface ResolvedCity {
  city: string;
  country: string;
}

// Curated map of major / commonly-scanned airports. Codes not listed fall back
// to name-cleaning + the vision model's own city output, so this does not need
// to be exhaustive — it just guarantees sharpness for high-traffic hubs.
export const AIRPORT_CITY: Record<string, ResolvedCity> = {
  // North America
  JFK: { city: 'New York', country: 'United States' },
  LGA: { city: 'New York', country: 'United States' },
  EWR: { city: 'New York', country: 'United States' },
  LAX: { city: 'Los Angeles', country: 'United States' },
  SFO: { city: 'San Francisco', country: 'United States' },
  SAN: { city: 'San Diego', country: 'United States' },
  ORD: { city: 'Chicago', country: 'United States' },
  MDW: { city: 'Chicago', country: 'United States' },
  MIA: { city: 'Miami', country: 'United States' },
  SEA: { city: 'Seattle', country: 'United States' },
  BOS: { city: 'Boston', country: 'United States' },
  ATL: { city: 'Atlanta', country: 'United States' },
  DFW: { city: 'Dallas', country: 'United States' },
  DEN: { city: 'Denver', country: 'United States' },
  LAS: { city: 'Las Vegas', country: 'United States' },
  IAD: { city: 'Washington', country: 'United States' },
  DCA: { city: 'Washington', country: 'United States' },
  AUS: { city: 'Austin', country: 'United States' },
  YYZ: { city: 'Toronto', country: 'Canada' },
  YVR: { city: 'Vancouver', country: 'Canada' },
  YUL: { city: 'Montreal', country: 'Canada' },
  MEX: { city: 'Mexico City', country: 'Mexico' },
  CUN: { city: 'Cancún', country: 'Mexico' },
  SJO: { city: 'San José', country: 'Costa Rica' },

  // South America
  LIM: { city: 'Lima', country: 'Peru' },
  BOG: { city: 'Bogotá', country: 'Colombia' },
  MDE: { city: 'Medellín', country: 'Colombia' },
  GRU: { city: 'São Paulo', country: 'Brazil' },
  GIG: { city: 'Rio de Janeiro', country: 'Brazil' },
  EZE: { city: 'Buenos Aires', country: 'Argentina' },
  SCL: { city: 'Santiago', country: 'Chile' },

  // Europe
  LHR: { city: 'London', country: 'United Kingdom' },
  LGW: { city: 'London', country: 'United Kingdom' },
  STN: { city: 'London', country: 'United Kingdom' },
  CDG: { city: 'Paris', country: 'France' },
  ORY: { city: 'Paris', country: 'France' },
  AMS: { city: 'Amsterdam', country: 'Netherlands' },
  FRA: { city: 'Frankfurt', country: 'Germany' },
  MUC: { city: 'Munich', country: 'Germany' },
  BER: { city: 'Berlin', country: 'Germany' },
  MAD: { city: 'Madrid', country: 'Spain' },
  BCN: { city: 'Barcelona', country: 'Spain' },
  LIS: { city: 'Lisbon', country: 'Portugal' },
  FCO: { city: 'Rome', country: 'Italy' },
  LIN: { city: 'Milan', country: 'Italy' },
  MXP: { city: 'Milan', country: 'Italy' },
  VCE: { city: 'Venice', country: 'Italy' },
  ZRH: { city: 'Zurich', country: 'Switzerland' },
  VIE: { city: 'Vienna', country: 'Austria' },
  DUB: { city: 'Dublin', country: 'Ireland' },
  CPH: { city: 'Copenhagen', country: 'Denmark' },
  ARN: { city: 'Stockholm', country: 'Sweden' },
  OSL: { city: 'Oslo', country: 'Norway' },
  ATH: { city: 'Athens', country: 'Greece' },
  IST: { city: 'Istanbul', country: 'Türkiye' },

  // Middle East & Africa
  DXB: { city: 'Dubai', country: 'United Arab Emirates' },
  AUH: { city: 'Abu Dhabi', country: 'United Arab Emirates' },
  DOH: { city: 'Doha', country: 'Qatar' },
  CAI: { city: 'Cairo', country: 'Egypt' },
  JNB: { city: 'Johannesburg', country: 'South Africa' },
  CPT: { city: 'Cape Town', country: 'South Africa' },
  NBO: { city: 'Nairobi', country: 'Kenya' },
  CMN: { city: 'Casablanca', country: 'Morocco' },

  // Asia & Oceania
  HND: { city: 'Tokyo', country: 'Japan' },
  NRT: { city: 'Tokyo', country: 'Japan' },
  KIX: { city: 'Osaka', country: 'Japan' },
  ICN: { city: 'Seoul', country: 'South Korea' },
  PEK: { city: 'Beijing', country: 'China' },
  PVG: { city: 'Shanghai', country: 'China' },
  HKG: { city: 'Hong Kong', country: 'Hong Kong' },
  TPE: { city: 'Taipei', country: 'Taiwan' },
  SIN: { city: 'Singapore', country: 'Singapore' },
  BKK: { city: 'Bangkok', country: 'Thailand' },
  KUL: { city: 'Kuala Lumpur', country: 'Malaysia' },
  MNL: { city: 'Manila', country: 'Philippines' },
  CGK: { city: 'Jakarta', country: 'Indonesia' },
  DPS: { city: 'Bali', country: 'Indonesia' },
  DEL: { city: 'New Delhi', country: 'India' },
  BOM: { city: 'Mumbai', country: 'India' },
  SYD: { city: 'Sydney', country: 'Australia' },
  MEL: { city: 'Melbourne', country: 'Australia' },
  AKL: { city: 'Auckland', country: 'New Zealand' },
};

const AIRPORT_NAME_TOKENS =
  /\b(international|intl|airport|airfield|aerodrome|terminal\s*\d*|domestic|regional|municipal)\b/gi;

export function normalizeAirportCode(code: string | null | undefined): string {
  return (code || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}

/**
 * True when a name reads like an airport rather than a city, e.g.
 * "Charles de Gaulle Airport", "PARIS DE GAULLE, FRANCE", "JFK International".
 */
export function looksLikeAirportName(name: string | null | undefined): boolean {
  const value = (name || '').toLowerCase();
  if (!value) return false;
  if (AIRPORT_NAME_TOKENS.test(value)) {
    AIRPORT_NAME_TOKENS.lastIndex = 0;
    return true;
  }
  return /\b(de gaulle|heathrow|gatwick|o'?hare|haneda|narita|malpensa|linate|el prat|or tambo|changi|schiphol|fiumicino|barajas|tegel|incheon|suvarnabhumi)\b/.test(
    value
  );
}

/**
 * Strip airport-y tokens, terminal info and a trailing country/region segment
 * so an airport-style name collapses toward its city, e.g.
 * "PARIS DE GAULLE, FRANCE" → "Paris", "Madrid Barajas Airport" → "Madrid".
 */
export function cleanCityName(name: string | null | undefined): string {
  let value = (name || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';

  // Drop trailing comma-separated qualifiers (country/state), keep the head.
  if (value.includes(',')) value = value.split(',')[0].trim();

  value = value.replace(AIRPORT_NAME_TOKENS, ' ');
  AIRPORT_NAME_TOKENS.lastIndex = 0;

  // Remove common airport proper-noun suffixes attached to a city name.
  value = value.replace(
    /\b(de gaulle|charles de gaulle|heathrow|gatwick|stansted|o'?hare|midway|haneda|narita|malpensa|linate|el prat|barajas|fiumicino|schiphol|changi|suvarnabhumi|or tambo|tegel|incheon)\b/gi,
    ' '
  );

  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Resolve the real destination city + country from a scanned location.
 * Priority: curated IATA map → cleaned airport name → provided city/name.
 */
export function resolveCityAndCountry(input: {
  name?: string | null;
  code?: string | null;
  city?: string | null;
  country?: string | null;
}): ResolvedCity {
  const code = normalizeAirportCode(input.code);
  const mapped = code ? AIRPORT_CITY[code] : undefined;
  if (mapped) {
    // Trust the curated map for the city; prefer an explicit country if present.
    return { city: mapped.city, country: (input.country || '').trim() || mapped.country };
  }

  const candidate = (input.city || input.name || '').trim();
  const city = looksLikeAirportName(candidate) ? cleanCityName(candidate) : candidate;

  return { city: city || candidate, country: (input.country || '').trim() };
}
