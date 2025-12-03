/**
 * GOOGLE MAPS SERVICE
 * 
 * Service for Google Maps Navigation SDK.
 * Handles navigation, directions, and indoor positioning.
 */

import { GOOGLE_MAPS_CONFIG } from '@/config/google-maps.config';

export interface GoogleMapsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  floor?: number;
}

export interface GoogleMapsRoute {
  distance: number; // meters
  duration: number; // seconds
  steps: GoogleMapsStep[];
  polyline: string;
}

export interface GoogleMapsStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  startLocation: GoogleMapsLocation;
  endLocation: GoogleMapsLocation;
}

export interface GoogleMapsPlace {
  placeId: string;
  name: string;
  address: string;
  location: GoogleMapsLocation;
  types: string[];
}

class GoogleMapsService {
  private apiKey: string;
  private isInitialized = false;

  constructor() {
    this.apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  }

  /**
   * Initialize Google Maps SDK
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    this.isInitialized = true;
    console.log('✅ Google Maps initialized');
  }

  /**
   * Get API key
   */
  getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    return this.apiKey;
  }

  /**
   * Search for places (gates, shops, etc.)
   */
  async searchPlaces(
    query: string,
    location: GoogleMapsLocation,
    radius: number = 1000
  ): Promise<GoogleMapsPlace[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location.latitude},${location.longitude}&` +
        `radius=${radius}&` +
        `keyword=${encodeURIComponent(query)}&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results.map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types,
      }));
    } catch (error) {
      console.error('❌ Search places failed:', error);
      return [];
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: GoogleMapsLocation,
    destination: GoogleMapsLocation,
    mode: 'walking' | 'driving' = 'walking'
  ): Promise<GoogleMapsRoute | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.latitude},${origin.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `mode=${mode}&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value,
          duration: step.duration.value,
          maneuver: step.maneuver || 'straight',
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
        })),
      };
    } catch (error) {
      console.error('❌ Get directions failed:', error);
      return null;
    }
  }

  /**
   * Find gate by code (e.g., "23D")
   */
  async findGate(
    airportCode: string,
    gateCode: string
  ): Promise<GoogleMapsPlace | null> {
    const airport = GOOGLE_MAPS_CONFIG.AIRPORTS[airportCode as keyof typeof GOOGLE_MAPS_CONFIG.AIRPORTS];
    
    if (!airport) {
      console.error('❌ Airport not found:', airportCode);
      return null;
    }

    // Search for gate at airport
    const places = await this.searchPlaces(
      `Gate ${gateCode}`,
      airport.coordinates,
      500
    );

    return places[0] || null;
  }

  /**
   * Get airport by code
   */
  getAirport(code: string) {
    return GOOGLE_MAPS_CONFIG.AIRPORTS[code as keyof typeof GOOGLE_MAPS_CONFIG.AIRPORTS] || null;
  }

  /**
   * Get all supported airports
   */
  getSupportedAirports() {
    return Object.values(GOOGLE_MAPS_CONFIG.AIRPORTS);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    point1: GoogleMapsLocation,
    point2: GoogleMapsLocation
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
export default googleMapsService;
