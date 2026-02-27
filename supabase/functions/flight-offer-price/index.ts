/**
 * FLIGHT OFFER PRICE EDGE FUNCTION
 * 
 * Confirms flight price and retrieves detailed information:
 * - Price confirmation (is the price still valid?)
 * - Baggage allowance and add-on pricing
 * - Fare rules (refundable, changeable, penalties)
 * - Seat map availability (Amadeus only)
 * 
 * Called when user selects a flight from search results.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================
// TYPES
// ============================================

interface PriceRequest {
  flightOffer: any // The flight offer from search results
  provider: 'amadeus' | 'kiwi'
  travelers: {
    adults: number
    children?: number
    infants?: number
  }
  includeSeatMap?: boolean
}

interface PriceResponse {
  success: boolean
  data?: {
    // Price confirmation
    priceConfirmed: boolean
    originalPrice: number
    confirmedPrice: number
    priceChanged: boolean
    currency: string
    
    // Baggage
    baggage: {
      cabin: {
        included: boolean
        quantity: number
        weightKg?: number
        dimensions?: string
      }
      checked: {
        included: boolean
        quantity: number
        weightKg?: number
        addOnOptions?: Array<{
          quantity: number
          weightKg: number
          price: number
          currency: string
        }>
      }
    }
    
    // Fare rules
    fareRules: {
      refundable: boolean
      changeable: boolean
      cancellation: {
        allowed: boolean
        penalty?: number
        penaltyCurrency?: string
        deadline?: string
      }
      change: {
        allowed: boolean
        penalty?: number
        penaltyCurrency?: string
      }
      fareRulesText?: string[]
    }
    
    // Seat map (Amadeus only)
    seatMap?: {
      available: boolean
      decks?: Array<{
        deckType: string
        rows: Array<{
          number: string
          seats: Array<{
            number: string
            available: boolean
            price?: number
            currency?: string
            characteristics?: string[]
          }>
        }>
      }>
    }
    
    // Traveler requirements
    travelerRequirements: {
      documentRequired: boolean
      documentTypes: string[]
      fields: string[]
    }
    
    // Offer expiry
    expiresAt?: string
    
    // Provider-specific booking token
    bookingToken: string
  }
  error?: {
    code: string
    message: string
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body: PriceRequest = await req.json()
    const { flightOffer, provider, travelers, includeSeatMap } = body

    if (!flightOffer || !provider) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Missing flightOffer or provider' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: PriceResponse['data']

    if (provider === 'amadeus') {
      result = await priceAmadeusOffer(flightOffer, travelers, includeSeatMap)
    } else if (provider === 'kiwi') {
      result = await priceKiwiOffer(flightOffer, travelers)
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'UNSUPPORTED_PROVIDER', message: `Provider ${provider} not supported` },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        duration: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Flight offer price error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message || 'An unexpected error occurred',
        },
        duration: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// AMADEUS PRICE CONFIRMATION
// ============================================

async function priceAmadeusOffer(
  flightOffer: any,
  travelers: { adults: number; children?: number; infants?: number },
  includeSeatMap?: boolean
): Promise<PriceResponse['data']> {
  const token = await getAmadeusToken()
  const baseUrl = getAmadeusBaseUrl()

  // Extract the original Amadeus offer ID
  const offerId = flightOffer.id?.replace('amadeus-', '') || flightOffer.providerOfferId

  // Build the flight offer for pricing
  // We need to reconstruct the Amadeus format from our normalized data
  const amadeusOffer = reconstructAmadeusOffer(flightOffer, offerId)

  // Call Flight Offers Price API with detailed fare rules and baggage
  const priceResponse = await fetch(`${baseUrl}/v1/shopping/flight-offers/pricing`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-HTTP-Method-Override': 'GET', // Required for detailed fare rules
    },
    body: JSON.stringify({
      data: {
        type: 'flight-offers-pricing',
        flightOffers: [amadeusOffer],
      },
      include: ['detailed-fare-rules', 'bags'],
    }),
  })

  if (!priceResponse.ok) {
    const errorText = await priceResponse.text()
    console.error('Amadeus pricing failed:', errorText)
    
    // Return fallback data if pricing fails (offer might have expired)
    return createFallbackResponse(flightOffer, 'amadeus')
  }

  const priceData = await priceResponse.json()
  const pricedOffer = priceData.data?.flightOffers?.[0]
  const dictionaries = priceData.dictionaries || {}

  if (!pricedOffer) {
    return createFallbackResponse(flightOffer, 'amadeus')
  }

  // Extract baggage information
  const baggage = extractAmadeusBaggage(pricedOffer, dictionaries)

  // Extract fare rules
  const fareRules = extractAmadeusFareRules(pricedOffer, priceData.included)

  // Get seat map if requested
  let seatMap = undefined
  if (includeSeatMap) {
    seatMap = await getAmadeusSeatMap(token, baseUrl, pricedOffer)
  }

  const confirmedPrice = parseFloat(pricedOffer.price?.total || '0')
  const originalPrice = flightOffer.price?.amount || confirmedPrice

  return {
    priceConfirmed: true,
    originalPrice,
    confirmedPrice,
    priceChanged: Math.abs(confirmedPrice - originalPrice) > 0.01,
    currency: pricedOffer.price?.currency || 'USD',
    baggage,
    fareRules,
    seatMap,
    travelerRequirements: {
      documentRequired: true, // International flights require documents
      documentTypes: ['passport', 'id_card'],
      fields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'],
    },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
    bookingToken: JSON.stringify(pricedOffer), // Store the priced offer for booking
  }
}

function reconstructAmadeusOffer(normalizedOffer: any, offerId: string): any {
  // If we have the raw offer stored, use it
  if (normalizedOffer.rawOffer) {
    return normalizedOffer.rawOffer
  }

  // Otherwise, reconstruct from normalized data
  // This is a simplified reconstruction - in production, store the raw offer
  const outbound = normalizedOffer.outbound
  const inbound = normalizedOffer.inbound

  const itineraries = []

  if (outbound) {
    itineraries.push({
      duration: `PT${Math.floor(outbound.duration / 60)}H${outbound.duration % 60}M`,
      segments: outbound.segments?.map((seg: any, idx: number) => ({
        id: String(idx + 1),
        departure: {
          iataCode: seg.departure?.airport,
          terminal: seg.departure?.terminal,
          at: seg.departure?.time,
        },
        arrival: {
          iataCode: seg.arrival?.airport,
          terminal: seg.arrival?.terminal,
          at: seg.arrival?.time,
        },
        carrierCode: seg.carrier?.code,
        number: seg.flightNumber?.replace(seg.carrier?.code, ''),
        aircraft: { code: seg.aircraft },
        duration: `PT${Math.floor(seg.duration / 60)}H${seg.duration % 60}M`,
      })) || [],
    })
  }

  if (inbound) {
    itineraries.push({
      duration: `PT${Math.floor(inbound.duration / 60)}H${inbound.duration % 60}M`,
      segments: inbound.segments?.map((seg: any, idx: number) => ({
        id: String(itineraries[0].segments.length + idx + 1),
        departure: {
          iataCode: seg.departure?.airport,
          terminal: seg.departure?.terminal,
          at: seg.departure?.time,
        },
        arrival: {
          iataCode: seg.arrival?.airport,
          terminal: seg.arrival?.terminal,
          at: seg.arrival?.time,
        },
        carrierCode: seg.carrier?.code,
        number: seg.flightNumber?.replace(seg.carrier?.code, ''),
        aircraft: { code: seg.aircraft },
        duration: `PT${Math.floor(seg.duration / 60)}H${seg.duration % 60}M`,
      })) || [],
    })
  }

  return {
    type: 'flight-offer',
    id: offerId,
    source: 'GDS',
    itineraries,
    price: {
      currency: normalizedOffer.price?.currency || 'USD',
      total: String(normalizedOffer.price?.amount || 0),
      base: String(normalizedOffer.price?.amount || 0),
    },
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: false,
    },
    validatingAirlineCodes: [outbound?.segments?.[0]?.carrier?.code || 'XX'],
    travelerPricings: [{
      travelerId: '1',
      fareOption: 'STANDARD',
      travelerType: 'ADULT',
      price: {
        currency: normalizedOffer.price?.currency || 'USD',
        total: String(normalizedOffer.price?.amount || 0),
      },
      fareDetailsBySegment: itineraries.flatMap((it: any) =>
        it.segments.map((seg: any) => ({
          segmentId: seg.id,
          cabin: 'ECONOMY',
          fareBasis: 'EOBAU',
          class: 'E',
        }))
      ),
    }],
  }
}

function extractAmadeusBaggage(pricedOffer: any, dictionaries: any): PriceResponse['data']['baggage'] {
  const travelerPricing = pricedOffer.travelerPricings?.[0]
  const fareDetails = travelerPricing?.fareDetailsBySegment?.[0]
  const includedBags = fareDetails?.includedCheckedBags

  // Get additional bag options from dictionaries
  const bagOptions = dictionaries.bags || {}

  return {
    cabin: {
      included: true, // Cabin bag usually included
      quantity: 1,
      weightKg: 7,
      dimensions: '55x40x23 cm',
    },
    checked: {
      included: includedBags?.quantity > 0 || includedBags?.weight > 0,
      quantity: includedBags?.quantity || 0,
      weightKg: includedBags?.weight || 23,
      addOnOptions: [
        { quantity: 1, weightKg: 23, price: 35, currency: 'USD' },
        { quantity: 2, weightKg: 23, price: 65, currency: 'USD' },
        { quantity: 1, weightKg: 32, price: 50, currency: 'USD' },
      ],
    },
  }
}

function extractAmadeusFareRules(pricedOffer: any, included: any[]): PriceResponse['data']['fareRules'] {
  const fareRules = included?.filter((item: any) => item.type === 'detailed-fare-rules') || []
  
  let refundable = pricedOffer.pricingOptions?.refundableFare || false
  let changeable = true
  let cancellationPenalty = 0
  let changePenalty = 0
  const fareRulesText: string[] = []

  // Parse detailed fare rules
  for (const rule of fareRules) {
    const rules = rule.fareRules || []
    for (const r of rules) {
      if (r.category === 'REFUND') {
        refundable = r.notApplicable !== true
        if (r.maxPenaltyAmount) {
          cancellationPenalty = parseFloat(r.maxPenaltyAmount)
        }
        if (r.descriptions) {
          fareRulesText.push(...r.descriptions.map((d: any) => d.text))
        }
      }
      if (r.category === 'EXCHANGE') {
        changeable = r.notApplicable !== true
        if (r.maxPenaltyAmount) {
          changePenalty = parseFloat(r.maxPenaltyAmount)
        }
      }
    }
  }

  return {
    refundable,
    changeable,
    cancellation: {
      allowed: refundable,
      penalty: cancellationPenalty || undefined,
      penaltyCurrency: 'USD',
    },
    change: {
      allowed: changeable,
      penalty: changePenalty || undefined,
      penaltyCurrency: 'USD',
    },
    fareRulesText: fareRulesText.length > 0 ? fareRulesText : undefined,
  }
}

async function getAmadeusSeatMap(
  token: string,
  baseUrl: string,
  pricedOffer: any
): Promise<PriceResponse['data']['seatMap']> {
  try {
    const response = await fetch(`${baseUrl}/v1/shopping/seatmaps`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [pricedOffer],
      }),
    })

    if (!response.ok) {
      console.error('Seat map request failed:', response.status)
      return { available: false }
    }

    const seatData = await response.json()
    const seatMaps = seatData.data || []

    if (seatMaps.length === 0) {
      return { available: false }
    }

    // Parse seat map data
    const decks = seatMaps[0].decks?.map((deck: any) => ({
      deckType: deck.deckType || 'MAIN',
      rows: deck.deckConfiguration?.rows?.map((row: any) => ({
        number: row.number,
        seats: row.seats?.map((seat: any) => ({
          number: seat.number,
          available: seat.travelerPricing?.[0]?.seatAvailabilityStatus === 'AVAILABLE',
          price: seat.travelerPricing?.[0]?.price?.total
            ? parseFloat(seat.travelerPricing[0].price.total)
            : undefined,
          currency: seat.travelerPricing?.[0]?.price?.currency,
          characteristics: seat.characteristicsCodes || [],
        })) || [],
      })) || [],
    })) || []

    return {
      available: true,
      decks,
    }
  } catch (error) {
    console.error('Seat map error:', error)
    return { available: false }
  }
}

// ============================================
// KIWI PRICE CONFIRMATION
// ============================================

async function priceKiwiOffer(
  flightOffer: any,
  travelers: { adults: number; children?: number; infants?: number }
): Promise<PriceResponse['data']> {
  const apiKey = Deno.env.get('KIWI_API_KEY')

  if (!apiKey) {
    console.error('Kiwi API key not configured')
    return createFallbackResponse(flightOffer, 'kiwi')
  }

  // Extract booking token from the offer
  const bookingToken = flightOffer.bookingToken || flightOffer.providerOfferId

  if (!bookingToken) {
    return createFallbackResponse(flightOffer, 'kiwi')
  }

  // Call Kiwi check_flights endpoint to verify price
  const checkUrl = new URL('https://api.tequila.kiwi.com/v2/booking/check_flights')
  checkUrl.searchParams.set('booking_token', bookingToken)
  checkUrl.searchParams.set('bnum', String(travelers.adults + (travelers.children || 0)))
  checkUrl.searchParams.set('adults', String(travelers.adults))
  if (travelers.children) {
    checkUrl.searchParams.set('children', String(travelers.children))
  }
  if (travelers.infants) {
    checkUrl.searchParams.set('infants', String(travelers.infants))
  }

  try {
    const response = await fetch(checkUrl.toString(), {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Kiwi check_flights failed:', response.status)
      return createFallbackResponse(flightOffer, 'kiwi')
    }

    const data = await response.json()

    if (!data.flights_checked) {
      return createFallbackResponse(flightOffer, 'kiwi')
    }

    const confirmedPrice = data.total || data.conversion?.amount || flightOffer.price?.amount
    const originalPrice = flightOffer.price?.amount || confirmedPrice

    // Extract baggage from Kiwi response
    const baggage = extractKiwiBaggage(data)

    return {
      priceConfirmed: data.flights_checked === true,
      originalPrice,
      confirmedPrice,
      priceChanged: data.price_change === true,
      currency: data.conversion?.currency || 'USD',
      baggage,
      fareRules: {
        refundable: false, // Kiwi doesn't provide this directly
        changeable: false,
        cancellation: {
          allowed: false,
        },
        change: {
          allowed: false,
        },
      },
      seatMap: {
        available: false, // Kiwi doesn't provide seat maps
      },
      travelerRequirements: {
        documentRequired: true,
        documentTypes: ['passport', 'id_card'],
        fields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'nationality'],
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry for Kiwi
      bookingToken: data.booking_token || bookingToken,
    }
  } catch (error) {
    console.error('Kiwi pricing error:', error)
    return createFallbackResponse(flightOffer, 'kiwi')
  }
}

function extractKiwiBaggage(data: any): PriceResponse['data']['baggage'] {
  const bagsPrice = data.bags_price || {}

  return {
    cabin: {
      included: true,
      quantity: 1,
      weightKg: 8,
      dimensions: '55x40x23 cm',
    },
    checked: {
      included: false, // Kiwi typically doesn't include checked bags in base fare
      quantity: 0,
      addOnOptions: [
        {
          quantity: 1,
          weightKg: 20,
          price: bagsPrice['1'] || 25,
          currency: 'USD',
        },
        {
          quantity: 2,
          weightKg: 20,
          price: bagsPrice['2'] || 45,
          currency: 'USD',
        },
      ],
    },
  }
}

// ============================================
// HELPERS
// ============================================

function createFallbackResponse(flightOffer: any, provider: string): PriceResponse['data'] {
  const price = flightOffer.price?.amount || 0

  return {
    priceConfirmed: false,
    originalPrice: price,
    confirmedPrice: price,
    priceChanged: false,
    currency: flightOffer.price?.currency || 'USD',
    baggage: {
      cabin: {
        included: true,
        quantity: 1,
        weightKg: 7,
      },
      checked: {
        included: false,
        quantity: 0,
        addOnOptions: [
          { quantity: 1, weightKg: 23, price: 35, currency: 'USD' },
          { quantity: 2, weightKg: 23, price: 65, currency: 'USD' },
        ],
      },
    },
    fareRules: {
      refundable: flightOffer.refundable || false,
      changeable: flightOffer.changeable || true,
      cancellation: { allowed: flightOffer.refundable || false },
      change: { allowed: true },
    },
    seatMap: { available: provider === 'amadeus' },
    travelerRequirements: {
      documentRequired: true,
      documentTypes: ['passport', 'id_card'],
      fields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'],
    },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    bookingToken: flightOffer.id || '',
  }
}

// Token cache for Amadeus
let tokenCache: { access_token: string; expires_at: number } | null = null

async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID')
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured')
  }

  if (tokenCache && tokenCache.expires_at > Date.now()) {
    return tokenCache.access_token
  }

  const baseUrl = getAmadeusBaseUrl()

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
    throw new Error(`Amadeus auth failed: ${response.status}`)
  }

  const data = await response.json()

  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000,
  }

  return tokenCache.access_token
}

function getAmadeusBaseUrl(): string {
  const env = Deno.env.get('AMADEUS_ENV') || 'test'
  return env === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com'
}
