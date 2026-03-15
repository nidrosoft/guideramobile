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
      console.warn('Mapbox geocode error:', e);
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
      console.warn('Mapbox reverse geocode error:', e);
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
      console.warn('Mapbox directions error:', e);
      return null;
    }
  }

  /**
   * Search nearby POIs using geocoding with category filter
   */
  async getNearbyPOIs(
    latitude: number,
    longitude: number,
    category?: string,
    limit: number = 10
  ): Promise<MapboxPlace[]> {
    if (!this.isConfigured) return [];
    try {
      const query = category || 'restaurant,cafe,museum,park,hotel,bar';
      let url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}&proximity=${longitude},${latitude}&limit=${limit}&types=poi`;

      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      return (data.features || []).map((f: any) => ({
        id: f.id,
        name: f.text || f.place_name,
        address: f.place_name || '',
        category: f.properties?.category || 'place',
        coordinates: { longitude: f.center[0], latitude: f.center[1] },
        distance: f.properties?.distance,
      }));
    } catch (e) {
      console.warn('Mapbox POI search error:', e);
      return [];
    }
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
