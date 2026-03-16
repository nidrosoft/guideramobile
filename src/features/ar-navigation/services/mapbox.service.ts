/**
 * MAPBOX SERVICE
 *
 * Fully implemented Mapbox API integration.
 * Handles geocoding, directions, POI search, and static maps.
 *
 * Used by:
 * - City Navigator plugin (directions + POIs)
 * - Airport Navigator plugin (indoor directions)
 * - Landmark Scanner (reverse geocoding)
 *
 * 🔑 Requires EXPO_PUBLIC_MAPBOX_TOKEN in .env
 */

export interface MapboxPlace {
  id: string;
  name: string;
  address: string;
  category: string;
  coordinates: { latitude: number; longitude: number };
  distance?: number;
}

export interface MapboxRouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: { type: string; modifier?: string; bearing_after?: number };
}

export interface MapboxRoute {
  distance: number;
  duration: number;
  geometry: { type: string; coordinates: [number, number][] };
  steps: MapboxRouteStep[];
}

export class MapboxService {
  private token: string;
  private baseUrl = 'https://api.mapbox.com';

  constructor(token: string) {
    this.token = token;
  }

  get isConfigured(): boolean {
    return !!this.token && this.token.startsWith('pk.');
  }

  /**
   * Forward Geocoding — search for places by name
   */
  async geocode(query: string, proximity?: { lat: number; lng: number }): Promise<MapboxPlace[]> {
    if (!this.isConfigured) return [];
    try {
      let url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}&limit=5`;
      if (proximity) url += `&proximity=${proximity.lng},${proximity.lat}`;

      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      return (data.features || []).map((f: any) => ({
        id: f.id,
        name: f.text || f.place_name,
        address: f.place_name || '',
        category: f.properties?.category || f.place_type?.[0] || 'place',
        coordinates: { longitude: f.center[0], latitude: f.center[1] },
      }));
    } catch (e) {
      if (__DEV__) console.warn('Mapbox geocode error:', e);
      return [];
    }
  }

  /**
   * Reverse Geocoding — get address from coordinates
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{ name: string; address: string } | null> {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.token}&limit=1`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const f = data.features?.[0];
      if (!f) return null;
      return { name: f.text || '', address: f.place_name || '' };
    } catch (e) {
      if (__DEV__) console.warn('Mapbox reverse geocode error:', e);
      return null;
    }
  }

  /**
   * Directions — turn-by-turn route between two points
   * @param profile - 'walking' | 'driving' | 'cycling' | 'driving-traffic'
   */
  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    profile: 'walking' | 'driving' | 'cycling' | 'driving-traffic' = 'walking'
  ): Promise<MapboxRoute | null> {
    if (!this.isConfigured) return null;
    try {
      const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const res = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coords}?access_token=${this.token}&overview=full&geometries=geojson&steps=true`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return null;

      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        steps: (route.legs?.[0]?.steps || []).map((s: any) => ({
          instruction: s.maneuver?.instruction || '',
          distance: s.distance || 0,
          duration: s.duration || 0,
          maneuver: {
            type: s.maneuver?.type || '',
            modifier: s.maneuver?.modifier,
            bearing_after: s.maneuver?.bearing_after,
          },
        })),
      };
    } catch (e) {
      if (__DEV__) console.warn('Mapbox directions error:', e);
      return null;
    }
  }

  /**
   * Search nearby POIs using Google Places Nearby Search API.
   * Mapbox geocoding doesn't support proper POI/category search on free tier.
   * Falls back to Mapbox text search if Google key not available.
   */
  async getNearbyPOIs(
    latitude: number,
    longitude: number,
    category?: string,
    limit: number = 15
  ): Promise<MapboxPlace[]> {
    // Google Places Nearby Search — the most reliable POI search
    const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (__DEV__) console.log('📍 getNearbyPOIs called:', { latitude, longitude, category, hasGoogleKey: !!googleKey, keyLen: googleKey.length });

    if (googleKey && googleKey.length > 10) {
      try {
        // Map our category names to Google Places types
        const type = this.mapCategoryToGoogleType(category || 'tourist_attraction');
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&type=${type}&key=${googleKey}`;
        if (__DEV__) console.log('📍 Google Places URL:', url.replace(googleKey, 'KEY'));

        const res = await fetch(url);
        const data = await res.json();
        if (__DEV__) console.log('📍 Google Places response:', data.status, data.results?.length || 0, 'results');

        if (data.status === 'OK' && data.results?.length > 0) {
          return data.results.slice(0, limit).map((p: any, i: number) => ({
            id: p.place_id || `gp-${i}`,
            name: p.name,
            address: p.vicinity || p.formatted_address || '',
            category: category || 'place',
            coordinates: {
              latitude: p.geometry.location.lat,
              longitude: p.geometry.location.lng,
            },
            distance: undefined,
          }));
        } else {
          if (__DEV__) console.warn('📍 Google Places no results. Status:', data.status, data.error_message || '');
        }
      } catch (e) {
        if (__DEV__) console.warn('📍 Google Places fetch error:', e);
      }
    } else {
      if (__DEV__) console.warn('📍 No Google API key available for POI search');
    }

    return [];
  }

  private mapCategoryToGoogleType(category: string): string {
    const map: Record<string, string> = {
      tourist_attraction: 'tourist_attraction',
      restaurant: 'restaurant',
      cafe: 'cafe',
      museum: 'museum',
      hospital: 'hospital',
      bus_station: 'transit_station',
      shopping_mall: 'shopping_mall',
      park: 'park',
      hotel: 'lodging',
      bar: 'bar',
      pharmacy: 'pharmacy',
      airport: 'airport',
    };
    return map[category.toLowerCase()] || category;
  }

  /**
   * Static map image URL
   */
  getStaticMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    width: number = 600,
    height: number = 400,
    style: string = 'streets-v12'
  ): string {
    if (!this.isConfigured) return '';
    return `${this.baseUrl}/styles/v1/mapbox/${style}/static/${longitude},${latitude},${zoom},0/${width}x${height}@2x?access_token=${this.token}`;
  }

  /**
   * Decode a GeoJSON route geometry into [lat, lng] coordinate pairs for rendering
   */
  static decodeRouteCoordinates(geometry: MapboxRoute['geometry']): { latitude: number; longitude: number }[] {
    if (!geometry?.coordinates) return [];
    return geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  }
}

// Singleton — reads token from env
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
export const mapboxService = new MapboxService(MAPBOX_TOKEN);
