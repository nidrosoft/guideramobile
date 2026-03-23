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

/**
 * Resolve a Google Places photo_reference to a usable image URL via the proxy.
 */
async function resolvePhotoRef(
  supabaseUrl: string,
  supabaseKey: string,
  photoRef: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/google-api-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
      body: JSON.stringify({ action: 'place_photo', photoReference: photoRef, maxWidth: 800 }),
    });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

/**
 * Search Google Places with a query string and return the first photo URL found.
 * Checks up to 3 results to maximize photo hit rate.
 */
async function searchPlacesPhoto(
  supabaseUrl: string,
  supabaseKey: string,
  query: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/google-api-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
      body: JSON.stringify({ action: 'places_search', query }),
    });
    const data = await res.json();

    const results = data.results || [];
    for (const result of results.slice(0, 3)) {
      const photoRef = result.photos?.[0]?.photo_reference;
      if (photoRef) {
        const url = await resolvePhotoRef(supabaseUrl, supabaseKey, photoRef);
        if (url) return url;
      }
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
 *   1. "CityName city landmark"  — iconic/recognizable photo
 *   2. "CityName tourism"        — scenic tourism-oriented photo
 *   3. "CityName"                — broadest search as last resort
 *
 * Returns empty string if all strategies fail.
 */
export async function fetchDestinationCoverImage(cityName: string): Promise<string> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pkydmdygctojtfzbqcud.supabase.co';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !cityName?.trim()) return '';

  const city = cityName.trim();
  const strategies = [
    `${city} city landmark`,
    `${city} tourism`,
    city,
  ];

  for (const query of strategies) {
    const url = await searchPlacesPhoto(supabaseUrl, supabaseKey, query);
    if (url) {
      if (__DEV__) console.log(`[CoverImage] Found photo for "${city}" via query: "${query}"`);
      return url;
    }
  }

  if (__DEV__) console.warn(`[CoverImage] No Google Places photo found for "${city}" after ${strategies.length} strategies`);
  return '';
}
