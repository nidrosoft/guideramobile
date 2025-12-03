/**
 * AR NAVIGATION TYPES
 * 
 * Core type definitions for AR navigation system.
 */

import { ARPluginId, ARViewMode } from './ar-plugin.types';

export interface ARNavigationState {
  isActive: boolean;
  viewMode: ARViewMode;
  activePlugin: ARPluginId | null;
  cameraPermission: 'granted' | 'denied' | 'undetermined';
  locationPermission: 'granted' | 'denied' | 'undetermined';
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  accuracy?: number;
  timestamp: number;
}

export interface CameraFrame {
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface ARSearchResult {
  id: string;
  name: string;
  type: 'landmark' | 'restaurant' | 'airport' | 'poi';
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
}
