/**
 * DESTINATION IMAGE UTILITY
 * 
 * Fetches accurate destination cover images using Google Places API
 * with multiple retry strategies. No Unsplash fallback — returns empty
 * string when no photo is found (UI shows gradient placeholder).
 * 
 * Used by:
 *   - trip-import-engine.service.ts (scan/import flow)
 *   - trip.store.ts (trip creation/update)
 *   - Any component that needs a destination photo
 */

declare const __DEV__: boolean;

interface GooglePlacePhoto {
  photo_reference?: string;
}

interface GooglePlaceCandidate {
  name?: string;
  formatted_address?: string;
  types?: string[];
  photos?: GooglePlacePhoto[];
}

interface DestinationImageOptions {
  countryName?: string | null;
  rejectedImageUrls?: string[];
  rejectedPhotoReferences?: Set<string>;
}

interface CandidatePickContext {
  city: string;
  country?: string | null;
  rejectedImageUrls?: Set<string>;
  rejectedPhotoReferences?: Set<string>;
}

const DESIRABLE_PLACE_TYPES = new Set([
  'locality',
  'political',
  'tourist_attraction',
  'natural_feature',
  'point_of_interest',
]);

// Photos that are close-ups of a single exhibit/animal/sign make poor city covers.
const POI_CLOSEUP_TYPES = new Set([
  'museum',
  'art_gallery',
  'zoo',
  'aquarium',
  'amusement_park',
  'stadium',
  'place_of_worship',
]);

const CITYSCAPE_HINTS =
  /\b(skyline|cityscape|aerial|panorama|panoramic|downtown|skyscrapers?|city view|old town|waterfront|harbou?r)\b/;

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

function normalizeText(value: string | null | undefined): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeText).filter(Boolean)));
}

export function buildDestinationImageQueries(cityName: string, countryName?: string | null): string[] {
  const city = normalizeText(cityName);
  const country = normalizeText(countryName || '');
  if (!city) return [];

  const destination = country ? `${city}, ${country}` : city;
  const destinationLower = destination.toLowerCase();
  const scenicQueries =
    destinationLower.includes('bali') || destinationLower.includes('indonesia')
      ? [`${destination} beach temple`, `${destination} rice terraces`]
      : [];

  return uniqueValues([
    ...scenicQueries,
    `${destination} skyline`,
    `${destination} cityscape`,
    `${destination} downtown skyline`,
    `${destination} famous landmark`,
    `${destination} city view`,
    `tourist attractions in ${destination}`,
    destination,
  ]);
}

function scorePlaceCandidate(candidate: GooglePlaceCandidate, context: CandidatePickContext): number {
  const photoRef = candidate.photos?.[0]?.photo_reference;
  if (!photoRef || context.rejectedPhotoReferences?.has(photoRef)) return Number.NEGATIVE_INFINITY;

  const types = candidate.types || [];
  const searchableText = `${candidate.name || ''} ${candidate.formatted_address || ''}`.toLowerCase();
  const city = context.city.toLowerCase();
  const country = normalizeText(context.country || '').toLowerCase();
  let score = 0;

  if (searchableText.includes(city)) score += 10;
  if (country && searchableText.includes(country)) score += 6;

  for (const type of types) {
    if (DESIRABLE_PLACE_TYPES.has(type)) score += 8;
    if (POI_CLOSEUP_TYPES.has(type)) score -= 12;
    if (GENERIC_OR_BUSINESS_TYPES.has(type)) score -= 14;
  }

  if (CITYSCAPE_HINTS.test(searchableText)) score += 16;
  if (types.includes('locality')) score += 10;
  if (types.includes('natural_feature')) score += 4;
  if (types.length === 0) score -= 4;
  if (/\b(landmarks?|directory|guide|agency|tour operator)\b/.test((candidate.name || '').toLowerCase())) {
    score -= 16;
  }

  return score;
}

export function pickBestPlacePhotoCandidate(
  candidates: GooglePlaceCandidate[],
  context: CandidatePickContext
): GooglePlaceCandidate | null {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scorePlaceCandidate(candidate, context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.candidate || null;
}

function getRejectedPhotoReferences(urls: string[]): Set<string> {
  const refs = new Set<string>();
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const ref = parsed.searchParams.get('photo_reference');
      if (ref) refs.add(ref);
    } catch {
      // Ignore non-URL values.
    }
  }
  return refs;
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function resolvePersistentCityImage(
  supabaseUrl: string,
  supabaseKey: string,
  cityName: string,
  countryName?: string | null
): Promise<string | null> {
  try {
    const data = await fetchJsonWithTimeout(`${supabaseUrl}/functions/v1/resolve-city-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ city: cityName, country: countryName || null }),
    }, 12_000);

    return typeof data?.imageUrl === 'string' && data.imageUrl ? data.imageUrl : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a Google Places photo_reference to a usable image URL via the proxy.
 */
async function resolvePhotoRef(
  supabaseUrl: string,
  supabaseKey: string,
  photoRef: string,
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await fetchJsonWithTimeout(`${supabaseUrl}/functions/v1/google-api-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
        body: JSON.stringify({ action: 'place_photo', photoReference: photoRef, maxWidth: 800 }),
      });
      if (data.url) return data.url;
    } catch {
      // Retry once, then let the caller try another candidate/query.
    }
  }
  return null;
}

/**
 * Search Google Places with a query string and return the best ranked photo URL found.
 */
async function searchPlacesPhoto(
  supabaseUrl: string,
  supabaseKey: string,
  query: string,
  context: CandidatePickContext,
): Promise<string | null> {
  try {
    const data = await fetchJsonWithTimeout(`${supabaseUrl}/functions/v1/google-api-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
      body: JSON.stringify({ action: 'places_search', query }),
    });

    const results: GooglePlaceCandidate[] = data.results || [];
    const triedPhotoRefs = new Set<string>();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const candidate = pickBestPlacePhotoCandidate(results, {
        ...context,
        rejectedPhotoReferences: new Set([
          ...(context.rejectedPhotoReferences || []),
          ...triedPhotoRefs,
        ]),
      });
      const photoRef = candidate?.photos?.[0]?.photo_reference;
      if (!photoRef) break;

      triedPhotoRefs.add(photoRef);
      const url = await resolvePhotoRef(supabaseUrl, supabaseKey, photoRef);
      if (url && !context.rejectedImageUrls?.has(url)) return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a destination cover image using Google Places API with multiple retry strategies.
 *
 * Strategy order:
 *   1. "City, Country landmark"              — iconic/recognizable photo
 *   2. "tourist attractions in City, Country" — attraction-oriented results
 *   3. "City, Country point of interest"      — broad but still destination-specific
 *   4. "City, Country city view"              — skyline/scenic fallback
 *   5. "City, Country"                        — broadest search as last resort
 *
 * Returns empty string if all strategies fail.
 */
export async function fetchDestinationCoverImage(
  cityName: string,
  options: DestinationImageOptions = {}
): Promise<string> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pkydmdygctojtfzbqcud.supabase.co';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !cityName?.trim()) return '';

  const city = cityName.trim();
  const persistentImage = await resolvePersistentCityImage(
    supabaseUrl,
    supabaseKey,
    city,
    options.countryName
  );
  if (persistentImage) {
    if (__DEV__) console.log(`[CoverImage] Found persistent city image for "${city}"`);
    return persistentImage;
  }

  const rejectedImageUrls = new Set((options.rejectedImageUrls || []).map(normalizeText).filter(Boolean));
  const rejectedPhotoReferences = new Set([
    ...getRejectedPhotoReferences(options.rejectedImageUrls || []),
    ...(options.rejectedPhotoReferences || []),
  ]);
  const strategies = buildDestinationImageQueries(city, options.countryName);

  for (const query of strategies) {
    const url = await searchPlacesPhoto(supabaseUrl, supabaseKey, query, {
      city,
      country: options.countryName,
      rejectedImageUrls,
      rejectedPhotoReferences,
    });
    if (url) {
      if (__DEV__) console.log(`[CoverImage] Found photo for "${city}" via query: "${query}"`);
      return url;
    }
  }

  if (__DEV__) console.warn(`[CoverImage] No Google Places photo found for "${city}" after ${strategies.length} strategies`);
  return '';
}
