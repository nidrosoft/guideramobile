/**
 * VIATOR PARTNER API ADAPTER
 * 
 * Uses Viator's Partner API for experience/activity search and booking links.
 * Viator offers 8% CPA on affiliate bookings.
 * 
 * API Docs: https://docs.viator.com/partner-api/
 * 
 * Used by:
 * - deal-scanner (background experience scanning)
 * - provider-manager (user-initiated experience search)
 * - Homepage "Experiences" section
 * 
 * Requires VIATOR_API_KEY secret to be set in Supabase.
 * 
 * API Notes (discovered via testing):
 * - Destination filtering uses numeric IDs (e.g., "479" for Paris)
 * - Sort format: { sort: "DEFAULT" } — no order field for DEFAULT
 * - Price sort: { sort: "PRICE", order: "ASCENDING" }
 * - Tags are numeric IDs, not text
 * - Product flags: FREE_CANCELLATION, SKIP_THE_LINE, etc.
 * - productUrl already includes affiliate tracking params
 */

interface ViatorSearchParams {
  destination: string          // City name — resolved to Viator destination ID internally
  startDate?: string           // YYYY-MM-DD
  endDate?: string             // YYYY-MM-DD
  currency?: string            // USD, EUR, etc.
  sortBy?: 'default' | 'price' | 'rating'
  limit?: number
  start?: number               // 1-indexed pagination start
  tags?: number[]              // Viator tag IDs for category filtering
}

interface NormalizedViatorExperience {
  id: string
  type: 'experience'
  provider: { code: string; name: string }
  productCode: string
  title: string
  description: string
  shortDescription: string
  category: string
  subcategory?: string
  location: {
    city: string
    country: string
    address?: string
    coordinates?: { lat: number; lng: number }
  }
  images: Array<{ url: string; caption?: string }>
  heroImage: string
  duration: {
    value: number
    unit: 'hours' | 'minutes' | 'days'
    formatted: string
  }
  rating: {
    score: number
    maxScore: number
    reviewCount: number
  }
  price: {
    amount: number
    currency: string
    formatted: string
    perPerson: boolean
    originalPrice?: number
    discountPercent?: number
  }
  highlights: string[]
  included: string[]
  notIncluded: string[]
  languages: string[]
  maxGroupSize?: number
  instantConfirmation: boolean
  freeCancellation: boolean
  bookingUrl: string           // Viator affiliate link
  deepLink?: string
  tags: string[]
  tagIds: number[]
  retrievedAt: string
}

const VIATOR_BASE = 'https://api.viator.com/partner'

// Static city → Viator destination ID mapping (50+ cities)
const CITY_TO_VIATOR_ID: Record<string, string> = {
  // North America
  'new york': '687', 'los angeles': '645', 'san francisco': '651', 'las vegas': '684',
  'chicago': '673', 'miami': '662', 'orlando': '663', 'san diego': '736',
  'seattle': '704', 'houston': '5186', 'atlanta': '784', 'boston': '678',
  'washington': '657', 'denver': '699', 'nashville': '5189', 'new orleans': '675',
  'toronto': '623', 'vancouver': '616', 'montreal': '617', 'cancun': '631',
  'mexico city': '628', 'playa del carmen': '4941',
  // Europe
  'london': '50648', 'paris': '479', 'rome': '511', 'barcelona': '562',
  'amsterdam': '525', 'berlin': '488', 'prague': '462', 'vienna': '454',
  'lisbon': '538', 'dublin': '503', 'edinburgh': '739', 'madrid': '564',
  'florence': '519', 'venice': '522', 'milan': '4952', 'munich': '490',
  'budapest': '443', 'athens': '496', 'istanbul': '585', 'nice': '478',
  'copenhagen': '550', 'stockholm': '551',
  // Africa
  'cairo': '782', 'marrakech': '5408', 'cape town': '318', 'johannesburg': '314',
  'nairobi': '5280', 'lagos': '23572', 'accra': '5517', 'douala': '51626',
  'casablanca': '22637', 'dar es salaam': '5499', 'addis ababa': '24890',
  // Asia
  'tokyo': '334', 'bangkok': '343', 'singapore': '60449', 'dubai': '828',
  'hong kong': '583', 'seoul': '973', 'taipei': '5262', 'kuala lumpur': '335',
  'bali': '768', 'mumbai': '953', 'delhi': '944', 'hanoi': '351',
  'ho chi minh city': '352',
  // South America
  'buenos aires': '901', 'rio de janeiro': '712', 'lima': '928',
  'bogota': '5389', 'santiago': '929', 'medellin': '5395',
  // Oceania
  'sydney': '357', 'melbourne': '361', 'auckland': '376',
}

function getViatorHeaders(): Record<string, string> {
  const apiKey = Deno.env.get('VIATOR_API_KEY')
  if (!apiKey) {
    throw new Error('VIATOR_API_KEY not configured')
  }
  return {
    'exp-api-key': apiKey,
    'Accept': 'application/json;version=2.0',
    'Content-Type': 'application/json',
    'Accept-Language': 'en-US',
  }
}

/**
 * Resolve a city name to a Viator numeric destination ID.
 * Uses static lookup first, falls back to API destinations endpoint.
 */
async function resolveDestination(query: string): Promise<string | null> {
  const key = query.toLowerCase().trim()
  
  // Static lookup first (instant, no API call)
  if (CITY_TO_VIATOR_ID[key]) {
    return CITY_TO_VIATOR_ID[key]
  }
  
  // Try partial match
  for (const [city, id] of Object.entries(CITY_TO_VIATOR_ID)) {
    if (key.includes(city) || city.includes(key)) {
      return id
    }
  }
  
  // Fallback: search the full destinations list from API
  try {
    const response = await fetch(`${VIATOR_BASE}/destinations`, {
      method: 'GET',
      headers: getViatorHeaders(),
    })
    if (!response.ok) return null
    
    const data = await response.json()
    const dests = data.destinations || []
    
    // Exact name match
    const exact = dests.find((d: any) => 
      (d.name || '').toLowerCase() === key && d.type === 'CITY'
    )
    if (exact) return String(exact.destinationId)
    
    // Partial match
    const partial = dests.find((d: any) => 
      (d.name || '').toLowerCase().includes(key) && d.type === 'CITY'
    )
    if (partial) return String(partial.destinationId)
    
    return null
  } catch {
    return null
  }
}

/**
 * Search experiences by destination city name.
 * Resolves city → Viator destination ID, then calls /products/search.
 */
export async function searchExperiences(params: ViatorSearchParams): Promise<NormalizedViatorExperience[]> {
  const apiKey = Deno.env.get('VIATOR_API_KEY')
  
  if (!apiKey) {
    console.warn('VIATOR_API_KEY not set — skipping Viator search')
    return []
  }

  try {
    // Resolve destination to Viator numeric ID
    const destId = await resolveDestination(params.destination)
    
    if (!destId) {
      console.warn(`Could not resolve Viator destination: ${params.destination}`)
      return []
    }

    // Build search body with correct Viator API format
    const searchBody: any = {
      filtering: {
        destination: destId,
      },
      pagination: {
        start: params.start || 1,
        count: params.limit || 20,
      },
      currency: params.currency || 'USD',
    }

    // Tag filtering (category)
    if (params.tags && params.tags.length > 0) {
      searchBody.filtering.tags = params.tags
    }

    // Sort — DEFAULT doesn't support order field
    if (params.sortBy === 'price') {
      searchBody.sorting = { sort: 'PRICE', order: 'ASCENDING' }
    } else if (params.sortBy === 'rating') {
      searchBody.sorting = { sort: 'TRAVELER_RATING', order: 'DESCENDING' }
    } else {
      searchBody.sorting = { sort: 'DEFAULT' }
    }

    // Date filter
    if (params.startDate) {
      searchBody.filtering.startDate = params.startDate
      searchBody.filtering.endDate = params.endDate || params.startDate
    }

    const response = await fetch(`${VIATOR_BASE}/products/search`, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(searchBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Viator search failed: ${response.status}`, errorText.substring(0, 300))
      throw new Error(`Viator search failed: HTTP ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || []
    
    console.log(`Viator returned ${products.length} experiences for ${params.destination} (dest=${destId})`)

    return normalizeProducts(products, params)
  } catch (error) {
    console.error('Viator search error:', error)
    return []
  }
}

/**
 * Search experiences by destination ID directly (for when you already have the ID).
 */
export async function searchByDestinationId(
  destId: string, options?: { limit?: number; currency?: string; startDate?: string }
): Promise<NormalizedViatorExperience[]> {
  const apiKey = Deno.env.get('VIATOR_API_KEY')
  if (!apiKey) return []

  try {
    const searchBody: any = {
      filtering: { destination: destId },
      sorting: { sort: 'DEFAULT' },
      pagination: { start: 1, count: options?.limit || 15 },
      currency: options?.currency || 'USD',
    }

    if (options?.startDate) {
      searchBody.filtering.startDate = options.startDate
    }

    const response = await fetch(`${VIATOR_BASE}/products/search`, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(searchBody),
    })

    if (!response.ok) return []

    const data = await response.json()
    return normalizeProducts(data.products || [], { destination: destId })
  } catch (error) {
    console.error('Viator search by dest ID error:', error)
    return []
  }
}

/**
 * Get detailed product info by product code.
 */
export async function getProductDetails(productCode: string, currency = 'USD'): Promise<NormalizedViatorExperience | null> {
  const apiKey = Deno.env.get('VIATOR_API_KEY')
  if (!apiKey) return null

  try {
    // Use the search endpoint with productCodes filter (more reliable than GET /products/{code})
    const searchBody = {
      filtering: {
        productCodes: [productCode],
      },
      pagination: { start: 1, count: 1 },
      currency,
    }

    const response = await fetch(`${VIATOR_BASE}/products/search`, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(searchBody),
    })

    if (!response.ok) {
      console.error(`Viator detail search returned ${response.status} for ${productCode}`)
      return null
    }

    const data = await response.json()
    const products = data.products || []

    if (products.length === 0) {
      console.warn(`Viator: no product found for code ${productCode}`)
      return null
    }

    const normalized = normalizeProducts(products, { destination: '', currency }, true)
    return normalized[0] || null
  } catch (error) {
    console.error(`Viator product detail error for ${productCode}:`, error)
    return null
  }
}

/**
 * Get the Viator destination ID for a city name (exposed for deal-scanner).
 */
export function getDestinationId(city: string): string | null {
  const key = city.toLowerCase().trim()
  if (CITY_TO_VIATOR_ID[key]) return CITY_TO_VIATOR_ID[key]
  for (const [c, id] of Object.entries(CITY_TO_VIATOR_ID)) {
    if (key.includes(c) || c.includes(key)) return id
  }
  return null
}

/**
 * Normalize Viator product results to our standard format.
 * Based on actual API response structure discovered through testing.
 */
function normalizeProducts(products: any[], params: Partial<ViatorSearchParams>, skipPriceFilter = false): NormalizedViatorExperience[] {
  const currency = params.currency || 'USD'
  const now = new Date().toISOString()

  return products
    .filter((p: any) => p && p.productCode)
    .map((product: any) => {
      const productCode = product.productCode
      const price = product.pricing?.summary?.fromPrice || 0
      const rawOriginalPrice = product.pricing?.summary?.fromPriceBeforeDiscount || null
      // Only treat as a discount if the original price is genuinely higher
      const originalPrice = rawOriginalPrice && rawOriginalPrice > price ? rawOriginalPrice : null
      const discountPercent = originalPrice
        ? Math.round((1 - price / originalPrice) * 100) 
        : null

      // Duration — Viator uses fixedDurationInMinutes or variableDurationFromMinutes
      const durationMinutes = product.duration?.fixedDurationInMinutes ||
                              product.duration?.variableDurationFromMinutes || 120
      
      // Images — Viator returns variants array per image, pick best resolution
      const images = (product.images || []).map((img: any) => {
        const variants = img.variants || []
        const best = variants.find((v: any) => v.width === 720) ||
                     variants.find((v: any) => v.width === 480) ||
                     variants.find((v: any) => v.width >= 360) ||
                     variants[0] || {}
        const url = best.url || img.url || img.imageSource || ''
        return {
          url,
          caption: img.caption || '',
        }
      }).filter((img: any) => img.url)

      const heroImage = images[0]?.url || ''

      // Rating — combinedAverageRating from reviews object
      const rating = product.reviews?.combinedAverageRating || 0
      const reviewCount = product.reviews?.totalReviews || 0

      // Flags as tags (FREE_CANCELLATION, SKIP_THE_LINE, etc.)
      const flags = product.flags || []
      const tags: string[] = [...flags]

      // Destination name from destinations array
      const primaryDest = (product.destinations || []).find((d: any) => d.primary) || product.destinations?.[0]

      // Booking URL — productUrl already includes affiliate tracking
      const bookingUrl = product.productUrl || 
        `https://www.viator.com/tours/${productCode}`

      // Extract raw tag IDs from the product for category mapping
      const tagIds: number[] = (product.tags || []).map((t: any) => typeof t === 'number' ? t : t?.tagId).filter(Boolean)

      // Extract highlights from product
      const highlights: string[] = (product.highlights || [])
        .map((h: any) => typeof h === 'string' ? h : h?.description || h?.text || '')
        .filter(Boolean)

      // Extract inclusions / exclusions
      const included: string[] = (product.inclusions || product.whatIsIncluded || [])
        .map((item: any) => typeof item === 'string' ? item : item?.otherDescription || item?.description || item?.text || '')
        .filter(Boolean)

      const notIncluded: string[] = (product.exclusions || product.whatIsNotIncluded || [])
        .map((item: any) => typeof item === 'string' ? item : item?.otherDescription || item?.description || item?.text || '')
        .filter(Boolean)

      // Extract languages
      const languages: string[] = (product.languageGuides || [])
        .map((lg: any) => lg?.language || '')
        .filter(Boolean)

      return {
        id: `viator-${productCode}`,
        type: 'experience' as const,
        provider: { code: 'viator', name: 'Viator' },
        productCode,
        title: product.title || 'Experience',
        description: product.description || '',
        shortDescription: (product.description || '').substring(0, 200),
        category: 'tours',
        subcategory: undefined,
        tagIds,
        location: {
          city: params.destination || '',
          country: '',
          address: undefined,
          coordinates: undefined,
        },
        images,
        heroImage,
        duration: {
          value: durationMinutes >= 60 ? Math.round(durationMinutes / 60) : durationMinutes,
          unit: (durationMinutes >= 60 ? 'hours' : 'minutes') as 'hours' | 'minutes' | 'days',
          formatted: durationMinutes >= 1440 
            ? `${Math.round(durationMinutes / 1440)} day${Math.round(durationMinutes / 1440) > 1 ? 's' : ''}`
            : durationMinutes >= 60 
              ? `${Math.round(durationMinutes / 60)}h`
              : `${durationMinutes}min`,
        },
        rating: {
          score: typeof rating === 'number' ? Math.round(rating * 10) / 10 : 0,
          maxScore: 5,
          reviewCount,
        },
        price: {
          amount: typeof price === 'number' ? price : parseFloat(price) || 0,
          currency: product.pricing?.currency || currency,
          formatted: formatPrice(typeof price === 'number' ? price : parseFloat(price) || 0, product.pricing?.currency || currency),
          perPerson: true,
          originalPrice: originalPrice || undefined,
          discountPercent: discountPercent || undefined,
        },
        highlights,
        included,
        notIncluded,
        languages: languages.length > 0 ? languages : ['English'],
        maxGroupSize: product.maxTravelersPerBooking || undefined,
        instantConfirmation: (product.confirmationType || '').includes('INSTANT'),
        freeCancellation: flags.includes('FREE_CANCELLATION'),
        bookingUrl,
        deepLink: product.productUrl,
        tags,
        retrievedAt: now,
      }
    })
    .filter((exp: NormalizedViatorExperience) => skipPriceFilter || exp.price.amount > 0)
    .sort((a: NormalizedViatorExperience, b: NormalizedViatorExperience) => b.rating.score - a.rating.score)
}

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

export async function healthCheck(): Promise<boolean> {
  const apiKey = Deno.env.get('VIATOR_API_KEY')
  return !!apiKey
}
