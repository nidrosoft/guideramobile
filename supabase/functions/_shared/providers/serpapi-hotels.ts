/**
 * SERPAPI GOOGLE HOTELS ADAPTER
 * 
 * Uses SerpAPI to scrape Google Hotels for hotel search results.
 * Primary hotel search provider (replacing Booking.com RapidAPI).
 * 
 * API Docs: https://serpapi.com/google-hotels-api
 * 
 * Features:
 * - Aggregated prices from multiple OTAs (Booking.com, Expedia, Hotels.com, etc.)
 * - Hotel images, ratings, amenities
 * - Booking URLs to each OTA
 * - Same SerpAPI credit pool as Google Flights
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
  nearbyPlaces?: Array<{ name: string; transportType: string; duration: string }>
  dealBadge?: string
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
  sourceOta?: string
  sourceUrl?: string
}

const SERPAPI_BASE = 'https://serpapi.com/search.json'

export async function searchHotels(params: HotelSearchParams): Promise<NormalizedHotel[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY')
  
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured — cannot search Google Hotels')
  }
  
  const destinationName = params.destination.value
  if (!destinationName) {
    throw new Error('Missing destination for hotel search')
  }
  
  // Calculate number of nights
  const checkIn = new Date(params.checkInDate)
  const checkOut = new Date(params.checkOutDate)
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Build SerpAPI Google Hotels query
  const searchParams = new URLSearchParams({
    engine: 'google_hotels',
    q: `Hotels in ${destinationName}`,
    check_in_date: params.checkInDate,
    check_out_date: params.checkOutDate,
    adults: String(params.rooms[0]?.adults || 2),
    currency: params.currency || 'USD',
    hl: 'en',
    gl: 'us',
    api_key: apiKey,
  })
  
  // Add children if present
  if (params.rooms[0]?.children && params.rooms[0].children > 0) {
    searchParams.set('children', String(params.rooms[0].children))
    if (params.rooms[0].childrenAges?.length) {
      searchParams.set('children_ages', params.rooms[0].childrenAges.join(','))
    }
  }
  
  const url = `${SERPAPI_BASE}?${searchParams.toString()}`
  console.log(`SerpAPI Google Hotels search: destination=${destinationName}, checkin=${params.checkInDate}, checkout=${params.checkOutDate}`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`SerpAPI Google Hotels failed: ${response.status}`, errorText.substring(0, 300))
    throw new Error(`SerpAPI Google Hotels failed: HTTP ${response.status} — ${errorText.substring(0, 200)}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    console.error('SerpAPI error:', data.error)
    throw new Error(`SerpAPI error: ${data.error}`)
  }
  
  const properties = data.properties || []
  console.log(`SerpAPI Google Hotels returned ${properties.length} properties`)
  
  const limit = params.limit || 15
  return normalizeGoogleHotelsResults(properties.slice(0, limit), params, nights)
}

function normalizeGoogleHotelsResults(
  properties: any[],
  params: HotelSearchParams,
  nights: number
): NormalizedHotel[] {
  const currency = params.currency || 'USD'
  
  return properties.map((hotel: any, index: number) => {
    // Extract price — Google Hotels returns total_rate or rate_per_night
    const totalPrice = hotel.total_rate?.extracted_lowest || hotel.rate_per_night?.extracted_lowest * nights || 0
    const pricePerNight = hotel.rate_per_night?.extracted_lowest || (totalPrice / nights) || 0
    
    // Extract images
    const images: Array<{ url: string; caption?: string; category?: string }> = []
    if (hotel.images) {
      hotel.images.forEach((img: any) => {
        if (typeof img === 'string') {
          images.push({ url: img, category: 'general' })
        } else if (img.thumbnail || img.original_image) {
          images.push({ 
            url: img.original_image || img.thumbnail, 
            caption: img.description,
            category: 'general',
          })
        }
      })
    }
    // Use thumbnail as fallback
    if (images.length === 0 && hotel.thumbnail) {
      images.push({ url: hotel.thumbnail, category: 'exterior' })
    }
    
    // Extract amenities
    const amenities: string[] = hotel.amenities || []
    
    // Extract nearby places
    const nearbyPlaces = (hotel.nearby_places?.places || []).map((p: any) => ({
      name: p.name || '',
      transportType: p.transportations?.[0]?.type || 'walk',
      duration: p.transportations?.[0]?.duration || '',
    }))
    
    // Extract guest rating
    let guestRating: NormalizedHotel['guestRating']
    if (hotel.overall_rating) {
      guestRating = {
        score: hotel.overall_rating,
        maxScore: 5,
        reviewCount: hotel.reviews || 0,
        sentiment: getSentiment(hotel.overall_rating, 5),
      }
    }
    
    // Build room offers from rate options
    const rooms: RoomOffer[] = []
    if (hotel.rate_per_night) {
      rooms.push({
        id: `serpapi-room-${index}-0`,
        providerOfferId: `serpapi-${index}`,
        name: 'Standard Room',
        roomType: 'standard',
        bedConfiguration: [{ type: 'double', count: 1 }],
        maxOccupancy: {
          adults: params.rooms[0]?.adults || 2,
          children: params.rooms[0]?.children || 0,
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
        inclusions: hotel.deal ? [hotel.deal] : [],
        boardType: 'room_only',
        cancellationPolicy: {
          freeCancellation: hotel.deal?.toLowerCase()?.includes('free cancellation') || false,
          summary: hotel.deal || 'Standard rate',
          refundable: hotel.deal?.toLowerCase()?.includes('free cancellation') || false,
        },
        isRefundable: hotel.deal?.toLowerCase()?.includes('free cancellation') || false,
      })
    }
    
    // Extract deal badge
    const dealBadge = hotel.deal_description || hotel.deal || undefined
    
    // Build booking link — hotel.link or hotel.serpapi_property_details_link
    const deepLink = hotel.link || `https://www.google.com/travel/hotels/entity/${hotel.property_token || ''}`
    
    return {
      id: `serpapi-gh-${hotel.property_token || index}`,
      type: 'hotel' as const,
      providerPropertyId: hotel.property_token || String(index),
      provider: { code: 'google_hotels', name: 'Google Hotels' },
      name: hotel.name || 'Hotel',
      description: hotel.description,
      shortDescription: hotel.hotel_class ? `${hotel.hotel_class}-star hotel` : undefined,
      propertyType: hotel.type || 'hotel',
      starRating: hotel.hotel_class,
      brand: undefined,
      location: {
        address: {
          line1: hotel.address,
          city: params.destination.value,
          country: '',
          countryCode: '',
          formatted: hotel.address || params.destination.value,
        },
        coordinates: hotel.gps_coordinates ? {
          lat: hotel.gps_coordinates.latitude,
          lng: hotel.gps_coordinates.longitude,
        } : undefined,
        neighborhood: hotel.neighborhood,
      },
      images,
      heroImage: images[0]?.url || hotel.thumbnail,
      guestRating,
      amenities,
      keyAmenities: amenities.slice(0, 4),
      rooms,
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
      deepLink,
      nearbyPlaces,
      dealBadge,
    }
  })
}

function getSentiment(rating: number, maxScore: number): string {
  const normalized = (rating / maxScore) * 10
  if (normalized >= 9) return 'excellent'
  if (normalized >= 8) return 'very_good'
  if (normalized >= 7) return 'good'
  if (normalized >= 6) return 'fair'
  return 'poor'
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
