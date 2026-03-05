/**
 * CAR RENTAL PROVIDER ADAPTER
 * 
 * Car rental search via Booking.com Car Hire API on RapidAPI.
 * Falls back to comprehensive mock data when API key is not configured.
 * 
 * RapidAPI Booking.com: uses same RAPIDAPI_KEY as hotel adapter
 */

interface CarSearchParams {
  pickupLocation: string
  dropoffLocation?: string
  pickupDate: string   // YYYY-MM-DD
  pickupTime?: string  // HH:mm
  dropoffDate: string  // YYYY-MM-DD
  dropoffTime?: string // HH:mm
  driverAge?: number
  currency?: string
  limit?: number
}

interface NormalizedCar {
  id: string
  type: 'car'
  provider: { code: string; name: string }
  vehicle: {
    name: string
    category: string
    make?: string
    model?: string
    year?: number
    imageUrl?: string
    doors?: number
    seats?: number
    luggage?: { large: number; small: number }
    transmission: string
    fuelType: string
    airConditioning: boolean
    mileage: string
  }
  rental: {
    company: { id: string; name: string; logo?: string; rating?: number }
    pickupLocation: string
    dropoffLocation: string
    pickupDate: string
    dropoffDate: string
  }
  price: {
    amount: number
    currency: string
    formatted: string
    perDay: number
    perDayFormatted: string
  }
  features: string[]
  policies: {
    fuelPolicy: string
    mileagePolicy: string
    insuranceIncluded: boolean
    freeCancellation: boolean
  }
  deepLink?: string
  retrievedAt: string
}

const RAPIDAPI_HOST = 'booking-com.p.rapidapi.com'

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
 * Search car rentals
 */
export async function searchCars(params: CarSearchParams): Promise<NormalizedCar[]> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')
  
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY not configured — cannot search car rentals')
  }
  
  try {
    // Try Booking.com car rental search via RapidAPI
    const url = new URL(`https://${RAPIDAPI_HOST}/v1/car-rental/search`)
    url.searchParams.set('pick_up_location', params.pickupLocation)
    url.searchParams.set('drop_off_location', params.dropoffLocation || params.pickupLocation)
    url.searchParams.set('pick_up_date', params.pickupDate)
    url.searchParams.set('drop_off_date', params.dropoffDate)
    url.searchParams.set('pick_up_time', params.pickupTime || '10:00')
    url.searchParams.set('drop_off_time', params.dropoffTime || '10:00')
    url.searchParams.set('driver_age', String(params.driverAge || 30))
    url.searchParams.set('currency', params.currency || 'USD')
    
    console.log(`Car rental search: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getRapidApiHeaders(),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Car rental search failed: ${response.status}`, errorText)
      throw new Error(`Car rental search failed: HTTP ${response.status} — ${errorText.substring(0, 200)}`)
    }
    
    const data = await response.json()
    const results = data?.search_results || data?.results || data?.data || []
    console.log(`Car rental API returned ${Array.isArray(results) ? results.length : 0} results`)
    
    if (!Array.isArray(results) || results.length === 0) {
      return []
    }
    
    return normalizeCarResults(results, params)
  } catch (error) {
    console.error('Car rental API error:', error)
    throw error
  }
}

function normalizeCarResults(results: any[], params: CarSearchParams): NormalizedCar[] {
  const pickupDate = new Date(params.pickupDate)
  const dropoffDate = new Date(params.dropoffDate)
  const days = Math.max(1, Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)))
  
  return results.slice(0, params.limit || 20).map((car: any, index: number) => {
    const totalPrice = car.price?.amount || car.total_price || car.price_all_days || 0
    const perDay = totalPrice / days
    const currency = car.price?.currency || car.currency || params.currency || 'USD'
    
    return {
      id: `car-${car.vehicle_id || car.id || index}`,
      type: 'car' as const,
      provider: { code: 'booking_cars', name: 'Booking.com Cars' },
      vehicle: {
        name: car.vehicle_info?.v_name || car.vehicle?.name || car.car_name || 'Rental Car',
        category: car.vehicle_info?.group || car.category || 'compact',
        make: car.vehicle_info?.make,
        model: car.vehicle_info?.model,
        imageUrl: car.vehicle_info?.image_url || car.image_url,
        doors: car.vehicle_info?.doors || 4,
        seats: car.vehicle_info?.seats || 5,
        luggage: { large: car.vehicle_info?.big_suitcase || 2, small: car.vehicle_info?.small_suitcase || 1 },
        transmission: car.vehicle_info?.transmission === 'A' ? 'automatic' : 'manual',
        fuelType: car.vehicle_info?.fuel_type || 'petrol',
        airConditioning: car.vehicle_info?.aircon !== false,
        mileage: car.free_km === 0 ? 'unlimited' : `${car.free_km || 'unlimited'} km`,
      },
      rental: {
        company: {
          id: car.supplier?.id || car.supplier_name || 'unknown',
          name: car.supplier?.name || car.supplier_name || 'Rental Company',
          logo: car.supplier?.logo_url,
          rating: car.supplier?.rating,
        },
        pickupLocation: params.pickupLocation,
        dropoffLocation: params.dropoffLocation || params.pickupLocation,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
      },
      price: {
        amount: Math.round(totalPrice * 100) / 100,
        currency,
        formatted: formatPrice(totalPrice, currency),
        perDay: Math.round(perDay * 100) / 100,
        perDayFormatted: formatPrice(perDay, currency),
      },
      features: extractFeatures(car),
      policies: {
        fuelPolicy: car.fuel_policy || 'full_to_full',
        mileagePolicy: car.free_km === 0 ? 'unlimited' : 'limited',
        insuranceIncluded: car.insurance_included || false,
        freeCancellation: car.free_cancellation || true,
      },
      deepLink: car.deeplink || car.url,
      retrievedAt: new Date().toISOString(),
    }
  })
}

function extractFeatures(car: any): string[] {
  const features: string[] = []
  if (car.vehicle_info?.aircon !== false) features.push('Air Conditioning')
  if (car.vehicle_info?.transmission === 'A') features.push('Automatic')
  else features.push('Manual')
  if (car.free_cancellation) features.push('Free Cancellation')
  if (car.free_km === 0) features.push('Unlimited Mileage')
  return features
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
