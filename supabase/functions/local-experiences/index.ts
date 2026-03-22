/**
 * LOCAL EXPERIENCES EDGE FUNCTION
 * 
 * Fetches real local experiences from Viator Partner API.
 * Falls back to nearest major city within 30 miles when user's city
 * isn't found in Viator (e.g. La Mesa → San Diego).
 * Uses 7 curated category groups for clean filtering.
 * 
 * Actions:
 * - search: Search experiences by city (+ optional lat/lng fallback)
 * - categories: Get curated experience categories
 * - detail: Get single experience details by product code
 * 
 * Requires VIATOR_API_KEY secret.
 */

import { searchExperiences, getProductDetails } from '../_shared/providers/viator.ts'

// ─── Curated Categories ──────────────────────────────────
// 7 user-friendly groups mapped to stable Viator top-level tag IDs.
const CURATED_CATEGORIES = [
  { tagId: null, name: 'All' },
  { tagId: 21972, name: 'Tours & Sightseeing' },
  { tagId: 11889, name: 'Outdoor & Nature' },
  { tagId: 21486, name: 'Food & Drink' },
  { tagId: 21480, name: 'Water Activities' },
  { tagId: 21484, name: 'Day Trips' },
  { tagId: 21514, name: 'Shows & Entertainment' },
]

// Quick lookup: tagId → curated category name
const TAG_TO_CATEGORY = new Map<number, string>(
  CURATED_CATEGORIES.filter(c => c.tagId !== null).map(c => [c.tagId!, c.name])
)

function getCategoryName(expTagIds: number[]): string {
  for (const tid of expTagIds) {
    const name = TAG_TO_CATEGORY.get(tid)
    if (name) return name
  }
  return 'Experience'
}

// ─── 30-Mile City Proximity Fallback ──────────────────────
// Coordinates for every city in CITY_TO_VIATOR_ID.
// When user is in a suburb (La Mesa, Glendale, etc.) we find the
// nearest major Viator-supported city within 30 mi and search that.

const MAJOR_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'las vegas': { lat: 36.1699, lng: -115.1398 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'orlando': { lat: 28.5383, lng: -81.3792 },
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'atlanta': { lat: 33.7490, lng: -84.3880 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'nashville': { lat: 36.1627, lng: -86.7816 },
  'new orleans': { lat: 29.9511, lng: -90.0715 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'cancun': { lat: 21.1619, lng: -86.8515 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'playa del carmen': { lat: 20.6296, lng: -87.0739 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'edinburgh': { lat: 55.9533, lng: -3.1883 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'florence': { lat: 43.7696, lng: 11.2558 },
  'venice': { lat: 45.4408, lng: 12.3155 },
  'milan': { lat: 45.4642, lng: 9.1900 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'cairo': { lat: 30.0444, lng: 31.2357 },
  'marrakech': { lat: 31.6295, lng: -7.9811 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'nairobi': { lat: -1.2921, lng: 36.8219 },
  'lagos': { lat: 6.5244, lng: 3.3792 },
  'accra': { lat: 5.6037, lng: -0.1870 },
  'douala': { lat: 4.0511, lng: 9.7679 },
  'casablanca': { lat: 33.5731, lng: -7.5898 },
  'dar es salaam': { lat: -6.7924, lng: 39.2083 },
  'addis ababa': { lat: 9.0250, lng: 38.7469 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  'seoul': { lat: 37.5665, lng: 126.9780 },
  'taipei': { lat: 25.0330, lng: 121.5654 },
  'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
  'bali': { lat: -8.3405, lng: 115.0920 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'hanoi': { lat: 21.0278, lng: 105.8342 },
  'ho chi minh city': { lat: 10.8231, lng: 106.6297 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'lima': { lat: -12.0464, lng: -77.0428 },
  'bogota': { lat: 4.7110, lng: -74.0721 },
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'medellin': { lat: 6.2476, lng: -75.5658 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'auckland': { lat: -36.8485, lng: 174.7633 },
}

function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestCity(lat: number, lng: number, radiusMiles = 30): { city: string; distance: number } | null {
  let best: { city: string; distance: number } | null = null
  for (const [city, coords] of Object.entries(MAJOR_CITY_COORDS)) {
    const dist = haversineDistanceMiles(lat, lng, coords.lat, coords.lng)
    if (dist <= radiusMiles && (!best || dist < best.distance)) {
      best = { city, distance: Math.round(dist) }
    }
  }
  return best
}

function titleCase(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Search Cache ──────────────────────────────────
const searchCache = new Map<string, { data: any; cachedAt: number }>()
const SEARCH_TTL = 3 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 100

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Handlers ──────────────────────────────────────

function handleCategories() {
  return json({
    success: true,
    categories: CURATED_CATEGORIES,
    total: CURATED_CATEGORIES.length,
  })
}

async function handleSearch(params: any) {
  const { city, lat, lng, tagId, limit = 15, start = 1, currency = 'USD', sortBy = 'default' } = params

  if (!city && !lat) {
    return json({ error: 'city or coordinates required' }, 400)
  }

  let searchCity = city || ''
  let usedFallback = false

  // Build cache key for the original request
  const makeCacheKey = (c: string) => `search:${c.toLowerCase()}:${tagId || 'all'}:${start}:${limit}:${sortBy}`

  // Check cache for original city
  const cached = searchCache.get(makeCacheKey(searchCity))
  if (cached && Date.now() - cached.cachedAt < SEARCH_TTL) {
    return json(cached.data)
  }

  // Search Viator for the user's city
  let experiences = await searchExperiences({
    destination: searchCity,
    limit,
    start,
    currency,
    sortBy: sortBy as 'default' | 'price' | 'rating',
    tags: tagId ? [tagId] : undefined,
  })

  // Fallback: no results + we have coordinates → find nearest major city within 30 mi
  if (experiences.length === 0 && lat && lng) {
    const nearest = findNearestCity(lat, lng, 30)
    if (nearest && nearest.city.toLowerCase() !== searchCity.toLowerCase()) {
      console.log(`No results for "${searchCity}", trying "${nearest.city}" (${nearest.distance} mi)`)
      
      // Check cache for fallback city
      const fallbackCached = searchCache.get(makeCacheKey(nearest.city))
      if (fallbackCached && Date.now() - fallbackCached.cachedAt < SEARCH_TTL) {
        const data = { ...fallbackCached.data, requestedCity: city, usedFallback: true }
        return json(data)
      }

      experiences = await searchExperiences({
        destination: nearest.city,
        limit,
        start,
        currency,
        sortBy: sortBy as 'default' | 'price' | 'rating',
        tags: tagId ? [tagId] : undefined,
      })
      searchCity = nearest.city
      usedFallback = true
    }
  }

  // Enrich each experience with a curated category name
  const enriched = experiences.map((exp: any) => ({
    ...exp,
    category: getCategoryName(exp.tagIds || []),
  }))

  const result = {
    success: true,
    experiences: enriched,
    requestedCity: city,
    searchedCity: titleCase(searchCity),
    usedFallback,
    total: enriched.length,
  }

  // Cache (evict oldest if full)
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = searchCache.keys().next().value
    if (oldest) searchCache.delete(oldest)
  }
  searchCache.set(makeCacheKey(searchCity), { data: result, cachedAt: Date.now() })

  return json(result)
}

async function handleDetail(params: any) {
  const { productCode, currency = 'USD' } = params

  if (!productCode) {
    return json({ error: 'productCode is required' }, 400)
  }

  const experience = await getProductDetails(productCode, currency)

  if (!experience) {
    return json({ success: false, error: 'Experience not found' })
  }

  return json({
    success: true,
    experience: { ...experience, category: getCategoryName((experience as any).tagIds || []) },
  })
}

// ─── Main Handler ──────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, ...params } = body

    switch (action) {
      case 'search':
        return await handleSearch(params)
      case 'categories':
        return handleCategories()
      case 'detail':
        return await handleDetail(params)
      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err: any) {
    console.error('local-experiences error:', err)
    return json({ error: err.message || 'Internal server error' }, 500)
  }
})
