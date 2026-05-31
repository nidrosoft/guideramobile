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
import type { LivePlaceCard, LiveToolCard, LiveLandmarkCard } from '../types/aiVision.types';

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
  {
    name: 'show_landmark_card',
    description:
      "Display a rich visual card for a landmark, monument, building, statue, bridge, temple, or notable natural site — ESPECIALLY when you recognize one in the camera or are describing it (e.g. Christ the Redeemer, the Eiffel Tower, a famous temple). The app fetches a real photo and facts and renders the card automatically, so keep your spoken reply to a short, engaging highlight and let the card show the details.",
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The well-known name of the landmark/place, as specific as possible (e.g. "Christ the Redeemer", "Sagrada Familia").' },
        latitude: { type: 'NUMBER', description: 'Latitude if known.' },
        longitude: { type: 'NUMBER', description: 'Longitude if known.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'show_map',
    description:
      'Display an interactive mini-map centered on a location when you mention a place, give directions, or describe where something is. Use it to make locations visual as you speak.',
    parameters: {
      type: 'OBJECT',
      properties: {
        latitude: { type: 'NUMBER', description: 'Latitude of the location to center the map on.' },
        longitude: { type: 'NUMBER', description: 'Longitude of the location.' },
        label: { type: 'STRING', description: 'Short label for the location (e.g. the place name).' },
        zoom: { type: 'NUMBER', description: 'Optional zoom 1-18 (default 14). ~16 for a single building, ~12 for a neighborhood.' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'show_info_card',
    description:
      'Display a visual card with a title and 2-6 short bullet points to summarize tips, steps, options, or key facts (e.g. "Tips for visiting", "What to try", "Getting there"). Use it to make spoken information scannable. Keep your voice reply brief since the card shows the details.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Short card title.' },
        points: { type: 'ARRAY', items: { type: 'STRING' }, description: '2-6 concise bullet points.' },
      },
      required: ['title', 'points'],
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

// Free Wikipedia REST summary — returns text + image + coordinates in one call.
interface WikiSummary {
  extract?: string;
  thumbnail?: string;
  lat?: number;
  lng?: number;
  url?: string;
}

async function fetchWikiSummary(name: string): Promise<WikiSummary | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}?redirect=true`,
      { headers: { accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const j: any = await res.json();
    if (j.type === 'disambiguation') return null;
    return {
      extract: typeof j.extract === 'string' ? j.extract : undefined,
      thumbnail: j.thumbnail?.source,
      lat: j.coordinates?.lat,
      lng: j.coordinates?.lon,
      url: j.content_urls?.mobile?.page || j.content_urls?.desktop?.page,
    };
  } catch {
    return null;
  }
}

const showLandmarkCard: ToolHandler = async (args) => {
  const name = String(args.name || '').trim();
  if (!name) return { result: { error: 'no_name' } };
  const lat = typeof args.latitude === 'number' ? args.latitude : undefined;
  const lng = typeof args.longitude === 'number' ? args.longitude : undefined;

  const wiki = await fetchWikiSummary(name);
  const landmark: LiveLandmarkCard = {
    name,
    summary: wiki?.extract,
    imageUrl: wiki?.thumbnail,
    lat: lat ?? wiki?.lat,
    lng: lng ?? wiki?.lng,
    url: wiki?.url,
  };

  return {
    result: {
      found: !!wiki?.extract,
      name,
      display: {
        rendered: true,
        instruction:
          'A landmark card with a photo and summary is already on screen. Share one or two fascinating highlights in a warm sentence — do NOT read the whole summary.',
      },
    },
    card: { type: 'landmark', landmark },
  };
};

const showMap: ToolHandler = async (args) => {
  const lat = typeof args.latitude === 'number' ? args.latitude : undefined;
  const lng = typeof args.longitude === 'number' ? args.longitude : undefined;
  if (lat == null || lng == null) {
    return { result: { error: 'no_coords', message: 'Latitude and longitude are required to show a map.' } };
  }
  const label = typeof args.label === 'string' ? args.label : undefined;
  const zoom = typeof args.zoom === 'number' ? args.zoom : undefined;
  return {
    result: {
      display: { rendered: true, instruction: 'An interactive map is already shown. Briefly say what it points to.' },
    },
    card: { type: 'map', map: { lat, lng, label, zoom } },
  };
};

const showInfoCard: ToolHandler = async (args) => {
  const title = String(args.title || '').trim();
  const points = Array.isArray(args.points)
    ? args.points.map((p: any) => String(p)).filter((p: string) => p.trim()).slice(0, 6)
    : [];
  if (!title || points.length === 0) return { result: { error: 'invalid_info' } };
  return {
    result: {
      display: { rendered: true, instruction: 'An info card with these points is already shown. Keep your spoken reply to a one-line summary.' },
    },
    card: { type: 'info', info: { title, points } },
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
  show_landmark_card: showLandmarkCard,
  show_map: showMap,
  show_info_card: showInfoCard,
};
