export interface GooglePlacePhoto {
  photo_reference?: string;
  width?: number;
  height?: number;
}

export interface GooglePlaceCandidate {
  name?: string;
  formatted_address?: string;
  types?: string[];
  photos?: GooglePlacePhoto[];
}

// Types that make for a representative *city cover* (skyline / wide scenery).
const DESIRABLE_PLACE_TYPES = new Set([
  'locality',
  'political',
  'tourist_attraction',
  'natural_feature',
  'point_of_interest',
]);

// Types whose photos are typically close-ups of a single exhibit/animal/sign
// (a painting inside a museum, a zoo map, etc.) — poor city covers.
const POI_CLOSEUP_TYPES = new Set([
  'museum',
  'art_gallery',
  'zoo',
  'aquarium',
  'amusement_park',
  'stadium',
  'place_of_worship',
]);

const GENERIC_OR_BUSINESS_TYPES = new Set([
  'travel_agency',
  'lodging',
  'store',
  'shopping_mall',
  'restaurant',
  'cafe',
  'bar',
  'night_club',
  'car_rental',
  'airport',
  'transit_station',
  'real_estate_agency',
  'finance',
]);

const CITYSCAPE_HINTS =
  /\b(skyline|cityscape|aerial|panorama|panoramic|downtown|skyscrapers?|city view|old town|waterfront|harbou?r)\b/;

export function normalizeCityImageText(value: string | null | undefined): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

function slugPart(value: string | null | undefined): string {
  return normalizeCityImageText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCityImageSlug(city: string, country?: string | null): string {
  return [slugPart(city), slugPart(country)].filter(Boolean).join('-').slice(0, 120);
}

export function buildCityImageQueries(cityName: string, countryName?: string | null): string[] {
  const city = normalizeCityImageText(cityName);
  const country = normalizeCityImageText(countryName || '');
  if (!city) return [];

  const destination = country ? `${city}, ${country}` : city;
  return Array.from(
    new Set([
      `${destination} skyline`,
      `${destination} cityscape`,
      `${destination} downtown skyline`,
      `${destination} famous landmark`,
      `${destination} city view`,
      `tourist attractions in ${destination}`,
      destination,
    ])
  );
}

export function scoreCityImageCandidate(
  candidate: GooglePlaceCandidate,
  city: string,
  country?: string | null
): number {
  const photoRef = candidate.photos?.[0]?.photo_reference;
  if (!photoRef) return Number.NEGATIVE_INFINITY;

  const types = candidate.types || [];
  const searchableText = `${candidate.name || ''} ${candidate.formatted_address || ''}`.toLowerCase();
  const normalizedCity = normalizeCityImageText(city).toLowerCase();
  const normalizedCountry = normalizeCityImageText(country || '').toLowerCase();
  let score = 0;

  if (normalizedCity && searchableText.includes(normalizedCity)) score += 10;
  if (normalizedCountry && searchableText.includes(normalizedCountry)) score += 6;

  for (const type of types) {
    if (DESIRABLE_PLACE_TYPES.has(type)) score += 8;
    if (POI_CLOSEUP_TYPES.has(type)) score -= 12;
    if (GENERIC_OR_BUSINESS_TYPES.has(type)) score -= 14;
  }

  // Strongly prefer wide city scenery; this is what reads as a destination cover.
  if (CITYSCAPE_HINTS.test(searchableText)) score += 16;
  // The locality result itself (the city as a place) is the most representative.
  if (types.includes('locality')) score += 10;
  if (types.includes('natural_feature')) score += 4;
  if (types.length === 0) score -= 4;
  if (/\b(landmarks?|directory|guide|agency|tour operator)\b/.test((candidate.name || '').toLowerCase())) {
    score -= 16;
  }

  return score;
}

export function pickBestCityImageCandidate(
  candidates: GooglePlaceCandidate[],
  city: string,
  country?: string | null
): GooglePlaceCandidate | null {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreCityImageCandidate(candidate, city, country),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.candidate || null;
}
