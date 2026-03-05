/**
 * EXPERIENCE/ACTIVITY PROVIDER ADAPTER
 * 
 * Experience/activity search via GetYourGuide-style API on RapidAPI.
 * Falls back to comprehensive mock data when API key is not configured.
 * 
 * Uses same RAPIDAPI_KEY as other adapters.
 */

interface ExperienceSearchParams {
  destination: {
    type: 'city' | 'coordinates' | 'poi'
    value: string
    coordinates?: { lat: number; lng: number }
  }
  dates: {
    startDate: string  // YYYY-MM-DD
    endDate?: string
    flexibleDates?: boolean
  }
  participants: {
    adults: number
    children?: number
  }
  category?: string
  currency?: string
  language?: string
  limit?: number
}

interface NormalizedExperience {
  id: string
  type: 'experience'
  provider: { code: string; name: string }
  title: string
  description: string
  shortDescription: string
  category: string
  subcategory?: string
  location: {
    city: string
    country: string
    address?: string
    coordinates?: { lat: number; lng: number }
    meetingPoint?: string
  }
  images: Array<{ url: string; caption?: string }>
  heroImage: string
  duration: {
    value: number
    unit: 'hours' | 'minutes' | 'days'
    formatted: string
  }
  rating: {
    score: number
    maxScore: number
    reviewCount: number
  }
  price: {
    amount: number
    currency: string
    formatted: string
    perPerson: boolean
  }
  highlights: string[]
  included: string[]
  notIncluded: string[]
  languages: string[]
  maxGroupSize?: number
  instantConfirmation: boolean
  freeCancellation: boolean
  cancellationDeadlineHours?: number
  availability: {
    nextAvailable?: string
    spotsRemaining?: number
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
 * Search experiences/activities
 */
export async function searchExperiences(params: ExperienceSearchParams): Promise<NormalizedExperience[]> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')
  
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY not configured — cannot search experiences')
  }
  
  try {
    // Try Booking.com attractions search
    const url = new URL(`https://${RAPIDAPI_HOST}/v1/attraction/search`)
    url.searchParams.set('location', params.destination.value)
    url.searchParams.set('date', params.dates.startDate)
    url.searchParams.set('adults', String(params.participants.adults || 2))
    url.searchParams.set('currency', params.currency || 'USD')
    url.searchParams.set('languagecode', params.language || 'en-us')
    
    console.log(`Experience search: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getRapidApiHeaders(),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Experience search failed: ${response.status}`, errorText)
      throw new Error(`Experience search failed: HTTP ${response.status} — ${errorText.substring(0, 200)}`)
    }
    
    const data = await response.json()
    const results = data?.products || data?.results || data?.data || data?.attractions || []
    console.log(`Experience API returned ${Array.isArray(results) ? results.length : 0} results`)
    
    if (!Array.isArray(results) || results.length === 0) {
      return []
    }
    
    return normalizeExperienceResults(results, params)
  } catch (error) {
    console.error('Experience API error:', error)
    throw error
  }
}

function normalizeExperienceResults(results: any[], params: ExperienceSearchParams): NormalizedExperience[] {
  const currency = params.currency || 'USD'
  
  return results.slice(0, params.limit || 15).map((exp: any, index: number) => {
    const price = exp.representative_price?.amount || exp.price?.amount || exp.price || 0
    const duration = exp.duration_in_minutes || exp.duration || 120
    
    return {
      id: `exp-${exp.id || exp.product_id || index}`,
      type: 'experience' as const,
      provider: { code: 'booking_attractions', name: 'Booking.com' },
      title: exp.name || exp.title || 'Activity',
      description: exp.description || exp.short_description || '',
      shortDescription: exp.short_description || (exp.description || '').substring(0, 150),
      category: exp.category?.name || exp.primary_category || 'tours',
      location: {
        city: params.destination.value,
        country: '',
        address: exp.meeting_point || exp.address,
        meetingPoint: exp.meeting_point,
      },
      images: (exp.photos || exp.images || []).map((img: any) => ({
        url: typeof img === 'string' ? img : img.url || img.src,
        caption: img.caption,
      })),
      heroImage: exp.photo_url || exp.cover_image_url || (exp.photos?.[0]?.url) || `https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800`,
      duration: {
        value: duration >= 60 ? Math.round(duration / 60) : duration,
        unit: duration >= 60 ? 'hours' : 'minutes',
        formatted: duration >= 60 ? `${Math.round(duration / 60)}h` : `${duration}min`,
      },
      rating: {
        score: exp.review_stats?.combined_numeric_stats?.average || exp.rating || 4.5,
        maxScore: 5,
        reviewCount: exp.review_stats?.total_count || exp.review_count || 0,
      },
      price: {
        amount: typeof price === 'number' ? price : parseFloat(price) || 0,
        currency,
        formatted: formatPrice(typeof price === 'number' ? price : parseFloat(price) || 0, currency),
        perPerson: true,
      },
      highlights: exp.highlights || exp.key_features || [],
      included: exp.inclusions || [],
      notIncluded: exp.exclusions || [],
      languages: exp.languages || ['English'],
      maxGroupSize: exp.max_group_size,
      instantConfirmation: exp.instant_confirmation !== false,
      freeCancellation: exp.free_cancellation !== false,
      cancellationDeadlineHours: exp.cancellation_deadline_hours || 24,
      availability: {
        nextAvailable: params.dates.startDate,
        spotsRemaining: exp.availability?.remaining,
      },
      deepLink: exp.url || exp.deeplink,
      retrievedAt: new Date().toISOString(),
    }
  })
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
