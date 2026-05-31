/**
 * GEMINI LIVE TOOLS
 *
 * Function-calling tools for Meena (the Live AI travel companion).
 * Each tool has:
 *   - a declaration (sent to Gemini in the setup message), and
 *   - a handler (executed locally when Gemini emits a toolCall).
 *
 * Handlers return { result, card }:
 *   - `result`  → concise data sent back to Gemini as the functionResponse
 *                 so it can narrate a short spoken summary.
 *   - `card`    → optional rich UI payload rendered in the Live transcript
 *                 (generative UI). The model is told the cards are already
 *                 visible, so it stays brief verbally.
 */

import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { supabase, getAuthenticatedEdgeFunctionHeaders } from '@/lib/supabase/client';
import type { LivePlaceCard, LiveToolCard } from '../types/aiVision.types';

// ─── Tool declarations (sent to Gemini) ──────────────────────

export const LIVE_TOOL_DECLARATIONS = [
  {
    name: 'find_nearby_places',
    description:
      "Find places near the user's current location — restaurants, cafes, bars, attractions, museums, hotels, pharmacies, ATMs, groceries, parks, or shopping. Use this whenever the user asks what is 'around here', 'nearby', 'close by', where to eat/drink/visit, or for local recommendations. The app renders rich cards automatically, so keep your spoken reply short.",
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'The kind of place to search for.',
          enum: [
            'restaurant',
            'cafe',
            'bar',
            'attraction',
            'museum',
            'hotel',
            'pharmacy',
            'atm',
            'groceries',
            'park',
            'shopping',
            'nightlife',
          ],
        },
        keyword: {
          type: 'STRING',
          description:
            "Optional refinement, e.g. a cuisine or vibe like 'ramen', 'vegan', 'rooftop', 'coffee'.",
        },
        openNow: {
          type: 'BOOLEAN',
          description: 'If true, only return places that are currently open.',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'open_place_on_map',
    description:
      'Open the native maps app with directions/location for a specific place the user wants to go to. Use after recommending a place, when the user says things like "take me there", "show me on the map", or "how do I get there".',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The place name to open on the map.' },
        lat: { type: 'NUMBER', description: 'Latitude of the place, if known.' },
        lng: { type: 'NUMBER', description: 'Longitude of the place, if known.' },
      },
      required: ['name'],
    },
  },
] as const;

// ─── Handler types ───────────────────────────────────────────

export interface ToolResult {
  /** Concise data sent back to Gemini so it can narrate. */
  result: Record<string, unknown>;
  /** Optional rich UI rendered in the transcript. */
  card?: LiveToolCard;
}

type ToolHandler = (args: Record<string, any>) => Promise<ToolResult>;

// ─── Helpers ─────────────────────────────────────────────────

const CATEGORY_TO_GOOGLE_TYPE: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  bar: 'bar',
  attraction: 'tourist_attraction',
  museum: 'museum',
  hotel: 'lodging',
  pharmacy: 'pharmacy',
  atm: 'atm',
  groceries: 'supermarket',
  park: 'park',
  shopping: 'shopping_mall',
  nightlife: 'night_club',
};

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function getUserCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return null;
  }
}

// ─── Handlers ────────────────────────────────────────────────

const findNearbyPlaces: ToolHandler = async (args) => {
  const category = String(args.category || 'restaurant');
  const keyword = typeof args.keyword === 'string' ? args.keyword : undefined;
  const openNowFilter = args.openNow === true;
  const type = CATEGORY_TO_GOOGLE_TYPE[category] || 'point_of_interest';

  const coords = await getUserCoords();
  if (!coords) {
    return {
      result: {
        error: 'no_location',
        message:
          'Location permission is off, so I cannot search nearby. Ask the user to enable location.',
      },
    };
  }

  const headers = await getAuthenticatedEdgeFunctionHeaders();
  const { data, error } = await supabase.functions.invoke('google-api-proxy', {
    body: {
      action: 'places_nearby',
      latitude: coords.lat,
      longitude: coords.lng,
      type,
      keyword,
      radius: category === 'attraction' || category === 'museum' ? 6000 : 2500,
    },
    headers,
  });

  if (error || !data?.results) {
    return { result: { error: 'search_failed', message: 'The nearby search failed.' } };
  }

  let results: any[] = Array.isArray(data.results) ? data.results : [];
  if (openNowFilter) {
    results = results.filter((r) => r.opening_hours?.open_now === true);
  }

  const places: LivePlaceCard[] = results
    .map((r) => {
      const loc = r.geometry?.location;
      const distanceMeters =
        loc?.lat != null
          ? haversineMeters(coords.lat, coords.lng, loc.lat, loc.lng)
          : undefined;
      return {
        id: r.place_id || `${r.name}-${distanceMeters ?? Math.random()}`,
        name: r.name || 'Unknown',
        category: Array.isArray(r.types) ? r.types[0]?.replace(/_/g, ' ') : category,
        rating: typeof r.rating === 'number' ? r.rating : undefined,
        reviewCount:
          typeof r.user_ratings_total === 'number' ? r.user_ratings_total : undefined,
        priceLevel: typeof r.price_level === 'number' ? r.price_level : undefined,
        distanceMeters,
        openNow: r.opening_hours?.open_now,
        address: r.vicinity,
        lat: loc?.lat,
        lng: loc?.lng,
      } as LivePlaceCard;
    })
    .sort((a, b) => (a.distanceMeters ?? 1e9) - (b.distanceMeters ?? 1e9))
    .slice(0, 6);

  if (places.length === 0) {
    return {
      result: {
        count: 0,
        message: `No ${category} found nearby. Suggest widening the search or trying a different category.`,
      },
    };
  }

  // Concise payload for the model to narrate (top 3 only, brief).
  const spoken = places.slice(0, 3).map((p) => ({
    name: p.name,
    rating: p.rating,
    distanceMeters: p.distanceMeters,
    openNow: p.openNow,
  }));

  return {
    result: {
      count: places.length,
      category,
      display: {
        rendered: true,
        layout: 'cards',
        spokenStyle: 'brief',
        instruction:
          'Cards are already shown on screen. In 1-2 short sentences, mention only the top 1-2 options by name and one key detail, then invite the user to tap a card.',
      },
      topResults: spoken,
    },
    card: {
      type: 'places',
      title:
        category === 'restaurant'
          ? 'Places to eat nearby'
          : `Nearby ${category}`,
      places,
    },
  };
};

const openPlaceOnMap: ToolHandler = async (args) => {
  const name = String(args.name || '').trim();
  const lat = typeof args.lat === 'number' ? args.lat : undefined;
  const lng = typeof args.lng === 'number' ? args.lng : undefined;

  const query =
    lat != null && lng != null
      ? `${lat},${lng}`
      : encodeURIComponent(name || 'destination');
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

  try {
    await Linking.openURL(url);
    return { result: { opened: true, name } };
  } catch {
    return { result: { opened: false, message: 'Could not open the map.' } };
  }
};

// ─── Registry ────────────────────────────────────────────────

export const LIVE_TOOL_HANDLERS: Record<string, ToolHandler> = {
  find_nearby_places: findNearbyPlaces,
  open_place_on_map: openPlaceOnMap,
};
