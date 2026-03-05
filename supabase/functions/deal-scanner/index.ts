/**
 * DEAL SCANNER — Edge Function
 *
 * The GIL deal discovery engine. Scans for deals using SerpAPI adapters,
 * scores them against price history, and matches them to users via Travel DNA.
 *
 * Scan types:
 *  - heritage:     Flights from user home airports → heritage country airports
 *  - explore:      Cheapest destinations from unique home airports (Google Travel Explore)
 *  - popular:      Top searched routes across all users
 *  - hotels:       Hotel deals in top destination cities
 *  - experiences:  Activities & tours via Viator in top destination cities
 *  - alerts:       Active price alert routes
 *
 * POST body: { scan_type: string, batch_size?: number }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') || ''
const SERPAPI_BASE = 'https://serpapi.com/search.json'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanResult {
  scan_type: string
  success: boolean
  deals_found: number
  deals_cached: number
  users_matched: number
  errors: string[]
  duration_ms: number
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body = await req.json().catch(() => ({}))
    const scanType = body.scan_type || 'explore'
    const batchSize = body.batch_size || 20

    let result: ScanResult

    switch (scanType) {
      case 'heritage':
        result = await scanHeritage(batchSize)
        break
      case 'explore':
        result = await scanExplore(batchSize)
        break
      case 'popular':
        result = await scanPopularRoutes(batchSize)
        break
      case 'hotels':
        result = await scanHotelDeals(batchSize)
        break
      case 'alerts':
        result = await scanPriceAlerts(batchSize)
        break
      case 'experiences':
        result = await scanExperienceDeals(batchSize)
        break
      case 'all':
        // Run all scanners sequentially
        const results: ScanResult[] = []
        results.push(await scanExplore(10))
        results.push(await scanHeritage(10))
        results.push(await scanPopularRoutes(10))
        results.push(await scanHotelDeals(10))
        results.push(await scanExperienceDeals(10))
        return jsonResponse({
          success: true,
          results,
          total_duration_ms: Date.now() - startTime,
        })
      default:
        return jsonResponse({ success: false, error: `Unknown scan_type: ${scanType}` }, 400)
    }

    return jsonResponse(result)
  } catch (error: any) {
    console.error('deal-scanner error:', error)
    return jsonResponse({ success: false, error: error.message, duration_ms: Date.now() - startTime }, 500)
  }
})

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ============================================
// SCAN: EXPLORE — Cheapest destinations from home airports
// ============================================

async function scanExplore(batchSize: number): Promise<ScanResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let dealsFound = 0, dealsCached = 0, usersMatched = 0

  try {
    // Get unique home airports from DNA
    const { data: airports } = await supabase
      .from('user_travel_dna')
      .select('home_airport_code')
      .not('home_airport_code', 'is', null)

    const uniqueAirports = [...new Set((airports || []).map(a => a.home_airport_code))]
      .slice(0, batchSize)

    if (uniqueAirports.length === 0) {
      return { scan_type: 'explore', success: true, deals_found: 0, deals_cached: 0, users_matched: 0, errors: ['No home airports found'], duration_ms: Date.now() - startTime }
    }

    console.log(`Explore scan: ${uniqueAirports.length} airports: ${uniqueAirports.join(', ')}`)

    // Scan each airport
    for (const airport of uniqueAirports) {
      try {
        const deals = await callSerpApiExplore(airport)
        dealsFound += deals.length

        for (const deal of deals) {
          const routeKey = `${deal.origin}-${deal.destination}`
          const cached = await cacheDeal({
            deal_type: 'flight',
            route_key: routeKey,
            provider: 'google_flights',
            date_range: deal.departureDate || getDefaultDate(30),
            deal_data: deal,
            price_amount: deal.price,
            price_currency: deal.currency || 'USD',
          })
          if (cached) dealsCached++
        }

        // Match deals from this airport to users with this home airport
        const matched = await matchDealsToUsers(airport, 'explore')
        usersMatched += matched

        // Rate limit
        await delay(600)
      } catch (err: any) {
        errors.push(`Explore ${airport}: ${err.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`scanExplore: ${err.message}`)
  }

  return { scan_type: 'explore', success: errors.length === 0, deals_found: dealsFound, deals_cached: dealsCached, users_matched: usersMatched, errors, duration_ms: Date.now() - startTime }
}

// ============================================
// SCAN: HERITAGE — Flights to heritage countries
// ============================================

async function scanHeritage(batchSize: number): Promise<ScanResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let dealsFound = 0, dealsCached = 0, usersMatched = 0

  try {
    // Get unique home_airport → heritage_airport combos from DNA
    const { data: dnaRecords } = await supabase
      .from('user_travel_dna')
      .select('home_airport_code, heritage_airport_codes')
      .not('home_airport_code', 'is', null)
      .not('heritage_airport_codes', 'eq', '{}')

    // Build unique route combos
    const routeCombos = new Map<string, { origin: string, dest: string }>()
    for (const dna of dnaRecords || []) {
      if (!dna.heritage_airport_codes || dna.heritage_airport_codes.length === 0) continue
      for (const dest of dna.heritage_airport_codes) {
        const key = `${dna.home_airport_code}-${dest}`
        if (!routeCombos.has(key)) {
          routeCombos.set(key, { origin: dna.home_airport_code, dest })
        }
      }
    }

    const routes = Array.from(routeCombos.values()).slice(0, batchSize)
    console.log(`Heritage scan: ${routes.length} unique routes`)

    // Scan each route with SerpAPI Flights
    for (const route of routes) {
      try {
        const flights = await callSerpApiFlights(route.origin, route.dest)
        dealsFound += flights.length

        if (flights.length > 0) {
          // Cache the best flight
          const best = flights[0] // Already sorted by price
          const routeKey = `${route.origin}-${route.dest}`
          const cached = await cacheDeal({
            deal_type: 'flight',
            route_key: routeKey,
            provider: 'google_flights',
            date_range: getDefaultDate(30),
            deal_data: {
              ...best,
              origin: route.origin,
              destination: route.dest,
              is_heritage: true,
            },
            price_amount: best.price?.amount || best.price || 0,
            price_currency: best.price?.currency || 'USD',
          })
          if (cached) dealsCached++
        }

        await delay(600)
      } catch (err: any) {
        errors.push(`Heritage ${route.origin}-${route.dest}: ${err.message}`)
      }
    }

    // Match heritage deals to users
    usersMatched = await matchHeritageDealsToUsers()
  } catch (err: any) {
    errors.push(`scanHeritage: ${err.message}`)
  }

  return { scan_type: 'heritage', success: errors.length === 0, deals_found: dealsFound, deals_cached: dealsCached, users_matched: usersMatched, errors, duration_ms: Date.now() - startTime }
}

// ============================================
// SCAN: POPULAR ROUTES — Most searched routes
// ============================================

async function scanPopularRoutes(batchSize: number): Promise<ScanResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let dealsFound = 0, dealsCached = 0, usersMatched = 0

  try {
    // Get top searched routes from search_sessions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: sessions } = await supabase
      .from('search_sessions')
      .select('origin_code, destination_code')
      .not('origin_code', 'is', null)
      .not('destination_code', 'is', null)
      .gte('created_at', thirtyDaysAgo)
      .limit(500)

    // Count route frequency
    const routeCounts = new Map<string, { origin: string, dest: string, count: number }>()
    for (const s of sessions || []) {
      const key = `${s.origin_code}-${s.destination_code}`
      const existing = routeCounts.get(key)
      if (existing) {
        existing.count++
      } else {
        routeCounts.set(key, { origin: s.origin_code, dest: s.destination_code, count: 1 })
      }
    }

    // Sort by frequency and take top N
    const topRoutes = Array.from(routeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, batchSize)

    console.log(`Popular routes scan: ${topRoutes.length} routes`)

    for (const route of topRoutes) {
      try {
        const flights = await callSerpApiFlights(route.origin, route.dest)
        dealsFound += flights.length

        if (flights.length > 0) {
          const best = flights[0]
          const routeKey = `${route.origin}-${route.dest}`
          const cached = await cacheDeal({
            deal_type: 'flight',
            route_key: routeKey,
            provider: 'google_flights',
            date_range: getDefaultDate(30),
            deal_data: {
              ...best,
              origin: route.origin,
              destination: route.dest,
              search_count: route.count,
            },
            price_amount: best.price?.amount || best.price || 0,
            price_currency: best.price?.currency || 'USD',
          })
          if (cached) dealsCached++
        }

        await delay(600)
      } catch (err: any) {
        errors.push(`Popular ${route.origin}-${route.dest}: ${err.message}`)
      }
    }

    // Match popular deals to users who searched these routes
    usersMatched = await matchPopularDealsToUsers()
  } catch (err: any) {
    errors.push(`scanPopularRoutes: ${err.message}`)
  }

  return { scan_type: 'popular', success: errors.length === 0, deals_found: dealsFound, deals_cached: dealsCached, users_matched: usersMatched, errors, duration_ms: Date.now() - startTime }
}

// ============================================
// SCAN: HOTEL DEALS — Hotels in top destination cities
// ============================================

async function scanHotelDeals(batchSize: number): Promise<ScanResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let dealsFound = 0, dealsCached = 0, usersMatched = 0

  try {
    // Get top destination cities from DNA
    const { data: dnaRecords } = await supabase
      .from('user_travel_dna')
      .select('top_destinations')

    // Extract unique cities
    const cityCounts = new Map<string, number>()
    for (const dna of dnaRecords || []) {
      const dests = dna.top_destinations || []
      for (const d of dests) {
        if (d.city) {
          const key = d.city.toLowerCase()
          cityCounts.set(key, (cityCounts.get(key) || 0) + d.score)
        }
      }
    }

    // Also add home cities for local weekend deals
    const { data: homeCities } = await supabase
      .from('user_travel_dna')
      .select('home_city')
      .not('home_city', 'is', null)

    for (const hc of homeCities || []) {
      if (hc.home_city) {
        const key = hc.home_city.toLowerCase()
        cityCounts.set(key, (cityCounts.get(key) || 0) + 5) // Boost home cities
      }
    }

    const topCities = Array.from(cityCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, batchSize)
      .map(([city]) => city)

    console.log(`Hotel scan: ${topCities.length} cities: ${topCities.join(', ')}`)

    // Weekend dates for hotel deals
    const checkIn = getNextFriday()
    const checkOut = getNextSunday()

    for (const city of topCities) {
      try {
        const hotels = await callSerpApiHotels(city, checkIn, checkOut)
        dealsFound += hotels.length

        for (const hotel of hotels.slice(0, 3)) { // Top 3 hotels per city
          const routeKey = `hotel-${city}-${hotel.name || hotel.id}`
          const cached = await cacheDeal({
            deal_type: 'hotel',
            route_key: routeKey,
            provider: 'google_hotels',
            date_range: `${checkIn}_${checkOut}`,
            deal_data: {
              ...hotel,
              city,
              check_in: checkIn,
              check_out: checkOut,
            },
            price_amount: hotel.rate_per_night?.extracted_lowest || hotel.price || 0,
            price_currency: 'USD',
          })
          if (cached) dealsCached++
        }

        await delay(600)
      } catch (err: any) {
        errors.push(`Hotels ${city}: ${err.message}`)
      }
    }

    usersMatched = await matchHotelDealsToUsers()
  } catch (err: any) {
    errors.push(`scanHotelDeals: ${err.message}`)
  }

  return { scan_type: 'hotels', success: errors.length === 0, deals_found: dealsFound, deals_cached: dealsCached, users_matched: usersMatched, errors, duration_ms: Date.now() - startTime }
}

// ============================================
// SCAN: EXPERIENCES — Activities & tours via Viator
// ============================================

const VIATOR_BASE = 'https://api.viator.com/partner'

const CITY_TO_VIATOR_ID: Record<string, string> = {
  'new york': '687', 'los angeles': '645', 'san francisco': '651', 'las vegas': '684',
  'chicago': '673', 'miami': '662', 'orlando': '663', 'san diego': '736',
  'seattle': '704', 'houston': '5186', 'atlanta': '784', 'boston': '678',
  'washington': '657', 'denver': '699', 'nashville': '5189', 'new orleans': '675',
  'toronto': '623', 'vancouver': '616', 'montreal': '617', 'cancun': '631',
  'mexico city': '628', 'london': '50648', 'paris': '479', 'rome': '511',
  'barcelona': '562', 'amsterdam': '525', 'berlin': '488', 'prague': '462',
  'vienna': '454', 'lisbon': '538', 'dublin': '503', 'edinburgh': '739',
  'madrid': '564', 'florence': '519', 'venice': '522', 'milan': '4952',
  'munich': '490', 'budapest': '443', 'athens': '496', 'istanbul': '585',
  'nice': '478', 'copenhagen': '550', 'stockholm': '551',
  'cairo': '782', 'marrakech': '5408', 'cape town': '318', 'johannesburg': '314',
  'nairobi': '5280', 'lagos': '23572', 'accra': '5517', 'douala': '51626',
  'casablanca': '22637', 'dar es salaam': '5499', 'addis ababa': '24890',
  'tokyo': '334', 'bangkok': '343', 'singapore': '60449', 'dubai': '828',
  'hong kong': '583', 'seoul': '973', 'taipei': '5262', 'kuala lumpur': '335',
  'bali': '768', 'mumbai': '953', 'delhi': '944', 'hanoi': '351',
  'ho chi minh city': '352',
  'buenos aires': '901', 'rio de janeiro': '712', 'lima': '928',
  'bogota': '5389', 'santiago': '929', 'medellin': '5395',
  'sydney': '357', 'melbourne': '361', 'auckland': '376',
}

async function scanExperienceDeals(batchSize: number): Promise<ScanResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let dealsFound = 0, dealsCached = 0, usersMatched = 0

  const viatorApiKey = Deno.env.get('VIATOR_API_KEY')
  if (!viatorApiKey) {
    return { scan_type: 'experiences', success: false, deals_found: 0, deals_cached: 0, users_matched: 0, errors: ['VIATOR_API_KEY not configured'], duration_ms: Date.now() - startTime }
  }

  try {
    // Get top destination cities from DNA + home cities
    const { data: dnaRecords } = await supabase
      .from('user_travel_dna')
      .select('top_destinations, home_city')

    const cityCounts = new Map<string, number>()
    for (const dna of dnaRecords || []) {
      const dests = dna.top_destinations || []
      for (const d of dests) {
        if (d.city) {
          const key = d.city.toLowerCase()
          cityCounts.set(key, (cityCounts.get(key) || 0) + d.score)
        }
      }
      if (dna.home_city) {
        const key = dna.home_city.toLowerCase()
        cityCounts.set(key, (cityCounts.get(key) || 0) + 3)
      }
    }

    // Filter to cities we have Viator IDs for, then take top N
    const viatorCities = Array.from(cityCounts.entries())
      .filter(([city]) => CITY_TO_VIATOR_ID[city])
      .sort(([, a], [, b]) => b - a)
      .slice(0, batchSize)
      .map(([city]) => city)

    // If no user-driven cities, use a popular fallback set
    if (viatorCities.length === 0) {
      viatorCities.push('new york', 'paris', 'london', 'tokyo', 'barcelona',
        'rome', 'dubai', 'bangkok', 'cancun', 'cape town')
    }

    console.log(`Experience scan: ${viatorCities.length} cities: ${viatorCities.join(', ')}`)

    const viatorHeaders = {
      'exp-api-key': viatorApiKey,
      'Accept': 'application/json;version=2.0',
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US',
    }

    for (const city of viatorCities) {
      try {
        const destId = CITY_TO_VIATOR_ID[city]
        if (!destId) continue

        const searchBody = {
          filtering: { destination: destId },
          sorting: { sort: 'DEFAULT' },
          pagination: { start: 1, count: 5 },
          currency: 'USD',
        }

        const resp = await fetch(`${VIATOR_BASE}/products/search`, {
          method: 'POST',
          headers: viatorHeaders,
          body: JSON.stringify(searchBody),
        })

        if (!resp.ok) {
          errors.push(`Viator ${city}: HTTP ${resp.status}`)
          continue
        }

        const data = await resp.json()
        const products = data.products || []
        dealsFound += products.length

        for (const product of products.slice(0, 3)) { // Top 3 per city
          if (!product.productCode) continue

          const price = product.pricing?.summary?.fromPrice || 0
          if (price <= 0) continue

          const originalPrice = product.pricing?.summary?.fromPriceBeforeDiscount || null
          const discountPercent = originalPrice && price < originalPrice
            ? Math.round((1 - price / originalPrice) * 100) : null

          const durationMinutes = product.duration?.fixedDurationInMinutes ||
            product.duration?.variableDurationFromMinutes || 120

          // Images
          const images = (product.images || []).map((img: any) => {
            const variants = img.variants || []
            const best = variants.find((v: any) => v.width === 720) ||
                         variants.find((v: any) => v.width >= 480) ||
                         variants[variants.length - 1] || {}
            return { url: best.url || '', caption: img.caption || '' }
          }).filter((img: any) => img.url)

          const heroImage = images[0]?.url || ''

          const rating = product.reviews?.combinedAverageRating || 0
          const reviewCount = product.reviews?.totalReviews || 0
          const flags = product.flags || []
          const bookingUrl = product.productUrl || `https://www.viator.com/tours/${product.productCode}`

          const routeKey = `exp-${city}-${product.productCode}`
          const cached = await cacheDeal({
            deal_type: 'experience',
            route_key: routeKey,
            provider: 'viator',
            date_range: getDefaultDate(14),
            deal_data: {
              title: product.title || 'Experience',
              description: product.description || '',
              shortDescription: (product.description || '').substring(0, 200),
              productCode: product.productCode,
              productUrl: bookingUrl,
              city,
              country: '',
              images,
              heroImage,
              duration: {
                value: durationMinutes >= 60 ? Math.round(durationMinutes / 60) : durationMinutes,
                unit: durationMinutes >= 60 ? 'hours' : 'minutes',
                formatted: durationMinutes >= 1440
                  ? `${Math.round(durationMinutes / 1440)} day${Math.round(durationMinutes / 1440) > 1 ? 's' : ''}`
                  : durationMinutes >= 60 ? `${Math.round(durationMinutes / 60)}h` : `${durationMinutes}min`,
              },
              rating: { score: Math.round(rating * 10) / 10, maxScore: 5, reviewCount },
              highlights: [],
              whatsIncluded: [],
              languages: ['English'],
              maxGroupSize: null,
              freeCancellation: flags.includes('FREE_CANCELLATION'),
              instantConfirmation: (product.confirmationType || '').includes('INSTANT'),
              tags: flags,
              link: bookingUrl,
              originalPrice,
              discountPercent,
            },
            price_amount: price,
            price_currency: product.pricing?.currency || 'USD',
          })
          if (cached) dealsCached++
        }

        await delay(500) // Viator rate limit
      } catch (err: any) {
        errors.push(`Experiences ${city}: ${err.message}`)
      }
    }

    usersMatched = await matchExperienceDealsToUsers()
  } catch (err: any) {
    errors.push(`scanExperienceDeals: ${err.message}`)
  }

  return { scan_type: 'experiences', success: errors.length === 0, deals_found: dealsFound, deals_cached: dealsCached, users_matched: usersMatched, errors, duration_ms: Date.now() - startTime }
}

// ============================================
// SCAN: PRICE ALERTS — Check active user alerts
// ============================================

async function scanPriceAlerts(batchSize: number): Promise<ScanResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let dealsFound = 0, dealsCached = 0, usersMatched = 0

  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${sixHoursAgo}`)
      .limit(batchSize)

    console.log(`Price alerts scan: ${(alerts || []).length} alerts`)

    for (const alert of alerts || []) {
      try {
        const params = alert.search_params || {}
        let currentPrice = 0

        if (alert.category === 'flight' || alert.category === 'flights') {
          const origin = params.origin_code || params.origin
          const dest = params.destination_code || params.destination
          if (origin && dest) {
            const flights = await callSerpApiFlights(origin, dest)
            if (flights.length > 0) {
              currentPrice = flights[0].price?.amount || flights[0].price || 0
              dealsFound++
            }
          }
        } else if (alert.category === 'hotel' || alert.category === 'hotels') {
          const city = params.destination_city || params.city
          const checkIn = params.check_in || getDefaultDate(30)
          const checkOut = params.check_out || getDefaultDate(31)
          if (city) {
            const hotels = await callSerpApiHotels(city, checkIn, checkOut)
            if (hotels.length > 0) {
              currentPrice = hotels[0].rate_per_night?.extracted_lowest || hotels[0].price || 0
              dealsFound++
            }
          }
        }

        if (currentPrice > 0) {
          // Update alert
          const updateData: any = {
            current_price: currentPrice,
            price_checks_count: (alert.price_checks_count || 0) + 1,
            last_checked_at: new Date().toISOString(),
          }
          if (currentPrice < (alert.lowest_seen_price || Infinity)) {
            updateData.lowest_seen_price = currentPrice
          }
          if (currentPrice > (alert.highest_seen_price || 0)) {
            updateData.highest_seen_price = currentPrice
          }

          // Check if alert should trigger
          const shouldNotify = checkAlertTrigger(alert, currentPrice)
          if (shouldNotify) {
            updateData.triggered = true
            updateData.triggered_at = new Date().toISOString()
            // Queue notification
            await queueDealNotification(alert.user_id, {
              notification_type: 'price_alert',
              title: `Price Alert: $${currentPrice}`,
              body: `Your price alert triggered! Current price is $${currentPrice} (target: $${alert.target_price})`,
              data: { alert_id: alert.id, current_price: currentPrice, target_price: alert.target_price },
              priority: 1,
            })
            usersMatched++
          }

          await supabase.from('price_alerts').update(updateData).eq('id', alert.id)
          dealsCached++
        }

        await delay(600)
      } catch (err: any) {
        errors.push(`Alert ${alert.id}: ${err.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`scanPriceAlerts: ${err.message}`)
  }

  return { scan_type: 'alerts', success: errors.length === 0, deals_found: dealsFound, deals_cached: dealsCached, users_matched: usersMatched, errors, duration_ms: Date.now() - startTime }
}

// ============================================
// SERPAPI CALLERS
// ============================================

async function callSerpApiExplore(airport: string): Promise<any[]> {
  const params = new URLSearchParams({
    engine: 'google_flights',
    type: '2',
    departure_id: airport,
    currency: 'USD',
    hl: 'en',
    api_key: SERPAPI_KEY,
  })

  const resp = await fetch(`${SERPAPI_BASE}?${params}`)
  if (!resp.ok) throw new Error(`SerpAPI Explore HTTP ${resp.status}`)

  const data = await resp.json()
  if (data.error) throw new Error(`SerpAPI: ${data.error}`)

  const allResults = [...(data.best_flights || []), ...(data.other_flights || [])]

  return allResults.map((result: any, idx: number) => {
    const flights = result.flights || []
    const lastFlight = flights[flights.length - 1]
    const firstFlight = flights[0]
    return {
      id: `explore-${airport}-${lastFlight?.arrival_airport?.id || idx}`,
      origin: airport,
      destination: lastFlight?.arrival_airport?.id || '',
      destinationName: lastFlight?.arrival_airport?.name || '',
      price: result.price || 0,
      currency: 'USD',
      tripType: 'round_trip',
      departureDate: firstFlight?.departure_airport?.time?.split(' ')[0],
      airline: firstFlight?.airline,
      airlineLogo: firstFlight?.airline_logo,
      totalStops: flights.length - 1,
      totalDuration: result.total_duration,
    }
  }).filter((d: any) => d.price > 0 && d.destination)
}

async function callSerpApiFlights(origin: string, destination: string): Promise<any[]> {
  const departDate = getDefaultDate(30)

  const params = new URLSearchParams({
    engine: 'google_flights',
    type: '2',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departDate,
    currency: 'USD',
    hl: 'en',
    adults: '1',
    api_key: SERPAPI_KEY,
  })

  const resp = await fetch(`${SERPAPI_BASE}?${params}`)
  if (!resp.ok) throw new Error(`SerpAPI Flights HTTP ${resp.status}`)

  const data = await resp.json()
  if (data.error) throw new Error(`SerpAPI: ${data.error}`)

  const allResults = [...(data.best_flights || []), ...(data.other_flights || [])]

  return allResults.map((result: any) => {
    const flights = result.flights || []
    const firstFlight = flights[0]
    const lastFlight = flights[flights.length - 1]
    return {
      id: `flight-${origin}-${destination}-${result.price}`,
      price: { amount: result.price || 0, currency: 'USD', formatted: `$${result.price}` },
      origin,
      destination,
      airline: firstFlight?.airline,
      airlineLogo: firstFlight?.airline_logo,
      departureTime: firstFlight?.departure_airport?.time,
      arrivalTime: lastFlight?.arrival_airport?.time,
      totalStops: flights.length - 1,
      totalDuration: result.total_duration,
      flights,
    }
  }).filter((f: any) => f.price.amount > 0)
    .sort((a: any, b: any) => a.price.amount - b.price.amount)
}

async function callSerpApiHotels(city: string, checkIn: string, checkOut: string): Promise<any[]> {
  const params = new URLSearchParams({
    engine: 'google_hotels',
    q: `hotels in ${city}`,
    check_in_date: checkIn,
    check_out_date: checkOut,
    currency: 'USD',
    hl: 'en',
    adults: '2',
    api_key: SERPAPI_KEY,
  })

  const resp = await fetch(`${SERPAPI_BASE}?${params}`)
  if (!resp.ok) throw new Error(`SerpAPI Hotels HTTP ${resp.status}`)

  const data = await resp.json()
  if (data.error) throw new Error(`SerpAPI: ${data.error}`)

  return (data.properties || []).map((hotel: any) => ({
    id: `hotel-${city}-${hotel.name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`,
    name: hotel.name,
    description: hotel.description,
    type: hotel.type,
    starRating: hotel.overall_rating,
    reviewCount: hotel.reviews,
    rate_per_night: hotel.rate_per_night,
    price: hotel.rate_per_night?.extracted_lowest || 0,
    total_rate: hotel.total_rate,
    images: hotel.images,
    heroImage: hotel.images?.[0]?.thumbnail,
    amenities: hotel.amenities,
    link: hotel.link,
    neighborhood: hotel.neighborhood,
    gps_coordinates: hotel.gps_coordinates,
  })).filter((h: any) => h.price > 0)
}

// ============================================
// DEAL CACHING — Store in deal_cache + price_history
// ============================================

async function cacheDeal(deal: {
  deal_type: string
  route_key: string
  provider: string
  date_range: string
  deal_data: any
  price_amount: number
  price_currency: string
}): Promise<boolean> {
  if (deal.price_amount <= 0) return false

  try {
    // Get price history for scoring
    const { data: history } = await supabase
      .from('price_history')
      .select('price_amount')
      .eq('route_key', deal.route_key)
      .eq('deal_type', deal.deal_type)
      .order('recorded_at', { ascending: false })
      .limit(30)

    const scored = scoreDeal(deal.price_amount, (history || []).map(h => h.price_amount))

    // Upsert deal_cache
    await supabase.from('deal_cache').upsert({
      deal_type: deal.deal_type,
      route_key: deal.route_key,
      provider: deal.provider,
      date_range: deal.date_range,
      deal_data: deal.deal_data,
      price_amount: deal.price_amount,
      price_currency: deal.price_currency,
      deal_score: scored.score,
      deal_badges: scored.badges,
      scanned_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'deal_type,route_key,provider,date_range', ignoreDuplicates: false })

    // Record price history
    await supabase.from('price_history').insert({
      route_key: deal.route_key,
      deal_type: deal.deal_type,
      provider: deal.provider,
      date_range: deal.date_range,
      price_amount: deal.price_amount,
      price_currency: deal.price_currency,
    })

    return true
  } catch (err: any) {
    console.error(`Cache deal ${deal.route_key}:`, err.message)
    return false
  }
}

// ============================================
// DEAL SCORING
// ============================================

function scoreDeal(currentPrice: number, historicalPrices: number[]): { score: number; badges: string[] } {
  if (historicalPrices.length === 0) {
    return { score: 50, badges: ['new'] }
  }

  const sorted = [...historicalPrices].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const lowest = sorted[0]

  const pctBelowMedian = (median - currentPrice) / median
  const pctFromLow = lowest > 0 ? (currentPrice - lowest) / lowest : 1

  // Price drop score (0-100, weight 45%)
  let priceDropScore = 10
  if (pctBelowMedian >= 0.40) priceDropScore = 100
  else if (pctBelowMedian >= 0.25) priceDropScore = 80
  else if (pctBelowMedian >= 0.15) priceDropScore = 60
  else if (pctBelowMedian >= 0.05) priceDropScore = 30

  // Historical low score (0-100, weight 35%)
  let historicalLowScore = 10
  if (currentPrice <= lowest) historicalLowScore = 100
  else if (pctFromLow <= 0.05) historicalLowScore = 90
  else if (pctFromLow <= 0.10) historicalLowScore = 70
  else if (pctFromLow <= 0.20) historicalLowScore = 40

  // Freshness (always 100 for new scans, weight 20%)
  const freshnessScore = 100

  const score = Math.round(priceDropScore * 0.45 + historicalLowScore * 0.35 + freshnessScore * 0.20)

  // Badges
  const badges: string[] = []
  if (currentPrice <= lowest) badges.push('record_low')
  else if (pctFromLow <= 0.10) badges.push('near_record_low')
  if (pctBelowMedian >= 0.25) badges.push('great_deal')
  else if (pctBelowMedian >= 0.15) badges.push('good_deal')
  else if (pctBelowMedian >= 0.05) badges.push('price_drop')

  return { score: Math.max(0, Math.min(100, score)), badges }
}

// ============================================
// USER MATCHING — Match deals to users via DNA
// ============================================

async function matchDealsToUsers(homeAirport: string, _scanType: string): Promise<number> {
  let matched = 0

  try {
    // Get recent deals from this airport
    const { data: deals } = await supabase
      .from('deal_cache')
      .select('*')
      .eq('deal_type', 'flight')
      .like('route_key', `${homeAirport}-%`)
      .gte('scanned_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order('deal_score', { ascending: false })
      .limit(20)

    if (!deals || deals.length === 0) return 0

    // Get users with this home airport
    const { data: users } = await supabase
      .from('user_travel_dna')
      .select('user_id, top_destinations, budget_tier, max_flight_price, interest_vector, heritage_airport_codes, preferred_currency')
      .eq('home_airport_code', homeAirport)

    if (!users || users.length === 0) return 0

    for (const user of users) {
      for (const deal of deals) {
        const relevance = calculateRelevance(deal, user)
        if (relevance.score < 0.2) continue // Skip irrelevant deals

        const channel = relevance.score >= 0.8 ? 'push' : relevance.score >= 0.5 ? 'feed' : 'digest'

        await upsertDealMatch(user.user_id, deal, relevance, channel)
        matched++
      }
    }
  } catch (err: any) {
    console.error(`matchDealsToUsers ${homeAirport}:`, err.message)
  }

  return matched
}

async function matchHeritageDealsToUsers(): Promise<number> {
  let matched = 0

  try {
    // Get heritage deals (cached in last 2 hours)
    const { data: deals } = await supabase
      .from('deal_cache')
      .select('*')
      .eq('deal_type', 'flight')
      .gte('scanned_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())

    if (!deals || deals.length === 0) return 0

    // Get all users with heritage airports
    const { data: users } = await supabase
      .from('user_travel_dna')
      .select('user_id, home_airport_code, heritage_airport_codes, max_flight_price, budget_tier, interest_vector, top_destinations, preferred_currency')
      .not('heritage_airport_codes', 'eq', '{}')

    if (!users || users.length === 0) return 0

    for (const user of users) {
      for (const deal of deals) {
        // Check if this deal is from user's home airport to a heritage airport
        const [origin, dest] = deal.route_key.split('-')
        if (origin !== user.home_airport_code) continue
        if (!user.heritage_airport_codes?.includes(dest)) continue

        const relevance = calculateRelevance(deal, user, true)
        const channel = relevance.score >= 0.7 ? 'push' : 'feed'

        await upsertDealMatch(user.user_id, deal, relevance, channel)
        matched++
      }
    }
  } catch (err: any) {
    console.error('matchHeritageDealsToUsers:', err.message)
  }

  return matched
}

async function matchPopularDealsToUsers(): Promise<number> {
  let matched = 0

  try {
    const { data: deals } = await supabase
      .from('deal_cache')
      .select('*')
      .eq('deal_type', 'flight')
      .gte('scanned_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .gte('deal_score', 40)
      .order('deal_score', { ascending: false })
      .limit(50)

    if (!deals || deals.length === 0) return 0

    // Get all users
    const { data: users } = await supabase
      .from('user_travel_dna')
      .select('user_id, home_airport_code, max_flight_price, budget_tier, interest_vector, top_destinations, heritage_airport_codes, preferred_currency')

    if (!users || users.length === 0) return 0

    for (const user of users) {
      for (const deal of deals) {
        const [origin] = deal.route_key.split('-')
        // Only match if deal departs from user's home airport
        if (origin !== user.home_airport_code) continue

        const relevance = calculateRelevance(deal, user)
        if (relevance.score < 0.3) continue

        const channel = relevance.score >= 0.8 ? 'push' : relevance.score >= 0.5 ? 'feed' : 'digest'
        await upsertDealMatch(user.user_id, deal, relevance, channel)
        matched++
      }
    }
  } catch (err: any) {
    console.error('matchPopularDealsToUsers:', err.message)
  }

  return matched
}

async function matchHotelDealsToUsers(): Promise<number> {
  let matched = 0

  try {
    const { data: deals } = await supabase
      .from('deal_cache')
      .select('*')
      .eq('deal_type', 'hotel')
      .gte('scanned_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order('deal_score', { ascending: false })
      .limit(50)

    if (!deals || deals.length === 0) return 0

    const { data: users } = await supabase
      .from('user_travel_dna')
      .select('user_id, home_city, max_hotel_nightly, budget_tier, interest_vector, top_destinations, preferred_currency')

    if (!users || users.length === 0) return 0

    for (const user of users) {
      for (const deal of deals) {
        const city = deal.deal_data?.city || ''
        const isHomeCity = city.toLowerCase() === (user.home_city || '').toLowerCase()
        const isTopDest = (user.top_destinations || []).some((d: any) =>
          (d.city || '').toLowerCase() === city.toLowerCase()
        )

        if (!isHomeCity && !isTopDest) continue

        const priceRatio = user.max_hotel_nightly ? deal.price_amount / user.max_hotel_nightly : 0.7
        let priceScore = priceRatio <= 0.5 ? 1.0 : priceRatio <= 0.75 ? 0.9 : priceRatio <= 1.0 ? 0.7 : priceRatio <= 1.25 ? 0.4 : 0.1

        const destScore = isTopDest ? 0.9 : isHomeCity ? 0.7 : 0.3
        const qualityScore = (deal.deal_score || 50) / 100

        const score = destScore * 0.35 + priceScore * 0.30 + qualityScore * 0.20 + (isHomeCity ? 0.15 : 0)
        const reasons: string[] = []
        if (isHomeCity) reasons.push('In your city')
        if (isTopDest) reasons.push('Destination you searched')
        if (priceScore >= 0.9) reasons.push('Great price')
        if (qualityScore >= 0.7) reasons.push((deal.deal_badges || [])[0] || 'Good deal')

        const channel = score >= 0.7 ? 'push' : score >= 0.4 ? 'feed' : 'digest'

        await upsertDealMatch(user.user_id, deal, { score: Math.round(score * 100) / 100, reasons }, channel)
        matched++
      }
    }
  } catch (err: any) {
    console.error('matchHotelDealsToUsers:', err.message)
  }

  return matched
}

async function matchExperienceDealsToUsers(): Promise<number> {
  let matched = 0

  try {
    const { data: deals } = await supabase
      .from('deal_cache')
      .select('*')
      .eq('deal_type', 'experience')
      .gte('scanned_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('deal_score', { ascending: false })
      .limit(50)

    if (!deals || deals.length === 0) return 0

    const { data: users } = await supabase
      .from('user_travel_dna')
      .select('user_id, home_city, budget_tier, interest_vector, top_destinations, preferred_currency')

    if (!users || users.length === 0) return 0

    for (const user of users) {
      for (const deal of deals) {
        const city = deal.deal_data?.city || ''
        const isHomeCity = city.toLowerCase() === (user.home_city || '').toLowerCase()
        const isTopDest = (user.top_destinations || []).some((d: any) =>
          (d.city || '').toLowerCase() === city.toLowerCase()
        )

        // Experiences are broadly relevant — match if city is in user's orbit or always include a few
        if (!isHomeCity && !isTopDest) {
          // Still include highly-rated experiences as discovery
          const rating = deal.deal_data?.rating?.score || 0
          if (rating < 4.0) continue
        }

        // Score the experience
        const destScore = isTopDest ? 0.9 : isHomeCity ? 0.7 : 0.3
        const qualityScore = (deal.deal_score || 50) / 100
        const ratingScore = Math.min((deal.deal_data?.rating?.score || 0) / 5, 1.0)

        // Interest match — check if user interests overlap with experience tags
        let interestScore = 0.3
        const userInterests = (user.interest_vector || []).map((i: any) => (i.tag || '').toLowerCase())
        const dealTags = (deal.deal_data?.tags || []).map((t: string) => t.toLowerCase())
        if (userInterests.some((i: string) => dealTags.includes(i) || i.includes('experience') || i.includes('tour'))) {
          interestScore = 0.8
        }

        const score = destScore * 0.30 + ratingScore * 0.25 + qualityScore * 0.15 + interestScore * 0.20 + (isHomeCity ? 0.10 : 0)

        const reasons: string[] = []
        if (isHomeCity) reasons.push('In your city')
        if (isTopDest) reasons.push('Destination you explored')
        if (ratingScore >= 0.8) reasons.push(`${deal.deal_data?.rating?.score}★ rated`)
        if (deal.deal_data?.freeCancellation) reasons.push('Free cancellation')

        const channel = score >= 0.7 ? 'push' : score >= 0.4 ? 'feed' : 'digest'

        await upsertDealMatch(user.user_id, deal, { score: Math.round(score * 100) / 100, reasons: reasons.slice(0, 3) }, channel)
        matched++
      }
    }
  } catch (err: any) {
    console.error('matchExperienceDealsToUsers:', err.message)
  }

  return matched
}

// ============================================
// RELEVANCE SCORING
// ============================================

function calculateRelevance(
  deal: any, userDna: any, isHeritage = false
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  const [, dest] = (deal.route_key || '').split('-')

  // 1. Destination match (30%)
  let destScore = 0.2
  const topDests = (userDna.top_destinations || []).map((d: any) => (d.code || '').toLowerCase())
  if (topDests.includes((dest || '').toLowerCase())) {
    destScore = 1.0
    reasons.push('Matches your search history')
  } else if (isHeritage) {
    destScore = 0.9
    reasons.push('Heritage destination')
  } else if ((userDna.heritage_airport_codes || []).includes(dest)) {
    destScore = 0.9
    reasons.push('Heritage destination')
  }

  // 2. Price match (25%)
  let priceScore = 0.5
  const maxPrice = userDna.max_flight_price || 800
  const price = deal.price_amount || 0
  const priceRatio = price / maxPrice
  if (priceRatio <= 0.5) { priceScore = 1.0; reasons.push('Well under your budget') }
  else if (priceRatio <= 0.75) priceScore = 0.9
  else if (priceRatio <= 1.0) priceScore = 0.7
  else if (priceRatio <= 1.25) priceScore = 0.4
  else priceScore = 0.1

  // 3. Deal quality (10%)
  const qualityScore = (deal.deal_score || 50) / 100
  if (qualityScore >= 0.8) reasons.push((deal.deal_badges || [])[0] || 'Great deal')

  // 4. Heritage bonus (10%)
  const heritageScore = isHeritage ? 1.0 : (userDna.heritage_airport_codes || []).includes(dest) ? 0.9 : 0.0

  // 5. Timing (10%) — simplified for now, always 0.5
  const timingScore = 0.5

  // 6. Interest match (15%) — simplified, check if destination tags overlap
  const interestScore = 0.4 // Default moderate

  const score = destScore * 0.30 + priceScore * 0.25 + interestScore * 0.15 +
    heritageScore * 0.10 + timingScore * 0.10 + qualityScore * 0.10

  return { score: Math.round(score * 100) / 100, reasons: reasons.slice(0, 3) }
}

// ============================================
// DEAL MATCH UPSERT
// ============================================

async function upsertDealMatch(
  userId: string, deal: any, relevance: { score: number; reasons: string[] }, channel: string
) {
  try {
    const dealData = deal.deal_data || {}
    let title: string
    if (deal.deal_type === 'hotel') {
      title = `${dealData.name || 'Hotel'} $${deal.price_amount}/night`
    } else if (deal.deal_type === 'experience') {
      title = dealData.title || `Experience $${deal.price_amount}`
    } else {
      title = `${deal.route_key.replace('-', ' → ')} $${deal.price_amount}`
    }

    const subtitle = relevance.reasons.join(' • ')

    await supabase.from('user_deal_matches').upsert({
      user_id: userId,
      deal_cache_id: deal.id,
      relevance_score: relevance.score,
      score_breakdown: { reasons: relevance.reasons },
      match_reasons: relevance.reasons,
      deal_type: deal.deal_type,
      deal_title: title,
      deal_subtitle: subtitle || null,
      deal_image_url: dealData.heroImage || dealData.airlineLogo || null,
      price_amount: deal.price_amount,
      price_currency: deal.price_currency || 'USD',
      original_price: null,
      discount_percent: null,
      deal_badges: deal.deal_badges || [],
      booking_url: dealData.link || null,
      provider: deal.provider,
      delivery_channel: channel,
      expires_at: deal.expires_at,
    }, { onConflict: 'user_id,deal_cache_id' })

    // Queue push notification for high-relevance matches
    if (channel === 'push') {
      await queueDealNotification(userId, {
        notification_type: 'push',
        title: deal.deal_type === 'hotel' ? `🏨 ${title}` : `✈️ ${title}`,
        body: subtitle,
        data: { deal_id: deal.id, deal_type: deal.deal_type, route_key: deal.route_key },
        priority: relevance.score >= 0.9 ? 1 : 3,
        image_url: dealData.heroImage || null,
      })
    }
  } catch (err: any) {
    // Ignore duplicate conflicts
    if (!err.message?.includes('duplicate')) {
      console.error(`upsertDealMatch ${userId}:`, err.message)
    }
  }
}

// ============================================
// NOTIFICATION QUEUEING
// ============================================

async function queueDealNotification(userId: string, notification: {
  notification_type: string
  title: string
  body: string
  data?: any
  priority?: number
  image_url?: string
}) {
  try {
    // Check throttle: max 3 per day
    const { data: dna } = await supabase
      .from('user_travel_dna')
      .select('notifications_sent_today, max_daily_notifications, last_notification_at')
      .eq('user_id', userId)
      .single()

    if (dna) {
      const maxDaily = dna.max_daily_notifications || 3
      const sentToday = dna.notifications_sent_today || 0
      if (sentToday >= maxDaily && notification.priority !== 1) return // Skip unless critical

      // Min 2h gap between notifications
      if (dna.last_notification_at) {
        const hoursSince = (Date.now() - new Date(dna.last_notification_at).getTime()) / (1000 * 60 * 60)
        if (hoursSince < 2 && notification.priority !== 1) return
      }
    }

    await supabase.from('deal_notifications').insert({
      user_id: userId,
      notification_type: notification.notification_type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      image_url: notification.image_url,
      priority: notification.priority || 5,
      status: 'pending',
      scheduled_for: new Date().toISOString(),
    })

    // Increment notification counter
    await supabase.rpc('increment_notification_count', { target_user_id: userId }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase.from('user_travel_dna').update({
        notifications_sent_today: (dna?.notifications_sent_today || 0) + 1,
        last_notification_at: new Date().toISOString(),
      }).eq('user_id', userId)
    })
  } catch (err: any) {
    console.error(`queueNotification ${userId}:`, err.message)
  }
}

function checkAlertTrigger(alert: any, currentPrice: number): boolean {
  if (alert.last_notified_at) {
    const hoursSince = (Date.now() - new Date(alert.last_notified_at).getTime()) / (1000 * 60 * 60)
    if (hoursSince < 24) return false
  }

  switch (alert.alert_type) {
    case 'target_price':
      return alert.target_price != null && currentPrice <= alert.target_price
    case 'price_drop': {
      if (!alert.current_price) return false
      const dropPct = ((alert.current_price - currentPrice) / alert.current_price) * 100
      return dropPct >= 10
    }
    case 'any_change': {
      if (!alert.current_price) return false
      const changePct = Math.abs((alert.current_price - currentPrice) / alert.current_price) * 100
      return changePct >= 5
    }
    default:
      return false
  }
}

// ============================================
// HELPERS
// ============================================

function getDefaultDate(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

function getNextFriday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day <= 5 ? 5 - day : 12 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getNextSunday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + diff + 7) // Next week Sunday
  return d.toISOString().split('T')[0]
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
