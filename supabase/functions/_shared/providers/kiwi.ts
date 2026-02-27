/**
 * KIWI.COM PROVIDER ADAPTER
 * 
 * Direct API calls to Kiwi.com (via RapidAPI) for flight search.
 * Used by provider-manager for budget flight searches.
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

export async function searchFlights(params: FlightSearchParams): Promise<NormalizedFlight[]> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')
  
  if (!apiKey) {
    throw new Error('RapidAPI key not configured for Kiwi.com')
  }
  
  const segment = params.segments[0]
  const travelers = params.travelers
  
  // Format date as DD/MM/YYYY for Kiwi API
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Build search parameters
  const searchParams = new URLSearchParams({
    fly_from: segment.origin,
    fly_to: segment.destination,
    date_from: formatDate(segment.departureDate),
    date_to: formatDate(segment.departureDate),
    adults: String(travelers.adults || 1),
    children: String(travelers.children || 0),
    infants: String(travelers.infants || 0),
    curr: params.currency || 'USD',
    limit: String(params.limit || 50),
    sort: 'price',
  })

  // Add return date for round trips
  if (params.tripType === 'round_trip' && params.segments[1]?.departureDate) {
    searchParams.append('return_from', formatDate(params.segments[1].departureDate))
    searchParams.append('return_to', formatDate(params.segments[1].departureDate))
  }

  // Cabin class mapping for Kiwi
  const cabinMap: Record<string, string> = {
    economy: 'M',
    premium_economy: 'W',
    business: 'C',
    first: 'F',
  }
  searchParams.append('selected_cabins', cabinMap[params.cabinClass || 'economy'] || 'M')

  // Determine endpoint based on trip type
  const endpoint = params.tripType === 'round_trip' ? 'round-trip' : 'one-way'

  console.log(`Kiwi search: https://kiwi-com-cheap-flights.p.rapidapi.com/${endpoint}?${searchParams}`)

  const response = await fetch(
    `https://kiwi-com-cheap-flights.p.rapidapi.com/${endpoint}?${searchParams}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'kiwi-com-cheap-flights.p.rapidapi.com',
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Kiwi search failed:', errorText)
    throw new Error(`Kiwi search failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('Kiwi response keys:', Object.keys(data))
  
  // RapidAPI Kiwi may return data in different formats
  const flights = data.data || data.results || data.flights || data.itineraries || []
  console.log(`Kiwi returned ${Array.isArray(flights) ? flights.length : 0} flights`)
  
  return normalizeKiwiResults(Array.isArray(flights) ? flights : [])
}

function normalizeKiwiResults(flights: any[]): NormalizedFlight[] {
  return flights.map((flight: any, index: number) => {
    // Handle different response structures from RapidAPI Kiwi
    const price = flight.price || flight.conversion?.USD || flight.fare?.adults || 0
    const currency = flight.currency || 'USD'
    
    // Get route/segments - Kiwi uses different structures
    const route = flight.route || flight.sectors || flight.legs || []
    const outboundSegments = route.filter((r: any) => r.return === 0 || !r.return)
    const inboundSegments = route.filter((r: any) => r.return === 1)
    
    const normalizeSegments = (segments: any[]): FlightLeg => {
      if (!segments || segments.length === 0) {
        return {
          departure: { airport: flight.flyFrom || '', time: flight.dTime ? new Date(flight.dTime * 1000).toISOString() : '' },
          arrival: { airport: flight.flyTo || '', time: flight.aTime ? new Date(flight.aTime * 1000).toISOString() : '' },
          duration: flight.fly_duration ? parseDurationString(flight.fly_duration) : 0,
          stops: 0,
          segments: [],
        }
      }
      
      const firstSeg = segments[0]
      const lastSeg = segments[segments.length - 1]
      
      return {
        departure: {
          airport: firstSeg.flyFrom || firstSeg.departure?.airport || '',
          terminal: firstSeg.departure?.terminal,
          time: firstSeg.dTime ? new Date(firstSeg.dTime * 1000).toISOString() : firstSeg.departure?.time || '',
        },
        arrival: {
          airport: lastSeg.flyTo || lastSeg.arrival?.airport || '',
          terminal: lastSeg.arrival?.terminal,
          time: lastSeg.aTime ? new Date(lastSeg.aTime * 1000).toISOString() : lastSeg.arrival?.time || '',
        },
        duration: segments.reduce((sum: number, s: any) => {
          if (s.fly_duration) return sum + parseDurationString(s.fly_duration)
          if (s.duration) return sum + s.duration
          return sum
        }, 0),
        stops: segments.length - 1,
        segments: segments.map((seg: any) => ({
          carrier: {
            code: seg.airline || seg.carrier?.code || '',
            name: seg.airline || seg.carrier?.name || '',
          },
          flightNumber: `${seg.airline || ''}${seg.flight_no || seg.flightNumber || ''}`,
          aircraft: seg.equipment || seg.aircraft,
          departure: {
            airport: seg.flyFrom || seg.departure?.airport || '',
            terminal: seg.departure?.terminal,
            time: seg.dTime ? new Date(seg.dTime * 1000).toISOString() : seg.departure?.time || '',
          },
          arrival: {
            airport: seg.flyTo || seg.arrival?.airport || '',
            terminal: seg.arrival?.terminal,
            time: seg.aTime ? new Date(seg.aTime * 1000).toISOString() : seg.arrival?.time || '',
          },
          duration: seg.fly_duration ? parseDurationString(seg.fly_duration) : (seg.duration || 0),
          cabinClass: seg.cabin || 'economy',
        })),
      }
    }
    
    const outbound = normalizeSegments(outboundSegments)
    const inbound = inboundSegments.length > 0 ? normalizeSegments(inboundSegments) : undefined
    
    const totalStops = outbound.stops + (inbound?.stops || 0)
    const totalDuration = outbound.duration + (inbound?.duration || 0)
    
    return {
      id: `kiwi-${flight.id || index}`,
      type: 'flight',
      provider: { code: 'kiwi', name: 'Kiwi.com' },
      price: {
        amount: typeof price === 'number' ? price : parseFloat(price) || 0,
        currency,
        formatted: formatPrice(typeof price === 'number' ? price : parseFloat(price) || 0, currency),
      },
      tripType: inbound ? 'round_trip' : 'one_way',
      outbound,
      inbound,
      totalStops,
      totalDurationMinutes: totalDuration,
      bookingUrl: flight.deep_link || flight.booking_token,
      refundable: false,
      changeable: true,
    }
  })
}

function parseDurationString(duration: string): number {
  if (!duration) return 0
  // Handle formats like "2h 30m" or "2:30"
  const hoursMatch = duration.match(/(\d+)h/)
  const minutesMatch = duration.match(/(\d+)m/)
  const colonMatch = duration.match(/(\d+):(\d+)/)
  
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10)
  }
  
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0
  return hours * 60 + minutes
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export async function healthCheck(): Promise<boolean> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')
  return !!apiKey
}
