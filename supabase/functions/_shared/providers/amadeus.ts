/**
 * AMADEUS PROVIDER ADAPTER
 * 
 * Direct API calls to Amadeus for flight search.
 * Used by provider-manager for flight searches.
 */

interface AmadeusToken {
  access_token: string
  expires_at: number
}

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
  maxStops?: number
  limit?: number
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

// Token cache
let tokenCache: AmadeusToken | null = null

export async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID')
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET')
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured')
  }
  
  // Check cache
  if (tokenCache && tokenCache.expires_at > Date.now()) {
    return tokenCache.access_token
  }
  
  // Use test environment by default (production requires approval)
  const amadeusEnv = Deno.env.get('AMADEUS_ENV') || 'test'
  const baseUrl = amadeusEnv === 'production' 
    ? 'https://api.amadeus.com' 
    : 'https://test.api.amadeus.com'
  
  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Amadeus auth failed:', errorText)
    throw new Error(`Amadeus auth failed: ${response.status}`)
  }

  const data = await response.json()
  
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000) - 60000, // 1 min buffer
  }
  
  return tokenCache.access_token
}

export async function searchFlights(params: FlightSearchParams): Promise<NormalizedFlight[]> {
  const token = await getAmadeusToken()
  
  const amadeusEnv = Deno.env.get('AMADEUS_ENV') || 'test'
  const baseUrl = amadeusEnv === 'production' 
    ? 'https://api.amadeus.com' 
    : 'https://test.api.amadeus.com'
  
  const segment = params.segments[0]
  const travelers = params.travelers
  
  const searchParams = new URLSearchParams({
    originLocationCode: segment.origin,
    destinationLocationCode: segment.destination,
    departureDate: segment.departureDate,
    adults: String(travelers.adults || 1),
    currencyCode: params.currency || 'USD',
    max: String(params.limit || 50),
  })
  
  if (travelers.children) {
    searchParams.append('children', String(travelers.children))
  }
  if (travelers.infants) {
    searchParams.append('infants', String(travelers.infants))
  }
  if (params.cabinClass) {
    const cabinMap: Record<string, string> = {
      economy: 'ECONOMY',
      premium_economy: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST',
    }
    searchParams.append('travelClass', cabinMap[params.cabinClass] || 'ECONOMY')
  }
  if (params.directOnly) {
    searchParams.append('nonStop', 'true')
  }
  if (params.maxStops !== undefined) {
    searchParams.append('maxPrice', String(params.maxStops))
  }
  // Add return date for round trips
  if (params.segments[1]?.departureDate) {
    searchParams.append('returnDate', params.segments[1].departureDate)
  }
  
  console.log(`Amadeus search: ${baseUrl}/v2/shopping/flight-offers?${searchParams}`)
  
  const response = await fetch(
    `${baseUrl}/v2/shopping/flight-offers?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Amadeus search failed:', errorText)
    throw new Error(`Amadeus search failed: ${response.status}`)
  }

  const data = await response.json()
  console.log(`Amadeus returned ${data.data?.length || 0} offers`)
  
  return normalizeAmadeusResults(data.data || [], data.dictionaries || {})
}

function normalizeAmadeusResults(offers: any[], dictionaries: any): NormalizedFlight[] {
  const carriers = dictionaries.carriers || {}
  const aircraft = dictionaries.aircraft || {}
  
  return offers.map((offer: any, index: number) => {
    const itineraries = offer.itineraries || []
    const outboundItinerary = itineraries[0]
    const inboundItinerary = itineraries[1]
    
    const normalizeItinerary = (itinerary: any): FlightLeg => {
      const segments = itinerary.segments || []
      const firstSegment = segments[0]
      const lastSegment = segments[segments.length - 1]
      
      return {
        departure: {
          airport: firstSegment?.departure?.iataCode || '',
          terminal: firstSegment?.departure?.terminal,
          time: firstSegment?.departure?.at || '',
        },
        arrival: {
          airport: lastSegment?.arrival?.iataCode || '',
          terminal: lastSegment?.arrival?.terminal,
          time: lastSegment?.arrival?.at || '',
        },
        duration: parseDuration(itinerary.duration),
        stops: segments.length - 1,
        segments: segments.map((seg: any) => ({
          carrier: {
            code: seg.carrierCode || '',
            name: carriers[seg.carrierCode] || seg.carrierCode || '',
          },
          flightNumber: `${seg.carrierCode}${seg.number}`,
          aircraft: aircraft[seg.aircraft?.code] || seg.aircraft?.code,
          departure: {
            airport: seg.departure?.iataCode || '',
            terminal: seg.departure?.terminal,
            time: seg.departure?.at || '',
          },
          arrival: {
            airport: seg.arrival?.iataCode || '',
            terminal: seg.arrival?.terminal,
            time: seg.arrival?.at || '',
          },
          duration: parseDuration(seg.duration),
          cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.find(
            (f: any) => f.segmentId === seg.id
          )?.cabin || 'ECONOMY',
        })),
      }
    }
    
    const price = parseFloat(offer.price?.total || '0')
    const currency = offer.price?.currency || 'USD'
    
    const outbound = normalizeItinerary(outboundItinerary)
    const totalStops = outbound.stops + (inboundItinerary ? normalizeItinerary(inboundItinerary).stops : 0)
    const totalDuration = outbound.duration + (inboundItinerary ? normalizeItinerary(inboundItinerary).duration : 0)
    
    return {
      id: `amadeus-${offer.id || index}`,
      type: 'flight',
      provider: { code: 'amadeus', name: 'Amadeus' },
      price: {
        amount: price,
        currency,
        formatted: formatPrice(price, currency),
      },
      tripType: inboundItinerary ? 'round_trip' : 'one_way',
      outbound,
      inbound: inboundItinerary ? normalizeItinerary(inboundItinerary) : undefined,
      totalStops,
      totalDurationMinutes: totalDuration,
      refundable: offer.pricingOptions?.refundableFare || false,
      changeable: true,
    }
  })
}

function parseDuration(duration: string): number {
  if (!duration) return 0
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  return hours * 60 + minutes
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export async function healthCheck(): Promise<boolean> {
  try {
    await getAmadeusToken()
    return true
  } catch {
    return false
  }
}
