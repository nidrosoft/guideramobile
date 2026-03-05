/**
 * SERPAPI GOOGLE FLIGHTS ADAPTER
 * 
 * Uses SerpAPI to scrape Google Flights for flight search results.
 * Primary flight search provider (replacing Amadeus by July 2026).
 * 
 * API Docs: https://serpapi.com/google-flights-api
 * 
 * Features:
 * - Structured flight data from Google Flights
 * - price_insights (low/typical/high assessment from Google)
 * - booking_token for getting booking options
 * - Airline logos included
 */

interface FlightSearchParams {
  segments: Array<{
    origin: string
    destination: string
    departureDate: string
  }>
  travelers: {
    adults: number
    children?: number
    infants?: number
  }
  cabinClass?: string
  currency?: string
  directOnly?: boolean
  limit?: number
  tripType?: string
}

interface NormalizedFlight {
  id: string
  type: 'flight'
  provider: { code: string; name: string }
  price: { amount: number; currency: string; formatted: string }
  tripType: string
  outbound: FlightLeg
  inbound?: FlightLeg
  totalStops: number
  totalDurationMinutes: number
  bookingUrl?: string
  fareRules?: string[]
  baggageAllowance?: { cabin: string; checked: string }
  refundable?: boolean
  changeable?: boolean
  priceInsights?: {
    priceLevel: string
    lowestPrice?: number
    typicalPriceRange?: [number, number]
  }
  airlineLogo?: string
  carbonEmissions?: { thisFlight: number; typicalFlight: number; differencePercent: number }
}

interface FlightLeg {
  departure: { airport: string; terminal?: string; time: string }
  arrival: { airport: string; terminal?: string; time: string }
  duration: number
  segments: FlightSegment[]
  stops: number
}

interface FlightSegment {
  carrier: { code: string; name: string; logo?: string }
  flightNumber: string
  aircraft?: string
  departure: { airport: string; terminal?: string; time: string }
  arrival: { airport: string; terminal?: string; time: string }
  duration: number
  cabinClass: string
}

const SERPAPI_BASE = 'https://serpapi.com/search.json'

// Cabin class mapping for SerpAPI Google Flights
const CABIN_MAP: Record<string, number> = {
  economy: 1,
  premium_economy: 2,
  business: 3,
  first: 4,
}

export async function searchFlights(params: FlightSearchParams): Promise<NormalizedFlight[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY')
  
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured — cannot search Google Flights')
  }
  
  const segment = params.segments[0]
  if (!segment?.origin || !segment?.destination || !segment?.departureDate) {
    throw new Error('Missing required flight search params: origin, destination, departureDate')
  }
  
  // Build SerpAPI Google Flights query
  const searchParams = new URLSearchParams({
    engine: 'google_flights',
    departure_id: segment.origin,
    arrival_id: segment.destination,
    outbound_date: segment.departureDate,
    currency: params.currency || 'USD',
    hl: 'en',
    api_key: apiKey,
    type: params.tripType === 'round_trip' ? '1' : '2', // 1=round trip, 2=one way
    travel_class: String(CABIN_MAP[params.cabinClass || 'economy'] || 1),
    adults: String(params.travelers.adults || 1),
  })
  
  // Add return date for round trips
  if (params.tripType === 'round_trip' && params.segments[1]?.departureDate) {
    searchParams.set('return_date', params.segments[1].departureDate)
  }
  
  // Add children/infants
  if (params.travelers.children) {
    searchParams.set('children', String(params.travelers.children))
  }
  if (params.travelers.infants) {
    // SerpAPI uses infants_in_seat and infants_on_lap
    searchParams.set('infants_in_seat', String(params.travelers.infants))
  }
  
  // Direct flights only
  if (params.directOnly) {
    searchParams.set('stops', '0')
  }
  
  const url = `${SERPAPI_BASE}?${searchParams.toString()}`
  console.log(`SerpAPI Google Flights search: departure=${segment.origin}, arrival=${segment.destination}, date=${segment.departureDate}`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`SerpAPI Google Flights failed: ${response.status}`, errorText.substring(0, 300))
    throw new Error(`SerpAPI Google Flights failed: HTTP ${response.status} — ${errorText.substring(0, 200)}`)
  }
  
  const data = await response.json()
  
  // Check for SerpAPI-level errors
  if (data.error) {
    console.error('SerpAPI error:', data.error)
    throw new Error(`SerpAPI error: ${data.error}`)
  }
  
  // Extract price insights
  const priceInsights = data.price_insights ? {
    priceLevel: data.price_insights.price_level || 'unknown',
    lowestPrice: data.price_insights.lowest_price,
    typicalPriceRange: data.price_insights.typical_price_range,
  } : undefined
  
  // Combine best_flights and other_flights
  const bestFlights = data.best_flights || []
  const otherFlights = data.other_flights || []
  const allFlights = [...bestFlights, ...otherFlights]
  
  console.log(`SerpAPI Google Flights returned ${bestFlights.length} best + ${otherFlights.length} other = ${allFlights.length} total`)
  
  const limit = params.limit || 50
  return normalizeGoogleFlightsResults(allFlights.slice(0, limit), priceInsights, params)
}

function normalizeGoogleFlightsResults(
  flightGroups: any[],
  priceInsights: NormalizedFlight['priceInsights'],
  params: FlightSearchParams
): NormalizedFlight[] {
  const results: NormalizedFlight[] = []
  
  for (let i = 0; i < flightGroups.length; i++) {
    const group = flightGroups[i]
    if (!group || !group.flights || !Array.isArray(group.flights)) continue
    
    // Each group has an array of flight segments and layovers
    const segments = group.flights
    
    // Determine if this is outbound or if there are return legs
    // Google Flights groups outbound segments together
    const outboundSegments = segments
    
    const outbound = buildLeg(outboundSegments)
    
    // For round trips, return flights come in separate groups or as part of the same data
    // SerpAPI typically returns them within the same group for round trips
    let inbound: FlightLeg | undefined
    if (group.return_flights && Array.isArray(group.return_flights)) {
      inbound = buildLeg(group.return_flights)
    }
    
    const totalStops = outbound.stops + (inbound?.stops || 0)
    const totalDuration = (group.total_duration || outbound.duration) + (inbound?.duration || 0)
    
    // Get carbon emissions
    const carbon = group.carbon_emissions ? {
      thisFlight: group.carbon_emissions.this_flight || 0,
      typicalFlight: group.carbon_emissions.typical_for_this_route || 0,
      differencePercent: group.carbon_emissions.difference_percent || 0,
    } : undefined
    
    // Get airline logo from first segment
    const firstSegment = outboundSegments[0]
    const airlineLogo = firstSegment?.airline_logo
    
    // Build booking URL — construct Google Flights URL
    const origin = params.segments[0].origin
    const dest = params.segments[0].destination
    const date = params.segments[0].departureDate
    const bookingUrl = `https://www.google.com/travel/flights/search?tfs=CBwQAhopEgoyMDI2LTA0LTE1agwIAhIIL20vMHF5dnlyDAgCEggvbS8wNXF0ag&hl=en&gl=us&curr=${params.currency || 'USD'}`
    
    results.push({
      id: `serpapi-gf-${i}`,
      type: 'flight',
      provider: { code: 'google_flights', name: 'Google Flights' },
      price: {
        amount: group.price || 0,
        currency: params.currency || 'USD',
        formatted: formatPrice(group.price || 0, params.currency || 'USD'),
      },
      tripType: params.tripType === 'round_trip' ? 'round_trip' : 'one_way',
      outbound,
      inbound,
      totalStops,
      totalDurationMinutes: totalDuration,
      bookingUrl: group.booking_token 
        ? `https://www.google.com/travel/flights?booking_token=${encodeURIComponent(group.booking_token)}`
        : `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${date}`,
      refundable: false,
      changeable: false,
      priceInsights,
      airlineLogo,
      carbonEmissions: carbon,
    })
  }
  
  return results
}

function buildLeg(segments: any[]): FlightLeg {
  if (!segments || segments.length === 0) {
    return {
      departure: { airport: '', time: '' },
      arrival: { airport: '', time: '' },
      duration: 0,
      segments: [],
      stops: 0,
    }
  }
  
  const first = segments[0]
  const last = segments[segments.length - 1]
  
  return {
    departure: {
      airport: first.departure_airport?.id || first.departure_airport?.name || '',
      terminal: first.departure_airport?.terminal,
      time: first.departure_airport?.time || '',
    },
    arrival: {
      airport: last.arrival_airport?.id || last.arrival_airport?.name || '',
      terminal: last.arrival_airport?.terminal,
      time: last.arrival_airport?.time || '',
    },
    duration: segments.reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
    stops: segments.length - 1,
    segments: segments.map((seg: any) => ({
      carrier: {
        code: seg.airline || '',
        name: seg.airline || '',
        logo: seg.airline_logo,
      },
      flightNumber: seg.flight_number || '',
      aircraft: seg.airplane,
      departure: {
        airport: seg.departure_airport?.id || seg.departure_airport?.name || '',
        terminal: seg.departure_airport?.terminal,
        time: seg.departure_airport?.time || '',
      },
      arrival: {
        airport: seg.arrival_airport?.id || seg.arrival_airport?.name || '',
        terminal: seg.arrival_airport?.terminal,
        time: seg.arrival_airport?.time || '',
      },
      duration: seg.duration || 0,
      cabinClass: seg.travel_class || 'Economy',
    })),
  }
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
