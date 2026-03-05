/**
 * SERPAPI GOOGLE TRAVEL EXPLORE ADAPTER
 * 
 * Uses SerpAPI to scrape Google Travel Explore for deal discovery.
 * This is the "AirClub secret weapon" — discovers the cheapest flights
 * from a user's home airport to anywhere in the world.
 * 
 * API Docs: https://serpapi.com/google-flights-explore-api
 * 
 * Used by:
 * - deal-scanner edge function (cron job)
 * - Homepage "Hot Deals" section
 * - "Explore" / "Where can I go?" feature
 * 
 * NOT used for regular user-initiated flight search (use serpapi-flights.ts for that).
 */

interface ExploreParams {
  departureAirport: string   // IATA code (e.g., "JFK")
  currency?: string
  travelClass?: number       // 1=economy, 2=premium, 3=business, 4=first
  maxStops?: number          // 0=direct only, 1=one stop, etc.
  tripType?: 'round_trip' | 'one_way'
  outboundDateFrom?: string  // YYYY-MM-DD — start of date range
  outboundDateTo?: string    // YYYY-MM-DD — end of date range
  returnDateFrom?: string    // YYYY-MM-DD
  returnDateTo?: string      // YYYY-MM-DD
  limit?: number
}

interface DiscoveredDeal {
  id: string
  origin: string              // IATA code
  destination: string         // IATA code
  destinationName: string     // "Athens, Greece"
  destinationImage?: string   // Photo URL from Google
  price: number               // Cheapest found price
  currency: string
  formattedPrice: string
  tripType: string
  departureDate?: string
  returnDate?: string
  airline?: string
  airlineLogo?: string
  countryCode?: string
  discoveredAt: string        // ISO timestamp
}

const SERPAPI_BASE = 'https://serpapi.com/search.json'

/**
 * Discover cheapest flights from a departure airport to anywhere.
 * Returns a list of destinations sorted by price (cheapest first).
 */
export async function discoverDeals(params: ExploreParams): Promise<DiscoveredDeal[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY')
  
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured — cannot discover deals')
  }
  
  if (!params.departureAirport) {
    throw new Error('Missing departureAirport for deal discovery')
  }
  
  // Build SerpAPI Google Travel Explore query
  const searchParams = new URLSearchParams({
    engine: 'google_flights',
    type: '2', // explore mode uses type 2 with no arrival_id
    departure_id: params.departureAirport,
    currency: params.currency || 'USD',
    hl: 'en',
    api_key: apiKey,
  })
  
  // Travel class
  if (params.travelClass) {
    searchParams.set('travel_class', String(params.travelClass))
  }
  
  // Max stops
  if (params.maxStops !== undefined) {
    searchParams.set('stops', String(params.maxStops))
  }
  
  // Date range filters
  if (params.outboundDateFrom) {
    searchParams.set('outbound_date', params.outboundDateFrom)
  }
  if (params.returnDateFrom) {
    searchParams.set('return_date', params.returnDateFrom)
  }
  
  const url = `${SERPAPI_BASE}?${searchParams.toString()}`
  console.log(`SerpAPI Travel Explore: departure=${params.departureAirport}`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`SerpAPI Explore failed: ${response.status}`, errorText.substring(0, 300))
    throw new Error(`SerpAPI Explore failed: HTTP ${response.status} — ${errorText.substring(0, 200)}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    console.error('SerpAPI error:', data.error)
    throw new Error(`SerpAPI error: ${data.error}`)
  }
  
  // Google Travel Explore returns flights in different sections
  // best_flights, other_flights, or sometimes a "flights" array for explore
  const flights = data.best_flights || data.other_flights || data.flights || []
  const allResults = [...(data.best_flights || []), ...(data.other_flights || [])]
  
  console.log(`SerpAPI Explore returned ${allResults.length} destination deals from ${params.departureAirport}`)
  
  const limit = params.limit || 30
  return normalizeExploreResults(allResults.slice(0, limit), params)
}

function normalizeExploreResults(results: any[], params: ExploreParams): DiscoveredDeal[] {
  const currency = params.currency || 'USD'
  const now = new Date().toISOString()
  
  return results
    .filter((r: any) => r && (r.price || r.price === 0))
    .map((result: any, index: number) => {
      // Extract destination info
      const flights = result.flights || []
      const lastFlight = flights[flights.length - 1]
      const firstFlight = flights[0]
      
      const destAirport = lastFlight?.arrival_airport?.id || lastFlight?.arrival_airport?.name || ''
      const destName = lastFlight?.arrival_airport?.name || destAirport
      
      return {
        id: `explore-${params.departureAirport}-${destAirport}-${index}`,
        origin: params.departureAirport,
        destination: destAirport,
        destinationName: destName,
        destinationImage: undefined, // Not always available in flight results
        price: result.price || 0,
        currency,
        formattedPrice: formatPrice(result.price || 0, currency),
        tripType: params.tripType || 'round_trip',
        departureDate: firstFlight?.departure_airport?.time?.split(' ')[0],
        returnDate: undefined, // Return info may be in a separate group
        airline: firstFlight?.airline,
        airlineLogo: firstFlight?.airline_logo,
        countryCode: undefined,
        discoveredAt: now,
      }
    })
    .sort((a, b) => a.price - b.price)
}

/**
 * Discover deals for multiple departure airports (batch).
 * Useful for scanning deals for all users' home airports.
 * Rate-limited: processes sequentially with a small delay.
 */
export async function discoverDealsForAirports(
  airports: string[],
  options?: { currency?: string; limit?: number; delayMs?: number }
): Promise<Map<string, DiscoveredDeal[]>> {
  const results = new Map<string, DiscoveredDeal[]>()
  const delayMs = options?.delayMs || 500 // Small delay between requests
  
  for (const airport of airports) {
    try {
      const deals = await discoverDeals({
        departureAirport: airport,
        currency: options?.currency || 'USD',
        limit: options?.limit || 20,
      })
      results.set(airport, deals)
      console.log(`Found ${deals.length} deals from ${airport}`)
      
      // Small delay to be nice to the API
      if (delayMs > 0 && airports.indexOf(airport) < airports.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`Failed to discover deals from ${airport}:`, error)
      results.set(airport, [])
    }
  }
  
  return results
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
  const apiKey = Deno.env.get('SERPAPI_KEY')
  return !!apiKey
}
