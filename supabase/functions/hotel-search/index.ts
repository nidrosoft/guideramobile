/**
 * HOTEL SEARCH EDGE FUNCTION
 * 
 * Integrates with Amadeus and Expedia Rapid API for hotel search.
 * Supports location-based search, date ranges, and room configurations.
 * 
 * Environment Variables Required:
 * - AMADEUS_CLIENT_ID
 * - AMADEUS_CLIENT_SECRET
 * - EXPEDIA_API_KEY
 * - EXPEDIA_SECRET
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface HotelSearchRequest {
  provider: 'amadeus' | 'expedia' | 'auto';
  destination: {
    type: 'city' | 'coordinates' | 'hotel_id';
    value: string;
    latitude?: number;
    longitude?: number;
  };
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  guests: {
    adults: number;
    children: number;
    childAges?: number[];
  };
  filters?: {
    starRating?: number[];
    priceMin?: number;
    priceMax?: number;
    amenities?: string[];
    propertyTypes?: string[];
  };
  currency?: string;
  limit?: number;
}

interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

// Cache for Amadeus token
let amadeusTokenCache: AmadeusToken | null = null;

// Get Amadeus access token
async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  if (amadeusTokenCache && amadeusTokenCache.expires_at > Date.now()) {
    return amadeusTokenCache.access_token;
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.status}`);
  }

  const data = await response.json();
  
  amadeusTokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

// Search hotels with Amadeus
async function searchAmadeus(request: HotelSearchRequest): Promise<unknown[]> {
  const token = await getAmadeusToken();
  
  // Step 1: Get hotel IDs by city
  let hotelIds: string[] = [];
  
  if (request.destination.type === 'city') {
    const cityParams = new URLSearchParams({
      cityCode: request.destination.value.toUpperCase(),
    });

    const cityResponse = await fetch(
      `https://api.amadeus.com/v1/reference-data/locations/hotels/by-city?${cityParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (cityResponse.ok) {
      const cityData = await cityResponse.json();
      hotelIds = (cityData.data || []).slice(0, 50).map((h: { hotelId: string }) => h.hotelId);
    }
  } else if (request.destination.type === 'coordinates' && request.destination.latitude && request.destination.longitude) {
    const geoParams = new URLSearchParams({
      latitude: String(request.destination.latitude),
      longitude: String(request.destination.longitude),
      radius: '50',
      radiusUnit: 'KM',
    });

    const geoResponse = await fetch(
      `https://api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?${geoParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      hotelIds = (geoData.data || []).slice(0, 50).map((h: { hotelId: string }) => h.hotelId);
    }
  }

  if (hotelIds.length === 0) {
    return [];
  }

  // Step 2: Get hotel offers
  const offersParams = new URLSearchParams({
    hotelIds: hotelIds.join(','),
    checkInDate: request.checkInDate,
    checkOutDate: request.checkOutDate,
    adults: String(request.guests.adults),
    roomQuantity: String(request.rooms),
    currency: request.currency || 'USD',
  });

  const offersResponse = await fetch(
    `https://api.amadeus.com/v3/shopping/hotel-offers?${offersParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!offersResponse.ok) {
    const error = await offersResponse.text();
    console.error('Amadeus hotel offers error:', error);
    throw new Error(`Amadeus hotel search failed: ${offersResponse.status}`);
  }

  const offersData = await offersResponse.json();
  return normalizeAmadeusHotels(offersData.data || []);
}

// Normalize Amadeus hotel results
function normalizeAmadeusHotels(hotels: unknown[]): unknown[] {
  return hotels.map((hotel: unknown) => {
    const h = hotel as Record<string, unknown>;
    const hotelInfo = h.hotel as Record<string, unknown>;
    const offers = h.offers as Array<{
      id: string;
      price: { total: string; currency: string; base?: string };
      room: { type: string; description?: { text: string } };
      policies?: { cancellation?: { description?: { text: string } } };
    }>;

    const lowestOffer = offers?.[0];
    const price = lowestOffer?.price;

    return {
      id: hotelInfo.hotelId,
      provider: { code: 'amadeus', name: 'Amadeus' },
      type: 'hotel',
      name: hotelInfo.name,
      chainCode: hotelInfo.chainCode,
      location: {
        address: (hotelInfo.address as Record<string, unknown>)?.lines?.join(', '),
        city: (hotelInfo.address as Record<string, unknown>)?.cityName,
        country: (hotelInfo.address as Record<string, unknown>)?.countryCode,
        latitude: (hotelInfo.geoCode as Record<string, number>)?.latitude,
        longitude: (hotelInfo.geoCode as Record<string, number>)?.longitude,
      },
      starRating: hotelInfo.rating ? parseInt(String(hotelInfo.rating), 10) : null,
      amenities: hotelInfo.amenities || [],
      lowestPrice: price ? {
        amount: parseFloat(price.total),
        currency: price.currency,
        formatted: `${price.currency} ${price.total}`,
        perNight: price.base ? parseFloat(price.base) : null,
      } : null,
      offers: offers?.map(offer => ({
        id: offer.id,
        roomType: offer.room?.type,
        description: offer.room?.description?.text,
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency,
        },
        cancellationPolicy: offer.policies?.cancellation?.description?.text,
      })),
      images: [], // Amadeus doesn't return images in search
      raw: h,
    };
  });
}

// Search hotels with Expedia Rapid API
async function searchExpedia(request: HotelSearchRequest): Promise<unknown[]> {
  const apiKey = Deno.env.get('EXPEDIA_API_KEY');
  const apiSecret = Deno.env.get('EXPEDIA_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Expedia credentials not configured');
  }

  // Generate signature for Expedia API
  const timestamp = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + apiSecret + timestamp);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Build occupancy string
  const occupancy = `${request.guests.adults}`;
  
  const params = new URLSearchParams({
    checkin: request.checkInDate,
    checkout: request.checkOutDate,
    currency: request.currency || 'USD',
    language: 'en-US',
    country_code: 'US',
    occupancy: occupancy,
    property_id: request.destination.value, // For direct property search
    rate_plan_count: '5',
  });

  // For city search, use region_id or coordinates
  if (request.destination.type === 'city') {
    params.delete('property_id');
    // Would need to resolve city to region_id first
    // For now, use coordinates if available
    if (request.destination.latitude && request.destination.longitude) {
      params.set('latitude', String(request.destination.latitude));
      params.set('longitude', String(request.destination.longitude));
      params.set('radius', '25');
      params.set('unit', 'km');
    }
  }

  const response = await fetch(
    `https://api.ean.com/v3/properties/availability?${params}`,
    {
      headers: {
        'Authorization': `EAN apikey=${apiKey},signature=${signature},timestamp=${timestamp}`,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Expedia search error:', error);
    throw new Error(`Expedia search failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeExpediaHotels(data || []);
}

// Normalize Expedia hotel results
function normalizeExpediaHotels(properties: unknown[]): unknown[] {
  if (!Array.isArray(properties)) {
    properties = [properties];
  }

  return properties.map((property: unknown) => {
    const p = property as Record<string, unknown>;
    const rooms = p.rooms as Array<{
      id: string;
      room_name: string;
      rates: Array<{
        id: string;
        occupancy_pricing: Record<string, { totals: { inclusive: { amount: string } } }>;
        cancel_penalties?: Array<{ description: string }>;
      }>;
    }>;

    // Get lowest price from all rooms
    let lowestPrice: number | null = null;
    let currency = 'USD';

    rooms?.forEach(room => {
      room.rates?.forEach(rate => {
        const pricing = Object.values(rate.occupancy_pricing || {})[0];
        if (pricing?.totals?.inclusive?.amount) {
          const amount = parseFloat(pricing.totals.inclusive.amount);
          if (lowestPrice === null || amount < lowestPrice) {
            lowestPrice = amount;
          }
        }
      });
    });

    return {
      id: p.property_id,
      provider: { code: 'expedia', name: 'Expedia' },
      type: 'hotel',
      name: p.name,
      location: {
        address: (p.address as Record<string, unknown>)?.line_1,
        city: (p.address as Record<string, unknown>)?.city,
        country: (p.address as Record<string, unknown>)?.country_code,
        latitude: (p.coordinates as Record<string, number>)?.latitude,
        longitude: (p.coordinates as Record<string, number>)?.longitude,
      },
      starRating: p.star_rating ? parseFloat(String(p.star_rating)) : null,
      guestRating: p.guest_rating ? parseFloat(String(p.guest_rating)) : null,
      amenities: p.amenities || [],
      lowestPrice: lowestPrice ? {
        amount: lowestPrice,
        currency,
        formatted: `${currency} ${lowestPrice.toFixed(2)}`,
      } : null,
      images: (p.images as Array<{ url: string }>)?.map(img => img.url) || [],
      offers: rooms?.flatMap(room => 
        room.rates?.map(rate => ({
          id: rate.id,
          roomId: room.id,
          roomType: room.room_name,
          cancellationPolicy: rate.cancel_penalties?.[0]?.description,
        })) || []
      ),
      raw: p,
    };
  });
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const request: HotelSearchRequest = await req.json();
    
    // Validate request
    if (!request.destination || !request.checkInDate || !request.checkOutDate) {
      throw new Error('Destination and dates are required');
    }

    let results: unknown[] = [];
    const providers: { code: string; responseTime: number; resultCount: number }[] = [];

    const provider = request.provider || 'auto';

    if (provider === 'amadeus' || provider === 'auto') {
      try {
        const amadeusStart = Date.now();
        const amadeusResults = await searchAmadeus(request);
        providers.push({
          code: 'amadeus',
          responseTime: Date.now() - amadeusStart,
          resultCount: amadeusResults.length,
        });
        results = results.concat(amadeusResults);
      } catch (error) {
        console.error('Amadeus hotel error:', error);
        if (provider === 'amadeus') throw error;
      }
    }

    if (provider === 'expedia' || provider === 'auto') {
      try {
        const expediaStart = Date.now();
        const expediaResults = await searchExpedia(request);
        providers.push({
          code: 'expedia',
          responseTime: Date.now() - expediaStart,
          resultCount: expediaResults.length,
        });
        results = results.concat(expediaResults);
      } catch (error) {
        console.error('Expedia hotel error:', error);
        if (provider === 'expedia') throw error;
      }
    }

    // Sort by price
    results.sort((a, b) => {
      const priceA = (a as { lowestPrice?: { amount: number } }).lowestPrice?.amount || Infinity;
      const priceB = (b as { lowestPrice?: { amount: number } }).lowestPrice?.amount || Infinity;
      return priceA - priceB;
    });

    // Apply filters
    if (request.filters) {
      if (request.filters.starRating?.length) {
        results = results.filter(r => {
          const rating = (r as { starRating?: number }).starRating;
          return rating && request.filters!.starRating!.includes(rating);
        });
      }
      if (request.filters.priceMin !== undefined) {
        results = results.filter(r => {
          const price = (r as { lowestPrice?: { amount: number } }).lowestPrice?.amount;
          return price && price >= request.filters!.priceMin!;
        });
      }
      if (request.filters.priceMax !== undefined) {
        results = results.filter(r => {
          const price = (r as { lowestPrice?: { amount: number } }).lowestPrice?.amount;
          return price && price <= request.filters!.priceMax!;
        });
      }
    }

    // Limit results
    if (request.limit) {
      results = results.slice(0, request.limit);
    }

    // Calculate price range
    const prices = results
      .map(r => (r as { lowestPrice?: { amount: number } }).lowestPrice?.amount)
      .filter((p): p is number => p !== undefined && p !== null);
    
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    } : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results,
          totalCount: results.length,
          providers,
          priceRange,
          searchDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Hotel search error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'HOTEL_SEARCH_ERROR',
          message: (error as Error).message || 'Hotel search failed',
        },
        searchDuration: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
