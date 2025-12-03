/**
 * SITUM SERVICE
 * 
 * Service for Situm indoor positioning and navigation.
 * Handles location updates, route calculation, and POI management.
 */

import Situm from '@situm/react-native';

export interface SitumLocation {
  latitude: number;
  longitude: number;
  floorIdentifier: string;
  accuracy: number;
  bearing: number;
  buildingIdentifier: string;
}

export interface SitumPOI {
  identifier: string;
  name: string;
  category: string;
  position: {
    latitude: number;
    longitude: number;
    floorIdentifier: string;
  };
  buildingIdentifier: string;
}

export interface SitumRoute {
  points: Array<{
    latitude: number;
    longitude: number;
    floorIdentifier: string;
  }>;
  distance: number;
  time: number;
  segments: Array<{
    instruction: string;
    distance: number;
    direction: string;
  }>;
}

class SitumService {
  private isInitialized = false;
  private currentBuilding: string | null = null;
  private locationCallback: ((location: SitumLocation) => void) | null = null;

  /**
   * Initialize Situm SDK
   */
  async initialize(apiKey: string): Promise<void> {
    try {
      await Situm.init();
      await Situm.setApiKey(apiKey);
      this.isInitialized = true;
      console.log('✅ Situm initialized successfully');
    } catch (error) {
      console.error('❌ Situm initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set current building for positioning
   */
  setBuilding(buildingIdentifier: string): void {
    this.currentBuilding = buildingIdentifier;
  }

  /**
   * Start location updates
   */
  async startPositioning(
    buildingIdentifier: string,
    onLocationUpdate: (location: SitumLocation) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Situm not initialized. Call initialize() first.');
    }

    this.currentBuilding = buildingIdentifier;
    this.locationCallback = onLocationUpdate;

    try {
      await Situm.requestLocationUpdates(
        {
          buildingIdentifier,
          useWifi: true,
          useBle: true,
          useGps: true,
          interval: 1000, // Update every second
        },
        (location: any) => {
          const situmLocation: SitumLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            floorIdentifier: location.floorIdentifier,
            accuracy: location.accuracy,
            bearing: location.bearing,
            buildingIdentifier: location.buildingIdentifier,
          };
          
          onLocationUpdate(situmLocation);
        },
        (error: any) => {
          console.error('❌ Location update error:', error);
        }
      );
      
      console.log('✅ Location updates started');
    } catch (error) {
      console.error('❌ Failed to start positioning:', error);
      throw error;
    }
  }

  /**
   * Stop location updates
   */
  async stopPositioning(): Promise<void> {
    try {
      await Situm.removeUpdates();
      this.locationCallback = null;
      console.log('✅ Location updates stopped');
    } catch (error) {
      console.error('❌ Failed to stop positioning:', error);
    }
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(buildingIdentifier: string): Promise<SitumLocation> {
    return new Promise((resolve, reject) => {
      Situm.requestLocationUpdates(
        {
          buildingIdentifier,
          useWifi: true,
          useBle: true,
          useGps: true,
        },
        (location: any) => {
          // Get first location and stop
          Situm.removeUpdates();
          
          resolve({
            latitude: location.latitude,
            longitude: location.longitude,
            floorIdentifier: location.floorIdentifier,
            accuracy: location.accuracy,
            bearing: location.bearing,
            buildingIdentifier: location.buildingIdentifier,
          });
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Calculate route between two points
   */
  async calculateRoute(
    from: { latitude: number; longitude: number; floorIdentifier: string },
    to: { latitude: number; longitude: number; floorIdentifier: string },
    accessible: boolean = false
  ): Promise<SitumRoute> {
    if (!this.isInitialized) {
      throw new Error('Situm not initialized. Call initialize() first.');
    }

    try {
      const route = await Situm.requestDirections({
        from,
        to,
        accessible,
      });

      return {
        points: route.points.map((point: any) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          floorIdentifier: point.floorIdentifier,
        })),
        distance: route.distance,
        time: route.time,
        segments: route.segments.map((segment: any) => ({
          instruction: segment.instruction,
          distance: segment.distance,
          direction: segment.direction,
        })),
      };
    } catch (error) {
      console.error('❌ Route calculation failed:', error);
      throw error;
    }
  }

  /**
   * Get all POIs in a building
   */
  async getPOIs(buildingIdentifier: string): Promise<SitumPOI[]> {
    if (!this.isInitialized) {
      throw new Error('Situm not initialized. Call initialize() first.');
    }

    try {
      const pois = await Situm.fetchPOIs({ buildingIdentifier });
      
      return pois.map((poi: any) => ({
        identifier: poi.identifier,
        name: poi.name,
        category: poi.category,
        position: {
          latitude: poi.position.latitude,
          longitude: poi.position.longitude,
          floorIdentifier: poi.position.floorIdentifier,
        },
        buildingIdentifier: poi.buildingIdentifier,
      }));
    } catch (error) {
      console.error('❌ Failed to fetch POIs:', error);
      throw error;
    }
  }

  /**
   * Find POI by name or identifier
   */
  async findPOI(
    buildingIdentifier: string,
    searchTerm: string
  ): Promise<SitumPOI | null> {
    const pois = await this.getPOIs(buildingIdentifier);
    
    return (
      pois.find(
        (poi) =>
          poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          poi.identifier === searchTerm
      ) || null
    );
  }

  /**
   * Get POIs by category
   */
  async getPOIsByCategory(
    buildingIdentifier: string,
    category: string
  ): Promise<SitumPOI[]> {
    const pois = await this.getPOIs(buildingIdentifier);
    return pois.filter((poi) => poi.category === category);
  }

  /**
   * Check if user is off route
   */
  isOffRoute(
    currentLocation: SitumLocation,
    route: SitumRoute,
    threshold: number = 5 // meters
  ): boolean {
    // Find closest point on route
    let minDistance = Infinity;
    
    for (const point of route.points) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        point.latitude,
        point.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    return minDistance > threshold;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Export singleton instance
export const situmService = new SitumService();
export default situmService;
