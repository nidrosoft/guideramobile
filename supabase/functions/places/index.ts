/**
 * PLACES & POI EDGE FUNCTION
 * 
 * Integrates with Google Places API for location search and details.
 * Supports place search, autocomplete, details, and nearby search.
 * 
 * Environment Variables Required:
 * - GOOGLE_PLACES_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface PlacesRequest {
  action: 'search' | 'autocomplete' | 'details' | 'nearby' | 'photos';
  query?: string;
  placeId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // meters
  type?: string; // restaurant, hotel, attraction, etc.
  language?: string;
  photoReference?: string;
  maxWidth?: number;
}

interface Place {
  placeId: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  photos?: string[];
  vicinity?: string;
  website?: string;
  phoneNumber?: string;
  openingHours?: string[];
  reviews?: Review[];
}

interface Review {
  authorName: string;
  rating: number;
  text: string;
  time: string;
  profilePhotoUrl?: string;
}

interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

// Search places by text query
async function searchPlaces(
  apiKey: string,
  query: string,
  location?: { latitude: number; longitude: number },
  radius?: number,
  type?: string,
  language?: string
): Promise<Place[]> {
  const params = new URLSearchParams({
    query,
    key: apiKey,
  });

  if (location) {
    params.append('location', `${location.latitude},${location.longitude}`);
  }
  if (radius) {
    params.append('radius', String(radius));
  }
  if (type) {
    params.append('type', type);
  }
  if (language) {
    params.append('language', language);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status} - ${data.error_message || ''}`);
  }

  return (data.results || []).map((place: Record<string, unknown>) => normalizePlace(place, apiKey));
}

// Autocomplete for place search
async function autocomplete(
  apiKey: string,
  input: string,
  location?: { latitude: number; longitude: number },
  radius?: number,
  types?: string,
  language?: string
): Promise<AutocompleteResult[]> {
  const params = new URLSearchParams({
    input,
    key: apiKey,
  });

  if (location) {
    params.append('location', `${location.latitude},${location.longitude}`);
  }
  if (radius) {
    params.append('radius', String(radius));
  }
  if (types) {
    params.append('types', types);
  }
  if (language) {
    params.append('language', language);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return (data.predictions || []).map((prediction: Record<string, unknown>) => ({
    placeId: prediction.place_id,
    description: prediction.description,
    mainText: (prediction.structured_formatting as Record<string, string>)?.main_text || '',
    secondaryText: (prediction.structured_formatting as Record<string, string>)?.secondary_text || '',
    types: prediction.types || [],
  }));
}

// Get place details
async function getPlaceDetails(
  apiKey: string,
  placeId: string,
  language?: string
): Promise<Place> {
  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'geometry',
    'types',
    'rating',
    'user_ratings_total',
    'price_level',
    'opening_hours',
    'photos',
    'website',
    'formatted_phone_number',
    'reviews',
    'vicinity',
  ].join(',');

  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key: apiKey,
  });

  if (language) {
    params.append('language', language);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return normalizePlace(data.result, apiKey);
}

// Search nearby places
async function nearbySearch(
  apiKey: string,
  location: { latitude: number; longitude: number },
  radius: number,
  type?: string,
  keyword?: string,
  language?: string
): Promise<Place[]> {
  const params = new URLSearchParams({
    location: `${location.latitude},${location.longitude}`,
    radius: String(radius),
    key: apiKey,
  });

  if (type) {
    params.append('type', type);
  }
  if (keyword) {
    params.append('keyword', keyword);
  }
  if (language) {
    params.append('language', language);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return (data.results || []).map((place: Record<string, unknown>) => normalizePlace(place, apiKey));
}

// Get photo URL
function getPhotoUrl(photoReference: string, apiKey: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

// Normalize place data
function normalizePlace(place: Record<string, unknown>, apiKey: string): Place {
  const geometry = place.geometry as Record<string, unknown>;
  const location = geometry?.location as Record<string, number>;
  const photos = place.photos as Array<{ photo_reference: string }>;
  const openingHours = place.opening_hours as Record<string, unknown>;
  const reviews = place.reviews as Array<Record<string, unknown>>;

  return {
    placeId: place.place_id as string,
    name: place.name as string,
    address: (place.formatted_address || place.vicinity) as string,
    location: {
      latitude: location?.lat || 0,
      longitude: location?.lng || 0,
    },
    types: (place.types || []) as string[],
    rating: place.rating as number | undefined,
    userRatingsTotal: place.user_ratings_total as number | undefined,
    priceLevel: place.price_level as number | undefined,
    openNow: (openingHours?.open_now as boolean) || undefined,
    photos: photos?.slice(0, 5).map(p => getPhotoUrl(p.photo_reference, apiKey)) || [],
    vicinity: place.vicinity as string | undefined,
    website: place.website as string | undefined,
    phoneNumber: place.formatted_phone_number as string | undefined,
    openingHours: (openingHours?.weekday_text as string[]) || undefined,
    reviews: reviews?.slice(0, 5).map(r => ({
      authorName: r.author_name as string,
      rating: r.rating as number,
      text: r.text as string,
      time: new Date((r.time as number) * 1000).toISOString(),
      profilePhotoUrl: r.profile_photo_url as string | undefined,
    })),
  };
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const request: PlacesRequest = await req.json();
    let response: unknown;

    switch (request.action) {
      case 'search': {
        if (!request.query) {
          throw new Error('Query is required for search');
        }
        const places = await searchPlaces(
          apiKey,
          request.query,
          request.location,
          request.radius,
          request.type,
          request.language
        );
        response = { places, count: places.length };
        break;
      }

      case 'autocomplete': {
        if (!request.query) {
          throw new Error('Query is required for autocomplete');
        }
        const predictions = await autocomplete(
          apiKey,
          request.query,
          request.location,
          request.radius,
          request.type,
          request.language
        );
        response = { predictions, count: predictions.length };
        break;
      }

      case 'details': {
        if (!request.placeId) {
          throw new Error('Place ID is required for details');
        }
        const place = await getPlaceDetails(apiKey, request.placeId, request.language);
        response = { place };
        break;
      }

      case 'nearby': {
        if (!request.location) {
          throw new Error('Location is required for nearby search');
        }
        const places = await nearbySearch(
          apiKey,
          request.location,
          request.radius || 1000,
          request.type,
          request.query,
          request.language
        );
        response = { places, count: places.length };
        break;
      }

      case 'photos': {
        if (!request.photoReference) {
          throw new Error('Photo reference is required');
        }
        const photoUrl = getPhotoUrl(
          request.photoReference,
          apiKey,
          request.maxWidth || 400
        );
        response = { photoUrl };
        break;
      }

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        meta: {
          provider: 'google_places',
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Places function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'PLACES_ERROR',
          message: (error as Error).message || 'Places request failed',
        },
        meta: {
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
