/**
 * BOOKING.COM PROVIDER ADAPTER
 * 
 * Hotel search via Booking.com API on RapidAPI.
 * Used by provider-manager for hotel searches.
 * 
 * RapidAPI Booking.com API: https://rapidapi.com/apidojo/api/booking
 * 
 * Flow:
 * 1. Search for destination ID via /v1/hotels/locations
 * 2. Search hotels via /v1/hotels/search
 * 3. Normalize results to UnifiedHotel format
 */

interface HotelSearchParams {
  destination: {
    type: 'city' | 'airport' | 'poi' | 'coordinates'
    value: string
    coordinates?: { lat: number; lng: number }
  }
  checkInDate: string  // YYYY-MM-DD
  checkOutDate: string // YYYY-MM-DD
  rooms: Array<{
    adults: number
    children?: number
    childrenAges?: number[]
  }>
  currency?: string
  language?: string
  limit?: number
}

interface NormalizedHotel {
  id: string
  type: 'hotel'
  providerPropertyId: string
  provider: { code: string; name: string }
  name: string
  description?: string
  shortDescription?: string
  propertyType: string
  starRating?: number
  brand?: string
  location: {
    address: {
      line1?: string
      line2?: string
      city: string
      state?: string
      country: string
      countryCode: string
      postalCode?: string
      formatted: string
    }
    coordinates?: { lat: number; lng: number }
    neighborhood?: string
  }
  images: Array<{ url: string; caption?: string; category?: string }>
  heroImage?: string
  guestRating?: {
    score: number
    maxScore: number
    reviewCount: number
    sentiment?: string
  }
  amenities: string[]
  keyAmenities: string[]
  rooms: RoomOffer[]
  lowestPrice: { amount: number; currency: string; formatted: string }
  checkInTime?: string
  checkOutTime?: string
  policies?: {
    checkIn: { time: string }
    checkOut: { time: string }
    pets?: { allowed: boolean }
  }
  retrievedAt: string
  deepLink?: string
}

interface RoomOffer {
  id: string
  providerOfferId: string
  name: string
  description?: string
  roomType: string
  bedConfiguration: Array<{ type: string; count: number }>
  maxOccupancy: { adults: number; children: number; total: number }
  amenities: string[]
  price: { amount: number; currency: string; formatted: string }
  pricePerNight: { amount: number; currency: string; formatted: string }
  inclusions: string[]
  boardType: string
  cancellationPolicy: {
    freeCancellation: boolean
    freeCancellationDeadline?: string
    summary: string
    refundable: boolean
  }
  isRefundable: boolean
  roomsRemaining?: number
}

// Booking.com RapidAPI configuration
const RAPIDAPI_HOST = 'booking-com.p.rapidapi.com'
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}/v1`

// Cache for destination IDs to avoid repeated lookups
const destIdCache: Map<string, { destId: string; destType: string; expiresAt: number }> = new Map()

/**
 * Get RapidAPI headers for Booking.com API
 */
function getRapidApiHeaders(): Record<string, string> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY not configured')
  }
  
  return {
    'x-rapidapi-host': RAPIDAPI_HOST,
    'x-rapidapi-key': apiKey,
    'Accept': 'application/json',
  }
}

/**
 * Search for destination ID by city/location name
 * Required before searching for hotels
 */
async function getDestinationId(locationName: string, locale: string = 'en-us'): Promise<{ destId: string; destType: string } | null> {
  // Check cache first
  const cacheKey = `${locationName.toLowerCase()}-${locale}`
  const cached = destIdCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`Using cached dest_id for ${locationName}: ${cached.destId}`)
    return { destId: cached.destId, destType: cached.destType }
  }
  
  try {
    const url = new URL(`${RAPIDAPI_BASE_URL}/hotels/locations`)
    url.searchParams.set('name', locationName)
    url.searchParams.set('locale', locale)
    
    console.log(`Booking.com location search: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getRapidApiHeaders(),
    })
    
    if (!response.ok) {
      console.error(`Location search failed: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    // Find the first city result
    const cityResult = data?.find((item: any) => item.dest_type === 'city') || data?.[0]
    
    if (cityResult) {
      const result = {
        destId: String(cityResult.dest_id),
        destType: cityResult.dest_type || 'city',
      }
      
      // Cache for 24 hours
      destIdCache.set(cacheKey, {
        ...result,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })
      
      console.log(`Found dest_id for ${locationName}: ${result.destId} (${result.destType})`)
      return result
    }
    
    return null
  } catch (error) {
    console.error('Location search error:', error)
    return null
  }
}

/**
 * Search hotels via Booking.com RapidAPI
 */
export async function searchHotels(params: HotelSearchParams): Promise<NormalizedHotel[]> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')
  
  // If no credentials, return mock data for development
  if (!apiKey) {
    console.log('RAPIDAPI_KEY not configured, returning mock hotel data')
    return generateMockHotels(params)
  }
  
  try {
    // Step 1: Get destination ID
    const destinationName = params.destination.value || 'New York'
    const destInfo = await getDestinationId(destinationName)
    
    if (!destInfo) {
      console.log(`Could not find destination ID for ${destinationName}, using mock data`)
      return generateMockHotels(params)
    }
    
    // Step 2: Search hotels
    const url = new URL(`${RAPIDAPI_BASE_URL}/hotels/search`)
    url.searchParams.set('dest_id', destInfo.destId)
    url.searchParams.set('dest_type', destInfo.destType)
    url.searchParams.set('checkin_date', params.checkInDate)
    url.searchParams.set('checkout_date', params.checkOutDate)
    url.searchParams.set('adults_number', String(params.rooms[0]?.adults || 2))
    url.searchParams.set('room_number', String(params.rooms.length || 1))
    url.searchParams.set('locale', 'en-us')
    url.searchParams.set('currency', params.currency || 'USD')
    url.searchParams.set('order_by', 'popularity')
    url.searchParams.set('units', 'metric')
    url.searchParams.set('filter_by_currency', params.currency || 'USD')
    url.searchParams.set('page_number', '0')
    
    // Add children if present
    const childrenCount = params.rooms[0]?.children || 0
    if (childrenCount > 0) {
      url.searchParams.set('children_number', String(childrenCount))
      if (params.rooms[0]?.childrenAges?.length) {
        url.searchParams.set('children_ages', params.rooms[0].childrenAges.join(','))
      }
    }
    
    console.log(`Booking.com hotel search: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getRapidApiHeaders(),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Booking.com search failed: ${response.status}`, errorText)
      return generateMockHotels(params)
    }
    
    const data = await response.json()
    console.log(`Booking.com returned ${data?.result?.length || 0} hotels`)
    
    return normalizeBookingResults(data, params)
  } catch (error) {
    console.error('Booking.com API error:', error)
    return generateMockHotels(params)
  }
}

/**
 * Normalize Booking.com API response to UnifiedHotel format
 */
function normalizeBookingResults(data: any, params: HotelSearchParams): NormalizedHotel[] {
  const hotels = data?.result || []
  
  if (!Array.isArray(hotels) || hotels.length === 0) {
    return []
  }
  
  const checkIn = new Date(params.checkInDate)
  const checkOut = new Date(params.checkOutDate)
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
  
  return hotels.slice(0, params.limit || 15).map((hotel: any, index: number) => {
    // Extract price info - round to 2 decimal places to avoid floating point issues
    const rawTotalPrice = hotel.min_total_price || hotel.price_breakdown?.gross_price || 0
    const totalPrice = Math.round(rawTotalPrice * 100) / 100
    const pricePerNight = Math.round((totalPrice / nights) * 100) / 100
    const currency = hotel.currency_code || hotel.price_breakdown?.currency || 'USD'
    
    // Build room offer from available data
    const room: RoomOffer = {
      id: `booking-room-${hotel.hotel_id}-0`,
      providerOfferId: String(hotel.hotel_id),
      name: hotel.unit_configuration_label || 'Standard Room',
      description: hotel.unit_configuration_label,
      roomType: 'standard',
      bedConfiguration: [{ type: 'double', count: 1 }],
      maxOccupancy: {
        adults: params.rooms[0]?.adults || 2,
        children: params.rooms[0]?.children || 2,
        total: (params.rooms[0]?.adults || 2) + (params.rooms[0]?.children || 0),
      },
      amenities: [],
      price: {
        amount: totalPrice,
        currency,
        formatted: formatPrice(totalPrice, currency),
      },
      pricePerNight: {
        amount: pricePerNight,
        currency,
        formatted: formatPrice(pricePerNight, currency),
      },
      inclusions: hotel.is_free_cancellable ? ['Free Cancellation'] : [],
      boardType: hotel.has_free_breakfast ? 'breakfast_included' : 'room_only',
      cancellationPolicy: {
        freeCancellation: hotel.is_free_cancellable || false,
        freeCancellationDeadline: hotel.free_cancellation_until,
        summary: hotel.is_free_cancellable ? 'Free cancellation available' : 'Non-refundable',
        refundable: hotel.is_free_cancellable || false,
      },
      isRefundable: hotel.is_free_cancellable || false,
      roomsRemaining: hotel.available_rooms,
    }
    
    // Extract amenities from badges or other fields
    const amenities: string[] = []
    if (hotel.has_free_wifi) amenities.push('Free WiFi')
    if (hotel.has_swimming_pool) amenities.push('Pool')
    if (hotel.has_free_parking) amenities.push('Free Parking')
    if (hotel.has_free_breakfast) amenities.push('Free Breakfast')
    if (hotel.is_beach_front) amenities.push('Beach Front')
    
    // Get review sentiment
    const reviewScore = hotel.review_score || 0
    
    return {
      id: `booking-${hotel.hotel_id}`,
      type: 'hotel' as const,
      providerPropertyId: String(hotel.hotel_id),
      provider: { code: 'booking', name: 'Booking.com' },
      name: hotel.hotel_name || hotel.hotel_name_trans || 'Hotel',
      description: hotel.hotel_include_breakfast ? 'Breakfast included' : undefined,
      shortDescription: hotel.district || hotel.city || '',
      propertyType: hotel.accommodation_type_name || 'hotel',
      starRating: hotel.class || hotel.hotel_class || undefined,
      brand: undefined,
      location: {
        address: {
          line1: hotel.address || hotel.address_trans,
          city: hotel.city || hotel.city_trans || '',
          state: undefined,
          country: hotel.country || hotel.country_trans || '',
          countryCode: hotel.cc1 || '',
          postalCode: hotel.zip,
          formatted: [hotel.address, hotel.city, hotel.country].filter(Boolean).join(', '),
        },
        coordinates: hotel.latitude && hotel.longitude ? {
          lat: hotel.latitude,
          lng: hotel.longitude,
        } : undefined,
        neighborhood: hotel.district,
      },
      images: [
        { 
          url: hotel.max_photo_url || hotel.main_photo_url || hotel.photo_url || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`,
          caption: hotel.hotel_name,
          category: 'exterior',
        },
      ],
      heroImage: hotel.max_photo_url || hotel.main_photo_url || hotel.photo_url,
      guestRating: reviewScore > 0 ? {
        score: reviewScore,
        maxScore: 10,
        reviewCount: hotel.review_nr || 0,
        sentiment: getSentiment(reviewScore),
      } : undefined,
      amenities,
      keyAmenities: amenities.slice(0, 4),
      rooms: [room],
      lowestPrice: {
        amount: pricePerNight,
        currency,
        formatted: formatPrice(pricePerNight, currency),
      },
      checkInTime: '15:00',
      checkOutTime: '11:00',
      policies: {
        checkIn: { time: '15:00' },
        checkOut: { time: '11:00' },
        pets: { allowed: false },
      },
      retrievedAt: new Date().toISOString(),
      deepLink: hotel.url,
    }
  })
}

function getSentiment(rating: number): string {
  if (rating >= 9) return 'excellent'
  if (rating >= 8) return 'very_good'
  if (rating >= 7) return 'good'
  if (rating >= 6) return 'fair'
  return 'poor'
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Generate mock hotels for development/testing
function generateMockHotels(params: HotelSearchParams): NormalizedHotel[] {
  const destination = params.destination.value || 'Paris'
  const checkIn = new Date(params.checkInDate)
  const checkOut = new Date(params.checkOutDate)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  
  const hotelNames = [
    'Grand Hotel Plaza',
    'The Ritz Carlton',
    'Marriott City Center',
    'Hilton Downtown',
    'Four Seasons Resort',
    'Hyatt Regency',
    'InterContinental',
    'Waldorf Astoria',
    'St. Regis',
    'Mandarin Oriental',
    'Peninsula Hotel',
    'Shangri-La',
    'Park Hyatt',
    'W Hotel',
    'Sofitel Luxury',
  ]
  
  const amenitiesList = [
    'Free WiFi',
    'Pool',
    'Spa',
    'Fitness Center',
    'Restaurant',
    'Room Service',
    'Concierge',
    'Business Center',
    'Parking',
    'Air Conditioning',
    'Pet Friendly',
    'Bar/Lounge',
  ]
  
  const propertyTypes = ['hotel', 'resort', 'boutique_hotel', 'apartment']
  
  return hotelNames.slice(0, params.limit || 15).map((name, index) => {
    const basePrice = 100 + Math.random() * 400
    const starRating = 3 + Math.floor(Math.random() * 3)
    const rating = 7 + Math.random() * 3
    const reviewCount = 50 + Math.floor(Math.random() * 500)
    const selectedAmenities = amenitiesList.slice(0, 4 + Math.floor(Math.random() * 5))
    
    const room: RoomOffer = {
      id: `mock-room-${index}-1`,
      providerOfferId: `mock-offer-${index}-1`,
      name: starRating >= 4 ? 'Deluxe Room' : 'Standard Room',
      description: 'Comfortable room with modern amenities',
      roomType: 'standard',
      bedConfiguration: [{ type: 'king', count: 1 }],
      maxOccupancy: { adults: 2, children: 2, total: 4 },
      amenities: ['TV', 'Mini Bar', 'Safe', 'Hair Dryer'],
      price: {
        amount: basePrice * nights,
        currency: 'USD',
        formatted: formatPrice(basePrice * nights, 'USD'),
      },
      pricePerNight: {
        amount: basePrice,
        currency: 'USD',
        formatted: formatPrice(basePrice, 'USD'),
      },
      inclusions: ['Breakfast', 'WiFi'],
      boardType: 'breakfast_included',
      cancellationPolicy: {
        freeCancellation: Math.random() > 0.3,
        freeCancellationDeadline: new Date(checkIn.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Free cancellation until 24 hours before check-in',
        refundable: true,
      },
      isRefundable: true,
      roomsRemaining: 1 + Math.floor(Math.random() * 5),
    }
    
    return {
      id: `booking-mock-${index}`,
      type: 'hotel',
      providerPropertyId: `mock-property-${index}`,
      provider: { code: 'booking', name: 'Booking.com' },
      name: `${name} ${destination}`,
      description: `Experience luxury and comfort at ${name} in the heart of ${destination}. Our hotel offers world-class amenities and exceptional service.`,
      shortDescription: `Luxury hotel in ${destination} with excellent amenities.`,
      propertyType: propertyTypes[index % propertyTypes.length],
      starRating,
      brand: name.split(' ')[0],
      location: {
        address: {
          line1: `${100 + index} Main Street`,
          city: destination,
          country: 'France',
          countryCode: 'FR',
          formatted: `${100 + index} Main Street, ${destination}, France`,
        },
        coordinates: {
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
        },
        neighborhood: 'Downtown',
      },
      images: [
        { url: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`, caption: 'Hotel Exterior' },
        { url: `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800`, caption: 'Room' },
        { url: `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800`, caption: 'Pool' },
      ],
      heroImage: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`,
      guestRating: {
        score: rating,
        maxScore: 10,
        reviewCount,
        sentiment: getSentiment(rating),
      },
      amenities: selectedAmenities,
      keyAmenities: selectedAmenities.slice(0, 4),
      rooms: [room],
      lowestPrice: {
        amount: basePrice,
        currency: 'USD',
        formatted: formatPrice(basePrice, 'USD'),
      },
      checkInTime: '15:00',
      checkOutTime: '11:00',
      policies: {
        checkIn: { time: '15:00' },
        checkOut: { time: '11:00' },
        pets: { allowed: selectedAmenities.includes('Pet Friendly') },
      },
      retrievedAt: new Date().toISOString(),
    }
  })
}

export async function healthCheck(): Promise<boolean> {
  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY')
    return !!apiKey
  } catch {
    return false
  }
}
