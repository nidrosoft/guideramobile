/**
 * CITY NAVIGATOR TYPES
 * 
 * Type definitions for the City Navigator plugin.
 */

export type ViewMode = 'camera' | 'map';

export type TransportMode = 'all' | 'car' | 'bike' | 'walk' | 'scooter';

export type POICategory = 
  | 'landmark'
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'museum'
  | 'park'
  | 'shopping'
  | 'transport'
  | 'attraction'
  | 'nightlife'
  | 'health'
  | 'service';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  coordinates: Coordinates;
  address: string;
  city: string;
  country: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  description?: string;
  openingHours?: string;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$
  distance?: number; // in meters
  duration?: number; // in minutes
  isOpen?: boolean;
  tags?: string[];
}

export interface Route {
  id: string;
  origin: Coordinates;
  destination: Coordinates;
  destinationName: string;
  distance: number; // in meters
  duration: number; // in minutes
  transportMode: TransportMode;
  polyline: Coordinates[];
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
}

export interface DangerZone {
  id: string;
  coordinates: Coordinates;
  radius: number; // in meters
  level: 'low' | 'medium' | 'high';
  type: 'crime' | 'scam' | 'unsafe_area' | 'traffic' | 'other';
  description?: string;
  reportCount: number;
  lastReported: Date;
}

export interface CityNavigatorState {
  viewMode: ViewMode;
  transportMode: TransportMode;
  userLocation: Coordinates | null;
  selectedPOI: POI | null;
  route: Route | null;
  isNavigating: boolean;
  isLoading: boolean;
  searchQuery: string;
  pois: POI[];
  dangerZones: DangerZone[];
}
