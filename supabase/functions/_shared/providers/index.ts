/**
 * PROVIDER ADAPTERS INDEX
 * 
 * Exports all provider adapters for use by provider-manager.
 */

export * as amadeus from './amadeus.ts'
export * as kiwi from './kiwi.ts'

// Provider interface for type safety
export interface ProviderAdapter {
  searchFlights: (params: FlightSearchParams) => Promise<NormalizedFlight[]>
  healthCheck: () => Promise<boolean>
}

export interface FlightSearchParams {
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

export interface NormalizedFlight {
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

export interface FlightLeg {
  departure: { airport: string; terminal?: string; time: string }
  arrival: { airport: string; terminal?: string; time: string }
  duration: number
  segments: FlightSegment[]
  stops: number
}

export interface FlightSegment {
  carrier: { code: string; name: string; logo?: string }
  flightNumber: string
  aircraft?: string
  departure: { airport: string; terminal?: string; time: string }
  arrival: { airport: string; terminal?: string; time: string }
  duration: number
  cabinClass: string
}
